'use client';

import { AirPollutionData } from '@/types/airQuality';
import { Location, SearchFeature } from '@/types/location';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import WeatherCard from './WeatherCard';
import AIAnalysisCard from './AIAnalysisCard';
import { getAirQualityInsights } from '@/services/gemini';
import { getWeatherData } from '@/services/weather';
import { parseAIResponse } from '@/utils/parseAIResponse';
import { getPollutantName } from '@/services/airQuality';
import LoadingSpinner from './LoadingSpinner';
import { WeatherData } from '@/types/weather';

interface AirQualityMapProps {
  records: (AirPollutionData & { cityName: string })[];
}

export default function AirQualityMap({ records }: AirQualityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const searchContainer = useRef<HTMLDivElement | null>(null);
  
  // Remove unused refs
  const isMounted = useRef(true);
  const isMapLoaded = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<AirPollutionData & { cityName: string } | null>(null);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<maplibregl.Marker | null>(null);
  const MAPTILER_KEY = 'MakFZUKozVFQcAOahegc';

  // Track mounted state to prevent state updates after unmount
  const mapFunctions = useRef({
    handleLocationSelect: null as ((location: Location) => void) | null,
    handleUserLocation: null as ((longitude: number, latitude: number, map: maplibregl.Map) => void) | null
  });

  // Add search functionality refs
  // Remove unused search refs
  // const searchBox = useRef<HTMLInputElement>(null);
  // const searchResults = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const showInitialMarkers = useCallback((mapInstance: maplibregl.Map) => {
    if (records?.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      records.forEach(record => {
        if (record.coord?.lat && record.coord?.lon) {
          bounds.extend([record.coord.lon, record.coord.lat]);
          new maplibregl.Marker({ color: '#0000FF', scale: 0.8 })
            .setLngLat([record.coord.lon, record.coord.lat])
            .setPopup(new maplibregl.Popup().setHTML(record.cityName))
            .addTo(mapInstance);
        }
      });
      mapInstance.fitBounds(bounds, { padding: 50 });
    }
  }, [records]);

  const handleLocationSelect = useCallback(async (location: Location) => {
    if (!map.current) return;
    setLoading(true);
    
    try {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
      }

      const { lat, lon } = location.coord;
      console.log('Handling location:', lat, lon); // Debug log

      // Create new marker
      const newMarker = new maplibregl.Marker({
        color: '#00FF00',
        scale: 1.2
      })
        .setLngLat([lon, lat])
        .addTo(map.current);
      
      selectedMarkerRef.current = newMarker;

      // Fetch air quality data first
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch air quality data');
      const airData = await response.json();

      // Get location name if needed
      if (location.cityName === 'Selected Location') {
        try {
          const geoResponse = await fetch(
            `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${MAPTILER_KEY}`
          );
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            location.cityName = geoData.features?.[0]?.place_name || 'Selected Location';
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
        }
      }

      // Update selected location after all data is fetched
      setSelectedLocation({
        ...airData,
        coord: { lat, lon },
        cityName: location.cityName
      });

      // Finally, fly to location
      map.current.flyTo({
        center: [lon, lat],
        zoom: 12,
        duration: 2000
      });

    } catch (error) {
      console.error('Error fetching location data:', error);
      setError('Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  }, [MAPTILER_KEY]);

  const handleUserLocation = useCallback((longitude: number, latitude: number, mapInstance: maplibregl.Map) => {
    if (!isMounted.current || !mapInstance) return;
    
    setUserLocation([longitude, latitude]);
    
    // Remove existing markers
    if (currentLocationMarker) {
      currentLocationMarker.remove();
    }
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
    }

    // Create and add new user marker
    const userMarker = new maplibregl.Marker({
      color: '#FF0000',
      scale: 1.2
    })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup().setHTML('Your Location'))
      .addTo(mapInstance);

    setCurrentLocationMarker(userMarker);

    mapInstance.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      duration: 2000
    });

    // Call handleLocationSelect directly instead of through ref
    handleLocationSelect({
      coord: { lat: latitude, lon: longitude },
      cityName: 'Current Location'
    });
  }, [currentLocationMarker, handleLocationSelect]);

  const handleSearchSelect = useCallback((feature: SearchFeature) => {
    if (!map.current) return;
    
    const [lon, lat] = feature.center;
    
    // Remove existing marker if any
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
    }

    // Create new marker and save to ref
    const newMarker = new maplibregl.Marker({
      color: '#00FF00',
      scale: 1.2
    })
      .setLngLat([lon, lat])
      .addTo(map.current);
    
    selectedMarkerRef.current = newMarker;

    // Fly to location
    map.current.flyTo({
      center: [lon, lat],
      zoom: 12,
      duration: 2000
    });

    // Fetch data for the location
    handleLocationSelect({
      coord: { lat, lon },
      cityName: feature.place_name
    });
  }, [handleLocationSelect]);

  // Update the ref when handleLocationSelect changes
  useEffect(() => {
    mapFunctions.current = {
      handleLocationSelect,
      handleUserLocation
    };
  }, [handleLocationSelect, handleUserLocation]);

  const initializeMap = useCallback(async () => {
    if (!mapContainer.current || map.current) return;

    try {
      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
        center: [85.1376, 25.5941],
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
        minZoom: 3,
        maxZoom: 20
      });

      // Wait for map to load
      await new Promise<void>((resolve) => {
        newMap.on('load', resolve);
      });

      map.current = newMap;

      // Add click handler immediately after map is loaded
      newMap.on('click', (e) => {
        const { lng: lon, lat } = e.lngLat;
        console.log('Map clicked:', lat, lon); // Debug log
        handleLocationSelect({
          coord: { lat, lon },
          cityName: 'Selected Location'
        });
      });

      // Get user location immediately
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            console.log('Got user location:', latitude, longitude); // Debug log
            handleLocationSelect({
              coord: { lat: latitude, lon: longitude },
              cityName: 'Current Location'
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            showInitialMarkers(newMap);
          }
        );
      }

      // Rest of map initialization (controls, 3D buildings, search)
      // Create an overlay that does not interfere with map events.
      const overlayContainer = document.createElement('div');
      overlayContainer.className = 'absolute inset-0 pointer-events-none';
      overlayContainer.style.zIndex = '1';
      mapContainer.current.appendChild(overlayContainer);

      if (!isMounted.current) return;
      map.current = newMap;
      isMapLoaded.current = true;

      newMap.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Add 3D buildings support
      {
        const style = newMap.getStyle();
        if (style && style.layers) {
          let labelLayerId = '';
          for (let i = 0; i < style.layers.length; i++) {
            const layer = style.layers[i];
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
              labelLayerId = layer.id;
              break;
            }
          }
          newMap.addSource('openmaptiles', {
            url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
            type: 'vector',
          });
          newMap.addLayer(
            {
              id: '3d-buildings',
              source: 'openmaptiles',
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 15,
              filter: ['!=', ['get', 'hide_3d'], true],
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'render_height'],
                  0,
                  'lightgray',
                  200,
                  'royalblue',
                  400,
                  'lightblue'
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  16,
                  ['get', 'render_height']
                ],
                // Replace fill-extrusion-base expression using "case" with an "interpolate" expression:
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  16,
                  ['get', 'render_min_height']
                ]
              }
            },
            labelLayerId || undefined
          );
        }
      }

      // Move search container outside the overlay so it’s reliably visible.
      const searchDiv = document.createElement('div');
      searchDiv.className = 'absolute top-4 left-4 w-64 pointer-events-auto';
      // Use a high z-index to keep it on top
      searchDiv.style.zIndex = '50';
      mapContainer.current.appendChild(searchDiv);
      searchContainer.current = searchDiv;

      // Add search input with explicit z-index
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search locations...';
      searchInput.className = 'w-full px-4 py-2 rounded-lg shadow-lg border border-gray-200 bg-white dark:bg-gray-800 dark:text-white';
      searchDiv.appendChild(searchInput);

      // Add search results container with higher z-index
      const resultsDiv = document.createElement('div');
      resultsDiv.className = 'absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hidden';
      resultsDiv.style.zIndex = '3';  // Add explicit z-index
      searchDiv.appendChild(resultsDiv);

      // Setup search functionality
      let searchTimeout: NodeJS.Timeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        if (searchInput.value.length < 3) {
          resultsDiv.classList.add('hidden');
          return;
        }

        searchTimeout = setTimeout(async () => {
          try {
            const response = await fetch(
              `https://api.maptiler.com/geocoding/${encodeURIComponent(searchInput.value)}.json?key=${MAPTILER_KEY}`
            );
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            resultsDiv.innerHTML = '';

            if (data.features?.length > 0) {
              resultsDiv.classList.remove('hidden');
              data.features.forEach((feature: SearchFeature) => {
                const item = document.createElement('div');
                item.className = 'px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200';
                item.textContent = feature.place_name;
                item.addEventListener('click', () => {
                  handleSearchSelect(feature);
                  searchInput.value = feature.place_name;
                  resultsDiv.classList.add('hidden');
                });
                resultsDiv.appendChild(item);
              });
            } else {
              resultsDiv.classList.add('hidden');
            }
          } catch (error) {
            console.error('Search error:', error);
          }
        }, 300);
      });

      // Setup click handler - bind to the map instance
      newMap.on('click', (e) => {
        if (!map.current) return;
        const { lng: lon, lat } = e.lngLat;
        handleLocationSelect({
          coord: { lat, lon },
          cityName: 'Selected Location'
        });
      });

      // Get user location first
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          if (isMounted.current) {
            const { longitude, latitude } = position.coords;
            handleUserLocation(longitude, latitude, newMap);
          }
        } catch (error) {
          console.error('Geolocation error:', error);
          // If geolocation fails, show initial markers
          showInitialMarkers(newMap);
        }
      } else {
        // If geolocation not available, show initial markers
        showInitialMarkers(newMap);
      }

    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  }, [MAPTILER_KEY, handleLocationSelect, handleUserLocation, handleSearchSelect, showInitialMarkers]);

  // Main cleanup effect with map removal
  useEffect(() => {
    initializeMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  return (
    <div className="flex h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Map Section */}
      <div className="w-3/4 relative">
        <div ref={mapContainer} className="w-full h-full" />
        {loading && (
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg z-10">
            Loading data...
          </div>
        )}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-50 text-red-600 p-4 rounded-lg mx-4 z-10">
            {error}
          </div>
        )}
        {userLocation && (
          <button 
            onClick={() => {
              // Fly to user's location
              map.current?.flyTo({
                center: userLocation,
                zoom: 10,
                duration: 2000
              });
              // Update data panel with current location details. 
              // Note: userLocation is [longitude, latitude]
              handleLocationSelect({
                coord: { lat: userLocation[1], lon: userLocation[0] },
                cityName: 'Current Location'
              });
            }}
            className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Return to your location"
          >
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Data Panel */}
      <div className="w-1/4 min-w-[400px] bg-white dark:bg-gray-800 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
        {selectedLocation ? (
          <div className="p-6">
            <LocationDetails location={selectedLocation} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-6">
            Select a location on the map to view details
          </div>
        )}
      </div>
    </div>
  );
}

