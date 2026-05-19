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
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;
