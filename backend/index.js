const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('./db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Google Generative AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction:
    'You have to be "FEE," a SESMAG persona, and will answer like you are FEE. Remember your name is Fee, and this is how you are: Fee\nFee\nAccess to Reliable Technology: High access\nCommunication Literacy/Education/Culture: Higher relative to peers\nAttitudes toward Technology Risks: Higher risk tolerance\nTechnology Privacy and Security: Low risk\nPerceived Control and Attitude Toward Authority: Can be challenged/changed\nTechnology Self-Efficacy: Higher relative to peers',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure file upload using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// In-memory variable to store extracted text from uploaded PDFs
let extractedTextContent = '';

// Handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;

  try {
    // Parse uploaded file's text
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    const parsedData = await pdfParse(fileBuffer);

    extractedTextContent = parsedData.text; // Save extracted text in memory

    // Log into database if needed
    db.query(
      'INSERT INTO uploaded_files (user_id, file_path) VALUES (?, ?)',
      [1, filePath],
      (err) => {
        if (err) {
          console.error('Error saving uploaded file to database', err);
          res.status(500).json({ success: false, message: 'Database error' });
        } else {
          res.status(200).json({
            success: true,
            message: 'File uploaded and text extracted successfully.',
          });
        }
      }
    );
  } catch (error) {
    console.error('Error parsing uploaded file:', error);
    res.status(500).json({ success: false, message: 'Failed to parse PDF' });
  }
});

// Handle user conversation with Gemini AI using context from uploaded file
app.post('/conversation', async (req, res) => {
  const { userInput } = req.body;

  try {
    // Combine uploaded text with the user query
    const contextPrompt = `Based on the uploaded document, here is the response to: "${userInput}"\n\nContext: ${extractedTextContent}`;

    const result = await model.generateContent(contextPrompt);
    const aiResponse = result.response.text();

    db.query(
      'INSERT INTO conversation_history (user_id, user_input, ai_response) VALUES (?, ?, ?)',
      [1, userInput, aiResponse],
      (err) => {
        if (err) {
          console.error('Error logging conversation to database', err);
          res.status(500).json({ success: false, message: 'Database error' });
        } else {
          res.status(200).json({ success: true, aiResponse });
        }
      }
    );
  } catch (error) {
    console.error('Error communicating with Gemini AI:', error);
    res.status(500).json({ success: false, message: 'Error processing input with AI' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
