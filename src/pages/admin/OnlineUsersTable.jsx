// // // import React, { useEffect, useState } from "react";
// // // import {
// // //   Table,
// // //   Badge,
// // //   Space,
// // //   Typography,
// // //   Card,
// // //   Select,
// // //   Input,
// // //   Switch,
// // //   Row,
// // //   Col,
// // //   Statistic,
// // //   Button,
// // //   Spin,
// // //   Empty,
// // // } from "antd";
// // // import {
// // //   UserOutlined,
// // //   ReloadOutlined,
// // //   WifiOutlined,
// // //   ClockCircleOutlined,
// // // } from "@ant-design/icons";
// // // import { useGetOnlineUsersQuery } from "../../api/userApi";
// // // import { io } from "socket.io-client";

// // // const { Title, Text } = Typography;
// // // const { Search } = Input;

// // // const socket = io("http://localhost:5000");

// // // const OnlineUsersTable = () => {
// // //   const { data, isLoading, refetch } = useGetOnlineUsersQuery(undefined, {
// // //     pollingInterval: 30000,
// // //   });

// // //   const users = data?.users || [];

// // //   const [viewMode, setViewMode] = useState("all");
// // //   const [filters, setFilters] = useState({
// // //     role: null,
// // //     search: "",
// // //     activeOnly: true,
// // //   });

// // //   // Emit user online after login
// // //   useEffect(() => {
// // //     const currentUser = {
// // //       _id: localStorage.getItem("userId"),
// // //       name: localStorage.getItem("userName"),
// // //       email: localStorage.getItem("userEmail"),
// // //       role: localStorage.getItem("userRole"),
// // //       currentPage: "Dashboard",
// // //     };
// // //     socket.emit("user-online", currentUser);
// // //   }, []);

// // //   // Listen for live updates
// // //   useEffect(() => {
// // //     socket.on("online-users", () => {
// // //       refetch();
// // //     });
// // //     return () => socket.off("online-users");
// // //   }, [refetch]);

// // //   const isUserOnline = (user) => user?.lastSeen;

// // //   const filteredUsers = users.filter((user) => {
// // //     if (viewMode === "online" && !isUserOnline(user)) return false;
// // //     if (filters.role && user.role !== filters.role) return false;
// // //     if (filters.activeOnly && !user.active) return false;
// // //     if (filters.search) {
// // //       const q = filters.search.toLowerCase();
// // //       return (
// // //         user.name?.toLowerCase().includes(q) ||
// // //         user.email?.toLowerCase().includes(q)
// // //       );
// // //     }
// // //     return true;
// // //   });

// // //   const columns = [
// // //     {
// // //       title: "Status",
// // //       width: 120,
// // //       render: (_, record) => (
// // //         <Badge
// // //           status={isUserOnline(record) ? "success" : "default"}
// // //           text={isUserOnline(record) ? "Online" : "Offline"}
// // //         />
// // //       ),
// // //     },
// // //     { title: "User", render: (_, record) => <Text strong>{record.name}</Text> },
// // //     {
// // //       title: "Role",
// // //       dataIndex: "role",
// // //       render: (role) => <Badge>{role?.toUpperCase()}</Badge>,
// // //     },
// // //     {
// // //       title: "Last Seen",
// // //       render: (_, record) => (
// // //         <Space>
// // //           <ClockCircleOutlined />
// // //           <Text>
// // //             {record.lastSeen
// // //               ? new Date(record.lastSeen).toLocaleString()
// // //               : "Never"}
// // //           </Text>
// // //         </Space>
// // //       ),
// // //     },
// // //   ];

