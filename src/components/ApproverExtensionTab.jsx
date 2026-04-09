import React, { useState } from "react";
import {
    Card,
    Table,
    Tag,
    Button,
    Empty,
    Spin,
    Row,
    Col,
    Space,
    Popover,
    Timeline,
    Descriptions,
    Divider,
    Modal,
    Form,
    Input,
    message,
    Progress,
    Tooltip,
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const PRIMARY_BLUE = "#164679";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

const ApproverExtensionTab = ({
    extensions,
    loading,
    onApprove,
    onReject,
    approvingId,
    rejectingId,
    tabType = "queue" // 'queue' or 'actioned'
}) => {
    const [selectedExtension, setSelectedExtension] = useState(null);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [approvalForm] = Form.useForm();
    const [rejectionForm] = Form.useForm();

    const handleApproveClick = (extension) => {
        setSelectedExtension(extension);
        setApprovalModalOpen(true);
    };

    const handleRejectClick = (extension) => {
        setSelectedExtension(extension);
        setRejectionModalOpen(true);
    };

    const handleApprovalSubmit = async (values) => {
        try {
            await onApprove(selectedExtension._id, values.comment);
            message.success("Extension approved successfully");
            setApprovalModalOpen(false);
            approvalForm.resetFields();
        } catch (error) {
            message.error(error.message || "Failed to approve extension");
        }
    };

    const handleRejectionSubmit = async (values) => {
        try {
            await onReject(selectedExtension._id, values.reason);
            message.success("Extension rejected successfully");
            setRejectionModalOpen(false);
            rejectionForm.resetFields();
        } catch (error) {
            message.error(error.message || "Failed to reject extension");
        }
    };

    const calculateApprovalProgress = (extension) => {
        if (!extension.approvers || extension.approvers.length === 0) return 0;
        const approved = extension.approvers.filter(
            (a) => a.approvalStatus === "approved"
        ).length;
        return Math.round((approved / extension.approvers.length) * 100);
    };

    const ExtensionDetailsPopover = ({ extension }) => (
        <div style={{ maxWidth: 400 }}>
            <Descriptions size="small" bordered style={{ marginBottom: 12 }}>
                <Descriptions.Item label="Deferral #" span={3}>
                    <strong>{extension.deferralNumber}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Customer" span={3}>
                    {extension.customerName}
                </Descriptions.Item>
                <Descriptions.Item label="Current Days" span={3}>
                    <Tag color="blue">{extension.currentDaysSought}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Requested Days" span={3}>
                    <Tag color="gold">{extension.requestedDaysSought}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Additional" span={3}>
                    <strong style={{ color: WARNING_ORANGE }}>
                        +{extension.requestedDaysSought - extension.currentDaysSought} days
                    </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Reason" span={3}>
                    <span style={{ fontSize: 12 }}>{extension.extensionReason}</span>
                </Descriptions.Item>
            </Descriptions>

            {/* Approvers */}
            <Divider style={{ margin: "8px 0" }} />
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 12 }}>Approvers:</strong>
                <div style={{ fontSize: 11, marginTop: 6 }}>
                    {extension.approvers?.map((approver, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "4px 0",
                            }}
                        >
                            <span>{approver.user?.name || "Unknown"}</span>
                            <Tag
                                color={
                                    approver.approvalStatus === "approved"
                                        ? "success"
                                        : "processing"
                                }
                            >
                                {approver.approvalStatus}
                            </Tag>
                        </div>
                    ))}
                </div>
            </div>

            {/* History */}
            {extension.history && extension.history.length > 0 && (
                <div>
                    <Divider style={{ margin: "8px 0" }} />
                    <strong style={{ fontSize: 12 }}>Timeline:</strong>
                    <Timeline
                        style={{ marginTop: 8, fontSize: 11 }}
                        items={extension.history.slice(0, 5).map((h) => ({
                            color:
                                h.action === "rejected"
                                    ? ERROR_RED
                                    : h.action.includes("approved")
                                        ? SUCCESS_GREEN
                                        : WARNING_ORANGE,
                            children: (
                                <div>
                                    <strong>{h.userName || "System"}</strong><br />
                                    <span style={{ color: "#666" }}>{h.notes}</span><br />
                                    <span style={{ fontSize: 10, color: "#999" }}>
                                        {dayjs(h.createdAt).format("DD MMM HH:mm")}
                                    </span>
                                </div>
                            ),
                        }))}
                    />
                </div>
            )}
        </div>
    );

    const columns = [
        {
            title: "Deferral #",
            dataIndex: "deferralNumber",
            key: "deferralNumber",
            width: 110,
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Customer",
            dataIndex: "customerName",
            key: "customerName",
            width: 140,
            ellipsis: true,
        },
        {
            title: "Days",
            key: "days",
            width: 90,
            render: (_, record) => (
                <Tooltip
                    title={`${record.currentDaysSought} → ${record.requestedDaysSought} days`}
                >
                    <Space size={2}>
                        <Tag color="blue" style={{ fontSize: 11 }}>
                            {record.currentDaysSought}
                        </Tag>
                        <span style={{ fontSize: 10 }}>→</span>
                        <Tag color="gold" style={{ fontSize: 11 }}>
                            {record.requestedDaysSought}
                        </Tag>
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (status) => (
                <Tag
                    color={
                        status === "approved"
                            ? "success"
                            : status === "rejected"
                                ? "error"
                                : "processing"
                    }
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: "Progress",
            key: "progress",
            width: 90,
            render: (_, record) => (
                <Progress
                    type="circle"
                    percent={calculateApprovalProgress(record)}
                    width={30}
                    strokeColor={PRIMARY_BLUE}
                />
            ),
        },
        {
            title: "Requested",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 110,
            render: (date) => dayjs(date).format("DD MMM"),
        },
    ];

    // Add Actions column only for queue tab
    if (tabType === "queue") {
        columns.push({
            title: "Actions",
            key: "actions",
            width: 180,
            fixed: "right",
            render: (_, record) => (
                <Space size={6}>
                    <Popover
                        content={<ExtensionDetailsPopover extension={record} />}
                        title="Extension Details"
                        trigger="click"
                        placement="left"
                    >
                        <Button type="text" size="small">
                            Details
                        </Button>
                    </Popover>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApproveClick(record)}
                        loading={approvingId === record._id}
                        style={{ backgroundColor: SUCCESS_GREEN }}
                    >
                        Approve
                    </Button>
                    <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleRejectClick(record)}
                        loading={rejectingId === record._id}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        });
    } else {
        // For actioned tab, just show details
        columns.push({
            title: "Actions",
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_, record) => (
                <Popover
                    content={<ExtensionDetailsPopover extension={record} />}
                    title="Extension Details"
                    trigger="click"
                    placement="left"
                >
                    <Button type="text" size="small">
                        Details
                    </Button>
                </Popover>
            ),
        });
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <Spin tip="Loading extensions..." />
            </div>
        );
    }

    if (!extensions || extensions.length === 0) {
        return (
            <Empty
                description={
                    tabType === "queue"
                        ? "No pending extensions"
                        : "No actioned extensions"
                }
                style={{ padding: "40px 20px" }}
            />
        );
    }

    return (
        <>
            <Card
                style={{
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <Table
                    columns={columns}
                    dataSource={extensions}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total: ${total} extensions`,
                    }}
                    scroll={{ x: 900 }}
                    size="small"
                />
            </Card>

            {/* Approval Modal */}
            <Modal
                title="Approve Extension Request"
                open={approvalModalOpen}
                onCancel={() => setApprovalModalOpen(false)}
                footer={null}
                width={500}
            >
                {selectedExtension && (
                    <>
                        <Descriptions size="small" bordered style={{ marginBottom: 20 }}>
                            <Descriptions.Item label="Deferral" span={3}>
                                {selectedExtension.deferralNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="Requested" span={3}>
                                {selectedExtension.currentDaysSought} → &nbsp;
                                <strong>{selectedExtension.requestedDaysSought} days</strong>
                            </Descriptions.Item>
                        </Descriptions>

                        <Form
                            form={approvalForm}
                            layout="vertical"
                            onFinish={handleApprovalSubmit}
                        >
                            <Form.Item
                                label="Approval Comment (Optional)"
                                name="comment"
                                rules={[
                                    { max: 500, message: "Comment must not exceed 500 characters" },
                                ]}
                            >
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Add any comments for your approval..."
                                />
                            </Form.Item>
                            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                                <Button onClick={() => setApprovalModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{ backgroundColor: SUCCESS_GREEN }}
                                >
                                    Approve Extension
                                </Button>
                            </Space>
                        </Form>
                    </>
                )}
            </Modal>

            {/* Rejection Modal */}
            <Modal
                title="Reject Extension Request"
                open={rejectionModalOpen}
                onCancel={() => setRejectionModalOpen(false)}
                footer={null}
                width={500}
            >
                {selectedExtension && (
                    <>
                        <Descriptions size="small" bordered style={{ marginBottom: 20 }}>
                            <Descriptions.Item label="Deferral" span={3}>
                                {selectedExtension.deferralNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="Requested" span={3}>
                                {selectedExtension.currentDaysSought} → &nbsp;
                                <strong>{selectedExtension.requestedDaysSought} days</strong>
                            </Descriptions.Item>
                        </Descriptions>

                        <Form
                            form={rejectionForm}
                            layout="vertical"
                            onFinish={handleRejectionSubmit}
                        >
                            <Form.Item
                                label="Reason for Rejection"
                                name="reason"
                                rules={[
                                    { required: true, message: "Please provide a rejection reason" },
                                    { min: 10, message: "Reason must be at least 10 characters" },
                                ]}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Explain why this extension is being rejected..."
                                    maxLength={500}
                                />
                            </Form.Item>
                            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                                <Button onClick={() => setRejectionModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="primary" danger htmlType="submit">
                                    Reject Extension
                                </Button>
                            </Space>
                        </Form>
                    </>
                )}
            </Modal>
        </>
    );
};

export default ApproverExtensionTab;