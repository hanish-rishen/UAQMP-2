'use client';

import { AirPollutionData } from '@/types/airQuality';
import AirQualityMap from './AirQualityMap';

interface MapWrapperProps {
  records: (AirPollutionData & { cityName: string })[];
}

export default function MapWrapper({ records }: MapWrapperProps) {
  // Validate records before rendering map
  const validRecords = records?.filter(record => 
    record?.coord?.lat != null && 
    record?.coord?.lon != null
  );

  if (!validRecords || validRecords.length === 0) {
    return (
      <div className="h-[500px] w-full rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
        No location data available
      </div>
    );
  }

  return <AirQualityMap records={validRecords} />;
}
