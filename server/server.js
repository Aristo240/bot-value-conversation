// server/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

// MongoDB Models
const AdminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Admin = mongoose.model('Admin', AdminSchema);

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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Chat completion route
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
                   Engage in a natural conversation, asking follow-up questions and providing insights. 
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

// Protected admin routes
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ timestamp: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    await Session.findOneAndDelete({ sessionId: req.params.sessionId });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export routes
app.post('/api/sessions/:sessionId/export', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/sessions/export-all', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));