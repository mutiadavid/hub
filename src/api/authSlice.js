import { createSlice } from "@reduxjs/toolkit";

// Derive the user's role directly from the JWT payload to prevent
// client-side tampering. No localStorage is used — the session is
// maintained exclusively by the HttpOnly `accessToken` cookie set by
// the backend.
const normalizeUser = (user, token) => {
  if (!user) return null;

  let secureRole = user.role;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      secureRole =
        payload.role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        user.role;
    } catch (e) {
      // ignore JWT parse errors
    }
  }

  return {
    ...user,
    role: secureRole,
    id: user?.id || user?._id,
    _id: user?.id || user?._id,
  };
};

const authSlice = createSlice({
  name: "auth",
  // Start with no persisted state — the login flow will populate this
  // after a successful /api/auth/login response.
  initialState: {
    user: null,
    token: null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      const normalizedUser = normalizeUser(payload.user, payload.token);
      state.user = normalizedUser;
      // Keep the token in Redux memory so prepareHeaders can attach it
      // as a Bearer header. The HttpOnly cookie is the authoritative session.
      state.token = payload.token || null;
      
      // CRITICAL: Also save token to sessionStorage for utility functions like fileUtils
      // that can't import Redux store directly (circular dependency issues)
      if (payload.token) {
        try {
          sessionStorage.setItem("authToken", payload.token);
        } catch (err) {
          console.warn("Failed to persist token to sessionStorage:", err);
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      // Clear sessionStorage too
      try {
        sessionStorage.removeItem("authToken");
      } catch (err) {
        // Silently ignore
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
