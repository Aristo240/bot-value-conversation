import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { getSystemPrompt } from './config/botConfig.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Initialize both AI models
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Environment variables
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Schema with all cases
const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  prolificId: { type: String },
  studyId: { type: String },
  studySessionId: { type: String },
  timestamp: { type: Date, default: Date.now },
  completedTimestamp: { type: Date },
  status: { 
    type: String, 
    enum: ['STARTED', 'COMPLETED', 'APPROVED', 'REJECTED'],
    default: 'STARTED'
  },
  stance: String,
  botPersonality: String,
  aiModel: String,
  
  // Questionnaire order tracking
  questionnaireOrder: {
    case3: { type: String, enum: ['PVQ21', 'SBSVS'] },
    case9: { type: String, enum: ['PVQ21', 'SBSVS'] }
  },
  
  // Case 2: Demographics (Part 1)
  demographics: {
    age: Number,
    gender: String,
    timestamp: Date
  },

  // Case 12: Demographics (Part 2)
  demographicsPart2: {
    education: String,
    race: String,
    politicalViews: String,
    timestamp: Date
  },

  // Case 3: PVQ21
  pvq21: {
    responses: {
      type: Map,
      of: Number
    },
    attentionCheck: Number,
    timestamp: Date
  },

  // Case 4: Initial Assessment
  initialAssessment: {
    assigned: Number,
    opposite: Number,
    timestamp: Date
  },

  // Case 5-6: Chat History
  chat: [{
    messageId: String,
    text: String,
    sender: String,
    timestamp: Date
  }],

  // Case 7: Final Response
  finalResponse: {
    text: String,
    timestamp: Date
  },

  // Case 8: SBSVS
  sbsvs: {
    responses: {
      type: Map,
      of: Number
    },
    attentionCheck: Number,
    timestamp: Date
  },

  // Case 9: Attitude Survey
  attitudeSurvey: {
    responses: {
      type: Map,
      of: Number
    },
    timestamp: Date
  },

  // Case 10: Stance Agreement
  stanceAgreement: {
    assigned: Number,
    opposite: Number,
    timestamp: Date
  },

  // Case 11: Alternative Uses
  alternativeUses: [{
    text: String,
    timestamp: Date
  }],

  // Add field for initial attention check
  initialAttentionCheck: {
    passed: Boolean,
    attempts: Number,
    timestamp: Date
  },

  // Add field for reCAPTCHA verification
  recaptcha: {
    verified: Boolean,
    timestamp: Date
  },

  // Add events field
  events: [{
    type: { type: String },
    step: { type: Number },
    timestamp: { type: Date }
  }]
});

const ConditionCounterSchema = new mongoose.Schema({
  aiModel: String,
  stance: String,
  personality: String,
  count: { type: Number, default: 0 }
});

const Session = mongoose.model('Session', SessionSchema);
const ConditionCounter = mongoose.model('ConditionCounter', ConditionCounterSchema);

// Initialize condition counters
async function initializeCounters() {
  const counters = await ConditionCounter.find({});
  if (counters.length === 0) {
    const conditions = [
      { aiModel: 'gpt', stance: 'freedom', personality: 'creative' },
      { aiModel: 'gpt', stance: 'freedom', personality: 'conservative' },
      { aiModel: 'gpt', stance: 'safety', personality: 'creative' },
      { aiModel: 'gpt', stance: 'safety', personality: 'conservative' }
    ];

    await Promise.all(conditions.map(condition => 
      ConditionCounter.create({
        aiModel: condition.aiModel,
        stance: condition.stance,
        personality: condition.personality,
        count: 0
      })
    ));
    console.log('Condition counters initialized');
  }
}

