import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getProfessorsFromFirestore, searchProfessorsInFirestore, getStudentsFromFirestore, searchStudentsInFirestore } from './firestore-integration.js';
import * as cheerio from 'cheerio';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyProfessor } from './professor-verification.js';

// Load environment variables
dotenv.config({ path: './production.env' });

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration - Allow all localhost ports
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost ports
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow specific origins from environment
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3001', 
      'http://localhost:3004',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL // Add production frontend URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Custom CORS middleware for explicit headers - allows all localhost ports including 3000 (Vite default)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all localhost ports (including 3000, 3001, 3004, 5173, etc.)
  if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin && (
    origin.includes('localhost:3004') || 
    origin.includes('localhost:3001') || 
    origin.includes('localhost:3000') ||
    origin.includes('localhost:5173') ||
    origin.includes('localhost:4173')
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Professor data will be loaded from Firestore

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Gemini-powered smart matching (without ChromaDB)
async function generateGeminiMatches(query) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Create a comprehensive prompt with all professor data
    const professorsInfo = professorsData.map(prof => `
      Professor: ${prof.name}
      Title: ${prof.title}
      University: ${prof.university}
      Research Area: ${prof.researchArea}
      Bio: ${prof.bio}
      Keywords: ${prof.keywords.join(', ')}
    `).join('\n\n');
    
    const prompt = `
      You are an AI assistant helping match academic researchers. 
      
      Student Query: "${query}"
      
      Available Professors:
      ${professorsInfo}
      
      Analyze the student's research interests and find the top 3 most relevant professors. For each match, provide:
      1. A detailed justification (2-3 sentences) explaining why this professor would be a good match
      2. A similarity score between 0.0 and 1.0 based on research alignment
      3. Focus on specific research areas, expertise, and potential collaboration opportunities
      
      Return your response as a JSON array with this exact format:
      [
        {
          "id": "professor_id",
          "name": "Professor Name",
          "title": "Professor Title",
          "university": "University Name",
          "researchArea": "Research Area",
          "justification": "Detailed explanation here",
          "similarityScore": 0.85
        }
      ]
      
      Only return the JSON array, no other text.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to extract JSON from markdown if present
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse JSON response
    const matches = JSON.parse(jsonText);
    
    // Ensure we have the required fields
    return matches.map(match => ({
      id: match.id || `prof_${Math.random().toString(36).substr(2, 9)}`,
      name: match.name,
      title: match.title,
      university: match.university,
      researchArea: match.researchArea,
      justification: match.justification,
      similarityScore: parseFloat(match.similarityScore) || 0.7
    }));
    
  } catch (error) {
    console.error('Error in Gemini response generation:', error);
    
    // Fallback to simple matching if Gemini fails
    const fallbackMatches = professorsData.slice(0, 3).map(prof => ({
      id: prof.id,
      name: prof.name,
      title: prof.title,
      university: prof.university,
      researchArea: prof.researchArea,
      justification: `Dr. ${prof.name.split(' ')[1]} is a strong match based on their expertise in ${prof.researchArea}. Their research at ${prof.university} demonstrates deep knowledge in areas that align with your academic interests.`,
      similarityScore: 0.7
    }));
    
    return fallbackMatches;
  }
}

// Generate Gemini matches using Firestore data
async function generateGeminiMatchesWithFirestore(query, professors) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Create context from Firestore professors
    const professorContext = professors.map(prof => ({
      name: prof.name,
      title: prof.title,
      university: prof.university,
      researchArea: prof.researchArea,
      bio: prof.bio,
      keywords: prof.keywords
    }));
    
    const prompt = `You are an AI academic matchmaker. Based on the student's research interest query, find the most relevant professors from the database.

Student Query: "${query}"

Available Professors:
${JSON.stringify(professorContext, null, 2)}

Return exactly 3 best matches as a JSON array with this structure:
[
  {
    "id": "professor_id",
    "name": "Professor Name",
    "title": "Professor Title",
    "university": "University Name",
    "researchArea": "Research Area",
    "justification": "Why this professor is a good match for the student's interests",
    "similarityScore": 0.95
  }
]

Focus on research area alignment, university reputation, and potential collaboration opportunities.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response (remove markdown formatting if present)
    let cleanText = text;
    if (cleanText.includes('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }
    
    const matches = JSON.parse(cleanText);
    return matches;
    
  } catch (error) {
    console.error('Error in Gemini response generation:', error);
    
    // Fallback to simple keyword matching
    const queryLower = query.toLowerCase();
    const fallbackMatches = professors
      .filter(prof => {
        const searchText = [
          prof.name,
          prof.researchArea,
          prof.university,
          prof.title,
          prof.bio,
          ...(prof.keywords || [])
        ].join(' ').toLowerCase();
        return searchText.includes(queryLower);
      })
      .slice(0, 3)
      .map(prof => ({
        id: prof.id,
        name: prof.name,
        title: prof.title,
        university: prof.university,
        researchArea: prof.researchArea,
        justification: `Matches your interest in ${query} based on research area and expertise.`,
        similarityScore: 0.8
      }));
    
    return fallbackMatches;
  }
}

// Production smart matching endpoint (with Firestore) - requires authentication
app.post('/smart-match', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Query must be at least 3 characters long' 
      });
    }
    
    console.log(`🔍 Processing production smart match query: "${query}"`);
    
    // Get professors from Firestore
    const professors = await getProfessorsFromFirestore();
    
    if (professors.length === 0) {
      console.log('⚠️ No professors found in Firestore');
      return res.json([]);
    }
    
    // Generate smart matches using Gemini with Firestore data
    const matches = await generateGeminiMatchesWithFirestore(query, professors);
    
    console.log(`✅ Generated ${matches.length} smart matches with Gemini and Firestore`);
    
    res.json(matches);
    
  } catch (error) {
    console.error('❌ Error in production smart matching:', error);
    res.status(500).json({ 
      error: 'Internal server error during smart matching',
      details: error.message 
    });
  }
});

