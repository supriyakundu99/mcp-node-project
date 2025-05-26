import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const weatherMcpServer = new McpServer({
  name: "weather-mcp",
  version: "1.0.0",
});

const getWeatherDataByCity = async (city: string) => {
  switch (city.toLocaleLowerCase()) {
    case "howrah":
      return {
        city: "howrah",
        temperature: "25C",
        weather: "sunny",
        forecast: "sunny",
        wind: "10 km/h",
        humidity: "50%",
        pressure: "1000 hPa",
        visibility: "10 km",
        uvIndex: "5",
      };
    case "kolkata":
      return {
        city: "kolkata",
        temperature: "25C",
        weather: "sunny",
        forecast: "Heavy Rain",
        wind: "10 km/h",
        humidity: "50%",
        pressure: "1000 hPa",
        visibility: "10 km",
        uvIndex: "5",
      };
    case "delhi":
      return {
        city: "delhi",
        temperature: "25C",
        weather: "sunny",
        forecast: "Cloudy",
        wind: "10 km/h",
        humidity: "50%",
        pressure: "1000 hPa",
        visibility: "10 km",
        uvIndex: "5",
      };
    default:
      return {
        city: "unknown",
        temperature: "unknown",
        weather: "unknown",
        forecast: "unknown",
      };
  }
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
          text: JSON.stringify(getWeatherDataByCity(city)),
        },
      ],
    };
  }
);

const main = async () => {
  const transport = new StdioServerTransport();
  await weatherMcpServer.connect(transport);
};

main();