// Update LocationDetails props type
interface LocationDetailsProps {
  location: AirPollutionData & { cityName: string };
}

function LocationDetails({ location }: LocationDetailsProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [aiInsights, setAiInsights] = useState<{
    assessment: string;
    recommendations: string[];
    weatherImpact: string[];
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    console.log('Loading details for location:', location);
    const fetchData = async () => {
      try {
        // Fetch weather data
        setWeatherLoading(true);
        const weather = await getWeatherData(
          location.coord.lat.toString(), 
          location.coord.lon.toString()
        );
        setWeatherData(weather);
        setWeatherLoading(false);

        // Fetch AI insights
        setAiLoading(true);
        const insights = await getAirQualityInsights(
          location.cityName,
          Object.entries(location.list[0].components).map(([key, value]) => ({
            id: getPollutantName(key),
            value: value.toString()
          }))
        );
        setAiInsights(parseAIResponse(insights));
        setAiLoading(false);
      } catch (error) {
        console.error('Error fetching location details:', error);
        setWeatherLoading(false);
        setAiLoading(false);
      }
    };
    fetchData();
  }, [location]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{location.cityName}</h2>
      
      {/* Weather Section */}
      <div className="bg-gradient-to-br from-sky-400/10 to-blue-500/10 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Weather Conditions</h3>
        {weatherLoading ? (
          <LoadingSpinner />
        ) : weatherData ? (
          <WeatherCard weather={weatherData} />
        ) : (
          <p className="text-red-500">Failed to load weather data</p>
        )}
      </div>

      {/* Pollutants Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Air Quality Measurements</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(location.list[0].components).map(([key, value]) => (
            <div key={key} className="bg-white dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-300">{getPollutantName(key)}</div>
              <div className="text-lg font-semibold">{Math.round(value)} μg/m³</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-br from-purple-400/10 to-blue-500/10 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
        {aiLoading ? (
          <LoadingSpinner />
        ) : aiInsights ? (
          <AIAnalysisCard 
            assessment={aiInsights.assessment}
            recommendations={aiInsights.recommendations}
            weatherImpact={aiInsights.weatherImpact}
          />
        ) : (
          <p className="text-red-500">Failed to load AI analysis</p>
        )}
      </div>
    </div>
  );
}
