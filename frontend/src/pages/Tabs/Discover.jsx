// frontend/src/pages/tabs/Discover.jsx
import React, { useEffect, useState } from 'react';
import Weather from '../../components/Weather';
import NearbyPlacesMap from '../../components/NearbyPlacesMap';
import './Discover.css';
import { Spinner } from '../../components/common/Spinner';
import axiosInstance from '../../services/api';
import { isOutdoorActivity, requiresMapDisplay } from '../../utils/taskUtils';

const Discover = () => {
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const response = await axiosInstance.get("/api/tasks");
        
        const tasksWithOutdoor = response.data.map(task => ({
          ...task,
          isOutdoor: isOutdoorActivity(task.name),
          requiresMap: requiresMapDisplay(task.name)
        }));

        setUserData({
          region: user.region || '',
          area: user.area || ''
        });
        setTasks(tasksWithOutdoor);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.addEventListener('storage', fetchData);
    return () => window.removeEventListener('storage', fetchData);
  }, []);

  // Check if there are outdoor activities
  const hasOutdoorActivities = tasks.some(task => task.isOutdoor);
  const hasMapActivities = tasks.some(task => task.requiresMap);

  if (loading) return <Spinner message="Loading discovery features..." />;
  if (error) return <div className="error-banner">⚠️ Error: {error}</div>;

  return (
    <div className="discover-container">
      <h1>Discover Your Area</h1>
      
      {!userData?.region ? (
        <div className="location-warning">
          <p>Please update your profile with your location to see local information.</p>
        </div>
      ) : (
        <>
          {hasOutdoorActivities && (
            <div className="weather-section">
              <Weather region={userData.region} tasks={tasks} />
            </div>
          )}

          {hasMapActivities && (
            <div className="map-section">
              <NearbyPlacesMap 
                userRegion={userData.region}
                tasks={tasks}
              />
            </div>
          )}

          {!hasOutdoorActivities && !hasMapActivities && (
            <div className="no-activities">
              <p>No outdoor or location-based activities found in your tasks.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Discover;