// Update the admin login endpoint to use environment variables
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update the authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const [username, password] = Buffer.from(token, 'base64').toString().split(':');

    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
      next();
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Update the nextCondition endpoint to use GPT
app.get('/api/nextCondition', async (req, res) => {
  try {
    // Check if this is a DEV_TEST_ID session
    const isDev = req.query.prolificId === 'DEV_TEST_ID';

    // Get all counters but force GPT usage
    const counters = await ConditionCounter.find({ aiModel: 'gpt' });
    
    if (!counters || counters.length === 0) {
      throw new Error('No condition counters found');
    }

    const minCount = Math.min(...counters.map(c => c.count));
    const eligibleConditions = counters.filter(c => c.count === minCount);
    
    if (eligibleConditions.length === 0) {
      throw new Error('No eligible conditions found');
    }
    
    const selectedCondition = eligibleConditions[Math.floor(Math.random() * eligibleConditions.length)];
    
    // Only increment counter if not a DEV_TEST_ID session
    if (!isDev) {
      await ConditionCounter.findByIdAndUpdate(selectedCondition._id, { $inc: { count: 1 } });
    }
    
    res.json({
      aiModel: 'gpt',  // Force GPT model
      stance: selectedCondition.stance,
      personality: selectedCondition.personality
    });
  } catch (error) {
    console.error('Error in nextCondition:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/conditionCounts', authenticateAdmin, async (req, res) => {
  try {
    // Get all sessions except those with DEV_TEST_ID
    const sessions = await Session.find({ 
      prolificId: { $ne: 'DEV_TEST_ID' },
      aiModel: 'gpt'  // Only include GPT sessions
    });
    
    // Initialize counters for all possible conditions
    const counters = {};
    const conditions = [
      { aiModel: 'gpt', stance: 'freedom', personality: 'creative' },
      { aiModel: 'gpt', stance: 'freedom', personality: 'conservative' },
      { aiModel: 'gpt', stance: 'safety', personality: 'creative' },
      { aiModel: 'gpt', stance: 'safety', personality: 'conservative' }
    ];

    // Initialize all counters to 0
    conditions.forEach(condition => {
      const key = `${condition.aiModel}-${condition.stance}-${condition.personality}`;
      counters[key] = {
        aiModel: condition.aiModel,
        stance: condition.stance,
        personality: condition.personality,
        count: 0
      };
    });

    // Count sessions for each condition
    sessions.forEach(session => {
      if (session.aiModel && session.stance && session.botPersonality) {
        const key = `${session.aiModel}-${session.stance}-${session.botPersonality}`;
        if (counters[key]) {
          counters[key].count++;
        }
      }
    });

    // Convert to array and sort by count
    const result = Object.values(counters).sort((a, b) => b.count - a.count);
    res.json(result);
  } catch (error) {
    console.error('Error fetching condition counts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Create new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { sessionId, stance, botPersonality, aiModel, prolificId, studyId, studySessionId } = req.body;
    
    // Randomly determine questionnaire order
    const isPVQ21First = Math.random() < 0.5;
    const questionnaireOrder = {
      case3: isPVQ21First ? 'PVQ21' : 'SBSVS',
      case9: isPVQ21First ? 'SBSVS' : 'PVQ21'
    };
    
    // Check if a session with this ID already exists
    let session = await Session.findOne({ sessionId });
    
    if (session) {
      // If session exists, update it with any new information
      session.prolificId = prolificId || session.prolificId;
      session.studyId = studyId || session.studyId;
      session.studySessionId = studySessionId || session.studySessionId;
      await session.save();
    } else {
      // Create new session
      session = new Session({
        sessionId,
        prolificId,
        studyId,
        studySessionId,
        timestamp: new Date(),
        stance,
        botPersonality,
        aiModel,
        questionnaireOrder,
        stanceAgreement: {}
      });
      await session.save();
    }
    
    console.log('Session created/updated:', {
      sessionId,
      prolificId,
      studyId,
      studySessionId,
      questionnaireOrder
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(400).json({ message: error.message });
  }
});

// Save consent
app.post('/api/sessions/:sessionId/consent', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    session.consent = {
      accepted: true,
      timestamp: new Date()
    };
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add message to session
app.post('/api/sessions/:sessionId/messages', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const message = {
      messageId: req.body.messageId,
      text: req.body.text,
      sender: req.body.sender,
      timestamp: new Date()
    };

    if (!session.chat) {
      session.chat = [];
    }
    
    session.chat.push(message);
    await session.save();
    res.status(200).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update the chat endpoint to use GPT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, stance, botPersonality, history } = req.body;
    const { systemPrompt, exampleExchange } = getSystemPrompt(stance, botPersonality, 'gpt');

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "assistant", content: exampleExchange.bot },
          { role: "user", content: exampleExchange.user },
          { role: "assistant", content: exampleExchange.bot },
          ...history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });

      const response = completion.choices[0].message.content;
      
      if (!response || response.trim().length === 0) {
        throw new Error('Empty response from GPT');
      }

      res.json({ response });
    } catch (error) {
      console.error('GPT Error:', error);
      throw new Error(`GPT error: ${error.message}`);
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Error generating response',
      details: error.message 
    });
  }
});

