// import React, { useState } from "react";
// import {
//   Table,
//   Button,
//   InputNumber,
//   Typography,
//   Tag,
//   Select,
//   Input,
//   Space,
// } from "antd";
// import {
//   PlusOutlined,
//   CloseOutlined,
//   CalculatorOutlined,
//   SearchOutlined,
//   CheckOutlined,
// } from "@ant-design/icons";

// const { Text } = Typography;
// const { Option } = Select;

// // Theme colors from DeferralForm
// const PRIMARY_PURPLE = "#2B1C67";
// const PRIMARY_BLUE = "#164679";
// const ACCENT_LIME = "#b5d334";
// const HEADER_BLUE = "#003366"; // Dark blue color for headers

// // Common facility types for dropdown
// const FACILITY_TYPES = [
//   "Term Loan",
//   "Overdraft Facility",
//   "Letter of Credit",
//   "Bank Guarantee",
//   "Invoice Discounting",
//   "Working Capital Loan",
//   "Trade Finance",
//   "Asset Finance",
//   "Project Finance",
//   "Revolving Credit",
//   "Construction Loan",
//   "Mortgage Loan",
//   "Equipment Finance",
//   "Consumer Loan",
//   "Agricultural Loan",
//   "SME Loan",
//   "Corporate Loan",
// ];

// export default function FacilityTable({ facilities, setFacilities }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [editingValue, setEditingValue] = useState("");

//   const addRow = () => {
//     setFacilities([
//       ...facilities,
//       {
//         type: "",
//         sanctioned: 0,
//         balance: 0,
//         headroom: 0,
//       },
//     ]);
//   };

//   const updateRow = (index, field, value) => {
//     const temp = [...facilities];
//     temp[index][field] = field === "type" ? value : Number(value);

//     // Recalculate headroom whenever sanctioned or balance changes
//     if (field === "sanctioned" || field === "balance") {
//       temp[index].headroom = temp[index].sanctioned - temp[index].balance;
//     }

//     setFacilities(temp);
//   };

//   const removeRow = (index) => {
//     // Allow deletion of all rows - no restrictions
//     setFacilities(facilities.filter((_, i) => i !== index));
//   };

//   const startEditing = (index, currentValue) => {
//     setEditingIndex(index);
//     setEditingValue(currentValue);
//   };

//   const saveEdit = (index) => {
//     if (editingValue.trim() === "") {
//       cancelEdit();
//       return;
//     }

//     updateRow(index, "type", editingValue);
//     setEditingIndex(null);
//     setEditingValue("");
//   };

//   const cancelEdit = () => {
//     setEditingIndex(null);
//     setEditingValue("");
//   };

//   // Calculate subtotals
//   const subtotals = facilities.reduce(
//     (acc, f) => {
//       acc.sanctioned += Number(f.sanctioned) || 0;
//       acc.balance += Number(f.balance) || 0;
//       acc.headroom += Number(f.headroom) || 0;
//       return acc;
//     },
//     { sanctioned: 0, balance: 0, headroom: 0 }
//   );

//   // Filter facility types based on search
//   const filteredFacilityTypes = FACILITY_TYPES.filter((type) =>
//     type.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Define columns for Ant Design Table
//   const columns = [
//     {
//       title: "Facility Type",
//       dataIndex: "type",
//       key: "type",
//       width: 250,
//       render: (text, record, index) => {
//         // Check if this is the subtotal row
//         if (record.isSubtotal) {
//           return (
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <Text strong style={{ color: PRIMARY_PURPLE }}>
//                 Sub-Total
//               </Text>
//             </div>
//           );
//         }

