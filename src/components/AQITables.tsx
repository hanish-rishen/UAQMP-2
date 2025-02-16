'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface NearbyAQI {
  name: string;
  distance: string;
  aqi: number;
  mainPollutant: string;
  riskLevel: string;
  recommendation: string;
}

interface CountryAQI {
  country: string;
  aqi: number;
  rank: number;
  change: 'up' | 'down' | 'same';
}

// Add interface for OpenWeatherMap location response
interface OpenWeatherLocation {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

// Add more specific type definitions
type SearchFunction = (query: string) => Promise<void>;
type GenericFunction = (...args: string[]) => Promise<void>;

type DebouncedFunction<T extends SearchFunction | GenericFunction> = (
  ...args: Parameters<T>
) => void;

// Add type for city coordinates
type CityCoordinates = {
  [key in 'london' | 'paris' | 'berlin' | 'beijing' | 'tokyo' | 'delhi' | 'new-york' | 'sydney']: {
    lat: number;
    lon: number;
  };
};

export default function AQITables() {
  const [activeTab, setActiveTab] = useState<'dangerous' | 'global'>('dangerous');
  const [nearbyLocations, setNearbyLocations] = useState<NearbyAQI[]>([]);
  const [globalRankings, setGlobalRankings] = useState<CountryAQI[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  const getNearbyCoordinates = (lat: number, lon: number, radius: number = 5) => {
    const coordinates = [];
    const steps = 8; // Number of points to sample
    const radiusInDegrees = radius / 111; // Approximate degrees per km

    // Add center point
    coordinates.push({ lat, lon });

    // Add points in a smaller circle (reduce radius)
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const r = radiusInDegrees * Math.random(); // Random distance within radius
      coordinates.push({
        lat: lat + r * Math.cos(angle),
        lon: lon + r * Math.sin(angle)
      });
    }

    // Add some random points within the radius
    for (let i = 0; i < 4; i++) {
      const r = Math.random() * radiusInDegrees;
      const angle = Math.random() * 2 * Math.PI;
      coordinates.push({
        lat: lat + r * Math.cos(angle),
        lon: lon + r * Math.sin(angle)
      });
    }

    return coordinates;
  };

  const getDistanceFromLatLonInKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Simplified Haversine formula for smaller distances
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    
    // Round to 1 decimal place
    return Math.round(distance * 10) / 10;
  }, []);

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const getMainPollutant = (components: Record<string, number>) => {
    const pollutants = Object.entries(components);
    const maxPollutant = pollutants.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    return maxPollutant[0].toUpperCase();
  };

  const getRecommendation = (aqi: number): string => {
    if (aqi > 150) {
      return 'Avoid this area. Severe health risks.';
    }
    if (aqi > 100) {
      return 'Limited exposure recommended. Use protection.';
    }
    if (aqi > 50) {
      return 'Moderate air quality. Sensitive individuals should be cautious.';
    }
    return 'Air quality is acceptable.';
  };

  // Update cityCoordinates with proper typing
  const cityCoordinates = useMemo<CityCoordinates>(() => ({
    'london': { lat: 51.5074, lon: -0.1278 },
    'paris': { lat: 48.8566, lon: 2.3522 },
    'berlin': { lat: 52.5200, lon: 13.4050 },
    'beijing': { lat: 39.9042, lon: 116.4074 },
    'tokyo': { lat: 35.6762, lon: 139.6503 },
    'delhi': { lat: 28.6139, lon: 77.2090 },
    'new-york': { lat: 40.7128, lon: -74.0060 },
    'sydney': { lat: -33.8688, lon: 151.2093 },
  }), []);

  const fetchDangerousLocations = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const nearbyPoints = getNearbyCoordinates(userLocation.lat, userLocation.lon, 15);
      
      const promises = nearbyPoints.map(async (point) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${point.lat}&lon=${point.lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch AQI data');
        const data = await response.json();

        const aqi = Math.round(data.list[0].main.aqi * 30 + 
          (data.list[0].components.pm2_5 / 10) +
          (data.list[0].components.pm10 / 20) +
          (data.list[0].components.no2 / 40)
        );
        
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${point.lat}&lon=${point.lon}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        const geoData = await geoResponse.json();
        const locationName = geoData[0]?.name || 'Unknown Location';

        const distance = getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lon,
          point.lat,
          point.lon
        );

        return {
          name: locationName,
          distance: `${distance.toFixed(1)} km`,
          aqi: aqi,
          mainPollutant: getMainPollutant(data.list[0].components),
          riskLevel: aqi > 150 ? 'Severe' : aqi > 100 ? 'High' : aqi > 50 ? 'Moderate' : 'Low',
          recommendation: getRecommendation(aqi),
          lat: point.lat,
          lon: point.lon // Added coordinates for deduplication
        };
      });

      const locations = await Promise.all(promises);
      
      // Remove duplicates by location name and keep the one with highest AQI
      const uniqueLocations = Array.from(
        locations
          .filter(location => location.aqi > 50)
          .reduce((map, location) => {
            const existing = map.get(location.name);
            if (!existing || existing.aqi < location.aqi) {
              map.set(location.name, location);
            }
            return map;
          }, new Map())
          .values()
      )
      .sort((a, b) => b.aqi - a.aqi);

      setNearbyLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching dangerous locations:', error);
    } finally {
      setLoading(false);
    }
  }, [userLocation, getDistanceFromLatLonInKm]);

  // Update fetchGlobalRankings to use type-safe city access
  const fetchGlobalRankings = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch data for major cities worldwide
      const majorCities = [
        { city: 'london' as const, country: 'UK' },
        { city: 'paris' as const, country: 'France' },
        { city: 'berlin' as const, country: 'Germany' },
        { city: 'beijing' as const, country: 'China' },
        { city: 'tokyo' as const, country: 'Japan' },
        { city: 'delhi' as const, country: 'India' },
        { city: 'new-york' as const, country: 'USA' },
        { city: 'sydney' as const, country: 'Australia' },
        // Add more cities as needed
      ] as const;

      const promises = majorCities.map(async ({ city, country }) => {
        const coords = cityCoordinates[city];
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?` +
          `lat=${coords.lat}&lon=${coords.lon}&` +
          `appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        
        if (!response.ok) throw new Error(`Failed to fetch data for ${city}`);
        const data = await response.json();
        
        return {
          country,
          aqi: data.list[0].main.aqi * 20,
          rank: 0, // Will be calculated after sorting
          change: 'same' as const
        };
      });

      const rankings = await Promise.all(promises);
      
      // Sort by AQI and assign ranks
      const sortedRankings = rankings
        .sort((a, b) => a.aqi - b.aqi)
        .map((ranking, index) => ({
          ...ranking,
          rank: index + 1
        }));

      setGlobalRankings(sortedRankings);
    } catch (error) {
      console.error('Error fetching global rankings:', error);
    } finally {
      setLoading(false);
    }
  }, [cityCoordinates]);

  // Update searchLocation function with proper typing
  const searchLocation = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsLoadingSearch(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data: OpenWeatherLocation[] = await response.json();
      
      const results = data.map((location) => ({
        name: `${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`,
        lat: location.lat,
        lon: location.lon
      }));
      
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  // Add debouncing to prevent too many API calls
  const debounce = <T extends SearchFunction>(
    func: T,
    delay: number
  ): DebouncedFunction<T> => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(query), delay);
    };
  };

  const debouncedSearch = debounce(searchLocation, 300);

  const handleSearchSelect = (location: { name: string; lat: number; lon: number }) => {
    setUserLocation({ lat: location.lat, lon: location.lon });
    setSelectedLocation(location.name);
    setSearchInput(location.name);
    setShowSearchResults(false);
  };

  // Memoize the fetch functions to fix exhaustive-deps warning
  const memoizedFetchDangerous = useCallback(() => {
    if (!userLocation) return;
    fetchDangerousLocations();
  }, [userLocation, fetchDangerousLocations]); // Added missing dependency

  const memoizedFetchGlobal = useCallback(() => {
    fetchGlobalRankings();
  }, [fetchGlobalRankings]); // Added missing dependency

  // Update useEffect to use memoized functions
  useEffect(() => {
    if (activeTab === 'dangerous' && userLocation) {
      memoizedFetchDangerous();
    } else if (activeTab === 'global') {
      memoizedFetchGlobal();
    }
  }, [activeTab, userLocation, memoizedFetchDangerous, memoizedFetchGlobal]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-100 text-green-800';
    if (aqi <= 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search location to check dangerous areas..."
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSearch(e.target.value);
              }}
            />
            {showSearchResults && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSearch ? (
                  <li className="px-4 py-2 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                    <LoadingSpinner />
                  </li>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <li
                      key={`${result.name}-${index}`}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200"
                      onClick={() => handleSearchSelect(result)}
                    >
                      {result.name}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    No locations found
                  </li>
                )}
              </ul>
            )}
          </div>
          <button
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                  });
                  setSelectedLocation('Current Location');
                  setSearchInput('Current Location');
                }
              );
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Use Current Location
          </button>
        </div>
        {selectedLocation && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing dangerous areas near: {selectedLocation}
          </p>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('dangerous')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'dangerous'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          Dangerous Areas
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'global'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          Global Rankings
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-gray-500">
            {selectedLocation 
              ? `Scanning for dangerous areas near ${selectedLocation}...`
              : 'Please select a location to scan for dangerous areas...'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                {activeTab === 'dangerous' ? (
                  <>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Distance</th>
                    <th className="px-4 py-2 text-left">Risk Level</th>
                    <th className="px-4 py-2 text-left">AQI</th>
                    <th className="px-4 py-2 text-left">Main Pollutant</th>
                    <th className="px-4 py-2 text-left">Recommendation</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Country</th>
                    <th className="px-4 py-2 text-left">AQI</th>
                    <th className="px-4 py-2 text-left">Change</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'dangerous' ? (
                nearbyLocations.length > 0 ? (
                  nearbyLocations.map((location, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-2">{location.name}</td>
                      <td className="px-4 py-2">{location.distance}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          location.riskLevel === 'Severe' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {location.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">
                          {location.aqi}
                        </span>
                      </td>
                      <td className="px-4 py-2">{location.mainPollutant}</td>
                      <td className="px-4 py-2 text-sm text-red-600">{location.recommendation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-green-600">
                      Good news! No dangerous areas found nearby.
                    </td>
                  </tr>
                )
              ) : (
                globalRankings.map((country) => (
                    <tr key={country.country} className="border-b dark:border-gray-700">
                      <td className="px-4 py-2">{country.rank}</td>
                      <td className="px-4 py-2">{country.country}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${getAQIColor(country.aqi)}`}>
                          {country.aqi}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {country.change === 'up' ? '↑' : country.change === 'down' ? '↓' : '−'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
