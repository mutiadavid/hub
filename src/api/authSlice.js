
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
    mfaSessionToken: null,
    isMFARequired: false,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      const normalizedUser = normalizeUser(payload.user);
      state.user = normalizedUser;
      state.token = payload.token;
      state.mfaSessionToken = null; // Clear MFA token after successful login
      state.isMFARequired = false;

      localStorage.setItem(
        "user",
        JSON.stringify({
          user: normalizedUser,
          token: payload.token,
        }),
      );
    },
    setMFASessionToken: (state, { payload }) => {
      state.mfaSessionToken = payload;
      state.isMFARequired = !!payload; // Set to true if token exists
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.mfaSessionToken = null;
      state.isMFARequired = false;
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, setMFASessionToken, logout } = authSlice.actions;
export default authSlice.reducer;
