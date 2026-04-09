// /**
//  * Enhanced Audit Trail Viewer Component
//  * Displays comprehensive audit logs with filters, search, and export capabilities
//  * Used in Admin Dashboard for monitoring all user operations
//  */

// import React, { useState, useEffect } from "react";
// import {
//   Table,
//   Card,
//   Tag,
//   DatePicker,
//   Select,
//   Space,
//   Typography,
//   Spin,
//   message,
//   Badge,
//   Button,
//   Row,
//   Col,
//   Input,
//   Drawer,
//   Descriptions,
//   Timeline,
//   Alert,
// } from "antd";
// import {
//   DownloadOutlined,
//   FilterOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";
// import {
//   useGetAuditLogsQuery,
//   useGetAuditLogStatsQuery,
// } from "../../api/auditApi";
// import dayjs from "dayjs";
// import socket from "../../app/socket";

// const { RangePicker } = DatePicker;
// const { Title, Text } = Typography;
// const { Search } = Input;

// const AuditTrailViewer = () => {
//   const [filters, setFilters] = useState({
//     page: 1,
//     limit: 20,
//     action: null,
//     userId: null,
//     resource: null,
//     status: null,
//   });

//   const [dateRange, setDateRange] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [drawerVisible, setDrawerVisible] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [liveLogsCount, setLiveLogsCount] = useState(0);

//   // Fetch audit logs
//   const {
//     data: logsData,
//     isLoading,
//     error,
//     refetch,
//   } = useGetAuditLogsQuery({
//     ...filters,
//     startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
//     endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
//   });

//   // Fetch stats
//   const { data: statsData } = useGetAuditLogStatsQuery();

//   // Real-time updates via socket
//   useEffect(() => {
//     if (!socket.connected) socket.connect();

//     // Listen for new audit logs
//     const handleNewAuditLog = (log) => {
//       console.log("📋 New audit log received:", log);
//       setLiveLogsCount((prev) => prev + 1);
//       refetch(); // Refresh the table
//       message.info({
//         content: `${log.performedBy?.name || "System"} performed: ${
//           log.action
//         }`,
//         duration: 3,
//       });
//     };

//     // Listen for online users
//     const handleOnlineUsers = (users) => {
//       setOnlineUsers(users.map((u) => u._id));
//     };

//     socket.on("new-audit-log", handleNewAuditLog);
//     socket.on("online-users", handleOnlineUsers);

//     return () => {
//       socket.off("new-audit-log", handleNewAuditLog);
//       socket.off("online-users", handleOnlineUsers);
//     };
//   }, [refetch]);

//   console.log("Online Users:", onlineUsers);
//   console.log("Logs Data:", logsData);

//   const handleExport = (format) => {
//     // Using RTK Query to export
//     message.loading({
//       content: `Exporting as ${format.toUpperCase()}...`,
//       duration: 0,
//     });
//     // In a real scenario, you'd trigger the export query here
//     setTimeout(() => {
//       message.success(`${format.toUpperCase()} exported successfully`);
//     }, 1500);
//   };

