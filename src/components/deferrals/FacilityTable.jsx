import React, { useState } from "react";
import {
  Table,
  Button,
  InputNumber,
  Typography,
  Tag,
  Select,
  Input,
  Space,
} from "antd";
import {
  PlusOutlined,
  CloseOutlined,
  SearchOutlined,
  CheckOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

// Common facility types for dropdown
const FACILITY_TYPES = [
  "Term Loan",
  "Overdraft Facility",
  "Letter of Credit",
  "Bank Guarantee",
  "Invoice Discounting",
  "Working Capital Loan",
  "Trade Finance",
  "Asset Finance",
  "Project Finance",
  "Revolving Credit",
  "Construction Loan",
  "Mortgage Loan",
  "Equipment Finance",
  "Consumer Loan",
  "Agricultural Loan",
  "SME Loan",
  "Corporate Loan",
];

export default function FacilityTable({ facilities, setFacilities }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const addRow = () => {
    setFacilities([
      ...facilities,
      {
        type: "",
        sanctioned: 0,
        balance: 0,
        headroom: 0,
      },
    ]);
  };

  const updateRow = (index, field, value) => {
    const temp = [...facilities];
    temp[index][field] = field === "type" ? value : Number(value);

    if (field === "sanctioned" || field === "balance") {
      temp[index].headroom = temp[index].sanctioned - temp[index].balance;
    }

    setFacilities(temp);
  };

  const removeRow = (index) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  const startEditing = (index, currentValue) => {
    setEditingIndex(index);
    setEditingValue(currentValue);
  };

  const saveEdit = (index) => {
    if (editingValue.trim() === "") {
      cancelEdit();
      return;
    }

    updateRow(index, "type", editingValue);
    setEditingIndex(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const subtotals = facilities.reduce(
    (acc, f) => {
      acc.sanctioned += Number(f.sanctioned) || 0;
      acc.balance += Number(f.balance) || 0;
      acc.headroom += Number(f.headroom) || 0;
      return acc;
    },
    { sanctioned: 0, balance: 0, headroom: 0 },
  );

  const filteredFacilityTypes = FACILITY_TYPES.filter((type) =>
    type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    {
      title: "Facility Type",
      dataIndex: "type",
      key: "type",
      width: 250,
      render: (text, record, index) => {
        if (record.isSubtotal) {
          return (
            <div className="flex items-center gap-2">
              <Text className="text-gray-700">Sub-Total</Text>
            </div>
          );
        }

        if (editingIndex === index) {
          return (
            <div className="flex gap-2">
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onPressEnter={() => saveEdit(index)}
                autoFocus
                className="flex-1 rounded-lg border border-[rgba(214,189,152,0.2)] focus:border-[#164679] focus:ring-2 focus:ring-[rgba(22,70,121,0.08)]"
                size="middle"
                placeholder="Enter facility type"
              />
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => saveEdit(index)}
                  title="Save"
                  className="rounded-md text-green-700 hover:bg-green-50"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={cancelEdit}
                  title="Cancel"
                  className="rounded-md text-red-600 hover:bg-red-50"
                />
              </Space>
            </div>
          );
        }

        return (
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              {text ? (
                <div
                  className="flex items-center gap-2 cursor-pointer p-2 rounded transition-all min-h-[32px] bg-white border border-[rgba(214,189,152,0.16)] hover:bg-[rgba(245,247,244,0.9)] hover:border-[rgba(214,189,152,0.3)]"
                  onClick={() => startEditing(index, text)}
                >
                  <Text className="flex-1">{text}</Text>
                </div>
              ) : (
                <Select
                  value={text}
                  onChange={(val) => updateRow(index, "type", val)}
                  placeholder="Select facility type"
                  className="w-full"
                  size="middle"
                  showSearch
                  allowClear
                  filterOption={false}
                  onSearch={(value) => setSearchTerm(value)}
                  dropdownRender={(menu) => (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="p-2">
                        <Input
                          placeholder="Search facility types..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          allowClear
                          size="middle"
                          className="mb-2 rounded-lg border border-gray-200"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto border-t border-gray-100">
                        {menu}
                      </div>
                      <div className="p-2 border-t border-gray-100 bg-white">
                        <Button
                          type="text"
                          block
                          onClick={() => startEditing(index, text)}
                          className="text-left text-gray-600 hover:text-gray-800"
                        >
                          Add Custom Facility
                        </Button>
                      </div>
                    </div>
                  )}
                >
                  {filteredFacilityTypes.length > 0 ? (
                    filteredFacilityTypes.map((type) => (
                      <Option key={type} value={type}>
                        <div className="py-1 text-sm">{type}</div>
                      </Option>
                    ))
                  ) : (
                    <Option disabled>
                      <div className="py-1 text-sm text-gray-400 text-center">
                        No matching facility types
                      </div>
                    </Option>
                  )}
                </Select>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Sanctioned Limit (KES '000)",
      dataIndex: "sanctioned",
      key: "sanctioned",
      align: "right",
      width: 220,
      render: (value, record, index) => {
        if (record.isSubtotal) {
          return (
            <div className="text-right text-gray-700">
              {subtotals.sanctioned.toLocaleString()}
            </div>
          );
        }

        return (
          <InputNumber
            value={value}
            onChange={(val) => updateRow(index, "sanctioned", val)}
            className="w-full rounded-lg border border-[rgba(214,189,152,0.2)] focus:border-[#164679] focus:ring-2 focus:ring-[rgba(22,70,121,0.08)]"
            style={{ width: "100%" }}
            size="middle"
            min={0}
            step={1000}
            precision={0}
            placeholder="0"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        );
      },
    },
    {
      title: "Balance (KES '000)",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      width: 220,
      render: (value, record, index) => {
        if (record.isSubtotal) {
          return (
            <div className="text-right text-[#164679]">
              {subtotals.balance.toLocaleString()}
            </div>
          );
        }

        return (
          <InputNumber
            value={value}
            onChange={(val) => updateRow(index, "balance", val)}
            className="w-full rounded-lg border border-[rgba(214,189,152,0.2)] focus:border-[#164679] focus:ring-2 focus:ring-[rgba(22,70,121,0.08)]"
            style={{ width: "100%" }}
            size="middle"
            min={0}
            step={1000}
            precision={0}
            placeholder="0"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        );
      },
    },
    {
      title: "Headroom (KES '000)",
      dataIndex: "headroom",
      key: "headroom",
      align: "right",
      width: 160,
      render: (value, record) => {
        const headroomValue = record.isSubtotal ? subtotals.headroom : value;
        const getTagColor = () => {
          if (headroomValue < 0) return "red";
          if (headroomValue === 0) return "orange";
          return "green";
        };
        const getTagClasses = () => {
          const base = "inline-block px-3 py-1 rounded-xl text-sm font-medium";
          if (headroomValue < 0) return `${base} bg-red-50 text-red-600 border border-red-200`;
          if (headroomValue === 0) return `${base} bg-orange-50 text-orange-600 border border-orange-200`;
          return `${base} bg-green-50 text-green-700 border border-green-200`;
        };

        return (
          <div className="text-right">
            <span className={getTagClasses()}>
              {headroomValue.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 80,
      render: (_, record, index) => {
        if (record.isSubtotal) return null;

        return (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => removeRow(index)}
            size="small"
            title="Delete row"
            className="rounded-md text-red-600 hover:bg-red-50"
          />
        );
      },
    },
  ];

  const tableData = [
    ...facilities.map((facility, index) => ({
      key: index,
      ...facility,
    })),
    {
      key: "subtotal",
      type: "Sub-Total",
      sanctioned: subtotals.sanctioned,
      balance: subtotals.balance,
      headroom: subtotals.headroom,
      isSubtotal: true,
    },
  ];

  const tableComponents = {
    header: {
      cell: (props) => (
        <th
          {...props}
          className="bg-white text-gray-700 font-medium text-sm p-3 border-b border-[rgba(214,189,152,0.2)]"
        />
      ),
    },
  };

  // Custom row className for styling
  const getRowClassName = (record) => {
    if (record.isSubtotal) {
      return "facility-subtotal-row";
    }
    return "facility-data-row";
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-[rgba(214,189,152,0.16)] mt-2">
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-600 text-sm font-semibold">
          Track facilities tied to this request
        </div>
        <Button
          onClick={addRow}
          icon={<PlusOutlined />}
          className="rounded-lg bg-[#3ab3e5] text-white shadow-md hover:bg-[#2a8cb5] border-none"
        >
          Add Row
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="middle"
          scroll={{ x: "max-content" }}
          rowClassName={getRowClassName}
          className="border border-[rgba(214,189,152,0.16)] rounded-xl overflow-hidden"
          components={tableComponents}
        />
      </div>

      {/* Additional styles for table rows (Ant Design specific overrides) */}
      <style>{`
        .facility-data-row > td {
          border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
        }
        .facility-data-row:hover > td {
          background-color: rgba(245, 247, 244, 0.9) !important;
        }
        .facility-subtotal-row > td {
          background-color: #ffffff !important;
          border-top: 1px solid rgba(214, 189, 152, 0.25) !important;
          font-weight: 600 !important;
        }
        .facility-subtotal-row:hover > td {
          background-color: #ffffff !important;
        }
        .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .ant-input-number-focused,
        .ant-select-focused .ant-select-selector {
          border-color: #164679 !important;
          box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.08) !important;
        }
      `}</style>
    </div>
  );
}