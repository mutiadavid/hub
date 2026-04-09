import { createSlice } from "@reduxjs/toolkit";

const checklistSlice = createSlice({
  name: "checklists",
  initialState: {
    list: [],
  },
  reducers: {
    addChecklist: (state, action) => {
      state.list.push(action.payload);
    },

    updateChecklist: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.list.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...updates };
      }
    },
  },
});

export const { addChecklist, updateChecklist } = checklistSlice.actions;

export default checklistSlice.reducer;
