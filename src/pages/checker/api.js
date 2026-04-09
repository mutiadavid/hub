import axios from "axios";
import { API_BASE_URL } from "../../config/runtimeConfig";

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optionally add an interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // or wherever you store JWT
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default {
  // Fetch all checklists
  getChecklists: () => api.get("/checklists"),

  // Fetch dashboard stats
  getStats: () => api.get("/checklists/dashboard/stats"),

  // Fetch checklist by ID
  getChecklistById: (id) => api.get(`/checklists/id/${id}`),

  // Fetch checklists for RM (if needed)
  getChecklistsForRM: () => api.get("/checklists/rm/my-checklists"),

  // Submit checklist
  submitChecklistToCoCreator: (payload) =>
    api.patch("/checklists/rm-submit", payload),

  // Upload documents
  uploadDocument: (formData) => api.post("/checklists/upload", formData),

  // Request deferral
  requestDeferral: (payload) => api.post("/checklists/deferral", payload),
};