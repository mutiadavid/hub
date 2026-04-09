import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL}/api`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery,
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => "notifications",
      providesTags: (result = []) => [
        "Notification",
        ...result.map((notification) => ({
          type: "Notification",
          id: notification.id,
        })),
      ],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: "PUT",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const notification = draft.find((item) => item.id === id);
            if (notification) {
              notification.read = true;
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        "Notification",
        { type: "Notification", id },
      ],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: "notifications/read-all",
        method: "PUT",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            draft.forEach((notification) => {
              notification.read = true;
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;