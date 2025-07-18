require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 8080;

// Your OpenAI Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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