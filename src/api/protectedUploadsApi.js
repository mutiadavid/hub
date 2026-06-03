import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";
import { API_BASE_URL } from "../config/runtimeConfig";

const baseQuery = createBaseQueryWithSession({ baseUrl: API_BASE_URL });

// Custom base query for blob responses (bypasses JSON parsing)
const blobBaseQuery = async (args, api, extraOptions) => {
  const token = api.getState()?.auth?.token;
  const baseUrl = API_BASE_URL;
  // Remove leading slash from path so it's relative to baseUrl (preserves /api in baseUrl)
  const path = args.url.startsWith('/') ? args.url.substring(1) : args.url;
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;

  try {
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      method: args.method || "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      return { error: { status: response.status, data: await response.text() } };
    }

    const blob = await response.blob();
    return { data: blob };
  } catch (error) {
    return { error: { status: 0, data: error.message } };
  }
};

function normalizeFileUrlForApi(fileUrl) {
  if (!fileUrl) return "/protected-uploads/";

  const raw = String(fileUrl || "").trim();
  // If it's an absolute URL, extract the pathname/search/hash
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      // fallthrough
    }
  }

  // If the client provided a path that starts with /api/, remove the leading /api
  // because our baseUrl (API_BASE_URL) already includes the /api prefix.
  if (raw.startsWith("/api/")) return raw.slice(4);
  return raw;
}

export const protectedUploadsApi = createApi({
  reducerPath: "protectedUploadsApi",
  baseQuery: blobBaseQuery,
  endpoints: (builder) => ({
    // Fetch a protected file as a Blob. The argument is the full file URL
    // (as returned by the backend, e.g. "/api/protected-uploads/...").
    fetchFile: builder.query({
      query: (fileUrl) => {
        const normalized = normalizeFileUrlForApi(fileUrl);
        // Ensure leading slash for relative path
        const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
        // When baseUrl is API_BASE_URL (which contains /api), ensure we don't keep an extra /api prefix
        const rel = path.startsWith("/api/") ? path.slice(4) : path;
        return { url: rel, method: "GET" };
      },
    }),
  }),
});

export const { useLazyFetchFileQuery } = protectedUploadsApi;
