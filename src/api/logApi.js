import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const logApi = createApi({
  reducerPath: "logApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/api", // <-- changed to match backend
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Log"],
  endpoints: (builder) => ({
    getLogs: builder.query({
      query: () => "/logs", // <-- matches your backend route
      transformResponse: (res) => res.data, // assuming your controller returns { data: [...] }
      providesTags: ["Log"],
    }),
  }),
});

export const { useGetLogsQuery } = logApi;
