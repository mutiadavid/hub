import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

const baseQuery = createBaseQueryWithSession({
  baseUrl: import.meta.env.VITE_API_URL + "/api",
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    registerAdmin: builder.mutation({
      query: (data) => ({
        url: "admin/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    login: builder.mutation({
      query: (data) => ({
        url: "admin/auth/login",
        method: "POST",
        body: data,
      }),
    }),
    
    verifyEmailMFA: builder.mutation({
      query: (data) => ({
        url: "admin/auth/verify-email-mfa",
        method: "POST",
        body: data,
      }),
    }),
    resendMFACode: builder.mutation({
      query: (sessionToken) => ({
        url: "admin/auth/resend-mfa-code",
        method: "POST",
        body: { sessionToken },
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "admin/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useRegisterAdminMutation,
  useLoginMutation,
  useVerifyEmailMFAMutation,
  useResendMFACodeMutation,
  useLogoutMutation,
} = authApi;

