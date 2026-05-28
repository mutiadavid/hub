import React, { useMemo, useState } from "react";
import { AutoComplete, Input, Select } from "antd";
import { useSearchCustomersQuery } from "../../api/customerApi";
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

  setCustomerBranchName,
  setClassification,
  setBusinessSegment,
  setBusinessSegmentDesc,
  setSubSegment,
  setSubSegmentDesc,
  setCustType,

  loanType,
  loanTypes,
  handleLoanTypeChange,
  selectedMultipleLoanTypes,
  setSelectedMultipleLoanTypes,
}) => {
  // Only query the DataWarehouse once the user has typed ≥ 3 characters.
  // This avoids hammering the external gateway on every single keystroke.
  const dwQuery = String(customerNumber || "").trim();
  const shouldSearch = dwQuery.length >= 3;

  const { data: dwCustomers = [], isFetching } = useSearchCustomersQuery(
    dwQuery,
    { skip: !shouldSearch }
  );

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

  /* ---------------- CUSTOMER OPTIONS (from DataWarehouse) ---------------- */
  const customerOptions = dwCustomers.map((cust) => ({
    label: cust.customerNumber,
    value: cust.customerNumber,
    id: cust.customerNumber,       // DW has no Mongo _id; use customerNumber as key
    name: cust.customerName ?? cust.name ?? "",
    email: cust.email ?? cust.custEmailId ?? "",
    customerBranchName: cust.customerBranchName,
    classification: cust.classification,
    businessSegment: cust.businessSegment,
    businessSegmentDesc: cust.businessSegmentDesc,
    subSegment: cust.subSegment,
    subSegmentDesc: cust.subSegmentDesc,
    custType: cust.custType,
  }));

  const limitedCustomerOptions = useMemo(() => {
    // The DW already filters by customerNumber server-side;
    // just cap the dropdown list to avoid a huge menu.
    return customerOptions.slice(0, 8);
  }, [customerOptions]);

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
    setCustomerBranchName(option.customerBranchName || "");
    setClassification(option.classification || "");
    setBusinessSegment(option.businessSegment || "");
    setBusinessSegmentDesc(option.businessSegmentDesc || "");
    setSubSegment(option.subSegment || "");
    setSubSegmentDesc(option.subSegmentDesc || "");
    setCustType(option.custType || "");
  };


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
          font-size: 13px !important;
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
        .creator-create-card .creator-caption {
          font-size: 11px;
          font-weight: 700;
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

          // When the user clears the field, reset every auto-populated field
          if (!val) {
            setCustomerId("");
            setCustomerName("");
            setCustomerEmail("");
            setCustomerBranchName("");
            setClassification("");
            setBusinessSegment("");
            setBusinessSegmentDesc("");
            setSubSegment("");
            setSubSegmentDesc("");
            setCustType("");
          }
        }}
        filterOption={false}
      >
        <Input
          suffix={
            isFetching && shouldSearch
              ? <span style={{ fontSize: 11, color: "#aaa" }}>Searching…</span>
              : null
          }
        />
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
