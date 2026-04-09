import React from "react";
import { Select, Input, Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const DocumentInputSection = ({
  documents,
  selectedCategory,
  setSelectedCategory,
  newDocName,
  setNewDocName,
  handleAddNewDocument,
}) => {
  return (
    <Space>
      <Select
        placeholder="Select Category"
        style={{ width: 250 }}
        value={selectedCategory}
        onChange={setSelectedCategory}
      >
        {documents.map((cat, i) => (
          <Option key={i} value={i}>
            {cat.category}
          </Option>
        ))}
      </Select>

      <Input
        placeholder="Document Name"
        value={newDocName}
        onChange={(e) => setNewDocName(e.target.value)}
        style={{ width: 250 }}
      />

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddNewDocument}
        disabled={selectedCategory === null}
        style={{
          backgroundColor: "#164679 !important",
          borderColor: "#164679 !important",
          color: "#fff !important",
        }}
        className="primary-dcl-button"
      >
        Add Document
      </Button>
    </Space>
  );
};

export default DocumentInputSection;
