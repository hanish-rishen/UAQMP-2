'use client';

import { AirQualityRecord } from '@/types/airQuality';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

interface AirQualityMapProps {
  records: AirQualityRecord[];
}

export default function AirQualityMap({ records }: AirQualityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const MAPTILER_KEY = 'MakFZUKozVFQcAOahegc';

  useEffect(() => {
    if (!mapContainer.current) return;

    // Group records by station to combine pollutants
    const stations = records.reduce((acc, record) => {
      const key = `${record.station}`;
      if (!acc[key]) {
        acc[key] = {
          station: record.station,
          city: record.city,
          latitude: parseFloat(record.latitude),
          longitude: parseFloat(record.longitude),
          pollutants: []
        };
      }
      acc[key].pollutants.push({
        id: record.pollutant_id,
        value: record.avg_value
      });
      return acc;
    }, {} as Record<string, any>);

    // Calculate bounds for all stations
    const coordinates = Object.values(stations).map((station: any) => [
      station.longitude,
      station.latitude
    ]);

    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`,
      bounds: bounds,
      fitBoundsOptions: {
        padding: 50,
        maxZoom: 15.5
      },
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    map.current.on('load', () => {
      // Add 3D buildings
      const layers = map.current!.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout!['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }

      // Add building data source
      map.current!.addSource('openmaptiles', {
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
        type: 'vector',
      });

      // Add 3D building layer
      map.current!.addLayer(
        {
          'id': '3d-buildings',
          'source': 'openmaptiles',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              0, '#DCE1E3',  // Light gray for low buildings
              50, '#C3CCD1', // Medium gray for medium buildings
              100, '#A9B8BE' // Darker gray for tall buildings
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              16, ['get', 'render_height']
            ],
            'fill-extrusion-opacity': 0.7,
            'fill-extrusion-base': 0
          }
        },
        labelLayerId
      );

      // Add markers for air quality stations
      Object.values(stations).forEach((station: any) => {
        const pollutantList = station.pollutants
          .map((p: any) => `
            <div class="flex justify-between gap-4 text-black">
              <span class="font-medium">${p.id}:</span>
              <span>${p.value}</span>
            </div>
          `)
          .join('');

        const popup = new maplibregl.Popup({ offset: [0, -20] })
          .setHTML(`
            <div class="p-2 min-w-[200px]">
              <h3 class="text-lg font-bold text-black mb-1">${station.city}</h3>
              <p class="text-sm text-gray-700 mb-3">${station.station}</p>
              <div class="space-y-1">
                ${pollutantList}
              </div>
            </div>
          `);

        new maplibregl.Marker({
          color: '#FF0000',
          scale: 0.8,
          // Adjust marker height to appear above buildings
          anchor: 'bottom'
        })
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Add navigation controls
      map.current!.addControl(new maplibregl.NavigationControl());

      // Ensure all markers are visible
      map.current!.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15.5
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [records]);

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
