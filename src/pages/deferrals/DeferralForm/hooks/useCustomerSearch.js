import { useState, useRef, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config/runtimeConfig";
import { normalizeCustomer } from "../utils/helpers";

/**
 * Custom hook for customer and DCL search functionality
 */
export const useCustomerSearch = () => {
  const reduxToken = useSelector((state) => state.auth.token);
  const [searchCustomerNumber, setSearchCustomerNumber] = useState("");
  const [searchLoanType, setSearchLoanType] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectCustomerModalVisible, setSelectCustomerModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const searchTimeoutRef = useRef(null);
  const customerAbortRef = useRef(null);

  const [searchMode, setSearchMode] = useState("customer");
  const [searchDclNumber, setSearchDclNumber] = useState("");
  const [dclSearchResults, setDclSearchResults] = useState([]);
  const dclSearchTimeoutRef = useRef(null);
  const dclAbortRef = useRef(null);
  const [isSearchedByDcl, setIsSearchedByDcl] = useState(false);
  const [selectedDclId, setSelectedDclId] = useState(null);
  const [selectedChecklistStatus, setSelectedChecklistStatus] = useState("");

  // Typeahead search for customers
  const searchCustomersTypeahead = useCallback(async (q) => {
    // Abort any in-flight request so a slow earlier response can't land after,
    // and overwrite, the results for a newer query.
    if (customerAbortRef.current) customerAbortRef.current.abort();
    const controller = new AbortController();
    customerAbortRef.current = controller;
    try {
      const url = `${API_BASE_URL}/customers/search?customerNumber=${encodeURIComponent(q)}${searchLoanType ? `&loanType=${encodeURIComponent(searchLoanType)}` : ""}`;
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal,
        headers: {
          ...(reduxToken ? { authorization: `Bearer ${reduxToken}` } : {}),
          "content-type": "application/json",
        },
      });
      if (!res.ok) return;
      const results = await res.json();
      const mappedResults = (Array.isArray(results) ? results : [results])
        .filter(Boolean)
        .map(normalizeCustomer);
      setCustomerSearchResults(mappedResults);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Typeahead search failed", err);
    }
  }, [searchLoanType, reduxToken]);

  // Typeahead search for DCLs
  const searchDclsTypeahead = useCallback(async (q) => {
    if (dclAbortRef.current) dclAbortRef.current.abort();
    const controller = new AbortController();
    dclAbortRef.current = controller;
    try {
      const url = `${API_BASE_URL}/customers/search-dcl?dclNo=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal,
        headers: {
          ...(reduxToken ? { authorization: `Bearer ${reduxToken}` } : {}),
          "content-type": "application/json",
        },
      });
      if (!res.ok) {
        console.debug("DCL typeahead response not OK", res.status);
        setDclSearchResults([]);
        return;
      }
      const results = await res.json();
      setDclSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("DCL typeahead search failed", err);
      setDclSearchResults([]);
    }
  }, [reduxToken]);

  // Debounce customer search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchCustomerNumber || searchCustomerNumber.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomersTypeahead(searchCustomerNumber);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchCustomerNumber, searchCustomersTypeahead]);

  // Debounce DCL search
  useEffect(() => {
    if (dclSearchTimeoutRef.current) clearTimeout(dclSearchTimeoutRef.current);
    if (!searchDclNumber || searchDclNumber.length < 2) {
      setDclSearchResults([]);
      return;
    }

    dclSearchTimeoutRef.current = setTimeout(() => {
      searchDclsTypeahead(searchDclNumber);
    }, 300);

    return () => {
      if (dclSearchTimeoutRef.current) clearTimeout(dclSearchTimeoutRef.current);
    };
  }, [searchDclNumber, searchDclsTypeahead]);

  const handleSelectCustomer = useCallback((customer) => {
    // Accept either _id or id coming from backend
    setSelectedCustomerId(customer._id || customer.id || customer.customerNumber || null);
    setSelectCustomerModalVisible(false);
    setCustomerSearchResults([]);
  }, []);

  const handleCloseCustomerModal = useCallback(() => {
    setSelectCustomerModalVisible(false);
    setCustomerSearchResults([]);
  }, []);

  return {
    searchCustomerNumber,
    setSearchCustomerNumber,
    searchLoanType,
    setSearchLoanType,
    customerSearchResults,
    setCustomerSearchResults,
    selectCustomerModalVisible,
    setSelectCustomerModalVisible,
    selectedCustomerId,
    setSelectedCustomerId,
    searchMode,
    setSearchMode,
    searchDclNumber,
    setSearchDclNumber,
    dclSearchResults,
    setDclSearchResults,
    isSearchedByDcl,
    setIsSearchedByDcl,
    selectedDclId,
    setSelectedDclId,
    selectedChecklistStatus,
    setSelectedChecklistStatus,
    handleSelectCustomer,
    handleCloseCustomerModal,
    searchCustomersTypeahead,
    searchDclsTypeahead,
  };
};