// // //   return (
// // //     <Card
// // //       title={
// // //         <Space>
// // //           <UserOutlined />
// // //           <Title level={4} style={{ margin: 0 }}>
// // //             User Activity Monitor
// // //           </Title>
// // //           <Badge count={users.length} />
// // //         </Space>
// // //       }
// // //       extra={
// // //         <Space>
// // //           <Select
// // //             value={viewMode}
// // //             onChange={setViewMode}
// // //             style={{ width: 120 }}
// // //           >
// // //             <Select.Option value="all">All</Select.Option>
// // //             <Select.Option value="online">Online</Select.Option>
// // //           </Select>
// // //           <Search
// // //             placeholder="Search users..."
// // //             allowClear
// // //             onChange={(e) => setFilters({ ...filters, search: e.target.value })}
// // //           />
// // //           <Switch
// // //             checked={filters.activeOnly}
// // //             onChange={(v) => setFilters({ ...filters, activeOnly: v })}
// // //             checkedChildren="Active"
// // //             unCheckedChildren="All"
// // //           />
// // //           <Button icon={<ReloadOutlined />} onClick={refetch} />
// // //         </Space>
// // //       }
// // //     >
// // //       <Row gutter={16} style={{ marginBottom: 16 }}>
// // //         <Col span={8}>
// // //           <Statistic title="Total Users" value={users.length} />
// // //         </Col>
// // //         <Col span={8}>
// // //           <Statistic
// // //             title="Online Now"
// // //             value={users.filter(isUserOnline).length}
// // //             prefix={<WifiOutlined />}
// // //           />
// // //         </Col>
// // //       </Row>

// // //       {isLoading ? (
// // //         <Spin />
// // //       ) : filteredUsers.length === 0 ? (
// // //         <Empty />
// // //       ) : (
// // //         <Table
// // //           rowKey="_id"
// // //           columns={columns}
// // //           dataSource={filteredUsers}
// // //           pagination={{ pageSize: 10 }}
// // //         />
// // //       )}
// // //     </Card>
// // //   );
// // // };

// // // export default OnlineUsersTable;
// // import React, { useEffect, useState } from "react";
// // import {
// //   Table,
// //   Badge,
// //   Space,
// //   Typography,
// //   Card,
// //   Select,
// //   Input,
// //   Switch,
// //   Row,
// //   Col,
// //   Statistic,
// //   Button,
// //   Spin,
// //   Empty,
// // } from "antd";
// // import {
// //   UserOutlined,
// //   ReloadOutlined,
// //   WifiOutlined,
// //   ClockCircleOutlined,
// // } from "@ant-design/icons";
// // import { useGetOnlineUsersQuery } from "../../api/userApi";
// // import { io } from "socket.io-client";

// // const { Title, Text } = Typography;
// // const { Search } = Input;

// // const socket = io("http://localhost:5000");

// // const OnlineUsersTable = () => {
// //   // ================== RTK QUERY ==================
// //   const { data, isLoading, refetch, isError, error } = useGetOnlineUsersQuery(
// //     undefined,
// //     {
// //       pollingInterval: 30000,
// //     }
// //   );

// //   console.log("🧪 Online Users API raw response:", data);
// //   console.log("🧪 Online Users loading:", isLoading);
// //   console.log("🧪 Online Users error:", error);

// //   const users = data?.users || [];
// //   console.log("🧪 Parsed users array:", users);
// //   console.log("🧪 Users count:", users.length);

// //   const [viewMode, setViewMode] = useState("all");
// //   const [filters, setFilters] = useState({
// //     role: null,
// //     search: "",
// //     activeOnly: true,
// //   });

// //   // ================== EMIT USER ONLINE ==================
// //   useEffect(() => {
// //     const currentUser = {
// //       _id: localStorage.getItem("userId"),
// //       name: localStorage.getItem("userName"),
// //       email: localStorage.getItem("userEmail"),
// //       role: localStorage.getItem("userRole"),
// //       currentPage: "Dashboard",
// //     };
// //     console.log("📡 Emitting user-online:", currentUser);
// //     socket.emit("user-online", currentUser);
// //   }, []);

// //   // ================== SOCKET LISTENER ==================
// //   useEffect(() => {
// //     const handleOnlineUsers = (updatedUsers) => {
// //       console.log("📶 Socket received online-users event:", updatedUsers);
// //       refetch();
// //     };

