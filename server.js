require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// IMPORTANT: Increase payload limits BEFORE other middleware
app.use(express.json({ 
  limit: '100mb',           // Increase from default 100kb to 100mb
  parameterLimit: 50000,    // Increase parameter limit
  extended: true 
}));

app.use(express.urlencoded({ 
  limit: '100mb', 
  parameterLimit: 50000,
  extended: true 
}));

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Add timeout handling for large requests
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes timeout
  res.setTimeout(300000);
  next();
});

// Optional: Log payload sizes for monitoring
app.use((req, res, next) => {
  if (req.path === '/ask') {
    console.log(`Request size: ${JSON.stringify(req.body).length} bytes`);
  }
  next();
});

// Your existing /ask route
app.post('/ask', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    console.log(`Received prompt with length: ${prompt.length} characters`);
    
    // Your existing AI model call logic here
    // Example:
    // const response = await callYourAIModel(prompt);
    
    res.json({ 
      response: "AI analysis would go here",
      promptLength: prompt.length,
      status: "success"
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: error.message,
      status: "error"
    });
  }
});

app.listen(8080, () => {
  console.log('Competitor Analysis Dashboard running at http://localhost:8080');
  console.log('Payload limit set to 100MB for large datasets');
});