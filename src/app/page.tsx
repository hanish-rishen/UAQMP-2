"use client";
import { useState, useEffect } from "react";
import { getAirQualityData } from "@/services/airQuality";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        await getAirQualityData();
      } catch (err) {
        console.error("Failed to fetch air quality data:", err);
        setError("Failed to load air quality data");
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            Urban Air Quality Monitoring Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
            Monitor, analyze and improve air quality in your area with
            AI-powered insights and personalized recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                Go to Dashboard
              </Link>
            </SignedIn>

            <SignedOut>
              <Link
                href="/sign-up"
                className="px-8 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                Create an Account
              </Link>

              <Link
                href="/sign-in"
                className="px-8 py-3 border border-green-500 text-green-500 font-medium rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                Sign In
              </Link>
            </SignedOut>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-green-500 mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track air quality metrics in real-time with data from trusted
              sources.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-green-500 mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized recommendations based on pollution patterns and
              weather data.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-green-500 mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Eco-Friendly Routes</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Find the cleanest routes for your daily commute and reduce
              pollution exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
