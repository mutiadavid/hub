import React from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Upload,
  Button,
  Typography,
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import DocumentPicker from "../../../../components/deferrals/DocumentPicker";
import FacilityTable from "../../../../components/deferrals/FacilityTable";
import { renderDocumentItem } from "../utils/fileUtils";
import { WARNING_ORANGE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const { TextArea } = Input;
const { Option } = Select;

export default function DeferralDetails({
  loanAmount,
  setLoanAmount,
  selectedDocuments,
  setSelectedDocuments,
  perDocumentDays,
  handlePerDocumentDaysChange,
  deferralDescription,
  setDeferralDescription,
  facilities,
  setFacilities,
  dclNumber,
  setDclNumber,
  dclFile,
  additionalFiles,
  isSearchedByDcl,
  handleDCLUpload,
  handleAdditionalFileUpload,
  removeDCLFile,
  removeAdditionalFile,
}) {
  return (
    <>
      <style>{`
        .deferral-form-details.ant-card {
          margin-bottom: 20px;
          border-radius: 10px !important;
          border: 1px solid rgba(22, 70, 121, 0.24) !important;
          box-shadow: 0 4px 14px rgba(26, 54, 54, 0.08) !important;
          overflow: hidden;
        }
        .deferral-form-details .ant-card-head,
        .deferral-form-details .ant-card-small > .ant-card-head {
          background: var(--color-bg) !important;
          border-bottom: 1px solid rgba(22, 70, 121, 0.24) !important;
        }
        .deferral-form-details .ant-card-head-title {
          padding: 14px 0 !important;
        }
        .deferral-form-details .ant-card-body {
          padding: 16px !important;
        }
        .deferral-form-details .ant-typography,
        .deferral-form-details .ant-form-item-label > label {
          color: var(--color-text-dark);
        }
        .deferral-form-details .ant-select-selector,
        .deferral-form-details .ant-input,
        .deferral-form-details .ant-input-number,
        .deferral-form-details .ant-picker {
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 8px !important;
          background: var(--color-white) !important;
          box-shadow: none !important;
          min-height: 42px;
        }
        .deferral-form-details .deferral-form-loan-amount-select.ant-select .ant-select-selector {
          min-height: 42px !important;
          padding: 6px 12px !important;
          display: flex !important;
          align-items: center !important;
          border: 1px solid rgba(22, 70, 121, 0.42) !important;
          background: rgba(22, 70, 121, 0.06) !important;
          color: var(--color-text-dark) !important;
        }
        .deferral-form-details .deferral-form-loan-amount-select:hover .ant-select-selector,
        .deferral-form-details .deferral-form-loan-amount-select.ant-select-focused .ant-select-selector {
          border-color: rgba(22, 70, 121, 0.72) !important;
          background: rgba(22, 70, 121, 0.1) !important;
        }
        .deferral-form-details .deferral-form-loan-amount-select .ant-select-selection-item,
        .deferral-form-details .deferral-form-loan-amount-select .ant-select-selection-placeholder {
          color: var(--color-text-dark) !important;
          line-height: 28px !important;
        }
        .deferral-form-details .deferral-form-loan-amount-select .ant-select-selection-placeholder {
          color: var(--color-text-medium) !important;
        }
        .deferral-form-details .deferral-form-loan-amount-select .ant-select-arrow {
          color: var(--color-text-medium) !important;
        }
        .deferral-form-details .ant-picker.ant-picker-disabled {
          background: rgba(245, 247, 244, 0.96) !important;
          border-color: rgba(26, 54, 54, 0.22) !important;
          opacity: 1 !important;
        }
        .deferral-form-details .ant-picker.ant-picker-disabled .ant-picker-input > input,
        .deferral-form-details .ant-picker.ant-picker-disabled .ant-picker-input > input[disabled] {
          color: rgba(26, 54, 54, 0.78) !important;
          -webkit-text-fill-color: rgba(26, 54, 54, 0.78) !important;
          cursor: not-allowed !important;
        }
        .deferral-form-details .ant-picker.ant-picker-disabled .ant-picker-suffix,
        .deferral-form-details .ant-picker.ant-picker-disabled .ant-picker-clear {
          color: rgba(26, 54, 54, 0.58) !important;
        }
        .deferral-form-details .ant-select-selector:hover,
        .deferral-form-details .ant-input:hover,
        .deferral-form-details .ant-input:focus,
        .deferral-form-details .ant-input-number:hover,
        .deferral-form-details .ant-picker:hover,
        .deferral-form-details .ant-select-focused .ant-select-selector,
        .deferral-form-details .ant-picker-focused,
        .deferral-form-details .ant-input-number-focused {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .deferral-form-details .ant-input-affix-wrapper {
          border-radius: 8px !important;
        }
        .deferral-form-details .ant-upload .ant-btn,
        .deferral-form-details .deferral-form-upload-btn.ant-btn {
          border-radius: 8px !important;
          border: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .deferral-form-details .deferral-form-inline-card.ant-card {
          border: 1px solid rgba(22, 70, 121, 0.2) !important;
          box-shadow: 0 3px 10px rgba(26, 54, 54, 0.05) !important;
          border-radius: 10px !important;
          background: rgba(255, 255, 255, 0.92) !important;
        }
        .deferral-form-details .deferral-form-section-heading {
          color: #164679;
          font-size: 18px;
          font-weight: 700;
          font-family: inherit;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.3;
        }
        .deferral-form-details .deferral-form-divider-block {
          padding-top: 18px;
          border-top: 1px solid rgba(22, 70, 121, 0.16);
        }
        .deferral-form-details .deferral-form-subsection {
          display: flex;
          align-items: center;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(22, 70, 121, 0.16);
        }
        .deferral-form-details .deferral-form-subsection-title {
          color: #164679 !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          font-family: inherit !important;
          margin: 0 !important;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .deferral-form-details .deferral-form-inline-title {
          color: #164679 !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          font-family: inherit !important;
          display: block !important;
          margin-bottom: 12px !important;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .deferral-form-details .deferral-form-subtitle {
          color: #1f1f1f !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          font-family: inherit !important;
          display: block !important;
          margin-bottom: 10px !important;
          line-height: 1.35;
        }
        .deferral-form-details .deferral-form-table-header {
          padding: 10px 12px !important;
          border-top: 1px solid rgba(22, 70, 121, 0.14);
          border-bottom: 1px solid rgba(22, 70, 121, 0.2) !important;
          background: rgba(22, 70, 121, 0.035);
          border-radius: 8px;
          margin-bottom: 12px !important;
        }
        .deferral-form-details .deferral-form-days-row {
          padding: 10px 0 !important;
          border-bottom: 1px solid rgba(22, 70, 121, 0.1);
        }
        .deferral-form-details .deferral-form-days-row:last-child {
          border-bottom: none;
          padding-bottom: 0 !important;
        }
        .deferral-form-details .deferral-form-disabled-input.ant-input-affix-wrapper,
        .deferral-form-details .deferral-form-disabled-input.ant-input {
          background: rgba(245, 247, 244, 0.9) !important;
        }
      `}</style>
    <Card
      className="deferral-form-details"
      title={
        <div className="deferral-form-section-heading">Deferral Details</div>
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div className="deferral-form-subtitle">Loan Amount</div>
          <Select
            className="deferral-form-loan-amount-select"
            value={loanAmount}
            onChange={setLoanAmount}
            style={{ width: "100%" }}
            size="large"
            placeholder="Select loan amount"
          >
            <Option value="below75">Below 75 million</Option>
            <Option value="above75">Above 75 million</Option>
          </Select>
        </Col>

        {/* Per-document days sought */}
        <Col span={24} className="deferral-form-divider-block">
          <Card size="small" className="deferral-form-inline-card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <div className="deferral-form-subtitle" style={{ marginBottom: 0 }}>
                  Days Sought (per document)
                </div>
              </div>
            </div>

            {/* Column labels */}
            <Row
              className="deferral-form-table-header"
              gutter={12}
              style={{ marginBottom: 12 }}
            >
              <Col xs={12} sm={12} md={10}>
                <Typography.Text strong>Document</Typography.Text>
              </Col>
              <Col xs={6} sm={6} md={4}>
                <Typography.Text strong style={{ display: "inline-block" }}>
                  Days
                </Typography.Text>
              </Col>
              <Col xs={6} sm={6} md={6}>
                <Typography.Text strong>New Due Date</Typography.Text>
              </Col>
            </Row>

            {selectedDocuments && selectedDocuments.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {selectedDocuments.map((doc, idx) => {
                  const docKey = doc._id || doc.name || String(idx);
                  const days = perDocumentDays[docKey];
                  const computedDate = days
                    ? dayjs().add(Number(days), "day").format("YYYY-MM-DD")
                    : "";
                  return (
                    <Row
                      className="deferral-form-days-row"
                      key={docKey}
                      align="middle"
                      gutter={12}
                      style={{ borderRadius: 4 }}
                    >
                      <Col xs={24} sm={12} md={10}>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <Typography.Text strong style={{ marginBottom: 4 }}>
                            {doc.name}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {doc.type || ""}
                          </Typography.Text>
                        </div>
                      </Col>

                      <Col xs={12} sm={6} md={4}>
                        <InputNumber
                          min={0}
                          max={90}
                          value={days}
                          onChange={(v) =>
                            handlePerDocumentDaysChange(docKey, v)
                          }
                          style={{ width: "100%" }}
                          size="middle"
                          placeholder="Days (max 90)"
                          aria-label={`Days sought for ${doc.name} (maximum 90 days)`}
                        />
                      </Col>

                      <Col xs={12} sm={6} md={6}>
                        <DatePicker
                          value={computedDate ? dayjs(computedDate) : null}
                          format="DD/MM/YYYY"
                          disabled
                          style={{ width: "100%" }}
                          size="middle"
                        />
                      </Col>
                    </Row>
                  );
                })}
              </div>
            ) : (
              <Typography.Text type="secondary">
                Select documents to set days sought per document.
              </Typography.Text>
            )}
          </Card>
        </Col>

        {/* Document Picker Component */}
        <Col span={24} className="deferral-form-divider-block">
          <div style={{ marginBottom: 16 }}>
            <div className="deferral-form-subsection">
              <Typography.Title level={4} className="deferral-form-subsection-title">
                Document Name
              </Typography.Title>
            </div>
          </div>
          <DocumentPicker
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
            perDocumentDays={perDocumentDays}
          />
        </Col>

        <Col span={24} className="deferral-form-divider-block">
          <div className="deferral-form-inline-title">Deferral Description</div>
          <TextArea
            value={deferralDescription}
            onChange={(e) => setDeferralDescription(e.target.value)}
            rows={4}
            placeholder="Enter reason for deferral..."
            required
          />
        </Col>

        {/* Facility Table Component */}
        <Col span={24} className="deferral-form-divider-block">
          <div style={{ marginBottom: 16 }}>
            <div className="deferral-form-subsection">
              <Typography.Title level={4} className="deferral-form-subsection-title">
                Facility Details
              </Typography.Title>
            </div>
          </div>
          <FacilityTable
            facilities={facilities}
            setFacilities={setFacilities}
          />
        </Col>

        <Col span={24} className="deferral-form-divider-block">
          <div className="deferral-form-subtitle">DCL Number</div>
          <Input
            className={isSearchedByDcl ? "deferral-form-disabled-input" : undefined}
            value={dclNumber}
            onChange={(e) => !isSearchedByDcl && setDclNumber(e.target.value)}
            placeholder="Enter DCL number"
            size="large"
            prefix={<FileTextOutlined />}
            required
            disabled={isSearchedByDcl}
            style={{
              backgroundColor: isSearchedByDcl ? "#f5f5f5" : "#fff",
              cursor: isSearchedByDcl ? "not-allowed" : "text",
              opacity: isSearchedByDcl ? 0.7 : 1,
            }}
          />
        </Col>

        <Col span={24} className="deferral-form-divider-block">
          {/* DCL Upload */}
          <Card size="small" className="deferral-form-inline-card" style={{ marginBottom: 16 }}>
            <div className="deferral-form-subsection">
              <Typography.Title level={4} className="deferral-form-subsection-title">
                Mandatory: DCL Upload
              </Typography.Title>
            </div>
            <Upload
              disabled={!dclNumber}
              accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              beforeUpload={handleDCLUpload}
              fileList={[]}
              maxCount={1}
              showUploadList={false}
            >
              <Button className="deferral-form-upload-btn" icon={<UploadOutlined />} disabled={!dclNumber}>
                Upload DCL Document
              </Button>
            </Upload>

            {dclFile && (
              <div style={{ marginTop: 16 }}>
                {renderDocumentItem(dclFile, true, removeDCLFile)}
              </div>
            )}

            {!dclNumber ? (
              <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Please enter DCL number first
              </Typography.Text>
            ) : !dclFile ? (
              <Typography.Text
                type="secondary"
                style={{
                  display: "block",
                  marginTop: 8,
                  color: WARNING_ORANGE,
                }}
              >
                DCL document is required for submission
              </Typography.Text>
            ) : null}
          </Card>
        </Col>

        <Col span={24} className="deferral-form-divider-block">
          {/* Additional Documents */}
          <Card size="small" className="deferral-form-inline-card">
            <div className="deferral-form-subsection">
              <Typography.Title level={4} className="deferral-form-subsection-title">
                Additional Documents
              </Typography.Title>
            </div>
            <Upload
              accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              beforeUpload={handleAdditionalFileUpload}
              fileList={[]}
              multiple
              showUploadList={false}
            >
              <Button className="deferral-form-upload-btn" icon={<UploadOutlined />}>
                Upload Additional Documents
              </Button>
            </Upload>

            {additionalFiles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {additionalFiles.map((file, index) => (
                  <div key={file.uid || index}>
                    {renderDocumentItem(file, true, () => removeAdditionalFile(file))}
                  </div>
                ))}
                <div>
                  <Typography.Text
                    type="success"
                    style={{ display: "block", marginTop: 8, fontSize: "12px" }}
                  >
                    ✓ {additionalFiles.length} additional document
                    {additionalFiles.length !== 1 ? "s" : ""} ready
                  </Typography.Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
    </>
  );
}