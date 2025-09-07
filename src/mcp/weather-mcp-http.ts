import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { IncomingMessage, ServerResponse } from "http";
import { WeatherService } from "../services/system/weather.service";

const weatherMcpServer = new McpServer({
  name: "weather-mcp",
  version: "1.0.0",
});

const weatherService = new WeatherService();

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
          text: JSON.stringify(await weatherService.getWeatherDataByCity(city)),
        },
      ],
    };
  }
);

weatherMcpServer.tool(
  "getCitiesByAQI",
  {
    threshold: z.number(),
    isHigher: z.boolean(),
  },
  async ({ threshold, isHigher }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await weatherService.getCitiesByAQI(threshold, isHigher)
          ),
        },
      ],
    };
  }
);

export const handleWeatherMcpPostMessage = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  const transport: StreamableHTTPServerTransport =
    new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
  await weatherMcpServer.connect(transport);
  await transport.handleRequest(req, res, (req as any).body);
};
