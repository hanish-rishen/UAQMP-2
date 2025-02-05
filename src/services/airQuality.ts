import { AirQualityResponse } from '@/types/airQuality';

const API_ENDPOINT = 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';

export async function getAirQualityData(apiKey: string) {
  try {
    const response = await fetch(`${API_ENDPOINT}?api-key=${apiKey}&format=json`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // For debugging

    return data as AirQualityResponse;
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    throw error;
  }
}
