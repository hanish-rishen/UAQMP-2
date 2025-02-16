declare global {
  interface Window {
    maptilerGeocoder: {
      GeocodingControl: new (options: {
        apiKey: string;
        coordinates?: boolean;
        language?: string;
        placeholder?: string;
      }) => unknown;
    };
    maptilerAutocomplete: new (options: {
      key: string;
      input: HTMLInputElement;
      limit?: number;
      onSelect?: (item: unknown) => void;
    }) => unknown;
    maptilersdk: {
      Geocoder: new (options: {
        input: HTMLElement;
        key: string;
        placeholder?: string;
        proximity?: [number, number];
        countries?: string[];
        language?: string;
        onSelect?: (item: unknown) => void;
      }) => unknown;
    };
  }
}

export {};
