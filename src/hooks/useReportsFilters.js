import { useState } from "react";

export default function useReportsFilters(initialFilters = {}) {
  const [filters, setFilters] = useState({
    searchText: "",
    dateRange: null,
    status: "",
    ...initialFilters,
  });

  const clearFilters = () =>
    setFilters({ searchText: "", dateRange: null, status: "" });

  return { filters, setFilters, clearFilters };
}
