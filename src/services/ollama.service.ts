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

  // Available cities in our system
  private availableCities = this.weatherService.getAllCities();

  private async intelligentWeatherIntentDetection(
    prompt: string,
    model: string
  ): Promise<WeatherIntent> {
    console.log(
      "🧠 [OllamaService] Analyzing weather intent for prompt:",
      prompt
    );

    const systemPrompt = `You are an intelligent weather intent analyzer. Analyze the user's prompt and determine what weather information they need.

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

CITY NAME VARIATIONS:
- Calcutta = Kolkata
- Bombay = Mumbai
- Bengaluru = Bangalore

EXAMPLES:
- "How is the weather?" → fetchWeatherByCity with city: "kolkata" (default)
- "Weather in Mumbai" → fetchWeatherByCity with city: "mumbai"
- "Which cities have bad air quality?" → getCitiesByAQI with threshold: 100, isHigher: true
- "Show me cities with good AQI" → getCitiesByAQI with threshold: 100, isHigher: false
- "Which cities are hot today?" → getCitiesByTemperatureRange with minTemp: 35
- "Cold places" → getCitiesByTemperatureRange with maxTemp: 25
- "Cities with temperature between 25 and 35" → getCitiesByTemperatureRange with minTemp: 25, maxTemp: 35

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
      console.log("✅ [OllamaService] Intent analysis result:", intentResult);

      // Post-process and validate the result
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

    // If city is mentioned but not in available cities, try to map it
    if (intent.type === "fetchWeatherByCity" && intent.city) {
      const normalizedCity = this.normalizeCityName(intent.city);
      if (this.availableCities.includes(normalizedCity)) {
        intent.city = normalizedCity;
      } else {
        // City not available, fallback to general weather
        console.log(
          `⚠️ [OllamaService] City '${intent.city}' not available, falling back`
        );
        intent.city = "kolkata"; // Default city
      }
    }

    // If no city specified for fetchWeatherByCity, default to kolkata
    if (intent.type === "fetchWeatherByCity" && !intent.city) {
      intent.city = "kolkata";
    }

    // Validate AQI parameters
    if (intent.type === "getCitiesByAQI") {
      if (!intent.threshold) {
        intent.threshold = 100; // Default AQI threshold
      }
      if (intent.isHigher === undefined) {
        intent.isHigher = true; // Default to higher than threshold
      }
    }

    // Validate temperature parameters
    if (intent.type === "getCitiesByTemperatureRange") {
      // If no temperature specified, try to infer from prompt
      if (!intent.minTemp && !intent.maxTemp) {
        if (originalPrompt.toLowerCase().includes("hot")) {
          intent.minTemp = 35;
        } else if (
          originalPrompt.toLowerCase().includes("cold") ||
          originalPrompt.toLowerCase().includes("cool")
        ) {
          intent.maxTemp = 25;
        } else {
          // Default to moderate temperature range
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

    // Check for city mentions
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

    // Check for AQI/pollution keywords
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

    // Check for temperature keywords
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

    // Default to weather for current location (Kolkata)
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
    console.log("🌤️ [OllamaService] Calling weather tool with intent:", intent);

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
    console.log(`🚀 [OllamaService] Starting intelligent response generation with prompt: ${prompt}, model: ${model}`);

    try {
      const weatherIntent = await this.intelligentWeatherIntentDetection(
        prompt,
        model
      );
      console.log("🎯 [OllamaService] Weather intent detected:", weatherIntent);

      let weatherData = null;
      if (weatherIntent.type !== "none") {
        // Step 2: Call appropriate weather service
        console.log("🔧 [OllamaService] Step 2: Calling weather service");
        weatherData = await this.callWeatherTool(weatherIntent);
        console.log("📊 [OllamaService] Weather data obtained:", !!weatherData);
      } else {
        console.log(
          "⏭️ [OllamaService] Step 2: Skipping weather service (no weather intent detected)"
        );
      }

      // Step 3: Generate final response
      console.log("💬 [OllamaService] Step 3: Generating final response");
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
        : `You are a helpful AI assistant. Answer the user's question naturally and conversationally using markdown formatting. If they asked about weather but no specific weather data was found, politely explain what weather information you can help with and suggest they ask about specific cities (Kolkata, Mumbai, Delhi, Bangalore, Howrah).`;

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
