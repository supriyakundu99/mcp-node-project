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

const getCitiesByAQI = async (threshold: number, isHigher: boolean) => {
  console.log(`==== getCitiesByAQI: threshold ${threshold}, isHigher: ${isHigher}`);
  
  const filteredCities = Object.entries(weatherData.cities)
    .filter(([_, cityData]) => {
      const aqi = parseInt(cityData.current.airQuality.index);
      return isHigher ? aqi > threshold : aqi < threshold;
    })
    .map(([_, cityData]) => ({
      city: cityData.city,
      aqi: cityData.current.airQuality.index,
      description: cityData.current.airQuality.description,
      temperature: cityData.temperature,
      weather: cityData.weather
    }));

  return {
    count: filteredCities.length,
    threshold: threshold,
    condition: isHigher ? "higher" : "lower",
    cities: filteredCities
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
          text: JSON.stringify(await getCitiesByAQI(threshold, isHigher)),
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