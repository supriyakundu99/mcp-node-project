interface WeatherInfo {
  city: string;
  temperature: string;
  weather: string;
  forecast: {
    today: {
      condition: string;
      temperature: {
        max: string;
        min: string;
        feelsLike: string;
      };
      precipitation: {
        chance: string;
        amount: string;
      };
      wind: {
        speed: string;
        direction: string;
        gusts: string;
      };
    };
    tomorrow: {
      condition: string;
      temperature: {
        max: string;
        min: string;
      };
      precipitation: {
        chance: string;
      };
    };
  };
  current: {
    humidity: string;
    pressure: string;
    visibility: string;
    uvIndex: string;
    airQuality: {
      index: string;
      description: string;
    };
  };
}

interface WeatherData {
  cities: {
    [key: string]: WeatherInfo;
  };
}

export const weatherData: WeatherData = {
  cities: {
    kolkata: {
      city: "Kolkata",
      temperature: "34°C",
      weather: "Humid",
      forecast: {
        today: {
          condition: "Thunderstorms with heavy rainfall",
          temperature: {
            max: "36°C",
            min: "28°C",
            feelsLike: "39°C"
          },
          precipitation: {
            chance: "75%",
            amount: "25-30mm"
          },
          wind: {
            speed: "15 km/h",
            direction: "South-East",
            gusts: "25 km/h"
          }
        },
        tomorrow: {
          condition: "Scattered thunderstorms",
          temperature: {
            max: "35°C",
            min: "27°C"
          },
          precipitation: {
            chance: "60%"
          }
        }
      },
      current: {
        humidity: "74%",
        pressure: "1002 hPa",
        visibility: "7 km",
        uvIndex: "7",
        airQuality: {
          index: "156",
          description: "Unhealthy"
        }
      }
    },
    howrah: {
      city: "Howrah",
      temperature: "32°C",
      weather: "Partly Cloudy",
      forecast: {
        today: {
          condition: "Light rain with cloudy intervals",
          temperature: {
            max: "33°C",
            min: "26°C",
            feelsLike: "35°C"
          },
          precipitation: {
            chance: "65%",
            amount: "5-10mm"
          },
          wind: {
            speed: "12 km/h",
            direction: "South",
            gusts: "18 km/h"
          }
        },
        tomorrow: {
          condition: "Partly cloudy with occasional showers",
          temperature: {
            max: "32°C",
            min: "25°C"
          },
          precipitation: {
            chance: "40%"
          }
        }
      },
      current: {
        humidity: "68%",
        pressure: "1005 hPa",
        visibility: "8 km",
        uvIndex: "6",
        airQuality: {
          index: "142",
          description: "Unhealthy for Sensitive Groups"
        }
      }
    },
    mumbai: {
      city: "Mumbai",
      temperature: "29°C",
      weather: "Heavy Rain",
      forecast: {
        today: {
          condition: "Heavy monsoon rainfall with strong winds",
          temperature: {
            max: "30°C",
            min: "25°C",
            feelsLike: "32°C"
          },
          precipitation: {
            chance: "90%",
            amount: "100-150mm"
          },
          wind: {
            speed: "45 km/h",
            direction: "West",
            gusts: "65 km/h"
          }
        },
        tomorrow: {
          condition: "Continuous heavy rainfall",
          temperature: {
            max: "29°C",
            min: "24°C"
          },
          precipitation: {
            chance: "85%"
          }
        }
      },
      current: {
        humidity: "89%",
        pressure: "998 hPa",
        visibility: "3 km",
        uvIndex: "2",
        airQuality: {
          index: "82",
          description: "Moderate"
        }
      }
    },
    bangalore: {
      city: "Bangalore",
      temperature: "24°C",
      weather: "Pleasant",
      forecast: {
        today: {
          condition: "Mild and pleasant with light breeze",
          temperature: {
            max: "27°C",
            min: "19°C",
            feelsLike: "25°C"
          },
          precipitation: {
            chance: "20%",
            amount: "0-1mm"
          },
          wind: {
            speed: "14 km/h",
            direction: "North-East",
            gusts: "20 km/h"
          }
        },
        tomorrow: {
          condition: "Partly cloudy and pleasant",
          temperature: {
            max: "26°C",
            min: "18°C"
          },
          precipitation: {
            chance: "30%"
          }
        }
      },
      current: {
        humidity: "65%",
        pressure: "1012 hPa",
        visibility: "10 km",
        uvIndex: "5",
        airQuality: {
          index: "68",
          description: "Moderate"
        }
      }
    },
    delhi: {
      city: "Delhi",
      temperature: "38°C",
      weather: "Hot",
      forecast: {
        today: {
          condition: "Very hot and dry with clear skies",
          temperature: {
            max: "41°C",
            min: "29°C",
            feelsLike: "44°C"
          },
          precipitation: {
            chance: "0%",
            amount: "0mm"
          },
          wind: {
            speed: "8 km/h",
            direction: "West",
            gusts: "15 km/h"
          }
        },
        tomorrow: {
          condition: "Hot and sunny",
          temperature: {
            max: "40°C",
            min: "28°C"
          },
          precipitation: {
            chance: "5%"
          }
        }
      },
      current: {
        humidity: "35%",
        pressure: "1008 hPa",
        visibility: "6 km",
        uvIndex: "9",
        airQuality: {
          index: "198",
          description: "Unhealthy"
        }
      }
    }
  }
};