// //     socket.on("online-users", handleOnlineUsers);
// //     return () => socket.off("online-users", handleOnlineUsers);
// //   }, [refetch]);

// //   // ================== HELPERS ==================
// //   const isUserOnline = (user) => !!user?.lastSeen;

// //   // ================== FILTER USERS ==================
// //   const filteredUsers = users.filter((user) => {
// //     if (viewMode === "online" && !isUserOnline(user)) return false;
// //     if (filters.role && user.role !== filters.role) return false;
// //     if (filters.activeOnly && !user.active) return false;
// //     if (filters.search) {
// //       const q = filters.search.toLowerCase();
// //       return (
// //         user.name?.toLowerCase().includes(q) ||
// //         user.email?.toLowerCase().includes(q)
// //       );
// //     }
// //     return true;
// //   });

// //   console.log("🔎 Filtered users array:", filteredUsers);
// //   console.log("🔎 Filtered users count:", filteredUsers.length);

// //   // ================== TABLE COLUMNS ==================
// //   const columns = [
// //     {
// //       title: "Status",
// //       width: 120,
// //       render: (_, record) => (
// //         <Badge
// //           status={isUserOnline(record) ? "success" : "default"}
// //           text={isUserOnline(record) ? "Online" : "Offline"}
// //         />
// //       ),
// //     },
// //     { title: "User", render: (_, record) => <Text strong>{record.name}</Text> },
// //     {
// //       title: "Role",
// //       dataIndex: "role",
// //       render: (role) => <Badge>{role?.toUpperCase()}</Badge>,
// //     },
// //     {
// //       title: "Last Seen",
// //       render: (_, record) => (
// //         <Space>
// //           <ClockCircleOutlined />
// //           <Text>
// //             {record.lastSeen
// //               ? new Date(record.lastSeen).toLocaleString()
// //               : "Never"}
// //           </Text>
// //         </Space>
// //       ),
// //     },
// //   ];

// //   // ================== UI ==================
// //   return (
// //     <Card
// //       title={
// //         <Space>
// //           <UserOutlined />
// //           <Title level={4} style={{ margin: 0 }}>
// //             User Activity Monitor
// //           </Title>
// //           <Badge count={users.length} />
// //         </Space>
// //       }
// //       extra={
// //         <Space>
// //           <Select
// //             value={viewMode}
// //             onChange={setViewMode}
// //             style={{ width: 120 }}
// //           >
// //             <Select.Option value="all">All</Select.Option>
// //             <Select.Option value="online">Online</Select.Option>
// //           </Select>
// //           <Search
// //             placeholder="Search users..."
// //             allowClear
// //             onChange={(e) => setFilters({ ...filters, search: e.target.value })}
// //           />
// //           <Switch
// //             checked={filters.activeOnly}
// //             onChange={(v) => setFilters({ ...filters, activeOnly: v })}
// //             checkedChildren="Active"
// //             unCheckedChildren="All"
// //           />
// //           <Button icon={<ReloadOutlined />} onClick={refetch} />
// //         </Space>
// //       }
// //     >
// //       <Row gutter={16} style={{ marginBottom: 16 }}>
// //         <Col span={8}>
// //           <Statistic title="Total Users" value={users.length} />
// //         </Col>
// //         <Col span={8}>
// //           <Statistic
// //             title="Online Now"
// //             value={users.filter(isUserOnline).length}
// //             prefix={<WifiOutlined />}
// //           />
// //         </Col>
// //       </Row>

// //       {isLoading ? (
// //         <Spin />
// //       ) : filteredUsers.length === 0 ? (
// //         <Empty />
// //       ) : (
// //         <Table
// //           rowKey="_id"
// //           columns={columns}
// //           dataSource={filteredUsers}
// //           pagination={{ pageSize: 10 }}
// //         />
// //       )}
// //     </Card>
// //   );
// // };

