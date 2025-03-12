// frontend/src/components/Weather.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';
import { Spinner } from './common/Spinner';
import './Weather.css';

const Weather = ({ region, tasks }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get time window for weather forecast based on task deadlines
  const getForecastHours = () => {
    const now = new Date();
    const hours = tasks
      .filter(task => task.isOutdoor && task.deadline)
      .map(task => new Date(task.deadline).getHours())
      .filter(h => h > now.getHours())
      .slice(0, 6);
    return hours;
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${region}&units=metric&appid=2bdefad800398800a09c6265db5a7172`
        );
        const forecastHours = getForecastHours();
        let filteredForecast = response.data.list.filter(item =>
          forecastHours.includes(new Date(item.dt * 1000).getHours())
        );
        // Fallback: if no forecast matches tasks, show the first 6 items
        if (filteredForecast.length === 0) {
          filteredForecast = response.data.list.slice(0, 6);
        }
        setWeather({ ...response.data, list: filteredForecast });
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    if (region && tasks.length) fetchWeather();
  }, [region, tasks]);

  if (!region || !tasks.length) return null;
  if (loading) return <Spinner message="Loading weather..." />;
  if (error) return <div className="weather-error">⚠️ {error}</div>;

  return (
    <div className="weather-card">
      <h3>Weather for your outdoor activities in {region}</h3>
      <div className="hourly-forecast">
        {weather.list.map((item, index) => (
          <div key={index} className="hour">
            <p>{new Date(item.dt * 1000).getHours()}:00</p>
            {item.weather[0].main === 'Clear' ? <WiDaySunny size={32} /> :
             item.weather[0].main === 'Rain' ? <WiRain size={32} /> : <WiCloudy size={32} />}
            <p>{Math.round(item.main.temp)}°C</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;
