import { NCBA_COLORS } from "../../../utils/colors";

export const DEFERRAL_TABS = ["deferrals", "deferralCharts"];
export const DCL_TABS = ["allDCLs", "dclCharts"];
export const TAT_TABS = ["tatConsumed", "tatConsumedCharts"];

export const DCL_DISPLAY_NAME = "Dcl";
export const DCL_PLURAL_DISPLAY_NAME = "Dcls";

export const NCBA_REPORT_THEME = {
  brand: NCBA_COLORS.primary,
  brandDark: NCBA_COLORS.primaryHover,
  brandDeep: NCBA_COLORS.primaryDeep,
  brandSoft: NCBA_COLORS.accent,
  brandMist: NCBA_COLORS.infoSoft,
  ink: NCBA_COLORS.textStrong,
  inkSoft: NCBA_COLORS.textMedium,
  inkMuted: NCBA_COLORS.textMuted,
  line: NCBA_COLORS.border,
  surface: NCBA_COLORS.surface,
  surfaceAlt: NCBA_COLORS.background,
};

export const REPORT_COLOR_PALETTES = {
  ocean: [NCBA_COLORS.primary, NCBA_COLORS.primaryHover, "#5f94c2", "#92bad9", "#bfd7ea"],
  citrus: [NCBA_COLORS.success, "#6d9a3f", "#9ccc73", "#cfe4b5", "#edf6e1"],
  amber: [NCBA_COLORS.warning, NCBA_COLORS.accentStrong, NCBA_COLORS.accent, "#edd8b7", "#fff8ec"],
  plum: [NCBA_COLORS.reviewPurple, "#6f5688", "#9b87b0", "#cbbfda", "#f5f1f8"],
  cocoa: [NCBA_COLORS.textStrong, NCBA_COLORS.textMedium, NCBA_COLORS.textMuted, "#9aa89d", NCBA_COLORS.background],
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
  unknown: "#9aa89d",
};