// Public smart matching endpoint (no authentication required) - for frontend direct access
app.post('/smart-match-public', async (req, res) => {
  try {
    const { query, userType } = req.body;
    
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Query must be at least 3 characters long' 
      });
    }
    
    console.log(`🔍 Processing public smart match query: "${query}" for userType: ${userType || 'unknown'}`);
    
    // Get data from Firestore based on user type
    let matches = [];
    
    if (userType === 'professor') {
      // Professors searching for students
      const students = await searchStudentsInFirestore(query);
      matches = students.slice(0, 5).map(student => ({
        id: student.id || student.userId || `student_${Math.random().toString(36).substr(2, 9)}`,
        userId: student.userId || student.id,
        name: student.name || 'Unknown Student',
        title: student.degree || student.title || 'Student',
        university: student.university || 'Unknown University',
        researchArea: student.researchArea || 'General Research',
        bio: student.bio || '',
        keywords: student.keywords || [],
        justification: `Matches your search for ${query} based on research interests and academic profile.`,
        similarityScore: 0.85
      }));
    } else {
      // Students searching for professors (default)
      const professors = await getProfessorsFromFirestore();
      
      if (professors.length === 0) {
        console.log('⚠️ No professors found in Firestore');
        return res.json([]);
      }
      
      // Generate smart matches using Gemini with Firestore data
      matches = await generateGeminiMatchesWithFirestore(query, professors);
    }
    
    console.log(`✅ Generated ${matches.length} public smart matches`);
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    res.json(matches);
    
  } catch (error) {
    console.error('❌ Error in public smart matching:', error);
    
    // Set CORS headers even on error
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.status(500).json({ 
      error: 'Internal server error during smart matching',
      details: error.message 
    });
  }
});

// Python Flask service URL (configurable via environment)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8080';

