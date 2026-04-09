// src/api/queueApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config/runtimeConfig";

export const queueApi = createApi({
  reducerPath: "queueApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    getRMQueue: builder.query({
      query: (rmId) => `/queues/${rmId}`, // must match backend route
    }),
  }),
});

export const { useGetRMQueueQuery } = queueApi;