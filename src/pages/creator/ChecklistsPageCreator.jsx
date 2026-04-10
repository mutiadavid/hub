import React, { useState, useEffect } from "react";
import { Button, message } from "antd";
import { CloseOutlined, FileTextOutlined } from "@ant-design/icons";
import DocumentAccordion from "../../components/creator/DocumentAccordion";
import { useGetUsersQuery } from "../../api/userApi";
import { loanTypes, loanTypeDocuments } from "../docTypes";
import { useCreateCoCreatorChecklistMutation } from "../../api/checklistApi";
import ChecklistFormFields from "../../components/creator/ChecklistFormFields";
import DocumentInputSectionCoCreator from "../../components/creator/DocumentInputSection";
import { useAutoSaveDraft } from "../../hooks/useAutoSaveDraft";
import { saveDraft, getDrafts, deleteDraft } from "../../utils/draftsUtils";
import "../../styles/creatorDesignSystem.css";

const ChecklistsPage = ({ open, onClose, draftId: initialDraftId = null }) => {
  const [loanType, setLoanType] = useState("");
  const [assignedToRM, setAssignedToRM] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [ibpsNo, setIbpsNo] = useState("");
  const [selectedMultipleLoanTypes, setSelectedMultipleLoanTypes] = useState(
    [],
  );
  const [newDocName, setNewDocName] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  const { data: users = [] } = useGetUsersQuery();
  const rms = users.filter((u) => u.role?.toLowerCase() === "rm");

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

  // Auto-save hook - saves every 2 seconds when form has data
  const { draftId: autoSavedDraftId, lastSaved } = useAutoSaveDraft({
    type: "cocreator",
    formData,
    interval: 2000,
    draftId: currentDraftId,
    enabled: open && (loanType || assignedToRM || customerNumber), // Only enable when modal is open and has some data
  });

  // Load draft from localStorage
  function loadDraft(id) {
    try {
      const drafts = getDrafts("cocreator");
      const draft = drafts.find((d) => d.id === id);
      if (draft && draft.data) {
        const data = draft.data;
        setLoanType(data.loanType || "");
        setAssignedToRM(data.assignedToRM || "");
        setCustomerId(data.customerId || "");
        setCustomerName(data.customerName || "");
        setCustomerNumber(data.customerNumber || "");
        setCustomerEmail(data.customerEmail || "");
        setIbpsNo(data.ibpsNo || "");
        setSelectedMultipleLoanTypes(data.selectedMultipleLoanTypes || []);

        // Handle different document structures
        let docsToLoad = data.documents || [];

        // If documents have a flat structure (from ReviewChecklistModal),
        // convert them to nested structure with docList
        if (
          docsToLoad.length > 0 &&
          docsToLoad[0].category &&
          !docsToLoad[0].docList
        ) {
          // Group by category
          const groupedDocs = {};
          docsToLoad.forEach((doc) => {
            const category = doc.category || "Uncategorized";
            if (!groupedDocs[category]) {
              groupedDocs[category] = [];
            }
            groupedDocs[category].push({
              name: doc.name,
              action: doc.action || doc.status || "pendingrm",
              status: doc.status || doc.action || "pendingrm",
              comment: doc.comment || "",
              fileUrl: doc.fileUrl,
            });
          });

          // Convert to nested structure
          docsToLoad = Object.keys(groupedDocs).map((category) => ({
            category,
            docList: groupedDocs[category],
          }));
        }

        setDocuments(docsToLoad);
        setCurrentDraftId(draft.id);
        message.success("Draft restored successfully!");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      message.error("Failed to load draft");
    }
  }

  // Reset form
  function resetForm() {
    setLoanType("");
    setAssignedToRM("");
    setCustomerId("");
    setCustomerName("");
    setCustomerNumber("");
    setCustomerEmail("");
    setIbpsNo("");
    setSelectedMultipleLoanTypes([]);
    setDocuments([]);
    setNewDocName("");
    setSelectedCategoryName(null);
    setCurrentDraftId(null);
  }

  // Update currentDraftId when auto-save provides one
  useEffect(() => {
    if (autoSavedDraftId && autoSavedDraftId !== currentDraftId) {
      const timeoutId = window.setTimeout(() => {
        setCurrentDraftId(autoSavedDraftId);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [autoSavedDraftId, currentDraftId]);

  // Load draft data on mount if initialDraftId is provided
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (initialDraftId) {
        loadDraft(initialDraftId);
      } else {
        resetForm();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialDraftId, open]);

  // Manual save draft handler
  const handleSaveDraft = () => {
    try {
      const saved = saveDraft("cocreator", formData, currentDraftId);
      if (saved) {
        setCurrentDraftId(saved.id);
        message.success("Draft saved successfully!");
      } else {
        message.error("Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      message.error("Failed to save draft");
    }
  };

  const handleLoanTypeChange = (value) => {
    setLoanType(value);
    setSelectedMultipleLoanTypes([]); // Reset multiple selection

    if (value !== "Multiple Loan Type") {
      const categories = loanTypeDocuments[value] || [];
      setDocuments(
        categories.map((cat) => ({
          category: cat.title,
          docList: cat.documents.map((d) => ({
            name: d,
            status: "pendingrm",
            action: "",
            comment: "",
          })),
        })),
      );
    } else {
      setDocuments([]); // Clear until actual types are selected
    }
  };

  // Logic to handle multiple loan types document population
  React.useEffect(() => {
    if (
      loanType === "Multiple Loan Type" &&
      selectedMultipleLoanTypes.length > 0
    ) {
      const mergedCategories = {};

      selectedMultipleLoanTypes.forEach((type) => {
        const categories = loanTypeDocuments[type] || [];
        categories.forEach((cat) => {
          if (!mergedCategories[cat.title]) {
            mergedCategories[cat.title] = new Set();
          }
          cat.documents.forEach((doc) => {
            mergedCategories[cat.title].add(doc);
          });
        });
      });

      const newDocs = Object.keys(mergedCategories).map((title) => ({
        category: title,
        docList: Array.from(mergedCategories[title]).map((docName) => ({
          name: docName,
          status: "pendingrm",
          action: "",
          comment: "",
        })),
      }));

      setDocuments(newDocs);
    }
  }, [selectedMultipleLoanTypes, loanType]);

  const handleAddNewDocument = () => {
    if (!newDocName.trim() || !selectedCategoryName) return;

    setDocuments((prevDocs) => {
      const categoryIdx = prevDocs.findIndex(
        (cat) => cat.category === selectedCategoryName,
      );

      const newDoc = {
        name: newDocName.trim(),
        status: "pendingrm",
        action: "",
        comment: "",
      };

      if (categoryIdx > -1) {
        return prevDocs.map((category, index) =>
          index === categoryIdx
            ? {
                ...category,
                docList: [...(category.docList || []), newDoc],
              }
            : category,
        );
      } else {
        return [
          ...prevDocs,
          {
          category: selectedCategoryName,
          docList: [newDoc],
          },
        ];
      }
    });

    setNewDocName("");
    setSelectedCategoryName(null);
  };

  const handleSubmit = async () => {
    // If Multiple Loan Type is selected, ensure at least one actual type is picked
    const actualLoanType =
      loanType === "Multiple Loan Type"
        ? selectedMultipleLoanTypes.join(", ")
        : loanType;

    if (
      !assignedToRM ||
      (loanType === "Multiple Loan Type"
        ? selectedMultipleLoanTypes.length === 0
        : !loanType) ||
      !ibpsNo
    ) {
      return alert("Please fill all required fields.");
    }

    const payload = {
      loanType: actualLoanType,
      assignedToRMId: assignedToRM,
      customerId,
      customerName,
      customerNumber,
      customerEmail,
      ibpsNo,
      documents: documents,
    };

    try {
      await createChecklist(payload).unwrap();
      message.success("Checklist created successfully!");
      // Delete draft after successful creation
      if (currentDraftId) {
        deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }
      onClose();
    } catch (err) {
      console.error(err);
      message.error("Error creating checklist.");
    }
  };

  // Check if all required fields are filled
  const isFormValid =
    assignedToRM &&
    (loanType === "Multiple Loan Type"
      ? selectedMultipleLoanTypes.length > 0
      : loanType) &&
    ibpsNo;

  const totalDocumentCount = documents.reduce(
    (sum, category) => sum + (Array.isArray(category?.docList) ? category.docList.length : 0),
    0,
  );

  const categoryCount = documents.length;

  return (
    <>
      <style>{`
        .create-dcl-inline-shell {
          width: 100%;
          padding: 16px 0 0;
        }

        .create-dcl-inline-container {
          background: var(--color-bg);
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
          font-size: 12px;
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
          font-size: 12px;
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
          font-size: 9px;
          font-weight: 600;
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
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .creator-create-button--primary.ant-btn,
        .creator-create-button--primary.ant-btn:hover,
        .creator-create-button--primary.ant-btn:focus {
          border: none !important;
          background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
          color: #fff !important;
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
          font-size: 12px;
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
          max-height: calc(100vh - 310px);
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
          background: rgba(214, 189, 152, 0.08);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .creator-create-summary-label {
          color: var(--color-text-light);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .creator-create-summary-value {
          color: var(--color-text-dark);
          font-size: 13px;
          font-weight: 700;
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
          font-size: 9px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
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
          font-size: 12px;
          color: var(--color-text-medium);
          outline: none;
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
          max-height: calc(100vh - 310px);
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
                    resetForm();
                    onClose();
                  }}
                >
                  Close
                </Button>
                {!isFormValid && (
                  <div className="creator-create-validation">
                    Fill Assigned RM, Loan Type{loanType === "Multiple Loan Type" ? ", Actual Loan Types" : ""} and IBPS NO.
                  </div>
                )}
              </div>
            </div>

            <div className="create-dcl-modal-body">
              <div className="creator-create-layout">
                <div className="creator-create-main">
                  <div className="creator-create-tabs">
                    <button type="button" className={`creator-create-tab ${activeTab === "details" ? "creator-create-tab--active" : ""}`} onClick={() => setActiveTab("details")}>
                      Checklist Details
                    </button>
                    <button type="button" className={`creator-create-tab ${activeTab === "documents" ? "creator-create-tab--active" : ""}`} onClick={() => setActiveTab("documents")}>
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
                              onChange={(e) => setIbpsNo(e.target.value)}
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