// Update the questionnaires endpoint
app.post('/api/sessions/:sessionId/questionnaires', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update each section with proper validation and timestamps
    if (req.body.demographics) {
      session.demographics = {
        age: req.body.demographics.age,
        gender: req.body.demographics.gender,
        timestamp: new Date()
      };
    }

    if (req.body.demographicsPart2) {
      session.demographicsPart2 = {
        education: req.body.demographicsPart2.education,
        race: req.body.demographicsPart2.race,
        politicalViews: req.body.demographicsPart2.politicalViews,
        timestamp: new Date()
      };
    }

    if (req.body.pvq21) {
      session.pvq21 = {
        responses: new Map(Object.entries(req.body.pvq21.responses)),
        attentionCheck: req.body.pvq21.attentionCheck,
        timestamp: new Date()
      };
    }

    if (req.body.initialAssessment) {
      session.initialAssessment = {
        ...req.body.initialAssessment,
        timestamp: new Date()
      };
    }

    if (req.body.finalResponse) {
      session.finalResponse = {
        text: req.body.finalResponse.text,
        timestamp: new Date()
      };
      session.completedTimestamp = new Date();
      session.status = 'COMPLETED';
    }

    if (req.body.sbsvs) {
      session.sbsvs = {
        responses: new Map(Object.entries(req.body.sbsvs.responses)),
        attentionCheck: req.body.sbsvs.attentionCheck,
        timestamp: new Date()
      };
    }

    if (req.body.attitudeSurvey) {
      session.attitudeSurvey = {
        responses: new Map(Object.entries(req.body.attitudeSurvey.responses)),
        timestamp: new Date()
      };
    }

    if (req.body.stanceAgreement) {
      session.stanceAgreement = {
        assigned: parseInt(req.body.stanceAgreement.assigned),
        opposite: parseInt(req.body.stanceAgreement.opposite),
        timestamp: new Date()
      };
    }

    if (req.body.alternativeUses) {
      session.alternativeUses = req.body.alternativeUses.map(use => ({
        text: use.idea || use.text,
        timestamp: use.timestamp ? new Date(use.timestamp) : new Date()
      }));
    }

    // Save all updates
    await session.save();
    
    console.log('Successfully saved session data:', {
      sessionId: session.sessionId,
      aiModel: session.aiModel,
      dataTypes: Object.keys(req.body),
      alternativeUsesCount: req.body.alternativeUses?.length
    });

    res.status(200).json(session);
  } catch (error) {
    console.error('Error saving questionnaire data:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.stack
    });
  }
});