// // export default OnlineUsersTable;
// import React, { useEffect, useState } from "react";
// import {
//   Table,
//   Badge,
//   Space,
//   Typography,
//   Card,
//   Select,
//   Input,
//   Switch,
//   Row,
//   Col,
//   Statistic,
//   Button,
//   Spin,
//   Empty,
// } from "antd";
// import {
//   UserOutlined,
//   ReloadOutlined,
//   WifiOutlined,
//   ClockCircleOutlined,
// } from "@ant-design/icons";
// import { useGetOnlineUsersQuery } from "../../api/userApi";
// import { io } from "socket.io-client";

// const { Title, Text } = Typography;
// const { Search } = Input;

// // Connect to your backend socket
// const socket = io("http://localhost:5000");

// const OnlineUsersTable = () => {
//   /* ================= RTK QUERY ================= */
//   const { data, isLoading, error, refetch } = useGetOnlineUsersQuery(
//     undefined,
//     {
//       pollingInterval: 30000,
//       refetchOnMountOrArgChange: true,
//     }
//   );

//   console.log("🧪 Online Users API raw response:", data);
//   console.log("🧪 Online Users loading:", isLoading);
//   console.log("🧪 Online Users error:", error);

//   const users = data?.users || [];
//   console.log("🧪 Parsed users array:", users);
//   console.log("🧪 Users count:", users.length);

//   /* ================= LOCAL STATE ================= */
//   const [viewMode, setViewMode] = useState("all"); // all | online
//   const [filters, setFilters] = useState({
//     role: null, // null means all roles
//     search: "",
//     activeOnly: false, // set false because API doesn't return 'active'
//   });

//   /* ================= SOCKET ================= */
//   useEffect(() => {
//     // Emit current user as online
//     const currentUser = {
//       _id: localStorage.getItem("userId"),
//       name: localStorage.getItem("userName"),
//       email: localStorage.getItem("userEmail"),
//       role: localStorage.getItem("userRole"),
//       currentPage: "Dashboard",
//     };
//     console.log("📡 Emitting user-online:", currentUser);
//     socket.emit("user-online", currentUser);

//     // Listen for online users updates
//     const handleOnlineUsers = () => {
//       console.log("🔄 Received online-users socket event, refetching...");
//       refetch();
//     };

//     socket.on("online-users", handleOnlineUsers);

//     return () => {
//       socket.off("online-users", handleOnlineUsers);
//     };
//   }, [refetch]);

//   /* ================= FILTERING ================= */
//   const isUserOnline = (user) => !!user?.lastSeen;

//   const filteredUsers = users.filter((user) => {
//     console.log("🔹 Filtering user:", user);

//     if (viewMode === "online" && !isUserOnline(user)) {
//       console.log("❌ Skipping (offline)", user.name);
//       return false;
//     }

//     if (filters.role && filters.role !== "all" && user.role !== filters.role) {
//       console.log("❌ Skipping (role mismatch)", user.name);
//       return false;
//     }

//     if (filters.activeOnly && user.active === false) {
//       console.log("❌ Skipping (inactive)", user.name);
//       return false;
//     }

//     if (filters.search) {
//       const q = filters.search.toLowerCase();
//       if (
//         !user.name?.toLowerCase().includes(q) &&
//         !user.email?.toLowerCase().includes(q)
//       ) {
//         console.log("❌ Skipping (search mismatch)", user.name);
//         return false;
//       }
//     }

//     console.log("✅ Including user:", user.name);
//     return true;
//   });

//   console.log("🔎 Filtered users array:", filteredUsers);
//   console.log("🔎 Filtered users count:", filteredUsers.length);

