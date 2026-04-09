// src/components/completedChecklistModal/components/ChecklistHeader.jsx
import React from "react";
import { PRIMARY_BLUE } from "../../../utils/checklistConstants";

const ChecklistHeader = ({ title }) => (
  <div
    style={{
      color: "white",
      fontWeight: "bold",
      // Now using PRIMARY_BLUE for something
      backgroundColor: PRIMARY_BLUE,
      padding: "12px 16px",
    }}
  >
    Completed Checklist - {title}
  </div>
);

export default ChecklistHeader;