// stanceAgreement endpoint
app.post('/api/sessions/:sessionId/stanceAgreement', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.stanceAgreement = {
      assigned: parseInt(req.body.assigned),
      opposite: parseInt(req.body.opposite)
    };
    
    await session.save();
    res.status(200).json(session.stanceAgreement);
  } catch (error) {
    console.error('Error saving stance agreement:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/sessions', authenticateAdmin, async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    // Format the sessions
    const formattedSessions = sessions.map(session => ({
      ...session,
      sbsvs: session.sbsvs ? {
        ...session.sbsvs,
        responses: session.sbsvs.responses || {}
      } : {},
      attitudeSurvey: session.attitudeSurvey || {},
      events: session.events || []
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/admin/sessions/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    // First get the session to know its condition
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete the session
    await Session.findOneAndDelete({ sessionId: req.params.sessionId });

    // Only decrement the counter if it's not a DEV_TEST_ID session
    if (session.prolificId !== 'DEV_TEST_ID') {
      await ConditionCounter.findOneAndUpdate(
        {
          aiModel: session.aiModel,
          stance: session.stance,
          personality: session.botPersonality
        },
        { $inc: { count: -1 } }
      );
    }

    res.status(200).json({ message: 'Session deleted successfully and counter updated' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/sessions/:sessionId/chat', authenticateAdmin, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({
      sessionId: session.sessionId,
      stance: session.stance,
      botPersonality: session.botPersonality,
      aiModel: session.aiModel,
      chat: session.chat
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/sessions/:sessionId/response', authenticateAdmin, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({
      sessionId: session.sessionId,
      stance: session.stance,
      finalResponse: session.finalResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/sessions/:sessionId/full', authenticateAdmin, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId })
      .select({
        sessionId: 1,
        timestamp: 1,
        stance: 1,
        botPersonality: 1,
        aiModel: 1,
        demographics: 1,
        pvq21: 1,
        initialAssessment: 1,
        chat: 1,
        finalResponse: 1,
        sbsvs: 1,
        attitudeSurvey: 1,
        stanceAgreement: 1,
        alternativeUses: 1
      })
      .lean()
      .exec();

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Format the session data
    const formattedSession = {
      ...session,
      sbsvs: session.sbsvs ? {
        ...session.sbsvs,
        responses: session.sbsvs.responses || {}
      } : null,
      attitudeSurvey: session.attitudeSurvey || null
    };

    res.json(formattedSession);
  } catch (error) {
    console.error('Error fetching full session data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this new endpoint for Alternative Uses Task
app.get('/api/admin/sessions/:sessionId/aut', authenticateAdmin, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({
      sessionId: session.sessionId,
      alternativeUses: session.alternativeUses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add event tracking endpoint
app.post('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const { type, step, timestamp } = req.body;
    session.events = session.events || [];
    session.events.push({
      type,
      step,
      timestamp: new Date(timestamp)
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Demographics endpoint
app.post('/api/sessions/:sessionId/demographics', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.demographics = {
      age: req.body.age,
      gender: req.body.gender,
      education: req.body.education,
      race: req.body.race,
      politicalViews: req.body.politicalViews,
      timestamp: new Date()
    };
    
    await session.save();
    res.status(200).json(session.demographics);
  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(400).json({ message: error.message });
  }
});

// PVQ21 endpoint
app.post('/api/sessions/:sessionId/pvq21', async (req, res) => {
  try {
    console.log('Received PVQ21 data:', req.body); // Debug log
    
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Validate the responses
    if (!req.body.responses || typeof req.body.responses !== 'object') {
      return res.status(400).json({ 
        message: 'Invalid responses format. Expected an object with question responses.' 
      });
    }

    // Convert responses to the correct format for MongoDB
    const responses = {};
    Object.entries(req.body.responses).forEach(([key, value]) => {
      responses[key] = parseInt(value, 10);
    });

    session.pvq21 = {
      responses: responses,
      attentionCheck: req.body.attentionCheck,
      timestamp: new Date()
    };

    console.log('Saving PVQ21 data:', session.pvq21); // Debug log

    await session.save();
    res.status(200).json(session.pvq21);
  } catch (error) {
    console.error('PVQ21 save error:', error); // Debug log
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/sessions/:sessionId/initialAssessment', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.initialAssessment = {
      interesting: req.body.interesting,
      important: req.body.important,
      agreement: req.body.agreement,
      timestamp: new Date()
    };

    await session.save();
    res.status(201).json(session.initialAssessment);
  } catch (error) {
    console.error('Error saving initial assessment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update the PUT endpoint
app.put('/api/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update the stance agreement
    if (req.body.stanceAgreement) {
      session.stanceAgreement = {
        assigned: req.body.stanceAgreement.assigned,
        opposite: req.body.stanceAgreement.opposite
      };
    }

    await session.save();
    console.log('Updated session:', session); // Debug log
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(400).json({ message: error.message });
  }
});

// SBSVS endpoint
app.post('/api/sessions/:sessionId/sbsvs', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Initialize sbsvs if it doesn't exist
    if (!session.sbsvs) {
      session.sbsvs = {};
    }

    // Update with the new responses
    session.sbsvs = {
      ...session.sbsvs,
      responses: req.body.responses,
      attentionCheck: req.body.attentionCheck,
      timestamp: new Date()
    };

    await session.save();
    console.log('Saved SBSVS data:', session.sbsvs); // Debug log
    res.status(200).json(session.sbsvs);
  } catch (error) {
    console.error('SBSVS save error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Attitude Survey endpoint
app.post('/api/sessions/:sessionId/attitudeSurvey', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Initialize attitudeSurvey if it doesn't exist
    if (!session.attitudeSurvey) {
      session.attitudeSurvey = {};
    }

    // Update with the new response
    session.attitudeSurvey = {
      ...session.attitudeSurvey,
      ...req.body,
      timestamp: new Date()
    };

    await session.save();
    console.log('Saved attitude survey data:', session.attitudeSurvey); // Debug log
    res.status(200).json(session.attitudeSurvey);
  } catch (error) {
    console.error('Attitude Survey save error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Alternative Uses endpoint
app.post('/api/sessions/:sessionId/alternativeUses', async (req, res) => {
  try {
    console.log('Received Alternative Uses data:', req.body); // Debug log
    
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Validate the responses
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ 
        message: 'Invalid format. Expected an array of responses.' 
      });
    }

    // Format and store the responses
    session.alternativeUses = req.body.map(response => ({
      text: response.idea,
      timestamp: new Date(response.timestamp)
    }));

    console.log('Saving Alternative Uses data:', session.alternativeUses); // Debug log

    await session.save();
    res.status(200).json(session.alternativeUses);
  } catch (error) {
    console.error('Alternative Uses save error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add endpoint for initial attention check
app.post('/api/sessions/:sessionId/initialAttentionCheck', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.initialAttentionCheck = {
      passed: req.body.passed,
      attempts: req.body.attempts,
      timestamp: new Date()
    };

    await session.save();
    res.status(200).json(session.initialAttentionCheck);
  } catch (error) {
    console.error('Error saving initial attention check:', error);
    res.status(400).json({ message: error.message });
  }
});

// Add this new endpoint to recalculate counters
app.post('/api/admin/recalculateCounters', authenticateAdmin, async (req, res) => {
  try {
    // Reset all counters to zero
    await ConditionCounter.updateMany({}, { count: 0 });
    
    // Count sessions, excluding DEV_TEST_ID and only including GPT sessions
    const sessions = await Session.find({ 
      prolificId: { $ne: 'DEV_TEST_ID' },
      aiModel: 'gpt'
    });
    
    for (const session of sessions) {
      if (session.aiModel && session.stance && session.botPersonality) {
        await ConditionCounter.findOneAndUpdate(
          { aiModel: session.aiModel, stance: session.stance, personality: session.botPersonality },
          { $inc: { count: 1 } }
        );
      }
    }
    
    // Get the updated counters
    const counters = await ConditionCounter.find({});
    res.json({ success: true, counters });
  } catch (error) {
    console.error('Error recalculating counters:', error);
    res.status(500).json({ error: 'Failed to recalculate counters' });
  }
});

// Add this new endpoint to reset counters
app.post('/api/admin/resetCounters', authenticateAdmin, async (req, res) => {
  try {
    // Reset all counters to zero
    await ConditionCounter.updateMany({}, { count: 0 });
    
    // Get the updated counters
    const counters = await ConditionCounter.find({});
    
    res.json({ success: true, counters });
  } catch (error) {
    console.error('Error resetting counters:', error);
    res.status(500).json({ error: 'Failed to reset counters' });
  }
});

// Delete session by MongoDB ID
app.delete('/api/admin/sessions/mongo/:mongoId', authenticateAdmin, async (req, res) => {
  try {
    const session = await Session.findById(req.params.mongoId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete the session
    await Session.findByIdAndDelete(req.params.mongoId);

    // Only decrement the counter if it's not a DEV_TEST_ID session
    if (session.prolificId !== 'DEV_TEST_ID') {
      await ConditionCounter.findOneAndUpdate(
        {
          aiModel: session.aiModel,
          stance: session.stance,
          personality: session.botPersonality
        },
        { $inc: { count: -1 } }
      );
    }

    res.status(200).json({ message: 'Session deleted successfully and counter updated' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: error.message });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await initializeCounters();  // Initialize counters after connection
  })
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));