//   /* ================= TABLE COLUMNS ================= */
//   const columns = [
//     {
//       title: "Status",
//       width: 120,
//       render: (_, record) => (
//         <Badge
//           status={isUserOnline(record) ? "success" : "default"}
//           text={isUserOnline(record) ? "Online" : "Offline"}
//         />
//       ),
//     },
//     {
//       title: "User",
//       render: (_, record) => (
//         <Space direction="vertical" size={0}>
//           <Text strong>{record.name}</Text>
//           <Text type="secondary" style={{ fontSize: 12 }}>
//             {record.email}
//           </Text>
//         </Space>
//       ),
//     },
//     {
//       title: "Role",
//       dataIndex: "role",
//       render: (role) => <Badge>{role?.toUpperCase()}</Badge>,
//     },
//     {
//       title: "Last Seen",
//       render: (_, record) => (
//         <Space>
//           <ClockCircleOutlined />
//           <Text>
//             {record.lastSeen
//               ? new Date(record.lastSeen).toLocaleString()
//               : "Never"}
//           </Text>
//         </Space>
//       ),
//     },
//   ];

//   /* ================= UI ================= */
//   return (
//     <Card
//       title={
//         <Space>
//           <UserOutlined />
//           <Title level={4} style={{ margin: 0 }}>
//             User Activity Monitor
//           </Title>
//           <Badge count={users.length} />
//         </Space>
//       }
//       extra={
//         <Space>
//           <Select
//             value={viewMode}
//             onChange={setViewMode}
//             style={{ width: 120 }}
//           >
//             <Select.Option value="all">All</Select.Option>
//             <Select.Option value="online">Online</Select.Option>
//           </Select>
//           <Search
//             placeholder="Search users..."
//             allowClear
//             onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//           />
//           <Switch
//             checked={filters.activeOnly}
//             onChange={(v) => setFilters({ ...filters, activeOnly: v })}
//             checkedChildren="Active"
//             unCheckedChildren="All"
//           />
//           <Button icon={<ReloadOutlined />} onClick={refetch} />
//         </Space>
//       }
//     >
//       <Row gutter={16} style={{ marginBottom: 16 }}>
//         <Col span={8}>
//           <Statistic title="Total Users" value={users.length} />
//         </Col>
//         <Col span={8}>
//           <Statistic
//             title="Online Now"
//             value={users.filter(isUserOnline).length}
//             prefix={<WifiOutlined />}
//           />
//         </Col>
//       </Row>

//       {isLoading ? (
//         <Spin />
//       ) : filteredUsers.length === 0 ? (
//         <Empty description="No users match the filter." />
//       ) : (
//         <Table
//           rowKey="_id"
//           columns={columns}
//           dataSource={filteredUsers}
//           pagination={{ pageSize: 10 }}
//         />
//       )}
//     </Card>
//   );
// };

// export default OnlineUsersTable;
import React, { useEffect, useState } from "react";
import {
  Table,
  Badge,
  Space,
  Typography,
  Card,
  Select,
  Input,
  Switch,
  Row,
  Col,
  Statistic,
  Button,
  Spin,
  Empty,
} from "antd";
import {
  UserOutlined,
  ReloadOutlined,
  WifiOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useGetOnlineUsersQuery } from "../../api/userApi";
import socket from "../../app/socket";

const { Title, Text } = Typography;
const { Search } = Input;

