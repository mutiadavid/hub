

import React from "react";
import { Input, Select, Button, message } from "antd";
import { loanTypeDocuments } from "../../pages/docTypes";
import "../../styles/creatorDesignSystem.css";

const { Option } = Select;

const DocumentInputSectionCoCreator = ({
  loanType, // ✅ REQUIRED
  newDocName,
  setNewDocName,
  selectedCategoryName,
  setSelectedCategoryName,
  handleAddNewDocument,
}) => {
  const categories = React.useMemo(() => {
    if (!loanType) return [];

    // Split types by comma (handles "A, B" cases) or just use the single type
    const typesToCheck = loanType
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const allUniqueCategories = new Set();

    typesToCheck.forEach((type) => {
      // Find the entry that matches (case-insensitive)
      const exactMatch = Object.keys(loanTypeDocuments).find(
        (key) => key.toLowerCase() === type.toLowerCase(),
      );

      if (exactMatch && loanTypeDocuments[exactMatch]) {
        loanTypeDocuments[exactMatch].forEach((group) => {
          if (group.title) allUniqueCategories.add(group.title);
        });
      }
    });

    // Fallback: If no categories were found, it might be the general "Multiple Loan Type" placeholder
    if (allUniqueCategories.size === 0 && loanType) {
      Object.values(loanTypeDocuments).forEach((catList) => {
        catList.forEach((cat) => allUniqueCategories.add(cat.title));
      });
    }

    return Array.from(allUniqueCategories).sort();
  }, [loanType]);

  const handleAddClick = () => {
    if (!newDocName.trim() || !selectedCategoryName) {
      return message.error("Enter document name and select a category");
    }
    handleAddNewDocument();
  };

  return (
    <div className="creator-create-card creator-create-card--documents">
      <style>{`
        .creator-create-card--documents {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 16px;
        }
        .creator-doc-input-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }
        .creator-doc-input-helper {
          color: var(--color-text-light);
          font-size: 12px;
          line-height: 1.45;
        }
        .creator-doc-input-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: stretch;
        }
        .creator-doc-input-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .creator-create-card--documents .ant-input,
        .creator-create-card--documents .ant-select .ant-select-selector {
          min-height: 40px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
          width: 100% !important;
        }
        .creator-create-card--documents .ant-input:hover,
        .creator-create-card--documents .ant-input:focus,
        .creator-create-card--documents .ant-select-focused .ant-select-selector,
        .creator-create-card--documents .ant-select:hover .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
        }
        .creator-create-primary-button.ant-btn,
        .creator-create-primary-button.ant-btn:hover,
        .creator-create-primary-button.ant-btn:focus {
          min-height: 40px !important;
          padding: 0 16px !important;
          border-radius: 6px !important;
          border: none !important;
          background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
          color: #fff !important;
          box-shadow: none !important;
          font-weight: 600 !important;
          width: 100%;
        }
        .creator-create-card--documents .ant-select {
          width: 100%;
        }
      `}</style>
      <div className="creator-doc-input-copy">
        <div className="creator-caption">Add Document</div>
        <div className="creator-doc-input-helper">
          Add a new supporting document to one of the available categories.
        </div>
      </div>
      <div className="creator-doc-input-row">
        <div className="creator-doc-input-field">
          <label className="creator-label">Document Name</label>
          <Input
            placeholder="Document Name"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
          />
        </div>

        <div className="creator-doc-input-field">
          <label className="creator-label">Category</label>
          <Select
            placeholder={loanType ? "Select Category" : "Select Loan Type First"}
            value={selectedCategoryName}
            onChange={setSelectedCategoryName}
            allowClear
            showSearch
            disabled={!loanType}
          >
            {categories.map((title) => (
              <Option key={title} value={title}>
                {title}
              </Option>
            ))}
          </Select>
        </div>

        <Button
          type="primary"
          onClick={handleAddClick}
          className="creator-create-primary-button"
        >
          Add Document
        </Button>
      </div>
    </div>
  );
};

export default DocumentInputSectionCoCreator;
