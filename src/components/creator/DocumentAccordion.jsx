import React from "react";
import { Table, Select, Input, Button, Collapse, Modal, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { STATUS_COLORS } from "../../utils/constants";
import "../../styles/creatorDesignSystem.css";

const { Panel } = Collapse;
const { Option } = Select;

// Status mapping
const actionToStatus = {
  submitted: "submitted",
  pendingrm: "pendingrm",
  pendingco: "pendingco",
  tbo: "tbo",
  sighted: "sighted",
  waived: "waived",
  deferred: "deferred",
};

// Status color mapping - using consistent colors from constants
const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase();
  const colorObj = STATUS_COLORS[statusLower] || STATUS_COLORS.default;
  return {
    bg: colorObj.bg,
    text: colorObj.color,
  };
};

// Template for a new document
const createEmptyDoc = () => ({
  name: "",
  action: "",
  status: "",
  comment: "",
});

const DocumentAccordion = ({ documents, setDocuments }) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = React.useState(null);

  // Ensure documents is always an array and has proper structure
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const selectedCategory =
    selectedCategoryIndex !== null ? safeDocuments[selectedCategoryIndex] : null;
  const selectedDocList = Array.isArray(selectedCategory?.docList)
    ? selectedCategory.docList
    : [];

  // Add new document inside a category
  const handleAddDocument = (catIdx) => {
    setDocuments(
      safeDocuments.map((category, index) =>
        index === catIdx
          ? {
              ...category,
              docList: [...(category.docList || []), createEmptyDoc()],
            }
          : category,
      ),
    );
  };

  // Remove document
  const handleRemoveDocument = (catIdx, docIdx) => {
    setDocuments(
      safeDocuments.map((category, index) =>
        index === catIdx
          ? {
              ...category,
              docList: (category.docList || []).filter((_, indexToKeep) => indexToKeep !== docIdx),
            }
          : category,
      ),
    );
  };

  // Handle edit/change inside a document
  const handleDocumentChange = (catIdx, docIdx, field, value) => {
    setDocuments(
      safeDocuments.map((category, index) => {
        if (index !== catIdx) {
          return category;
        }

        const docList = [...(category.docList || [])];
        const existingDoc = docList[docIdx] || createEmptyDoc();
        const updatedDoc = {
          ...existingDoc,
          [field]: value,
        };

        if (field === "action") {
          updatedDoc.status = actionToStatus[value] || "";
        }

        docList[docIdx] = updatedDoc;

        return {
          ...category,
          docList,
        };
      }),
    );
  };

  // Table columns
  const getColumns = (catIdx) => [
    {
      title: "Document",
      dataIndex: "name",
      width: 220,
      render: (_, record) => (
        <Input
          value={record.name}
          placeholder="Document Name"
          size="small"
          onChange={(e) =>
            handleDocumentChange(catIdx, record.docIdx, "name", e.target.value)
          }
        />
      ),
    },

    {
      title: "Action",
      dataIndex: "action",
      width: 190,
      render: (_, record) => (
        <Select
          size="small"
          value={record.action}
          style={{ width: 150 }}
          placeholder="Select Action"
          onChange={(val) =>
            handleDocumentChange(catIdx, record.docIdx, "action", val)
          }
        >
          <Option value="submitted">Submitted</Option>
          <Option value="pendingrm">Pending from Rm</Option>
          <Option value="pendingco">Pending from Co</Option>
          <Option value="tbo">TBO</Option>
          <Option value="sighted">Sighted</Option>
          <Option value="waived">Waived</Option>
          <Option value="deferred">Deferred</Option>
        </Select>
      ),
    },

    {
      title: "Status From Co",
      dataIndex: "status",
      width: 150,
      render: (s) => {
        if (!s) return <span style={{ color: "#999" }}>—</span>;
        const colors = getStatusColor(s);
        return (
          <span
            className="creator-document-status-text"
            style={{
              color: colors.text,
              fontWeight: 600,
              fontSize: 12,
              textTransform: "lowercase",
            }}
          >
            {s}
          </span>
        );
      },
    },

    {
      title: "Comment from Co",
      dataIndex: "comment",
      width: 180,
      render: (_, record) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={record.comment}
          placeholder="Enter comment"
          onChange={(e) =>
            handleDocumentChange(
              catIdx,
              record.docIdx,
              "comment",
              e.target.value,
            )
          }
        />
      ),
    },

    {
      title: "Remove",
      width: 72,
      render: (_, record) => (
        <Tooltip title="Delete document">
          <Button
            type="text"
            className="creator-document-delete"
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveDocument(catIdx, record.docIdx)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .creator-document-collapse.ant-collapse {
          background: transparent !important;
          border: none !important;
        }
        .creator-document-collapse .ant-collapse-item {
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06) !important;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .creator-document-collapse .ant-collapse-header {
          background: var(--color-bg) !important;
          color: var(--color-text-dark) !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 14px 16px !important;
          border-bottom: none !important;
        }
        .creator-document-collapse .ant-collapse-expand-icon {
          color: var(--color-primary-dark) !important;
        }
        .creator-document-collapse .ant-collapse-item-active .ant-collapse-header {
          color: var(--color-primary-dark) !important;
        }
        .creator-document-add.ant-btn,
        .creator-document-add.ant-btn:hover,
        .creator-document-add.ant-btn:focus {
          width: 100%;
          min-height: 38px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          background: transparent !important;
          color: var(--color-primary-medium) !important;
          box-shadow: none !important;
          font-weight: 600 !important;
        }
        .creator-document-remove.ant-btn,
        .creator-document-remove.ant-btn:hover,
        .creator-document-remove.ant-btn:focus {
          min-height: 32px !important;
          border-radius: 6px !important;
          border: none !important;
          background: #B42318 !important;
          color: #fff !important;
          box-shadow: none !important;
          font-weight: 600 !important;
        }
        .creator-document-accordion-table .ant-input,
        .creator-document-accordion-table .ant-select .ant-select-selector {
          min-height: 34px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
          font-size: 12px !important;
          color: var(--color-text-body) !important;
        }
        .creator-document-accordion-table .ant-input {
          padding: 4px 10px !important;
        }
        .creator-document-accordion-table .ant-input-textarea textarea {
          min-height: 38px !important;
          resize: vertical;
        }
        .creator-document-accordion-table .ant-select-selection-item,
        .creator-document-accordion-table .ant-select-selection-placeholder,
        .creator-document-accordion-table .ant-picker,
        .creator-document-accordion-table .ant-btn {
          font-size: 12px !important;
        }
        .creator-document-accordion-table .ant-input:hover,
        .creator-document-accordion-table .ant-input:focus,
        .creator-document-accordion-table .ant-select-focused .ant-select-selector,
        .creator-document-accordion-table .ant-select:hover .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
        }
        .creator-document-accordion-table .ant-table {
          table-layout: fixed;
        }
        .creator-document-accordion-table .ant-table-container,
        .creator-document-accordion-table .ant-table-content,
        .creator-document-accordion-table .ant-table-body {
          overflow-x: auto !important;
        }
        .creator-document-accordion-table .ant-table-thead > tr > th {
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
          padding: 11px 12px !important;
          white-space: nowrap;
          line-height: 1.25 !important;
        }
        .creator-document-accordion-table .ant-table-tbody > tr > td {
          padding: 12px !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.75) !important;
          vertical-align: middle;
          font-size: 12px !important;
          color: var(--color-text-body) !important;
          line-height: 1.45 !important;
          background: var(--color-white) !important;
        }
        .creator-document-accordion-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .creator-document-accordion-table .ant-table-tbody > tr:hover > td {
          background: var(--color-white) !important;
        }
        .creator-document-status-text {
          display: inline-block;
          line-height: 1.25;
          white-space: nowrap;
        }
        .creator-document-category-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-light);
          font-size: 11px;
          font-weight: 500;
          text-transform: none;
          letter-spacing: normal;
        }
        .creator-document-count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 8px;
          border-radius: 999px;
          background: rgba(15, 58, 86, 0.08);
          color: var(--color-primary-dark);
          font-size: 11px;
          font-weight: 700;
        }
        .creator-document-modal.ant-modal .ant-modal-content {
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden;
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18) !important;
        }
        .creator-document-modal.ant-modal .ant-modal-header {
          margin-bottom: 0 !important;
          padding: 18px 20px 16px !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
        }
        .creator-document-modal.ant-modal .ant-modal-title {
          color: var(--color-text-dark) !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em;
          padding-right: 32px;
        }
        .creator-document-modal.ant-modal .ant-modal-body {
          padding: 18px 20px 20px !important;
          background: var(--color-white) !important;
        }
        .creator-document-modal .ant-modal-close {
          top: 14px !important;
          right: 18px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 6px !important;
          color: var(--color-text-medium) !important;
          background: rgba(64, 83, 76, 0.06) !important;
          border: 1px solid rgba(214, 189, 152, 0.22) !important;
        }
        .creator-document-modal .ant-modal-close:hover {
          color: var(--color-primary-dark) !important;
          background: var(--color-white) !important;
        }
        .creator-document-modal-header-copy {
          color: var(--color-text-medium);
          font-size: 13px;
          margin-top: 2px;
          line-height: 1.45;
        }
        .creator-document-modal-topbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 14px;
        }
        .creator-document-modal-table-scroll {
          max-height: calc(100vh - 320px);
          overflow-y: auto;
          padding-right: 4px;
          border-radius: 8px;
        }
        .creator-document-modal-table-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .creator-document-modal-table-scroll::-webkit-scrollbar-thumb {
          background: rgba(15, 58, 86, 0.28);
          border-radius: 999px;
        }
        .creator-document-modal-table-scroll::-webkit-scrollbar-track {
          background: rgba(64, 83, 76, 0.04);
          border-radius: 999px;
        }
        .creator-document-close.ant-btn,
        .creator-document-close.ant-btn:hover,
        .creator-document-close.ant-btn:focus {
          min-height: 38px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
          font-weight: 600 !important;
        }
        .creator-document-delete.ant-btn,
        .creator-document-delete.ant-btn:hover,
        .creator-document-delete.ant-btn:focus {
          color: #ff4d4f !important;
          background: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    <Collapse
      activeKey={[]}
      accordion
      className="creator-document-collapse"
      onChange={(activeKey) => {
        const nextKey = Array.isArray(activeKey) ? activeKey[0] : activeKey;
        if (nextKey === undefined || nextKey === null || nextKey === "") {
          return;
        }

        setSelectedCategoryIndex(Number(nextKey));
      }}
    >
      {safeDocuments.map((cat, catIdx) => {
        const safeDocList = Array.isArray(cat.docList) ? cat.docList : [];
        return (
          <Panel
            header={cat.category || `Category ${catIdx + 1}`}
            extra={
              <span className="creator-document-category-meta">
                Documents
                <span className="creator-document-count-pill">{safeDocList.length}</span>
              </span>
            }
            key={catIdx}
          >
            <div />
          </Panel>
        );
      })}
    </Collapse>

    <Modal
      open={selectedCategoryIndex !== null}
      onCancel={() => setSelectedCategoryIndex(null)}
      footer={null}
      title={selectedCategory?.category || "Category Documents"}
      centered
      width={1100}
      className="creator-document-modal"
      maskClosable
      destroyOnClose={false}
    >
      <div className="creator-document-modal-topbar">
        <div className="creator-document-modal-header-copy">
          Edit the documents in this category without pushing content below the page footer.
        </div>
        <Button
          className="creator-document-add"
          onClick={() => {
            if (selectedCategoryIndex !== null) {
              handleAddDocument(selectedCategoryIndex);
            }
          }}
        >
          + Add Document
        </Button>
      </div>

      <div className="creator-document-modal-table-scroll">
        <div className="creator-table-shell creator-document-accordion-table">
          <Table
            pagination={false}
            tableLayout="fixed"
            columns={getColumns(selectedCategoryIndex ?? 0)}
            dataSource={selectedDocList.map((doc, docIdx) => ({
              ...doc,
              key: `${selectedCategoryIndex ?? 0}-${docIdx}`,
              docIdx,
            }))}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button className="creator-document-close" onClick={() => setSelectedCategoryIndex(null)}>
          Close
        </Button>
      </div>
    </Modal>
    </>
  );
};

export default DocumentAccordion;
