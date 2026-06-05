import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Space,
  Tag,
  Badge,
  Input,
  message,
  Drawer,
  Descriptions,
  Empty,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
  LockOutlined,
  UnlockOutlined,
  SwapOutlined,
  UserDeleteOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useGetPendingActionsQuery, useApproveActionMutation, useRejectActionMutation } from "../../api/adminActionsApi";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import { ExportMenu } from "../../components/ExportMenu";
import "../../styles/creatorDesignSystem.css";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const LOCAL_TIMEZONE = "Africa/Nairobi";

const ACTION_TYPE_ICONS = {
  CreateUser: <UserAddOutlined />,
  ActivateUser: <UnlockOutlined />,
  DeactivateUser: <LockOutlined />,
  ChangeRole: <SwapOutlined />,
  ReassignTasks: <UserDeleteOutlined />,
};

const ACTION_TYPE_LABELS = {
  CreateUser: "Create User",
  ActivateUser: "Activate User",
  DeactivateUser: "Deactivate User",
  ChangeRole: "Change Role",
  ReassignTasks: "Reassign Tasks",
};

const STATUS_COLORS = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
};

const PendingActionsQueue = ({ refreshTrigger = 0 }) => {
  const { data: response = {}, isLoading, refetch } = useGetPendingActionsQuery();
  const [approveAction, { isLoading: approving }] = useApproveActionMutation();
  const [rejectAction, { isLoading: rejecting }] = useRejectActionMutation();
  const currentUser = useSelector((state) => state.auth?.user);

  const [selectedAction, setSelectedAction] = useState(null);
  const [rejectDrawerOpen, setRejectDrawerOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Only show actions NOT initiated by the current user
  const allActions = useMemo(() => response.actions || [], [response.actions]);
  const actions = useMemo(() => {
    if (!currentUser?.id) return allActions;
    return allActions.filter(
      (a) => String(a.createdByAdminId) !== String(currentUser.id)
    );
  }, [allActions, currentUser]);

  useEffect(() => {
    refetch();
  }, [refreshTrigger, refetch]);

  const handleApprove = async (actionId) => {
    setApprovingId(actionId);
    try {
      await approveAction({ adminActionId: actionId }).unwrap();
      message.success("Action approved and executed successfully! The initiator has been notified by email.");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to approve action");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectClick = (action) => {
    setSelectedAction(action);
    setRejectionReason("");
    setRejectDrawerOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedAction || !rejectionReason.trim()) {
      message.error("Please provide a rejection reason");
      return;
    }

    setRejectingId(selectedAction.id);
    try {
      const result = await rejectAction({
        adminActionId: selectedAction.id,
        reason: rejectionReason,
      }).unwrap();
      message.success("Action rejected successfully");
      setRejectDrawerOpen(false);
      setSelectedAction(null);
      setRejectionReason("");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to reject action");
    } finally {
      setRejectingId(null);
    }
  };

  const columns = [
    {
      title: "Action",
      dataIndex: "actionType",
      key: "actionType",
      render: (actionType) => (
        <Space>
          {ACTION_TYPE_ICONS[actionType]}
          <span>{ACTION_TYPE_LABELS[actionType]}</span>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <span title={text}>{text || "-"}</span>,
    },
    {
      title: "Initiator (Maker)",
      dataIndex: "createdByAdminName",
      key: "createdByAdminName",
      render: (name) => <span>{name || "-"}</span>,
    },
    {
      title: "Affected User",
      dataIndex: "affectedUserName",
      key: "affectedUserName",
      render: (name) => <span>{name || "-"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (date) => {
        if (!date) return "—";
        const local = dayjs.utc(date).tz(LOCAL_TIMEZONE);
        return (
          <Tooltip title={local.fromNow()}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, color: "var(--color-text-dark, #333)" }}>{local.format("DD MMM YYYY")}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-light, #888)" }}>{local.format("hh:mm:ss A")}</div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        if (record.status !== "Pending") {
          return <span style={{ color: "#999" }}>-</span>;
        }

        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={approvingId === record.id}
              onClick={() => handleApprove(record.id)}
              style={{ backgroundColor: "#52C41A", borderColor: "#52C41A" }}
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleRejectClick(record)}
            >
              Reject
            </Button>
            <Button
              type="text"
              size="small"
              onClick={() => setSelectedAction(record)}
            >
              Details
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div
      className="creator-card"
      style={{
        marginBottom: 24,
        borderColor: "rgba(226, 232, 240, 0.9)",
      }}
    >
      <div className="creator-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Pending Admin Actions</span>
          <Badge count={actions.length} style={{ backgroundColor: "#FF4D4F" }} />
        </div>
        <div>
          <ExportMenu
            data={actions}
            columns={[
              { header: "Action Type", key: "actionType", accessor: (a) => ACTION_TYPE_LABELS[a.actionType] || a.actionType },
              { header: "Description", key: "description" },
              { header: "Initiator (Maker)", key: "createdByAdminName", accessor: (a) => a.createdByAdminName || "N/A" },
              { header: "Affected User", key: "affectedUserName", accessor: (a) => a.affectedUserName || "N/A" },
              { header: "Status", key: "status" },
              { header: "Created At", key: "createdAt", accessor: (a) => a.createdAt ? dayjs(a.createdAt).format("DD MMM YYYY, hh:mm:ss A") : "-" },
            ]}
            filename="pending-actions"
            title="Pending Actions Queue"
            loading={isLoading}
            buttonText="Export Pending"
          />
        </div>
      </div>

      <div
        className="creator-card__body"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        {actions.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty
              image={<InboxOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />}
              description={<span style={{ color: "#999" }}>No pending admin actions awaiting your review</span>}
            />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={actions}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10, size: "small" }}
            size="small"
            scroll={{ x: 1200 }}
            style={{ marginBottom: 0 }}
          />
        )}
      </div>

      {/* Details Modal */}
      <Modal
        title={selectedAction ? ACTION_TYPE_LABELS[selectedAction.actionType] : "Action Details"}
        open={!!selectedAction && !rejectDrawerOpen}
        onCancel={() => setSelectedAction(null)}
        footer={null}
        width={600}
      >
        {selectedAction && (
          <Descriptions
            column={1}
            bordered
            size="small"
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Action Type">
              {ACTION_TYPE_LABELS[selectedAction.actionType]}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedAction.description}
            </Descriptions.Item>
            <Descriptions.Item label="Initiator">
              {selectedAction.createdByAdminName}
            </Descriptions.Item>
            <Descriptions.Item label="Affected User">
              {selectedAction.affectedUserName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[selectedAction.status]}>
                {selectedAction.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {selectedAction.createdAt ? dayjs.utc(selectedAction.createdAt).tz(LOCAL_TIMEZONE).format("DD MMM YYYY, hh:mm:ss A") : "—"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Rejection Reason Drawer */}
      <Drawer
        title="Reject Admin Action"
        placement="right"
        onClose={() => {
          setRejectDrawerOpen(false);
          setSelectedAction(null);
        }}
        open={rejectDrawerOpen}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={() => setRejectDrawerOpen(false)}>Cancel</Button>
            <Button
              danger
              loading={rejectingId === selectedAction?.id}
              onClick={handleRejectSubmit}
            >
              Reject
            </Button>
          </div>
        }
      >
        {selectedAction && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>Action:</strong> {ACTION_TYPE_LABELS[selectedAction.actionType]}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Description:</strong> {selectedAction.description}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Reason for Rejection:</strong>
              <Input.TextArea
                placeholder="Provide a reason for rejecting this action..."
                rows={6}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PendingActionsQueue;
