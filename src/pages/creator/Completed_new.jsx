import React, { useMemo, useState, useCallback } from "react";
import {
  Button,
  Divider,
  Table,
  Tag,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Input,
  Badge,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
  useReviveChecklistMutation,
  useUpdateChecklistStatusMutation,
  useUpdateCoCreatorChecklistMutation,
  useReviveChecklistWithCreatorMutation,
} from "../../api/checklistApi";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModal";
import dayjs from "dayjs";
import { formatDate } from "../../utils/checklistUtils";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";

const { Text } = Typography;

const Completed = () => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth);
  const creatorId = user?.id || user?._id;
  const navigate = useNavigate();

  const {
    data: allChecklists = [],
    isLoading,
    refetch,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
  });

  const [reviveChecklistMutation, { isLoading: isReviving }] =
    useReviveChecklistMutation();
  const [reviveChecklistWithCreatorMutation] =
    useReviveChecklistWithCreatorMutation();
  const [updateChecklistStatusMutation] = useUpdateChecklistStatusMutation();
  const [updateCoCreatorChecklistMutation] =
    useUpdateCoCreatorChecklistMutation();

  console.log("Creator ID:", creatorId);
  console.log("Redux user:", user);
  console.log("Creator ID:", user?._id);
  console.log("All Checklists in MyQueue:", allChecklists);

  // Helper function to generate the next copy DCL number
  const getNextCopyDCLNumber = (originalDCL) => {
    // Check if DCL already has a copy suffix
    const copyRegex = /Copy\s(\d+)$/;
    const match = originalDCL?.match(copyRegex);

    if (match) {
      // Already has a copy number, increment it
      const currentCopy = parseInt(match[1], 10);
      return originalDCL.replace(copyRegex, `Copy ${currentCopy + 1}`);
    } else {
      // First copy
      return `${originalDCL} Copy 1`;
    }
  };

  // Helper function to update the DCL number on a revived checklist
  const updateRevivedDCLNumber = async (
    checklistId,
    originalDCL,
    existingChecklists,
  ) => {
    try {
      // Find the highest copy number for this original DCL
      const copiedDCLs = existingChecklists.filter((c) =>
        c.dclNo?.startsWith(originalDCL),
      );

      let copyNumber = 1;
      if (copiedDCLs.length > 0) {
        const copyNumbers = copiedDCLs.map((c) => {
          const match = c.dclNo?.match(/Copy\s(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        });
        copyNumber = Math.max(...copyNumbers) + 1;
      }

      const newDCLNumber = `${originalDCL} Copy ${copyNumber}`;

      console.log("📝 [Completed.jsx] Updating DCL number to:", newDCLNumber);
      await updateCoCreatorChecklistMutation({
        id: checklistId,
        data: { dclNo: newDCLNumber },
      }).unwrap();
      console.log("✅ [Completed.jsx] DCL number updated successfully");

      return newDCLNumber;
    } catch (error) {
      console.error("⚠️ [Completed.jsx] Failed to update DCL number:", error);
      throw error;
    }
  };

  const handleReviveChecklist = async (checklistId) => {
    console.log(
      "🚀 [Completed.jsx] handleReviveChecklist called with ID:",
      checklistId,
    );
    console.log("👤 Current user ID:", creatorId);

    try {
      message.loading({
        content: "Creating new checklist from template...",
        key: "revive",
        duration: 0,
      });

      console.log("📤 [Completed.jsx] Making API call to revive endpoint...");

      const response = await reviveChecklistMutation(checklistId).unwrap();

      console.log("✅ [Completed.jsx] API Response:", response);

      // Get the current checklist to find its original DCL number
      const currentChecklist = allChecklists.find((c) => c._id === checklistId);
      const originalDCL = currentChecklist?.dclNo;

      // Update the newly created copy's DCL number with "Copy X" suffix
      if (response.data?.newChecklistId && originalDCL) {
        try {
          const newDCLNumber = await updateRevivedDCLNumber(
            response.data.newChecklistId,
            originalDCL,
            allChecklists,
          );
          console.log(
            "✅ [Completed.jsx] DCL number updated to:",
            newDCLNumber,
          );
        } catch (dclError) {
          console.error(
            "⚠️ [Completed.jsx] Failed to update DCL number:",
            dclError,
          );
          // Continue even if DCL update fails
        }
      }

      // Update the newly created copy's status to co_creator_review so it shows as "Revived"
      if (response.data?.newChecklistId) {
        try {
          console.log(
            "📝 [Completed.jsx] Updating new checklist status to co_creator_review...",
          );
          await updateChecklistStatusMutation({
            checklistId: response.data.newChecklistId,
            status: "co_creator_review",
          }).unwrap();
          console.log(
            "✅ [Completed.jsx] New checklist status updated to co_creator_review",
          );
        } catch (statusError) {
          console.error(
            "⚠️ [Completed.jsx] Failed to update status, but revival was successful:",
            statusError,
          );
        }
      }

      message.success({
        content: response?.message || "Checklist revived successfully!",
        key: "revive",
        duration: 3,
      });

      // Log the state after revive for debugging
      setTimeout(() => {
        console.log(
          "🔍 [Completed.jsx] After revive - Current checklists:",
          allChecklists.map((c) => ({
            dclNo: c.dclNo,
            status: c.status,
            id: c._id?.substring(0, 8),
          })),
        );
      }, 1000);

      refetch();

      // Navigate to creator home to see the revived checklist in Created Checklists For Review
      console.log(
        "🚀 [Completed.jsx] Navigating to creator home to see revived copy...",
      );
      navigate("/cocreator");

      if (response.data?.newDCL) {
        message.info({
          content: `New checklist copy created: ${response.data.newDCL}`,
          duration: 5,
        });
      }

      return response;
    } catch (error) {
      console.error("❌ [Completed.jsx] Error reviving checklist:", error);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));
      console.error("❌ Error status:", error?.status);
      console.error("❌ Error data:", error?.data);

      // If auth fails, try the alternative method
      if (error.status === 401 || error.status === 403) {
        console.log(
          "🔄 Trying alternative revive method with creatorId in body...",
        );

        try {
          const response = await reviveChecklistWithCreatorMutation({
            checklistId,
            creatorId,
          }).unwrap();

          console.log("✅ Alternative method success:", response);

          // Get the current checklist to find its original DCL number
          const currentChecklist = allChecklists.find(
            (c) => c._id === checklistId,
          );
          const originalDCL = currentChecklist?.dclNo;

          // Update the newly created copy's DCL number with "Copy X" suffix
          if (response.data?.newChecklistId && originalDCL) {
            try {
              const newDCLNumber = await updateRevivedDCLNumber(
                response.data.newChecklistId,
                originalDCL,
                allChecklists,
              );
              console.log(
                "✅ [Completed.jsx] DCL number updated to:",
                newDCLNumber,
              );
            } catch (dclError) {
              console.error(
                "⚠️ [Completed.jsx] Failed to update DCL number:",
                dclError,
              );
              // Continue even if DCL update fails
            }
          }

          // Update the newly created copy's status to co_creator_review
          if (response.data?.newChecklistId) {
            try {
              console.log(
                "📝 [Completed.jsx] Updating new checklist status to co_creator_review...",
              );
              await updateChecklistStatusMutation({
                checklistId: response.data.newChecklistId,
                status: "co_creator_review",
              }).unwrap();
              console.log(
                "✅ [Completed.jsx] New checklist status updated to co_creator_review",
              );
            } catch (statusError) {
              console.error(
                "⚠️ [Completed.jsx] Failed to update status, but revival was successful:",
                statusError,
              );
            }
          }

          message.success({
            content: response?.message || "Checklist revived successfully!",
            key: "revive",
            duration: 3,
          });

          refetch();

          // Navigate to creator home
          navigate("/cocreator");

          if (response.data?.newDCL) {
            message.info({
              content: `New checklist copy created: ${response.data.newDCL}`,
              duration: 5,
            });
          }

          return response;
        } catch (secondError) {
          console.error("❌ Alternative method also failed:", secondError);
          showError(secondError);
          // Refetch data even on error to ensure UI is up to date
          refetch();
        }
      } else {
        showError(error);
        // Refetch data even on error to ensure UI is up to date
        refetch();
      }

      throw error;
    }
  };

  const showError = (error) => {
    let errorMessage = "Failed to revive checklist. Please try again.";

    if (error.status === 401) {
      errorMessage = "Authentication failed. Please login again.";
    } else if (error.status === 403) {
      errorMessage = "You don't have permission to revive checklists.";
    } else if (error.status === 404) {
      errorMessage = "Checklist not found or revive endpoint unavailable.";
    } else if (error.status === 500) {
      // Check for specific notification validation errors
      if (
        error?.data?.error?.includes("REVIVED") &&
        error?.data?.error?.includes("not a valid enum value")
      ) {
        errorMessage =
          "Notification system error: 'REVIVED' is not configured as a valid notification type. Please contact the development team to update the notification schema.";
      } else {
        errorMessage =
          "Server error occurred. Please contact support if the problem persists.";
      }
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.error) {
      errorMessage = error.error;
    }

    message.error({
      content: errorMessage,
      key: "revive",
      duration: 5,
    });
  };

  const handleRevive = useCallback(
    async (checklistId) => {
      console.log(
        "🔄 [Completed.jsx] handleRevive wrapper called with:",
        checklistId,
      );
      return handleReviveChecklist(checklistId);
    },
    [creatorId, allChecklists],
  );

  const filteredData = useMemo(() => {
    let filtered = allChecklists.filter((c) => {
      const statusLower = c.status?.toLowerCase() || "";
      // Show completed/approved checklists
      // Exclude revived copies (co_creator_review status) as those go to CoChecklistPage
      const isCompletedOrApproved =
        statusLower === "approved" || statusLower === "completed";
      const isNotRevived = statusLower !== "co_creator_review";

      // Debug logging
      if (
        statusLower === "approved" ||
        statusLower === "completed" ||
        statusLower === "co_creator_review"
      ) {
        console.log(
          `[Completed Filter] DCL: ${c.dclNo}, Status: ${c.status}, Include: ${isCompletedOrApproved && isNotRevived}`,
        );
      }

      return isCompletedOrApproved && isNotRevived;
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q) ||
          c.approvedBy?.name?.toLowerCase().includes(q),
      );
    }

    console.log(
      `[Completed.jsx] Filtered data: ${filtered.length} items from ${allChecklists.length} total`,
    );
    return filtered;
  }, [allChecklists, searchText]);

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileTextOutlined style={{ color: SECONDARY_PURPLE }} />
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => (
        <div style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}>
          {text || "—"}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 160,
      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: 12 }} />
          {text}
        </div>
      ),
    },
    {
      title: "IBPS No",
      dataIndex: "ibpsNo",
      width: 140,
      render: (text) => (
        <span
          style={{
            color: PRIMARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Checker - Approver",
      dataIndex: "approvedBy",
      width: 140,
      render: (approver) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
          <span
            style={{
              color: PRIMARY_BLUE,
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {approver?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocs =
          docs.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;

        return (
          <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
            {totalDocs}
          </span>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "updatedAt",
      width: 120,
      render: (date) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {date ? formatDate(date) : "—"}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      fixed: "right",
      render: () => (
        <Tag
          color="success"
          style={{ fontWeight: "bold", fontSize: 11 }}
          icon={<CheckCircleOutlined />}
        >
          Approved
        </Tag>
      ),
    },
  ];

  const customTableStyles = `
    .creator-completed-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .creator-completed-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 16px !important;
      border-bottom: 3px solid #b5d334 !important;
      border-right: none !important;
    }
    .creator-completed-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 14px 16px !important;
      font-size: 14px;
      color: #374151;
    }
    .creator-completed-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item-active {
      background-color: #b5d334 !important;
      border-color: #b5d334 !important;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_BLUE} !important;
      font-weight: 600;
    }
  `;

  return (
    <div style={{ padding: "8px 2px", boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${SUCCESS_GREEN}`,
        }}
        styles={{
          body: {
            padding: 16,
          },
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2
              style={{
                margin: 0,
                color: PRIMARY_BLUE,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              Completed Checklists
              <Badge
                count={filteredData.length}
                style={{ backgroundColor: SUCCESS_GREEN }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666" }}>
              Checklists approved by checkers
            </p>
          </Col>
          <Col>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#666" }}>
                {isReviving ? "Reviving checklist..." : ""}
              </span>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        style={{
          marginBottom: 16,
          background: "#fafafa",
          borderRadius: 8,
        }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by DCL, Customer, Loan Type or Checker"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Divider>
        <Text strong>Approved Checklists ({filteredData.length})</Text>
      </Divider>

      {isLoading ? (
        <Spin style={{ display: "block", margin: "40px auto" }} />
      ) : filteredData.length === 0 ? (
        <Empty description="No approved checklists found" />
      ) : (
        <div className="creator-completed-table">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => {
                console.log(
                  "📋 Row clicked, setting selected checklist:",
                  record._id,
                );
                setSelectedChecklist(record);
              },
            })}
          />
        </div>
      )}

      {selectedChecklist && (
        <>
          {console.log(
            "🔍 [Completed.jsx] Opening modal for checklist:",
            selectedChecklist._id,
          )}
          <CreatorCompletedChecklistModal
            checklist={selectedChecklist}
            open={!!selectedChecklist}
            onClose={() => {
              console.log("❌ Modal closed");
              setSelectedChecklist(null);
            }}
            onRevive={handleRevive}
            onRefreshData={refetch}
          />
        </>
      )}
    </div>
  );
};

export default Completed;
