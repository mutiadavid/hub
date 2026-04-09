// import React from "react";
// import { Card, Row, Col, Table, Tag } from "antd";
// import {
//   UserOutlined,
//   CheckCircleOutlined,
//   TeamOutlined,
// } from "@ant-design/icons";

// const DashboardSummary = ({ users = [], auditLogs = [] }) => {
//   // --- SUMMARY METRICS ---
//   const totalUsers = users.length;
//   const activeUsers = users.filter((u) => u.active).length;
//   const coCreators = users.filter((u) => u.role === "cocreator").length;
//   const rmUsers = users.filter((u) => u.role === "rm").length;

//   // --- AUDIT LOG TABLE ---
//   const auditColumns = [
//     { title: "Action", dataIndex: "action", key: "action" },
//     { title: "User", dataIndex: "user", key: "user" },
//     { title: "Target User", dataIndex: "targetUser", key: "targetUser" },
//     {
//       title: "Date",
//       dataIndex: "date",
//       key: "date",
//       render: (d) => new Date(d).toLocaleString(),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => (
//         <Tag color={status === "success" ? "green" : "volcano"}>{status}</Tag>
//       ),
//     },
//   ];

//   return (
//     <div className="p-4">
//       {/* --- CARDS --- */}
//       <Row gutter={[16, 16]} className="mb-6">
//         <Col xs={24} sm={12} md={6}>
//           <Card
//             title="Total Users"
//             bordered={false}
//             className="bg-white dark:bg-gray-900 text-center shadow-md"
//           >
//             <UserOutlined style={{ fontSize: 32 }} />
//             <div className="text-2xl mt-2">{totalUsers}</div>
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} md={6}>
//           <Card
//             title="Active Users"
//             bordered={false}
//             className="bg-white dark:bg-gray-900 text-center shadow-md"
//           >
//             <CheckCircleOutlined style={{ fontSize: 32, color: "green" }} />
//             <div className="text-2xl mt-2">{activeUsers}</div>
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} md={6}>
//           <Card
//             title="Co-Creators"
//             bordered={false}
//             className="bg-white dark:bg-gray-900 text-center shadow-md"
//           >
//             <TeamOutlined style={{ fontSize: 32, color: "purple" }} />
//             <div className="text-2xl mt-2">{coCreators}</div>
//           </Card>
//         </Col>

//         <Col xs={24} sm={12} md={6}>
//           <Card
//             title="RMs"
//             bordered={false}
//             className="bg-white dark:bg-gray-900 text-center shadow-md"
//           >
//             <TeamOutlined style={{ fontSize: 32, color: "blue" }} />
//             <div className="text-2xl mt-2">{rmUsers}</div>
//           </Card>
//         </Col>
//       </Row>

//       {/* --- AUDIT LOG TABLE --- */}
//       <div>
//         <h2 className="text-lg font-semibold dark:text-gray-200 mb-2">
//           Audit Logs
//         </h2>
//         <Table
//           rowKey={(record) => record._id || record.id}
//           columns={auditColumns}
//           dataSource={auditLogs}
//           pagination={{ pageSize: 6 }}
//           bordered
//           className="rounded-lg dark:bg-gray-900 dark:text-gray-200"
//         />
//       </div>
//     </div>
//   );
// };

// export default DashboardSummary;
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Spin,
  Alert,
  Tag,
  Tooltip,
  Tabs,
  Button,
  Modal,
  Select,
  Badge,
} from "antd";
import { generateAuditPDF } from "../../utils/reportGenerator";

const { TabPane } = Tabs;
const { Option } = Select;

