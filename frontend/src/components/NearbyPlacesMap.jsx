// frontend/src/components/NearbyPlacesMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axiosInstance from './../services/api';
import './NearbyPlacesMap.css';
import { isOutdoorActivity, requiresMapDisplay, determineActivityType } from '../utils/taskUtils';

// Fix for Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NearbyPlacesMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityType, setActivityType] = useState(null);
  const [tasks, setTasks] = useState([]);
  const mapRef = useRef(null);
  
  // Geoapify API Key
  const GEOAPIFY_API_KEY = "6062757cbcd5409db1ffac268053fb89";

  // Get user region from localStorage; note the property is "region", not "area"
  const userRegion = JSON.parse(localStorage.getItem("user"))?.region || "";

  // Convert region name to geocoordinates using Geoapify Geocoding API
  const geocodeRegion = async (region) => {
    try {
      const geocodingUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(region)}&apiKey=${GEOAPIFY_API_KEY}`;
      console.log("Geocoding API URL:", geocodingUrl);
      
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        return { lon: coordinates[0], lat: coordinates[1] };
      }
      throw new Error("Location not found");
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Failed to find your location. Please try again.");
      setLoading(false);
      return null;
    }
  };

  // Fetch nearby places using Geoapify Places API with a category mapping
  const fetchNearbyPlaces = async (lat, lon, category) => {
    try {
      // Map our activity types to Geoapify-supported categories
      const categoryMapping = {
        default: "leisure",
        supermarket: "commercial.supermarket",
        gym: "leisure.sports_centre",
        restaurant: "catering.restaurant",
        cafe: "catering.cafe",
        motel: "accommodation.motel"
      };
      const categoryParam = categoryMapping[category] || category;
      const radius = 0.045; // Approximately 5km in degrees
      const bbox = { 
        west: lon - radius, 
        south: lat - radius, 
        east: lon + radius, 
        north: lat + radius 
      };
      
      const placesUrl = `https://api.geoapify.com/v2/places?categories=${categoryParam}&filter=rect%3A${bbox.west}%2C${bbox.north}%2C${bbox.east}%2C${bbox.south}&limit=20&apiKey=${GEOAPIFY_API_KEY}`;
      console.log("Places API URL:", placesUrl);
      
      const response = await fetch(placesUrl);
      const data = await response.json();
      
      if (data.features) {
        return data.features.map(place => ({
          id: place.properties.place_id || Math.random().toString(36).substring(2, 15),
          name: place.properties.name || "Unnamed Place",
          address: place.properties.formatted || "No address",
          lat: place.geometry.coordinates[1],
          lon: place.geometry.coordinates[0],
          category: place.properties.categories || []
        }));
      }
      return [];
    } catch (err) {
      console.error("Error fetching places:", err);
      setError("Failed to load nearby places. Please try again.");
      return [];
    }
  };

  // Fetch tasks and determine activity type
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get("http://localhost:5000/api/tasks");
        const tasksWithOutdoor = response.data.map((task) => ({
          ...task,
          isOutdoor: isOutdoorActivity(task.name),
          requiresMap: requiresMapDisplay(task.name),
          activityType: determineActivityType(task.name)
        }));
        
        setTasks(tasksWithOutdoor);
        const mapTask = tasksWithOutdoor.find(task => task.requiresMap);
        if (mapTask) {
          setActivityType(mapTask.activityType);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to load your tasks. Please try again.");
      }
    };
    fetchTasks();
  }, []);

  // Geocode user region and fetch nearby places when activityType changes
  useEffect(() => {
    const initMap = async () => {
      if (!userRegion || !activityType) return;
      setLoading(true);
      setError(null);
      try {
        const location = await geocodeRegion(userRegion);
        if (location) {
          setUserLocation(location);
          const places = await fetchNearbyPlaces(location.lat, location.lon, activityType);
          setNearbyPlaces(places);
        }
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("An error occurred while setting up the map. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    initMap();
  }, [userRegion, activityType]);

  const defaultCenter = [28.0339, 1.6596]; // Fallback center (Algeria)
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lon] : defaultCenter;
  const mapRequiringTasks = tasks.filter(task => task.requiresMap);

  return (
    <div className="nearby-places-container">
      <h2>Nearby Places for Your Activities</h2>
      
      {mapRequiringTasks.length > 0 ? (
        <div className="activity-info">
          <p>We found activities that might need location info: 
            <strong> {mapRequiringTasks.map(task => task.name).join(", ")}</strong>
          </p>
        </div>
      ) : (
        <div className="no-map-activities">
          <p>No activities requiring location information were found in your tasks.</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading map and nearby places...</div>}
      
      {!loading && userLocation && activityType && (
        <div className="map-container" style={{ height: "500px", width: "100%" }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} ref={mapRef}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[userLocation.lat, userLocation.lon]}>
              <Popup>
                <strong>Your location</strong><br />Based on: {userRegion}
              </Popup>
            </Marker>
            {nearbyPlaces.map(place => (
              <Marker key={place.id} position={[place.lat, place.lon]}>
                <Popup>
                  <strong>{place.name}</strong><br />{place.address}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="places-list">
            <h3>
              {activityType === "supermarket" ? "Shopping Places" : 
              activityType === "gym" ? "Fitness Centers" : 
              activityType === "restaurant" ? "Restaurants" : 
              activityType === "cafe" ? "Cafes" : 
              activityType === "motel" ? "Accommodation" : "Places"}
            </h3>
            {nearbyPlaces.length > 0 ? (
              <ul className="places">
                {nearbyPlaces.map(place => (
                  <li key={place.id} className="place-item">
                    <h4>{place.name}</h4>
                    <p>{place.address}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No nearby places found for this activity type.</p>
            )}
          </div>
        </div>
      )}
      
      {!userRegion && (
        <div className="warning-message">
          <p>No region information found in your profile. Please update your profile with your location.</p>
        </div>
      )}
    </div>
  );
};

export default NearbyPlacesMap;
