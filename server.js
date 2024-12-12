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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Models
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

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Create new session
app.post('/api/sessions', async (req, res) => {
  try {
    const session = new Session(req.body);
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

// Chat with GPT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, stance, botPersonality, history } = req.body;
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant discussing social media challenges, specifically about ${stance}. 
                      Your personality is ${botPersonality === 'creative' ? 
                      'innovative and curious, fostering creative thinking' : 
                      'traditional and structured, fostering systematic thinking'}.
                      Stay focused on topic and encourage the user to explore different aspects of this stance by asking questions.
                      Keep responses concise (2-3 sentences).`
          },
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

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ timestamp: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save final response
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));