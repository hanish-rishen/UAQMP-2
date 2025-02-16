export interface Coordinates {
  lat: number;
  lon: number;
}

export interface AirPollutionData {
  coord: Coordinates;
  list: Array<{
    main: {
      aqi: number;  // Air Quality Index (1-5)
    };
    components: {
      co: number;   // Carbon monoxide, μg/m3
      no: number;   // Nitrogen monoxide, μg/m3
      no2: number;  // Nitrogen dioxide, μg/m3
      o3: number;   // Ozone, μg/m3
      so2: number;  // Sulphur dioxide, μg/m3
      pm2_5: number;// Fine particles, μg/m3
      pm10: number; // Coarse particles, μg/m3
      nh3: number;  // Ammonia, μg/m3
    };
    dt: number;     // Timestamp
  }>;
}

export interface CityLocation {
  name: string;
  lat: number;
  lon: number;
}

// Bihar major cities coordinates
export const BIHAR_CITIES: CityLocation[] = [
  { name: "Patna", lat: 25.5941, lon: 85.1376 },
  { name: "Gaya", lat: 24.7914, lon: 85.0002 },
  { name: "Muzaffarpur", lat: 26.1209, lon: 85.3647 },
  { name: "Bhagalpur", lat: 25.2425, lon: 87.0169 },
  { name: "Darbhanga", lat: 26.1542, lon: 85.8918 },
  { name: "Purnia", lat: 25.7771, lon: 87.4753 },
  { name: "Arrah", lat: 25.5541, lon: 84.6668 },
  { name: "Bihar Sharif", lat: 25.1988, lon: 85.5244 },
  { name: "Begusarai", lat: 25.4182, lon: 86.1272 },
  { name: "Katihar", lat: 25.5391, lon: 87.5719 },
  { name: "Munger", lat: 25.3708, lon: 86.4734 },
  { name: "Chapra", lat: 25.7815, lon: 84.7503 },
  { name: "Samastipur", lat: 25.8560, lon: 85.7789 },
  { name: "Motihari", lat: 26.6469, lon: 84.9158 },
  { name: "Bettiah", lat: 26.8026, lon: 84.5030 }
];
