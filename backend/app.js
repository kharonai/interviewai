// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Set up __dirname for ES modules
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import required modules using ES module syntax
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

// Import OpenAI using the new default import syntax
import OpenAI from 'openai';

// Create an OpenAI instance with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configure multer for handling file uploads (for resume uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Path to the JSON file where user data will be stored
const usersFilePath = path.join(__dirname, 'users.json');

// Helper function to load users from the JSON file
function loadUsers() {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error("Error parsing users.json:", err);
      return [];
    }
  }
  return [];
}

// Helper function to save users to the JSON file
function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// -----------------
// Sign Up Endpoint
// -----------------
app.post('/api/signup', upload.single('resume'), (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }
  
  const users = loadUsers();
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }
  
  let resumePath = null;
  if (req.file) {
    resumePath = path.join('uploads', req.file.filename);
  }
  
  const newUser = {
    id: Date.now(),
    name,
    email,
    password, // In production, NEVER store plain-text passwords!
    resume: resumePath
  };
  
  users.push(newUser);
  saveUsers(users);
  
  res.json({ message: 'Signup successful!', user: newUser });
});

// -----------------
// Login Endpoint
// -----------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }
  
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  
  res.json({ message: 'Login successful!', user });
});

// --------------------------
// AI Interview Integration
// --------------------------
/**
 * POST /api/interview
 * Expects JSON body with:
 * {
 *    "conversation": [
 *       { "role": "system", "content": "You are a professional interviewer." },
 *       { "role": "user", "content": "I would like to practice for a software engineer interview." },
 *       { "role": "assistant", "content": "Sure, let’s begin. Tell me about yourself." },
 *       { "role": "user", "content": "My answer..." }
 *    ]
 * }
 */
app.post('/api/interview', async (req, res) => {
  try {
    const conversation = req.body.conversation;
    if (!conversation || !Array.isArray(conversation)) {
      console.error('Invalid conversation format:', conversation);
      return res.status(400).json({ error: 'Invalid conversation format. It must be an array of messages.' });
    }

    console.log('Conversation received:', conversation);

    // Call OpenAI's ChatCompletion API using the conversation as context.
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or 'gpt-4' if available
      messages: conversation,
      temperature: 0.7,
    });

    console.log('Completion response:', completion);
    if (!completion || !completion.choices) {
      return res.status(500).json({ error: 'Invalid completion response from OpenAI.' });
    }
    const aiResponse = completion.choices[0].message.content;
    res.json({ message: aiResponse });
  } catch (error) {
    console.error('Error in /api/interview:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while processing the AI interview.' });
  }
});

const feedbackStorage = new Map();
app.post('/api/interview-feedback', async (req, res) => {
  try {
    const { transcript, userId, force } = req.body; // Expect userId in request
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Invalid transcript format.' });
    }

    // Use user ID as the storage key (or default if missing)
    const cacheKey = userId || "guest_user";

    // Prevent unnecessary recalculations if already generated
    if (!force && feedbackStorage[cacheKey]) {
      return res.json(feedbackStorage[cacheKey]); // Return cached feedback
    }

    // Updated AI prompt with stricter format
    const feedbackPrompt = `
      You are an AI-powered interview evaluator. Your task is to analyze the following interview transcript and provide structured feedback. 

      **Instructions:**
      - **Performance Score:** Rate the candidate's performance on a scale of 0 to 100%.
      - **Key Strengths (exactly 3, short and concise, max 6 words each)**
      - **Areas for Improvement (exactly 3, short and concise, max 6 words each)**
      - **Actionable Suggestions (exactly 3, short and concise, max 10 words each)**

      **Return the response strictly in this format with no extra text:**
      PERFORMANCE SCORE: (numeric value 0-100)
      STRENGTHS:
      - (Strength 1)
      - (Strength 2)
      - (Strength 3)
      AREAS FOR IMPROVEMENT:
      - (Improvement 1)
      - (Improvement 2)
      - (Improvement 3)
      ACTIONABLE SUGGESTIONS:
      - (Suggestion 1)
      - (Suggestion 2)
      - (Suggestion 3)

      **Interview Transcript:**
      ${transcript.map(msg => `${msg.sender === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`).join('\n')}
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: feedbackPrompt }],
      temperature: 0.7
    });

    // Extract AI-generated text response
    const aiResponse = completion.choices[0]?.message?.content || "";

    // **New Regex to clean extraction**
    const getMatches = (section, limit) => {
      const match = aiResponse.match(new RegExp(`${section}:\\s*([\\s\\S]*?)(?:\\n[A-Z]|$)`, 'i'));
      if (!match || !match[1]) return [];
      return match[1]
        .trim()
        .split('\n- ') // Ensure we only extract bullet points
        .slice(1, limit + 1) // Skip the first empty element and limit to expected count
        .map(item => item.replace(/[^a-zA-Z0-9\s-]/g, '').trim()); // Clean up extra artifacts
    };

    // Ensure only clean, structured values
    const feedbackData = {
      score: aiResponse.match(/PERFORMANCE SCORE:\s*(\d{1,3})/)?.[1] || "N/A",
      strengths: getMatches("STRENGTHS", 3),
      weaknesses: getMatches("AREAS FOR IMPROVEMENT", 3),
      suggestions: getMatches("ACTIONABLE SUGGESTIONS", 3),
      transcript
    };

    // Store AI-generated feedback in memory (per session)
    feedbackStorage[cacheKey] = feedbackData;

    res.json(feedbackData);

  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'An error occurred while generating interview feedback.' });
  }
});

// A simple test route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
