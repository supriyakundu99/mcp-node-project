import { weatherData, WeatherInfo } from "../data/weather-data";

// Additional interface for AQI results
interface AQICityResult {
  city: string;
  aqi: string;
  description: string;
  temperature: string;
  weather: string;
}

interface AQIFilterResult {
  count: number;
  threshold: number;
  condition: "higher" | "lower";
  cities: AQICityResult[];
}

// Interface for unknown city fallback
interface UnknownCityResult {
  city: "unknown";
  temperature: "unknown";
  weather: "unknown";
  forecast: "unknown";
  current: "unknown";
}

export class WeatherService {
  /**
   * Get weather data by city name
   * @param city - city name
   * @returns complete weather data for the specified city or unknown city fallback
   */
  getWeatherDataByCity = async (
    city: string
  ): Promise<WeatherInfo | UnknownCityResult> => {
    console.log("==== getWeatherDataByCity:", city);

    if (!city || typeof city !== "string") {
      throw new Error("City name must be a valid string");
    }

    const normalizedCity = city.toLowerCase().trim();
    const cityData = weatherData.cities[normalizedCity];

    if (cityData) {
      return cityData;
    }

    console.warn(`City "${city}" not found in weather data`);

    return {
      city: "unknown",
      temperature: "unknown",
      weather: "unknown",
      forecast: "unknown",
      current: "unknown",
    };
  };

  /**
   * Get cities by Air Quality Index (AQI)
   * @param threshold - AQI threshold
   * @param isHigher - if true, get cities with AQI higher than threshold; if false, get cities with AQI lower than threshold
   * @returns list of cities matching the AQI criteria
   */
  getCitiesByAQI = async (
    threshold: number,
    isHigher: boolean
  ): Promise<AQIFilterResult> => {
    console.log(
      `==== getCitiesByAQI: threshold ${threshold}, isHigher: ${isHigher}`
    );

    // Input validation
    if (typeof threshold !== "number" || isNaN(threshold) || threshold < 0) {
      throw new Error("Threshold must be a valid non-negative number");
    }

    if (typeof isHigher !== "boolean") {
      throw new Error("isHigher must be a boolean value");
    }

    try {
      const filteredCities = Object.entries(weatherData.cities)
        .filter(([_, cityData]) => {
          const aqi = parseInt(cityData.current.airQuality.index);
          return isHigher ? aqi > threshold : aqi < threshold;
        })
        .map(
          ([_, cityData]): AQICityResult => ({
            city: cityData.city,
            aqi: cityData.current.airQuality.index,
            description: cityData.current.airQuality.description,
            temperature: cityData.temperature,
            weather: cityData.weather,
          })
        );

      return {
        count: filteredCities.length,
        threshold: threshold,
        condition: isHigher ? "higher" : "lower",
        cities: filteredCities,
      };
    } catch (error) {
      console.error("Error filtering cities by AQI:", error);
      throw new Error("Failed to filter cities by AQI");
    }
  };

  /**
   * Get all available cities
   * @returns list of all city names
   */
  getAllCities = async (): Promise<string[]> => {
    console.log("==== getAllCities");
    return Object.keys(weatherData.cities);
  };

  /**
   * Get cities with specific weather condition
   * @param condition - weather condition to filter by
   * @returns cities matching the weather condition
   */
  getCitiesByWeatherCondition = async (
    condition: string
  ): Promise<WeatherInfo[]> => {
    console.log("==== getCitiesByWeatherCondition:", condition);

    if (!condition || typeof condition !== "string") {
      throw new Error("Weather condition must be a valid string");
    }

    const normalizedCondition = condition.toLowerCase();

    return Object.values(weatherData.cities).filter(
      (cityData) =>
        cityData.weather.toLowerCase().includes(normalizedCondition) ||
        cityData.forecast.today.condition
          .toLowerCase()
          .includes(normalizedCondition)
    );
  };

  /**
   * Get cities with extreme temperatures
   * @param minTemp - minimum temperature threshold (in Celsius, without °C)
   * @param maxTemp - maximum temperature threshold (in Celsius, without °C)
   * @returns cities within the temperature range
   */
  getCitiesByTemperatureRange = async (
    minTemp?: number,
    maxTemp?: number
  ): Promise<WeatherInfo[]> => {
    console.log(
      `==== getCitiesByTemperatureRange: min ${minTemp}, max ${maxTemp}`
    );

    return Object.values(weatherData.cities).filter((cityData) => {
      const temp = parseInt(cityData.temperature.replace("°C", ""));

      if (minTemp !== undefined && temp < minTemp) return false;
      if (maxTemp !== undefined && temp > maxTemp) return false;

      return true;
    });
  };
}
