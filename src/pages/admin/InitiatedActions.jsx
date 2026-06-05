import React, { useMemo, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Modal,
  Descriptions,
  Badge,
  Empty,
  Button,
  Tooltip,
} from "antd";
import {
  UserAddOutlined,
  LockOutlined,
  UnlockOutlined,
  SwapOutlined,
  UserDeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useGetAdminActionsQuery } from "../../api/adminActionsApi";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import "../../styles/creatorDesignSystem.css";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const LOCAL_TIMEZONE = "Africa/Nairobi";

const ACTION_TYPE_ICONS = {
  CreateUser: <UserAddOutlined />,
  ActivateUser: <UnlockOutlined style={{ color: "#52c41a" }} />,
  DeactivateUser: <LockOutlined style={{ color: "#ff4d4f" }} />,
  ChangeRole: <SwapOutlined style={{ color: "#1890ff" }} />,
  ReassignTasks: <UserDeleteOutlined style={{ color: "#fa8c16" }} />,
};

const ACTION_TYPE_LABELS = {
  CreateUser: "Create User",
  ActivateUser: "Activate User",
  DeactivateUser: "Deactivate User",
  ChangeRole: "Change Role",
  ReassignTasks: "Reassign Tasks",
};

const STATUS_CONFIG = {
  Pending: {
    color: "warning",
    icon: <ClockCircleOutlined />,
    label: "Awaiting Approval",
  },
  Approved: {
    color: "success",
    icon: <CheckCircleOutlined />,
    label: "Approved & Executed",
  },
  Rejected: {
    color: "error",
    icon: <CloseCircleOutlined />,
    label: "Rejected",
  },
};