//   const columns = [
//     {
//       title: "Timestamp",
//       dataIndex: "createdAt",
//       key: "timestamp",
//       width: 180,
//       render: (date) => (
//         <Text>{date ? dayjs(date).format("DD MMM YYYY HH:mm:ss") : "—"}</Text>
//       ),
//       sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
//     },
//     {
//       title: "User",
//       dataIndex: ["performedBy", "name"],
//       key: "user",
//       width: 140,
//       render: (text, record) => {
//         const isOnline =
//           record.performedBy?._id &&
//           onlineUsers.includes(record.performedBy._id);
//         return (
//           <Space>
//             <Text strong>{text || "System"}</Text>
//             {isOnline && <Badge status="success" text="Online" />}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Action",
//       dataIndex: "action",
//       key: "action",
//       width: 150,
//       render: (action) => {
//         const colorMap = {
//           CREATE_USER: "blue",
//           UPDATE_USER: "cyan",
//           DELETE_USER: "red",
//           CHANGE_ROLE: "orange",
//           ACTIVATE_USER: "green",
//           DEACTIVATE_USER: "volcano",
//           LOGIN: "green",
//           LOGOUT: "default",
//           CREATE_DEFERRAL: "blue",
//           APPROVE_DEFERRAL: "green",
//           REJECT_DEFERRAL: "red",
//           CREATE_CHECKLIST: "purple",
//           UPLOAD_FILE: "blue",
//         };
//         return (
//           <Tag color={colorMap[action] || "default"}>{action || "UNKNOWN"}</Tag>
//         );
//       },
//       filters: [
//         { text: "User Operations", value: "user" },
//         { text: "Deferral Operations", value: "deferral" },
//         { text: "Checklist Operations", value: "checklist" },
//       ],
//     },
//     {
//       title: "Resource",
//       dataIndex: "resource",
//       key: "resource",
//       width: 110,
//       render: (resource) => <Tag color="blue">{resource || "SYSTEM"}</Tag>,
//     },
//     {
//       title: "Target",
//       dataIndex: ["targetUser", "name"],
//       key: "target",
//       width: 140,
//       render: (text, record) => {
//         const isOnline =
//           record.targetUser?._id && onlineUsers.includes(record.targetUser._id);
//         return (
//           <Space>
//             <Text>{text || "—"}</Text>
//             {isOnline && record.targetUser && (
//               <Badge status="success" text="Online" />
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       width: 100,
//       render: (status) => (
//         <Tag color={status === "success" ? "green" : "red"}>
//           {status?.toUpperCase() || "UNKNOWN"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Details",
//       key: "action",
//       width: 80,
//       render: (_, record) => (
//         <Button
//           type="link"
//           size="small"
//           onClick={() => {
//             setSelectedLog(record);
//             setDrawerVisible(true);
//           }}
//         >
//           View
//         </Button>
//       ),
//     },
//   ];

//   if (error) {
//     return (
//       <Card style={{ borderRadius: 12 }}>
//         <Title level={4}>Audit Trail</Title>
//         <Alert type="error" message="Failed to load audit logs" />
//       </Card>
//     );
//   }

//   return (
//     <>
//       <Card style={{ borderRadius: 12, marginBottom: 16 }}>
//         <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
//           <Col xs={24} sm={12} md={6}>
//             <Title level={4}>📋 Audit Trail</Title>
//           </Col>
//           <Col xs={24} sm={12} md={18} style={{ textAlign: "right" }}>
//             <Space>
//               <Button
//                 icon={<DownloadOutlined />}
//                 onClick={() => handleExport("csv")}
//               >
//                 Export CSV
//               </Button>
//               <Button
//                 icon={<DownloadOutlined />}
//                 onClick={() => handleExport("pdf")}
//               >
//                 Export PDF
//               </Button>
//             </Space>
//           </Col>
//         </Row>

//         {/* Stats */}
//         {statsData && (
//           <Row gutter={16} style={{ marginBottom: 20 }}>
//             <Col xs={12} sm={6}>
//               <Card size="small" style={{ textAlign: "center" }}>
//                 <Text strong>{statsData.totalLogs || 0}</Text>
//                 <br />
//                 <Text type="secondary">Total Logs</Text>
//               </Card>
//             </Col>
//             <Col xs={12} sm={6}>
//               <Card size="small" style={{ textAlign: "center" }}>
//                 <Text strong>{statsData.todayLogs || 0}</Text>
//                 <br />
//                 <Text type="secondary">Today</Text>
//               </Card>
//             </Col>
//             <Col xs={12} sm={6}>
//               <Card size="small" style={{ textAlign: "center" }}>
//                 <Text strong>{liveLogsCount}</Text>
//                 <br />
//                 <Text type="secondary">Live Updates</Text>
//               </Card>
//             </Col>
//             <Col xs={12} sm={6}>
//               <Card size="small" style={{ textAlign: "center" }}>
//                 <Badge
//                   count={onlineUsers.length}
//                   style={{ backgroundColor: "#52c41a" }}
//                 />
//                 <br />
//                 <Text type="secondary">Online Users</Text>
//               </Card>
//             </Col>
//           </Row>
//         )}

