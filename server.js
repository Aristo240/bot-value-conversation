import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { getSystemPrompt } from './config/botConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Models (unchanged)
const SessionSchema = new mongoose.Schema({
  sessionId: String,
  timestamp: Date,
  stance: String,
  botPersonality: String,
  chat: [{
    messageId: String,
    text: String,
    sender: String,
    timestamp: Date
  }],
  finalResponse: {
    text: String,
    timestamp: Date
  }
});

const Session = mongoose.model('Session', SessionSchema);

// Admin authentication middleware (unchanged)
const authenticateAdmin = async (req, res, next) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// Basic health check (unchanged)
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Create new session (unchanged)
app.post('/api/sessions', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add message to session (unchanged)
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

// Modified chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, stance, botPersonality, history } = req.body;
    const { systemPrompt, exampleExchange } = getSystemPrompt(stance, botPersonality);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes (unchanged)
app.post('/api/admin/login', authenticateAdmin, (req, res) => {
  res.json({ success: true });
});

app.post('/api/admin/sessions', authenticateAdmin, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ timestamp: -1 });
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
    res.json(session.chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/sessions/:sessionId/response', authenticateAdmin, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    res.json(session.finalResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save final response (unchanged)
app.post('/api/sessions/:sessionId/response', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    session.finalResponse = req.body;
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Serve React app (unchanged)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));