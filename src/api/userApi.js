import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL + "/api/users",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const normalizeRole = (role) => {
  if (!role) return role;
  const key = String(role).trim().toLowerCase();
  const roleMap = {
    admin: "Admin",
    rm: "RM",
    approver: "Approver",
    cocreator: "CoCreator",
    cochecker: "CoChecker",
    customer: "Customer",
  };
  return roleMap[key] || role;
};

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => "/",
      providesTags: ["User"],
    }),

    createUser: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: { ...data, role: normalizeRole(data?.role) },
      }),
      invalidatesTags: ["User"],
    }),

    toggleActive: builder.mutation({
      query: (id) => ({
        url: `/${id}/active`,
        method: "PUT",
      }),
      invalidatesTags: ["User"],
    }),

    getCustomers: builder.query({
      query: () => "",
      transformResponse: (res) => res.filter((u) => u.role === "Customer"),
      providesTags: ["User"],
    }),

    // Server-side customers endpoint with optional search query
    getCustomersServer: builder.query({
      query: (q = "") => `/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      providesTags: ["User"],
    }),

    getApprovers: builder.query({
      query: () => `/?role=approver`,
      providesTags: ["User"],
    }),

    changeRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/${id}/role`,
        method: "PUT",
        body: { role: normalizeRole(role) },
      }),
      invalidatesTags: ["User"],
    }),

    reassignTasks: builder.mutation({
      query: ({ fromUserId, toUserId }) => ({
        url: `/${fromUserId}/reassign`,
        method: "POST",
        body: { toUserId },
      }),
      invalidatesTags: ["User"],
    }),

    getOnlineUsers: builder.query({
      query: () => "/online",
      providesTags: ["User"],
    }),

    heartbeatPresence: builder.mutation({
      query: () => ({
        url: "/presence/heartbeat",
        method: "POST",
      }),
    }),

    getUsersWithStatus: builder.query({
      query: () => "/status",
      providesTags: ["User"],
    }),

    getUserActivity: builder.query({
      query: (userId) => `/${userId}/activity`,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleActiveMutation,
  useChangeRoleMutation,
  useGetCustomersQuery,
  useGetCustomersServerQuery,
  useGetApproversQuery,
  useReassignTasksMutation,
  useGetOnlineUsersQuery,
  useHeartbeatPresenceMutation,
  useGetUsersWithStatusQuery,
  useGetUserActivityQuery,
  useLazyGetUserActivityQuery,
} = userApi;