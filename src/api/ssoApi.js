import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL + "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

export const ssoApi = createApi({
  reducerPath: "ssoApi",
  baseQuery,
  endpoints: (builder) => ({
    getSSOProviders: builder.query({
      query: () => ({
        url: "admin/auth/sso/providers",
        method: "GET",
      }),
    }),
    initializeSSOLogin: builder.mutation({
      query: (data) => ({
        url: "admin/auth/sso/authorize",
        method: "POST",
        body: data,
      }),
    }),
    handleSSOCallback: builder.mutation({
      query: (data) => ({
        url: "admin/auth/sso/callback",
        method: "POST",
        body: data,
      }),
    }),
    linkSSOAccount: builder.mutation({
      query: (data) => ({
        url: "admin/auth/sso/link",
        method: "POST",
        body: data,
      }),
    }),
    unlinkSSOAccount: builder.mutation({
      query: (data) => ({
        url: "admin/auth/sso/unlink",
        method: "POST",
        body: data,
      }),
    }),
    getSSOConnections: builder.query({
      query: () => ({
        url: "admin/auth/sso/connections",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetSSOProvidersQuery,
  useInitializeSSOLoginMutation,
  useHandleSSOCallbackMutation,
  useLinkSSOAccountMutation,
  useUnlinkSSOAccountMutation,
  useGetSSOConnectionsQuery,
} = ssoApi;
