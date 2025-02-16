export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  visibility: number;
  wind: {
    speed: number;
  };
}

export interface WeatherResponse {
  data: WeatherData;
}
