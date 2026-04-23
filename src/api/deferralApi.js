import { createApi } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config/runtimeConfig";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

const baseQuery = createBaseQueryWithSession({ baseUrl: API_BASE_URL });

export const deferralApi = createApi({
  reducerPath: "deferralApi",
  baseQuery,
  tagTypes: ["Deferral", "DeferralList"],
  endpoints: (builder) => ({
    // Get all deferrals for current user
    getAllDeferrals: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams(params || {}).toString();
        return `deferral?${queryString}`;
      },
      providesTags: ["DeferralList"],
    }),

    // Get deferral by ID
    getDeferralById: builder.query({
      query: (id) => `deferral/${id}`,
      providesTags: (result, error, id) => [{ type: "Deferral", id }],
    }),

    // Get deferrals by status
    getDeferralsByStatus: builder.query({
      query: (status) => `deferral/status/${status}`,
      providesTags: ["DeferralList"],
    }),

    // Search deferrals
    searchDeferrals: builder.query({
      query: (params) => {
        const queryString = new URLSearchParams(params || {}).toString();
        return `deferral/search?${queryString}`;
      },
      providesTags: ["DeferralList"],
    }),

    // Create deferral (RM role)
    createDeferral: builder.mutation({
      query: (data) => ({
        url: "deferral",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DeferralList"],
    }),

    // Update deferral
    updateDeferral: builder.mutation({
      query: ({ id, data }) => ({
        url: `deferral/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Deferral", id },
        "DeferralList",
      ],
    }),

    // Delete deferral
    deleteDeferral: builder.mutation({
      query: (id) => ({
        url: `deferral/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DeferralList"],
    }),

    // Approve deferral (CoChecker role)
    approveDeferral: builder.mutation({
      query: (id) => ({
        url: `deferral/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deferral", id },
        "DeferralList",
      ],
    }),

    // Reject deferral (CoChecker role)
    rejectDeferral: builder.mutation({
      query: (id) => ({
        url: `deferral/${id}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deferral", id },
        "DeferralList",
      ],
    }),

    // Get deferral statistics
    getDeferralStats: builder.query({
      query: () => "deferral/statistics",
      providesTags: ["DeferralList"],
    }),

    // Get deferral approvers
    getDeferralApprovers: builder.query({
      query: (deferralId) => `deferral/${deferralId}/approvers`,
      providesTags: (result, error, deferralId) => [
        { type: "Deferral", id: deferralId },
      ],
    }),

    // Update deferral approver
    updateDeferralApprover: builder.mutation({
      query: ({ deferralId, approverId, status }) => ({
        url: `deferral/${deferralId}/approver/${approverId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { deferralId }) => [
        { type: "Deferral", id: deferralId },
        "DeferralList",
      ],
    }),

    // Submit deferral for approval
    submitDeferral: builder.mutation({
      query: (id) => ({
        url: `deferral/${id}/submit`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deferral", id },
        "DeferralList",
      ],
    }),

    // Get deferral timeline/history
    getDeferralHistory: builder.query({
      query: (deferralId) => `deferral/${deferralId}/history`,
      providesTags: (result, error, deferralId) => [
        { type: "Deferral", id: deferralId },
      ],
    }),
  }),
});

export const {
  useGetAllDeferralsQuery,
  useGetDeferralByIdQuery,
  useGetDeferralsByStatusQuery,
  useSearchDeferralsQuery,
  useCreateDeferralMutation,
  useUpdateDeferralMutation,
  useDeleteDeferralMutation,
  useApproveDeferralMutation,
  useRejectDeferralMutation,
  useGetDeferralStatsQuery,
  useGetDeferralApproversQuery,
  useUpdateDeferralApproverMutation,
  useSubmitDeferralMutation,
  useGetDeferralHistoryQuery,
} = deferralApi;