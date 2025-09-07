import axios from "axios";
import { WeatherService } from "./weather.service";

interface WeatherIntent {
  type:
    | "fetchWeatherByCity"
    | "getCitiesByAQI"
    | "getCitiesByTemperatureRange"
    | "none";
  city?: string;
  threshold?: number;
  isHigher?: boolean;
  minTemp?: number;
  maxTemp?: number;
  confidence?: number;
}

export class OllamaService {
  private baseUrl = "http://localhost:11434";
  private weatherService = new WeatherService();

  private availableCities = this.weatherService.getAllCities();

  private async intelligentWeatherIntentDetection(
    prompt: string,
    model: string
  ): Promise<WeatherIntent> {
    console.log(
      "🧠 [OllamaService] Analyzing weather intent for prompt:",
      prompt
    );

    const systemPrompt = `You are an intelligent weather intent analyzer. Analyze the user's prompt and determine if it is a request for weather information then analyze what information about the weather is being requested.

AVAILABLE CITIES: ${this.availableCities.join(", ")}

AVAILABLE TOOLS:
1. fetchWeatherByCity - Get complete weather data for a specific city
2. getCitiesByAQI - Get cities filtered by Air Quality Index
3. getCitiesByTemperatureRange - Get cities filtered by temperature range

ANALYSIS RULES:
1. If user mentions a specific city name (even variations like "Calcutta" for "Kolkata"), use fetchWeatherByCity
2. If user asks general "how is weather" without city, try to infer location or ask for default city (Kolkata)
3. If user asks about pollution, air quality, AQI, smog, etc., use getCitiesByAQI
4. If user asks about hot/cold cities, temperature comparisons, use getCitiesByTemperatureRange
5. If user asks about weather conditions (rain, sunny, etc.) without specifying, use getCitiesByTemperatureRange
6. If user prompt is unrelated to weather, return type "none"
7. If the prompt is related to code, programming, math, or other non-weather topics, return type "none"

CITY NAME VARIATIONS:
- Calcutta = Kolkata
- Bombay = Mumbai
- Bengaluru = Bangalore

EXAMPLES:
- "How is the weather?" → fetchWeatherByCity with city: "kolkata" (default)
- "Weather in Mumbai" → fetchWeatherByCity with city: "mumbai"
- "What is 2+2?" → type: "none"
- "Is it going to rain in Delhi?" → fetchWeatherByCity with city: "delhi"
- "Which cities have bad air quality?" → getCitiesByAQI with threshold: 100, isHigher: true
- "Show me cities with good AQI" → getCitiesByAQI with threshold: 100, isHigher: false
- "Is Delhi polluted?" → getCitiesByAQI with threshold: 100, isHigher: true
- "Is the air quality good in Bangalore?" → getCitiesByAQI with threshold: 100, isHigher: false
- "Less polluted cities" → getCitiesByAQI with threshold: 100, isHigher: false
- "Which cities are hot today?" → getCitiesByTemperatureRange with minTemp: 35
- "Cold places" → getCitiesByTemperatureRange with maxTemp: 25
- "Cities with temperature between 25 and 35" → getCitiesByTemperatureRange with minTemp: 25, maxTemp: 35
- Write a program to calculate factorial → type: "none"

OUTPUT FORMAT:
Respond only in JSON format with the following structure. Omit any fields that are not applicable.
Return ONLY a JSON object with this exact structure:
{
  "type": "tool_name",
  "city": "city_name_if_needed",
  "threshold": number_if_needed,
  "isHigher": boolean_if_needed,
  "minTemp": number_if_needed,
  "maxTemp": number_if_needed,
  "confidence": confidence_score_0_to_1
}

User prompt: "${prompt}"

JSON Response:`;

    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt: systemPrompt,
        stream: false,
      });

      const intentResult = JSON.parse(response.data.response.trim());
      console.log(
        "✅ [OllamaService] Intent analysis result:",
        JSON.stringify(intentResult)
      );

      return this.validateAndEnhanceIntent(intentResult, prompt);
    } catch (error) {
      console.log(
        "❌ [OllamaService] Failed to parse intent, using fallback logic"
      );
      return this.fallbackIntentDetection(prompt);
    }
  }

  private validateAndEnhanceIntent(
    intent: WeatherIntent,
    originalPrompt: string
  ): WeatherIntent {
    console.log("🔍 [OllamaService] Validating and enhancing intent");

    if (intent.type === "fetchWeatherByCity" && intent.city) {
      const normalizedCity = this.normalizeCityName(intent.city);
      if (this.availableCities.includes(normalizedCity)) {
        intent.city = normalizedCity;
      } else {
        console.log(
          `⚠️ [OllamaService] City '${intent.city}' not available, falling back`
        );
        intent.city = "kolkata";
      }
    }

    if (intent.type === "fetchWeatherByCity" && !intent.city) {
      intent.city = "kolkata";
    }

    if (intent.type === "getCitiesByAQI") {
      if (!intent.threshold) {
        intent.threshold = 100;
      }
      if (intent.isHigher === undefined) {
        intent.isHigher = true;
      }
    }

    if (intent.type === "getCitiesByTemperatureRange") {
      if (!intent.minTemp && !intent.maxTemp) {
        if (originalPrompt.toLowerCase().includes("hot")) {
          intent.minTemp = 35;
        } else if (
          originalPrompt.toLowerCase().includes("cold") ||
          originalPrompt.toLowerCase().includes("cool")
        ) {
          intent.maxTemp = 25;
        } else {
          intent.minTemp = 20;
          intent.maxTemp = 40;
        }
      }
    }

    return intent;
  }

  private fallbackIntentDetection(prompt: string): WeatherIntent {
    console.log("🔄 [OllamaService] Using fallback intent detection");

    const lowerPrompt = prompt.toLowerCase();

    for (const city of this.availableCities) {
      if (
        lowerPrompt.includes(city) ||
        (city === "kolkata" && lowerPrompt.includes("calcutta")) ||
        (city === "mumbai" && lowerPrompt.includes("bombay")) ||
        (city === "bangalore" && lowerPrompt.includes("bengaluru"))
      ) {
        return {
          type: "fetchWeatherByCity",
          city: city,
          confidence: 0.8,
        };
      }
    }

    const aqiKeywords = [
      "aqi",
      "air quality",
      "pollution",
      "smog",
      "polluted",
      "clean air",
    ];
    if (aqiKeywords.some((keyword) => lowerPrompt.includes(keyword))) {
      const isHigher =
        lowerPrompt.includes("high") ||
        lowerPrompt.includes("bad") ||
        lowerPrompt.includes("polluted");
      return {
        type: "getCitiesByAQI",
        threshold: 100,
        isHigher: isHigher,
        confidence: 0.7,
      };
    }

    const tempKeywords = ["hot", "cold", "temperature", "warm", "cool", "heat"];
    if (tempKeywords.some((keyword) => lowerPrompt.includes(keyword))) {
      let minTemp, maxTemp;
      if (lowerPrompt.includes("hot")) minTemp = 35;
      if (lowerPrompt.includes("cold") || lowerPrompt.includes("cool"))
        maxTemp = 25;

      return {
        type: "getCitiesByTemperatureRange",
        minTemp,
        maxTemp,
        confidence: 0.6,
      };
    }

    if (lowerPrompt.includes("weather") || lowerPrompt.includes("how is")) {
      return {
        type: "fetchWeatherByCity",
        city: "kolkata",
        confidence: 0.5,
      };
    }

    return { type: "none", confidence: 0 };
  }

  private normalizeCityName(city: string): string {
    const cityMap: { [key: string]: string } = {
      calcutta: "kolkata",
      bombay: "mumbai",
      bengaluru: "bangalore",
      "new delhi": "delhi",
    };

    const normalized = city.toLowerCase().trim();
    return cityMap[normalized] || normalized;
  }

  private async callWeatherTool(intent: WeatherIntent): Promise<any> {
    console.log(
      "🌤️ [OllamaService] Calling weather tool with intent:",
      JSON.stringify(intent)
    );

    switch (intent.type) {
      case "fetchWeatherByCity":
        console.log(
          `📍 [OllamaService] Fetching weather for city: ${intent.city}`
        );
        const cityWeather = await this.weatherService.getWeatherDataByCity(
          intent.city!
        );
        console.log("✅ [OllamaService] City weather data retrieved");
        return cityWeather;

      case "getCitiesByAQI":
        console.log(
          `🏭 [OllamaService] Getting cities by AQI - threshold: ${intent.threshold}, isHigher: ${intent.isHigher}`
        );
        const aqiData = await this.weatherService.getCitiesByAQI(
          intent.threshold!,
          intent.isHigher!
        );
        console.log("✅ [OllamaService] AQI data retrieved");
        return aqiData;

      case "getCitiesByTemperatureRange":
        console.log(
          `🌡️ [OllamaService] Getting cities by temperature - min: ${intent.minTemp}, max: ${intent.maxTemp}`
        );
        const tempData = await this.weatherService.getCitiesByTemperatureRange(
          intent.minTemp,
          intent.maxTemp
        );
        console.log("✅ [OllamaService] Temperature data retrieved");
        return tempData;

      default:
        console.log("❌ [OllamaService] Unknown tool type:", intent.type);
        return null;
    }
  }

  async generateResponse(prompt: string, model: string = "llama2") {
    console.log(
      `🚀 [OllamaService] Starting intelligent response generation with prompt: ${prompt}, model: ${model}`
    );

    try {
      const weatherIntent = await this.intelligentWeatherIntentDetection(
        prompt,
        model
      );
      console.log(
        "🎯 [OllamaService] Weather intent detected:",
        JSON.stringify(weatherIntent)
      );

      let weatherData = null;
      if (weatherIntent.type !== "none") {
        weatherData = await this.callWeatherTool(weatherIntent);
        console.log("📊 [OllamaService] Weather data obtained:", !!weatherData);
      } else {
        console.log(
          "⏭️ [OllamaService] Skipping weather service (no weather intent detected)"
        );
      }

      console.log("💬 [OllamaService] Generating final response");
      const systemPrompt = weatherData
        ? `You are a helpful weather assistant with access to current weather information. Answer the user's question directly and naturally using the weather information available to you.

IMPORTANT INSTRUCTIONS:
- Answer as if you have real-time weather knowledge, don't mention "based on data provided" or similar phrases
- Use markdown formatting for better readability
- Be conversational and friendly
- Format temperatures, AQI values, and weather conditions clearly
- When showing multiple cities, use tables or lists for better organization
- Include relevant details like humidity, wind speed, air quality when appropriate
- If user asks about temperature comparisons, give direct answers like "Bangalore is the coolest at 24°C"

FORMATTING GUIDELINES:
- Use **bold** for city names and important values
- Use proper markdown headers (## ###) for sections
- Use tables for comparing multiple cities
- Use bullet points or numbered lists when listing information
- Include emojis where appropriate (🌡️ for temperature, 🌧️ for rain, etc.)

Current Weather Information Available:
${JSON.stringify(weatherData, null, 2)}

Answer the user's question directly using this weather information.`
        : `You are a specialized weather assistant. I can only help with weather-related questions such as:

## What I can help with: 🌤️
- **Weather conditions** in specific cities (Kolkata, Mumbai, Delhi, Bangalore, Howrah)
- **Temperature comparisons** between cities
- **Air quality information** and pollution levels
- **Weather forecasts** and current conditions

## Examples of questions I can answer:
- "How's the weather in Mumbai?"
- "Which cities have the hottest weather today?"
- "Show me cities with good air quality"
- "What's the temperature in Bangalore?"

I'm sorry, but I cannot help with programming, coding, math problems, or other non-weather related topics. Please ask me about weather conditions instead! 🌦️`;

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
        weatherIntent: weatherIntent.type !== "none" ? weatherIntent : null,
        weatherData: weatherData,
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
