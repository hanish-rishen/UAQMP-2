import { WeatherData } from '@/types/weather';
import Image from 'next/image';

interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-lg font-semibold">Current Weather</h5>
          <div className="text-3xl font-bold mt-1">
            {Math.round(weather.main.temp)}°C
          </div>
          <div className="text-sm opacity-90">
            Feels like {Math.round(weather.main.feels_like)}°C
          </div>
        </div>
        <div className="text-right">
          <Image
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
            width={64}
            height={64}
          />
          <div className="text-sm capitalize">
            {weather.weather[0].description}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <div className="opacity-80">Humidity</div>
          <div className="font-semibold">{weather.main.humidity}%</div>
        </div>
        <div>
          <div className="opacity-80">Wind Speed</div>
          <div className="font-semibold">{weather.wind.speed} m/s</div>
        </div>
        <div>
          <div className="opacity-80">Pressure</div>
          <div className="font-semibold">{weather.main.pressure} hPa</div>
        </div>
        <div>
          <div className="opacity-80">Visibility</div>
          <div className="font-semibold">{weather.visibility / 1000} km</div>
        </div>
      </div>
    </div>
  );
}
