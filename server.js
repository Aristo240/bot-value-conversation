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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Initialize both AI models
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Schema
const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  stance: { type: String, required: true },
  botPersonality: { type: String, required: true },
  aiModel: String,
  aiModelVersion: String,
  consent: {
    accepted: Boolean,
    timestamp: Date
  },
  demographics: {
    age: Number,
    gender: String,
    education: String,
    timestamp: Date
  },
  pvq21: {
    responses: [{
      questionId: Number,
      value: Number
    }],
    timestamp: Date
  },
  chat: [{
    messageId: String,
    text: String,
    sender: String,
    timestamp: Date
  }],
  finalResponse: {
    text: String,
    timestamp: Date
  },
  sbsvs: {
    responses: [{
      questionId: Number,
      value: Number
    }],
    timestamp: Date
  },
  attitudeSurvey: {
    responses: [{
      aspect: String,
      rating: Number
    }],
    timestamp: Date
  },
  stanceAgreement: {
    assigned: { type: Number, min: 1, max: 5 },
    opposite: { type: Number, min: 1, max: 5 },
    timestamp: { type: Date }
  },
  alternativeUses: {
    responses: [{
      id: String,
      idea: String,
      timestamp: Date
    }],
    timestamp: Date
  },
  events: [{
    type: String,
    step: Number,
    timestamp: Date
  }],
  initialAssessment: {
    interesting: Number,
    important: Number,
    agreement: Number,
    timestamp: Date
  }
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
      { aiModel: 'gpt', stance: 'safety', personality: 'conservative' },
      { aiModel: 'gemini', stance: 'freedom', personality: 'creative' },
      { aiModel: 'gemini', stance: 'freedom', personality: 'conservative' },
      { aiModel: 'gemini', stance: 'safety', personality: 'creative' },
      { aiModel: 'gemini', stance: 'safety', personality: 'conservative' }
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

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const username = req.body?.username || req.headers?.username;
  const password = req.body?.password || req.headers?.password;
  
  if (username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// only gpt
app.get('/api/nextCondition', async (req, res) => {
  try {
    // Get all counters but filter for GPT only during pre-test
    const counters = await ConditionCounter.find({ aiModel: 'gpt' });
    
    if (!counters || counters.length === 0) {
      throw new Error('No condition counters found');
    }

    const minCount = Math.min(...counters.map(c => c.count));
    
    // Get all conditions with the minimum count
    const eligibleConditions = counters.filter(c => c.count === minCount);
    
    if (eligibleConditions.length === 0) {
      throw new Error('No eligible conditions found');
    }
    
    // Randomly select from eligible conditions
    const selectedCondition = eligibleConditions[Math.floor(Math.random() * eligibleConditions.length)];
    
    // Log the selected condition for debugging
    console.log('Selected condition:', selectedCondition);
    
    // Increment the counter for the selected condition
    await ConditionCounter.findByIdAndUpdate(selectedCondition._id, { $inc: { count: 1 } });
    
    // Verify the stance is either 'freedom' or 'safety'
    if (!['freedom', 'safety'].includes(selectedCondition.stance)) {
      throw new Error('Invalid stance in selected condition');
    }
    
    res.json({
      aiModel: selectedCondition.aiModel,
      stance: selectedCondition.stance,
      personality: selectedCondition.personality
    });
  } catch (error) {
    console.error('Error in nextCondition:', error);
    res.status(500).json({ error: error.message });
  }
});

// gpt+gemini models
// app.get('/api/nextCondition', async (req, res) => {
//   try {
//     // Get all counters and find the minimum count
//     const counters = await ConditionCounter.find({});
//     const minCount = Math.min(...counters.map(c => c.count));
    
//     // Get all conditions with the minimum count
//     const eligibleConditions = counters.filter(c => c.count === minCount);
    
//     // Randomly select from eligible conditions
//     const selectedCondition = eligibleConditions[Math.floor(Math.random() * eligibleConditions.length)];
    
//     // Increment the counter for the selected condition
//     await ConditionCounter.findByIdAndUpdate(selectedCondition._id, { $inc: { count: 1 } });
    
//     res.json({
//       aiModel: selectedCondition.aiModel,
//       stance: selectedCondition.stance,
//       personality: selectedCondition.personality
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

app.get('/api/admin/conditionCounts', authenticateAdmin, async (req, res) => {
  try {
    const counters = await ConditionCounter.find({});
    res.json(counters);
  } catch (error) {
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
    const { sessionId, stance, botPersonality } = req.body;
    const session = new Session({
      sessionId,
      timestamp: new Date(),
      stance,
      botPersonality,
      stanceAgreement: {}
    });
    await session.save();
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
    session.chat.push(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Chat with AI models endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, stance, botPersonality, aiModel, aiModelVersion, history } = req.body;
    const { systemPrompt, exampleExchange } = getSystemPrompt(stance, botPersonality, aiModel);
    
    let response;
    let modelVersion;

    if (aiModel === 'gpt') {
      modelVersion = 'gpt-4';
      const completion = await openai.chat.completions.create({
        model: modelVersion,
        temperature: 0.7,
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
        ]
      });
      response = completion.choices[0].message.content;
    } else {
      // Gemini implementation
      const model = gemini.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.7
        }
      });

      // Format conversation for Gemini
      const chatContext = `${systemPrompt}

EXAMPLE INTERACTION:
Assistant: ${exampleExchange.bot}
Human: ${exampleExchange.user}
Assistant: ${exampleExchange.bot}

CONVERSATION HISTORY:
${history.map(msg => `${msg.sender === 'user' ? 'Human' : 'Assistant'}: ${msg.text}`).join('\n')}

Current Human Message: ${message}

Assistant (remember to maintain personality and focus on stance):`;

      try {
        const result = await model.generateContent(chatContext);
        response = result.response.text();
        
        // Validate response
        if (!response || response.trim().length === 0) {
          throw new Error('Empty response from Gemini');
        }
      } catch (error) {
        console.error('Gemini Error:', error);
        throw new Error(`Gemini error: ${error.message}`);
      }
    }

    res.json({ response });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Error generating response',
      details: error.message 
    });
  }
});

