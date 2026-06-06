import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { Row, Col, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import deferralApi from "../../../service/deferralApi";
import { API_BASE_URL } from "../../../config/runtimeConfig";
import { generateChecklistPDFBlob } from "../../../utils/reportGenerator";

// Hooks
import { useDeferralForm } from "./hooks/useDeferralForm";
import { useApprovers } from "./hooks/useApprovers";
import { useDocuments } from "./hooks/useDocuments";
import { useCustomerSearch } from "./hooks/useCustomerSearch";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { useAutoSaveDraft } from "../../../hooks/useAutoSaveDraft";

// Components
import CustomerInfo from "./components/CustomerInfo";
import DeferralDetails from "./components/DeferralDetails";
import Comments from "./components/Comments";
import ApproverSidebar from "./components/ApproverSidebar";
import CustomerSearch from "./components/CustomerSearch";
import DeferralConfirmationPage from "./components/DeferralConfirmationPage";

// Utils and helpers
import { formatLoanType } from "./utils/helpers";
import { validateCustomerSearch, validateDclSearch } from "./utils/validation";
import { getDraftById } from "../../../utils/draftsUtils";

const serializeDraftFile = (file) => {
  if (!file) {
    return null;
  }

  return {
    name: file.name || file.fileName || file.title || "document",
    size: Number(file.size) || 0,
    type: file.type || "",
    url: file.url || file.fileUrl || null,
    isDCL: Boolean(file.isDCL),
    isRestorable: Boolean(file.url || file.fileUrl),
  };
};

const restoreDraftFile = (file) => {
  if (!file || typeof file !== "object") {
    return null;
  }

  const restoredUrl = file.url || file.fileUrl || null;
  if (restoredUrl) {
    return {
      name: file.name || "document",
      size: Number(file.size) || 0,
      type: file.type || "",
      url: restoredUrl,
      fileUrl: restoredUrl,
      isDCL: Boolean(file.isDCL),
    };
  }

  return null;
};

export default function DeferralForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restoredDraftIdRef = useRef(null);
  const reduxToken = useSelector((state) => state.auth.token);
  
  // Draft management state
  const [draftId, setDraftId] = useState(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);

  // Main form state
  const formState = useDeferralForm();
 
  // Document management
  const documentState = useDocuments();

  // Approver management (pass correct selectedDocuments from documentState)
  const approverState = useApprovers(
    documentState.selectedDocuments,
    formState.loanAmount
  );

  // Customer and DCL search
  const searchState = useCustomerSearch();

  // Form submission
  const { handleSubmitDeferral } = useFormSubmission();

  const { selectedDocuments, initializePerDocumentDays } = documentState;
  const { loanAmount } = formState;
  const { updateApproverSlots } = approverState;
  const {
    setCustomerName,
    setBusinessName,
    setCustomerNumber,
    setLoanType,
    setDclNumber,
    setLoanAmount,
    setDeferralDescription,
    setFacilities,
    setPostedComments,
    setIsCustomerFetched,
    setShowSearchForm,
    // Business segment setters
    setClassification,
    setBusinessSegment,
    setBusinessSegmentDesc,
    setSubSegment,
    setSubSegmentDesc,
    setCustType,
    setCustomerBranchName,
  } = formState;
  const {
    setSelectedDocuments,
    handlePerDocumentDaysChange,
    setDclFile,
    setAdditionalFiles,
  } = documentState;
  const {
    setSelectedCustomerId,
    setSelectedChecklistStatus,
  } = searchState;

  // Handle draft restoration from URL
  useEffect(() => {
    const draftIdParam = searchParams.get('draftId');
    if (!draftIdParam || restoredDraftIdRef.current === draftIdParam || isRestoringDraft) {
      return;
    }

    restoredDraftIdRef.current = draftIdParam;
    setIsRestoringDraft(true);

    const draft = getDraftById(draftIdParam);
    if (draft && draft.data) {
      try {
        const data = draft.data;
        let uploadsRequiringReattach = 0;

        // Restore form state
        if (data.customerName) setCustomerName(data.customerName);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.customerNumber) setCustomerNumber(data.customerNumber);
        if (data.loanType) setLoanType(data.loanType);
        if (data.dclNumber) setDclNumber(data.dclNumber);
        if (data.loanAmount) setLoanAmount(data.loanAmount);
        if (data.deferralDescription) setDeferralDescription(data.deferralDescription);
        if (data.facilities) setFacilities(data.facilities);
        if (data.postedComments) setPostedComments(data.postedComments);

        // Restore document state
        if (data.selectedDocuments) setSelectedDocuments(data.selectedDocuments);
        if (data.perDocumentDays) {
          Object.keys(data.perDocumentDays).forEach((key) => {
            handlePerDocumentDaysChange(key, data.perDocumentDays[key]);
          });
        }
        if (data.dclFile) {
          const restoredDclFile = restoreDraftFile(data.dclFile);
          setDclFile(restoredDclFile);
          if (!restoredDclFile) {
            uploadsRequiringReattach += 1;
          }
        }
        if (Array.isArray(data.additionalFiles)) {
          const restoredAdditionalFiles = data.additionalFiles
            .map((file) => restoreDraftFile(file))
            .filter(Boolean);

          uploadsRequiringReattach += data.additionalFiles.length - restoredAdditionalFiles.length;
          setAdditionalFiles(restoredAdditionalFiles);
        }

        // Restore search/customer state
        if (data.selectedCustomerId) setSelectedCustomerId(data.selectedCustomerId);
        if (data.selectedChecklistStatus) setSelectedChecklistStatus(data.selectedChecklistStatus);

        // Mark customer as fetched to show form
        setIsCustomerFetched(true);
        setShowSearchForm(false);

        // Set draft ID for future saves
        setDraftId(draftIdParam);

        if (uploadsRequiringReattach > 0) {
          message.warning(`Draft restored. Please re-upload ${uploadsRequiringReattach} file${uploadsRequiringReattach === 1 ? "" : "s"} before submitting.`);
        } else {
          message.success('Draft restored successfully');
        }
      } catch (err) {
        console.error('Error restoring draft:', err);
        message.error('Failed to restore draft');
      } finally {
        setIsRestoringDraft(false);
      }
    } else {
      message.error('Draft not found');
      setIsRestoringDraft(false);
    }
  }, [
    searchParams,
    isRestoringDraft,
    handlePerDocumentDaysChange,
    setAdditionalFiles,
    setBusinessName,
    setCustomerName,
    setCustomerNumber,
    setDclFile,
    setDclNumber,
    setDeferralDescription,
    setFacilities,
    setIsCustomerFetched,
    setLoanAmount,
    setLoanType,
    setPostedComments,
    setSelectedChecklistStatus,
    setSelectedCustomerId,
    setSelectedDocuments,
    setShowSearchForm,
  ]);

  // Create formData object for auto-save
  const formData = useMemo(() => ({
    selectedCustomerId: searchState.selectedCustomerId || null,
    customerNumber: formState.customerNumber,
    dclNumber: formState.dclNumber,
    loanAmount: formState.loanAmount,
    loanType: formState.loanType,
    customerName: formState.customerName,
    businessName: formState.businessName,
    deferralDescription: formState.deferralDescription,
    facilities: formState.facilities,
    selectedDocuments: documentState.selectedDocuments,
    perDocumentDays: documentState.perDocumentDays,
    dclFile: serializeDraftFile(documentState.dclFile),
    additionalFiles: documentState.additionalFiles.map((file) => serializeDraftFile(file)),
    selectedChecklistStatus: searchState.selectedChecklistStatus,
    postedComments: formState.postedComments,
  }), [
    searchState.selectedCustomerId,
    formState.customerNumber,
    formState.dclNumber,
    formState.loanAmount,
    formState.loanType,
    formState.customerName,
    formState.businessName,
    formState.deferralDescription,
    formState.facilities,
    documentState.selectedDocuments,
    documentState.perDocumentDays,
    documentState.dclFile,
    documentState.additionalFiles,
    searchState.selectedChecklistStatus,
    formState.postedComments,
  ]);

  // Auto-save draft - only enable when customer is fetched and form has data
  const autoSaveDraft = useAutoSaveDraft({
    type: 'deferral',
    formData,
    interval: 2000,
    draftId,
    enabled: formState.isCustomerFetched && !formState.showConfirmModal && Object.keys(formData).some(key => formData[key]),
  });

  // Update draftId when auto-save creates a new draft
  useEffect(() => {
    if (autoSaveDraft.draftId && !draftId) {
      setDraftId(autoSaveDraft.draftId);
    }
  }, [autoSaveDraft.draftId, draftId]);

  // Initialize per-document days when documents change
  useEffect(() => {
    initializePerDocumentDays();
  }, [initializePerDocumentDays, selectedDocuments]);

  // Update approver slots when documents or loan amount changes
  useEffect(() => {
    updateApproverSlots();
  }, [loanAmount, selectedDocuments, updateApproverSlots]);

  // Fetch customer
  const fetchCustomer = async () => {
    try {
      // Validate inputs
      if (searchState.searchMode === "customer") {
        if (!validateCustomerSearch(searchState.searchCustomerNumber, searchState.searchLoanType)) {
          return;
        }
      } else {
        if (!validateDclSearch(searchState.searchDclNumber)) {
          return;
        }
      }

      formState.setIsFetching(true);
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = reduxToken || stored?.token;

      let data = null;

      // If a customer was already chosen from the typeahead, use cached results
      const cachedCustomer =
        searchState.selectedCustomerId &&
        searchState.customerSearchResults.find(
          (c) =>
            (c._id || c.id || c.customerNumber) === searchState.selectedCustomerId
        );

      if (cachedCustomer) {
        // Use cached result — no extra network call needed
        const d = cachedCustomer;
        formState.setCustomerName(d.customerName || d.name || d.cusShortName || "");
        formState.setBusinessName(d.businessName || d.customerName || d.name || d.cusShortName || "");
        formState.setCustomerNumber(d.customerNumber || "");
        if (searchState.searchLoanType) {
          formState.setLoanType(searchState.searchLoanType);
        } else if (d.loanType) {
          formState.setLoanType(d.loanType);
        }
        // Business segment fields
        if (d.classification)      formState.setClassification(d.classification);
        if (d.businessSegment)     formState.setBusinessSegment(d.businessSegment);
        if (d.businessSegmentDesc) formState.setBusinessSegmentDesc(d.businessSegmentDesc);
        if (d.subSegment)          formState.setSubSegment(d.subSegment);
        if (d.subSegmentDesc)      formState.setSubSegmentDesc(d.subSegmentDesc);
        if (d.custType)            formState.setCustType(d.custType);
        if (d.customerBranchName)  formState.setCustomerBranchName(d.customerBranchName);
        formState.setIsCustomerFetched(true);
        formState.setShowSearchForm(false);
        return;
      }

      // Otherwise hit the backend
      const url = `${API_BASE_URL}/customers/search`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerNumber: searchState.searchCustomerNumber,
          loanType: searchState.searchLoanType,
        }),
      });

      if (res.status === 401) {
        message.error("Unauthorized: please login");
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch customers");
      data = await res.json();

      if (!data) {
        message.info("No customer found");
        return;
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          message.info("No customer found");
          return;
        }

        if (data.length === 1) {
          const d = data[0];
          formState.setCustomerName(d.customerName || d.name || d.cusShortName || "");
          formState.setBusinessName(d.businessName || d.customerName || d.name || d.cusShortName || "");
          formState.setCustomerNumber(d.customerNumber || "");
          searchState.setSelectedCustomerId(d._id || d.id || d.customerNumber || null);
          // Business segment fields
          if (d.classification)      formState.setClassification(d.classification);
          if (d.businessSegment)     formState.setBusinessSegment(d.businessSegment);
          if (d.businessSegmentDesc) formState.setBusinessSegmentDesc(d.businessSegmentDesc);
          if (d.subSegment)          formState.setSubSegment(d.subSegment);
          if (d.subSegmentDesc)      formState.setSubSegmentDesc(d.subSegmentDesc);
          if (d.custType)            formState.setCustType(d.custType);
          if (d.customerBranchName)  formState.setCustomerBranchName(d.customerBranchName);
        } else {
          // Ensure data has _id and name for the UI component
          const mappedData = data.map((c) => ({
            ...c,
            _id: c._id || c.id || `${c.customerNumber}-${Math.random().toString(36).substring(7)}`,
            id:  c.id  || c._id,
            name: c.name || c.customerName || c.cusShortName || "Unknown Customer",
          }));
          searchState.setCustomerSearchResults(mappedData);
          searchState.setSelectCustomerModalVisible(true);
          return;
        }
      } else {
        const d = data;
        formState.setCustomerName(d.customerName || d.name || d.cusShortName || "");
        formState.setBusinessName(d.businessName || d.customerName || d.name || d.cusShortName || "");
        formState.setCustomerNumber(d.customerNumber || "");
        searchState.setSelectedCustomerId(d._id || d.id || d.customerNumber || null);
        // Business segment fields
        if (d.classification)      formState.setClassification(d.classification);
        if (d.businessSegment)     formState.setBusinessSegment(d.businessSegment);
        if (d.businessSegmentDesc) formState.setBusinessSegmentDesc(d.businessSegmentDesc);
        if (d.subSegment)          formState.setSubSegment(d.subSegment);
        if (d.subSegmentDesc)      formState.setSubSegmentDesc(d.subSegmentDesc);
        if (d.custType)            formState.setCustType(d.custType);
        if (d.customerBranchName)  formState.setCustomerBranchName(d.customerBranchName);
      }

      if (searchState.searchLoanType) {
        formState.setLoanType(searchState.searchLoanType);
      } else if (data?.loanType) {
        formState.setLoanType(data.loanType);
      }

      formState.setIsCustomerFetched(true);
      formState.setShowSearchForm(false);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch customers");
    } finally {
      formState.setIsFetching(false);
    }
  };

  // Fetch DCL file
  const fetchDclFile = async (checklistId, dclNumber) => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = reduxToken || stored?.token;

      const url = `${API_BASE_URL}/cocreatorChecklist/${checklistId}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch DCL checklist");
        return;
      }

      const checklist = await res.json();

      const checklistCommentTrail = [
        ...(Array.isArray(checklist.comments) ? checklist.comments : []),
        ...(Array.isArray(checklist.history) ? checklist.history : []),
      ];

      searchState.setSelectedChecklistStatus(checklist.status || "");

      // Populate business segment fields from the checklist
      if (checklist.classification)     formState.setClassification(checklist.classification);
      if (checklist.businessSegment)    formState.setBusinessSegment(checklist.businessSegment);
      if (checklist.businessSegmentDesc) formState.setBusinessSegmentDesc(checklist.businessSegmentDesc);
      if (checklist.subSegment)         formState.setSubSegment(checklist.subSegment);
      if (checklist.subSegmentDesc)     formState.setSubSegmentDesc(checklist.subSegmentDesc);
      if (checklist.custType)           formState.setCustType(checklist.custType);
      if (checklist.customerBranchName) formState.setCustomerBranchName(checklist.customerBranchName);

      const allDocs = [];
      if (checklist.documents && Array.isArray(checklist.documents)) {
        checklist.documents.forEach((category) => {
          if (category.docList && Array.isArray(category.docList)) {
            allDocs.push(...category.docList);
          }
        });
      }

      try {
        const blob = await generateChecklistPDFBlob(
          checklist,
          allDocs,
          {},
          checklistCommentTrail,
          { commentTrailOnFinalPage: true }
        );
        if (blob) {
          const fileName = `${dclNumber || checklist.dclNo || "DCL"}.pdf`;
          const generatedFile = new File([blob], fileName, {
            type: "application/pdf",
          });
          documentState.setDclFile(generatedFile);
          message.success(`${fileName} auto-generated and attached`);
          return;
        }
      } catch (genErr) {
        console.error("Failed to auto-generate DCL PDF:", genErr);
      }

      if (allDocs.length > 0) {
        allDocs.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        const latestDoc = allDocs[0];
        if (latestDoc && (latestDoc.fileUrl || latestDoc.url)) {
          const fileName = latestDoc.name || `${dclNumber}.pdf`;
          const fileUrl = latestDoc.fileUrl || latestDoc.url;
          documentState.setDclFile({
            name: fileName,
            url: fileUrl,
            type: latestDoc.type || "DCL",
            isDCL: true,
            size: latestDoc.size || 0,
          });
          return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch DCL file:", err);
    }
  };

  // Handle select DCL
  const handleSelectDcl = async (deferral) => {
    formState.setCustomerName(deferral.customerName || "");
    formState.setBusinessName(deferral.businessName || "");
    formState.setCustomerNumber(deferral.customerNumber || "");
    formState.setLoanType(deferral.loanType || "");
    searchState.setSearchDclNumber(deferral.dclNo || "");
    formState.setDclNumber(deferral.dclNo || "");
    searchState.setSelectedCustomerId(deferral.customerId || null);
    searchState.setSelectedDclId(deferral.id);
    searchState.setSelectedChecklistStatus(deferral.status || "");
    searchState.setIsSearchedByDcl(true);

    fetchDclFile(deferral.id, deferral.dclNo);

    formState.setIsCustomerFetched(true);
    formState.setShowSearchForm(false);
    searchState.setDclSearchResults([]);
  };

  // Open confirmation modal
  const openConfirmModal = async () => {
    if (!searchState.selectedCustomerId && !String(formState.customerNumber || "").trim()) {
      message.error("Please fetch and confirm a customer before submitting");
      return;
    }
    if (!formState.dclNumber || !formState.dclNumber.trim()) {
      message.error("Please enter DCL number");
      return;
    }

    try {
      const resp = await deferralApi.getNextDeferralNumber();
      formState.setPreviewDeferralNumber(resp.deferralNumber || "TBD");
    } catch (e) {
      console.error("Preview number fetch failed", e);
      formState.setPreviewDeferralNumber("TBD");
    }

    formState.setShowConfirmModal(true);
  };

  // Handle confirm and submit
  const handleConfirmSubmit = async () => {
    await handleSubmitDeferral(
      {
        selectedCustomerId: searchState.selectedCustomerId,
        customerNumber: formState.customerNumber,
        dclNumber: formState.dclNumber,
        selectedDocuments: documentState.selectedDocuments,
        dclFile: documentState.dclFile,
        approverSlots: approverState.approverSlots,
        loanAmount: formState.loanAmount,
        customerName: formState.customerName,
        businessName: formState.businessName,
        loanType: formState.loanType,
        deferralDescription: formState.deferralDescription,
        facilities: formState.facilities,
        perDocumentDays: documentState.perDocumentDays,
        currentUser: formState.currentUser,
        postedComments: formState.postedComments,
        additionalFiles: documentState.additionalFiles,
        draftId,
        // Business segment fields
        classification: formState.classification,
        businessSegment: formState.businessSegment,
        businessSegmentDesc: formState.businessSegmentDesc,
        subSegment: formState.subSegment,
        subSegmentDesc: formState.subSegmentDesc,
        custType: formState.custType,
        customerBranchName: formState.customerBranchName,
      },
      formState.setIsSubmitting
    );
  };

  // Initial render - customer search page
  if (!formState.isCustomerFetched) {
    return (
      <CustomerSearch
        searchMode={searchState.searchMode}
        setSearchMode={searchState.setSearchMode}
        searchCustomerNumber={searchState.searchCustomerNumber}
        setSearchCustomerNumber={searchState.setSearchCustomerNumber}
        searchLoanType={searchState.searchLoanType}
        setSearchLoanType={searchState.setSearchLoanType}
        searchDclNumber={searchState.searchDclNumber}
        setSearchDclNumber={searchState.setSearchDclNumber}
        customerSearchResults={searchState.customerSearchResults}
        dclSearchResults={searchState.dclSearchResults}
        showSearchForm={formState.showSearchForm}
        setShowSearchForm={formState.setShowSearchForm}
        onFetchCustomer={fetchCustomer}
        onSelectCustomer={(customer) => {
          formState.setCustomerName(customer.name || customer.customerName || customer.cusShortName || "");
          formState.setBusinessName(customer.businessName || customer.customerName || customer.name || customer.cusShortName || "");
          formState.setCustomerNumber(customer.customerNumber || "");
          searchState.setSearchCustomerNumber(customer.customerNumber || "");
          // Normalise id — backend returns camelCase `id`, not mongo `_id`
          searchState.setSelectedCustomerId(customer._id || customer.id || customer.customerNumber || null);
          searchState.setSelectCustomerModalVisible(false);
          searchState.setCustomerSearchResults([]);
          if (searchState.searchLoanType) {
            formState.setLoanType(searchState.searchLoanType);
          }
          formState.setIsCustomerFetched(true);
          formState.setShowSearchForm(false);
        }}
        onSelectDcl={handleSelectDcl}
        isFetching={formState.isFetching}
        onBack={() => navigate("/rm/deferrals/pending")}
      />
    );
  }

  if (formState.showConfirmModal) {
    return (
      <DeferralConfirmationPage
        previewDeferralNumber={formState.previewDeferralNumber}
        customerName={formState.customerName}
        customerNumber={formState.customerNumber}
        dclNumber={formState.dclNumber}
        loanType={formState.loanType}
        loanAmount={formState.loanAmount}
        selectedDocuments={documentState.selectedDocuments}
        perDocumentDays={documentState.perDocumentDays}
        deferralDescription={formState.deferralDescription}
        approverSlots={approverState.approverSlots}
        facilities={formState.facilities}
        dclFile={documentState.dclFile}
        additionalFiles={documentState.additionalFiles}
        postedComments={formState.postedComments}
        isSubmitting={formState.isSubmitting}
        onCancel={() => formState.setShowConfirmModal(false)}
        onSubmit={handleConfirmSubmit}
      />
    );
  }

  // Main form page - customer fetched
  return (
    <div className="creator-theme deferral-form-page" style={{ padding: 24, minHeight: "100%", background: "var(--color-bg)" }}>
      <style>{`
        .deferral-form-page {
          box-sizing: border-box;
        }
        .deferral-form-grid {
          align-items: start;
        }
        .deferral-form-main-column,
        .deferral-form-sidebar-column {
          min-width: 0;
        }
        @media (max-width: 991px) {
          .deferral-form-page {
            padding: 16px;
          }
        }
      `}</style>
      <Row gutter={[24, 24]} className="deferral-form-grid">
        <Col span={18} className="deferral-form-main-column">
          <CustomerInfo
            customerName={formState.customerName}
            customerNumber={formState.customerNumber}
            dclNumber={formState.dclNumber}
            selectedChecklistStatus={searchState.selectedChecklistStatus}
            loanType={formState.loanType}
            formatLoanType={formatLoanType}
          />
          <DeferralDetails
            loanAmount={formState.loanAmount}
            setLoanAmount={formState.setLoanAmount}
            selectedDocuments={documentState.selectedDocuments}
            setSelectedDocuments={documentState.setSelectedDocuments}
            perDocumentDays={documentState.perDocumentDays}
            handlePerDocumentDaysChange={documentState.handlePerDocumentDaysChange}
            deferralDescription={formState.deferralDescription}
            setDeferralDescription={formState.setDeferralDescription}
            facilities={formState.facilities}
            setFacilities={formState.setFacilities}
            dclNumber={formState.dclNumber}
            setDclNumber={formState.setDclNumber}
            dclFile={documentState.dclFile}
            additionalFiles={documentState.additionalFiles}
            isSearchedByDcl={searchState.isSearchedByDcl}
            handleDCLUpload={documentState.handleDCLUpload}
            handleAdditionalFileUpload={documentState.handleAdditionalFileUpload}
            removeDCLFile={documentState.removeDCLFile}
            removeAdditionalFile={documentState.removeAdditionalFile}
          />
          <Comments
            comments={formState.comments}
            setComments={formState.setComments}
            postedComments={formState.postedComments}
            setPostedComments={formState.setPostedComments}
            currentUser={formState.currentUser}
          />
        </Col>

        <Col span={6} className="deferral-form-sidebar-column">
          <ApproverSidebar
            approverSlots={approverState.approverSlots}
            updateApprover={approverState.updateApprover}
            addApprover={approverState.addApprover}
            removeApprover={approverState.removeApprover}
            onSubmitDeferral={openConfirmModal}
            isSubmitting={formState.isSubmitting}
            currentUser={formState.currentUser}
            selectedDocuments={documentState.selectedDocuments}
            loanAmount={formState.loanAmount}
            onCancel={() => navigate("/rm/deferrals/pending")}
          />
        </Col>
      </Row>
    </div>
  );
}