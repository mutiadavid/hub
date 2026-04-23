// src/api/queueApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config/runtimeConfig";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

export const queueApi = createApi({
  reducerPath: "queueApi",
  baseQuery: createBaseQueryWithSession({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    getRMQueue: builder.query({
      query: (rmId) => `/queues/${rmId}`, // must match backend route
    }),
  }),
});

export const { useGetRMQueueQuery } = queueApi;