//         // Check if this row is in edit mode
//         if (editingIndex === index) {
//           return (
//             <div style={{ display: "flex", gap: 8 }}>
//               <Input
//                 value={editingValue}
//                 onChange={(e) => setEditingValue(e.target.value)}
//                 onPressEnter={() => saveEdit(index)}
//                 autoFocus
//                 style={{ flex: 1 }}
//                 size="middle"
//                 placeholder="Enter facility type"
//               />
//               <Space>
//                 <Button
//                   type="text"
//                   size="small"
//                   icon={<CheckOutlined />}
//                   onClick={() => saveEdit(index)}
//                   style={{ color: "#52c41a" }}
//                   title="Save"
//                 />
//                 <Button
//                   type="text"
//                   size="small"
//                   icon={<CloseOutlined />}
//                   onClick={cancelEdit}
//                   style={{ color: "#ff4d4f" }}
//                   title="Cancel"
//                 />
//               </Space>
//             </div>
//           );
//         }

//         // Display mode - show with edit button
//         return (
//           <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//             <div style={{ flex: 1 }}>
//               {text ? (
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 8,
//                     cursor: "pointer",
//                     padding: "8px 12px",
//                     backgroundColor: "#fafafa",
//                     borderRadius: 4,
//                     border: "1px solid #f0f0f0",
//                     transition: "all 0.2s",
//                     minHeight: "32px",
//                   }}
//                   onClick={() => startEditing(index, text)}
//                   onMouseEnter={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#e6f7ff")
//                   }
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.backgroundColor = "#fafafa")
//                   }
//                 >
//                   <Text style={{ flex: 1 }}>{text}</Text>
//                 </div>
//               ) : (
//                 <Select
//                   value={text}
//                   onChange={(val) => updateRow(index, "type", val)}
//                   placeholder="Select facility type"
//                   style={{ width: "100%" }}
//                   size="middle"
//                   showSearch
//                   allowClear
//                   filterOption={false}
//                   onSearch={(value) => setSearchTerm(value)}
//                   dropdownRender={(menu) => (
//                     <div>
//                       <div style={{ padding: 8 }}>
//                         <Input
//                           placeholder="Search facility types..."
//                           prefix={<SearchOutlined />}
//                           value={searchTerm}
//                           onChange={(e) => setSearchTerm(e.target.value)}
//                           allowClear
//                           size="middle"
//                           style={{ marginBottom: 8 }}
//                         />
//                       </div>
//                       <div
//                         style={{
//                           maxHeight: 300,
//                           overflowY: "auto",
//                           borderTop: "1px solid #f0f0f0",
//                         }}
//                       >
//                         {menu}
//                       </div>
//                       <div
//                         style={{
//                           padding: 8,
//                           borderTop: "1px solid #f0f0f0",
//                           backgroundColor: "#fafafa",
//                         }}
//                       >
//                         <Button
//                           type="text"
//                           block
//                           onClick={() => startEditing(index, text)}
//                           style={{ textAlign: "left" }}
//                         >
//                           Add Custom Facility
//                         </Button>
//                       </div>
//                     </div>
//                   )}
//                 >
//                   {filteredFacilityTypes.length > 0 ? (
//                     filteredFacilityTypes.map((type) => (
//                       <Option key={type} value={type}>
//                         <div style={{ padding: "4px 0", fontSize: 14 }}>
//                           {type}
//                         </div>
//                       </Option>
//                     ))
//                   ) : (
//                     <Option disabled>
//                       <div
//                         style={{
//                           padding: "4px 0",
//                           fontSize: 14,
//                           color: "#999",
//                           textAlign: "center",
//                         }}
//                       >
//                         No matching facility types
//                       </div>
//                     </Option>
//                   )}
//                 </Select>
//               )}
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       title: "Sanctioned Limit (KES '000)",
//       dataIndex: "sanctioned",
//       key: "sanctioned",
//       align: "right",
//       width: 180,
//       render: (value, record, index) => {
//         // Check if this is the subtotal row
//         if (record.isSubtotal) {
//           return (
//             <div
//               style={{
//                 textAlign: "right",
//                 fontWeight: "bold",
//                 color: PRIMARY_BLUE,
//               }}
//             >
//               {subtotals.sanctioned.toLocaleString()}
//             </div>
//           );
//         }

