import React, { useEffect, useState } from "react";
import axiosInstance from "../../services/api";
import "./Discover.css"; // Ensure you have a matching stylesheet

const Discover = () => {
  const [tasks, setTasks] = useState([]);
  const [weather, setWeather] = useState(null);
  const userArea = JSON.parse(localStorage.getItem("user"))?.area; // Assume you stored area in the user object

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axiosInstance.get("http://localhost:5000/api/tasks"
          );
        // Map tasks to add outdoor detection.
        const tasksWithOutdoor = response.data.map((task) => ({
          ...task,
          isOutdoor: isOutdoorActivity(task.name),
        }));
        setTasks(tasksWithOutdoor);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  // Simple outdoor activity detection function (could be imported from a utility file)
  const outdoorKeywords = [
    // Core Activities
    "hiking", "walking", "jogging", "running", "cycling", "swimming", 
    "camping", "kayaking", "fishing", "climbing", "yoga", "surfing",
    "skiing", "snowboarding", "gardening", "picnic", "barbecue","visit","visiting",
    "walk","going","workout",
    // Locations
    "park", "beach", "trail", "lake", "forest", "mountain", "river",
    "garden", "playground", "pool", "campsite", "zoo", "farm","hangout",
    
    // Sports & Fitness
    "gym", "tennis", "golf", "soccer", "volleyball", "basketball",
    "baseball", "skateboarding", "badminton", "training", "bootcamp",
    
    // Nature Activities
    "birdwatching", "stargazing", "photography", "foraging", "bonfire",
    "sunset", "sunrise", "wildlife", "nature walk", "scenic drive",
    
    // Water Activities
    "boating", "rafting", "snorkeling", "paddleboarding", "sailing",
    "diving", "tubing", "waterskiing", "jet skiing", "kitesurfing",
    
    // Seasonal
    "sledding", "ice skating", "snowshoeing", "leaf peeping"
  ];
  
  // Total: 60 key terms

  function isOutdoorActivity(taskName) {
    const pattern = `\\b(${outdoorKeywords.join("|")})\\b`;
    const regex = new RegExp(pattern, "i");
    return regex.test(taskName);
  }

  // Optionally, fetch weather data using the user's area
  useEffect(() => {
    if (userArea) {
      // Example: fetch weather data from an API using userArea
      // axios.get(`https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=${userArea}`)
      //   .then(response => setWeather(response.data));
    }
  }, [userArea]);

  const outdoorTasks = tasks.filter((task) => task.isOutdoor);

  return (
    <div className="discover-container">
      <h1>Discover More</h1>
      {outdoorTasks.length > 0 ? (
        <div className="outdoor-suggestions">
          <p>
            We noticed you have {outdoorTasks.length} outdoor activities today:
            {outdoorTasks.map((task) => task.name).join(", ")}.
          </p>
          {weather && (
            <div className="weather-info">
              <p>
                Current weather in {userArea}: {weather.current.condition.text},
                {weather.current.temp_c}°C
              </p>
            </div>
          )}
        </div>
      ) : (
        <p>No outdoor activities detected.</p>
      )}
    </div>
  );
};

export default Discover;
