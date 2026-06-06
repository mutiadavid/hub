import { useState, useRef, useCallback, useEffect } from "react";
import { normalizeCustomer } from "../utils/helpers";
import {
  useLazySearchCustomersQuery,
  useLazySearchDclsQuery,
} from "../../../../api/customerApi";

/**
 * Custom hook for customer and DCL search functionality.
 *
 * Search runs through the customerApi RTK Query slice, which inherits
 * cookie/session auth plus the redux Bearer token via baseQueryWithSession —
 * no hand-rolled fetch and no XSS-readable localStorage token reads.
 */
export const useCustomerSearch = () => {
  const [searchCustomerNumber, setSearchCustomerNumber] = useState("");
  const [searchLoanType, setSearchLoanType] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectCustomerModalVisible, setSelectCustomerModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const searchTimeoutRef = useRef(null);
  const searchSeqRef = useRef(0);

  const [searchMode, setSearchMode] = useState("customer");
  const [searchDclNumber, setSearchDclNumber] = useState("");
  const [dclSearchResults, setDclSearchResults] = useState([]);
  const dclSearchTimeoutRef = useRef(null);
  const dclSeqRef = useRef(0);
  const [isSearchedByDcl, setIsSearchedByDcl] = useState(false);
  const [selectedDclId, setSelectedDclId] = useState(null);
  const [selectedChecklistStatus, setSelectedChecklistStatus] = useState("");

  const [triggerCustomerSearch] = useLazySearchCustomersQuery();
  const [triggerDclSearch] = useLazySearchDclsQuery();

  // Debounce customer search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchCustomerNumber || searchCustomerNumber.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Sequence guard: ignore a slow earlier response that resolves after a
      // newer query has already been issued, so it can't overwrite fresh results.
      const seq = ++searchSeqRef.current;
      triggerCustomerSearch({
        customerNumber: searchCustomerNumber,
        loanType: searchLoanType,
      })
        .unwrap()
        .then((results) => {
          if (seq !== searchSeqRef.current) return;
          const mapped = (Array.isArray(results) ? results : [results])
            .filter(Boolean)
            .map(normalizeCustomer);
          setCustomerSearchResults(mapped);
        })
        .catch((err) => {
          if (seq !== searchSeqRef.current) return;
          console.error("Typeahead search failed", err);
          setCustomerSearchResults([]);
        });
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchCustomerNumber, searchLoanType, triggerCustomerSearch]);

  // Debounce DCL search
  useEffect(() => {
    if (dclSearchTimeoutRef.current) clearTimeout(dclSearchTimeoutRef.current);
    if (!searchDclNumber || searchDclNumber.length < 2) {
      setDclSearchResults([]);
      return;
    }

    dclSearchTimeoutRef.current = setTimeout(() => {
      const seq = ++dclSeqRef.current;
      triggerDclSearch(searchDclNumber)
        .unwrap()
        .then((results) => {
          if (seq !== dclSeqRef.current) return;
          setDclSearchResults(Array.isArray(results) ? results : []);
        })
        .catch((err) => {
          if (seq !== dclSeqRef.current) return;
          console.error("DCL typeahead search failed", err);
          setDclSearchResults([]);
        });
    }, 300);

    return () => {
      if (dclSearchTimeoutRef.current) clearTimeout(dclSearchTimeoutRef.current);
    };
  }, [searchDclNumber, triggerDclSearch]);

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
  };
};
