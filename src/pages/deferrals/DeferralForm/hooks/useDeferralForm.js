import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

/**
 * Custom hook to manage main deferral form state
 */
export const useDeferralForm = () => {
  const user = useSelector((state) => state.auth.user);
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

  // Business segment fields (mirrors DCL creation payload)
  const [classification, setClassification] = useState("");
  const [businessSegment, setBusinessSegment] = useState("");
  const [businessSegmentDesc, setBusinessSegmentDesc] = useState("");
  const [subSegment, setSubSegment] = useState("");
  const [subSegmentDesc, setSubSegmentDesc] = useState("");
  const [custType, setCustType] = useState("");
  const [customerBranchName, setCustomerBranchName] = useState("");

  const [loanAmount, setLoanAmount] = useState("");
  const [dclNumber, setDclNumber] = useState("");
  const [deferralDescription, setDeferralDescription] = useState("");

  const [facilities, setFacilities] = useState([]);

  const [comments, setComments] = useState("");
  const [postedComments, setPostedComments] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewDeferralNumber, setPreviewDeferralNumber] = useState("");

  // Load current user from Redux or localStorage on mount/user change
  useEffect(() => {
    if (user) {
      setCurrentUser({
        name: user.name || "Requestor",
        role: user.role || "",
        email: user.email || "",
        employeeId: user.employeeId || "",
      });
    } else {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const u = parsed?.user || {};
          setCurrentUser({
            name: u.name || "Requestor",
            role: u.role || "",
            email: u.email || "",
            employeeId: u.employeeId || "",
          });
        }
      } catch (e) {
        console.warn("Unable to load user from storage", e);
      }
    }
  }, [user]);

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
    classification,
    setClassification,
    businessSegment,
    setBusinessSegment,
    businessSegmentDesc,
    setBusinessSegmentDesc,
    subSegment,
    setSubSegment,
    subSegmentDesc,
    setSubSegmentDesc,
    custType,
    setCustType,
    customerBranchName,
    setCustomerBranchName,
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
