import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

// Base points to /api/customers — handled by CustomerController.cs
const baseQuery = createBaseQueryWithSession({
  baseUrl: import.meta.env.VITE_API_URL + "/api/customers",
});

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery,
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    // Search customers from the Data Warehouse by customer number (or partial number)
    // GET /api/customers/search?customerNumber=<query>
    searchCustomers: builder.query({
      query: (customerNumber = "") =>
        `/search?customerNumber=${encodeURIComponent(customerNumber)}`,
      providesTags: ["Customer"],
      // Keep results for 5 minutes; the DW is a read-only reference store
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useSearchCustomersQuery } = customerApi;
