// frontend/src/pages/Discover.jsx
import React, { useEffect, useState } from 'react';
import Weather from '../../components/Weather';
import NearbyPlacesMap from '../../components/NearbyPlacesMap';
import './Discover.css';

const Discover = () => {
  const [userRegion, setUserRegion] = useState('');

  // Listen for localStorage changes to update the region value
  useEffect(() => {
    const checkUserLocation = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setUserRegion(user?.region || '');  // Updated to use "region"
    };

    // Check immediately on mount
    checkUserLocation();

    // Set up storage event listener
    const handleStorageChange = () => checkUserLocation();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="discover-container">
      <h1>Discover Your Area</h1>
      
      {userRegion ? (
        <>
          <div className="weather-section">
            <Weather region={userRegion} />
          </div>

          <div className="map-section">
            <NearbyPlacesMap />
          </div>
        </>
      ) : (
        <div className="location-warning">
          <p>Please update your profile with your location to see local information.</p>
        </div>
      )}
    </div>
  );
};

export default Discover;