const InitiatedActions = () => {
  const currentUser = useSelector((state) => state.auth?.user);
  const { data: response = {}, isLoading, refetch } = useGetAdminActionsQuery();
  const [selectedAction, setSelectedAction] = useState(null);

  // Filter to only show current user's initiated actions
  const allActions = useMemo(() => response.actions || [], [response.actions]);
  const myActions = useMemo(() => {
    if (!currentUser?.id) return allActions;
    return allActions.filter(
      (a) => String(a.createdByAdminId) === String(currentUser.id)
    );
  }, [allActions, currentUser]);

  const pendingCount = useMemo(
    () => myActions.filter((a) => a.status === "Pending").length,
    [myActions]
  );
  const approvedCount = useMemo(
    () => myActions.filter((a) => a.status === "Approved").length,
    [myActions]
  );
  const rejectedCount = useMemo(
    () => myActions.filter((a) => a.status === "Rejected").length,
    [myActions]
  );

  const columns = [
    {
      title: "Action Type",
      dataIndex: "actionType",
      key: "actionType",
      render: (actionType) => (
        <Space>
          {ACTION_TYPE_ICONS[actionType]}
          <span style={{ fontWeight: 500 }}>{ACTION_TYPE_LABELS[actionType] || actionType}</span>
        </Space>
      ),
      filters: Object.keys(ACTION_TYPE_LABELS).map((k) => ({
        text: ACTION_TYPE_LABELS[k],
        value: k,
      })),
      onFilter: (value, record) => record.actionType === value,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ color: "var(--color-text-medium, #555)" }}>{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Awaiting Approval", value: "Pending" },
        { text: "Approved & Executed", value: "Approved" },
        { text: "Rejected", value: "Rejected" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || {};
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label || status}
          </Tag>
        );
      },
    },
    {
      title: "Reviewer (Checker)",
      dataIndex: "approvedByAdminName",
      key: "approvedByAdminName",
      render: (name, record) => {
        if (!name) {
          return <span style={{ color: "#bfbfbf" }}>—</span>;
        }
        const isRejected = record.status === "Rejected";
        return (
          <span style={{ color: isRejected ? "#ff4d4f" : "#52c41a", fontWeight: 500 }}>
            {name}
          </span>
        );
      },
    },
    {
      title: "Rejection Reason",
      dataIndex: "rejectionReason",
      key: "rejectionReason",
      ellipsis: true,
      render: (reason) =>
        reason ? (
          <Tooltip title={reason}>
            <span style={{ color: "#ff4d4f" }}>{reason}</span>
          </Tooltip>
        ) : (
          <span style={{ color: "#bfbfbf" }}>—</span>
        ),
    },
    {
      title: "Initiated At",
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
      title: "Reviewed At",
      dataIndex: "approvedAt",
      key: "approvedAt",
      render: (date) => {
        if (!date) return <span style={{ color: "#bfbfbf" }}>—</span>;
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
      title: "",
      key: "view",
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedAction(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-page creator-theme">
      {/* Header */}
      <section className="admin-page__hero">
        <div className="admin-page__hero-copy">
          <span className="admin-page__eyebrow">Administration</span>
          <div className="admin-page__title-row">
            <h1 className="admin-page__title">Initiated Actions</h1>
            <span className="admin-page__count">{myActions.length} total</span>
          </div>
          <p className="admin-page__subtitle">
            Track the status of all admin actions you have initiated. Actions require approval by
            another admin before taking effect.
          </p>
        </div>
        <div className="admin-page__hero-actions">
          <Button icon={<SendOutlined />} onClick={refetch}>
            Refresh
          </Button>
        </div>
      </section>

      {/* Summary badges */}
      <section style={{ padding: "0 32px 24px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            borderRadius: 10,
            padding: "12px 24px",
            minWidth: 140,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#d48806" }}>{pendingCount}</div>
          <div style={{ fontSize: 13, color: "#d48806" }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Awaiting Approval
          </div>
        </div>
        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 10,
            padding: "12px 24px",
            minWidth: 140,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#389e0d" }}>{approvedCount}</div>
          <div style={{ fontSize: 13, color: "#389e0d" }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} />
            Approved & Executed
          </div>
        </div>
        <div
          style={{
            background: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: 10,
            padding: "12px 24px",
            minWidth: 140,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#cf1322" }}>{rejectedCount}</div>
          <div style={{ fontSize: 13, color: "#cf1322" }}>
            <CloseCircleOutlined style={{ marginRight: 4 }} />
            Rejected
          </div>
        </div>
      </section>

      {/* Table */}
      <section style={{ padding: "0 32px 32px" }}>
        <div className="creator-table-shell" style={{ borderRadius: 12, overflow: "hidden" }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={myActions}
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <span style={{ color: "#999" }}>
                      You haven&apos;t initiated any admin actions yet.
                    </span>
                  }
                />
              ),
            }}
            rowClassName={(record) => {
              if (record.status === "Rejected") return "initiated-actions__row--rejected";
              if (record.status === "Pending") return "initiated-actions__row--pending";
              return "";
            }}
          />
        </div>
      </section>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            {selectedAction && ACTION_TYPE_ICONS[selectedAction.actionType]}
            {selectedAction ? ACTION_TYPE_LABELS[selectedAction.actionType] : "Action Details"}
          </Space>
        }
        open={!!selectedAction}
        onCancel={() => setSelectedAction(null)}
        footer={
          <Button onClick={() => setSelectedAction(null)}>Close</Button>
        }
        width={640}
      >
        {selectedAction && (
          <>
            <Tag
              color={STATUS_CONFIG[selectedAction.status]?.color}
              icon={STATUS_CONFIG[selectedAction.status]?.icon}
              style={{ marginBottom: 20, fontSize: 13 }}
            >
              {STATUS_CONFIG[selectedAction.status]?.label || selectedAction.status}
            </Tag>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Action Type">
                {ACTION_TYPE_LABELS[selectedAction.actionType] || selectedAction.actionType}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedAction.description}
              </Descriptions.Item>
              <Descriptions.Item label="Initiated By (You)">
                {selectedAction.createdByAdminName}
              </Descriptions.Item>
              <Descriptions.Item label="Reviewed By">
                {selectedAction.approvedByAdminName || "Not yet reviewed"}
              </Descriptions.Item>
              <Descriptions.Item label="Initiated At">
                {selectedAction.createdAt ? dayjs.utc(selectedAction.createdAt).tz(LOCAL_TIMEZONE).format("DD MMM YYYY, hh:mm:ss A") : "—"}
              </Descriptions.Item>
              {selectedAction.approvedAt && (
                <Descriptions.Item label="Reviewed At">
                  {dayjs.utc(selectedAction.approvedAt).tz(LOCAL_TIMEZONE).format("DD MMM YYYY, hh:mm:ss A")}
                </Descriptions.Item>
              )}
              {selectedAction.rejectionReason && (
                <Descriptions.Item label="Rejection Reason">
                  <span style={{ color: "#ff4d4f" }}>{selectedAction.rejectionReason}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
};

export default InitiatedActions;
