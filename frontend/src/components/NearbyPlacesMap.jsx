import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axiosInstance from './../services/api';
import './NearbyPlacesMap.css'
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
  
  // API Key from your account
  const GEOAPIFY_API_KEY = "6062757cbcd5409db1ffac268053fb89";

  // Get user area from localStorage
  const userRegion = JSON.parse(localStorage.getItem("user"))?.area || "";

  // The same outdoor activity detection function 
  const outdoorKeywords = [
    "hiking", "walking", "jogging", "running", "cycling", "swimming", "camping", 
    "kayaking", "fishing", "climbing", "yoga", "surfing", "skiing", "snowboarding", 
    "gardening", "picnic", "barbecue", "visit", "visiting", "walk", "going", 
    "workout", "shopping", "park", "beach", "trail", "lake", "forest", "mountain", 
    "river", "garden", "playground", "pool", "campsite", "zoo", "farm", "hangout", 
    "gym", "tennis", "golf", "soccer", "volleyball", "basketball", "baseball", 
    "skateboarding", "badminton", "training", "bootcamp", "birdwatching", "stargazing", 
    "photography", "foraging", "bonfire", "sunset", "sunrise", "wildlife", "nature walk", 
    "scenic drive", "boating", "rafting", "snorkeling", "paddleboarding", "sailing", 
    "diving", "tubing", "waterskiing", "jet skiing", "kitesurfing", "sledding", 
    "ice skating", "snowshoeing", "leaf peeping"
  ];

  // Map category names to Geoapify category values
  const categoryMapping = {
    supermarket: "commercial.supermarket",
    gym: "sport.fitness",
    park: "leisure.park",
    restaurant: "catering.restaurant",
    cafe: "catering.cafe",
    leisure: "leisure"
  };

  // Define location-based activities that would benefit from a map
  const mapRelevantActivities = ["shopping", "gym", "park", "restaurant", "cafe", "mall", "fitness", 
                                "workout", "sports", "pool", "tennis", "golf", "basketball", 
                                "soccer", "beach", "lake", "cinema", "theater", "museum"];

  function isOutdoorActivity(taskName) {
    const pattern = `\\b(${outdoorKeywords.join("|")})\\b`;
    const regex = new RegExp(pattern, "i");
    return regex.test(taskName);
  }

  function determineActivityType(taskName) {
    const lowerTaskName = taskName.toLowerCase();
    
    if (lowerTaskName.includes("shop") || lowerTaskName.includes("mall") || lowerTaskName.includes("market")) {
      return "supermarket";
    } else if (lowerTaskName.includes("gym") || lowerTaskName.includes("fitness") || lowerTaskName.includes("workout")) {
      return "gym";
    } else if (lowerTaskName.includes("park") || lowerTaskName.includes("garden")) {
      return "park";
    } else if (lowerTaskName.includes("restaurant") || lowerTaskName.includes("eat") || lowerTaskName.includes("dining")) {
      return "restaurant";
    } else if (lowerTaskName.includes("cafe") || lowerTaskName.includes("coffee")) {
      return "cafe";
    } else {
      return "leisure";
    }
  }

  // Check if an activity requires map display
  function requiresMapDisplay(taskName) {
    const lowerTaskName = taskName.toLowerCase();
    return mapRelevantActivities.some(activity => lowerTaskName.includes(activity));
  }

  // Convert region name to geocoordinates using Geoapify Geocoding API
  const geocodeRegion = async (region) => {
    try {
      // Using the exact geocoding API URL format you provided
      const geocodingUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(region)}&apiKey=${GEOAPIFY_API_KEY}`;
      console.log("Geocoding API URL:", geocodingUrl);
      
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        return {
          lon: coordinates[0],
          lat: coordinates[1]
        };
      }
      throw new Error("Location not found");
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Failed to find your location. Please try again.");
      setLoading(false);
      return null;
    }
  };

  // Fetch nearby places using Geoapify Places API
  const fetchNearbyPlaces = async (lat, lon, category) => {
    try {
      const categoryParam = categoryMapping[category] || "leisure";
      
      // Create bounding box for the area (5km around the point)
      const radius = 0.045; // Approximately 5km in degrees
      const bbox = {
        west: lon - radius,
        south: lat - radius,
        east: lon + radius,
        north: lat + radius
      };
      
      // Using the exact places API URL format you provided with rect filter
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

  // Fetch tasks
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
        
        // Find the first task that requires a map
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
        // For Algeria, you might want to add the country to improve geocoding results
        const regionWithCountry = userRegion.includes("Algeria") ? userRegion : `${userRegion}, Algeria`;
        const location = await geocodeRegion(regionWithCountry);
        
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

  // Default center location for Algeria if user location fails
  const defaultCenter = [28.0339, 1.6596]; // Center of Algeria
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lon] : defaultCenter;
  
  // Find tasks that require map display
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
          <MapContainer 
            center={mapCenter}
            zoom={13} 
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* User location marker */}
            <Marker position={[userLocation.lat, userLocation.lon]}>
              <Popup>
                <strong>Your location</strong><br />
                Based on: {userRegion}
              </Popup>
            </Marker>
            
            {/* Nearby places markers */}
            {nearbyPlaces.map(place => (
              <Marker key={place.id} position={[place.lat, place.lon]}>
                <Popup>
                  <strong>{place.name}</strong><br />
                  {place.address}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="places-list">
            <h3>Nearby {activityType === "supermarket" ? "Shopping Places" : 
                       activityType === "gym" ? "Fitness Centers" : 
                       activityType === "restaurant" ? "Restaurants" : 
                       activityType === "cafe" ? "Cafes" : 
                       "Places"}</h3>
            
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