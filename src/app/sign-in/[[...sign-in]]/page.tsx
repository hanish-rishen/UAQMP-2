"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in to monitor air quality in your area
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-green-500 hover:bg-green-600 text-sm normal-case",
                footerActionLink: "text-green-600 hover:text-green-700",
                card: "shadow-none",
                rootBox: "shadow-none",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
