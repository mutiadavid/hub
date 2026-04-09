export const DEFERRAL_TABS = ["deferrals", "deferralCharts"];
export const DCL_TABS = ["allDCLs", "dclCharts"];

export const NCBA_REPORT_THEME = {
  brand: "#6A4A3A",
  brandDark: "#4A342A",
  brandDeep: "#2F201A",
  brandSoft: "#B59A8C",
  brandMist: "#F3E9E1",
  ink: "#241A17",
  inkSoft: "#4F433E",
  inkMuted: "#8B7D76",
  line: "#D8CCC1",
  surface: "#FFFFFF",
  surfaceAlt: "#FAF5F1",
};

export const REPORT_COLOR_PALETTES = {
  ocean: ["#3F6478", "#325161", "#6C8790", "#8FA4AB", "#526E76"],
  citrus: ["#8A9466", "#717A52", "#AAB18C", "#C1C8AB", "#626A47"],
  amber: ["#B9855B", "#9F6D46", "#CAA789", "#8C5A37", "#DFC6AE"],
  plum: ["#A88370", "#8E6B5C", "#C2A696", "#755648", "#D7C1B7"],
  cocoa: ["#6A4A3A", "#4A342A", "#8B6551", "#2F201A", "#B59A8C"],
};

export const PIE_COLORS = [
  ...REPORT_COLOR_PALETTES.citrus,
  ...REPORT_COLOR_PALETTES.amber,
  ...REPORT_COLOR_PALETTES.ocean,
  ...REPORT_COLOR_PALETTES.plum,
  ...REPORT_COLOR_PALETTES.cocoa,
];

export const DCL_BAR_COLORS = [
  REPORT_COLOR_PALETTES.citrus[0],
  REPORT_COLOR_PALETTES.amber[0],
  REPORT_COLOR_PALETTES.ocean[0],
  REPORT_COLOR_PALETTES.plum[0],
  REPORT_COLOR_PALETTES.cocoa[1],
  REPORT_COLOR_PALETTES.citrus[1],
  REPORT_COLOR_PALETTES.amber[0],
  REPORT_COLOR_PALETTES.ocean[1],
];

export const DEFERRAL_BAR_COLORS = [
  REPORT_COLOR_PALETTES.citrus[0],
  REPORT_COLOR_PALETTES.amber[0],
  REPORT_COLOR_PALETTES.ocean[1],
  REPORT_COLOR_PALETTES.plum[0],
  REPORT_COLOR_PALETTES.cocoa[1],
  REPORT_COLOR_PALETTES.ocean[3],
  REPORT_COLOR_PALETTES.amber[2],
];

export const DEFERRAL_LINE_COLORS = {
  total: REPORT_COLOR_PALETTES.amber[0],
  historical: REPORT_COLOR_PALETTES.ocean[1],
  newlyDeferred: REPORT_COLOR_PALETTES.cocoa[1],
};

export const DEFERRAL_STATUS_COLORS = {
  "Not Overdue": REPORT_COLOR_PALETTES.citrus[0],
  "Over Due": REPORT_COLOR_PALETTES.amber[0],
  unknown: REPORT_COLOR_PALETTES.cocoa[2],
};

export const DEFERRAL_BUCKET_COLORS = {
  "Not Overdue": REPORT_COLOR_PALETTES.citrus[0],
  "Less than 30 days": REPORT_COLOR_PALETTES.ocean[0],
  "30 to 90 days": REPORT_COLOR_PALETTES.amber[0],
  "91 to 180 days": REPORT_COLOR_PALETTES.plum[0],
  "Over 180 Days": REPORT_COLOR_PALETTES.cocoa[1],
  unknown: REPORT_COLOR_PALETTES.cocoa[2],
};

export const DEFERRAL_RISK_COLORS = {
  NORMAL: REPORT_COLOR_PALETTES.ocean[0],
  WATCH: REPORT_COLOR_PALETTES.amber[0],
  NPL: REPORT_COLOR_PALETTES.cocoa[1],
  unknown: REPORT_COLOR_PALETTES.cocoa[2],
};

export const DCL_STATUS_COLORS = {
  approved: REPORT_COLOR_PALETTES.citrus[0],
  completed: REPORT_COLOR_PALETTES.ocean[2],
  cocreatorreview: REPORT_COLOR_PALETTES.ocean[0],
  co_creator_review: REPORT_COLOR_PALETTES.ocean[0],
  rmreview: REPORT_COLOR_PALETTES.plum[0],
  rm_review: REPORT_COLOR_PALETTES.plum[0],
  cocheckerreview: REPORT_COLOR_PALETTES.cocoa[1],
  co_checker_review: REPORT_COLOR_PALETTES.cocoa[1],
  pending: REPORT_COLOR_PALETTES.amber[0],
  pendingrm: REPORT_COLOR_PALETTES.amber[1],
  pendingco: REPORT_COLOR_PALETTES.amber[2],
  rejected: REPORT_COLOR_PALETTES.cocoa[3],
  revived: REPORT_COLOR_PALETTES.plum[2],
  active: REPORT_COLOR_PALETTES.ocean[1],
  submitted: REPORT_COLOR_PALETTES.ocean[2],
  unknown: "#9AA8AE",
};