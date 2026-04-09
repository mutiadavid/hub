// // export default CreateUserDrawer;
// import React, { useMemo } from "react";
// import { Drawer, Input, Select, Form, Button } from "antd";

// const roleOptions = [
//   { value: "rm", label: "Relationship Manager" },
//   { value: "cocreator", label: "CO Creator" },
//   { value: "cochecker", label: "CO Checker" },
//   { value: "admin", label: "Admin" },
//   { value: "customer", label: "Customer" },
// ];

// const CreateUserDrawer = ({
//   visible = false,
//   loading = false,
//   formData = {},
//   setFormData = () => {},
//   onCreate = () => {},
//   onClose = () => {},
// }) => {
//   const roles = useMemo(() => roleOptions, []);

//   return (
//     <Drawer
//       title={
//         <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
//           Create New User
//         </span>
//       }
//       placement="right"
//       width={360}
//       open={visible}
//       onClose={onClose}
//       className="dark:bg-gray-900"
//       bodyStyle={{ paddingBottom: 80 }}
//     >
//       <Form layout="vertical" onFinish={onCreate}>
//         {/* NAME */}
//         <Form.Item label="Name" required>
//           <Input
//             value={formData?.name || ""}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             className="dark:bg-gray-800 dark:text-gray-100"
//           />
//         </Form.Item>

//         {/* EMAIL */}
//         <Form.Item label="Email" required>
//           <Input
//             type="email"
//             value={formData?.email || ""}
//             onChange={(e) =>
//               setFormData({ ...formData, email: e.target.value })
//             }
//             className="dark:bg-gray-800 dark:text-gray-100"
//           />
//         </Form.Item>

//         {/* PASSWORD */}
//         <Form.Item label="Password" required>
//           <Input.Password
//             value={formData?.password || ""}
//             onChange={(e) =>
//               setFormData({ ...formData, password: e.target.value })
//             }
//             className="dark:bg-gray-800 dark:text-gray-100"
//           />
//         </Form.Item>

//         {/* ROLE */}
//         <Form.Item label="Role">
//           <Select
//             value={formData?.role || "rm"}
//             onChange={(value) => setFormData({ ...formData, role: value })}
//             options={roles}
//             className="dark:bg-gray-800 dark:text-gray-100"
//           />
//         </Form.Item>

//         {/* BUTTON */}
//         <Button
//           htmlType="submit"
//           type="primary"
//           block
//           loading={loading}
//           className="bg-gray-700 dark:bg-gray-600 text-white"
//         >
//           Create User
//         </Button>
//       </Form>
//     </Drawer>
//   );
// };

// export default CreateUserDrawer;
// export default CreateUserDrawer;
import React, { useMemo } from "react";
import { Drawer, Input, Select, Form, Button, Typography, Space } from "antd";
import { UserAddOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const roleOptions = [
  { value: "rm", label: "Relationship Manager" },
  { value: "cocreator", label: "CO Creator" },
  { value: "cochecker", label: "CO Checker" },
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer" },
];

const CreateUserDrawer = ({
  visible = false,
  loading = false,
  formData = {},
  setFormData = () => {},
  onCreate = () => {},
  onClose = () => {},
}) => {
  const roles = useMemo(() => roleOptions, []);

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #2d7a99 0%, #164679 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserAddOutlined style={{ color: "white", fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
              Create New User
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Add a new user to the system
            </Text>
          </div>
        </div>
      }
      placement="right"
      width={420}
      open={visible}
      onClose={onClose}
      styles={{
        body: {
          paddingBottom: 100,
          background: "#f5f7fa",
        },
        header: {
          background: "linear-gradient(135deg, #164679 0%, #2d7a99 100%)",
          borderBottom: "1px solid #e0e7ff",
          padding: "16px 24px",
        },
        title: {
          color: "white",
        },
      }}
      headerStyle={{
        background: "linear-gradient(135deg, #164679 0%, #2d7a99 100%)",
        borderBottom: "1px solid #4a90c4",
      }}
    >
      <Form layout="vertical" onFinish={onCreate}>
        {/* NAME */}
        <Form.Item
          label={
            <Text strong style={{ color: "#374151" }}>
              Full Name
            </Text>
          }
          required
          className="mb-4"
        >
          <Input
            size="large"
            prefix={<span style={{ color: "#9ca3af" }}>👤</span>}
            value={formData?.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            style={{
              borderRadius: "8px",
              borderColor: "#e5e7eb",
            }}
          />
        </Form.Item>

        {/* EMAIL */}
        <Form.Item
          label={
            <Text strong style={{ color: "#374151" }}>
              Email Address
            </Text>
          }
          required
          className="mb-4"
        >
          <Input
            type="email"
            size="large"
            prefix={<span style={{ color: "#9ca3af" }}>✉️</span>}
            value={formData?.email || ""}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="user@example.com"
            style={{
              borderRadius: "8px",
              borderColor: "#e5e7eb",
            }}
          />
        </Form.Item>

        {/* PASSWORD */}
        <Form.Item
          label={
            <Text strong style={{ color: "#374151" }}>
              Password
            </Text>
          }
          required
          className="mb-4"
        >
          <Input.Password
            size="large"
            prefix={<span style={{ color: "#9ca3af" }}>🔒</span>}
            value={formData?.password || ""}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Enter secure password"
            style={{
              borderRadius: "8px",
              borderColor: "#e5e7eb",
            }}
          />
        </Form.Item>

        {/* ROLE */}
        <Form.Item
          label={
            <Text strong style={{ color: "#374151" }}>
              Assign Role
            </Text>
          }
          className="mb-4"
        >
          <Select
            size="large"
            value={formData?.role || "customer"}
            onChange={(value) => setFormData({ ...formData, role: value })}
            options={roles}
            placeholder="Select user role"
            style={{
              borderRadius: "8px",
            }}
          />
        </Form.Item>

        {/* BUTTONS */}
        <Space style={{ width: "100%", marginTop: "24px" }}>
          <Button onClick={onClose} size="large" style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            htmlType="submit"
            type="primary"
            size="large"
            loading={loading}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #2d7a99 0%, #164679 100%)",
              border: "none",
              fontWeight: "600",
            }}
          >
            Create User
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};

export default CreateUserDrawer;
