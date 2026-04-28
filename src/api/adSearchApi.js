import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// AD Search has its own base URL and auth headers (X-App-Id, X-Api-Token)
// These should ideally be proxied through your own backend, but if calling
// directly, keep them in env vars.
const adBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_AD_SEARCH_URL || "http://uatintegrationsistio.ncbagroup.com/ad-search",
  prepareHeaders: (headers) => {
    const appId = import.meta.env.VITE_AD_APP_ID;
    const apiToken = import.meta.env.VITE_AD_API_TOKEN;
    if (appId) headers.set("X-App-Id", appId);
    if (apiToken) headers.set("X-Api-Token", apiToken);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const adSearchApi = createApi({
  reducerPath: "adSearchApi",
  baseQuery: adBaseQuery,
  endpoints: (builder) => ({
    searchAdUsers: builder.query({
      query: (searchTerm) => ({
        url: "/api/ADSearch/search",
        method: "POST",
        body: {
          query: searchTerm?.trim() || "",
          maxResults: 10,
          useRegex: false,
          includeGroups: false,
          includeSuggestions: false,
          bypassCache: false,
        },
      }),
      // Cache results per query string for 60s to reduce duplicate hits
      keepUnusedDataFor: 60,
      transformResponse: (response) => {
        if (!response?.success || !Array.isArray(response.users)) {
          return [];
        }
        return response.users;
      },
    }),

    getAdUserDetails: builder.query({
      query: (samAccountName) => ({
        url: `/api/ADSearch/user/${encodeURIComponent(samAccountName)}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useLazySearchAdUsersQuery,
  useSearchAdUsersQuery,
  useGetAdUserDetailsQuery,
} = adSearchApi;