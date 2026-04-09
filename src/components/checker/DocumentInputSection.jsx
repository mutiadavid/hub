import React from "react";
import { Select, Input, Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const DocumentInputSection = ({
  // 1. Renamed to match the data passed from the parent (array of category name strings)
  uniqueCategories,
  // 2. Renamed to reflect the value being held (the category name string)
  selectedCategoryName,
  setSelectedCategoryName,
  newDocName,
  setNewDocName,
  handleAddNewDocument,
}) => {
  return (
    <Space size="middle" style={{ marginBottom: 20 }}>
      <Select
        placeholder="Select Category"
        style={{ width: 250 }}
        value={selectedCategoryName}
        // Use setSelectedCategoryName from props
        onChange={setSelectedCategoryName}
      >
        {/* Map over the array of category name strings */}
        {uniqueCategories.map((categoryName) => (
          // Use the category name as both the key and the value
          <Option key={categoryName} value={categoryName}>
            {categoryName}
          </Option>
        ))}
      </Select>

      <Input
        placeholder="Document Name (e.g., Audited Financials 2024)"
        value={newDocName}
        onChange={(e) => setNewDocName(e.target.value)}
        style={{ width: 350 }}
      />

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddNewDocument}
        // Disable if a category is not selected OR the name is empty
        disabled={!selectedCategoryName || !newDocName.trim()}
      >
        Add Document
      </Button>
    </Space>
  );
};

export default DocumentInputSection;