const OnlineUsersTable = () => {
  // RTK Query to fetch online users initially
  const { data, isLoading, refetch } = useGetOnlineUsersQuery(undefined, {
    pollingInterval: 30000, // refresh every 30 seconds
  });

  const [users, setUsers] = useState(data?.users || []);
  const [viewMode, setViewMode] = useState("all");
  const [filters, setFilters] = useState({
    role: null,
    search: "",
    activeOnly: false,
  });

  // 🔹 Emit current user online on mount (ensure socket is connected)
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const currentUser = {
      _id: localStorage.getItem("userId"),
      name: localStorage.getItem("userName"),
      email: localStorage.getItem("userEmail"),
      role: localStorage.getItem("userRole"),
      currentPage: "Dashboard",
      lastSeen: new Date(),
    };
    // Emit mainly to update status, handled by layout too but safe to repeat
    socket.emit("user-online", currentUser);
  }, []);

  // 🔹 Listen for live online users updates from backend
  useEffect(() => {
    const handleOnlineUsers = (onlineUsers) => {
      console.log("🟢 Online users updated via socket:", onlineUsers);

      // If it's an array, replace the full list
      if (Array.isArray(onlineUsers)) {
        setUsers(onlineUsers);
      } else if (typeof onlineUsers === "object") {
        // If it's a single user object, merge it into the list
        setUsers((prevUsers) => {
          const userIndex = prevUsers.findIndex(
            (u) => u._id === onlineUsers._id
          );
          if (userIndex >= 0) {
            // Update existing user
            const updated = [...prevUsers];
            updated[userIndex] = { ...updated[userIndex], ...onlineUsers };
            return updated;
          } else {
            // Add new user
            return [...prevUsers, onlineUsers];
          }
        });
      }
    };

    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, []);

  // 🔹 Sync RTK Query response with state
  useEffect(() => {
    if (data?.users && Array.isArray(data.users)) {
      console.log("📄 Online Users API raw response:", data);
      // Merge API data with socket data to avoid losing any users
      setUsers((prevUsers) => {
        const newUsers = data.users;
        // If socket already has users, merge them
        if (prevUsers.length > 0) {
          const merged = newUsers.reduce((acc, apiUser) => {
            const existingIndex = acc.findIndex((u) => u._id === apiUser._id);
            if (existingIndex >= 0) {
              // Update with API data (more authoritative)
              acc[existingIndex] = { ...acc[existingIndex], ...apiUser };
            } else {
              acc.push(apiUser);
            }
            return acc;
          }, prevUsers);
          return merged;
        }
        return newUsers;
      });
    }
  }, [data]);

  // 🔹 Helper to check online
  const isUserOnline = (user) => !!user.lastSeen;

  // 🔹 Filter users
  // const filteredUsers = users.filter((user) => {
  //   if (viewMode === "online" && !isUserOnline(user)) return false;
  //   if (filters.role && user.role !== filters.role) return false;
  //   if (filters.activeOnly && !user.active) return false;
  //   if (filters.search) {
  //     const q = filters.search.toLowerCase();
  //     return (
  //       user.name?.toLowerCase().includes(q) ||
  //       user.email?.toLowerCase().includes(q)
  //     );
  //   }
  //   return true;
  // });

  const filteredUsers = users.filter((user) => {
    // Online filter
    if (viewMode === "online" && !isUserOnline(user)) return false;

    // Role filter
    if (filters.role && user.role !== filters.role) return false;

    // Remove activeOnly filter because backend doesn't send `active`
    // if (filters.activeOnly && !user.active) return false;

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  console.log("🔎 Filtered users array:", filteredUsers);
  console.log("🔎 Filtered users count:", filteredUsers.length);

  const columns = [
    {
      title: "Status",
      width: 120,
      render: (_, record) => (
        <Badge
          status={isUserOnline(record) ? "success" : "default"}
          text={isUserOnline(record) ? "Online" : "Offline"}
        />
      ),
    },
    {
      title: "User",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => <Badge>{role?.toUpperCase()}</Badge>,
    },
    {
      title: "Last Seen",
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          <Text>
            {record.lastSeen
              ? new Date(record.lastSeen).toLocaleString()
              : "Never"}
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <Title level={4} style={{ margin: 0 }}>
            User Activity Monitor
          </Title>
          <Badge count={users.length} />
        </Space>
      }
      extra={
        <Space>
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="online">Online</Select.Option>
          </Select>
          <Search
            placeholder="Search users..."
            allowClear
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Switch
            checked={filters.activeOnly}
            onChange={(v) => setFilters({ ...filters, activeOnly: v })}
            checkedChildren="Active"
            unCheckedChildren="All"
          />
          <Button icon={<ReloadOutlined />} onClick={refetch} />
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic title="Total Users" value={users.length} />
        </Col>
        <Col span={8}>
          <Statistic
            title="Online Now"
            value={users.filter(isUserOnline).length}
            prefix={<WifiOutlined />}
          />
        </Col>
      </Row>

      {isLoading ? (
        <Spin />
      ) : filteredUsers.length === 0 ? (
        <Empty description="No users found" />
      ) : (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredUsers}
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default OnlineUsersTable;       
