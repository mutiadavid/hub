import { useState, useRef, useCallback, useEffect } from "react";
import { message } from "antd";
import { useSelector } from "react-redux";
import { API_BASE_URL, API_ORIGIN } from "../../../../config/runtimeConfig";

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

  const [searchMode, setSearchMode] = useState("customer");
  const [searchDclNumber, setSearchDclNumber] = useState("");
  const [dclSearchResults, setDclSearchResults] = useState([]);
  const dclSearchTimeoutRef = useRef(null);
  const [isSearchedByDcl, setIsSearchedByDcl] = useState(false);
  const [selectedDclId, setSelectedDclId] = useState(null);
  const [selectedChecklistStatus, setSelectedChecklistStatus] = useState("");

  // Typeahead search for customers
  const searchCustomersTypeahead = useCallback(async (q) => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = reduxToken || stored?.token;
      const url = `${API_ORIGIN}/api/customers/search?customerNumber=${encodeURIComponent(q)}${searchLoanType ? `&loanType=${encodeURIComponent(searchLoanType)}` : ""}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json",
        },
      });
      if (!res.ok) return;
      const results = await res.json();
      const mappedResults = (Array.isArray(results) ? results : [results]).filter(Boolean).map(c => ({
        ...c,
        // Use customerNumber as a stable identity key so the cache lookup in
        // fetchCustomer (index.jsx) can always find a typeahead-selected customer
        // without making an extra network round-trip.
        _id: c._id || c.id || c.customerNumber || `unknown-${Math.random().toString(36).substring(7)}`,
        id:  c.id  || c._id || c.customerNumber,
        name: c.name || c.customerName || c.cusShortName || "Unknown Customer"
      }));
      setCustomerSearchResults(mappedResults);
    } catch (err) {
      console.error("Typeahead search failed", err);
    }
  }, [searchLoanType, reduxToken]);

  // Typeahead search for DCLs
  const searchDclsTypeahead = useCallback(async (q) => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = reduxToken || stored?.token;

      const url = `${API_ORIGIN}/api/customers/search-dcl?dclNo=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
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
      console.error("DCL typeahead search failed", err);
      setDclSearchResults([]);
    }
  }, [reduxToken]);

  // Debounce customer search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchCustomerNumber || searchCustomerNumber.length < 1) {
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
    if (!searchDclNumber || searchDclNumber.length < 1) {
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