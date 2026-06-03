
// export default AuditTrailViewer;
// src/pages/admin/UserAuditTrailPage.jsx
import React, { useState, useMemo } from "react";
import {
  Table,
  Card,
  Tag,
  DatePicker,
  Select,
  Space,
  Typography,
  Spin,
  message,
  Badge,
  Button,
  Row,
  Col,
  Input,
  Drawer,
  Descriptions,
  Timeline,
  Alert,
  Tooltip,
  Tabs,
  Modal,
  Avatar,
  Divider,
  Empty,
} from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ExportOutlined,
  FilterOutlined,
  CalendarOutlined,
  BugOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  useGetUsersQuery,
  useGetAuditLogsQuery,
  useGetAuditLogStatsQuery,
} from "../../api/userApi";
import dayjs from "dayjs";
import { useAuditSocket } from "../../hooks/useAuditSocket";
import { debounce } from "lodash";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const actionColorMap = {
  CREATE_USER: "blue",
  UPDATE_USER: "cyan",
  DELETE_USER: "red",
  CHANGE_ROLE: "orange",
  ACTIVATE_USER: "green",
  DEACTIVATE_USER: "volcano",
  LOGIN: "green",
  LOGOUT: "default",
  FORCE_LOGOUT: "red",
  UPLOAD_FILE: "blue",
  DELETE_FILE: "red",
  VIEW_FILE: "green",
  DOWNLOAD_FILE: "purple",
  CREATE_CHECKLIST: "blue",
  UPDATE_CHECKLIST: "cyan",
  SUBMIT_CHECKLIST: "green",
  APPROVE_CHECKLIST: "green",
  REJECT_CHECKLIST: "red",
  REVIEW_CHECKLIST: "orange",
  CREATE_DEFERRAL: "blue",
  UPDATE_DEFERRAL: "cyan",
  APPROVE_DEFERRAL: "green",
  REJECT_DEFERRAL: "red",
  RETURN_DEFERRAL: "orange",
  SUBMIT_DEFERRAL: "purple",
};

