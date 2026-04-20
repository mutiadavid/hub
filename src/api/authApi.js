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
        body: {
          Username: data?.username || data?.email || "",
          Password: data?.password || "",
        },
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
  useLogoutMutation,
} = authApi;

