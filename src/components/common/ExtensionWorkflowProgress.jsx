import React from "react";
import { Progress, Tag, Avatar, Space, Badge, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import UniformTag from "./UniformTag";
import { resolveDisplayName } from "../../utils/extensionHistory";

const PRIMARY_BLUE = "#164679";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const SECONDARY_PURPLE = "#7e6496";

const getApproverDisplayName = (approval, index) =>
  resolveDisplayName(
    approval?.user?.name,
    approval?.user?.fullName,
    approval?.userName,
    approval?.name,
    approval?.approverName,
    approval?.email,
    `Approver ${index + 1}`,
  );

const isApproverApproved = (approver) =>
  approver?.approved === true ||
  String(
    approver?.approvalStatus || approver?.ApprovalStatus || approver?.status || "",
  )
    .trim()
    .toLowerCase() === "approved";

const isApproverRejected = (approver) =>
  approver?.rejected === true ||
  String(
    approver?.approvalStatus || approver?.ApprovalStatus || approver?.status || "",
  )
    .trim()
    .toLowerCase() === "rejected";

const isApproverReturned = (approver) =>
  String(
    approver?.approvalStatus || approver?.ApprovalStatus || approver?.status || "",
  )
    .trim()
    .toLowerCase() === "returned_for_rework";

const ExtensionWorkflowProgress = ({
  approvers = [],
  approvals = [],
  allApproversApproved = false,
  creatorApprovalStatus = "pending",
  checkerApprovalStatus = "pending",
}) => {
  // Normalize approvals array - could be from approvers or approvals fields
  const normalizeApprovals = (approversList, approvalsList) => {
    if (Array.isArray(approvalsList) && approvalsList.length > 0) {
      return approvalsList;
    }
    return Array.isArray(approversList) ? approversList : [];
  };

  const approvalsToShow = normalizeApprovals(approvers, approvals);
  const approvedCount = approvalsToShow.filter(isApproverApproved).length;
  const totalApprovers = approvalsToShow.length;
  const approverProgress =
    totalApprovers > 0 ? Math.round((approvedCount / totalApprovers) * 100) : 0;

  // Normalize creator/checker status
  const creatorApproved =
    String(creatorApprovalStatus || "").toLowerCase() === "approved";
  const checkerApproved =
    String(checkerApprovalStatus || "").toLowerCase() === "approved";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Approver Progress */}
      {totalApprovers > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: SECONDARY_PURPLE }}>
              Approver Chain Progress
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY_BLUE }}>
              {approvedCount} of {totalApprovers}
            </span>
          </div>
          <Progress
            percent={approverProgress}
            strokeColor={SUCCESS_GREEN}
            status={approverProgress === 100 ? "success" : "active"}
          />
        </div>
      )}

      {/* Creator & Checker Status Row */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Creator Status */}
        <div
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: creatorApproved ? "#f6ffed" : "#e6f7ff",
            borderRadius: 6,
            border: `1px solid ${creatorApproved ? "#b7eb8f" : "#91d5ff"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{
                backgroundColor: creatorApproved ? SUCCESS_GREEN : PRIMARY_BLUE,
              }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>
                Co Creator
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>Approval Status</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            {creatorApproved ? (
              <UniformTag
                icon={<CheckCircleOutlined />}
                color="success"
                text="Approved"
              />
            ) : (
              <UniformTag color="processing" text="Pending" />
            )}
          </div>
        </div>

        {/* Checker Status */}
        <div
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: checkerApproved ? "#f6ffed" : "#e6f7ff",
            borderRadius: 6,
            border: `1px solid ${checkerApproved ? "#b7eb8f" : "#91d5ff"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{
                backgroundColor: checkerApproved ? SUCCESS_GREEN : PRIMARY_BLUE,
              }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>
                Co Checker
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>Approval Status</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            {checkerApproved ? (
              <UniformTag
                icon={<CheckCircleOutlined />}
                color="success"
                text="Approved"
              />
            ) : (
              <UniformTag color="processing" text="Pending" />
            )}
          </div>
        </div>
      </div>

      {/* Approver List (if any) */}
      {totalApprovers > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: SECONDARY_PURPLE }}>
            Approval Chain ({totalApprovers})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {approvalsToShow.map((approval, index) => {
              const isApproved = isApproverApproved(approval);
              const isRejected = isApproverRejected(approval);
              const isReturned = isApproverReturned(approval);

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 8,
                    backgroundColor: isApproved
                      ? "#f6ffed"
                      : isRejected
                        ? "#ffebee"
                        : isReturned
                          ? "#fff7e6"
                          : "#fafafa",
                    borderRadius: 4,
                    border: `1px solid ${
                      isApproved
                        ? "#b7eb8f"
                        : isRejected
                          ? "#ffcdd2"
                          : isReturned
                            ? "#ffb74d"
                            : "#e0e0e0"
                    }`,
                  }}
                >
                  <Badge
                    count={index + 1}
                    style={{
                      backgroundColor: isApproved
                        ? SUCCESS_GREEN
                        : isRejected
                          ? ERROR_RED
                          : isReturned
                            ? WARNING_ORANGE
                            : PRIMARY_BLUE,
                      height: 22,
                      minWidth: 22,
                      fontSize: 11,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#333",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getApproverDisplayName(approval, index)}
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>
                      {approval?.role || "Approver"}
                    </div>
                  </div>
                  {isApproved && (
                    <Tooltip title="Approved">
                      <CheckCircleOutlined
                        style={{
                          color: SUCCESS_GREEN,
                          fontSize: 16,
                        }}
                      />
                    </Tooltip>
                  )}
                  {isRejected && (
                    <Tooltip title="Rejected">
                      <CloseCircleOutlined
                        style={{
                          color: ERROR_RED,
                          fontSize: 16,
                        }}
                      />
                    </Tooltip>
                  )}
                  {isReturned && (
                    <Tooltip title="Returned">
                      <ExclamationCircleOutlined
                        style={{
                          color: WARNING_ORANGE,
                          fontSize: 16,
                        }}
                      />
                    </Tooltip>
                  )}
                  {!isApproved && !isRejected && !isReturned && (
                    <UniformTag color="processing" text="Pending" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall Status */}
      {allApproversApproved && creatorApproved && checkerApproved && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#f6ffed",
            borderRadius: 6,
            border: `2px solid ${SUCCESS_GREEN}`,
            textAlign: "center",
          }}
        >
          <CheckCircleOutlined
            style={{
              color: SUCCESS_GREEN,
              fontSize: 18,
              marginRight: 8,
            }}
          />
          <span style={{ fontWeight: 600, color: SUCCESS_GREEN }}>
            Extension Fully Approved
          </span>
        </div>
      )}
    </div>
  );
};

export default ExtensionWorkflowProgress;
