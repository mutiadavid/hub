import { API_ORIGIN } from "../config/runtimeConfig";
import { protectedUploadsApi } from "../api/protectedUploadsApi";
import { store } from "../app/store";

function normalizeApiDocumentUrl(url) {
  const value = String(url || "").trim();
  if (!value) return value;

  // Rewrite legacy /uploads/ paths (not /api/uploads/) to /api/protected-uploads/
  // This handles old DB records that stored fileUrl as /uploads/checklists/...
  const legacyRewrite = (str) =>
    str.replace(/(?<!\bapi)\/uploads\//gi, "/api/protected-uploads/");

  if (/^(https?:)?\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      parsed.pathname = parsed.pathname.replace(/\/api\/api\//i, "/api/");
      parsed.pathname = parsed.pathname.replace(/(?<!\bapi)\/uploads\//i, "/api/protected-uploads/");
      // Collapse multiple occurrences of the protected-uploads segment
      parsed.pathname = parsed.pathname.replace(/(\/api\/protected-uploads\/)+/ig, "/api/protected-uploads/");
      return parsed.toString();
    } catch {
      return legacyRewrite(value.replace(/\/api\/api\//i, "/api/")).replace(/(\/api\/protected-uploads\/)+/ig, "/api/protected-uploads/");
    }
  }

  let result = value.replace(/^\/api\/api\//i, "/api/");
  // Only rewrite bare /uploads/ (not /api/uploads/ which is the uploads API)
  if (/^\/uploads\//i.test(result)) {
    result = result.replace(/^\/uploads\//i, "/api/protected-uploads/");
  }
  // Collapse duplicate protected-uploads segments if present
  result = result.replace(/(\/api\/protected-uploads\/)+/ig, "/api/protected-uploads/");
  return result;
}

function stripDocumentHash(url) {
  const value = String(url || "").trim();
  if (!value) return value;

  const marker = "#docSection=";
  const markerIndex = value.toLowerCase().lastIndexOf(marker.toLowerCase());
  if (markerIndex < 0) {
    return value;
  }

  return value.substring(0, markerIndex);
}

function stripDocTargetQuery(url) {
  const value = String(url || "").trim();
  if (!value) return value;

  try {
    const parsed = /^(https?:)?\/\//i.test(value)
      ? new URL(value)
      : new URL(value.startsWith("/") ? value : `/${value}`, "http://local");

    parsed.searchParams.delete("docTarget");

    if (/^(https?:)?\/\//i.test(value)) {
      return parsed.toString();
    }

    const relativeUrl = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return value.startsWith("/") ? relativeUrl : relativeUrl.replace(/^\//, "");
  } catch {
    return value;
  }
}

function buildDocumentUrlCandidates(url) {
  const candidates = [];
  const seen = new Set();

  const addCandidate = (candidate) => {
    const normalizedCandidate = String(candidate || "").trim();
    if (!normalizedCandidate || seen.has(normalizedCandidate)) {
      return;
    }

    seen.add(normalizedCandidate);
    candidates.push(normalizedCandidate);
  };

  const normalized = normalizeApiDocumentUrl(url);
  const withoutHash = stripDocumentHash(normalized);
  const withoutDocTarget = stripDocTargetQuery(withoutHash);

  addCandidate(normalized);
  addCandidate(withoutHash);
  addCandidate(withoutDocTarget);
  
  // Only add full URLs if the normalized path doesn't already start with /api/
  // (to avoid duplication when backend returns complete API paths)
  if (!String(normalized || "").toLowerCase().startsWith("/api/")) {
    addCandidate(getFullUrl(normalized));
    addCandidate(getFullUrl(withoutHash));
    addCandidate(getFullUrl(withoutDocTarget));
  }

  return candidates;
}

export function getFullUrl(url) {
  if (!url) return null;
  const normalizedUrl = normalizeApiDocumentUrl(url);
  
  // If already absolute or data/blob, return as-is
  if (/^(https?:)?\/\//i.test(normalizedUrl) || /^data:|^blob:/i.test(normalizedUrl)) {
    return normalizedUrl;
  }
  
  // For root-relative URLs, prefix API base
  const base = API_ORIGIN || "";

  // If normalizedUrl already starts with /api/protected-uploads/, just prefix base
  // The normalizeApiDocumentUrl function has already handled collapsing duplicates
  const uploadsPrefix = "/api/protected-uploads/";
  if (String(normalizedUrl || "").toLowerCase().startsWith(uploadsPrefix.toLowerCase())) {
    // It already has the /api/protected-uploads/ prefix, just add base
    return base + normalizedUrl;
  }

  // Default: join base + normalizedUrl
  if (normalizedUrl.startsWith("/")) return base + normalizedUrl;
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
  try {
    // Try window.__REDUX_DEVTOOLS_EXTENSION__ pattern (Redux DevTools)
    // In production, try to get token from sessionStorage if it was set
    const sessionToken = sessionStorage.getItem("authToken");
    if (sessionToken) return sessionToken;
  } catch (err) {
    // Silently continue
  }

  // Fallback: try localStorage - check multiple possible keys
  try {
    // Check for token stored by auth slice
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser?.token) return storedUser.token;
    
    // Also check for direct token storage
    const directToken = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (directToken) return directToken;
  } catch (err) {
    // Silently continue
  }

  // If no token found, return null - let credentials/cookies handle auth
  return null;
}

export async function fetchProtectedFileBlob(url, token) {
  // If no token passed in, try to get it now (not at call time)
  if (token === undefined) {
    token = getAuthToken();
  }
  
  const candidates = buildDocumentUrlCandidates(url);
  if (candidates.length === 0) {
    throw new Error("No file URL provided");
  }

  let lastError = null;

  for (const candidate of candidates) {
    try {
      if (/^data:/i.test(candidate)) {
        const blobUrl = dataUrlToBlobUrl(candidate);
        const response = await fetch(blobUrl);
        return response.blob();
      }

      if (/^blob:/i.test(candidate)) {
        const response = await fetch(candidate);
        return response.blob();
      }

      // Debug: log candidate being attempted (helps diagnose malformed URLs)
      try {
        // eslint-disable-next-line no-console
        console.debug("fetchProtectedFileBlob: attempting", { candidate, hasToken: Boolean(token) });
      } catch {}
      // Safeguard: Check for and log any duplicate /api/protected-uploads/ in the candidate
      const uploadsCount = (candidate.match(/\/api\/protected-uploads\//gi) || []).length;
      if (uploadsCount > 1) {
        // eslint-disable-next-line no-console
        console.warn("fetchProtectedFileBlob: Detected duplicate path segments in candidate", {
          candidate,
          uploadsCount,
        });
        // Skip this candidate and continue trying others
        lastError = new Error(`Malformed URL: duplicate /api/protected-uploads/ segments detected`);
        continue;
      }

      // Use RTK Query via the store to fetch protected file blobs so we centralize auth
      try {
        const actionResult = await store.dispatch(protectedUploadsApi.endpoints.fetchFile.initiate(candidate));
        if (actionResult?.data) {
          return actionResult.data; // Blob returned by responseHandler
        }

        if (actionResult?.error) {
          // Record the error and continue to next candidate
          lastError = new Error(actionResult.error?.data?.message || actionResult.error?.error || `HTTP ${actionResult.error?.status || "error"}`);
          continue;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch protected file");
}

export async function fetchProtectedFileObjectUrl(url, token) {
  // If no token passed in, try to get it now (not at call time)
  if (token === undefined) {
    token = getAuthToken();
  }
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
