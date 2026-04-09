import dayjs from "dayjs";

// Standardized, clean date formats without unnecessary numbers
export const DATE_FORMATS = {
  DATE_ONLY: "D MMM YYYY",              // "16 Feb 2026"
  DATE_TIME: "D MMM YYYY, h:mm A",      // "16 Feb 2026, 2:30 PM"
  DATE_TIME_SHORT: "D MMM, h:mm A",     // "16 Feb, 2:30 PM"
  TIME_ONLY: "h:mm A",                  // "2:30 PM"
  FILE_EXPORT: "YYYYMMDD_HHmm",         // "20260216_1430" (for file exports)
  FULL: "D MMM YYYY, h:mm A",           // Same as DATE_TIME
};

// Format date only (no time)
export const formatDate = (date) => {
  if (!date) return "—";
  return dayjs(date).format(DATE_FORMATS.DATE_ONLY);
};

// Format date with time (12-hour, no seconds)
export const formatDateTime = (date) => {
  if (!date) return "—";
  return dayjs(date).format(DATE_FORMATS.DATE_TIME);
};

// Format time only
export const formatTime = (date) => {
  if (!date) return "—";
  return dayjs(date).format(DATE_FORMATS.TIME_ONLY);
};

// Format for file exports (compact, no seconds)
export const formatFileTimestamp = (date = new Date()) => {
  return dayjs(date).format(DATE_FORMATS.FILE_EXPORT);
};

// Custom format with any pattern
export const formatWithPattern = (date, pattern = DATE_FORMATS.DATE_ONLY) => {
  if (!date) return "—";
  return dayjs(date).format(pattern);
};

// Check if date is expired
export const isDateExpired = (date) => {
  if (!date) return false;
  return dayjs(date).isBefore(dayjs(), "day");
};

// Get relative time (e.g., "2 hours ago", "yesterday")
export const getRelativeTime = (date) => {
  if (!date) return "—";
  return dayjs(date).fromNow();
};
