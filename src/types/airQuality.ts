export interface AirQualityRecord {
  country: string;
  state: string;
  city: string;
  station: string;
  last_update: string;
  latitude: string;
  longitude: string;
  pollutant_id: string;
  min_value: string;
  max_value: string;
  avg_value: string;
}

export interface AirQualityResponse {
  title: string;
  created: number;
  updated: number;
  total: number;
  count: number;
  limit: string;
  offset: string;
  records: AirQualityRecord[];
}