//         return (
//           <InputNumber
//             value={value}
//             onChange={(val) => updateRow(index, "sanctioned", val)}
//             style={{ width: "100%" }}
//             size="middle"
//             min={0}
//             step={1000}
//             precision={0}
//             placeholder="0"
//             formatter={(value) =>
//               `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//             }
//           />
//         );
//       },
//     },
//     {
//       title: "Balance (KES '000)",
//       dataIndex: "balance",
//       key: "balance",
//       align: "right",
//       width: 180,
//       render: (value, record, index) => {
//         // Check if this is the subtotal row
//         if (record.isSubtotal) {
//           return (
//             <div
//               style={{
//                 textAlign: "right",
//                 fontWeight: "bold",
//                 color: "#fa8c16",
//               }}
//             >
//               {subtotals.balance.toLocaleString()}
//             </div>
//           );
//         }

//         return (
//           <InputNumber
//             value={value}
//             onChange={(val) => updateRow(index, "balance", val)}
//             style={{ width: "100%" }}
//             size="middle"
//             min={0}
//             step={1000}
//             precision={0}
//             placeholder="0"
//             formatter={(value) =>
//               `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//             }
//           />
//         );
//       },
//     },
//     {
//       title: "Headroom (KES '000)",
//       dataIndex: "headroom",
//       key: "headroom",
//       align: "right",
//       width: 160,
//       render: (value, record) => {
//         // Check if this is the subtotal row
//         if (record.isSubtotal) {
//           return (
//             <Tag
//               color={
//                 subtotals.headroom < 0
//                   ? "red"
//                   : subtotals.headroom === 0
//                   ? "orange"
//                   : "green"
//               }
//               style={{
//                 fontWeight: "bold",
//                 fontSize: "13px",
//                 padding: "4px 12px",
//                 borderRadius: "12px",
//               }}
//             >
//               {subtotals.headroom.toLocaleString()}
//             </Tag>
//           );
//         }

//         return (
//           <Tag
//             color={value < 0 ? "red" : value === 0 ? "orange" : "green"}
//             style={{
//               fontWeight: "bold",
//               fontSize: "13px",
//               padding: "4px 12px",
//               borderRadius: "12px",
//             }}
//           >
//             {value.toLocaleString()}
//           </Tag>
//         );
//       },
//     },
//     {
//       title: "Action",
//       key: "action",
//       align: "center",
//       width: 80,
//       render: (_, record, index) => {
//         // Don't show delete button for subtotal row
//         if (record.isSubtotal) {
//           return null;
//         }

//         return (
//           <Button
//             type="text"
//             danger
//             icon={<CloseOutlined />}
//             onClick={() => removeRow(index)}
//             size="small"
//             title="Delete row"
//           />
//         );
//       },
//     },
//   ];

//   // Prepare data for the table
//   const tableData = [
//     // Add all facility rows
//     ...facilities.map((facility, index) => ({
//       key: index,
//       ...facility,
//     })),

//     // Add subtotal row
//     {
//       key: "subtotal",
//       type: "Sub-Total",
//       sanctioned: subtotals.sanctioned,
//       balance: subtotals.balance,
//       headroom: subtotals.headroom,
//       isSubtotal: true,
//     },
//   ];

//   // Custom table components for styling
//   const tableComponents = {
//     header: {
//       cell: (props) => (
//         <th
//           {...props}
//           style={{
//             backgroundColor: HEADER_BLUE,
//             color: "white",
//             fontWeight: 600,
//             fontSize: "14px",
//             padding: "12px 16px",
//             borderBottom: "2px solid #d9d9d9",
//           }}
//         />
//       ),
//     },
//   };

