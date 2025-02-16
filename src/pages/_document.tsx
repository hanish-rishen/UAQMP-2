import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link href="https://cdn.maptiler.com/maptiler-geocoder/v1.1.0/maptiler-geocoder.css" rel="stylesheet" />
        <Script
          src="https://cdn.maptiler.com/maptiler-geocoder/v1.1.0/maptiler-geocoder.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://api.maptiler.com/geocoding/v1/geocoding.js?key=MakFZUKozVFQcAOahegc"
          strategy="beforeInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
