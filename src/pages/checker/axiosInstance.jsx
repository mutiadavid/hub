import axios from "axios";
import { API_BASE_URL } from "../../config/runtimeConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // if your backend uses cookies; otherwise keep or remove
});

// Token is handled via HttpOnly cookies by the browser, no interceptor needed.

export default api;