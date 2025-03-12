// frontend/src/components/Weather.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';

const Weather = ({ region }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${region}&units=metric&appid=2802b86bac75a4312a845e8a4b1192ae`
        );
        setWeather(response.data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    if (region) fetchWeather();
  }, [region]);

  if (!weather) return <div>Loading weather...</div>;

  return (
    <div className="weather-card">
      <h3>Weather in {region}</h3>
      <div className="hourly-forecast">
        {weather.list.slice(0, 6).map((item, index) => (
          <div key={index} className="hour">
            <p>{new Date(item.dt * 1000).getHours()}:00</p>
            {item.weather[0].main === 'Clear' ? <WiDaySunny /> :
             item.weather[0].main === 'Rain' ? <WiRain /> : <WiCloudy />}
            <p>{Math.round(item.main.temp)}°C</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Weather