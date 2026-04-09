const normalizeOrigin = (value, fallback) => {
  const raw = String(value || fallback || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  if (raw.startsWith(":")) {
    return `http://localhost${raw}`.replace(/\/+$/, "");
  }

  return `http://${raw}`.replace(/\/+$/, "");
};

export const API_ORIGIN = normalizeOrigin(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL,
  "http://localhost:5000",
);

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const APP_URL = normalizeOrigin(
  import.meta.env.VITE_APP_URL,
  "http://localhost:5173",
);

export const SOCKET_URL = normalizeOrigin(
  import.meta.env.VITE_SOCKET_URL,
  "http://localhost:5001",
);