//         {/* Filters */}
//         <Card
//           size="small"
//           style={{ marginBottom: 16, backgroundColor: "#fafafa" }}
//         >
//           <Space wrap style={{ width: "100%" }}>
//             <Search
//               placeholder="Search user, resource, or details"
//               style={{ width: 220 }}
//               icon={<SearchOutlined />}
//               onChange={(e) =>
//                 setFilters((prev) => ({
//                   ...prev,
//                   search: e.target.value,
//                   page: 1,
//                 }))
//               }
//             />
//             <Select
//               placeholder="Filter by Action"
//               style={{ width: 180 }}
//               allowClear
//               onChange={(val) =>
//                 setFilters((prev) => ({ ...prev, action: val, page: 1 }))
//               }
//               options={[
//                 { label: "CREATE_USER", value: "CREATE_USER" },
//                 { label: "UPDATE_USER", value: "UPDATE_USER" },
//                 { label: "CHANGE_ROLE", value: "CHANGE_ROLE" },
//                 { label: "LOGIN", value: "LOGIN" },
//                 { label: "LOGOUT", value: "LOGOUT" },
//                 { label: "CREATE_DEFERRAL", value: "CREATE_DEFERRAL" },
//                 { label: "APPROVE_DEFERRAL", value: "APPROVE_DEFERRAL" },
//               ]}
//             />
//             <Select
//               placeholder="Filter by Resource"
//               style={{ width: 160 }}
//               allowClear
//               onChange={(val) =>
//                 setFilters((prev) => ({ ...prev, resource: val, page: 1 }))
//               }
//               options={[
//                 { label: "USER", value: "USER" },
//                 { label: "DEFERRAL", value: "DEFERRAL" },
//                 { label: "CHECKLIST", value: "CHECKLIST" },
//               ]}
//             />
//             <Select
//               placeholder="Filter by Status"
//               style={{ width: 140 }}
//               allowClear
//               onChange={(val) =>
//                 setFilters((prev) => ({ ...prev, status: val, page: 1 }))
//               }
//               options={[
//                 { label: "Success", value: "success" },
//                 { label: "Failure", value: "failure" },
//               ]}
//             />
//             <RangePicker
//               onChange={(dates) => {
//                 setDateRange(dates);
//                 setFilters((prev) => ({ ...prev, page: 1 }));
//               }}
//             />
//           </Space>
//         </Card>

//         {/* Table */}
//         <Spin spinning={isLoading}>
//           <Table
//             columns={columns}
//             dataSource={(logsData?.logs || []).map((log, idx) => ({
//               key: log._id || idx,
//               ...log,
//             }))}
//             pagination={{
//               current: filters.page,
//               pageSize: filters.limit,
//               total: logsData?.total || 0,
//               onChange: (page) => setFilters((prev) => ({ ...prev, page })),
//               showSizeChanger: true,
//               pageSizeOptions: ["10", "20", "50", "100"],
//             }}
//             scroll={{ x: 1200 }}
//             bordered
//           />
//         </Spin>
//       </Card>

