import { API_BASE_URL, STATUS_COLORS } from "./constants";
import dayjs from "dayjs"

export const calculateDocumentStats = (docs) => {
  const total = docs.length;

  const submitted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "submitted" ||
      d.action?.toLowerCase() === "submitted" ||
      d.coStatus?.toLowerCase() === "submitted",
  ).length;

  const pendingFromRM = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingrm" ||
      d.action?.toLowerCase() === "pendingrm" ||
      d.coStatus?.toLowerCase() === "pendingrm",
  ).length;

  const pendingFromCo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingco" ||
      d.action?.toLowerCase() === "pendingco" ||
      d.coStatus?.toLowerCase() === "pendingco",
  ).length;

  const deferred = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "deferred" ||
      d.action?.toLowerCase() === "deferred" ||
      d.coStatus?.toLowerCase() === "deferred",
  ).length;

  const sighted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "sighted" ||
      d.action?.toLowerCase() === "sighted" ||
      d.coStatus?.toLowerCase() === "sighted",
  ).length;

  const waived = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "waived" ||
      d.action?.toLowerCase() === "waived" ||
      d.coStatus?.toLowerCase() === "waived",
  ).length;

  const tbo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "tbo" ||
      d.action?.toLowerCase() === "tbo" ||
      d.coStatus?.toLowerCase() === "tbo",
  ).length;

  // Calculate progress - deferred should be counted as completed
  const completedDocs = docs.filter((d) => {
    const status = (d.status || d.action || "").toLowerCase();
    return (
      status === "submitted" ||
      status === "sighted" ||
      status === "waived" ||
      status === "tbo" ||
      status === "deferred"
    );
  }).length;

  const incompleteDocs = docs.filter((d) => {
    const status = (d.status || d.action || "").toLowerCase();
    return status === "pendingrm" || status === "pendingco";
  }).length;

  const totalRelevantDocs = completedDocs + incompleteDocs;
  const progressPercent = totalRelevantDocs === 0
    ? 0
    : Math.round((completedDocs / totalRelevantDocs) * 100);

  return {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    progressPercent,
    completedDocs,
    incompleteDocs,
    totalRelevantDocs,
  };
};

export const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase();
  return STATUS_COLORS[statusLower] || STATUS_COLORS.default;
};

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");
  return expiry.isBefore(today) ? "expired" : "current";
};