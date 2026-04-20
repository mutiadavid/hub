
import { createSlice } from "@reduxjs/toolkit";

const storedAuth = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

// Normalize stored user to ensure both id and _id are present
const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    id: user?.id || user?._id,
    _id: user?.id || user?._id,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: normalizeUser(storedAuth?.user) || null,
    token: storedAuth?.token || null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      const normalizedUser = normalizeUser(payload.user);
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
