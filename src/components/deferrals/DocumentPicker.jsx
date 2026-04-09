import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  Input,
  Tag,
  Button,
  Typography,
  Table,
  Row,
  Col,
  Badge,
  Alert,
} from "antd";
import {
  SearchOutlined,
  FileOutlined,
  DeleteOutlined,
  CheckOutlined,
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// Theme colors
const PRIMARY_PURPLE = "#2B1C67";
const SUCCESS_GREEN = "#52c41a";
const ACCENT_LIME = "#b5d334";
const SECONDARY_BLUE = "#164679";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14"; // Added this constant

function DocumentPicker({
  selectedDocuments,
  setSelectedDocuments,
  perDocumentDays = {},
}) {
  const [search, setSearch] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const MAX_DOCUMENTS = 5;

  const allDocuments = [
    // Primary Documents
    {
      name: "Offer Letter (new facilities)",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Letter of Variation of facilities",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Board Resolutions by borrowers and guarantors",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Loan Agreements (Master Asset Finance agreement, Hire Purchase Agreement, Securities Agreement, Agency Agreement etc.)",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Inter-lenders Agreements",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Debentures plus supporting documentation",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Letters of Exclusion from debentures or receivables",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Legal Charges plus supporting documentation",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Further charges (up stamping) on existing legal charges & debentures*",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Letter of Lien (any type)/letter of set off/memorandum of general pledge",
      type: "Primary",
      category: "Non-Allowable",
    },
    { name: "Cash Cover", type: "Primary", category: "Allowable" },
    {
      name: "Joint Registrations of assets",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Execution of Documents by Motor Vehicle Dealers",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Final Invoices for settlement",
      type: "Primary",
      category: "Non-Allowable",
    },
    { name: "Shares and bonds", type: "Primary", category: "Non-Allowable" },
    {
      name: "Insurance for assets financed",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Evidence of payment of full deposit amounts (borrowers contribution) before drawdown",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Tracking certificates",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Memorandum and Articles of Association, or amendments of the same where the facility has already been approved for a new to Bank client",
      type: "Primary",
      category: "Non-Allowable",
    },
    { name: "Affidavit of Title", type: "Primary", category: "Non-Allowable" },
    { name: "Sale agreement", type: "Primary", category: "Non-Allowable" },
    {
      name: "Offer Letter (Straight annual reviews) - to pursued as limit extensions and not deferrals",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Any New Guarantees (director, company, property owners' guarantee etc.) and Indemnities",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Deeds of Assignment of Incomes and Receivables",
      type: "Primary",
      category: "Non-Allowable",
    },
    { name: "Deeds of Indemnity", type: "Primary", category: "Non-Allowable" },
    { name: "Deeds of Subordination", type: "Primary", category: "Allowable" },
    {
      name: "Statements of Assets and Liabilities including certificate of compliance to the LOF",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Valuations / Re-valuations for purpose of up-stamping of securities",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Re-valuation (normal revaluation after 4 years)",
      type: "Primary",
      category: "Allowable",
    },
    { name: "Company searches", type: "Primary", category: "Non-Allowable" },
    {
      name: "Collection of Bank Charges",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Import entry and corresponding duty payment receipts for vehicles financed",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "Receipt of original logbooks in the name of the seller",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Current Vehicle Inspection Reports",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Machine/Equipment Warranties",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Change of payee(s) or details of payee(s)",
      type: "Primary",
      category: "Non-Allowable",
    },
    {
      name: "For All Construction Related Credit Facilities Prior to Disbursement: architects certificates, Quantity Surveyor's Report, Bills of Quantities, certificate of occupation/completion Approved drawings, Contractor's All Risk Insurance Cover, Professional Certificates, Letters of Undertaking, National Environment Management Authority (NEMA), Energy and Petroleum Regulatory Authority (EPRA) and Road Authorities (KENHA, KURA,KERRA). National Construction Authority Approval, Contractor's profile, National Construction Authority certificate and Professional Certificates",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Where applicable, Compliance with provisions of the bank's and the United Nations Environmental and Social Management System (ESMS) and IFC Performance Standards",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Original share certificates (for shares & Bonds held as collateral)Share certificates for sectional units and blank transfer forms.",
      type: "Primary",
      category: "Allowable",
    },
    { name: "Land searches", type: "Primary", category: "Allowable" },
    {
      name: "Amendments on logbooks (subject to the customer having executed required documentation)",
      type: "Primary",
      category: "Allowable",
    },
    {
      name: "Commercial Benefit Agreements",
      type: "Primary",
      category: "Allowable",
    },

    // Secondary Documents
    { name: "Annual Returns", type: "Secondary", category: "Non-Allowable" },
    {
      name: "Tax Compliance Certificates",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Land Rents & Rates receipts",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Customer Identification Documents e.g. ID, Passport, KRA PINS",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Receipt of Final/Original Invoices from off takers, motor vehicle dealers/sellers etc.",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Employer salary remittance letters and their originals",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Employer check off letters and their originals",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Authority to sell letters from the bank's approved dealers.",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Provision of sellers bank details",
      type: "Secondary",
      category: "Allowable",
    },
    { name: "Landlords Letter", type: "Secondary", category: "Allowable" },
    {
      name: "Direct Debit or Standing Order forms/instructions",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Delivery Notes for equipment/machinery/goods",
      type: "Secondary",
      category: "Allowable",
    },
    {
      name: "Share of Wallet letter",
      type: "Secondary",
      category: "Allowable",
    },
    { name: "Current CR12", type: "Secondary", category: "Non-Allowable" },
    {
      name: "Opening of Mpesa Till number/linking to account/Till Transfer linked to account in another bank",
      type: "Secondary",
      category: "Non-Allowable",
    },
    {
      name: "Occupational safety and health audit reports",
      type: "Secondary",
      category: "Non-Allowable",
    },
  ];

  const handleSelect = (doc) => {
    // Check if maximum limit has been reached
    if (selectedDocuments.length >= MAX_DOCUMENTS) {
      return;
    }

    if (!selectedDocuments.some((selected) => selected.name === doc.name)) {
      setSelectedDocuments([...selectedDocuments, doc]);
    }
    setSearch("");
  };

  const removeDocument = (index) => {
    const temp = [...selectedDocuments];
    temp.splice(index, 1);
    setSelectedDocuments(temp);
  };

  const startEditing = (index, currentName) => {
    setEditingIndex(index);
    setEditingValue(currentName);
  };

  const saveEdit = (index) => {
    if (editingValue.trim() === "") {
      cancelEdit();
      return;
    }

    const temp = [...selectedDocuments];
    temp[index].name = editingValue;
    setSelectedDocuments(temp);
    setEditingIndex(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const filteredDocs = allDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()),
  );

  const getCategoryColor = (category) => {
    return category === "Allowable" ? SUCCESS_GREEN : ERROR_RED;
  };

  const getTypeColor = (type) => {
    return type === "Primary" ? PRIMARY_PURPLE : "#fa8c16";
  };

  // Columns for selected documents table
  const selectedDocumentsColumns = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_PURPLE,
            fontSize: 13,
          }}
        >
          {index + 1}
        </div>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      key: "name",
      render: (text, record, index) =>
        editingIndex === index ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onPressEnter={() => saveEdit(index)}
              autoFocus
              style={{ flex: 1, fontSize: 13 }}
              size="middle"
            />
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                type="text"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => saveEdit(index)}
                style={{ color: SUCCESS_GREEN }}
                title="Save"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={cancelEdit}
                style={{ color: ERROR_RED }}
                title="Cancel"
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: "#333",
              lineHeight: 1.4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingRight: 8,
            }}
            onClick={() => startEditing(index, text)}
          >
            <span style={{ flex: 1 }}>{text}</span>
          </div>
        ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      align: "center",
      render: (type) => (
        <div
          style={{
            color: getTypeColor(type),
            fontWeight: 600,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {type}
        </div>
      ),
    },
    {
      title: "Requested",
      key: "requested",
      width: 180,
      align: "center",
      render: (_, record, index) => {
        const docKey = record._id || record.name || String(index);
        const days = perDocumentDays[docKey] ?? null;
        const nextDate = days
          ? dayjs().add(Number(days), "day").format("DD MMM YYYY")
          : null;
        return (
          <div
            style={{
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {days ?? "-"}
              {days ? " days" : ""}
            </div>
            <div style={{ color: "#666", fontSize: 12 }}>{nextDate ?? "-"}</div>
          </div>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      align: "center",
      render: (category) => (
        <div
          style={{
            color: getCategoryColor(category),
            fontWeight: 600,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {category}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      align: "center",
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeDocument(index)}
          style={{ minWidth: "auto", fontSize: 12 }}
          title="Remove document"
        />
      ),
    },
  ];

  // Custom table styles matching the Completed component EXACTLY
  const customTableStyles = `
    .document-picker-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(43, 28, 103, 0.08);
      border: 1px solid #e0e0e0;
    }
    .document-picker-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_PURPLE} !important;
      font-weight: 700;
      font-size: 13px;
      padding: 14px 12px !important;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
      border-right: none !important;
    }
    .document-picker-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 12px 12px !important;
      font-size: 13px;
      color: #333;
    }
    .document-picker-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
    .document-picker-table .ant-pagination .ant-pagination-item-active {
      background-color: ${ACCENT_LIME} !important;
      border-color: ${ACCENT_LIME} !important;
    }
    .document-picker-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_PURPLE} !important;
      font-weight: 600;
    }
  `;

  return (
    <div style={{ padding: 0 }}>
      <style>{customTableStyles}</style>

      {/* Search Section */}
      <Card
        style={{
          marginBottom: 16,
          background: "#fafafa",
          border: `1px solid ${PRIMARY_PURPLE}20`,
          borderRadius: 8,
        }}
        size="small"
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search documents..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size="middle"
              style={{ fontSize: 13 }}
            />
          </Col>

          {selectedDocuments.length > 0 && (
            <Col xs={24} sm={12} md={4}>
              <Button
                danger
                onClick={() => setSelectedDocuments([])}
                style={{ width: "100%" }}
                size="middle"
              >
                Clear All
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Search Results */}
      {search && filteredDocs.length > 0 && (
        <Card
          style={{
            marginBottom: 16,
            border: `1px solid ${PRIMARY_PURPLE}20`,
            borderRadius: 8,
          }}
          size="small"
        >
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#fafafa",
              borderRadius: 4,
              fontSize: 13,
              color: "#666",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span>
              Found {filteredDocs.length} document
              {filteredDocs.length !== 1 ? "s" : ""}
            </span>
            <span>
              {selectedDocuments.length >= MAX_DOCUMENTS ? (
                <span style={{ color: ERROR_RED, fontWeight: 500 }}>
                  Maximum reached ({MAX_DOCUMENTS}/{MAX_DOCUMENTS})
                </span>
              ) : (
                "Click to select"
              )}
            </span>
          </div>

          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              border: `1px solid ${PRIMARY_PURPLE}10`,
              borderRadius: 4,
              backgroundColor: "white",
            }}
          >
            {filteredDocs.map((doc, i) => {
              const isSelected = selectedDocuments.some(
                (selected) => selected.name === doc.name,
              );
              const isMaxReached = selectedDocuments.length >= MAX_DOCUMENTS;
              const canSelect = !isSelected && !isMaxReached;

              return (
                <div
                  key={i}
                  onClick={() => canSelect && handleSelect(doc)}
                  style={{
                    padding: "12px",
                    cursor: canSelect ? "pointer" : "not-allowed",
                    borderBottom:
                      i < filteredDocs.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                    backgroundColor: isSelected
                      ? `${SUCCESS_GREEN}08`
                      : isMaxReached
                        ? "#fafafa"
                        : "white",
                    transition: "all 0.2s",
                    opacity: isMaxReached && !isSelected ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) =>
                    canSelect &&
                    (e.currentTarget.style.backgroundColor = "#e6f7ff")
                  }
                  onMouseLeave={(e) =>
                    canSelect &&
                    (e.currentTarget.style.backgroundColor = isSelected
                      ? `${SUCCESS_GREEN}08`
                      : "white")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        {isSelected && (
                          <CheckOutlined
                            style={{
                              color: SUCCESS_GREEN,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isSelected
                              ? "#666"
                              : isMaxReached
                                ? "#999"
                                : "#262626",
                            flex: 1,
                          }}
                        >
                          {doc.name}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          fontSize: 12,
                          marginTop: 8,
                        }}
                      >
                        <div
                          style={{
                            color: getTypeColor(doc.type),
                            fontWeight: 500,
                            fontSize: 12,
                            opacity: isMaxReached && !isSelected ? 0.7 : 1,
                          }}
                        >
                          {doc.type}
                        </div>
                        <div
                          style={{
                            color: getCategoryColor(doc.category),
                            fontWeight: 500,
                            fontSize: 12,
                            opacity: isMaxReached && !isSelected ? 0.7 : 1,
                          }}
                        >
                          {doc.category}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <div
                        style={{
                          padding: "4px 10px",
                          backgroundColor: SUCCESS_GREEN,
                          color: "white",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        Selected
                      </div>
                    ) : isMaxReached ? (
                      <div
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#f0f0f0",
                          color: "#999",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        Max Reached
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "4px 10px",
                          backgroundColor: ACCENT_LIME,
                          color: "white",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        Add
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Selected Documents Table */}
      {selectedDocuments.length > 0 ? (
        <>
          <div className="document-picker-table">
            <Table
              columns={selectedDocumentsColumns}
              dataSource={selectedDocuments.map((doc, index) => ({
                ...doc,
                key: index,
              }))}
              size="middle"
              pagination={false}
              scroll={{ x: 500 }}
            />
          </div>

          {/* Footer with document count */}
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              backgroundColor:
                selectedDocuments.length >= MAX_DOCUMENTS
                  ? "#fff7e6"
                  : "#f6ffed",
              borderRadius: 4,
              border: `1px solid ${
                selectedDocuments.length >= MAX_DOCUMENTS
                  ? "#faad14"
                  : "#52c41a"
              }20`,
              fontSize: 12,
              color: "#666",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{selectedDocuments.length}</strong> document
              {selectedDocuments.length !== 1 ? "s" : ""} selected
            </div>
            <div
              style={{
                fontWeight:
                  selectedDocuments.length >= MAX_DOCUMENTS ? "bold" : "normal",
                color:
                  selectedDocuments.length >= MAX_DOCUMENTS
                    ? "#fa8c16"
                    : "#52c41a",
              }}
            >
              {selectedDocuments.length >= MAX_DOCUMENTS ? (
                <span>Maximum limit reached</span>
              ) : (
                <span>
                  {MAX_DOCUMENTS - selectedDocuments.length} more can be added
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <Card
          style={{
            textAlign: "center",
            padding: 40,
            color: "#999",
            backgroundColor: "white",
            borderRadius: 8,
            border: "1px dashed #d9d9d9",
            marginTop: 16,
          }}
        >
          <FileOutlined
            style={{ fontSize: 48, marginBottom: 16, color: "#d9d9d9" }}
          />
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            No documents selected yet
          </div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Search for documents above and click to add them here (Max:{" "}
            {MAX_DOCUMENTS} documents)
          </Text>
        </Card>
      )}
    </div>
  );
}

export default DocumentPicker;
