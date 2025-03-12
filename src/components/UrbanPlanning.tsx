"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { debounce } from "lodash";

// Update AirQualityComponents to include index signature for string type
interface AirQualityComponents {
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
  [key: string]: number; // Add index signature to satisfy Record<string, number>
}

interface AirQualityList {
  main: {
    aqi: number;
  };
  components: AirQualityComponents;
  dt: number;
}

interface AirQualityData {
  list: AirQualityList[];
  coord: {
    lat: number;
    lon: number;
  };
}

// Keep existing interfaces
interface UrbanPlanningData {
  treeCoverNeeded: number;
  greenSpaceRequired: number;
  pollutantReduction: {
    pm25: number;
    no2: number;
    o3: number;
  };
  recommendations: string[];
  implementationCost: {
    low: number;
    high: number;
  };
  timeline: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
  };
}

interface LocationData {
  lat: number;
  lon: number;
  name: string;
}

interface SearchResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

// Create a memoized slider component to prevent re-rendering of the slider itself
const DensitySlider = memo(
  ({
    value,
    onChange,
    onChangeCommitted,
  }: {
    value: number;
    onChange: (value: number) => void;
    onChangeCommitted: (value: number) => void;
  }) => {
    const [localValue, setLocalValue] = useState(value);
    const [showTooltip, setShowTooltip] = useState(false);
    const sliderRef = useRef<HTMLInputElement>(null);

    // Update local value when prop value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      setLocalValue(newValue);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      onChangeCommitted(localValue);
    };

    return (
      <div className="mb-6 relative">
        <label htmlFor="density" className="block text-sm font-medium mb-1">
          Population Density (people/km²)
        </label>
        <div className="relative">
          <input
            ref={sliderRef}
            type="range"
            id="density"
            min="1000"
            max="20000"
            step="500"
            value={localValue}
            onChange={handleChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />

          {/* Custom tooltip that follows the slider thumb */}
          {showTooltip && (
            <div
              className="absolute -top-8 px-2 py-1 bg-gray-800 text-white text-xs rounded pointer-events-none transform -translate-x-1/2"
              style={{
                left: `${((localValue - 1000) / (20000 - 1000)) * 100}%`,
              }}
            >
              {localValue.toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low (1,000)</span>
          <span>Medium (10,000)</span>
          <span>High (20,000)</span>
        </div>
        <p className="text-sm text-center mt-2">
          Current:{" "}
          <span className="font-semibold">{localValue.toLocaleString()}</span>{" "}
          people/km²
        </p>
      </div>
    );
  }
);

DensitySlider.displayName = "DensitySlider";

// Memoize the recommendations display component to prevent unnecessary re-renders
const PlanningRecommendations = memo(
  ({ planningData }: { planningData: UrbanPlanningData }) => {
    // Add USD to INR conversion rate (approximate)
    const usdToInrRate = 83.5;

    // Calculate costs in INR (1 thousand USD = 83,500 INR)
    const lowCostInr = Math.round(
      planningData.implementationCost.low * usdToInrRate
    );
    const highCostInr = Math.round(
      planningData.implementationCost.high * usdToInrRate
    );

    return (
      <div className="space-y-6">
        {/* Requirements Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-medium text-green-700 dark:text-green-400">
              Green Infrastructure Needed
            </h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between">
                <span>Tree Cover:</span>
                <span className="font-semibold">
                  {planningData.treeCoverNeeded} hectares
                </span>
              </div>
              <div className="flex justify-between">
                <span>Green Space:</span>
                <span className="font-semibold">
                  {planningData.greenSpaceRequired} hectares
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Trees:</span>
                <span className="font-semibold">
                  {Math.round(
                    planningData.treeCoverNeeded * 300
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-700 dark:text-blue-400">
              Potential Pollutant Reduction
            </h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between">
                <span>PM2.5:</span>
                <span className="font-semibold">
                  ↓ {planningData.pollutantReduction.pm25}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>NO₂:</span>
                <span className="font-semibold">
                  ↓ {planningData.pollutantReduction.no2}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>O₃:</span>
                <span className="font-semibold">
                  ↓ {planningData.pollutantReduction.o3}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Cost - Updated to include INR */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h3 className="font-medium text-purple-700 dark:text-purple-400">
            Implementation Cost Estimate
          </h3>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span>USD:</span>
              <span className="font-semibold">
                ${planningData.implementationCost.low.toLocaleString()} - $
                {planningData.implementationCost.high.toLocaleString()} thousand
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>INR:</span>
              <span className="font-semibold">
                ₹{lowCostInr.toLocaleString()} - ₹{highCostInr.toLocaleString()}{" "}
                lakhs
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Includes tree planting, green space development, and maintenance
              costs for first 3 years
            </div>
          </div>
        </div>

        {/* Specific Recommendations */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h3 className="font-medium text-yellow-700 dark:text-yellow-400">
            Strategic Recommendations
          </h3>
          <ul className="mt-3 space-y-2">
            {planningData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            Environmental Impact Timeline
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex mb-2">
                <div className="w-1/3 text-center text-sm font-medium">
                  Short-term (1-2 Years)
                </div>
                <div className="w-1/3 text-center text-sm font-medium">
                  Medium-term (3-5 Years)
                </div>
                <div className="w-1/3 text-center text-sm font-medium">
                  Long-term (5+ Years)
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 p-2">
                  {planningData.timeline.shortTerm}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 p-2">
                  {planningData.timeline.mediumTerm}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 p-2">
                  {planningData.timeline.longTerm}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PlanningRecommendations.displayName = "PlanningRecommendations";

export default function UrbanPlanning() {
  const [planningData, setPlanningData] = useState<UrbanPlanningData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [populationDensity, setPopulationDensity] = useState<number>(5000);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [aqiData, setAqiData] = useState<AirQualityData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Use Gemini to generate urban planning recommendations
  const generateUrbanPlanningRecommendations = useCallback(
    async (
      locationName: string,
      aqi: number,
      components: Record<string, number>,
      density: number
    ) => {
      setAnalyzeLoading(true);

      try {
        console.log("Generating recommendations for:", locationName, {
          aqi,
          density,
        });

        const prompt = `
        You are an urban planning and environmental expert. Using AI, create a comprehensive urban greening plan to improve air quality for 
        ${locationName} with the following air pollution data:
        
        - AQI Level: ${aqi} (on a scale of 1-5, where 5 is most polluted)
        - PM2.5: ${components.pm2_5} μg/m³
        - PM10: ${components.pm10} μg/m³
        - NO2: ${components.no2} μg/m³
        - O3: ${components.o3} μg/m³
        - SO2: ${components.so2} μg/m³
        - CO: ${components.co} μg/m³
        - Population density: ${density} people per km²
        
        Return ONLY a valid JSON object with NO explanatory text or markdown formatting. The JSON should have this structure:
        {
          "treeCoverNeeded": [number of hectares needed],
          "greenSpaceRequired": [number of hectares needed],
          "pollutantReduction": {
            "pm25": [percentage reduction possible],
            "no2": [percentage reduction possible],
            "o3": [percentage reduction possible]
          },
          "recommendations": [
            "specific recommendation 1",
            "specific recommendation 2",
            "specific recommendation 3",
            "specific recommendation 4",
            "specific recommendation 5"
          ],
          "implementationCost": {
            "low": [lower estimate in thousands of dollars],
            "high": [higher estimate in thousands of dollars]
          },
          "timeline": {
            "shortTerm": "Short-term (1-2 years) impacts description",
            "mediumTerm": "Medium-term (3-5 years) impacts description",
            "longTerm": "Long-term (5+ years) impacts description"
          }
        }
      `;

        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          console.error(
            "API response not OK:",
            response.status,
            response.statusText
          );
          throw new Error("Failed to generate recommendations");
        }

        const data = await response.json();
        console.log("API response received", { hasText: !!data.text });

        try {
          // Clean and parse the response
          let jsonText = data.text || "";

          // Remove any markdown code block markers, backticks, or language identifiers
          jsonText = jsonText.replace(/```(json|javascript)?|```/g, "").trim();

          const parsedData = JSON.parse(jsonText);

          setPlanningData(parsedData);
        } catch (error) {
          console.error("Error parsing JSON response:", error);
          setError("Failed to parse AI recommendations");
        }
      } catch (error) {
        console.error("Error generating recommendations with Gemini:", error);
        setError("Failed to generate urban planning recommendations");

        // Fallback to some reasonable values if Gemini fails
        generateFallbackRecommendations(locationName, aqi, components, density);
      } finally {
        setAnalyzeLoading(false);
      }
    },
    []
  );

  // Fallback function if Gemini fails
  const generateFallbackRecommendations = (
    locationName: string,
    aqi: number,
    components: Record<string, number>,
    density: number
  ) => {
    // Calculate reasonable fallback values based on the input data
    const treeCoverFactor = (aqi / 5) * 1.5;
    const treeCoverNeeded =
      Math.round((density / 1000) * treeCoverFactor * 10) / 10;
    const greenSpaceRequired =
      Math.round((density / 10000) * (1 + aqi / 5) * 10) / 10;

    const pm25Reduction = Math.min(95, Math.round(10 + components.pm2_5 / 5));
    const no2Reduction = Math.min(90, Math.round(15 + components.no2 / 10));
    const o3Reduction = Math.min(85, Math.round(8 + components.o3 / 15));

    const baseCost = treeCoverNeeded * 25 + greenSpaceRequired * 40;
    const lowCost = Math.round(baseCost * 0.8);
    const highCost = Math.round(baseCost * 1.5);

    const fallbackData = {
      treeCoverNeeded,
      greenSpaceRequired,
      pollutantReduction: {
        pm25: pm25Reduction,
        no2: no2Reduction,
        o3: o3Reduction,
      },
      recommendations: [
        `Plant ${Math.round(
          treeCoverNeeded * 300
        )} trees in urban areas, focusing on major roadways and industrial zones.`,
        `Create ${greenSpaceRequired} hectares of new parks and green corridors to improve air circulation.`,
        `Implement green roofs on ${Math.round(
          density / 500
        )} public buildings to absorb pollutants.`,
        `Establish ${Math.round(
          treeCoverNeeded / 2
        )} km of tree-lined pedestrian and bicycle paths.`,
        `Create ${Math.round(
          greenSpaceRequired / 3
        )} vertical gardens on building facades in high-density areas.`,
      ],
      implementationCost: {
        low: lowCost,
        high: highCost,
      },
      timeline: {
        shortTerm:
          "Immediate benefits through basic tree planting and community gardens.",
        mediumTerm:
          "Noticeable improvement as trees mature and green corridors are established.",
        longTerm:
          "Significant urban temperature reduction and air quality improvement through established urban forest.",
      },
    };

    setPlanningData(fallbackData);
  };

  // Fetch air quality data for a location
  const fetchAirQualityData = async (
    lat: number,
    lon: number
  ): Promise<AirQualityData | null> => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );

      if (!response.ok) throw new Error("Failed to fetch air quality data");
      return (await response.json()) as AirQualityData;
    } catch (error) {
      console.error("Error fetching air quality data:", error);
      setError("Failed to fetch air quality data for this location");
      return null;
    }
  };

  // Search for locations based on user input
  const searchLocations = useCallback((query: string) => {
    const fetchLocations = async () => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
            query
          )}&limit=5&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );

        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();

        const results = data.map(
          (item: {
            name: string;
            country: string;
            state?: string;
            lat: number;
            lon: number;
          }) => ({
            name: item.name,
            country: item.country,
            state: item.state,
            lat: item.lat,
            lon: item.lon,
          })
        );

        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
        setError("Failed to search for locations");
      } finally {
        setSearchLoading(false);
      }
    };

    // Create the debounced function inside the callback
    const debouncedFetch = debounce(() => {
      fetchLocations();
    }, 500);

    // Execute the debounced function
    debouncedFetch();
  }, []); // Empty dependency array since we're not using external variables

  // Handle location selection from search results
  const handleLocationSelect = async (result: SearchResult) => {
    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const locationName = `${result.name}${
        result.state ? `, ${result.state}` : ""
      }, ${result.country}`;

      setLocation({
        lat: result.lat,
        lon: result.lon,
        name: locationName,
      });

      setSearchInput(locationName);

      // Fetch air quality data for this location
      const airQualityData = await fetchAirQualityData(result.lat, result.lon);
      if (!airQualityData) return;

      setAqiData(airQualityData);

      // Generate urban planning recommendations using Gemini
      const aqi = airQualityData.list[0].main.aqi;
      const components = airQualityData.list[0].components;

      await generateUrbanPlanningRecommendations(
        locationName,
        aqi,
        components,
        populationDensity
      );
    } catch (error) {
      console.error("Error selecting location:", error);
      setError("Failed to load data for this location");
    } finally {
      setLoading(false);
    }
  };

  // Use current location
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Get location name from coordinates
      const locationResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );

      if (!locationResponse.ok) throw new Error("Failed to get location name");
      const locationData = await locationResponse.json();

      const locationName = locationData[0]?.name
        ? `${locationData[0].name}${
            locationData[0].state ? `, ${locationData[0].state}` : ""
          }, ${locationData[0].country}`
        : "Current Location";

      setLocation({
        lat: latitude,
        lon: longitude,
        name: locationName,
      });

      setSearchInput(locationName);

      // Fetch air quality data for current location
      const airQualityData = await fetchAirQualityData(latitude, longitude);
      if (!airQualityData) return;

      setAqiData(airQualityData);

      // Generate urban planning recommendations
      const aqi = airQualityData.list[0].main.aqi;
      const components = airQualityData.list[0].components;

      await generateUrbanPlanningRecommendations(
        locationName,
        aqi,
        components,
        populationDensity
      );
    } catch (error) {
      console.error("Error getting current location:", error);
      setError("Failed to get your current location");
    } finally {
      setLoading(false);
    }
  };

  // Update recommendations when population density changes
  const handleDensityChange = (newDensity: number) => {
    setPopulationDensity(newDensity);
  };

  const handleDensityChangeCommitted = useCallback(
    async (newDensity: number) => {
      if (location && aqiData) {
        setAnalyzeLoading(true);

        try {
          const aqi = aqiData.list[0].main.aqi;
          const components = aqiData.list[0].components;

          await generateUrbanPlanningRecommendations(
            location.name,
            aqi,
            components,
            newDensity
          );
        } catch (error) {
          console.error("Error updating with new density:", error);
        } finally {
          setAnalyzeLoading(false);
        }
      }
    },
    [location, aqiData, generateUrbanPlanningRecommendations]
  );

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchLocations(value);
  };

  const isLoading = loading || analyzeLoading;

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        Urban Planning Recommendations
      </h2>

      {/* Search and location selection */}
      <div className="mb-6">
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Select Location
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                id="location"
                placeholder="Search for a city..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                value={searchInput}
                onChange={handleSearchInputChange}
                autoComplete="off"
              />
              {searchLoading && (
                <div className="absolute right-3 top-3">
                  <div className="w-5 h-5 border-t-2 border-green-500 border-solid rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              onClick={handleUseCurrentLocation}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Use My Location</span>
            </button>
          </div>

          {/* Search results */}
          {showResults && (
            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <li
                  key={`${result.name}-${result.lat}-${result.lon}-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {result.state && `${result.state}, `}
                    {result.country}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center py-10">
          <LoadingSpinner />
          <p className="mt-4 text-gray-500">
            {loading
              ? "Fetching location data..."
              : "Analyzing and generating recommendations..."}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Main content - only show when data is loaded */}
      {!isLoading && !error && location && planningData && (
        <>
          <DensitySlider
            value={populationDensity}
            onChange={handleDensityChange}
            onChangeCommitted={handleDensityChangeCommitted}
          />

          <PlanningRecommendations planningData={planningData} />
        </>
      )}
    </div>
  );
}
