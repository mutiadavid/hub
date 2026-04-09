
// Shared axios instance with JWT header injection.
// Adjust baseURL if your API is at a different host/port.

import axios from "axios";
import { API_BASE_URL } from "../../config/runtimeConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // if your backend uses cookies; otherwise keep or remove
});

// Add Authorization header from localStorage (token storage may differ in your app)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token"); // change storage key if different
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;
