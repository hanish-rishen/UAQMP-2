'use client';

import dynamic from 'next/dynamic';
import { AirQualityRecord } from '@/types/airQuality';

const AirQualityMap = dynamic(
  () => import('@/components/AirQualityMap'),
  { ssr: false }
);

export default function MapWrapper({ records }: { records: AirQualityRecord[] }) {
  return (
    <div className="mb-8">
      <AirQualityMap records={records} />
    </div>
  );
}
