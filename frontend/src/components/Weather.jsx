import { useEffect, useState } from 'react';
import axios from 'axios';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';
import { Spinner } from './common/Spinner';
import './Weather.css';

const Weather = ({ region, tasks }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Geoapify API Key
  const GEOAPIFY_API_KEY = "6062757cbcd5409db1ffac268053fb89";
  
  // Get stored region from localStorage (fallback)
  const storedRegion = region || JSON.parse(localStorage.getItem("user"))?.region || "";

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

  // Try to get user's current location via browser geolocation
  const fetchUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
          },
          (err) => {
            console.warn("Geolocation error:", err);
            reject(err);
          }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  // Convert lat/lon to location name using reverse geocoding
  const reverseGeocode = async (lat, lon) => {
    try {
      const reverseGeocodingUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
      console.log("Reverse Geocoding API URL:", reverseGeocodingUrl);
      const response = await fetch(reverseGeocodingUrl);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const city = data.features[0].properties.city || 
                    data.features[0].properties.town || 
                    data.features[0].properties.village || 
                    data.features[0].properties.county;
        return city;
      }
      throw new Error("Location name not found");
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return null;
    }
  };

  // Fetch weather data based on location
  const fetchWeatherData = async (locationName) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${locationName}&units=metric&appid=2bdefad800398800a09c6265db5a7172`
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
      setLoading(false);
    } catch (error) {
      console.error("Weather API error:", error);
      setError(error.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  // Fetch weather by coordinates
  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=2bdefad800398800a09c6265db5a7172`
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
      setLoading(false);
    } catch (error) {
      console.error("Weather API error:", error);
      setError(error.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  // Initialize weather data with either geolocation or stored region
  useEffect(() => {
    const initWeather = async () => {
      if (!tasks.length) return;
      setLoading(true);
      setError(null);

      try {
        // First try to get user's precise location
        let location;
        let locationName = storedRegion;

        try {
          location = await fetchUserLocation();
          console.log("Using browser geolocation:", location);
          setUserLocation(location);
          
          // Try to get the city name from coordinates
          const cityName = await reverseGeocode(location.lat, location.lon);
          if (cityName) {
            locationName = cityName;
            await fetchWeatherData(cityName);
          } else {
            // If reverse geocoding fails, use coordinates directly
            await fetchWeatherByCoords(location.lat, location.lon);
          }
        } catch (geoError) {
          console.warn("User denied geolocation or it failed; falling back to stored region.");
          // Fall back to the stored region if geolocation fails
          if (storedRegion) {
            await fetchWeatherData(storedRegion);
          } else {
            setError("No location available. Please update your profile with your location.");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Weather initialization error:", err);
        setError("An error occurred while setting up the weather forecast. Please try again.");
        setLoading(false);
      }
    };

    initWeather();
  }, [tasks, storedRegion]);

  if (!tasks.length) return null;
  if (loading) return <Spinner message="Loading weather..." />;
  if (error) return <div className="weather-error">⚠️ {error}</div>;

  // Extract the display location name
  const displayLocation = weather.city?.name || storedRegion || "your location";

  return (
    <div className="weather-card">
      <h3>Weather for your outdoor activities in {displayLocation}</h3>
      {userLocation && (
        <p className="location-info">Using your current location</p>
      )}
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