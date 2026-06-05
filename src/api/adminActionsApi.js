import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:5000/api";

export const adminActionsApi = createApi({
  reducerPath: "adminActionsApi",
  baseQuery: createBaseQueryWithSession({
    baseUrl: `${API_BASE_URL}/adminactions`,
  }),
  tagTypes: ["AdminAction"],
  endpoints: (builder) => ({
    getPendingActions: builder.query({
      query: () => "/pending",
      providesTags: ["AdminAction"],
    }),

    getAdminActions: builder.query({
      query: (status) => (status ? `?status=${status}` : ""),
      providesTags: ["AdminAction"],
    }),

    getAdminAction: builder.query({
      query: (actionId) => `/${actionId}`,
      providesTags: (result, error, actionId) => [
        { type: "AdminAction", id: actionId },
      ],
    }),

    getPendingActionsCount: builder.query({
      query: () => "/pending-count",
      providesTags: ["AdminAction"],
    }),

    approveAction: builder.mutation({
      query: ({ adminActionId }) => ({
        url: "/approve",
        method: "POST",
        body: { adminActionId },
      }),
      invalidatesTags: ["AdminAction"],
    }),

    rejectAction: builder.mutation({
      query: ({ adminActionId, reason }) => ({
        url: "/reject",
        method: "POST",
        body: { adminActionId, reason },
      }),
      invalidatesTags: ["AdminAction"],
    }),

    executeAction: builder.mutation({
      query: (actionId) => ({
        url: `/execute/${actionId}`,
        method: "POST",
      }),
      invalidatesTags: ["AdminAction"],
    }),

    recordUserCreationAction: builder.mutation({
      query: (createUserData) => ({
        url: "/record-user-creation",
        method: "POST",
        body: createUserData,
      }),
      invalidatesTags: ["AdminAction"],
    }),

    recordAction: builder.mutation({
      query: (actionData) => ({
        url: "/record-action",
        method: "POST",
        body: actionData,
      }),
      invalidatesTags: ["AdminAction"],
    }),
  }),
});

export const {
  useGetPendingActionsQuery,
  useGetAdminActionsQuery,
  useGetAdminActionQuery,
  useGetPendingActionsCountQuery,
  useApproveActionMutation,
  useRejectActionMutation,
  useExecuteActionMutation,
  useRecordUserCreationActionMutation,
  useRecordActionMutation,
} = adminActionsApi;
