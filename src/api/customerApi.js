import { createApi } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../config/runtimeConfig";
import { createBaseQueryWithSession } from "./baseQueryWithSession";

// Base points to /api/customers — handled by CustomerController.cs.
// All endpoints inherit cookie/session auth (credentials: "include") and the
// redux Bearer token via createBaseQueryWithSession — no localStorage tokens.
const baseQuery = createBaseQueryWithSession({
  baseUrl: `${API_BASE_URL}/customers`,
});

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery,
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    // Search customers from the Data Warehouse by customer number (or partial
    // number). Accepts either a bare customerNumber string (legacy callers) or
    // an object { customerNumber, loanType } for the deferral typeahead.
    // GET /api/customers/search?customerNumber=<q>[&loanType=<t>]
    searchCustomers: builder.query({
      query: (arg = "") => {
        const { customerNumber = "", loanType = "" } =
          typeof arg === "string" ? { customerNumber: arg } : arg || {};
        const params = new URLSearchParams({ customerNumber });
        if (loanType) params.set("loanType", loanType);
        return `/search?${params.toString()}`;
      },
      providesTags: ["Customer"],
      // Keep results for 5 minutes; the DW is a read-only reference store
      keepUnusedDataFor: 300,
    }),

    // Typeahead search for DCLs by DCL number.
    // GET /api/customers/search-dcl?dclNo=<q>
    searchDcls: builder.query({
      query: (dclNo = "") => `/search-dcl?dclNo=${encodeURIComponent(dclNo)}`,
      providesTags: ["Customer"],
      keepUnusedDataFor: 300,
    }),

    // Explicit customer lookup on form submit.
    // POST /api/customers/search { customerNumber, loanType }
    lookupCustomer: builder.mutation({
      query: ({ customerNumber, loanType } = {}) => ({
        url: "/search",
        method: "POST",
        body: { customerNumber, loanType },
      }),
    }),
  }),
});

export const {
  useSearchCustomersQuery,
  useLazySearchCustomersQuery,
  useLazySearchDclsQuery,
  useLookupCustomerMutation,
} = customerApi;
