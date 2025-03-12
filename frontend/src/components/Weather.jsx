// frontend/src/components/Weather.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';
import { Spinner } from './common/Spinner';

const Weather = ({ region, tasks }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get time window for weather forecast
  const getForecastHours = () => {
    const now = new Date();
    return tasks
      .filter(task => task.isOutdoor)
      .map(task => new Date(task.deadline).getHours())
      .filter(h => h > now.getHours())
      .slice(0, 6); // Get next 6 relevant hours
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Use the provided OpenWeatherMap API key:
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${region}&units=metric&appid=2bdefad800398800a09c6265db5a7172`
        );
        
        const relevantHours = getForecastHours();
        const filteredForecast = response.data.list.filter(item => 
          relevantHours.includes(new Date(item.dt * 1000).getHours())
        );

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
            {item.weather[0].main === 'Clear' ? <WiDaySunny /> :
             item.weather[0].main === 'Rain' ? <WiRain /> : <WiCloudy />}
            <p>{Math.round(item.main.temp)}°C</p>
            <small>
              {tasks.filter(t => 
                new Date(t.deadline).getHours() === new Date(item.dt * 1000).getHours()
              ).map(t => t.name).join(', ')}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;
