import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

export const logApi = createApi({
  reducerPath: "logApi",
  baseQuery: createBaseQueryWithSession({ baseUrl: import.meta.env.VITE_API_URL + "/api" }),
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