// Save all questionnaire responses
app.post('/api/sessions/:sessionId/questionnaires', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Merge the updates with existing data
    if (req.body.demographics) {
      session.demographics = { ...session.demographics, ...req.body.demographics };
    }
    if (req.body.pvq21) {
      session.pvq21 = { ...session.pvq21, ...req.body.pvq21 };
    }
    if (req.body.initialAssessment) {
      session.initialAssessment = { ...session.initialAssessment, ...req.body.initialAssessment };
    }
    if (req.body.finalResponse) {
      session.finalResponse = { ...session.finalResponse, ...req.body.finalResponse };
    }
    if (req.body.sbsvs) {
      session.sbsvs = { ...session.sbsvs, ...req.body.sbsvs };
    }
    if (req.body.attitudeSurvey) {
      session.attitudeSurvey = { ...session.attitudeSurvey, ...req.body.attitudeSurvey };
    }
    if (req.body.stanceAgreement) {
      session.stanceAgreement = { ...session.stanceAgreement, ...req.body.stanceAgreement };
    }
    if (req.body.alternativeUses) {
      session.alternativeUses = { ...session.alternativeUses, ...req.body.alternativeUses };
    }
    if (req.body.chat) {
      session.chat = req.body.chat;
    }

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error saving questionnaire responses:', error);
    res.status(400).json({ message: error.message });
  }
});

// Admin routes
app.post('/api/admin/login', authenticateAdmin, (req, res) => {
  res.json({ success: true });
});

app.post('/api/admin/sessions', authenticateAdmin, async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ timestamp: -1 })
      .select({
        sessionId: 1,
        timestamp: 1,
        stance: 1,
        botPersonality: 1,
        aiModel: 1,
        aiModelVersion: 1,
        demographics: 1,
        pvq21: 1,
        initialAssessment: 1,
        chat: 1,
        finalResponse: 1,
        sbsvs: 1,
        attitudeSurvey: 1,
        alternativeUses: 1,
        events: 1
      });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/admin/sessions/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    await Session.findOneAndDelete({ sessionId: req.params.sessionId });
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
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
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Ensure all fields are included in the response
    const fullSession = {
      sessionId: session.sessionId,
      timestamp: session.timestamp,
      stance: session.stance,
      botPersonality: session.botPersonality,
      aiModel: session.aiModel,
      aiModelVersion: session.aiModelVersion,
      demographics: session.demographics,
      pvq21: session.pvq21,
      initialAssessment: session.initialAssessment,
      chat: session.chat,
      finalResponse: session.finalResponse,
      sbsvs: session.sbsvs,
      attitudeSurvey: session.attitudeSurvey,
      alternativeUses: session.alternativeUses,
      events: session.events
    };
    
    res.json(fullSession);
  } catch (error) {
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

// Add separate endpoints for each type of data
app.post('/api/sessions/:sessionId/demographics', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.demographics = req.body;
    await session.save();
    res.status(201).json(session.demographics);
  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/sessions/:sessionId/pvq21', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.pvq21 = req.body;
    await session.save();
    res.status(201).json(session.pvq21);
  } catch (error) {
    console.error('Error saving PVQ21:', error);
    res.status(400).json({ message: error.message });
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

// Update the stanceAgreement endpoint
app.post('/api/sessions/:sessionId/stanceAgreement', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.stanceAgreement = {
      assigned: parseInt(req.body.assigned),
      opposite: parseInt(req.body.opposite),
      timestamp: new Date()
    };

    await session.save();
    res.status(201).json(session.stanceAgreement);
  } catch (error) {
    console.error('Error saving stance agreement:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update the chat endpoint to append messages
app.post('/api/sessions/:sessionId/chat', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (!session.chat) {
      session.chat = [];
    }
    session.chat.push({
      messageId: req.body.messageId,
      text: req.body.text,
      sender: req.body.sender,
      timestamp: new Date()
    });
    
    await session.save();
    res.status(201).json(session.chat);
  } catch (error) {
    console.error('Error saving chat message:', error);
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
        assigned: parseInt(req.body.stanceAgreement.assigned),
        opposite: parseInt(req.body.stanceAgreement.opposite),
        timestamp: new Date(req.body.stanceAgreement.timestamp)
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

// Update the GET endpoint for fetching sessions
app.get('/api/admin/sessions', async (req, res) => {
  try {
    const sessions = await Session.find({}).sort({ timestamp: -1 });
    console.log('Sessions fetched:', sessions); // Debug log
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
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

// Add these constants at the top of the file
const SBSVSQuestions = [
  // ... copy questions from SBSVS.jsx ...
];

const getPVQ21Questions = (gender) => [
  // ... copy questions from PVQ21.jsx ...
];