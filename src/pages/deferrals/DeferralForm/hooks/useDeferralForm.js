import { useState, useEffect } from "react";

/**
 * Custom hook to manage main deferral form state
 */
export const useDeferralForm = () => {
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [isCustomerFetched, setIsCustomerFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    name: "",
    role: "",
    email: "",
    employeeId: "",
  });

  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [loanType, setLoanType] = useState("");

  const [loanAmount, setLoanAmount] = useState("");
  const [dclNumber, setDclNumber] = useState("");
  const [deferralDescription, setDeferralDescription] = useState("");

  const [facilities, setFacilities] = useState([]);

  const [comments, setComments] = useState("");
  const [postedComments, setPostedComments] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewDeferralNumber, setPreviewDeferralNumber] = useState("");

  // Load current user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const u = parsed?.user || {};
        setCurrentUser((prev) => ({
          ...prev,
          name: u.name || prev.name || "Requestor",
          role: u.role || prev.role,
          email: u.email || prev.email,
          employeeId: u.employeeId || prev.employeeId,
        }));
      }
    } catch (e) {
      console.warn("Unable to load user from storage", e);
    }
  }, []);

  return {
    showSearchForm,
    setShowSearchForm,
    isCustomerFetched,
    setIsCustomerFetched,
    isSubmitting,
    setIsSubmitting,
    isFetching,
    setIsFetching,
    currentUser,
    setCurrentUser,
    customerName,
    setCustomerName,
    businessName,
    setBusinessName,
    customerNumber,
    setCustomerNumber,
    accountNumber,
    setAccountNumber,
    accountType,
    setAccountType,
    loanType,
    setLoanType,
    loanAmount,
    setLoanAmount,
    dclNumber,
    setDclNumber,
    deferralDescription,
    setDeferralDescription,
    facilities,
    setFacilities,
    comments,
    setComments,
    postedComments,
    setPostedComments,
    showConfirmModal,
    setShowConfirmModal,
    previewDeferralNumber,
    setPreviewDeferralNumber,
  };
};
