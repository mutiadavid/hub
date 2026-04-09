import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL + "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
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
  }),
});

export const {
  useRegisterAdminMutation,
  useLoginMutation,
  useVerifyEmailMFAMutation,
  useResendMFACodeMutation,
} = authApi;

