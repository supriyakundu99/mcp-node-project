import axios from "axios";
import { WeatherService } from "./weather.service";

export class OllamaService {
  private baseUrl = "http://localhost:11434";
  private weatherService = new WeatherService();

  private async getToolSelection(prompt: string, model: string): Promise<any> {
    console.log(
      "🔍 [OllamaService] Getting tool selection for prompt:",
      prompt
    );

    const systemPrompt = `You are a tool selector. Analyze the user's request and return ONLY a JSON object if weather tools are needed.

Available tools:
1. {type: "fetchWeatherByCity", city: "cityname"} - Get weather for specific city (kolkata, mumbai, delhi, bangalore, howrah)
2. {type: "getCitiesByAQI", threshold: number, isHigher: boolean} - Get cities by air quality index

If the user asks about weather for a specific city, return the fetchWeatherByCity tool.
If the user asks about cities with high/low pollution or AQI, return the getCitiesByAQI tool.
If no weather tools are needed, return: {type: "none"}

Return ONLY the JSON object, nothing else.`;

    console.log("📤 [OllamaService] Sending tool selection request to Ollama");
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model,
      prompt: `${systemPrompt}\n\nUser: ${prompt}\n\nJSON:`,
      stream: false,
    });

    try {
      const toolCall = JSON.parse(response.data.response.trim());
      console.log("✅ [OllamaService] Tool selection result:", toolCall);
      return toolCall;
    } catch {
      console.log(
        "❌ [OllamaService] Failed to parse tool selection, defaulting to none"
      );
      return { type: "none" };
    }
  }

  private async callWeatherTool(toolCall: any): Promise<any> {
    console.log("🌤️ [OllamaService] Calling weather tool:", toolCall);

    switch (toolCall.type) {
      case "fetchWeatherByCity":
        console.log(
          `📍 [OllamaService] Fetching weather for city: ${toolCall.city}`
        );
        const cityWeather = await this.weatherService.getWeatherDataByCity(
          toolCall.city
        );
        console.log("✅ [OllamaService] City weather data retrieved");
        return cityWeather;

      case "getCitiesByAQI":
        console.log(
          `🏭 [OllamaService] Getting cities by AQI - threshold: ${toolCall.threshold}, isHigher: ${toolCall.isHigher}`
        );
        const aqiData = await this.weatherService.getCitiesByAQI(
          toolCall.threshold,
          toolCall.isHigher
        );
        console.log("✅ [OllamaService] AQI data retrieved");
        return aqiData;

      default:
        console.log("❌ [OllamaService] Unknown tool type:", toolCall.type);
        return null;
    }
  }

  async generateResponse(prompt: string, model: string = "llama2") {
    console.log("🚀 [OllamaService] Starting response generation");
    console.log("📝 [OllamaService] Prompt:", prompt);
    console.log("🤖 [OllamaService] Model:", model);

    try {
      // Step 1: Get tool selection
      console.log("📋 [OllamaService] Step 1: Getting tool selection");
      const toolCall = await this.getToolSelection(prompt, model);
      console.log("🔧 [OllamaService] Tool selected:", toolCall);
      let weatherData = null;
      if (toolCall.type !== "none") {
        // Step 2: Call weather service
        console.log("🔧 [OllamaService] Step 2: Calling weather service");
        weatherData = await this.callWeatherTool(toolCall);
        console.log("📊 [OllamaService] Weather data obtained:", !!weatherData);
      } else {
        console.log(
          "⏭️ [OllamaService] Step 2: Skipping weather service (no tool needed)"
        );
      }

      // Step 3: Generate final response
      console.log("💬 [OllamaService] Step 3: Generating final response");
      const systemPrompt = weatherData
        ? `You are a helpful AI assistant. Use the provided weather data to answer the user's question in a conversational way. Format the information clearly and naturally.\n\nWeather Data: ${JSON.stringify(
            weatherData,
            null,
            2
          )}`
        : `You are a helpful AI assistant. Answer the user's question naturally and conversationally.`;

      console.log(
        "📤 [OllamaService] Sending final response request to Ollama"
      );
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt: `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`,
        stream: false,
      });

      console.log(
        "✅ [OllamaService] Response generation completed successfully"
      );
      return {
        success: true,
        response: response.data.response,
        model,
        toolUsed: toolCall.type !== "none" ? toolCall : null,
      };
    } catch (error) {
      console.error("❌ [OllamaService] Error in generateResponse:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        model,
      };
    }
  }
}
