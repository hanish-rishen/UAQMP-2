import { getAirQualityData } from '@/services/airQuality';
import { getAirQualityInsights } from '@/services/gemini';
import { getWeatherData } from '@/services/weather';
import MapWrapper from '@/components/MapWrapper';
import WeatherCard from '@/components/WeatherCard';
import { Suspense } from 'react';
import { parseAIResponse } from '@/utils/parseAIResponse';
import AIAnalysisCard from '@/components/AIAnalysisCard';

function getPollutantColor(pollutantId: string, value: string): string {
  if (value === 'NA') return 'text-gray-400';
  const numValue = parseFloat(value);
  
  switch (pollutantId) {
    case 'PM2.5':
      return numValue > 60 ? 'text-red-600' : numValue > 30 ? 'text-yellow-600' : 'text-green-600';
    case 'PM10':
      return numValue > 100 ? 'text-red-600' : numValue > 50 ? 'text-yellow-600' : 'text-green-600';
    case 'SO2':
      return numValue > 80 ? 'text-red-600' : numValue > 40 ? 'text-yellow-600' : 'text-green-600';
    case 'NO2':
      return numValue > 80 ? 'text-red-600' : numValue > 40 ? 'text-yellow-600' : 'text-green-600';
    default:
      return 'text-blue-600';
  }
}

async function AirQualityCard({ locationKey, records }: any) {
  let aiInsights = '';
  let weatherData = null;

  try {
    const [aiResponse, weather] = await Promise.all([
      getAirQualityInsights(
        records[0].city,
        records.map((r: any) => ({ id: r.pollutant_id, value: r.avg_value }))
      ),
      getWeatherData(records[0].latitude, records[0].longitude)
    ]);

    aiInsights = aiResponse;
    weatherData = weather;
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  const { assessment, recommendations, weatherImpact } = parseAIResponse(aiInsights);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="border-b dark:border-gray-700 pb-4 mb-4">
        <h3 className="font-bold text-xl">{records[0].city}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{records[0].station}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{records[0].latitude}, {records[0].longitude}</span>
        </div>
      </div>
      
      {weatherData && (
        <div className="mb-6">
          <WeatherCard weather={weatherData} />
        </div>
      )}

      <div className="space-y-4">
        {records.map((record: any, idx: number) => (
          <div key={idx} className="flex justify-between items-baseline">
            <span className="text-gray-600 dark:text-gray-400">{record.pollutant_id}</span>
            <div className="text-right">
              <span className={`text-lg font-bold ${getPollutantColor(record.pollutant_id, record.avg_value)}`}>
                {record.avg_value === 'NA' ? 'N/A' : record.avg_value}
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Min: {record.min_value === 'NA' ? 'N/A' : record.min_value} | 
                Max: {record.max_value === 'NA' ? 'N/A' : record.max_value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium mb-4 text-lg">AI Analysis</h4>
        <AIAnalysisCard 
          assessment={assessment}
          recommendations={recommendations}
          weatherImpact={weatherImpact}
        />
      </div>
      
      <div className="mt-4 pt-4 border-t dark:border-gray-700 text-xs text-gray-400">
        Last updated: {new Date(records[0].last_update).toLocaleString()}
      </div>
    </div>
  );
}

export default async function Home() {
  let airQualityData = null;
  let error = null;

  try {
    airQualityData = await getAirQualityData(process.env.NEXT_PUBLIC_DATA_GOV_API_KEY!);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch data';
  }

  const groupedRecords = airQualityData?.records.reduce((acc, record) => {
    const key = `${record.city}-${record.station}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {} as Record<string, typeof airQualityData.records>) ?? {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Urban Air Quality Monitoring</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Last Updated: {airQualityData?.updated ? new Date(airQualityData.updated * 1000).toLocaleString() : 'N/A'}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error ? (
          <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <MapWrapper records={airQualityData?.records || []} />
            
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(groupedRecords).map(([locationKey, records]) => (
                <Suspense 
                  key={locationKey} 
                  fallback={
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  }
                >
                  <AirQualityCard locationKey={locationKey} records={records} />
                </Suspense>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
