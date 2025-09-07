export const createWeatherIntentPrompt = (prompt: string, availableCities: string[]): string => {
  return `You are an intelligent weather intent analyzer. Analyze the user's prompt and determine if it is a request for weather information then analyze what information about the weather is being requested.

AVAILABLE CITIES: ${availableCities.join(", ")}

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
};
