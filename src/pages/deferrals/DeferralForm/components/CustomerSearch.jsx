import React from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  Typography,
  Row,
  Col,
  Divider,
} from "antd";
import { BankOutlined, SearchOutlined } from "@ant-design/icons";
import { LOAN_TYPE_OPTIONS, SEARCH_MODE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const { Title } = Typography;
const { Option } = Select;

export default function CustomerSearch({
  searchMode,
  setSearchMode,
  searchCustomerNumber,
  setSearchCustomerNumber,
  searchLoanType,
  setSearchLoanType,
  searchDclNumber,
  setSearchDclNumber,
  customerSearchResults,
  dclSearchResults,
  showSearchForm,
  setShowSearchForm,
  onFetchCustomer,
  onSelectCustomer,
  onSelectDcl,
  isFetching,
  onBack,
}) {
  return (
    <div className="creator-theme" style={{ padding: 24, minHeight: "100%", background: "var(--color-bg)" }}>
      <style>{`
        .deferral-search-page {
          max-width: 760px;
          margin: 32px auto;
        }
        .deferral-search-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 12px;
          box-shadow: 0 16px 34px rgba(26, 54, 54, 0.08);
          overflow: hidden;
        }
        .deferral-search-card .ant-card-body {
          padding: 0;
        }
        .deferral-search-hero {
          padding: 40px 32px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          border-top: 4px solid var(--color-accent);
          background:
            radial-gradient(circle at top center, rgba(214, 189, 152, 0.18), transparent 32%),
            linear-gradient(180deg, rgba(245, 247, 244, 0.72) 0%, rgba(255, 255, 255, 0.96) 100%);
        }
        .deferral-search-icon {
          font-size: 62px;
          color: var(--color-primary-dark);
        }
        .deferral-search-title {
          margin: 0 !important;
          color: var(--color-text-dark) !important;
          font-size: 20px !important;
          font-weight: 700 !important;
          letter-spacing: -0.03em;
        }
        .deferral-search-subtitle {
          display: block;
          color: var(--color-text-light) !important;
          font-size: 14px;
          max-width: 520px;
        }
        .deferral-search-body {
          padding: 0 28px 28px;
        }
        .deferral-search-divider.ant-divider {
          margin: 0 0 28px !important;
          border-color: rgba(214, 189, 152, 0.2) !important;
        }
        .deferral-search-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .deferral-search-trigger.ant-btn,
        .deferral-search-primary.ant-btn {
          min-width: 220px;
          height: 48px;
          font-size: 15px;
          padding: 0 24px !important;
        }
        .deferral-search-tab.ant-btn {
          min-width: 240px;
          height: 44px;
        }
        .deferral-search-form {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .deferral-search-form .ant-form-item {
          margin-bottom: 22px;
        }
        .deferral-search-form .ant-form-item-label > label {
          color: var(--color-text-dark) !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }
        .deferral-search-form .ant-form-item-required::before {
          color: #dc2626 !important;
        }
        .deferral-search-input.ant-input,
        .deferral-search-select .ant-select-selector {
          min-height: 46px !important;
          padding: 10px 14px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 8px !important;
          background: var(--color-white) !important;
          box-shadow: none !important;
          font-size: 14px !important;
          color: var(--color-text-dark) !important;
        }
        .deferral-search-input.ant-input:focus,
        .deferral-search-input.ant-input:hover,
        .deferral-search-select.ant-select-focused .ant-select-selector,
        .deferral-search-select:hover .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .deferral-search-dropdown {
          position: absolute;
          top: 50px;
          left: 0;
          right: 0;
          z-index: 1200;
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          box-shadow: 0 12px 24px rgba(26, 54, 54, 0.08);
          max-height: 240px;
          overflow-y: auto;
          border-radius: 8px;
        }
        .deferral-search-option {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.12);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: background 150ms ease;
        }
        .deferral-search-option:hover {
          background: rgba(214, 189, 152, 0.08);
        }
        .deferral-search-option:last-child {
          border-bottom: none;
        }
        .deferral-search-option-title {
          font-weight: 600;
          color: var(--color-text-dark);
        }
        .deferral-search-option-meta,
        .deferral-search-tip {
          font-size: 12px;
          color: var(--color-text-light);
        }
        .deferral-search-footer {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }
        .deferral-search-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .deferral-search-secondary.ant-btn,
        .deferral-search-back.ant-btn {
          height: 44px;
          padding: 0 18px !important;
        }
        .deferral-search-primary.ant-btn {
          height: 44px;
          padding: 0 18px !important;
        }
        @media (max-width: 767px) {
          .deferral-search-page {
            margin: 12px auto;
          }
          .deferral-search-hero,
          .deferral-search-body {
            padding-left: 18px;
            padding-right: 18px;
          }
          .deferral-search-actions,
          .deferral-search-form-actions,
          .deferral-search-footer {
            justify-content: stretch;
          }
          .deferral-search-trigger.ant-btn,
          .deferral-search-tab.ant-btn,
          .deferral-search-primary.ant-btn,
          .deferral-search-secondary.ant-btn,
          .deferral-search-back.ant-btn {
            width: 100%;
          }
          .deferral-search-option {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
      <div className="deferral-search-page">
      <Card
        className="deferral-search-card"
        style={{ minHeight: showSearchForm ? "auto" : "450px" }}
      >
        <div className="deferral-search-hero">
        <BankOutlined
          className="deferral-search-icon"
        />

        <Title level={3} className="deferral-search-title">
          Start New Deferral Request
        </Title>

        <Typography.Text
          className="deferral-search-subtitle"
        >
          Please search for a customer to begin the deferral request process
        </Typography.Text>
        </div>

        <div className="deferral-search-body">
          {showSearchForm ? (
            <>
            <Divider className="deferral-search-divider" />

            {/* Search Mode Tabs */}
            <div className="deferral-search-actions" style={{ marginBottom: 24 }}>
              <Button
                className={`deferral-search-tab ${searchMode === SEARCH_MODE.CUSTOMER ? "deferral-search-tab--active" : ""}`}
                onClick={() => {
                  setSearchMode(SEARCH_MODE.CUSTOMER);
                  setSearchDclNumber("");
                }}
              >
                Search by Customer Number
              </Button>
              <Button
                className={`deferral-search-tab ${searchMode === SEARCH_MODE.DCL ? "deferral-search-tab--active" : ""}`}
                onClick={() => {
                  setSearchMode(SEARCH_MODE.DCL);
                  setSearchCustomerNumber("");
                  setSearchLoanType("");
                }}
              >
                Search by DCL Number
              </Button>
            </div>

            <div className="deferral-search-form">
              {searchMode === SEARCH_MODE.CUSTOMER ? (
                <Form layout="vertical" onFinish={onFetchCustomer}>
                  <Form.Item
                    label="Customer Number"
                    name="customerNumber"
                    rules={[
                      {
                        required: true,
                        message: "Please enter customer number",
                      },
                    ]}
                  >
                    <div style={{ position: "relative" }}>
                      <Input
                        className="deferral-search-input"
                        type="text"
                        size="large"
                        value={searchCustomerNumber}
                        onChange={(e) =>
                          setSearchCustomerNumber(
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="e.g. 123456"
                        autoFocus
                      />

                      {/* Typeahead suggestions */}
                      {customerSearchResults &&
                        customerSearchResults.length > 0 && (
                          <div className="deferral-search-dropdown">
                            {customerSearchResults.map((c) => (
                              <div
                                key={c._id}
                                onClick={() => onSelectCustomer(c)}
                                className="deferral-search-option"
                              >
                                <div>
                                  <div className="deferral-search-option-title">
                                    {c.name}
                                  </div>
                                  <div className="deferral-search-option-meta">
                                    {c.customerNumber}
                                  </div>
                                </div>
                                <div className="deferral-search-option-meta">
                                  {c.email}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </Form.Item>

                  <Form.Item
                    label="Loan Type"
                    name="loanType"
                    rules={[
                      { required: true, message: "Please select loan type" },
                    ]}
                  >
                    <Select
                      className="deferral-search-select"
                      size="large"
                      style={{ width: "100%" }}
                      value={searchLoanType}
                      onChange={setSearchLoanType}
                      placeholder="Select loan type"
                    >
                      {LOAN_TYPE_OPTIONS.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <div className="deferral-search-form-actions">
                    <Button
                      className="deferral-search-secondary"
                      onClick={() => setShowSearchForm(false)}
                      size="large"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="deferral-search-primary"
                      htmlType="submit"
                      loading={isFetching}
                      size="large"
                    >
                      {isFetching ? "Fetching..." : "Fetch Customer"}
                    </Button>
                  </div>
                </Form>
              ) : (
                <Form layout="vertical">
                  <Form.Item
                    label="DCL Number"
                    rules={[
                      { required: true, message: "Please enter DCL number" },
                    ]}
                  >
                    <div style={{ position: "relative" }}>
                      <Input
                        className="deferral-search-input"
                        type="text"
                        size="large"
                        value={searchDclNumber}
                        onChange={(e) => setSearchDclNumber(e.target.value)}
                        placeholder="e.g. DCL-26-0183"
                        autoFocus
                      />

                      {/* DCL Typeahead suggestions */}
                      {dclSearchResults && dclSearchResults.length > 0 && (
                        <div className="deferral-search-dropdown">
                          {dclSearchResults.map((dcl) => (
                            <div
                              key={dcl.id}
                              onClick={() => onSelectDcl(dcl)}
                              className="deferral-search-option"
                              style={{ flexDirection: "column", alignItems: "flex-start" }}
                            >
                              <div
                                className="deferral-search-option-title"
                              >
                                {dcl.dclNo}
                              </div>
                              <div className="deferral-search-option-meta">
                                {dcl.customerName} ({dcl.customerNumber})
                              </div>
                              <div className="deferral-search-option-meta">
                                Loan Type: {dcl.loanType}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Form.Item>

                  <Typography.Text
                    className="deferral-search-tip"
                    style={{ marginTop: 8, display: "block" }}
                  >
                    Tip: Start typing a DCL number to search. Customer details
                    will auto-populate when you select a DCL.
                  </Typography.Text>

                  <div className="deferral-search-form-actions">
                    <Button
                      className="deferral-search-secondary"
                      onClick={() => setShowSearchForm(false)}
                      size="large"
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              )}
            </div>
          </>
        ) : (
          <div className="deferral-search-actions">
          <Button
            className="deferral-search-trigger"
            size="large"
            icon={<SearchOutlined />}
            onClick={() => setShowSearchForm(true)}
            loading={isFetching}
          >
            {isFetching ? "Searching..." : "Search Customer"}
          </Button>
          </div>
        )}

        <div className="deferral-search-footer">
          <Button
            className="deferral-search-back"
            onClick={onBack}
          >
            ← Back to My Deferrals
          </Button>
        </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
