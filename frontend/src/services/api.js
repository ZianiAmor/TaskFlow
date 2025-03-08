//frontend/src/services/api.js
import axios from 'axios';

const API_URL = "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor to inject the token from the "user" object in localStorage
axiosInstance.interceptors.request.use(config => {
  const storedUser = localStorage.getItem('user');
  let token;
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      token = user?.token;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
