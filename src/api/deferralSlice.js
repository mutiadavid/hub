import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  deferrals: [],
  currentDeferral: null,
  loading: false,
  error: null,
  filters: {
    status: "",
    searchQuery: "",
    sortBy: "createdAt",
  },
  tabCounts: {
    pending: 0,
    approved: 0,
    closeRequests: 0,
    closed: 0,
  },
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
};

const deferralSlice = createSlice({
  name: "deferral",
  initialState,
  reducers: {
    setDeferrals: (state, action) => {
      state.deferrals = action.payload;
    },
    setCurrentDeferral: (state, action) => {
      state.currentDeferral = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setTabCounts: (state, action) => {
      state.tabCounts = action.payload;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    clearCurrentDeferral: (state) => {
      state.currentDeferral = null;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setDeferrals,
  setCurrentDeferral,
  setLoading,
  setError,
  setFilters,
  setTabCounts,
  setStats,
  clearCurrentDeferral,
  resetFilters,
} = deferralSlice.actions;

export default deferralSlice.reducer;
