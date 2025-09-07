import axios from "axios";
import { WeatherService } from "../system/weather.service";
import { createWeatherIntentPrompt } from "../../prompts/weather-intent.prompt";
import { createWeatherResponsePrompt, NON_WEATHER_RESPONSE_PROMPT } from "../../prompts/weather-response.prompt";

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

export class WeatherOllamaService {
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

    const systemPrompt = createWeatherIntentPrompt(prompt, this.availableCities);

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
        intent.city = "Unknown";
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
        ? createWeatherResponsePrompt(weatherData)
        : NON_WEATHER_RESPONSE_PROMPT;

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
