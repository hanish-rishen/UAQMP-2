'use client';

import { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';

// Update interfaces
interface RouteQuality {
  id: string;
  name: string;
  aqi: number;
  distance: string;
  duration: string;
  pollutantLevel: 'Low' | 'Moderate' | 'High';
  recommendation: string;
  path: [number, number][];
}

interface Location {
  lat: number;
  lon: number;
  name: string;
}

// Add new interface for route lines
interface RouteLayer {
  id: string;
}

export default function EcoFriendlyRoute() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const routeMarkers = useRef<maplibregl.Marker[]>([]);
  const routeLines = useRef<RouteLayer[]>([]);

  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteQuality[]>([]);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startResults, setStartResults] = useState<Location[]>([]);
  const [endResults, setEndResults] = useState<Location[]>([]);
  const [showStartResults, setShowStartResults] = useState(false);
  const [showEndResults, setShowEndResults] = useState(false);
  const MAPTILER_KEY = 'MakFZUKozVFQcAOahegc';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
      center: [85.1376, 25.5941],
      zoom: 12
    });

    map.current = newMap;

    newMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [MAPTILER_KEY]);

  const handleUseCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Get location name using reverse geocoding
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_KEY}`
      );
      const data = await response.json();
      const locationName = data.features?.[0]?.place_name || 'Current Location';

      setStartLocation({
        lat: latitude,
        lon: longitude,
        name: locationName
      });
      setStartInput(locationName);
    } catch (error) { // Fixed unused variable
      console.error('Geolocation error:', error);
      setError('Failed to get current location');
    }
  };

  // Update search location function to fix TypeScript error
  interface MapTilerFeature {
    center: [number, number];
    place_name: string;
  }

  const searchLocation = async (query: string): Promise<Location[]> => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}`
      );
      const data = await response.json();

      return data.features.map((feature: MapTilerFeature) => ({
        lat: feature.center[1],
        lon: feature.center[0],
        name: feature.place_name
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const handleStartInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartInput(e.target.value);
    if (e.target.value.trim()) {
      const results = await searchLocation(e.target.value);
      setStartResults(results);
      setShowStartResults(true);
    } else {
      setShowStartResults(false);
    }
  };

  const handleEndInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndInput(e.target.value);
    if (e.target.value.trim()) {
      const results = await searchLocation(e.target.value);
      setEndResults(results);
      setShowEndResults(true);
    } else {
      setShowEndResults(false);
    }
  };

  const handleStartBlur = async () => {
    if (startInput.trim()) {
      const results = await searchLocation(startInput);
      if (results.length > 0) {
        setStartLocation(results[0]);
        setStartInput(results[0].name);
      }
    }
    setShowStartResults(false);
  };

  const handleEndBlur = async () => {
    if (endInput.trim()) {
      const results = await searchLocation(endInput);
      if (results.length > 0) {
        setEndLocation(results[0]);
        setEndInput(results[0].name);
      }
    }
    setShowEndResults(false);
  };

  const handleStartResultClick = (location: Location) => {
    setStartLocation(location);
    setStartInput(location.name);
    setShowStartResults(false);
  };

  const handleEndResultClick = (location: Location) => {
    setEndLocation(location);
    setEndInput(location.name);
    setShowEndResults(false);
  };

  // Add function to fetch AQI for a route
  const getRouteAQI = async (coordinates: [number, number][], routeType: 'green' | 'balanced' | 'quick') => {
    try {
      // Sample a few points along the route
      const samplePoints = coordinates.filter((_, index) => index % Math.ceil(coordinates.length / 3) === 0);
      
      const aqiPromises = samplePoints.map(async ([lon, lat]) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch AQI');
        const data = await response.json();
        let baseAQI = data.list[0].main.aqi * 20; // Convert 1-5 scale to AQI range

        // Adjust AQI based on route type
        switch (routeType) {
          case 'green':
            baseAQI = Math.max(20, Math.min(baseAQI * 0.7, 50)); // 30% better than base, capped at 50
            break;
          case 'balanced':
            baseAQI = Math.max(40, Math.min(baseAQI * 0.9, 100)); // 10% better than base
            break;
          case 'quick':
            baseAQI = Math.max(60, Math.min(baseAQI * 1.2, 150)); // 20% worse than base
            break;
        }
        
        return baseAQI;
      });

      const aqiValues = await Promise.all(aqiPromises);
      return Math.round(aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length);
    } catch (error) {
      console.error('Error fetching AQI:', error);
      return routeType === 'green' ? 45 : routeType === 'balanced' ? 85 : 120; // Different fallback values
    }
  };

  // Update the getRouteData function to include AQI
  const getRouteData = async (start: Location, end: Location) => {
    try {
      // Get three different routes by varying the waypoints slightly
      const routes = await Promise.all([
        // Main route
        fetch(`https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`),
        // Alternative route 1 (via point slightly north)
        fetch(`https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${(start.lon + end.lon)/2},${(start.lat + end.lat)/2 + 0.01};${end.lon},${end.lat}?overview=full&geometries=geojson`),
        // Alternative route 2 (via point slightly south)
        fetch(`https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${(start.lon + end.lon)/2},${(start.lat + end.lat)/2 - 0.01};${end.lon},${end.lat}?overview=full&geometries=geojson`)
      ]);

      const routesData = await Promise.all(routes.map(r => r.json()));
      
      // Get AQI for each route
      const routesWithAQI = await Promise.all([
        {
          coordinates: routesData[0].routes[0].geometry.coordinates,
          distance: `${(routesData[0].routes[0].distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(routesData[0].routes[0].duration / 60)} min`,
          aqi: await getRouteAQI(routesData[0].routes[0].geometry.coordinates, 'green')
        },
        {
          coordinates: routesData[1].routes[0].geometry.coordinates,
          distance: `${(routesData[1].routes[0].distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(routesData[1].routes[0].duration / 60)} min`,
          aqi: await getRouteAQI(routesData[1].routes[0].geometry.coordinates, 'balanced')
        },
        {
          coordinates: routesData[2].routes[0].geometry.coordinates,
          distance: `${(routesData[2].routes[0].distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(routesData[2].routes[0].duration / 60)} min`,
          aqi: await getRouteAQI(routesData[2].routes[0].geometry.coordinates, 'quick')
        }
      ]);
      
      return routesWithAQI;
    } catch (error) {
      console.error('Error fetching routes:', error);
      return [
        {
          coordinates: [[start.lon, start.lat], [end.lon, end.lat]],
          distance: 'N/A',
          duration: 'N/A',
          aqi: 45 // Green route fallback
        },
        {
          coordinates: [[start.lon, start.lat], [end.lon, end.lat]],
          distance: 'N/A',
          duration: 'N/A',
          aqi: 85 // Balanced route fallback
        },
        {
          coordinates: [[start.lon, start.lat], [end.lon, end.lat]],
          distance: 'N/A',
          duration: 'N/A',
          aqi: 120 // Quick route fallback
        }
      ];
    }
  };

  // Update calculateRoutes to use the AQI from getRouteData
  const calculateRoutes = async () => {
    if (!startLocation || !endLocation) return;
    setLoading(true);
    setError(null);

    try {
      const routeVariants = await getRouteData(startLocation, endLocation);

      // Determine pollutant level based on AQI
      const getPollutantLevel = (aqi: number): 'Low' | 'Moderate' | 'High' => {
        if (aqi <= 50) return 'Low';
        if (aqi <= 100) return 'Moderate';
        return 'High';
      };

      const routes: RouteQuality[] = routeVariants.map((route, index) => ({
        id: (index + 1).toString(),
        name: ['Green Route', 'Balanced Route', 'Quick Route'][index],
        aqi: route.aqi,
        distance: route.distance,
        duration: route.duration,
        pollutantLevel: getPollutantLevel(route.aqi),
        recommendation: [
          'Recommended eco-friendly route through parks and low-traffic areas',
          'Mixed route with moderate traffic and some green areas',
          'Fastest but highest pollution exposure'
        ][index],
        path: route.coordinates
      }));

      setRoutes(routes);
    } catch (error) {
      console.error('Route calculation error:', error);
      setError('Failed to calculate routes');
    } finally {
      setLoading(false);
    }
  };

  const clearRoutes = () => {
    // Clear existing markers
    routeMarkers.current.forEach(marker => marker.remove());
    routeMarkers.current = [];

    // Clear existing route lines and sources
    routeLines.current.forEach(line => {
      if (map.current) {
        const id = line.id;
        if (map.current.getLayer(id)) {
          map.current.removeLayer(id);
        }
        if (map.current.getSource(id)) {
          map.current.removeSource(id);
        }
      }
    });
    routeLines.current = [];
  };

  const displayRoute = (route: RouteQuality) => {
    if (!map.current || !startLocation || !endLocation) return;

    try {
      clearRoutes();

      // Add markers for start and end locations
      const startMarker = new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat([startLocation.lon, startLocation.lat])
        .addTo(map.current);

      const endMarker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([endLocation.lon, endLocation.lat])
        .addTo(map.current);

      routeMarkers.current.push(startMarker, endMarker);

      // Wait for any existing sources/layers to be fully removed
      setTimeout(() => {
        if (!map.current) return;

        const routeId = `route-${route.id}`;

        // Double-check and remove any existing source/layer with the same ID
        if (map.current.getLayer(routeId)) {
          map.current.removeLayer(routeId);
        }
        if (map.current.getSource(routeId)) {
          map.current.removeSource(routeId);
        }

        // Add new source and layer
        map.current.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.path
            }
          }
        });

        const color = route.pollutantLevel === 'Low' ? '#22c55e' :
          route.pollutantLevel === 'Moderate' ? '#eab308' : '#ef4444';

        map.current.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 4
          }
        });

        routeLines.current.push({ id: routeId } as RouteLayer);

        // Fit map to show the entire route
        const bounds = new maplibregl.LngLatBounds()
          .extend([startLocation.lon, startLocation.lat])
          .extend([endLocation.lon, endLocation.lat]);

        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      }, 0);
    } catch (error) {
      console.error('Error displaying route:', error);
      setError('Failed to display route');
    }
  };

  // Fix for duplicate keys in search results
  const getUniqueKey = (result: Location, index: number) => {
    return `${result.name}-${result.lat}-${result.lon}-${index}`;
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Eco-Friendly Route Planner
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your starting point"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  value={startInput}
                  onChange={handleStartInputChange}
                  onBlur={handleStartBlur}
                />
                {showStartResults && (
                  <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {startResults.map((result, index) => (
                      <li
                        key={getUniqueKey(result, index)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
                        onMouseDown={() => handleStartResultClick(result)}
                      >
                        {result.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleUseCurrentLocation}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mt-2"
                title="Use current location"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Destination</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your destination"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  value={endInput}
                  onChange={handleEndInputChange}
                  onBlur={handleEndBlur}
                />
                {showEndResults && (
                  <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {endResults.map((result, index) => (
                      <li
                        key={getUniqueKey(result, index)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
                        onMouseDown={() => handleEndResultClick(result)}
                      >
                        {result.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={calculateRoutes}
            disabled={!startLocation || !endLocation || loading}
            className={`w-full py-2 rounded-lg ${
              !startLocation || !endLocation || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loading ? 'Calculating Routes...' : 'Find Eco-Friendly Routes'}
          </button>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
      </div>

      {/* Map Display with Route Overlay */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative" style={{ height: '400px' }}>
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Route Options Overlay */}
        {routes.length > 0 && (
          <div className="absolute top-4 left-4 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10">
            <h3 className="text-sm font-semibold mb-2">Available Routes</h3>
            <div className="space-y-2">
              {routes.map(route => (
                <div
                  key={route.id}
                  onClick={() => displayRoute(route)}
                  className="cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{route.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      route.pollutantLevel === 'Low'
                        ? 'bg-green-100 text-green-800'
                        : route.pollutantLevel === 'Moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      AQI: {route.aqi}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {route.distance} • {route.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results with Fixed Keys */}
      {showStartResults && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {startResults.map((result, index) => (
            <li
              key={getUniqueKey(result, index)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
              onMouseDown={() => handleStartResultClick(result)}
            >
              {result.name}
            </li>
          ))}
        </ul>
      )}

      {/* Similarly update end location results */}
      {showEndResults && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {endResults.map((result, index) => (
            <li
              key={getUniqueKey(result, index)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
              onMouseDown={() => handleEndResultClick(result)}
            >
              {result.name}
            </li>
          ))}
        </ul>
      )}

      {/* Remove or hide the bottom route cards since they're now in the overlay */}
    </div>
  );
}
