import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const baseQuery = createBaseQueryWithSession({
  baseUrl: configuredApiUrl ? `${configuredApiUrl}/api` : "/api",
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    // Restore session from HttpOnly cookie on page reload
    getMe: builder.query({
      query: () => "admin/auth/me",
    }),

    registerAdmin: builder.mutation({
      query: (data) => ({
        url: "admin/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    loginWithMicrosoft: builder.mutation({
      query: (data) => ({
        url: "admin/auth/sso/microsoft",
        method: "POST",
        body: { idToken: data?.idToken ?? "" },
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "admin/auth/logout",
        method: "POST",
      }),
    }),
    verifyMfaLogin: builder.mutation({
      query: (data) => ({
        url: "admin/auth/mfa/verify",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useRegisterAdminMutation,
  useLoginWithMicrosoftMutation,
  useLogoutMutation,
  useVerifyMfaLoginMutation,
} = authApi;

