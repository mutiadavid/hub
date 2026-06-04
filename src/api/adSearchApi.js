
// import { createApi } from "@reduxjs/toolkit/query/react";
// import { createBaseQueryWithSession } from "./baseQueryWithSession";
// import { API_BASE_URL } from "../config/runtimeConfig";

// const baseQuery = createBaseQueryWithSession({
//   baseUrl: `${API_BASE_URL}/users`,
// });

// export const adSearchApi = createApi({
//   reducerPath: "adSearchApi",
//   baseQuery,
//   endpoints: (builder) => ({
//     searchAdUsers: builder.query({
//       query: (input) => {
//         const searchTerm = typeof input === "string" ? input : input?.query;
//         const maxResults =
//           typeof input === "object" && input !== null && Number(input.maxResults) > 0
//             ? Number(input.maxResults)
//             : 10;

//         return ({
//         url: "ad-search",
//         method: "POST",
//         body: {
//           query: searchTerm?.trim() || "",
//           maxResults,
//         },
//       });
//       },
//       keepUnusedDataFor: 60,
//       transformResponse: (response) => {
//         if (!response) return [];

//         // The upstream AD search service and this backend proxy may return
//         // different shapes. Handle the common ones robustly.
//         if (Array.isArray(response.users)) return response.users;

//         // Some services may wrap payload under "data"
//         if (Array.isArray(response.data?.users)) return response.data.users;

//         // If the backend proxy returns { success: true, users: [...] }
//         if (response.success === true && Array.isArray(response.users)) return response.users;

//         // Sometimes the service may return { users: [...] } without "success"
//         if (Array.isArray(response?.users)) return response.users;

//         return [];
//       },
//     }),
//   }),
// });

// export const { useLazySearchAdUsersQuery, useSearchAdUsersQuery } = adSearchApi;

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

const baseQuery = createBaseQueryWithSession({
  baseUrl: import.meta.env.VITE_API_URL + "/api/users",
});

export const adSearchApi = createApi({
  reducerPath: "adSearchApi",
  baseQuery,
  endpoints: (builder) => ({
    searchAdUsers: builder.query({
      query: (searchTerm) => ({
        url: "/ad-search",
        method: "POST",
        body: {
          query: searchTerm?.trim() || "",
          maxResults: 10,
        },
      }),
      keepUnusedDataFor: 60,
      transformResponse: (response) => {
        if (!response?.success || !Array.isArray(response.users)) {
          return [];
        }
        return response.users;
      },
    }),
  }),
});

export const { useLazySearchAdUsersQuery, useSearchAdUsersQuery } = adSearchApi;