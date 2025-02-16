'use client';
import { useState, useEffect } from 'react';
import { getAirQualityData } from '@/services/airQuality';
import MapWrapper from '@/components/MapWrapper';
import AQTrendChart from '@/components/AQTrendChart';
import { AirPollutionData } from '@/types/airQuality';
import EcoFriendlyRoute from '@/components/EcoFriendlyRoute';
import AQITables from '@/components/AQITables';

export default function Home() {
  const [airQualityData, setAirQualityData] = useState<(AirPollutionData & { cityName: string })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAirQualityData();
        setAirQualityData(data);
      } catch {
        setError('Failed to fetch air quality data');
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Urban Air Quality Monitoring</h1>
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          <>
            <MapWrapper records={airQualityData} />
            <AQTrendChart />
            <EcoFriendlyRoute />
            <AQITables />
          </>
        )}
      </div>
    </div>
  );
}
