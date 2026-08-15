import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateQuizWithGemini } from './server/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route for Smart Quiz Generator
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { topic, exam, difficulty, count } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'A topic or syllabus keyword is required.' });
    }

    const questions = await generateQuizWithGemini({ topic, exam, difficulty, count });
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error generating quiz with Gemini:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
