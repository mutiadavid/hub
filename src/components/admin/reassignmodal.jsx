import React, { useState } from "react";
import { Modal, Select, Form, Space, Typography, Alert } from "antd";
import { UserOutlined, SwapOutlined } from "@ant-design/icons";
import "../../styles/creatorDesignSystem.css";

const { Option } = Select;
const { Text } = Typography;

const ReassignModal = ({
    visible,
    onClose,
    onConfirm,
    currentUser,
    availableUsers,
    loading
}) => {
    const [form] = Form.useForm();
    const [selectedUserId, setSelectedUserId] = useState(null);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await onConfirm(currentUser._id, values.newUserId);
            form.resetFields();
            setSelectedUserId(null);
            onClose();
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedUserId(null);
        onClose();
    };

    // Filter users: same role as current user and active only
    const filteredUsers = availableUsers?.filter(
        (user) =>
            user._id !== currentUser?._id &&
            user.active &&
            user.role === currentUser?.role
    ) || [];

    return (
        <Modal
            title={
                <Space size={10}>
                    <SwapOutlined style={{ color: "var(--color-primary-dark)" }} />
                    <span>Reassign User Tasks</span>
                </Space>
            }
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText="Reassign"
            okButtonProps={{ className: "admin-reassign-modal__ok" }}
            cancelButtonProps={{ className: "admin-reassign-modal__cancel" }}
            width={600}
            className="admin-reassign-modal"
        >
            <style>{`
                .admin-reassign-modal .ant-modal-content {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(214, 189, 152, 0.2);
                    box-shadow: 0 20px 45px rgba(17, 24, 39, 0.16);
                }
                .admin-reassign-modal .ant-modal-header {
                    padding: 18px 20px 12px;
                    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
                    background: var(--color-white);
                }
                .admin-reassign-modal .ant-modal-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--color-text-dark);
                }
                .admin-reassign-modal .ant-modal-body {
                    padding: 20px;
                    background: var(--color-bg);
                }
                .admin-reassign-modal .ant-modal-footer {
                    padding: 14px 20px 18px;
                    border-top: 1px solid rgba(214, 189, 152, 0.2);
                    background: var(--color-white);
                }
                .admin-reassign-modal .ant-form-item-label > label {
                    color: var(--color-text-medium);
                    font-size: 12px;
                    font-weight: 600;
                }
                .admin-reassign-modal .ant-select-selector {
                    min-height: 40px !important;
                    border-radius: 6px !important;
                    border: 1px solid rgba(214, 189, 152, 0.2) !important;
                    box-shadow: none !important;
                    padding-top: 4px !important;
                    padding-bottom: 4px !important;
                }
                .admin-reassign-modal__ok.ant-btn {
                    min-height: 34px !important;
                    padding: 0 14px !important;
                    border-radius: 6px !important;
                    border: none !important;
                    background: var(--ncb-primary-500) !important;
                    color: #fff !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    box-shadow: none !important;
                }
                .admin-reassign-modal__cancel.ant-btn {
                    min-height: 34px !important;
                    padding: 0 14px !important;
                    border-radius: 6px !important;
                    border: 1px solid rgba(214, 189, 152, 0.2) !important;
                    background: var(--color-white) !important;
                    color: var(--color-text-medium) !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    box-shadow: none !important;
                }
            `}</style>
            <div style={{ marginBottom: 16 }}>
                <Alert
                    message="Warning"
                    description={
                        <div>
                            <p>This will reassign all pending tasks from:</p>
                            <Text strong>{currentUser?.name}</Text> ({currentUser?.email})
                            <p style={{ marginTop: 8 }}>
                                <Text type="secondary">Role: {currentUser?.role?.toUpperCase()}</Text>
                            </p>
                            <p style={{ marginTop: 8 }}>
                                Including all deferrals, extensions, and checklists currently assigned to this user.
                            </p>
                            <p style={{ marginTop: 8, color: '#ff4d4f' }}>
                                ⚠️ Tasks can only be reassigned to users with the same role ({currentUser?.role}).
                            </p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ borderRadius: 8, border: "1px solid rgba(250, 173, 20, 0.2)" }}
                />
            </div>

            {filteredUsers.length === 0 && (
                <Alert
                    message="No Available Users"
                    description={`No active users found with role "${currentUser?.role}" to reassign tasks to.`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                />
            )}

            <Form form={form} layout="vertical">
                <Form.Item
                    name="newUserId"
                    label="Select New Assignee"
                    rules={[
                        { required: true, message: "Please select a user to reassign tasks to" }
                    ]}
                >
                    <Select
                        placeholder="Select a user"
                        showSearch
                        filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={setSelectedUserId}
                    >
                        {filteredUsers.map((user) => (
                            <Option key={user._id} value={user._id}>
                                {user.name} ({user.email}) - {user.role}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedUserId && (
                    <Alert
                        message="Confirmation"
                        description={
                            <div>
                                All tasks will be transferred to:{" "}
                                <Text strong>
                                    {filteredUsers.find((u) => u._id === selectedUserId)?.name}
                                </Text>
                            </div>
                        }
                        type="info"
                        showIcon
                        style={{ borderRadius: 8 }}
                    />
                )}
            </Form>
        </Modal>
    );
};

export default ReassignModal;