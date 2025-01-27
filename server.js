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

// MongoDB Schema with all cases
const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  stance: String,
  botPersonality: String,
  aiModel: String,
  
  // Case 2: Demographics
  demographics: {
    age: Number,
    gender: String,
    education: String,
    timestamp: Date
  },

  // Case 3: PVQ21
  pvq21: {
    responses: {
      type: Map,
      of: Number
    },
    timestamp: Date
  },

  // Case 4: Initial Assessment
  initialAssessment: {
    interesting: Number,
    important: Number,
    agreement: Number,
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
    type: Map,
    of: Number,
    timestamp: Date
  },

  // Case 9: Attitude Survey
  attitudeSurvey: {
    type: Map,
    of: Number,
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

// Add or update authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify against environment variables
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    
    const providedAuth = Buffer.from(token, 'base64').toString();
    const [providedUsername, providedPassword] = providedAuth.split(':');

    if (providedUsername !== username || providedPassword !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
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

    // Update each section with proper structure
    if (req.body.demographics) {
      session.demographics = {
        ...req.body.demographics,
        timestamp: new Date()
      };
    }

    if (req.body.pvq21) {
      session.pvq21 = {
        responses: req.body.pvq21.responses,
        timestamp: new Date()
      };
    }

    if (req.body.initialAssessment) {
      session.initialAssessment = {
        ...req.body.initialAssessment,
        timestamp: new Date()
      };
    }

    if (req.body.chat) {
      session.chat = req.body.chat.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }

    if (req.body.finalResponse) {
      session.finalResponse = {
        text: req.body.finalResponse.text,
        timestamp: new Date()
      };
    }

    if (req.body.sbsvs) {
      session.sbsvs = req.body.sbsvs;
    }

    if (req.body.attitudeSurvey) {
      session.attitudeSurvey = req.body.attitudeSurvey;
    }

    if (req.body.stanceAgreement) {
      session.stanceAgreement = {
        assigned: parseInt(req.body.stanceAgreement.assigned),
        opposite: parseInt(req.body.stanceAgreement.opposite)
      };
    }

    if (req.body.alternativeUses) {
      session.alternativeUses = req.body.alternativeUses.map(response => ({
        text: response,
        timestamp: new Date()
      }));
    }

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error saving questionnaire responses:', error);
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
      opposite: parseInt(req.body.opposite)
    };
    
    await session.save();
    res.status(200).json(session.stanceAgreement);
  } catch (error) {
    console.error('Error saving stance agreement:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update the admin endpoints to use authentication
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

app.post('/api/admin/sessions', authenticateAdmin, async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ timestamp: -1 })
      .lean()
      .exec();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/admin/sessions/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    await Session.findOneAndDelete({ sessionId: req.params.sessionId });
    res.status(200).json({ message: 'Session deleted successfully' });
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
      timestamp: new Date()
    };
    
    await session.save();
    res.status(200).json(session.demographics);
  } catch (error) {
    console.error('Error saving demographics:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update the PVQ21 endpoint
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

// Update SBSVS endpoint
app.post('/api/sessions/:sessionId/sbsvs', async (req, res) => {
  try {
    console.log('Received SBSVS data:', req.body); // Debug log
    
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Validate the responses
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        message: 'Invalid SBSVS format. Expected an object with responses.' 
      });
    }

    // Convert responses to numbers and store
    const responses = {};
    Object.entries(req.body).forEach(([key, value]) => {
      responses[key] = parseInt(value, 10);
    });

    session.sbsvs = responses;
    console.log('Saving SBSVS data:', session.sbsvs); // Debug log

    await session.save();
    res.status(200).json(session.sbsvs);
  } catch (error) {
    console.error('SBSVS save error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Attitude Survey endpoint
app.post('/api/sessions/:sessionId/attitudeSurvey', async (req, res) => {
  try {
    console.log('Received Attitude Survey data:', req.body); // Debug log
    
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Validate the responses
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        message: 'Invalid Attitude Survey format. Expected an object with responses.' 
      });
    }

    // Convert responses to numbers and store
    const responses = {};
    Object.entries(req.body).forEach(([key, value]) => {
      responses[key] = parseInt(value, 10);
    });

    session.attitudeSurvey = responses;
    console.log('Saving Attitude Survey data:', session.attitudeSurvey); // Debug log

    await session.save();
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