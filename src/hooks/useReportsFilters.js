import { useState } from "react";

export default function useReportsFilters(initialFilters = {}) {
  const [filters, setFilters] = useState({
    searchText: "",
    dateRange: null,
    status: "",
    itemType: "",
    ...initialFilters,
  });

  const clearFilters = () =>
    setFilters({ searchText: "", dateRange: null, status: "", itemType: "" });

  return { filters, setFilters, clearFilters };
}
