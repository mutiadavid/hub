
import { createSlice } from "@reduxjs/toolkit";

const storedAuth = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

// Normalize stored user to ensure both id and _id are present
const normalizeUser = (user, token) => {
  if (!user) return null;

  let secureRole = user.role;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      secureRole = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || user.role;
    } catch (e) {
      // ignore parsing errors
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
  initialState: {
    user: normalizeUser(storedAuth?.user, storedAuth?.token) || null,
    token: storedAuth?.token || null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      const normalizedUser = normalizeUser(payload.user, payload.token);
      state.user = normalizedUser;
      state.token = payload.token;

      localStorage.setItem(
        "user",
        JSON.stringify({
          user: normalizedUser,
          token: payload.token,
        }),
      );
      localStorage.setItem("token", payload.token || "");
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
