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

const loadAuthState = () => {
  try {
    const serialized = sessionStorage.getItem("authState");
    if (serialized === null) {
      return { user: null, token: null };
    }
    return JSON.parse(serialized);
  } catch (err) {
    return { user: null, token: null };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadAuthState(),
  reducers: {
    setCredentials: (state, { payload }) => {
      const normalizedUser = normalizeUser(payload.user, payload.token);
      state.user = normalizedUser;
      state.token = payload.token || null;
      
      try {
        sessionStorage.setItem("authState", JSON.stringify({ user: state.user, token: state.token }));
        if (payload.token) {
          sessionStorage.setItem("authToken", payload.token);
        }
      } catch (err) {
        console.warn("Failed to persist auth state to sessionStorage:", err);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      try {
        sessionStorage.removeItem("authState");
        sessionStorage.removeItem("authToken");
      } catch (err) {
        // Silently ignore
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