// Multi-Agent Backend service URL (FastAPI on port 8000)
const MULTI_AGENT_SERVICE_URL = process.env.MULTI_AGENT_SERVICE_URL || 'http://localhost:8000';

// Initialize Firebase Admin for Firestore access (if credentials available)
let adminDb = null;
const appId = process.env.APP_ID || 'academic-match-production';

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    adminDb = getFirestore();
    console.log('✅ Firebase Admin initialized for professor verification');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed (verification will use client SDK):', error.message);
}

// Authentication endpoints
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // In production, validate against database
    // For demo, accept any credentials
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { email, userId: 'demo-user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token,
      user: { email, userId: 'demo-user' },
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ResearchLink RAG Backend',
    version: '2.0.0',
    endpoints: {
      'POST /auth/login': 'Authentication endpoint',
      'POST /smart-match': 'AI-powered smart matching (requires authentication)',
      'POST /smart-match-public': 'AI-powered smart matching (no authentication required)',
      'POST /api/mentorship': 'Academic mentorship workflow (LangGraph)',
      'POST /api/paper-analysis': 'Research paper analysis workflow (LangGraph)',
      'POST /api/verify-professor': 'Verify professor profile (integrated)',
      'GET /api/mentorship-health': 'Check Python service health',
      'GET /health': 'Health check endpoint'
    },
    status: 'running',
    cors: 'Enabled for all localhost ports (including 3000, 3001, 3004, 5173, 4173)',
    python_service: {
      url: PYTHON_SERVICE_URL,
      description: 'LangGraph workflows for mentorship and paper analysis'
    },
    multi_agent_service: {
      url: MULTI_AGENT_SERVICE_URL,
      description: 'Multi-Agent Mentorship system with specialized AI agents'
    }
  });
});

// Helper function to check if Python service is available
async function checkPythonService() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      return { available: true, status: data };
    }
    return { available: false, error: 'Service returned non-200 status' };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

// Proxy endpoint for Academic Mentorship workflow
app.post('/api/mentorship', async (req, res) => {
  try {
    const { user_input, model } = req.body;
    
    if (!user_input || user_input.trim().length < 3) {
      return res.status(400).json({ 
        error: 'User input is required and must be at least 3 characters long' 
      });
    }
    
    console.log(`🎓 Proxying mentorship request to Python service: "${user_input.substring(0, 50)}..."`);
    
    // Forward request to Python Flask service
    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/mentorship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_input, model: model || 'gemini-2.0-flash' })
    });
    
    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({ error: 'Python service error' }));
      return res.status(pythonResponse.status).json(errorData);
    }
    
    const result = await pythonResponse.json();
    console.log(`✅ Mentorship workflow completed successfully`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error proxying mentorship request:', error);
    
    // Check if Python service is available
    const serviceStatus = await checkPythonService();
    if (!serviceStatus.available) {
      return res.status(503).json({ 
        error: 'Python mentorship service is not available',
        details: serviceStatus.error,
        hint: 'Ensure the Python Flask service is running on port 8080'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during mentorship workflow',
      details: error.message 
    });
  }
});

