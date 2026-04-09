import React, { useEffect } from "react";
import { Row, Col, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetApproversQuery } from "../../../api/userApi";
import deferralApi from "../../../service/deferralApi";
import { generateChecklistPDFBlob } from "../../../utils/reportGenerator";

// Hooks
import { useDeferralForm } from "./hooks/useDeferralForm";
import { useApprovers } from "./hooks/useApprovers";
import { useDocuments } from "./hooks/useDocuments";
import { useCustomerSearch } from "./hooks/useCustomerSearch";
import { useFormSubmission } from "./hooks/useFormSubmission";

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

export default function DeferralForm() {
  const navigate = useNavigate();

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

  // Fetch available approvers
  const { data: approverList = [] } = useGetApproversQuery();

  const { selectedDocuments, initializePerDocumentDays } = documentState;
  const { loanAmount } = formState;
  const { updateApproverSlots } = approverState;

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
      const token = stored?.token;

      let data = null;

      if (searchState.selectedCustomerId) {
        const url = `${import.meta.env.VITE_API_URL}/api/users/customers/${searchState.selectedCustomerId}`;
        const res = await fetch(url, {
          headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            "content-type": "application/json",
          },
        });

        if (res.status === 401) {
          message.error("Unauthorized: please login");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch customer details");
        data = await res.json();
      } else {
        const url = `${import.meta.env.VITE_API_URL}/api/customers/search`;
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
      }

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
          formState.setCustomerName(d.name || "");
          formState.setBusinessName(d.businessName || "");
          formState.setCustomerNumber(d.customerNumber || "");
          searchState.setSelectedCustomerId(d._id || null);
        } else {
          searchState.setCustomerSearchResults(data);
          searchState.setSelectCustomerModalVisible(true);
          return;
        }
      } else {
        const d = data;
        formState.setCustomerName(d.customerName || d.name || "");
        formState.setBusinessName(d.businessName || "");
        formState.setCustomerNumber(d.customerNumber || "");
        searchState.setSelectedCustomerId(d._id || null);
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
      const token = stored?.token;

      const url = `${import.meta.env.VITE_API_URL}/api/cocreatorChecklist/${checklistId}`;
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

      searchState.setSelectedChecklistStatus(checklist.status || "");

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
          checklist.comments || []
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
        approverList,
        customerName: formState.customerName,
        businessName: formState.businessName,
        loanType: formState.loanType,
        deferralDescription: formState.deferralDescription,
        facilities: formState.facilities,
        perDocumentDays: documentState.perDocumentDays,
        currentUser: formState.currentUser,
        postedComments: formState.postedComments,
        additionalFiles: documentState.additionalFiles,
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
          formState.setCustomerName(customer.name || "");
          formState.setBusinessName(customer.businessName || "");
          formState.setCustomerNumber(customer.customerNumber || "");
          searchState.setSearchCustomerNumber(customer.customerNumber || "");
          searchState.setSelectedCustomerId(customer._id || null);
          searchState.setSelectCustomerModalVisible(false);
          searchState.setCustomerSearchResults([]);
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
        dferralDescription={formState.deferralDescription}
        approverSlots={approverState.approverSlots}
        approverList={approverList}
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
            availableApprovers={approverList}
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
