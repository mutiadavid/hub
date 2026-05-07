import React from "react";
import {
  Button,
  Descriptions,
  List,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { getConfirmModalStyles } from "../styles/deferralFormStyles";
import { PRIMARY_BLUE, LOAN_THRESHOLD } from "../utils/constants";
import {
  getDocumentCategory,
  parseLoanAmount,
  formatLoanType,
} from "../utils/helpers";
import { handleViewDocument, handleDownload } from "../utils/fileUtils";

const { Title } = Typography;

export default function DeferralConfirmationModal({
  showConfirmModal,
  previewDeferralNumber,
  customerName,
  customerNumber,
  dclNumber,
  loanType,
  loanAmount,
  selectedDocuments,
  perDocumentDays,
  dferralDescription,
  approverSlots,
  approverList,
  facilities,
  dclFile,
  additionalFiles,
  postedComments,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  if (!showConfirmModal) return null;

  const numericLoan = parseLoanAmount(loanAmount);
  const formattedLoanAmount =
    numericLoan && Number(numericLoan) > 0
      ? `KSh ${Number(numericLoan).toLocaleString()}`
      : "Not specified";
  const isAboveThreshold = Number(numericLoan) > LOAN_THRESHOLD;
  const documentCategory = getDocumentCategory(selectedDocuments);

  return (
    <>
      <style>{getConfirmModalStyles()}</style>

      <div
        className="confirm-modal-overlay"
        onClick={onCancel}
      >
        <div
          className="confirm-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="confirm-modal-header">
            <h3>
              {`Confirm submission to approver${approverSlots.filter((s) => s.userId).length > 1 ? "s" : ""}`}
            </h3>
          </div>

          {/* Body */}
          <div className="confirm-modal-body">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Deferral Number">
                {previewDeferralNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {customerName} — {customerNumber}
              </Descriptions.Item>
              <Descriptions.Item label="DCL No">
                {dclNumber}
              </Descriptions.Item>

              <Descriptions.Item label="Loan Type">
                {formatLoanType(loanType)}
              </Descriptions.Item>
              <Descriptions.Item label="Loan Amount">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {formattedLoanAmount === "Not specified" ? (
                    <div>Not specified</div>
                  ) : (
                    <div>
                      <Tag
                        color={isAboveThreshold ? "red" : "blue"}
                        style={{ fontWeight: 700 }}
                      >
                        {isAboveThreshold
                          ? "Above 75 million"
                          : "Below 75 million"}
                      </Tag>
                    </div>
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Document(s) to be deferred">
                {selectedDocuments && selectedDocuments.length > 0 ? (
                  <List
                    size="small"
                    dataSource={selectedDocuments}
                    renderItem={(doc) => {
                      const docName =
                        typeof doc === "string"
                          ? doc
                          : doc.name || doc.label || "Document";
                      const docTypeRaw =
                        typeof doc === "string"
                          ? ""
                          : String(doc.type || "")
                              .trim()
                              .toLowerCase();
                      const docType =
                        docTypeRaw === "primary"
                          ? "Primary"
                          : docTypeRaw === "secondary"
                            ? "Secondary"
                            : documentCategory;
                      const uploadedFiles = [
                        ...(dclFile
                          ? [{ name: dclFile.name, fileObj: dclFile }]
                          : []),
                        ...additionalFiles.map((f) => ({
                          name: f.name,
                          fileObj: f,
                        })),
                      ];
                      const uploaded = uploadedFiles.find(
                        (u) =>
                          u.name &&
                          docName &&
                          u.name
                            .toLowerCase()
                            .includes(docName.toLowerCase())
                      );
                      const docKey =
                        (doc && (doc._id || doc.name)) || docName;
                      const docDays = Number(perDocumentDays[docKey]) || 0;
                      const docNextDate = docDays
                        ? dayjs().add(docDays, "day").format("DD MMM YYYY")
                        : "-";

                      return (
                        <List.Item>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              width: "100%",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {docName}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <Tag
                                  style={{
                                    margin: 0,
                                    backgroundColor: "#ffffff",
                                    color: "#000000",
                                    border: "1px solid #d9d9d9",
                                  }}
                                >
                                  {docType}
                                </Tag>
                              </div>
                              {uploaded && (
                                <div
                                  style={{ fontSize: 12, color: "#666" }}
                                >
                                  Uploaded as: {uploaded.name}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#444",
                                  marginTop: 6,
                                }}
                              >
                                <strong>Requested days:</strong>{" "}
                                {docDays || "-"} &nbsp; • &nbsp;{" "}
                                <strong>New due date:</strong> {docNextDate}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Tag
                                style={{
                                  alignSelf: "center",
                                  backgroundColor: "#ffffff",
                                  color: "#000000",
                                  border: "1px solid #d9d9d9",
                                }}
                              >
                                {uploaded ? "Uploaded" : "Requested"}
                              </Tag>
                              {uploaded ? (
                                <>
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleViewDocument(uploaded.fileObj || uploaded)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleDownload(uploaded)}
                                  >
                                    Download
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  "-"
                )}
              </Descriptions.Item>

              {dferralDescription && (
                <Descriptions.Item label="Deferral Description">
                  <div
                    style={{
                      padding: 8,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 6,
                    }}
                  >
                    {dferralDescription}
                  </div>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Approvers">
                <List
                  size="small"
                  dataSource={approverSlots.filter((s) => s.userId)}
                  renderItem={(s) => {
                    const user = approverList.find(
                      (a) => a._id === s.userId
                    );
                    return (
                      <List.Item>
                        {user
                          ? `${user.name} — ${user.position || user.role || ""}`
                          : s.userId}
                      </List.Item>
                    );
                  }}
                />
              </Descriptions.Item>

              <Descriptions.Item label="Facilities">
                <Table
                  size="small"
                  dataSource={facilities.map((f, i) => ({ ...f, key: i }))}
                  pagination={false}
                  columns={[
                    {
                      title: "Facility Type",
                      dataIndex: "type",
                      key: "type",
                      render: (t, record) => (
                        <Typography.Text strong>
                          {t || record.facilityType || record.name || "N/A"}
                        </Typography.Text>
                      ),
                    },
                    {
                      title: "Sanctioned (KES '000)",
                      dataIndex: "sanctioned",
                      key: "sanctioned",
                      align: "right",
                      render: (v, r) =>
                        Number(v ?? r.amount ?? 0).toLocaleString(),
                    },
                    {
                      title: "Balance (KES '000)",
                      dataIndex: "balance",
                      key: "balance",
                      align: "right",
                      render: (v, r) =>
                        Number(v ?? r.balance ?? 0).toLocaleString(),
                    },
                    {
                      title: "Headroom (KES '000)",
                      dataIndex: "headroom",
                      key: "headroom",
                      align: "right",
                      render: (v, r) =>
                        Number(
                          v ??
                            r.headroom ??
                            Math.max(0, (r.amount || 0) - (r.balance || 0))
                        ).toLocaleString(),
                    },
                  ]}
                />
              </Descriptions.Item>

              <Descriptions.Item label="Uploaded Documents">
                <List
                  size="small"
                  dataSource={[
                    ...(dclFile
                      ? [{ name: dclFile.name, fileObj: dclFile }]
                      : []),
                    ...additionalFiles.map((f) => ({
                      name: f.name,
                      fileObj: f,
                    })),
                  ]}
                  renderItem={(it) => (
                    <List.Item>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div>{it.name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {it.fileObj && it.fileObj.size
                                ? `${(it.fileObj.size / 1024).toFixed(2)} KB`
                                : ""}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Button
                            type="link"
                            onClick={() => handleViewDocument(it.fileObj || it)}
                          >
                            View
                          </Button>
                          <Button
                            type="link"
                            onClick={() => handleDownload(it)}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Descriptions.Item>

              <Descriptions.Item label="Comment Trail & History">
                {postedComments && postedComments.length > 0 ? (
                  <List
                    dataSource={postedComments}
                    itemLayout="horizontal"
                    renderItem={(item) => (
                      <List.Item>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <b>{item.user?.name || "Unknown"}</b>
                              {item.user?.role && (
                                <Tag
                                  style={{
                                    textTransform: "uppercase",
                                    margin: 0,
                                  }}
                                >
                                  {item.user.role}
                                </Tag>
                              )}
                              <span style={{ color: "#4a4a4a" }}>
                                {item.message}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: "#777" }}>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : ""}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  "-"
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px 24px 24px",
              background: "#fafafa",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              borderRadius: "0 0 12px 12px",
              flexShrink: 0,
            }}
          >
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={onSubmit}
              disabled={approverSlots.filter((s) => s.userId).length === 0}
              loading={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
