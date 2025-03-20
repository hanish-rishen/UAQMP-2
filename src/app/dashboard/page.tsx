"use client";

import { useState, useEffect } from "react";
import { getAirQualityData } from "@/services/airQuality";
import MapWrapper from "@/components/MapWrapper";
import AQTrendChart from "@/components/AQTrendChart";
import { AirPollutionData } from "@/types/airQuality";
import EcoFriendlyRoute from "@/components/EcoFriendlyRoute";
import AQITables from "@/components/AQITables";
import UrbanPlanning from "@/components/UrbanPlanning";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";

export default function Dashboard() {
  const [airQualityData, setAirQualityData] = useState<
    (AirPollutionData & { cityName: string })[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAirQualityData();
        setAirQualityData(data);
      } catch {
        setError("Failed to fetch air quality data");
      }
    }
    fetchData();
  }, []);

  // If the auth is still loading, show a loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // If the user is not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Welcome, {user?.firstName || "User"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s your personalized air quality monitoring dashboard.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          <>
            <MapWrapper records={airQualityData} />
            <AQTrendChart />
            <EcoFriendlyRoute />
            <AQITables />
            <UrbanPlanning />
          </>
        )}
      </div>
    </div>
  );
}
