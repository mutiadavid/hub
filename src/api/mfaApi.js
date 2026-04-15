import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

const baseQuery = createBaseQueryWithSession({
  baseUrl: import.meta.env.VITE_API_URL + "/api",
});

export const mfaApi = createApi({
  reducerPath: "mfaApi",
  baseQuery,
  endpoints: (builder) => ({
    setupMFA: builder.mutation({
      query: () => ({
        url: "admin/auth/mfa/setup",
        method: "POST",
        body: {},
      }),
    }),
    verifyMFASetup: builder.mutation({
      query: (data) => ({
        url: "admin/auth/mfa/verify-setup",
        method: "POST",
        body: data,
      }),
    }),
    disableMFA: builder.mutation({
      query: (data) => ({
        url: "admin/auth/mfa/disable",
        method: "POST",
        body: data,
      }),
    }),
    generateBackupCodes: builder.mutation({
      query: (data) => ({
        url: "admin/auth/mfa/backup-codes",
        method: "POST",
        body: data,
      }),
    }),
    getMFAStatus: builder.query({
      query: () => ({
        url: "admin/auth/mfa/status",
        method: "GET",
      }),
    }),
    trustDevice: builder.mutation({
      query: (data) => ({
        url: "admin/auth/mfa/trust-device",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useSetupMFAMutation,
  useVerifyMFASetupMutation,
  useDisableMFAMutation,
  useGenerateBackupCodesMutation,
  useGetMFAStatusQuery,
  useTrustDeviceMutation,
} = mfaApi;
