import { API_ORIGIN } from "../config/runtimeConfig";

function normalizeApiDocumentUrl(url) {
  const value = String(url || "").trim();
  if (!value) return value;

  if (/^(https?:)?\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      parsed.pathname = parsed.pathname.replace(/\/api\/api\//i, "/api/");
      return parsed.toString();
    } catch {
      return value.replace(/\/api\/api\//i, "/api/");
    }
  }

  return value.replace(/^\/api\/api\//i, "/api/");
}

export function getFullUrl(url) {
  if (!url) return null;
  const normalizedUrl = normalizeApiDocumentUrl(url);
  // If already absolute or data/blob, return as-is
  if (/^(https?:)?\/\//i.test(normalizedUrl) || /^data:|^blob:/i.test(normalizedUrl)) return normalizedUrl;
  // For root-relative URLs like /uploads/..., prefix API base
  const base = API_ORIGIN;
  if (normalizedUrl.startsWith("/")) return (base ? base : "") + normalizedUrl;
  return normalizedUrl;
}

function dataUrlToBlobUrl(dataUrl) {
  if (!/^data:/i.test(String(dataUrl || ""))) return dataUrl;

  const match = String(dataUrl).match(/^data:([^;,]+)?((?:;[^,]+)*?),(.*)$/i);
  if (!match) return dataUrl;

  const mimeType = match[1] || "application/octet-stream";
  const meta = match[2] || "";
  const payload = match[3] || "";
  const isBase64 = /;base64/i.test(meta);

  let byteString;
  if (isBase64) {
    byteString = atob(payload);
  } else {
    byteString = decodeURIComponent(payload);
  }

  const length = byteString.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

function getAuthToken() {
  const directToken = localStorage.getItem("token");
  if (directToken) {
    return directToken;
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    return storedUser?.token || null;
  } catch {
    return null;
  }
}

export async function fetchProtectedFileBlob(url, token = getAuthToken()) {
  const full = getFullUrl(url);
  if (!full) {
    throw new Error("No file URL provided");
  }

  if (/^data:/i.test(full)) {
    const blobUrl = dataUrlToBlobUrl(full);
    const response = await fetch(blobUrl);
    return response.blob();
  }

  if (/^blob:/i.test(full)) {
    const response = await fetch(full);
    return response.blob();
  }

  const response = await fetch(full, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.blob();
}

export async function fetchProtectedFileObjectUrl(url, token = getAuthToken()) {
  const blob = await fetchProtectedFileBlob(url, token);
  return URL.createObjectURL(blob);
}

function safeOpenUrl(url, token) {
  if (!url) return;

  const resolvedUrl = /^data:/i.test(url) ? dataUrlToBlobUrl(url) : url;
  
  // If it's a regular URL (not data/blob), fetch with auth header and open
  if (!(/^data:|^blob:/i.test(url))) {
    fetchProtectedFileBlob(resolvedUrl, token)
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      })
      .catch((err) => {
        console.error("Failed to open file:", err);
        alert("Failed to open file. Please try again.");
      });
    return;
  }

  window.open(resolvedUrl, "_blank", "noopener,noreferrer");

  if (resolvedUrl && resolvedUrl !== url && /^blob:/i.test(resolvedUrl)) {
    setTimeout(() => {
      URL.revokeObjectURL(resolvedUrl);
    }, 60000);
  }
}

export function openFileInNewTab(url) {
  const full = getFullUrl(url);
  if (!full) return;
  const token = getAuthToken();
  safeOpenUrl(full, token);
}

export function downloadFile(url, filename) {
  const full = getFullUrl(url);
  if (!full) return;
  const token = getAuthToken();
  
  // For data URLs, use the old method
  if (/^data:/i.test(full)) {
    const resolvedUrl = dataUrlToBlobUrl(full);
    const link = document.createElement("a");
    link.href = resolvedUrl;
    if (filename) link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(resolvedUrl);
    }, 60000);
    return;
  }

  // For regular URLs, fetch with auth header
  fetchProtectedFileBlob(full, token)
    .then((blob) => {
      const link = document.createElement("a");
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      if (filename) link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    })
    .catch((err) => {
      console.error("Failed to download file:", err);
      alert("Failed to download file. Please try again.");
    });
}