// Helper function to check if Multi-Agent service is available
async function checkMultiAgentService() {
  try {
    const response = await fetch(`${MULTI_AGENT_SERVICE_URL}/`);
    if (response.ok) {
      const data = await response.json();
      return { available: true, status: data };
    }
    return { available: false, error: 'Service returned non-200 status' };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

// Proxy endpoint for Multi-Agent Mentorship
app.post('/api/multi-agent/mentorship', async (req, res) => {
  try {
    const { agent_type, query, preferred_provider, session_id, user_id } = req.body;
    
    if (!agent_type || !query || query.trim().length < 1) {
      return res.status(400).json({ 
        error: 'agent_type and query are required' 
      });
    }
    
    console.log(`🤖 Proxying multi-agent request: agent=${agent_type}, provider=${preferred_provider || 'default'}`);
    
    // Forward request to Multi-Agent FastAPI service
    const response = await fetch(`${MULTI_AGENT_SERVICE_URL}/mentorship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_type,
        query: query.trim(),
        preferred_provider,
        session_id,
        user_id
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Multi-agent service error' }));
      return res.status(response.status).json(errorData);
    }
    
    const result = await response.json();
    console.log(`✅ Multi-agent mentorship completed successfully`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error proxying multi-agent request:', error);
    
    // Check if service is available
    const serviceStatus = await checkMultiAgentService();
    if (!serviceStatus.available) {
      return res.status(503).json({ 
        error: 'Multi-agent mentorship service is not available',
        details: serviceStatus.error,
        hint: 'Ensure the Multi-Agent FastAPI service is running on port 8000'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during multi-agent mentorship',
      details: error.message 
    });
  }
});

// Proxy endpoint for Multi-Agent Agents List
app.get('/api/multi-agent/agents', async (req, res) => {
  try {
    const response = await fetch(`${MULTI_AGENT_SERVICE_URL}/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Multi-agent service error' }));
      return res.status(response.status).json(errorData);
    }
    
    const result = await response.json();
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error fetching multi-agent agents:', error);
    const serviceStatus = await checkMultiAgentService();
    if (!serviceStatus.available) {
      return res.status(503).json({ 
        error: 'Multi-agent service is not available',
        details: serviceStatus.error
      });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Health check endpoint for Multi-Agent service
app.get('/api/multi-agent/health', async (req, res) => {
  try {
    const serviceStatus = await checkMultiAgentService();
    res.json({
      available: serviceStatus.available,
      status: serviceStatus.status || null,
      service_url: MULTI_AGENT_SERVICE_URL
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error checking multi-agent service',
      details: error.message 
    });
  }
});

// Professor Verification endpoint (integrated directly, no external service needed)
// Handle OPTIONS preflight for verify-professor endpoint
app.options('/api/verify-professor', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.post('/api/verify-professor', async (req, res) => {
  try {
    console.log('📥 Received verification request:', {
      body: req.body,
      origin: req.headers.origin,
      method: req.method
    });
    
    const { name, university } = req.body;
    
    if (!name || !university) {
      console.warn('⚠️ Missing required fields:', { name: !!name, university: !!university });
      return res.status(400).json({ 
        error: 'Name and university are required',
        hint: 'Please provide both name and university fields in the request body'
      });
    }
    
    console.log(`🔍 Verifying professor: ${name} at ${university}`);
    
    // Get Firestore instance - use existing adminDb if available, otherwise try to get default
    // If Firestore is not available, verification will still work but won't use profile data
    let db = adminDb;
    if (!db) {
      try {
        db = getFirestore();
      } catch (error) {
        console.warn('⚠️ Firestore not available, verification will continue without profile data:', error.message);
        db = null; // Allow verification to proceed without Firestore
      }
    }
    
    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    console.log(`🔑 Gemini API Key status: ${geminiApiKey ? 'Present (' + geminiApiKey.substring(0, 20) + '...)' : 'MISSING'}`);
    
    // Verify professor using integrated module
    const result = await verifyProfessor(name, university, db, geminiApiKey);
    
    console.log(`✅ Professor verification completed: verified=${result.verified}, score=${result.confidence_score}`);
    
    // Ensure CORS headers are set
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error verifying professor:', error);
    console.error('Error stack:', error.stack);
    
    // Ensure CORS headers are set even on error
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.status(500).json({ 
      error: 'Internal server error during professor verification',
      details: error.message,
      hint: 'Check backend logs for more details'
    });
  }
});

// Proxy endpoint for Paper Analysis workflow
// Note: This endpoint requires direct file upload from frontend to Python service
// For now, we recommend frontend calls Python service directly or we implement proper file streaming
app.post('/api/paper-analysis', async (req, res) => {
  try {
    // For file uploads, it's better to proxy the raw request stream
    // However, Express doesn't easily forward multipart/form-data
    // For production, consider using a proxy middleware or direct frontend-to-Python connection
    
    // Check if Python service is available first
    const serviceStatus = await checkPythonService();
    if (!serviceStatus.available) {
      return res.status(503).json({ 
        error: 'Python paper analysis service is not available',
        details: serviceStatus.error,
        hint: 'Ensure the Python Flask service is running on port 8080. You can also call http://localhost:8080/api/paper-analysis directly from the frontend.'
      });
    }
    
    // Return instructions for direct connection
    // In a production setup, you'd use middleware like http-proxy-middleware
    return res.status(501).json({
      error: 'File upload proxy not fully implemented',
      hint: 'Please call the Python service directly at http://localhost:8080/api/paper-analysis',
      python_service_url: `${PYTHON_SERVICE_URL}/api/paper-analysis`,
      note: 'File uploads require multipart/form-data which is better handled directly from frontend to Python service'
    });
    
  } catch (error) {
    console.error('❌ Error in paper analysis proxy:', error);
    res.status(500).json({ 
      error: 'Internal server error during paper analysis',
      details: error.message 
    });
  }
});

// Research Journey FastAPI Service Proxy
const RESEARCH_JOURNEY_SERVICE_URL = process.env.RESEARCH_JOURNEY_SERVICE_URL || 'http://localhost:8002';

// Check if Research Journey service is available
async function checkResearchJourneyService() {
  try {
    const response = await fetch(`${RESEARCH_JOURNEY_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return { available: response.ok, error: null };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

// Research Journey proxy endpoints
app.post('/api/research-journey/sessions', async (req, res) => {
  try {
    const serviceStatus = await checkResearchJourneyService();
    if (!serviceStatus.available) {
      return res.status(503).json({
        error: 'Research Journey service is not available',
        details: serviceStatus.error,
        hint: 'Ensure the Research Journey FastAPI service is running on port 8002'
      });
    }

    const response = await fetch(`${RESEARCH_JOURNEY_SERVICE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying Research Journey session:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/research-journey/suggest-topic', async (req, res) => {
  try {
    const serviceStatus = await checkResearchJourneyService();
    if (!serviceStatus.available) {
      return res.status(503).json({
        error: 'Research Journey service is not available',
        details: serviceStatus.error
      });
    }

    const response = await fetch(`${RESEARCH_JOURNEY_SERVICE_URL}/suggest-topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying topic suggestions:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/research-journey/literature-summary', async (req, res) => {
  try {
    const serviceStatus = await checkResearchJourneyService();
    if (!serviceStatus.available) {
      return res.status(503).json({
        error: 'Research Journey service is not available',
        details: serviceStatus.error
      });
    }

    const response = await fetch(`${RESEARCH_JOURNEY_SERVICE_URL}/literature-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying literature summary:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/research-journey/generate-proposal', async (req, res) => {
  try {
    const serviceStatus = await checkResearchJourneyService();
    if (!serviceStatus.available) {
      return res.status(503).json({
        error: 'Research Journey service is not available',
        details: serviceStatus.error
      });
    }

    const response = await fetch(`${RESEARCH_JOURNEY_SERVICE_URL}/generate-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying proposal generation:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/research-journey/professor-guidance', async (req, res) => {
  try {
    const serviceStatus = await checkResearchJourneyService();
    if (!serviceStatus.available) {
      return res.status(503).json({
        error: 'Research Journey service is not available',
        details: serviceStatus.error
      });
    }

    const response = await fetch(`${RESEARCH_JOURNEY_SERVICE_URL}/professor-guidance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying professor guidance:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Email configuration for contact form
const createEmailTransporter = () => {
  // Using Gmail SMTP - you can configure this in .env
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'adeeshabpgcw@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD || '' // Gmail App Password (not regular password)
    }
  });
  return transporter;
};

// Contact form endpoint - sends email and stores in Firestore
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message, category, userId } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Name, email, subject, and message are required' 
      });
    }

    console.log(`📧 Received contact form submission from: ${name} (${email})`);
    
    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Contact Form Submission</h2>
        <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Category:</strong> ${category || 'General Inquiry'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
        <h3 style="color: #1F2937;">Message:</h3>
        <p style="background-color: #F9FAFB; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        ${userId ? `<p style="margin-top: 20px; color: #6B7280; font-size: 12px;"><strong>User ID:</strong> ${userId}</p>` : ''}
      </div>
    `;

    const emailText = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Category: ${category || 'General Inquiry'}
Subject: ${subject}

Message:
${message}
${userId ? `\nUser ID: ${userId}` : ''}
    `;

    // Send email
    try {
      const transporter = createEmailTransporter();
      if (!process.env.EMAIL_APP_PASSWORD) {
        console.warn('⚠️ EMAIL_APP_PASSWORD not set in .env - email sending will fail');
        return res.status(503).json({ 
          error: 'Email service not configured',
          hint: 'Please set EMAIL_APP_PASSWORD in production.env file'
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'adeeshabpgcw@gmail.com',
        to: 'adeeshabpgcw@gmail.com',
        replyTo: email,
        subject: `[ResearchLink] ${subject} - ${category || 'General'}`,
        text: emailText,
        html: emailHtml
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Contact email sent successfully to adeeshabpgcw@gmail.com`);
      
      res.json({ 
        success: true,
        message: 'Contact form submitted and email sent successfully' 
      });
    } catch (emailError) {
      console.error('❌ Error sending contact email:', emailError);
      res.status(500).json({ 
        error: 'Failed to send email',
        details: emailError.message,
        hint: 'Check EMAIL_USER and EMAIL_APP_PASSWORD in production.env'
      });
    }

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Health check endpoint for Python service integration
app.get('/api/mentorship-health', async (req, res) => {
  try {
    const serviceStatus = await checkPythonService();
    res.json({
      python_service: serviceStatus.available ? 'available' : 'unavailable',
      python_service_url: PYTHON_SERVICE_URL,
      details: serviceStatus.status || { error: serviceStatus.error },
      node_service: 'healthy'
    });
  } catch (error) {
    res.status(500).json({
      python_service: 'error',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Academic RAG Smart Matching - Production (Fallback)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    features: ['Gemini AI', 'JWT Auth', 'Rate Limiting', 'Security Headers', 'Python Integration'],
    python_service_url: PYTHON_SERVICE_URL
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Production RAG Backend (Fallback) running on port ${PORT}`);
  console.log(`📡 Smart matching endpoint: http://localhost:${PORT}/smart-match`);
  console.log(`🔐 Authentication endpoint: http://localhost:${PORT}/auth/login`);
  console.log(`🎓 Mentorship workflow: http://localhost:${PORT}/api/mentorship`);
  console.log(`📄 Paper analysis: http://localhost:${PORT}/api/paper-analysis`);
  console.log(`🤖 Multi-Agent mentorship: http://localhost:${PORT}/api/multi-agent/mentorship`);
  console.log(`🔍 Professor verification: http://localhost:${PORT}/api/verify-professor (integrated)`);
  console.log(`📧 Contact form endpoint: http://localhost:${PORT}/api/contact`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`📊 Using Firestore for professor data`);
  console.log(`🐍 Python service URL: ${PYTHON_SERVICE_URL}`);
  console.log(`🤖 Multi-Agent service URL: ${MULTI_AGENT_SERVICE_URL}`);
  console.log(`💡 Tip: Ensure Python Flask service is running on port 8080 for mentorship features`);
  console.log(`💡 Tip: Ensure Multi-Agent FastAPI service is running on port 8000 for multi-agent features`);
  console.log(`✅ Professor verification is integrated - no external service needed`);
});

export default app;
