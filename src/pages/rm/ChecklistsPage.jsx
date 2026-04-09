import React, { useState, useMemo } from "react";
import { Button, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";
// Import the new components
import ChecklistFormFields from "../../components/rm/ChecklistFormFields";
import DocumentInputSection from "../../components/rm/DocumentInputSection";
import DocumentAccordion from "../../components/rm/DocumentAccordion";

import { useGetUsersQuery } from "../../api/userApi";
import { loanTypes, loanTypeDocuments } from "../docTypes";
import { useCreateCoCreatorChecklistMutation } from "../../api/checklistApi";

const ChecklistsPage = ({ open, onClose }) => {
  // State remains centralized here
  const [loanType, setLoanType] = useState("");
  const [title, setTitle] = useState("");
  const [assignedToRM, setAssignedToRM] = useState("");
  const [customerId, setCustomerId] = useState("");

  // customerName and customerNumber states are REMOVED

  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newDocName, setNewDocName] = useState("");

  // API Hooks and Data Filtering
  const { data: users = [] } = useGetUsersQuery();
  //   const {
  //   data: users = [],
  //   isLoading,
  //   isFetching,
  //   isError,
  //   error
  // } = useGetUsersQuery();

  // console.log(users, "users");
  // console.log({ isLoading, isFetching, isError, error });
  const rms = users.filter((u) => u.role?.toLowerCase() === "rm");
  const customers = users.filter((u) => u.role?.toLowerCase() === "customer");
  const [createChecklist] = useCreateCoCreatorChecklistMutation();

  // FIX: Use useMemo to DERIVE customer info instead of using useEffect and setState
  const customerInfo = useMemo(() => {
    const selected = customers.find((c) => c._id === customerId);
    return {
      name: selected?.name || "",
      number: selected?.customerNumber || "",
    };
  }, [customerId, customers]); // Recalculates only when customerId or customers change

  const customerName = customerInfo.name;
  const customerNumber = customerInfo.number;

  // Logic: Handle loan type selection and load default documents
  const handleLoanTypeChange = (value) => {
    setLoanType(value);
    const categories = loanTypeDocuments[value] || [];

    setDocuments(
      categories.map((cat) => ({
        category: cat.title,
        docList: cat.documents.map((d) => ({
          name: d,
          status: "pending",
          action: "",
          comment: "",
        })),
      })),
    );
  };

  // Logic: Add custom document into selected category
  const handleAddNewDocument = () => {
    if (
      !newDocName.trim() ||
      selectedCategory === null ||
      selectedCategory >= documents.length
    )
      return;

    const updated = [...documents];
    updated[selectedCategory].docList.push({
      name: newDocName.trim(),
      status: "pending",
      action: "",
      comment: "",
    });

    setDocuments(updated);
    setNewDocName("");
  };

  // Logic: Submit checklist
  const handleSubmit = async () => {
    if (!assignedToRM || !loanType || !title) {
      alert("Please fill all required fields.");
      return;
    }

    // Payload construction logic remains here
    const payload = {
      title,
      loanType,
      assignedToRMId: assignedToRM,
      customerId,
      // Use the DERIVED values directly in the payload
      customerName: customerName,
      customerNumber: customerNumber,
      documents: documents.flatMap((cat) =>
        cat.docList.map((doc) => ({
          name: doc.name,
          category: cat.category,
          action: doc.action,
          status: doc.status,
          comment: doc.comment,
        })),
      ),
    };

    try {
      await createChecklist(payload).unwrap();
      alert("Checklist created successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating checklist.");
    }
  };

  return (
    <>
      <style>{`
        /* Create DCL Modal Overlay - full screen with proper z-index */
        .create-dcl-modal-overlay {
          position: fixed;
          top: 65px;
          left: var(--sidebar-width, 80px);
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 990;
          overflow: auto;
          padding-top: 20px;
          padding-bottom: 20px;
          transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          max-height: 100vh;
        }
        
        /* Create DCL Modal Container - centered */
        .create-dcl-modal-container {
          background: white;
          border-radius: 12px;
          overflow: visible;
          width: 1065px;
          max-width: calc(100vw - 310px);
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.15), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          margin: 0 16px 0 46px;
          position: relative;
          z-index: 1001;
        }
        
        .create-dcl-modal-header {
          background: #164679;
          padding: 18px 24px;
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
        }
        
        .create-dcl-modal-body {
          padding: 24px;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) and (max-width: 1099px) {
          .create-dcl-modal-overlay {
            left: var(--sidebar-width, 40px);
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
          .create-dcl-modal-container {
            width: calc(100vw - 120px) !important;
            max-width: calc(100vw - 120px) !important;
            margin: 0 16px 0 16px !important;
          }
        }
        
        @media (max-width: 767px) {
          .create-dcl-modal-overlay {
            left: 0;
            padding-left: 0;
            padding-right: 16px;
          }
          .create-dcl-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            margin: 0 16px 0 0px !important;
          }
        }
      `}</style>

      {open && (
        <div className="create-dcl-modal-overlay" onClick={onClose}>
          <div
            className="create-dcl-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="create-dcl-modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}
                  >
                    Create Document Checklist
                  </span>
                </div>
                <Button
                  icon={<CloseOutlined />}
                  onClick={onClose}
                  size="small"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    color: "#fff",
                    width: "32px",
                    height: "32px",
                    padding: 0,
                  }}
                />
              </div>
            </div>

            {/* Body */}
            <div className="create-dcl-modal-body">
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                {/* Render Form Fields Component */}
                <ChecklistFormFields
                  rms={rms}
                  customers={customers}
                  assignedToRM={assignedToRM}
                  setAssignedToRM={setAssignedToRM}
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  // Pass derived values as props
                  customerName={customerName}
                  customerNumber={customerNumber}
                  title={title}
                  setTitle={setTitle}
                  loanType={loanType}
                  loanTypes={loanTypes}
                  handleLoanTypeChange={handleLoanTypeChange}
                />

                {/* Document Section */}
                {loanType && (
                  <>
                    {/* Render Document Input Section Component */}
                    <DocumentInputSection
                      documents={documents}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      newDocName={newDocName}
                      setNewDocName={setNewDocName}
                      handleAddNewDocument={handleAddNewDocument}
                    />

                    {/* Render Document Accordion Component */}
                    <DocumentAccordion
                      documents={documents}
                      setDocuments={setDocuments}
                    />
                  </>
                )}

                {/* Submit */}
                <Button type="primary" block onClick={handleSubmit}>
                  Submit Checklist
                </Button>
              </Space>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChecklistsPage;
