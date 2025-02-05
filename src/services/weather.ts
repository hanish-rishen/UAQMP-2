import { WeatherData } from '@/types/weather';

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function getWeatherData(lat: string, lon: string) {
  try {
    const response = await fetch(
      `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      throw new Error('Weather data fetch failed');
    }

    return await response.json() as WeatherData;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}
