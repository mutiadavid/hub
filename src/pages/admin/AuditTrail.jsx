// File: src/components/AuditTrail.jsx
import React, { useState, useEffect } from "react";
import { Table, Card, Tag, DatePicker, Select, Space, Typography, Spin, message, Badge } from "antd";
import { useGetAuditLogsQuery } from "../../api/auditApi";
import dayjs from "dayjs";
import { socket } from "@/app/socket"; // make sure socket is imported

const { RangePicker } = DatePicker;
const { Title } = Typography;

const AuditTrail = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useGetAuditLogsQuery(filters);

  // Track online users from socket
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.connect();

    socket.on("onlineUsers", (users) => {
      // store online user IDs in an array
      setOnlineUsers(users.map((u) => u._id));
    });

    return () => {
      socket.off("onlineUsers");
      socket.disconnect();
    };
  }, []);

  // Show error messages once
  useEffect(() => {
    if (error) message.error("Failed to load audit logs");
  }, [error]);

  const columns = [
    {
      title: "Admin",
      dataIndex: "performedBy",
      key: "admin",
      render: (u) => {
        const isOnline = u?._id && onlineUsers.includes(u._id);
        return (
          <Space>
            <span>{u?.name || "System"}</span>
            {isOnline && <Badge status="success" text="Online" />}
          </Space>
        );
      },
    },
    {
      title: "Target User",
      dataIndex: "targetUser",
      key: "targetUser",
      render: (u) => {
        const isOnline = u?._id && onlineUsers.includes(u._id);
        return (
          <Space>
            <span>{u?.name || "N/A"}</span>
            {isOnline && <Badge status="success" text="Online" />}
          </Space>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "targetRole",
      key: "role",
      render: (role) => <Tag>{role || "—"}</Tag>,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action) => action || "SYSTEM_EVENT",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "success" ? "green" : "red"}>{s?.toUpperCase() || "UNKNOWN"}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (d) => (d ? dayjs(d).format("DD MMM YYYY HH:mm") : "—"),
    },
  ];

  return (
    <Card style={{ borderRadius: 12 }}>
      <Title level={4}>Audit Trail</Title>

      {/* FILTER BAR */}
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Action"
          allowClear
          style={{ width: 180 }}
          onChange={(v) =>
            setFilters((f) => {
              const newFilters = { ...f, page: 1 };
              if (v) newFilters.action = v;
              else delete newFilters.action;
              return newFilters;
            })
          }
          options={[
            { value: "CREATE_USER", label: "Create User" },
            { value: "CHANGE_ROLE", label: "Change Role" },
            { value: "LOGIN", label: "Login" },
            { value: "APPROVE_DCL", label: "Approve DCL" },
          ]}
        />

        <Select
          placeholder="Status"
          allowClear
          style={{ width: 120 }}
          onChange={(v) =>
            setFilters((f) => {
              const newFilters = { ...f, page: 1 };
              if (v) newFilters.status = v;
              else delete newFilters.status;
              return newFilters;
            })
          }
          options={[
            { value: "success", label: "Success" },
            { value: "failed", label: "Failed" },
          ]}
        />

        <RangePicker
          onChange={(dates) => {
            setFilters((f) => {
              const newFilters = { ...f, page: 1 };
              if (dates?.length === 2) {
                newFilters.startDate = dates[0].toISOString();
                newFilters.endDate = dates[1].toISOString();
              } else {
                delete newFilters.startDate;
                delete newFilters.endDate;
              }
              return newFilters;
            });
          }}
        />
      </Space>

      {/* TABLE */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: data?.pagination?.total || 0,
          onChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
      />
    </Card>
  );
};

export default AuditTrail;

