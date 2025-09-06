import express, { Request, Response } from 'express';
import { handleWeatherMcpPostMessage } from './mcp/weather-mcp-http';
import { IncomingMessage, ServerResponse } from 'http';
import { handleStudentMcpPostMessage } from './mcp/student-mcp-http';
import { OllamaService } from './services/ollama.service';

const app = express();
const PORT = process.env.PORT || 3000;
const ollamaService = new OllamaService();

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to the Express PostgreSQL App!');
});

// Ollama API endpoint
app.post('/api/ollama', async (req: Request, res: Response) => {
  const { prompt, model } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  const result = await ollamaService.generateResponse(prompt, model);
  res.json(result);
});

// MCP endpoint
app.post('/mcp-weather', (req, res) => {
  handleWeatherMcpPostMessage(req as IncomingMessage, res as unknown as ServerResponse);
});

app.post('/mcp-student', (req, res) => {
  console.log('Received request at /mcp-student');
  handleStudentMcpPostMessage(req as IncomingMessage, res as unknown as ServerResponse);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Ollama API available at http://localhost:${PORT}/api/ollama`);
  console.log(`MCP endpoint available at http://localhost:${PORT}/mcp`);
});