//   return (
//     <div
//       style={{
//         backgroundColor: "white",
//         padding: 16,
//         borderRadius: 8,
//         boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//         marginTop: 16,
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 16,
//         }}
//       >
//         <div
//           style={{
//             fontWeight: 600,
//             fontSize: 16,
//             color: PRIMARY_BLUE,
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//           }}
//         >
//           <div
//             style={{
//               width: 4,
//               height: 20,
//               borderRadius: 2,
//             }}
//           />
//         </div>
//         <Button
//           type="primary"
//           onClick={addRow}
//           style={{
//             backgroundColor: PRIMARY_PURPLE,
//             borderColor: PRIMARY_PURPLE,
//           }}
//         >
//           + Add Row
//         </Button>
//       </div>

//       <div style={{ overflowX: "auto" }}>
//         <Table
//           columns={columns}
//           dataSource={tableData}
//           pagination={false}
//           size="middle"
//           scroll={{ x: "max-content" }}
//           rowClassName={(record) => {
//             if (record.isSubtotal) {
//               return "facility-subtotal-row";
//             }
//             return "facility-data-row";
//           }}
//           style={{
//             border: "1px solid #f0f0f0",
//             borderRadius: 8,
//             overflow: "hidden",
//           }}
//           components={tableComponents}
//         />
//       </div>

