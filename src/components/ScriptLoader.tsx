"use client";
import Script from "next/script";

export default function ScriptLoader() {
  return (
    <>
      <Script
        src="https://cdn.maptiler.com/maptiler-geocoder/v1.1.0/maptiler-geocoder.js"
        strategy="afterInteractive" // Changed from beforeInteractive to afterInteractive
      />
      <Script
        src="https://api.maptiler.com/geocoding/v1/geocoding.js?key=MakFZUKozVFQcAOahegc"
        strategy="afterInteractive" // Changed from beforeInteractive to afterInteractive
      />
    </>
  );
}
