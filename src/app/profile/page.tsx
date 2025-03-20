"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image"; // Import Image from next/image

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("settings");

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 bg-gradient-to-r from-green-400 to-blue-500 text-white">
            <div className="flex items-center gap-4">
              {/* Replace img with next/image */}
              <Image
                src={user.imageUrl}
                alt={user.fullName || "User"}
                width={80}
                height={80}
                className="rounded-full border-4 border-white"
              />
              <div>
                <h1 className="text-2xl font-bold">{user.fullName}</h1>
                <p className="opacity-90">
                  {user.emailAddresses[0].emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-4 px-6 text-center border-b-2 ${
                activeTab === "settings"
                  ? "border-green-500 text-green-500"
                  : "border-transparent hover:text-green-500"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-4 px-6 text-center border-b-2 ${
                activeTab === "saved"
                  ? "border-green-500 text-green-500"
                  : "border-transparent hover:text-green-500"
              }`}
            >
              Saved Locations
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-4 px-6 text-center border-b-2 ${
                activeTab === "history"
                  ? "border-green-500 text-green-500"
                  : "border-transparent hover:text-green-500"
              }`}
            >
              Search History
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Manage your account settings and profile details
                  </p>
                  <a
                    href="https://accounts.clerk.dev/user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
                  >
                    Manage Account
                  </a>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-2">Notification Preferences</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-500"
                      />
                      <span className="ml-2">Air quality alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-500"
                      />
                      <span className="ml-2">Weekly air quality report</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-500"
                      />
                      <span className="ml-2">
                        Tips for improving local air quality
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "saved" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Saved Locations</h2>
                <p className="text-gray-500">
                  You haven&apos;t saved any locations yet. Search for a
                  location and click &quot;Save&quot; to add it here.
                </p>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Search History</h2>
                <p className="text-gray-500">
                  Your recent searches will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
