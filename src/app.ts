import express, { Request, Response } from 'express';
import * as db from './db';
import { handleWeatherMcpPostMessage } from './mcp/weather-mcp-http';
import { IncomingMessage, ServerResponse } from 'http';
import { handleStudentMcpPostMessage } from './mcp/student-mcp-http';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to the Express PostgreSQL App!');
});

// MCP endpoint
app.post('/mcp-weather', (req, res) => {
  handleWeatherMcpPostMessage(req as IncomingMessage, res as unknown as ServerResponse);
});

app.post('/mcp-student', (req, res) => {
  handleStudentMcpPostMessage(req as IncomingMessage, res as unknown as ServerResponse);
});

// Example route to get data from the database
app.get('/data', async (_req: Request, res: Response) => {
  try {
    const client = await db.getClient();
    const result = await client.query('SELECT * FROM mcp_schema.users');
    await client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`MCP endpoint available at http://localhost:${PORT}/mcp`);
}); 