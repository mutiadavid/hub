import React, { useState, useEffect } from "react";
import { Button, message } from "antd";
import { CloseOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import DocumentAccordion from "../../components/creator/DocumentAccordion";
import { useGetUsersQuery } from "../../api/userApi";
import { loanTypes, loanTypeDocuments } from "../docTypes";
import { useCreateCoCreatorChecklistMutation } from "../../api/checklistApi";
import ChecklistFormFields from "../../components/creator/ChecklistFormFields";
import DocumentInputSectionCoCreator from "../../components/creator/DocumentInputSection";
import { useAutoSaveDraft } from "../../hooks/useAutoSaveDraft";
import { saveDraft, getDraftRoute, getDrafts, deleteDraft } from "../../utils/draftsUtils";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../utils/authToast";
import "../../styles/creatorDesignSystem.css";

const normalizeDocumentEntry = (doc = {}) => ({
  ...doc,
  name: doc.name || "",
  action: doc.action || "",
  status: doc.status || doc.action || "pendingrm",
  comment: doc.comment || "",
  deferralNo: doc.deferralNo || doc.deferralNumber || "",
  deferralNumber: doc.deferralNumber || doc.deferralNo || "",
});

const normalizeDocumentCategories = (sourceDocuments = []) =>
  (Array.isArray(sourceDocuments) ? sourceDocuments : []).map((category) => ({
    ...category,
    docList: Array.isArray(category?.docList)
      ? category.docList.map((doc) => normalizeDocumentEntry(doc))
      : [],
  }));

const hasMissingDeferredNumbers = (sourceDocuments = []) =>
  (Array.isArray(sourceDocuments) ? sourceDocuments : []).some((category) =>
    (Array.isArray(category?.docList) ? category.docList : []).some(
      (doc) =>
        String(doc?.action || "").toLowerCase() === "deferred" &&
        !String(doc?.deferralNo || doc?.deferralNumber || "").trim(),
    ),
  );

const ChecklistsPage = ({ open, onClose, draftId: initialDraftId = null, coCreatorId }) => {
  console.log("=== ChecklistsPage RENDER START ===");
  console.log("open:", open);
  console.log("initialDraftId:", initialDraftId);
  console.log("coCreatorId:", coCreatorId);

  const navigate = useNavigate();
  const [loanType, setLoanType] = useState("");
  const [assignedToRM, setAssignedToRM] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerBranchName, setCustomerBranchName] = useState("");
  const [classification, setClassification] = useState("");
  const [businessSegment, setBusinessSegment] = useState("");
  const [businessSegmentDesc, setBusinessSegmentDesc] = useState("");
  const [subSegment, setSubSegment] = useState("");
  const [subSegmentDesc, setSubSegmentDesc] = useState("");
  const [custType, setCustType] = useState("");
  const [ibpsNo, setIbpsNo] = useState("");
  const [selectedMultipleLoanTypes, setSelectedMultipleLoanTypes] = useState(
    [],
  );
  const [newDocName, setNewDocName] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  console.log("Component state:");
  console.log("  customerNumber state:", customerNumber);
  console.log("  customerName state:", customerName);
  console.log("  customerEmail state:", customerEmail);
  console.log("  loanType state:", loanType);
  console.log("  assignedToRM state:", assignedToRM);

  const { data: users = [] } = useGetUsersQuery();
  console.log("users from useGetUsersQuery:", users);
  
  const rms = users.filter((u) => u.role?.toLowerCase() === "rm");
  console.log("rms filtered:", rms);

  const [createChecklist] = useCreateCoCreatorChecklistMutation();

  // Form data for auto-save
  const formData = {
    loanType,
    assignedToRM,
    customerId,
    customerName,
    customerNumber,
    customerEmail,
    ibpsNo,
    selectedMultipleLoanTypes,
    documents,
  };

  console.log("formData for auto-save:", formData);

  // Auto-save hook - saves every 2 seconds when form has data
  const { draftId: autoSavedDraftId, lastSaved } = useAutoSaveDraft({
    type: "cocreator",
    formData,
    interval: 2000,
    draftId: currentDraftId,
    enabled: open && (loanType || assignedToRM || customerNumber), // Only enable when modal is open and has some data
  });

  console.log("autoSaveDraft result:", { autoSavedDraftId, lastSaved });

  // Load draft from localStorage
  function loadDraft(id) {
    console.log("=== loadDraft START ===");
    console.log("Loading draft with id:", id);
    
    try {
      const drafts = getDrafts("cocreator");
      console.log("All cocreator drafts:", drafts);
      
      const draft = drafts.find((d) => d.id === id);
      console.log("Found draft:", draft);
      
      if (draft && draft.data) {
        const data = draft.data;
        console.log("Draft data:", data);
        
        console.log("Setting loanType to:", data.loanType || "");
        setLoanType(data.loanType || "");
        
        console.log("Setting assignedToRM to:", data.assignedToRM || "");
        setAssignedToRM(data.assignedToRM || "");
        
        console.log("Setting customerId to:", data.customerId || "");
        setCustomerId(data.customerId || "");
        
        console.log("Setting customerName to:", data.customerName || "");
        setCustomerName(data.customerName || "");
        
        console.log("Setting customerNumber to:", data.customerNumber || "");
        setCustomerNumber(data.customerNumber || "");
        
        console.log("Setting customerEmail to:", data.customerEmail || "");
        setCustomerEmail(data.customerEmail || "");
        
        console.log("Setting customerBranchName to:", data.customerBranchName || "");
        setCustomerBranchName(data.customerBranchName || "");
        
        console.log("Setting classification to:", data.classification || "");
        setClassification(data.classification || "");
        
        console.log("Setting businessSegment to:", data.businessSegment || "");
        setBusinessSegment(data.businessSegment || "");
        
        console.log("Setting businessSegmentDesc to:", data.businessSegmentDesc || "");
        setBusinessSegmentDesc(data.businessSegmentDesc || "");
        
        console.log("Setting subSegment to:", data.subSegment || "");
        setSubSegment(data.subSegment || "");
        
        console.log("Setting subSegmentDesc to:", data.subSegmentDesc || "");
        setSubSegmentDesc(data.subSegmentDesc || "");
        
        console.log("Setting custType to:", data.custType || "");
        setCustType(data.custType || "");
        
        console.log("Setting ibpsNo to:", data.ibpsNo || "");
        setIbpsNo(data.ibpsNo || "");
        
        console.log("Setting selectedMultipleLoanTypes to:", data.selectedMultipleLoanTypes || []);
        setSelectedMultipleLoanTypes(data.selectedMultipleLoanTypes || []);

        // Handle different document structures
        let docsToLoad = data.documents || [];
        console.log("Original docsToLoad:", docsToLoad);

        // If documents have a flat structure (from ReviewChecklistModal),
        // convert them to nested structure with docList
        if (
          docsToLoad.length > 0 &&
          docsToLoad[0].category &&
          !docsToLoad[0].docList
        ) {
          console.log("Detected flat document structure - converting to nested");
          // Group by category
          const groupedDocs = {};
          docsToLoad.forEach((doc, idx) => {
            console.log(`  Document ${idx}:`, doc);
            const category = doc.category || "Uncategorized";
            if (!groupedDocs[category]) {
              groupedDocs[category] = [];
            }
            groupedDocs[category].push({
              name: doc.name,
              action: doc.action || doc.status || "pendingrm",
              status: doc.status || doc.action || "pendingrm",
              comment: doc.comment || "",
              deferralNo: doc.deferralNo || doc.deferralNumber || "",
              fileUrl: doc.fileUrl,
            });
          });

          // Convert to nested structure
          docsToLoad = Object.keys(groupedDocs).map((category) => ({
            category,
            docList: groupedDocs[category],
          }));
          console.log("Converted nested docs:", docsToLoad);
        }

        const normalizedDocs = normalizeDocumentCategories(docsToLoad);
        console.log("Normalized documents:", normalizedDocs);
        setDocuments(normalizedDocs);
        setCurrentDraftId(draft.id);
        message.success("Draft restored successfully!");
      } else {
        console.log("No draft found with id:", id);
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      message.error("Failed to load draft");
    }
    
    console.log("=== loadDraft END ===");
  }

  // Reset form
  function resetForm() {
    console.log("=== resetForm called ===");
    console.log("Resetting all form fields to empty/default values");
    
    setLoanType("");
    setAssignedToRM("");
    setCustomerId("");
    setCustomerName("");
    setCustomerNumber("");
    setCustomerEmail("");
    setCustomerBranchName("");
    setClassification("");
    setBusinessSegment("");
    setBusinessSegmentDesc("");
    setSubSegment("");
    setSubSegmentDesc("");
    setCustType("");
    setIbpsNo("");
    setSelectedMultipleLoanTypes([]);
    setDocuments([]);
    setNewDocName("");
    setSelectedCategoryName(null);
    setCurrentDraftId(null);
    
    console.log("Reset complete");
  }

  // Update currentDraftId when auto-save provides one
  useEffect(() => {
    if (autoSavedDraftId && autoSavedDraftId !== currentDraftId) {
      console.log("useEffect: autoSavedDraftId changed, updating currentDraftId from", currentDraftId, "to", autoSavedDraftId);
      const timeoutId = window.setTimeout(() => {
        setCurrentDraftId(autoSavedDraftId);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [autoSavedDraftId, currentDraftId]);

  // Load draft data on mount if initialDraftId is provided
  useEffect(() => {
    console.log("useEffect: initialDraftId or open changed");
    console.log("  initialDraftId:", initialDraftId);
    console.log("  open:", open);
    
    const timeoutId = window.setTimeout(() => {
      if (initialDraftId) {
        console.log("Loading draft because initialDraftId is present");
        loadDraft(initialDraftId);
      } else if (open) {
        console.log("Resetting form because open is true and no initialDraftId");
        resetForm();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialDraftId, open]);

  // Manual save draft handler
  const handleSaveDraft = () => {
    console.log("=== handleSaveDraft called ===");
    console.log("Current formData:", formData);
    
    try {
      const saved = saveDraft("cocreator", formData, currentDraftId);
      console.log("saveDraft result:", saved);
      
      if (saved) {
        setCurrentDraftId(saved.id);
        console.log("currentDraftId updated to:", saved.id);
        message.success("Draft saved successfully!");
        navigate(getDraftRoute("cocreator"));
      } else {
        message.error("Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      message.error("Failed to save draft");
    }
  };

  const handleLoanTypeChange = (value) => {
    console.log("=== handleLoanTypeChange called ===");
    console.log("New loan type value:", value);
    
    setLoanType(value);
    setSelectedMultipleLoanTypes([]); // Reset multiple selection

    if (value !== "Multiple Loan Type") {
      const categories = loanTypeDocuments[value] || [];
      console.log("Categories for loan type:", categories);
      
      const newDocuments = categories.map((cat) => ({
        category: cat.title,
        docList: cat.documents.map((d) => ({
          name: d,
          status: "pendingrm",
          action: "",
          comment: "",
          deferralNo: "",
        })),
      }));
      
      console.log("Setting documents to:", newDocuments);
      setDocuments(newDocuments);
    } else {
      console.log("Loan type is 'Multiple Loan Type' - clearing documents until actual types selected");
      setDocuments([]); // Clear until actual types are selected
    }
  };

  // Logic to handle multiple loan types document population
  React.useEffect(() => {
    console.log("useEffect for multiple loan types triggered");
    console.log("  loanType:", loanType);
    console.log("  selectedMultipleLoanTypes:", selectedMultipleLoanTypes);
    
    if (
      loanType === "Multiple Loan Type" &&
      selectedMultipleLoanTypes.length > 0
    ) {
      console.log("Processing multiple loan types...");
      const mergedCategories = {};

      selectedMultipleLoanTypes.forEach((type) => {
        console.log("  Processing loan type:", type);
        const categories = loanTypeDocuments[type] || [];
        console.log("    Categories for this type:", categories);
        
        categories.forEach((cat) => {
          if (!mergedCategories[cat.title]) {
            mergedCategories[cat.title] = new Set();
          }
          cat.documents.forEach((doc) => {
            mergedCategories[cat.title].add(doc);
          });
        });
      });

      console.log("Merged categories:", mergedCategories);

      const newDocs = Object.keys(mergedCategories).map((title) => ({
        category: title,
        docList: Array.from(mergedCategories[title]).map((docName) => ({
          name: docName,
          status: "pendingrm",
          action: "",
          comment: "",
          deferralNo: "",
        })),
      }));

      console.log("Setting documents to:", newDocs);
      setDocuments(newDocs);
    }
  }, [selectedMultipleLoanTypes, loanType]);

  const handleAddNewDocument = () => {
    console.log("=== handleAddNewDocument called ===");
    console.log("  newDocName:", newDocName);
    console.log("  selectedCategoryName:", selectedCategoryName);
    
    if (!newDocName.trim() || !selectedCategoryName) return;

    setDocuments((prevDocs) => {
      console.log("Previous documents:", prevDocs);
      
      const categoryIdx = prevDocs.findIndex(
        (cat) => cat.category === selectedCategoryName,
      );
      console.log("Found category index:", categoryIdx);

      const newDoc = {
        name: newDocName.trim(),
        status: "pendingrm",
        action: "",
        comment: "",
        deferralNo: "",
      };
      console.log("New document to add:", newDoc);

      let newDocuments;
      if (categoryIdx > -1) {
        newDocuments = prevDocs.map((category, index) =>
          index === categoryIdx
            ? {
                ...category,
                docList: [...(category.docList || []), newDoc],
              }
            : category,
        );
      } else {
        newDocuments = [
          ...prevDocs,
          {
            category: selectedCategoryName,
            docList: [newDoc],
          },
        ];
      }
      
      console.log("Updated documents:", newDocuments);
      return newDocuments;
    });

    setNewDocName("");
    setSelectedCategoryName(null);
  };

  const handleSubmit = async () => {
    console.log("=== handleSubmit START ===");
    
    // If Multiple Loan Type is selected, ensure at least one actual type is picked
    const actualLoanType =
      loanType === "Multiple Loan Type"
        ? selectedMultipleLoanTypes.join(", ")
        : loanType;

    console.log("Actual loan type:", actualLoanType);
    console.log("assignedToRM:", assignedToRM);
    console.log("ibpsNo:", ibpsNo);
    console.log("selectedMultipleLoanTypes length:", selectedMultipleLoanTypes.length);
    console.log("hasMissingDeferredNumbers:", hasMissingDeferredNumbers(documents));

    if (
      !assignedToRM ||
      (loanType === "Multiple Loan Type"
        ? selectedMultipleLoanTypes.length === 0
        : !loanType) ||
      !ibpsNo
    ) {
      console.log("Validation failed: missing required fields");
      showWarningToast("Please fill all required fields.");
      return;
    }

    if (hasMissingDeferredNumbers(documents)) {
      console.log("Validation failed: missing deferral numbers");
      showWarningToast("Enter a deferral number for every deferred document before creating the DCL.");
      setActiveTab("documents");
      return;
    }

    const isValidGuid = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(id);

    const payload = {
      loanType: actualLoanType,
      assignedToRMId: assignedToRM,
      customerId: isValidGuid(customerId) ? customerId : null,
      customerName,
      customerNumber,
      customerEmail,
      customerBranchName,
      classification,
      businessSegment,
      businessSegmentDesc,
      subSegment,
      subSegmentDesc,
      custType,
      ibpsNo,
      documents: normalizeDocumentCategories(documents),
    };

    console.log("Submitting payload:", payload);

    try {
      const result = await createChecklist(payload).unwrap();
      console.log("Create checklist result:", result);
      showSuccessToast("Checklist created successfully!");
      // Delete draft after successful creation
      if (currentDraftId) {
        console.log("Deleting draft with id:", currentDraftId);
        deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }
      onClose();
    } catch (err) {
      console.error("Error creating checklist:", err);
      const errorMessage =
        err?.data?.message ||
        err?.data?.title ||
        err?.error ||
        "Error creating checklist.";
      showErrorToast(errorMessage);
    }
    
    console.log("=== handleSubmit END ===");
  };

  // Check if all required fields are filled
  const isFormValid =
    assignedToRM &&
    (loanType === "Multiple Loan Type"
      ? selectedMultipleLoanTypes.length > 0
      : loanType) &&
    ibpsNo &&
    !hasMissingDeferredNumbers(documents);

  console.log("isFormValid:", isFormValid);

  const totalDocumentCount = documents.reduce(
    (sum, category) => sum + (Array.isArray(category?.docList) ? category.docList.length : 0),
    0,
  );

  const categoryCount = documents.length;

  console.log("totalDocumentCount:", totalDocumentCount);
  console.log("categoryCount:", categoryCount);

  return (
    <>
      <style>{`
        .create-dcl-inline-shell {
          width: 100%;
          padding: 16px 0 0;
        }

        .create-dcl-inline-container {
          background: var(--color-white);
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
          border: 1px solid rgba(214, 189, 152, 0.2);
          margin: 0;
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 720px;
        }

        .creator-create-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 100%;
        }
        .creator-create-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 20px 24px 0;
        }
        .creator-create-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }
        .creator-create-close.ant-btn,
        .creator-create-close.ant-btn:hover,
        .creator-create-close.ant-btn:focus {
          width: 36px;
          height: 36px;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .create-dcl-modal-body {
          padding: 0 24px 24px;
          overflow: visible;
          flex: 1;
        }
        .creator-create-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .creator-create-subtitle {
          margin-top: 4px;
          font-size: 13px;
          line-height: 1.45;
          color: var(--color-text-light);
        }
        .creator-create-autosave {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(214, 189, 152, 0.2);
          background: var(--color-white);
          color: var(--color-text-medium);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .creator-create-autosave-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.2);
          color: var(--color-text-dark);
          font-size: 10px;
          font-weight: 700;
        }
        .creator-create-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 0 24px;
        }
        .creator-create-actionbar-left,
        .creator-create-actionbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .creator-create-button.ant-btn {
          min-height: 36px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          box-shadow: none !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }
        .creator-create-button--primary.ant-btn,
        .creator-create-button--primary.ant-btn:hover,
        .creator-create-button--primary.ant-btn:focus {
          border: none !important;
          background: var(--ncb-primary-500) !important;
          color: #fff !important;
        }
        .creator-create-button--primary.ant-btn[disabled],
        .creator-create-button--primary.ant-btn[aria-disabled="true"],
        .creator-create-button--primary.ant-btn:disabled {
          background: var(--color-disabled) !important;
          color: var(--color-text-light) !important;
          border: none !important;
          opacity: 1 !important;
        }
        .creator-create-button--secondary.ant-btn,
        .creator-create-button--secondary.ant-btn:hover,
        .creator-create-button--secondary.ant-btn:focus {
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
        }
        .creator-create-button--ghost.ant-btn,
        .creator-create-button--ghost.ant-btn:hover,
        .creator-create-button--ghost.ant-btn:focus {
          border: none !important;
          background: transparent !important;
          color: var(--color-primary-dark) !important;
          padding-left: 4px !important;
          padding-right: 4px !important;
        }
        .creator-create-validation {
          color: #b42318;
          font-size: 13px;
          line-height: 1.45;
        }
        .creator-create-layout {
          display: block;
        }
        .creator-create-main {
          min-width: 0;
        }
        .creator-create-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .creator-create-details-scroll {
          max-height: calc(125vh - 310px);
          overflow-y: auto;
          padding-right: 4px;
        }
        .creator-create-details-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .creator-create-details-scroll::-webkit-scrollbar-thumb {
          background: rgba(15, 58, 86, 0.28);
          border-radius: 999px;
        }
        .creator-create-details-scroll::-webkit-scrollbar-track {
          background: rgba(214, 189, 152, 0.1);
          border-radius: 999px;
        }
        .creator-create-details-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .creator-create-summary-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .creator-create-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .creator-create-summary-item {
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(245, 247, 244, 0.9);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .creator-create-summary-label {
          color: var(--color-text-medium);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .creator-create-summary-value {
          color: var(--color-text-dark);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
        }
        .creator-create-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .creator-create-tab {
          padding: 6px 12px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--color-text-light);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.25;
          cursor: pointer;
          white-space: nowrap;
        }
        .creator-create-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        .creator-create-ibps-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 16px;
        }
        .creator-create-ibps-input {
          width: 100%;
          min-height: 40px;
          border-radius: 6px;
          border: 1px solid rgba(214, 189, 152, 0.2);
          padding: 8px 12px;
          font-size: 13px;
          color: var(--color-text-medium);
          outline: none;
        }
        .creator-create-page .creator-caption {
          font-size: 11px;
          font-weight: 700;
        }
        .creator-create-page .creator-label {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-medium);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .creator-create-page .creator-helper-text {
          font-size: 11px;
          line-height: 1.45;
          color: var(--color-text-light);
        }
        .creator-create-page .ant-input,
        .creator-create-page .ant-input-affix-wrapper,
        .creator-create-page .ant-select-selection-item,
        .creator-create-page .ant-select-selection-placeholder,
        .creator-create-page .ant-picker,
        .creator-create-page .ant-picker-input > input,
        .creator-create-page input,
        .creator-create-page textarea {
          font-size: 13px !important;
        }
        .creator-create-page .ant-select-selector,
        .creator-create-page .ant-picker {
          min-height: 42px !important;
        }
        .creator-create-page .ant-btn {
          font-size: 13px;
        }
        .creator-create-ibps-input:focus {
          border-color: var(--color-primary-dark);
        }
        .creator-create-docs-layout {
          display: flex;
          flex-direction: row;
          gap: 16px;
          min-height: 0;
          align-items: flex-start;
        }
        .creator-create-docs-input-panel {
          flex: 1;
          min-width: 0;
        }
        .creator-create-docs-accordion-panel {
          flex: 3;
          min-width: 280px;
        }
        .creator-create-docs-scroll {
          max-height: calc(125vh - 310px);
          overflow-y: auto;
          padding-right: 4px;
        }
        .creator-create-docs-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .creator-create-docs-scroll::-webkit-scrollbar-thumb {
          background: rgba(15, 58, 86, 0.28);
          border-radius: 999px;
        }
        .creator-create-docs-scroll::-webkit-scrollbar-track {
          background: rgba(214, 189, 152, 0.1);
          border-radius: 999px;
        }
        @media (max-width: 1023px) {
          .creator-create-details-layout {
            grid-template-columns: 1fr;
          }
          .creator-create-docs-layout {
            flex-direction: column;
          }
          .creator-create-docs-accordion-panel {
            min-width: 0;
          }
        }
        @media (max-width: 767px) {
          .create-dcl-inline-shell {
            padding-top: 12px;
          }
          .creator-create-topbar,
          .create-dcl-modal-body {
            padding-left: 16px;
            padding-right: 16px;
          }
          .creator-create-actionbar {
            margin: 0 16px;
          }
          .creator-create-topbar {
            flex-direction: column;
            align-items: stretch;
          }
          .creator-create-actionbar {
            flex-direction: column;
            align-items: stretch;
          }
          .creator-create-actionbar-left,
          .creator-create-actionbar-right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>

      {open && (
        <div className="create-dcl-inline-shell">
          <div className="create-dcl-inline-container">
            <div className="creator-create-page creator-theme">
            <div className="creator-create-topbar">
              <div className="creator-create-topbar-main">
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    console.log("Close button clicked - resetting and closing");
                    resetForm();
                    onClose();
                  }}
                  className="creator-create-close"
                />
                <div>
                  <h1 className="creator-create-title">Create Document Checklist</h1>
                  <div className="creator-create-subtitle">Set up customer details and build the required document list.</div>
                </div>
              </div>
              <div className="creator-create-autosave">
                <FileTextOutlined />
                {lastSaved ? `Auto-saved: ${new Date(lastSaved).toLocaleTimeString()}` : "Draft not saved yet"}
                <span className="creator-create-autosave-count">{totalDocumentCount}</span>
              </div>
            </div>

            <div className="creator-create-actionbar">
              <div className="creator-create-actionbar-left">
                <Button className="creator-create-button creator-create-button--secondary" onClick={handleSaveDraft} disabled={!loanType && !assignedToRM && !customerNumber}>
                  Save Draft
                </Button>
                <Button className="creator-create-button creator-create-button--primary" onClick={handleSubmit} disabled={!isFormValid}>
                  Create DCL
                </Button>
              </div>
              <div className="creator-create-actionbar-right">
                <Button
                  className="creator-create-button creator-create-button--ghost"
                  onClick={() => {
                    console.log("Close (ghost) button clicked - resetting and closing");
                    resetForm();
                    onClose();
                  }}
                >
                  Close
                </Button>
                {!isFormValid && (
                  <div className="creator-create-validation">
                    Fill Assigned RM, Loan Type{loanType === "Multiple Loan Type" ? ", Actual Loan Types" : ""}, IBPS NO, and every deferral number for deferred documents.
                  </div>
                )}
              </div>
            </div>

            <div className="create-dcl-modal-body">
              <div className="creator-create-layout">
                <div className="creator-create-main">
                  <div className="creator-create-tabs">
                    <button type="button" className={`creator-create-tab ${activeTab === "details" ? "creator-create-tab--active" : ""}`} onClick={() => {
                      console.log("Switching to details tab");
                      setActiveTab("details");
                    }}>
                      Checklist Details
                    </button>
                    <button type="button" className={`creator-create-tab ${activeTab === "documents" ? "creator-create-tab--active" : ""}`} onClick={() => {
                      console.log("Switching to documents tab");
                      setActiveTab("documents");
                    }}>
                      Required Documents
                    </button>
                  </div>

                  {activeTab === "details" && (
                    <div className="creator-create-details-scroll">
                      <div className="creator-create-details-layout">
                        <div className="creator-create-details-main">
                          <ChecklistFormFields
                            rms={rms}
                            assignedToRM={assignedToRM}
                            setAssignedToRM={setAssignedToRM}
                            customerId={customerId}
                            setCustomerId={setCustomerId}
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerNumber={customerNumber}
                            setCustomerNumber={setCustomerNumber}
                            customerEmail={customerEmail}
                            setCustomerEmail={setCustomerEmail}
                            setCustomerBranchName={setCustomerBranchName}
                            setClassification={setClassification}
                            setBusinessSegment={setBusinessSegment}
                            setBusinessSegmentDesc={setBusinessSegmentDesc}
                            setSubSegment={setSubSegment}
                            setSubSegmentDesc={setSubSegmentDesc}
                            setCustType={setCustType}
                            loanType={loanType}
                            loanTypes={loanTypes}
                            handleLoanTypeChange={handleLoanTypeChange}
                            selectedMultipleLoanTypes={selectedMultipleLoanTypes}
                            setSelectedMultipleLoanTypes={setSelectedMultipleLoanTypes}
                          />

                          <div className="creator-create-ibps-card">
                            <label className="creator-label">IBPS NO / CQ NO</label>
                            <input
                              type="text"
                              placeholder="Enter IBPS Number"
                              value={ibpsNo}
                              onChange={(e) => {
                                console.log("IBPS No changed to:", e.target.value);
                                setIbpsNo(e.target.value);
                              }}
                              className="creator-create-ibps-input"
                            />
                          </div>
                        </div>

                        <aside className="creator-create-summary-card">
                          <div className="creator-caption">Checklist Summary</div>
                          <div className="creator-create-summary-grid">
                            <div className="creator-create-summary-item">
                              <span className="creator-create-summary-label">Loan Type</span>
                              <span className="creator-create-summary-value">{loanType || "Not selected"}</span>
                            </div>
                            <div className="creator-create-summary-item">
                              <span className="creator-create-summary-label">Assigned RM</span>
                              <span className="creator-create-summary-value">{rms.find((rm) => rm._id === assignedToRM)?.name || "Not assigned"}</span>
                            </div>
                            <div className="creator-create-summary-item">
                              <span className="creator-create-summary-label">Categories</span>
                              <span className="creator-create-summary-value">{categoryCount}</span>
                            </div>
                            <div className="creator-create-summary-item">
                              <span className="creator-create-summary-label">Documents</span>
                              <span className="creator-create-summary-value">{totalDocumentCount}</span>
                            </div>
                          </div>
                          <div className="creator-helper-text">Use the documents tab to review generated categories and add extra requirements before creating the checklist.</div>
                        </aside>
                      </div>
                    </div>
                  )}

                  {activeTab === "documents" && (
                    <div className="creator-create-docs-layout">
                      <div className="creator-create-docs-accordion-panel">
                        <div className="creator-create-docs-scroll">
                          <DocumentAccordion
                            documents={documents}
                            setDocuments={setDocuments}
                          />
                        </div>
                      </div>
                      <div className="creator-create-docs-input-panel">
                        <DocumentInputSectionCoCreator
                          loanType={
                            loanType === "Multiple Loan Type"
                              ? selectedMultipleLoanTypes.join(", ")
                              : loanType
                          }
                          newDocName={newDocName}
                          setNewDocName={setNewDocName}
                          selectedCategoryName={selectedCategoryName}
                          setSelectedCategoryName={setSelectedCategoryName}
                          handleAddNewDocument={handleAddNewDocument}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChecklistsPage;