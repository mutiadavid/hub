import React from "react";

import { Select, Input, Space } from "antd"; 

const { Option } = Select;


const PRIMARY_BLUE = "#164679"; // Dark Blue/Navy
const ACCENT_LIME = "#b5d334";  // Lime/Light Green
const HIGHLIGHT_GOLD = "#fcb116"; // Gold / Yellow-orange
const SECONDARY_PURPLE = "#7e6496"; // Purple / Accent shade

/**
 * A visually enhanced component for Checklist Form Fields using Tailwind CSS
 * and the specified color palette. The internal structure (props usage and component
 * order) is strictly preserved from the user's original request.
 */
const ChecklistFormFields = ({
  rms, 
  customers, 
  assignedToRM,
  setAssignedToRM,
  customerId,
  setCustomerId,
  customerName,
  customerNumber,
  title,
  setTitle,
  loanType,
  loanTypes, 
  handleLoanTypeChange,
}) => {
  
  // A helper for Antd components to align with Tailwind's rounded-lg and ensure width
  // Note: We cannot use className directly on Antd components without wrappers, 
  // so we rely on 'style' and the custom Antd styling injection.
  const antStyle = { 
    width: "100%", 
    borderRadius: "0.5rem",
    marginBottom: "20px" // Added margin to match the spacing previously provided by Tailwind wrappers
  }; 
  
  // Custom Antd styling to override default colors for a better UX experience
  const customAntdStyle = `
    /* Custom styling for Ant Design elements to fit the color theme */
    .ant-select-selector, .ant-input {
      border-radius: 8px !important;
      border-color: #e5e7eb !important; /* Light gray border */
      padding: 0.5rem 0.75rem !important;
      height: 48px !important; /* Fixed height for consistency */
      font-size: 16px !important;
    }
    
    /* Focus state styling */
    .ant-select-focused:not(.ant-select-disabled) .ant-select-selector,
    .ant-input:focus, .ant-input-focused {
      border-color: ${ACCENT_LIME} !important;
      box-shadow: 0 0 0 2px rgba(181, 211, 52, 0.2) !important;
    }
    
    /* Disabled inputs */
    .ant-input-disabled, .ant-input[disabled] {
      background-color: #f3f4f6 !important; /* Lighter background for disabled fields */
      color: ${PRIMARY_BLUE} !important;
      cursor: not-allowed !important;
      opacity: 1;
    }

    /* Select Dropdown Item Highlight (using Gold/Yellow-orange for highlight) */
    .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
        background-color: #fcd716 !important; /* Light yellow background */
        font-weight: 600;
        color: ${PRIMARY_BLUE} !important;
    }
    
    /* Placeholder text style */
    .ant-select-selection-placeholder, .ant-input::placeholder {
      color: ${SECONDARY_PURPLE} !important;
      opacity: 0.7;
      font-style: italic;
    }
  `;

  return (
    // Outer container for superior structure: rounded corners, shadow, and mobile-friendly padding
    // We remove the internal Tailwind div wrappers and labels, and just apply styling to the Antd components themselves
    // and the outer wrapper, respecting the original minimal JSX structure.
    <div className={`p-6 md:p-8 bg-white shadow-2xl rounded-xl border-t-4 border-t-[${ACCENT_LIME}]`}>
      
      {/* Inject custom Antd styles */}
      <style>{customAntdStyle}</style>

      <h2 className={`text-2xl font-extrabold mb-8 text-[${PRIMARY_BLUE}]`}>
        New Checklist Setup
      </h2>
      
      {/* Select RM - LOGIC PRESERVED EXACTLY */}
      <Select
        placeholder="Assign RM"
        value={assignedToRM || undefined}
        onChange={setAssignedToRM}
        style={antStyle}
        showSearch
      >
        {rms?.map((rm) => ( // Using optional chaining to handle potentially undefined 'rms' without default props
          <Option key={rm._id} value={rm._id}>
            {rm.name}
          </Option>
        ))}
      </Select>

      {/* Select Customer - LOGIC PRESERVED EXACTLY */}
      <Select
        placeholder="Select Customer"
        value={customerId || undefined}
        onChange={setCustomerId}
        style={antStyle}
        showSearch
        filterOption={(input, option) =>
          option?.children?.toLowerCase().includes(input.toLowerCase())
        }
      >
        {customers?.map((c) => ( // Using optional chaining to handle potentially undefined 'customers' without default props
          <Option key={c._id} value={c._id}>
            {c.customerNumber} - {c.name}
          </Option>
        ))}
      </Select>

      {/* Auto-filled customer info - LOGIC PRESERVED EXACTLY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <Input placeholder="Customer Name" value={customerName} disabled style={{borderRadius: "0.5rem"}}/>
        <Input placeholder="Customer Number" value={customerNumber} disabled style={{borderRadius: "0.5rem"}}/>
      </div>


      {/* Title - LOGIC PRESERVED EXACTLY */}
      <Input
        placeholder="Checklist Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={antStyle}
      />

      {/* Loan Type - LOGIC PRESERVED EXACTLY */}
      <Select
        placeholder="Select Loan Type"
        value={loanType || undefined}
        onChange={handleLoanTypeChange}
        style={antStyle}
      >
        {loanTypes?.map((t) => ( // Using optional chaining to handle potentially undefined 'loanTypes' without default props
          <Option key={t} value={t}>
            {t}
          </Option>
        ))}
      </Select>
      
      <p className={`text-xs mt-6 text-center text-[${SECONDARY_PURPLE}]`}>
          All fields are mandatory to proceed.
      </p>
    </div>
  );
};

export default ChecklistFormFields;