const UserAuditTrailPage = ({ currentUser }) => {
  // States
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDrawerVisible, setUserDrawerVisible] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeTab, setActiveTab] = useState("all");


  // Hooks
  const { onlineUsers } = useAuditSocket(currentUser);

  // Get all users - FIXED: Use proper query format
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery();

  // Extract users from response - handle different response structures
  const users = useMemo(() => {
    if (!usersData) return [];

    // Try different response structures
    if (Array.isArray(usersData)) {
      return usersData;
    }
    if (usersData.users && Array.isArray(usersData.users)) {
      return usersData.users;
    }
    if (usersData.data && Array.isArray(usersData.data)) {
      return usersData.data;
    }
    if (usersData.result && Array.isArray(usersData.result)) {
      return usersData.result;
    }

    console.warn("Unexpected users data structure:", usersData);
    return [];
  }, [usersData]);

  const {
    data: auditData,
    isLoading: isLoadingAudit,
    error: auditError,
    // refetch: refetchAudit,
  } = useGetAuditLogsQuery(
    {
      userId: selectedUserId,
      startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
      limit: 100,
    }
  );

  // Extract audit logs from response
  const auditLogs = useMemo(() => {
    if (!auditData) return [];

    // Try different response structures
    if (Array.isArray(auditData)) {
      return auditData;
    }
    if (auditData.logs && Array.isArray(auditData.logs)) {
      return auditData.logs;
    }
    if (auditData.data && Array.isArray(auditData.data)) {
      return auditData.data;
    }
    if (auditData.result && Array.isArray(auditData.result)) {
      return auditData.result;
    }

    console.warn("Unexpected audit data structure:", auditData);
    return [];
  }, [auditData]);

  // Stats - handle gracefully if endpoint doesn't exist
  const { data: statsData, error: statsError } = useGetAuditLogStatsQuery();

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (
        searchTerm &&
        !user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Role filter
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "online") {
        const isOnline = onlineUsers.some((u) => u._id === user._id);
        if (!isOnline) return false;
      } else if (statusFilter === "offline") {
        const isOnline = onlineUsers.some((u) => u._id === user._id);
        if (isOnline) return false;
      } else if (statusFilter === "active" && !user.active) {
        return false;
      } else if (statusFilter === "inactive" && user.active) {
        return false;
      }

      // Tab filter
      if (activeTab === "online") {
        const isOnline = onlineUsers.some((u) => u._id === user._id);
        if (!isOnline) return false;
      } else if (activeTab === "admins" && user.role !== "admin") {
        return false;
      } else if (activeTab === "customers" && user.role !== "customer") {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter, activeTab, onlineUsers]);

  // Handle user selection
  const handleUserSelect = (userId) => {
    const user = users.find((u) => u._id === userId);
    if (user) {
      setSelectedUserId(userId);
      setSelectedUser(user);
      setUserDrawerVisible(true);
      message.loading({
        content: "Loading user audit trail...",
        key: "loadingAudit",
        duration: 2,
      });
    } else {
      message.error("User not found");
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchUsers();
    message.info("Refreshing user data...");
  };

  // Debug function
  const handleDebug = () => {
    message.info("Debug information is unavailable in production");
  };

  // User columns
  const userColumns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            style={{
              backgroundColor: record.active ? "#52c41a" : "#f5222d",
            }}
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name || "Unknown"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const roleColors = {
          admin: "red",
          rm: "purple",
          cocreator: "cyan",
          approver: "green",
          cochecker: "orange",
          customer: "blue",
        };
        return (
          <Tag color={roleColors[role] || "blue"}>{role?.toUpperCase()}</Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isOnline = onlineUsers.some((u) => u._id === record._id);

        return (
          <Space>
            <Badge
              status={isOnline ? "success" : "default"}
              text={isOnline ? "Online" : "Offline"}
            />
            <Tag color={record.active ? "green" : "red"}>
              {record.active ? "Active" : "Inactive"}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => handleUserSelect(record._id)}
        >
          View Logs
        </Button>
      ),
    },
  ];

  // Show loading or error states
  if (isLoadingUsers) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          Loading users...
        </Text>
      </Card>
    );
  }

  if (usersError) {
    return (
      <Card>
        <Alert
          type="error"
          message="Failed to load users"
          description={
            <div>
              <p>Error: {usersError?.message || "Unknown error"}</p>
              <Button
                type="primary"
                onClick={handleRefresh}
                style={{ marginTop: 16 }}
              >
                <ReloadOutlined /> Retry
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <Empty
          description={
            <div>
              <Text type="secondary">No users found in the system</Text>
              <br />
              <Button
                type="primary"
                onClick={handleRefresh}
                style={{ marginTop: 16 }}
              >
                <ReloadOutlined /> Refresh
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        {/* Header */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={8}>
            <Title level={4}>
              <HistoryOutlined /> User Audit Trails
            </Title>
            <Text type="secondary">
              {users.length} user{users.length !== 1 ? "s" : ""} in system
            </Text>
          </Col>
          <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
            <Space wrap>
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={isLoadingUsers}
                >
                  Refresh
                </Button>
              </Tooltip>
              <Tooltip title="Debug information">
                <Button icon={<BugOutlined />} onClick={handleDebug}>
                  Debug
                </Button>
              </Tooltip>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setRoleFilter(null);
                  setStatusFilter(null);
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Text strong>{users.length}</Text>
              <br />
              <Text type="secondary">Total Users</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Text strong>{onlineUsers.length}</Text>
              <br />
              <Text type="secondary">Online Now</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Text strong>{users.filter((u) => u.active).length}</Text>
              <br />
              <Text type="secondary">Active Accounts</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Text strong>{auditLogs.length}</Text>
              <br />
              <Text type="secondary">Audit Logs</Text>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card
          size="small"
          style={{ marginBottom: 16, backgroundColor: "#fafafa" }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Search
                placeholder="Search users by name, email, or role"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filter by role"
                style={{ width: "100%" }}
                allowClear
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { label: "Admin", value: "admin" },
                  { label: "RM", value: "rm" },
                  { label: "Co-creator", value: "cocreator" },
                  { label: "Approver", value: "approver" },
                  { label: "Co-checker", value: "cochecker" },
                  { label: "Customer", value: "customer" },
                ]}
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filter by status"
                style={{ width: "100%" }}
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: "Online", value: "online" },
                  { label: "Offline", value: "offline" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </Col>
            <Col xs={24} md={8}>
              <RangePicker
                style={{ width: "100%" }}
                onChange={setDateRange}
                suffixIcon={<CalendarOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
        >
          <TabPane tab={`All Users (${users.length})`} key="all" />
          <TabPane tab={`Online (${onlineUsers.length})`} key="online" />
          <TabPane
            tab={`Admins (${users.filter((u) => u.role === "admin").length})`}
            key="admins"
          />
          <TabPane
            tab={`Customers (${users.filter((u) => u.role === "customer").length
              })`}
            key="customers"
          />
        </Tabs>

        {/* Users Table */}
        <Table
          columns={userColumns}
          dataSource={filteredUsers.map((user) => ({
            key: user._id || user.id,
            ...user,
          }))}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Showing ${total} users`,
          }}
          scroll={{ x: 800 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                description={
                  <Text type="secondary">No users match your filters</Text>
                }
              />
            ),
          }}
        />
      </Card>

      {/* User Details & Audit Drawer */}
      <Drawer
        title={
          <Space>
            <Avatar
              size="large"
              style={{
                backgroundColor: selectedUser?.active ? "#52c41a" : "#f5222d",
              }}
              icon={<UserOutlined />}
            />
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedUser?.name || "Unknown"}
              </Title>
              <Text type="secondary">{selectedUser?.email || "No email"}</Text>
            </Space>
          </Space>
        }
        placement="right"
        onClose={() => setUserDrawerVisible(false)}
        open={userDrawerVisible}
        width={900}
      >
        {selectedUser && (
          <>
            {/* User Info */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small" title="User Info">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Role">
                      <Tag color="blue">{selectedUser.role?.toUpperCase()}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Space>
                        <Badge
                          status={
                            onlineUsers.some((u) => u._id === selectedUser._id)
                              ? "success"
                              : "default"
                          }
                          text={
                            onlineUsers.some((u) => u._id === selectedUser._id)
                              ? "Online"
                              : "Offline"
                          }
                        />
                        <Tag color={selectedUser.active ? "green" : "red"}>
                          {selectedUser.active ? "Active" : "Inactive"}
                        </Tag>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Position">
                      {selectedUser.position || "Not specified"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={16}>
                <Card size="small" title="Audit Trail">
                  {isLoadingAudit ? (
                    <Spin tip="Loading audit logs..." />
                  ) : auditError ? (
                    <Alert
                      type="error"
                      message="Failed to load audit logs"
                      description={auditError?.message}
                    />
                  ) : auditLogs.length > 0 ? (
                    <div>
                      <Text strong>{auditLogs.length} audit log(s) found</Text>
                      <Divider />
                      <div style={{ maxHeight: 400, overflow: "auto" }}>
                        {auditLogs.slice(0, 20).map((log, index) => (
                          <Card
                            key={log._id || index}
                            size="small"
                            style={{ marginBottom: 8 }}
                          >
                            <Space
                              direction="vertical"
                              size={0}
                              style={{ width: "100%" }}
                            >
                              <Space>
                                <Tag
                                  color={
                                    actionColorMap[log.action] || "default"
                                  }
                                >
                                  {log.action}
                                </Tag>
                                <Tag
                                  color={
                                    log.status === "success" ? "green" : "red"
                                  }
                                >
                                  {log.status?.toUpperCase()}
                                </Tag>
                              </Space>
                              <Text type="secondary">
                                {dayjs(log.createdAt).format(
                                  "MMM D, YYYY HH:mm:ss"
                                )}
                              </Text>
                              <Text style={{ fontSize: 12 }}>
                                {typeof log.details === "object"
                                  ? JSON.stringify(log.details)
                                  : log.details || "No details"}
                              </Text>
                            </Space>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Empty
                      description={
                        <Text type="secondary">
                          No audit logs found for this user
                        </Text>
                      }
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Drawer>
    </>
  );
};

export default UserAuditTrailPage;