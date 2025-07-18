const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 8080;

// Your OpenAI Key
const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://openrouter.ai/api/v1"
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// GPT endpoint for competitor analysis
app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt || prompt.length < 5) {
    return res.status(400).json({ error: "Prompt is too short or missing." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const answer = completion.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(500).json({ error: "GPT returned no answer." });
    }

    res.json({ response: answer });

  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.message || err);
    res.status(err?.statusCode || 500).json({
      error: err?.response?.data?.error?.message || "Unexpected error occurred."
    });
  }
});

app.listen(port, () => {
  console.log(`Competitor Analysis Dashboard running at http://localhost:${port}`);
});