// import { COLORS } from "../modals/CreatorCompletedChecklistModalComponent/constants";

import { COLORS } from "../modals/CreatorCompletedChecklistModal/constants";

// import { COLORS } from "../modals/CreatorCompletedChecklistModal/constants";

// import { COLORS } from "../modals/constant";

export const checklistInfoCardStyles = {
  card: {
    marginBottom: 18,
    borderRadius: 10,
    border: `1px solid #e0e0e0`,
  },
  title: {
    color: COLORS.PRIMARY_BLUE,
    fontSize: 14,
  },
};

export const progressSectionStyles = {
  container: {
    padding: "16px",
    background: "#f7f9fc",
    borderRadius: 8,
    border: "1px solid #e0e0e0",
    marginBottom: 18,
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: "8px",
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: "12px",
    color: "#666",
  },
  progressPercent: {
    fontSize: "12px",
    fontWeight: 600,
    color: COLORS.PRIMARY_BLUE,
  },
};

export const buttonStyles = {
  download: {
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderColor: COLORS.PRIMARY_BLUE,
  },
  revive: {
    background: COLORS.PRIMARY_BLUE,
    borderColor: COLORS.PRIMARY_BLUE,
    color: '#ffffff',
    fontWeight: 600,
  },
  confirmRevive: {
    background: COLORS.ACCENT_LIME,
    borderColor: COLORS.ACCENT_LIME,
    color: COLORS.PRIMARY_BLUE,
    fontWeight: 600,
  },
};

export const tableStyles = {
  container: {
    marginTop: 0,
  },
  table: {
    pagination: false,
    size: "small",
    scroll: { x: "max-content" },
  },
};
