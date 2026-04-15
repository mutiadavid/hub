
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

export const auditApi = createApi({
  reducerPath: "auditApi",
  baseQuery: createBaseQueryWithSession({ baseUrl: import.meta.env.VITE_API_URL + "/api" }),
  tagTypes: ["AuditLogs", "OnlineUsers"],
  endpoints: (builder) => ({
    /* ================= GET AUDIT LOGS ================= */
    // GET /api/audit/logs - Fetch audit logs with pagination and filtering
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: "/audit/logs",
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          action: params.action,
          userId: params.userId,
          resource: params.resource,
          startDate: params.startDate,
          endDate: params.endDate,
          status: params.status,
          search: params.search,
        },
      }),
      providesTags: ["AuditLogs"],
    }),

    /* ================= CREATE AUDIT LOG ================= */
    // POST /api/audit/logs - Create a new audit log entry
    createAuditLog: builder.mutation({
      query: (logData) => ({
        url: "/audit/logs",
        method: "POST",
        body: {
          action: logData.action, // e.g., "LOGIN", "CREATE_USER", "UPDATE_CHECKLIST"
          resource: logData.resource, // e.g., "User", "Checklist", "Deferral"
          resourceId: logData.resourceId,
          performedBy: logData.performedBy?._id || logData.performedByUserId,
          targetUser: logData.targetUser?._id || logData.targetUserId,
          targetRole: logData.targetRole,
          status: logData.status || "success", // "success" or "failed"
          details: logData.details,
          errorMessage: logData.errorMessage,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
        },
      }),
      invalidatesTags: ["AuditLogs"],
    }),

    /* ================= GET AUDIT LOG BY ID ================= */
    // GET /api/audit/logs/:id - Fetch a single audit log
    getAuditLogById: builder.query({
      query: (id) => `/audit/logs/${id}`,
      providesTags: (result, error, id) => [{ type: "AuditLogs", id }],
    }),

    /* ================= UPDATE AUDIT LOG ================= */
    // PATCH /api/audit/logs/:id - Update audit log (e.g., add notes, change status)
    updateAuditLog: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/audit/logs/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AuditLogs", id },
        "AuditLogs",
      ],
    }),

    /* ================= DELETE AUDIT LOG ================= */
    // DELETE /api/audit/logs/:id - Delete an audit log
    deleteAuditLog: builder.mutation({
      query: (id) => ({
        url: `/audit/logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AuditLogs"],
    }),

    /* ================= EXPORT AUDIT LOGS ================= */
    // GET /api/audit/logs/export - Export logs as CSV or PDF
    exportAuditLogs: builder.query({
      query: (params = {}) => ({
        url: "/audit/logs/export",
        params: {
          format: params.format || "csv", // "csv" or "pdf"
          action: params.action,
          userId: params.userId,
          resource: params.resource,
          startDate: params.startDate,
          endDate: params.endDate,
          status: params.status,
        },
      }),
    }),

    /* ================= GET AUDIT STATS ================= */
    // GET /api/audit/stats - Get audit log statistics
    getAuditLogStats: builder.query({
      query: () => "/audit/stats",
      providesTags: ["AuditLogs"],
    }),

    /* ================= GET ONLINE USERS ================= */
    // GET /api/audit/online-users - Get currently online users
    getOnlineUsers: builder.query({
      query: () => "/audit/online-users",
      providesTags: ["OnlineUsers"],
    }),

    /* ================= BULK DELETE AUDIT LOGS ================= */
    // DELETE /api/audit/logs - Delete logs matching criteria (admin only)
    bulkDeleteAuditLogs: builder.mutation({
      query: (filter) => ({
        url: "/audit/logs",
        method: "DELETE",
        body: filter, // { olderThan, resource, action, status }
      }),
      invalidatesTags: ["AuditLogs"],
    }),

    /* ================= ARCHIVE AUDIT LOGS ================= */
    // POST /api/audit/logs/archive - Archive logs (for compliance)
    archiveAuditLogs: builder.mutation({
      query: (params) => ({
        url: "/audit/logs/archive",
        method: "POST",
        body: {
          startDate: params.startDate,
          endDate: params.endDate,
          archiveName: params.archiveName,
        },
      }),
      invalidatesTags: ["AuditLogs"],
    }),
  }),
});

export const {
  useGetAuditLogsQuery,
  useCreateAuditLogMutation,
  useGetAuditLogByIdQuery,
  useUpdateAuditLogMutation,
  useDeleteAuditLogMutation,
  useExportAuditLogsQuery,
  useGetAuditLogStatsQuery,
  useGetOnlineUsersQuery,
  useBulkDeleteAuditLogsMutation,
  useArchiveAuditLogsMutation,
} = auditApi;
