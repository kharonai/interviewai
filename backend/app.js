// Load environment variables first
import dotenv from 'dotenv';

// Set up __dirname for ES modules
import { fileURLToPath } from 'url';
import path from 'path';

// Import required modules using ES module syntax
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

// Import OpenAI using the new default import syntax
import OpenAI from 'openai';

// Import additional modules
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

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
// Helper function to determine if the response is valid, based on questionCount.
function isValidResponse(message, questionCount) {
  const lower = message.toLowerCase();
  
  // Define required and disallowed substrings based on the question number.
  let requiredSubstrings = [];
  let disallowedSubstrings = [];
  
  // For question 1 (questionCount === 0), be extra strict.
  if (questionCount === 0) {
    requiredSubstrings.push("Hello");
    disallowedSubstrings.push("You're Name", "Candidate:");
  } 
  // For question 2, maybe disallow references to previous questions.
  else if (questionCount === 1) {
    requiredSubstrings.push("PROMPT:", "RESPONSE:");
    // disallowedSubstrings.push("i'm sorry", "error", "previous question");
  } 
  // For subsequent questions, allow a bit more flexibility.
  else {
    disallowedSubstrings.push("You're Name", "Candidate:");
  }
  
  // Check that every required substring is present.
  for (const req of requiredSubstrings) {
    if (!lower.includes(req.toLowerCase())) {
      return false;
    }
  }
  
  // Check that none of the disallowed substrings are present.
  for (const dis of disallowedSubstrings) {
    if (lower.includes(dis.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}


app.post('/api/interview', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    // Use let for variables that might be reassigned
    let { conversation, questionCount } = req.body;
    if (!conversation || !Array.isArray(conversation)) {
      console.error('Invalid conversation format:', conversation);
      return res.status(400).json({ error: 'Invalid conversation format. It must be an array of messages.' });
    }

    console.log('Conversation received:', conversation);

    const maxAttempts = 3;
    let attempts = 0;
    let aiResponse = "";
    let completion;

    // Retry up to maxAttempts times to get a valid response.
    while (attempts < maxAttempts) {
      completion = await openai.chat.completions.create({
        model: 'gpt-4', // or 'gpt-4' if available
        messages: conversation,
        temperature: 0.7,
      });
      
      if (!completion || !completion.choices || !completion.choices[0]) {
        return res.status(500).json({ error: 'Invalid completion response from OpenAI.' });
      }
      
      aiResponse = completion.choices[0].message.content.trim();
      console.log(`Attempt ${attempts + 1} response: ${aiResponse}`);

      if (isValidResponse(aiResponse, questionCount)) {
        break;
      }
      
      attempts++;
      console.warn(`Response did not pass validation for question ${questionCount + 1}. Retrying...`);
    }

    if (!isValidResponse(aiResponse, questionCount)) {
      console.warn('Returning the final response even though it may be invalid after max attempts.');
    }

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

// Define commands for supported languages
const languageCommands = {
  javascript: {
    extension: 'js',
    run: (filePath) => `node "${filePath}"`,
  },
  python: {
    extension: 'py',
    run: (filePath) => `python3 "${filePath}"`,
  },
  c: {
    extension: 'c',
    compile: (filePath) => `gcc "${filePath}" -o "${filePath}.out"`,
    run: (filePath) => `"${filePath}.out"`,
  },
  cpp: {
    extension: 'cpp',
    compile: (filePath) => `g++ "${filePath}" -o "${filePath}.out"`,
    run: (filePath) => `"${filePath}.out"`,
  },
  // Add more languages as needed...
};

// Helper function to run shell commands as a Promise
const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        return reject({ error: error.message, stderr });
      }
      resolve({ stdout, stderr });
    });
  });

// Helper function to clean up temporary files
function cleanupTempFiles(filePath) {
  try {
    fs.unlinkSync(filePath);
    if (fs.existsSync(`${filePath}.out`)) {
      fs.unlinkSync(`${filePath}.out`);
    }
  } catch (cleanupErr) {
    console.warn('Cleanup error:', cleanupErr);
  }
}

// --------------------------
// Code Compilation Endpoint
// --------------------------
/**
 * POST /api/compile
 * Expects JSON body with:
 * {
 *    "code": "print('Hello, world!')",
 *    "language": "python"
 * }
 */
app.post('/api/compile', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Please provide both code and language.' });
    }
    if (!languageCommands[language]) {
      return res.status(400).json({ error: 'Unsupported language.' });
    }
    const langConfig = languageCommands[language];
    
    // Create a temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Generate a unique filename for the code file
    const fileId = uuidv4();
    const filePath = path.join(tempDir, `${fileId}.${langConfig.extension}`);
    
    // Write the code to the temporary file
    fs.writeFileSync(filePath, code);
    
    let compileOutput = null;
    // If the language requires compilation (e.g., C/C++), compile it first
    if (langConfig.compile) {
      const compileCmd = langConfig.compile(filePath);
      compileOutput = await runCommand(compileCmd);
    }
    
    // Run the code (or binary) and capture output
    const runCmd = langConfig.run(filePath);
    const runOutput = await runCommand(runCmd);
    
    // Clean up temporary files
    cleanupTempFiles(filePath);
    
    // Return both compile and run outputs (if applicable)
    res.json({
      compile: compileOutput, // May be null for interpreted languages
      run: runOutput,
    });
  } catch (err) {
    console.error('Compilation error:', err);
    res.status(500).json({ error: err });
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
