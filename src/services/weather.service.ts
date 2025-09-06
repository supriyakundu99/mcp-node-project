import { weatherData } from "../data/weather-data";

export class WeatherService {
  getWeatherDataByCity = async (city: string) => {
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

  getCitiesByAQI = async (threshold: number, isHigher: boolean) => {
    console.log(
      `==== getCitiesByAQI: threshold ${threshold}, isHigher: ${isHigher}`
    );

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
        weather: cityData.weather,
      }));

    return {
      count: filteredCities.length,
      threshold: threshold,
      condition: isHigher ? "higher" : "lower",
      cities: filteredCities,
    };
  };
}
