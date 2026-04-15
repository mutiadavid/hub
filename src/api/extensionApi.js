import { createApi } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config/runtimeConfig";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

export const extensionApi = createApi({
    reducerPath: "extensionApi",
    baseQuery: createBaseQueryWithSession({ baseUrl: API_BASE_URL }),
    tagTypes: ["Extension"],

    endpoints: (builder) => ({
        /* ================= CREATE EXTENSION ================= */
        createExtension: builder.mutation({
            query: (body) => ({
                url: "extensions",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Extension"],
        }),

        /* ================= RM - GET EXTENSIONS ================= */
        getMyExtensions: builder.query({
            query: () => "extensions/my",
            providesTags: ["Extension"],
        }),

        /* ================= APPROVER ================= */
        getApproverExtensions: builder.query({
            query: () => "extensions/approver/queue",
            providesTags: ["Extension"],
        }),

        getApproverActionedExtensions: builder.query({
            query: () => "extensions/approver/actioned",
            providesTags: ["Extension"],
        }),

        approveExtension: builder.mutation({
            query: ({ id, comment }) => ({
                url: `extensions/${id}/approve`,
                method: "PUT",
                body: { comment },
            }),
            invalidatesTags: ["Extension"],
        }),

        rejectExtension: builder.mutation({
            query: ({ id, reason }) => ({
                url: `extensions/${id}/reject`,
                method: "PUT",
                body: { reason },
            }),
            invalidatesTags: ["Extension"],
        }),

        /* ================= CREATOR ================= */
        getCreatorPendingExtensions: builder.query({
            query: () => "extensions/creator/pending",
            providesTags: ["Extension"],
        }),

        approveExtensionAsCreator: builder.mutation({
            query: ({ id, comment }) => ({
                url: `extensions/${id}/approve-creator`,
                method: "PUT",
                body: { comment },
            }),
            invalidatesTags: ["Extension"],
        }),

        rejectExtensionAsCreator: builder.mutation({
            query: ({ id, reason }) => ({
                url: `extensions/${id}/reject-creator`,
                method: "PUT",
                body: { reason },
            }),
            invalidatesTags: ["Extension"],
        }),

        /* ================= CHECKER ================= */
        getCheckerPendingExtensions: builder.query({
            query: () => "extensions/checker/pending",
            providesTags: ["Extension"],
        }),

        approveExtensionAsChecker: builder.mutation({
            query: ({ id, comment }) => ({
                url: `extensions/${id}/approve-checker`,
                method: "PUT",
                body: { comment },
            }),
            invalidatesTags: ["Extension"],
        }),

        rejectExtensionAsChecker: builder.mutation({
            query: ({ id, reason }) => ({
                url: `extensions/${id}/reject-checker`,
                method: "PUT",
                body: { reason },
            }),
            invalidatesTags: ["Extension"],
        }),

        /* ================= GENERIC ================= */
        getExtensionById: builder.query({
            query: (id) => `extensions/${id}`,
            providesTags: (result, error, id) => [{ type: "Extension", id }],
        }),
    }),
});

export const {
    useCreateExtensionMutation,
    useGetMyExtensionsQuery,
    useGetApproverExtensionsQuery,
    useGetApproverActionedExtensionsQuery,
    useApproveExtensionMutation,
    useRejectExtensionMutation,
    useGetCreatorPendingExtensionsQuery,
    useApproveExtensionAsCreatorMutation,
    useRejectExtensionAsCreatorMutation,
    useGetCheckerPendingExtensionsQuery,
    useApproveExtensionAsCheckerMutation,
    useRejectExtensionAsCheckerMutation,
    useGetExtensionByIdQuery,
} = extensionApi;