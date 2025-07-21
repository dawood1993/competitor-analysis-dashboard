require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 8080;

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   baseURL: "https://openrouter.ai/api/v1"
// });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Function to estimate tokens (rough approximation)
function estimateTokens(text) {
  return Math.ceil(text.length / 3.5); // 1 token ≈ 3.5 characters average
}

// Function to compress CSV data while maintaining analytical value
function compressCSVForAnalysis(csvData, maxTokens = 800000) {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0];
  const dataRows = lines.slice(1);
  
  // If already within limits, return as-is
  if (estimateTokens(csvData) <= maxTokens) {
    return csvData;
  }
  
  // Calculate how many rows we can include
  const headerTokens = estimateTokens(headers);
  const avgRowTokens = estimateTokens(dataRows[0] || '');
  const maxRows = Math.floor((maxTokens - headerTokens - 1000) / avgRowTokens); // Reserve 1000 tokens for prompt
  
  if (maxRows < dataRows.length) {
    // Strategic sampling: ensure we get representative data from each entity/group
    const sampledRows = [];
    const entities = new Set();
    
    // First pass: collect unique entities
    dataRows.forEach(row => {
      const entity = row.split(',')[0]; // Assuming Entity is first column
      entities.add(entity);
    });
    
    // Second pass: sample evenly from each entity
    const rowsPerEntity = Math.floor(maxRows / entities.size);
    entities.forEach(entity => {
      const entityRows = dataRows.filter(row => row.split(',')[0] === entity);
      
      // Take samples across price ranges for this entity
      entityRows.sort((a, b) => {
        const priceA = parseFloat(a.split(',').pop()); // Assuming price is last column
        const priceB = parseFloat(b.split(',').pop());
        return priceA - priceB;
      });
      
      const step = Math.max(1, Math.floor(entityRows.length / rowsPerEntity));
      for (let i = 0; i < entityRows.length && sampledRows.length < maxRows; i += step) {
        sampledRows.push(entityRows[i]);
      }
    });
    
    return headers + '\n' + sampledRows.join('\n');
  }
  
  return csvData;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt || prompt.length < 5) {
    return res.status(400).json({ error: "Prompt is too short or missing." });
  }

  try {
    // Step 1: Create a new thread
    const thread = await openai.beta.threads.create();

    // Step 2: Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    });

    // Step 3: Run the Assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_KLHl62ZZwkJVqM1xsHEi70SG"
    });

    // Step 4: Poll until the run is completed
    let runStatus = run;
    while (["queued", "in_progress"].includes(runStatus.status)) {
      await new Promise(r => setTimeout(r, 2000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status !== "completed") {
      return res.status(500).json({ error: `Run failed with status: ${runStatus.status}` });
    }

    // Step 5: Retrieve assistant response messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const responseMessage = messages.data
      .filter(m => m.role === "assistant")
      .map(m => m.content[0]?.text?.value)
      .join('\n\n');

    res.json({ response: responseMessage });

  } catch (err) {
    console.error("OpenAI Assistant Error:", err);
    res.status(500).json({
      error: err?.response?.data?.error?.message || err.message || "Unexpected error occurred."
    });
  }
});

app.listen(port, () => {
  console.log(`Competitor Analysis Dashboard running at http://localhost:${port}`);
  console.log('✅ Smart token management enabled');
  console.log('✅ CSV format optimization active');
});