const normalizeOrigin = (value, fallback) => {
  const raw = String(value || fallback || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      // Use only the origin (protocol + hostname + optional port) to avoid accidental
      // inclusion of path segments in environment variables (which causes doubled paths)
      const u = new URL(raw);
      return u.origin.replace(/\/+$/, "");
    } catch {
      return raw.replace(/\/+$/, "");
    }
  }

  if (raw.startsWith(":")) {
    return `http://localhost${raw}`.replace(/\/+$/, "");
  }

  return `http://${raw}`.replace(/\/+$/, "");
};

const resolveLocalDevOrigin = (origin) => {
  if (!import.meta.env.DEV || !origin) {
    return origin;
  }

  try {
    const url = new URL(origin);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);

    if (!isLocalhost || url.protocol !== "https:") {
      return origin;
    }

    const portMap = {
      "7082": "5000",
      "5082": "5000",
    };

    const resolvedPort = portMap[url.port] || url.port;
    return `http://${url.hostname}${resolvedPort ? `:${resolvedPort}` : ""}`;
  } catch {
    return origin;
  }
};

const DEFAULT_DEV_API_ORIGIN = "http://localhost:5000";

export const API_ORIGIN = normalizeOrigin(
  resolveLocalDevOrigin(import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL),
  DEFAULT_DEV_API_ORIGIN,
);

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const APP_URL = normalizeOrigin(
  import.meta.env.VITE_APP_URL,
  "http://localhost:5173",
);

export const SOCKET_URL = normalizeOrigin(
  import.meta.env.VITE_API_URL,
  "http://localhost:5001",
);

export const SOCKET_ENABLED = String(
  import.meta.env.VITE_SOCKET_ENABLED || "false",
).trim().toLowerCase() === "true";
