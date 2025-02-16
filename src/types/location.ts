export interface LocationCoord {
  lat: number;
  lon: number;
}

export interface Location {
  coord: LocationCoord;
  cityName: string;
}

export interface SearchFeature {
  center: [number, number];
  place_name: string;
}

export interface MapLayer {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
}
