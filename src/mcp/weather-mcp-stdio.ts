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
        city: "Howrah",
        temperature: "32°C",
        weather: "Partly Cloudy",
        forecast: "Light Rain",
        wind: "12 km/h",
        humidity: "68%",
        pressure: "1005 hPa",
        visibility: "8 km",
        uvIndex: "6",
      };
    case "kolkata":
      return {
        city: "Kolkata",
        temperature: "34°C",
        weather: "Humid",
        forecast: "Thunderstorms",
        wind: "15 km/h",
        humidity: "74%",
        pressure: "1002 hPa",
        visibility: "7 km",
        uvIndex: "7",
      };
    case "delhi":
      return {
        city: "Delhi",
        temperature: "39°C",
        weather: "Sunny",
        forecast: "Clear",
        wind: "10 km/h",
        humidity: "28%",
        pressure: "998 hPa",
        visibility: "10 km",
        uvIndex: "9",
      };
    case "mumbai":
      return {
        city: "Mumbai",
        temperature: "29°C",
        weather: "Overcast",
        forecast: "Heavy Rain",
        wind: "20 km/h",
        humidity: "85%",
        pressure: "1008 hPa",
        visibility: "6 km",
        uvIndex: "5",
      };
    case "bengaluru":
      return {
        city: "Bengaluru",
        temperature: "26°C",
        weather: "Cloudy",
        forecast: "Drizzle",
        wind: "8 km/h",
        humidity: "80%",
        pressure: "1010 hPa",
        visibility: "9 km",
        uvIndex: "4",
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
          text: JSON.stringify(await getWeatherDataByCity(city)),
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