//       {/* Add CSS for row styling */}
//       <style jsx>{`
//         :global(.facility-data-row:hover > td) {
//           background-color: #fafafa !important;
//         }
//         :global(.facility-subtotal-row) {
//           background-color: #e6f7ff !important;
//           border-top: 2px solid #1890ff !important;
//           font-weight: bold !important;
//         }
//         :global(.facility-subtotal-row:hover > td) {
//           background-color: #e6f7ff !important;
//         }
//         :global(.ant-table-tbody > tr:not(.facility-subtotal-row) > td) {
//           border-bottom: 1px solid #f0f0f0;
//         }
//         :global(.ant-table-tbody > tr:last-child > td) {
//           border-bottom: none !important;
//         }
//         :global(.ant-select-dropdown) {
//           padding: 0 !important;
//         }
//       `}</style>
//     </div>
//   );
// }
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
import "../../styles/creatorDesignSystem.css";
import "../../styles/deferralFormGlobalStyles.css";

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

    // Recalculate headroom whenever sanctioned or balance changes
    if (field === "sanctioned" || field === "balance") {
      temp[index].headroom = temp[index].sanctioned - temp[index].balance;
    }

    setFacilities(temp);
  };

  const removeRow = (index) => {
    // Allow deletion of all rows - no restrictions
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

  // Calculate subtotals
  const subtotals = facilities.reduce(
    (acc, f) => {
      acc.sanctioned += Number(f.sanctioned) || 0;
      acc.balance += Number(f.balance) || 0;
      acc.headroom += Number(f.headroom) || 0;
      return acc;
    },
    { sanctioned: 0, balance: 0, headroom: 0 },
  );

  // Filter facility types based on search
  const filteredFacilityTypes = FACILITY_TYPES.filter((type) =>
    type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Define columns for Ant Design Table
  const columns = [
    {
      title: "Facility Type",
      dataIndex: "type",
      key: "type",
      width: 250,
      render: (text, record, index) => {
        // Check if this is the subtotal row
        if (record.isSubtotal) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text className="form-body-text" style={{ color: "var(--color-text-dark)" }}>
                Sub-Total
              </Text>
            </div>
          );
        }

        // Check if this row is in edit mode
        if (editingIndex === index) {
          return (
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                className="facility-table-edit-input"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onPressEnter={() => saveEdit(index)}
                autoFocus
                style={{ flex: 1 }}
                size="middle"
                placeholder="Enter facility type"
              />
              <Space>
                <Button
                  type="text"
                  size="small"
                  className="facility-table-icon-btn facility-table-icon-btn--success"
                  icon={<CheckOutlined />}
                  onClick={() => saveEdit(index)}
                  title="Save"
                />
                <Button
                  type="text"
                  size="small"
                  className="facility-table-icon-btn facility-table-icon-btn--danger"
                  icon={<CloseOutlined />}
                  onClick={cancelEdit}
                  title="Cancel"
                />
              </Space>
            </div>
          );
        }

        // Display mode - show with edit button
        return (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              {text ? (
                <div
                  className="facility-table-type-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: 4,
                    transition: "all 0.2s",
                    minHeight: "32px",
                  }}
                  onClick={() => startEditing(index, text)}
                >
                  <Text style={{ flex: 1 }}>{text}</Text>
                </div>
              ) : (
                <Select
                  className="facility-table-select"
                  value={text}
                  onChange={(val) => updateRow(index, "type", val)}
                  placeholder="Select facility type"
                  style={{ width: "100%" }}
                  size="middle"
                  showSearch
                  allowClear
                  filterOption={false}
                  onSearch={(value) => setSearchTerm(value)}
                  dropdownRender={(menu) => (
                    <div>
                      <div style={{ padding: 8 }}>
                        <Input
                          className="facility-table-search-input"
                          placeholder="Search facility types..."
                          prefix={<SearchOutlined />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          allowClear
                          size="middle"
                          style={{ marginBottom: 8 }}
                        />
                      </div>
                      <div
                        style={{
                          maxHeight: 300,
                          overflowY: "auto",
                          borderTop: "1px solid #f0f0f0",
                        }}
                      >
                        {menu}
                      </div>
                      <div
                        style={{
                          padding: 8,
                          borderTop: "1px solid #f0f0f0",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <Button
                          type="text"
                          block
                          className="facility-table-custom-btn"
                          onClick={() => startEditing(index, text)}
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
                        <div style={{ padding: "4px 0", fontSize: 14 }}>
                          {type}
                        </div>
                      </Option>
                    ))
                  ) : (
                    <Option disabled>
                      <div
                        style={{
                          padding: "4px 0",
                          fontSize: 14,
                          color: "#999",
                          textAlign: "center",
                        }}
                      >
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
      width: 180,
      render: (value, record, index) => {
        // Check if this is the subtotal row
        if (record.isSubtotal) {
          return (
            <div
              className="form-body-text"
              style={{
                textAlign: "right",
                color: "var(--color-text-dark)",
              }}
            >
              {subtotals.sanctioned.toLocaleString()}
            </div>
          );
        }

        return (
          <InputNumber
            value={value}
            onChange={(val) => updateRow(index, "sanctioned", val)}
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
      width: 180,
      render: (value, record, index) => {
        // Check if this is the subtotal row
        if (record.isSubtotal) {
          return (
            <div
              className="form-body-text"
              style={{
                textAlign: "right",
                color: "var(--color-accent)",
              }}
            >
              {subtotals.balance.toLocaleString()}
            </div>
          );
        }

        return (
          <InputNumber
            value={value}
            onChange={(val) => updateRow(index, "balance", val)}
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
        // Check if this is the subtotal row
        if (record.isSubtotal) {
          return (
            <Tag
              className="facility-table-headroom-tag"
              color={
                subtotals.headroom < 0
                  ? "red"
                  : subtotals.headroom === 0
                    ? "orange"
                    : "green"
              }
              style={{
                fontSize: "13px",
                padding: "4px 12px",
                borderRadius: "12px",
              }}
            >
              {subtotals.headroom.toLocaleString()}
            </Tag>
          );
        }

        return (
          <Tag
            className="facility-table-headroom-tag"
            color={value < 0 ? "red" : value === 0 ? "orange" : "green"}
            style={{
              fontSize: "13px",
              padding: "4px 12px",
              borderRadius: "12px",
            }}
          >
            {value.toLocaleString()}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 80,
      render: (_, record, index) => {
        // Don't show delete button for subtotal row
        if (record.isSubtotal) {
          return null;
        }

        return (
          <Button
            type="text"
            className="facility-table-icon-btn facility-table-icon-btn--danger"
            icon={<CloseOutlined />}
            onClick={() => removeRow(index)}
            size="small"
            title="Delete row"
          />
        );
      },
    },
  ];

  // Prepare data for the table
  const tableData = [
    // Add all facility rows
    ...facilities.map((facility, index) => ({
      key: index,
      ...facility,
    })),

    // Add subtotal row
    {
      key: "subtotal",
      type: "Sub-Total",
      sanctioned: subtotals.sanctioned,
      balance: subtotals.balance,
      headroom: subtotals.headroom,
      isSubtotal: true,
    },
  ];

  // Custom table components for styling
  const tableComponents = {
    header: {
      cell: (props) => (
        <th
          {...props}
          style={{
            backgroundColor: "#ffffff",
            color: "var(--color-text-dark)",
            fontWeight: 500,
            fontSize: "13px",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(214, 189, 152, 0.2)",
          }}
        />
      ),
    },
  };

  return (
    <div className="facility-table-shell">
      <style>{`
        .facility-table-shell {
          background: var(--color-white);
          padding: 16px;
          border-radius: 10px;
          border: 1px solid rgba(214, 189, 152, 0.16);
          box-shadow: none;
          margin-top: 8px;
        }
        .facility-table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .facility-table-title {
          color: var(--color-text-medium);
          font-size: 13px;
          font-weight: 600;
        }
        .facility-table-add-btn.ant-btn {
          border: none !important;
          border-radius: 8px !important;
          background: var(--ncb-primary-500) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(26, 54, 54, 0.12) !important;
        }
        .facility-table-table {
          border: 1px solid rgba(214, 189, 152, 0.16);
          border-radius: 10px;
          overflow: hidden;
        }
        .facility-table-shell .ant-input,
        .facility-table-shell .ant-input-number,
        .facility-table-shell .ant-select-selector {
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 8px !important;
          box-shadow: none !important;
        }
        .facility-table-shell .ant-input:hover,
        .facility-table-shell .ant-input:focus,
        .facility-table-shell .ant-input-number:hover,
        .facility-table-shell .ant-input-number-focused,
        .facility-table-shell .ant-select-focused .ant-select-selector,
        .facility-table-shell .ant-select-selector:hover {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .facility-table-type-pill {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.16);
        }
        .facility-table-type-pill:hover {
          background: rgba(245, 247, 244, 0.9);
          border-color: rgba(214, 189, 152, 0.3);
        }
        .facility-table-custom-btn.ant-btn {
          text-align: left;
          color: var(--color-text-medium) !important;
        }
        .facility-table-icon-btn.ant-btn {
          border-radius: 6px !important;
        }
        .facility-table-icon-btn--success.ant-btn {
          color: #15803d !important;
        }
        .facility-table-icon-btn--danger.ant-btn {
          color: #dc2626 !important;
        }
        .facility-data-row:hover > td {
          background-color: rgba(245, 247, 244, 0.9) !important;
        }
        .facility-subtotal-row > td {
          background-color: var(--color-white) !important;
          border-top: 1px solid rgba(214, 189, 152, 0.25) !important;
          font-weight: 600 !important;
        }
        .facility-subtotal-row:hover > td {
          background-color: var(--color-white) !important;
        }
        .facility-table-shell .ant-table-tbody > tr:not(.facility-subtotal-row) > td {
          border-bottom: 1px solid rgba(214, 189, 152, 0.12);
        }
        .facility-table-shell .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
      `}</style>
      <div
        className="facility-table-toolbar"
      >
        <div className="facility-table-title">Track facilities tied to this request</div>
        <Button
          onClick={addRow}
          className="facility-table-add-btn"
          icon={<PlusOutlined />}
        >
          Add Row
        </Button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="middle"
          scroll={{ x: "max-content" }}
          rowClassName={(record) => {
            if (record.isSubtotal) {
              return "facility-subtotal-row";
            }
            return "facility-data-row";
          }}
          className="facility-table-table"
          components={tableComponents}
        />
      </div>
    </div>
  );
}
