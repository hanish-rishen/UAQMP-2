import { AirPollutionData, BIHAR_CITIES } from '@/types/airQuality';

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

export async function getAirQualityData() {
  try {
    // Fetch air quality data for all cities in parallel
    const promises = BIHAR_CITIES.map(city => 
      fetch(`${BASE_URL}?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => ({
          ...data,
          cityName: city.name // Add city name to the response
        }))
    );

    const results = await Promise.all(promises);
    return results as (AirPollutionData & { cityName: string })[];
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    throw new Error('Failed to fetch air quality data');
  }
}

// Utility function to get AQI description
export function getAQIDescription(aqi: number): string {
  switch (aqi) {
    case 1: return 'Good';
    case 2: return 'Fair';
    case 3: return 'Moderate';
    case 4: return 'Poor';
    case 5: return 'Very Poor';
    default: return 'Unknown';
  }
}

// Utility function to get component name
export function getPollutantName(key: string): string {
  const names: Record<string, string> = {
    co: 'Carbon Monoxide',
    no: 'Nitrogen Monoxide',
    no2: 'Nitrogen Dioxide',
    o3: 'Ozone',
    so2: 'Sulphur Dioxide',
    pm2_5: 'PM2.5',
    pm10: 'PM10',
    nh3: 'Ammonia'
  };
  return names[key] || key;
}

// Get color based on AQI
export function getAQIColor(aqi: number): string {
  switch (aqi) {
    case 1: return 'text-green-600';
    case 2: return 'text-yellow-600';
    case 3: return 'text-orange-600';
    case 4: return 'text-red-600';
    case 5: return 'text-purple-600';
    default: return 'text-gray-600';
  }
}
