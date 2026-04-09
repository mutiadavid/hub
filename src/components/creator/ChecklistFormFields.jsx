// export default ChecklistFormFields;
import React, { useMemo, useState } from "react";
import { AutoComplete, Input, Select } from "antd";
import { useGetCustomersQuery } from "../../api/userApi";
import "../../styles/creatorDesignSystem.css";

const ChecklistFormFields = ({
  rms,
  assignedToRM,
  setAssignedToRM,

  setCustomerId,

  customerName,
  setCustomerName,

  customerNumber,
  setCustomerNumber,

  customerEmail,
  setCustomerEmail,

  loanType,
  loanTypes,
  handleLoanTypeChange,
  selectedMultipleLoanTypes,
  setSelectedMultipleLoanTypes,
}) => {
  const { data: customers = [], isLoading } = useGetCustomersQuery();

  // Filter out "Multiple Loan Type" from the options list for the multi-select
  const actualLoanTypes = loanTypes.filter(t => t !== "Multiple Loan Type");

  /* ---------------- RM OPTIONS ---------------- */
  const rmOptions = rms?.map((rm) => ({
    label: rm.name,
    value: rm.name,
    id: rm._id,
  }));

  const selectedRMName = rms?.find((rm) => rm._id === assignedToRM)?.name || "";

  const [rmSearchText, setRmSearchText] = useState(selectedRMName);

  /* ---------------- CUSTOMER OPTIONS ---------------- */
  const customerOptions = customers?.map((cust) => ({
    label: cust.customerNumber,
    value: cust.customerNumber,
    id: cust._id,
    name: cust.name,
    email: cust.email,
  }));

  const limitedCustomerOptions = useMemo(() => {
    const query = String(customerNumber || "").trim().toLowerCase();
    const baseOptions = customerOptions || [];

    if (!query) {
      return baseOptions.slice(0, 4);
    }

    return baseOptions
      .filter((option) => {
        const value = String(option.value || "").toLowerCase();
        const label = String(option.label || "").toLowerCase();
        const name = String(option.name || "").toLowerCase();
        return value.includes(query) || label.includes(query) || name.includes(query);
      })
      .slice(0, 4);
  }, [customerNumber, customerOptions]);

  const limitedRmOptions = useMemo(() => {
    const query = String(rmSearchText || "").trim().toLowerCase();
    const baseOptions = rmOptions || [];

    if (!query) {
      return baseOptions.slice(0, 4);
    }

    return baseOptions
      .filter((option) => String(option.value || "").toLowerCase().includes(query))
      .slice(0, 4);
  }, [rmOptions, rmSearchText]);

  const handleRMSelect = (value, option) => {
    setAssignedToRM(option.id);
    setRmSearchText(option.value || value || "");
  };

  const handleCustomerSelect = (value, option) => {
    setCustomerId(option.id);
    setCustomerNumber(option.value); // Number selected
    setCustomerName(option.name); // Auto populate
    setCustomerEmail(option.email); // Auto populate
  };

  if (isLoading) return <h1>Loading customers...</h1>;
  console.log("RMs:", customers);

  return (
    <div className="creator-create-card creator-create-card--details">
      <style>{`
        .creator-create-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 16px;
        }
        .creator-create-card--details .ant-input,
        .creator-create-card--details .ant-input-affix-wrapper,
        .creator-create-card--details .ant-select .ant-select-selector,
        .creator-create-card--details .ant-select-multiple .ant-select-selector,
        .creator-create-card--details .ant-select-auto-complete .ant-select-selector {
          min-height: 40px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
          background: var(--color-white) !important;
        }
        .creator-create-card--details .ant-input:hover,
        .creator-create-card--details .ant-input:focus,
        .creator-create-card--details .ant-input-affix-wrapper:hover,
        .creator-create-card--details .ant-input-affix-wrapper-focused,
        .creator-create-card--details .ant-select-focused .ant-select-selector,
        .creator-create-card--details .ant-select:hover .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
        }
        .creator-create-card--details .ant-input,
        .creator-create-card--details .ant-select-selection-item,
        .creator-create-card--details .ant-select-selection-placeholder,
        .creator-create-card--details .ant-input::placeholder {
          color: var(--color-text-medium) !important;
          font-size: 12px !important;
        }
        .creator-create-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .creator-create-label {
          display: block;
          margin-bottom: 6px;
          color: var(--color-text-medium);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 1023px) {
          .creator-create-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="creator-caption" style={{ marginBottom: 14 }}>Checklist Details</div>

      {/* ---------------- CUSTOMER NUMBER SELECTOR ---------------- */}
      <label className="creator-create-label">Customer Number</label>
      <AutoComplete
        style={{ width: "100%", marginBottom: 18 }}
        placeholder="Select Customer Number..."
        value={customerNumber}
        options={limitedCustomerOptions}
        onSelect={handleCustomerSelect}
        onChange={(val) => {
          setCustomerNumber(val);

          if (!val) {
            setCustomerId("");
            setCustomerName("");
            setCustomerEmail("");
          }
        }}
        filterOption={false}
      >
        <Input />
      </AutoComplete>

      {/* ---------------- AUTO-FILLED FIELDS ---------------- */}
      <div className="creator-create-grid">
        <Input placeholder="Customer Name" value={customerName} disabled />
        <Input placeholder="Customer Number" value={customerNumber} disabled />
        <Input placeholder="Customer Email" value={customerEmail} disabled />
      </div>

      {/* ---------------- RM SELECTOR ---------------- */}
      <label className="creator-create-label">Assigned RM</label>
      <AutoComplete
        style={{ width: "100%", marginBottom: 18 }}
        placeholder="Search RM..."
        value={rmSearchText || selectedRMName}
        options={limitedRmOptions}
        onSelect={handleRMSelect}
        onChange={(val) => {
          setRmSearchText(val);

          if (!val) {
            setAssignedToRM("");
          }
        }}
        filterOption={false}
      >
        <Input />
      </AutoComplete>

      {/* ---------------- LOAN TYPE SELECTOR ---------------- */}
      <label className="creator-create-label">Loan Type</label>
      <AutoComplete
        style={{ width: "100%", marginBottom: 18 }}
        placeholder="Select Loan Type"
        value={loanType}
        options={loanTypes.map((t) => ({ label: t, value: t }))}
        onSelect={(val) => {
          handleLoanTypeChange(val);
        }}
      >
        <Input />
      </AutoComplete>

      {/* ---------------- MULTIPLE LOAN TYPES SELECTOR (Conditional) ---------------- */}
      {loanType === "Multiple Loan Type" && (
        <div style={{ marginBottom: 0 }}>
          <label className="creator-create-label">
            Select Actual Loan Types (Multiple)
          </label>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select one or more loan types..."
            value={selectedMultipleLoanTypes}
            onChange={(values) => setSelectedMultipleLoanTypes(values)}
            options={actualLoanTypes.map(t => ({ label: t, value: t }))}
          />
          <p className="creator-helper-text" style={{ marginTop: 8 }}>
            Documents from all selected types will be combined into one DCL.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChecklistFormFields;
