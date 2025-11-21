/**
 * API configuration and utilities
 */
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("clubhub_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("No token found in localStorage for request:", config.url);
  }
  return config;
});

// Add response interceptor to handle 401 errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error("401 Unauthorized - Token may be expired or invalid");
      // Don't clear localStorage here, let individual components handle it
    }
    return Promise.reject(error);
  }
);

export default API;

