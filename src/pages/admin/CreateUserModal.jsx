import React, { useMemo } from "react";
import { Modal, Input, Select, Form, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "../../styles/creatorDesignSystem.css";

const roleOptions = [
  { value: "rm", label: "Relationship Manager" },
  { value: "approver", label: "Approver" },
  { value: "cocreator", label: "CO Creator" },
  { value: "customer", label: "Customer" },
  { value: "cochecker", label: "CO Checker" },
  { value: "admin", label: "Admin" },
];

const CreateUserModal = ({
  visible,
  loading,
  formData,
  setFormData,
  onCreate,
  onClose,
}) => {
  const roles = useMemo(() => roleOptions, []);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose={false}
      width={550}
      className="admin-page__modal"
      styles={{
        body: { padding: 0 },
        content: { padding: 0, borderRadius: 16 },
      }}
      title={null}
    >
      <div className="admin-page__modal-header">
        <div
          style={{
            width: 44,
            height: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(214, 189, 152, 0.12)",
            border: "1px solid rgba(214, 189, 152, 0.22)",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <UserOutlined style={{ color: "var(--ncb-primary-500)", fontSize: 24 }} />
        </div>
        <h2 className="admin-page__modal-title">Create New User</h2>
        <p className="admin-page__modal-subtitle">
          Add a new account with the required role and credentials without leaving the admin workspace.
        </p>
      </div>

      <div className="admin-page__modal-body">
        <Form layout="vertical" onFinish={onCreate}>
          <Form.Item
            label={<span className="admin-page__field-label">Name</span>}
            name="name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input
              size="large"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter full name"
              className="creator-input"
            />
          </Form.Item>

          <Form.Item
            label={<span className="admin-page__field-label">Email</span>}
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter valid email" },
            ]}
          >
            <Input
              type="email"
              size="large"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
              className="creator-input"
            />
          </Form.Item>

          {formData.role === "customer" && (
            <Form.Item
              label={<span className="admin-page__field-label">Customer Number</span>}
            >
              <Input
                size="large"
                value={formData.customerNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, customerNumber: e.target.value })
                }
                placeholder="e.g. CUST-123456"
                className="creator-input"
              />
            </Form.Item>
          )}

          <Form.Item
            label={<span className="admin-page__field-label">Password</span>}
            name="password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 8, message: "Password must be at least 8 characters" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must include uppercase, lowercase, number & special character (@$!%*?&)",
              },
            ]}
            extra={
              <span
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
                (@$!%*?&)
              </span>
            }
          >
            <Input.Password
              size="large"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="e.g. MyPass123!"
              className="creator-input"
            />
          </Form.Item>

          <Form.Item
            label={<span className="admin-page__field-label">Role</span>}
          >
            <Select
              size="large"
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              options={roles}
              placeholder="Select a role"
              popupMatchSelectWidth={280}
              className="creator-select"
            />
          </Form.Item>

          {formData.role === "approver" && (
            <Form.Item
              label={<span className="admin-page__field-label">Position / Title</span>}
            >
              <Input
                size="large"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="e.g. Head of Business Segment"
                className="creator-input"
              />
            </Form.Item>
          )}

          <div className="admin-page__modal-footer">
            <Button
              onClick={onClose}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              loading={loading}
              className="admin-page__action-button admin-page__action-button--primary"
            >
              Create User
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateUserModal;