const DashboardSummary = ({
  auditLogs = [],
  users = [],
  loading = false,
  socket,
}) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleFilter, setRoleFilter] = useState(null);

  // ================= SOCKET: Live online users =================
  useEffect(() => {
    if (!socket) return;

    // Listen for online users from server
    const handleOnlineUsers = (usersArray) => {
      // usersArray = [{ _id, name, email, role, lastSeen }]
      setOnlineUsers(usersArray || []);
    };

    socket.on("online-users", handleOnlineUsers);

    return () => socket.off("online-users", handleOnlineUsers);
  }, [socket]);

  // ================= Normalize users =================
  const normalizedUsers = useMemo(
    () => users.map((u) => ({ ...u, _id: u._id || u.id })),
    [users]
  );

  // ================= Merge online status =================
  const activeUsers = useMemo(() => {
    return normalizedUsers.map((u) => {
      const online = onlineUsers.find((o) => o._id === u._id || o.id === u._id);
      return {
        ...u,
        isOnline: Boolean(online),
        lastSeen: online?.lastSeen || null,
      };
    });
  }, [normalizedUsers, onlineUsers]);

  // ================= Prepare table data =================
  const tableData = useMemo(() => {
    return activeUsers.map((user) => {
      const userLogs = auditLogs.filter(
        (l) =>
          l.performedBy?._id === user._id || l.performedBy?.name === user.name
      );
      return {
        key: user._id,
        user,
        userName: user.name,
        userRole: user.role,
        activity: userLogs.length
          ? userLogs.map((l) => l.action).join(", ")
          : "—",
        status: userLogs[0]?.status || "success",
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        logs: userLogs,
      };
    });
  }, [activeUsers, auditLogs]);

  // ================= Filter + sort =================
  const filteredLiveUsers = useMemo(() => {
    let filtered = roleFilter
      ? tableData.filter(
          (u) => u.userRole?.toLowerCase() === roleFilter.toLowerCase()
        )
      : [...tableData];

    // Online users first
    filtered.sort((a, b) =>
      a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1
    );
    return filtered;
  }, [tableData, roleFilter]);

  // ================= Columns =================
  const userColumns = [
    {
      title: "User",
      dataIndex: "userName",
      render: (_, r) => (
        <Tooltip title={r.user.email}>
          <Button
            type="link"
            onClick={() => {
              setSelectedUser(r);
              setModalVisible(true);
            }}
          >
            {r.userName}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Role",
      dataIndex: "userRole",
      render: (r) => <Tag color="blue">{r.toUpperCase()}</Tag>,
    },
    { title: "Activity", dataIndex: "activity" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "success" ? "green" : "volcano"}>
          {s?.toUpperCase() || "—"}
        </Tag>
      ),
    },
    {
      title: "Online",
      render: (_, r) => (
        <Badge
          status={r.isOnline ? "success" : "default"}
          text={
            r.isOnline
              ? "Online"
              : r.lastSeen
              ? `Last seen: ${new Date(r.lastSeen).toLocaleString()}`
              : "Offline"
          }
        />
      ),
    },
  ];

  const historicalColumns = [
    { title: "User", render: (_, rec) => rec.performedBy?.name || "—" },
    { title: "Action", dataIndex: "action" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "success" ? "green" : "volcano"}>
          {s?.toUpperCase() || "—"}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (d) => (d ? new Date(d).toLocaleString() : "—"),
    },
  ];

  const exportPDF = (logs, title) => {
    generateAuditPDF(logs, title);
  };

  if (loading)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );
  if (!users.length) return <Alert type="warning" message="No users found" />;

  return (
    <>
      <Tabs defaultActiveKey="0">
        <TabPane tab="Live Users" key="0">
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Select
              placeholder="Filter by role"
              style={{ width: 200 }}
              allowClear
              onChange={setRoleFilter}
            >
              {["admin", "rm", "cocreator", "cochecker"].map((r) => (
                <Option key={r} value={r}>
                  {r.toUpperCase()}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              onClick={() => exportPDF(filteredLiveUsers, "Live Users")}
            >
              Export PDF
            </Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={filteredLiveUsers}
            bordered
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane tab="Historical Logs" key="1">
          <Button
            type="primary"
            style={{ marginBottom: 12 }}
            onClick={() => exportPDF(auditLogs, "Historical Audit Logs")}
          >
            Export PDF
          </Button>
          <Table
            columns={historicalColumns}
            dataSource={auditLogs.map((log, idx) => ({ key: idx, ...log }))}
            bordered
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>

      <Modal
        open={modalVisible}
        title={`${selectedUser?.userName} – Audit Timeline`}
        footer={null}
        width={800}
        onCancel={() => setModalVisible(false)}
      >
        {selectedUser?.logs?.length ? (
          selectedUser.logs.map((l, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <Tag>{l.action}</Tag>{" "}
              <Tag color={l.status === "success" ? "green" : "volcano"}>
                {l.status}
              </Tag>
              <div style={{ fontSize: 12, color: "#888" }}>
                {new Date(l.createdAt || l.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <Alert type="info" message="No audit logs found" />
        )}
      </Modal>
    </>
  );
};

export default DashboardSummary;