//       {/* Log Details Drawer */}
//       <Drawer
//         title={`Audit Log Details`}
//         placement="right"
//         onClose={() => setDrawerVisible(false)}
//         open={drawerVisible}
//         width={500}
//       >
//         {selectedLog && (
//           <Timeline
//             items={[
//               {
//                 label: "Timestamp",
//                 children: (
//                   <Text>
//                     {dayjs(selectedLog.createdAt).format(
//                       "DD MMM YYYY HH:mm:ss"
//                     )}
//                   </Text>
//                 ),
//               },
//               {
//                 label: "Performed By",
//                 children: (
//                   <Descriptions size="small" column={1}>
//                     <Descriptions.Item label="Name">
//                       {selectedLog.performedBy?.name || "System"}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Email">
//                       {selectedLog.performedBy?.email || "—"}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Role">
//                       <Tag>{selectedLog.performedBy?.role || "—"}</Tag>
//                     </Descriptions.Item>
//                   </Descriptions>
//                 ),
//               },
//               {
//                 label: "Action",
//                 children: (
//                   <Descriptions size="small" column={1}>
//                     <Descriptions.Item label="Action">
//                       <Tag color="blue">{selectedLog.action}</Tag>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Resource">
//                       <Tag>{selectedLog.resource}</Tag>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Resource ID">
//                       <Text code>{selectedLog.resourceId || "—"}</Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Status">
//                       <Tag
//                         color={
//                           selectedLog.status === "success" ? "green" : "red"
//                         }
//                       >
//                         {selectedLog.status?.toUpperCase()}
//                       </Tag>
//                     </Descriptions.Item>
//                   </Descriptions>
//                 ),
//               },
//               {
//                 label: "Target User",
//                 children: selectedLog.targetUser ? (
//                   <Descriptions size="small" column={1}>
//                     <Descriptions.Item label="Name">
//                       {selectedLog.targetUser?.name || "—"}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Email">
//                       {selectedLog.targetUser?.email || "—"}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="New Role">
//                       {selectedLog.targetRole ? (
//                         <Tag>{selectedLog.targetRole}</Tag>
//                       ) : (
//                         "—"
//                       )}
//                     </Descriptions.Item>
//                   </Descriptions>
//                 ) : (
//                   <Text type="secondary">N/A</Text>
//                 ),
//               },
//               {
//                 label: "Details",
//                 children: (
//                   <Text>{selectedLog.details || "No additional details"}</Text>
//                 ),
//               },
//               {
//                 label: "Error (if any)",
//                 children: selectedLog.errorMessage ? (
//                   <Text type="danger">{selectedLog.errorMessage}</Text>
//                 ) : (
//                   <Text type="success">No errors</Text>
//                 ),
//               },
//             ]}
//           />
//         )}
//       </Drawer>
//     </>
//   );
// };

// export default AuditTrailViewer;
// src/pages/admin/UserAuditTrailPage.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  const [auditDrawerVisible, setAuditDrawerVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Hooks
  const { onlineUsers, liveLogs } = useAuditSocket(currentUser);

  // Get all users - FIXED: Use proper query format
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery();

  console.log("Users Data:", usersData);

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

  // Get audit logs for selected user
  // const {
  //   data: auditData,
  //   isLoading: isLoadingAudit,
  //   error: auditError,
  //   refetch: refetchAudit,
  // } = useGetAuditLogsQuery(
  //   selectedUserId
  //     ? {
  //         userId: selectedUserId,
  //         startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
  //         endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
  //         limit: 100,
  //       }
  //     : { skip: true },
  //   { skip: !selectedUserId }
  // );
  const {
    data: auditData,
    isLoading: isLoadingAudit,
    error: auditError,
    refetch: refetchAudit,
  } = useGetAuditLogsQuery(
    {
      userId: selectedUserId,
      startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
      limit: 100,
    }
  );

  console.log("Audit Data:", auditData);
  console.log("Selected User ID:", selectedUserId);

  // Removed auto-select user effect to allow global view
  // useEffect(() => {
  //   if (users.length > 0 && !selectedUserId) {
  //     setSelectedUserId(users[0]._id);
  //     setSelectedUser(users[0]);
  //   }
  // }, [users, selectedUserId]);

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

  console.log("Stats Data:", statsData);
  console.log("Audit loading:", isLoadingAudit);
  console.log("Audit error:", auditError);
  console.log("Audit raw data:", auditData);

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
    console.log("=== DEBUG INFORMATION ===");
    console.log("Users from API:", users);
    console.log("Filtered Users:", filteredUsers);
    console.log("Selected User:", selectedUser);
    console.log("Audit Logs:", auditLogs);
    console.log("Online Users:", onlineUsers);
    console.log("Current User:", currentUser);
    console.log("API Errors:", { usersError, auditError, statsError });
    message.info("Debug information logged to console");
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
