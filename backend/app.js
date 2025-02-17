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

// Import OpenAI using the new default export syntax
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
// AI Interview Integration Endpoint
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
  
      console.log('Completion response:', completion.data);
      
      const aiResponse = completion.data.choices[0].message.content;
      res.json({ message: aiResponse });
    } catch (error) {
      // Log detailed error info for debugging
      console.error('Error in /api/interview:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'An error occurred while processing the AI interview.' });
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
