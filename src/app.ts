import express, { Request, Response } from 'express';
import path from 'path';
import { handleWeatherMcpPostMessage } from './mcp/weather-mcp-http';
import { IncomingMessage, ServerResponse } from 'http';
import { handleStudentMcpPostMessage } from './mcp/student-mcp-http';
import { WeatherOllamaService } from './services/ai/weather-ollama.service';
import { WeatherService } from './services/system/weather.service';
import { StudentOllamaService } from './services/ai/student-ollama.service';

const app = express();
const PORT = process.env.PORT || 3000;
const weatherOllamaService = new WeatherOllamaService();
const studentOllamaService = new StudentOllamaService();
const weatherService = new WeatherService();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to the Express PostgreSQL App!');
});

app.get('/chat', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

// Ollama API endpoint
app.post('/api/ollama', async (req: Request, res: Response) => {
  const { prompt, model } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  // const result = await weatherOllamaService.generateResponse(prompt, model);
  const result = await studentOllamaService.generateResponse(prompt, model);
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

// Weather API
app.get('/weather/:city', async (req: Request, res: Response) => {
  const { city } = req.params;
  res.json(await weatherService.getWeatherDataByCity(city));
});

// Get cities by AQI threshold
app.get('/aqi/cities', async (req: Request, res: Response) => {
  const threshold = parseInt(req.query.threshold as string);
  const isHigher = req.query.isHigher === 'true';

  const result = await weatherService.getCitiesByAQI(threshold, isHigher);
  res.json(result);
});

// Get cities by temperature range
app.get('/temperature/cities', async (req: Request, res: Response) => {
  const min = req.query.min ? parseInt(req.query.min as string) : undefined;
  const max = req.query.max ? parseInt(req.query.max as string) : undefined;

  const result = await weatherService.getCitiesByTemperatureRange(min, max);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Chat UI available at http://localhost:${PORT}/chat`);
  console.log(`Ollama API available at http://localhost:${PORT}/api/ollama`);
  console.log(`Weather MCP endpoint available at http://localhost:${PORT}/mcp-weather`);
  console.log(`Student MCP endpoint available at http://localhost:${PORT}/mcp-student`);
});
