import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { IncomingMessage, ServerResponse } from "http";
import { weatherData } from '../data/weather-data';

const weatherMcpServer = new McpServer({
  name: "weather-mcp",
  version: "1.0.0",
});

const getWeatherDataByCity = async (city: string) => {
  console.log("==== getWeatherDataByCity:", city);
  const cityData = weatherData.cities[city.toLowerCase()];
  
  if (cityData) {
    return cityData;
  }
  
  return {
    city: "unknown",
    temperature: "unknown",
    weather: "unknown",
    forecast: "unknown",
  };
};

weatherMcpServer.tool(
  "getWeatherDataByCity",
  {
    city: z.string(),
  },
  async ({ city }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getWeatherDataByCity(city)),
        },
      ],
    };
  }
);

export const handleMcpPostMessage = async (req: IncomingMessage, res: ServerResponse) => {
  const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await weatherMcpServer.connect(transport);
  await transport.handleRequest(req, res, (req as any).body);
};