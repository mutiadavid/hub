/**
 * Shared status tag component for consistent status display
 * Used across all review modals for document and checklist statuses
 */
import React from "react";
import { Tag } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    FileExclamationOutlined,
    MinusCircleOutlined,
    HourglassOutlined,
} from "@ant-design/icons";
import { getStatusConfig } from "../../utils/checklistUtils";
import { getOutlinedTagStyle } from "./tagStyleUtils";

/**
 * Get icon for a given status
 * @param {string} status - The status value
 * @returns {React.ReactNode} Icon component
 */
const getStatusIcon = (status) => {
    const statusLower = (status || "").toLowerCase().replace(/\s+/g, "_");

    const icons = {
        approved: <CheckCircleOutlined />,
        completed: <CheckCircleOutlined />,
        submitted: <SyncOutlined />,
        submitted_for_review: <SyncOutlined />,
        pending: <ClockCircleOutlined />,
        pending_from_customer: <HourglassOutlined />,
        pendingrm: <ClockCircleOutlined />,
        pendingco: <ClockCircleOutlined />,
        rejected: <CloseCircleOutlined />,
        deferred: <FileExclamationOutlined />,
        defferal_requested: <FileExclamationOutlined />,
        waived: <MinusCircleOutlined />,
        expired: <ExclamationCircleOutlined />,
        sighted: <EyeOutlined />,
        tbo: <EyeOutlined />,
        current: <CheckCircleOutlined />,
    };

    return icons[statusLower] || <ClockCircleOutlined />;
};

/**
 * StatusTag - Renders a colored tag for a status value
 * @param {Object} props
 * @param {string} props.status - The status value to display
 * @param {boolean} props.showIcon - Whether to show an icon (default: true)
 * @param {string} props.customLabel - Custom label to display instead of default
 * @param {Object} props.style - Additional inline styles
 * @param {string} props.className - Additional CSS class
 */
const StatusTag = ({
    status,
    showIcon = true,
    customLabel,
    style = {},
    className = "",
}) => {
    const config = getStatusConfig(status);

    return (
        <Tag
            className={`status-tag ${className}`}
            style={{
                ...getOutlinedTagStyle(config.color),
                ...style,
            }}
        >
            {showIcon && getStatusIcon(status)}
            {customLabel || config.label}
        </Tag>
    );
};

/**
 * ExpiryTag - Specific tag for expiry status
 * @param {Object} props
 * @param {string|Date} props.expiryDate - The expiry date
 * @param {boolean} props.showIcon - Whether to show an icon (default: true)
 */
export const ExpiryTag = ({ expiryDate, showIcon = true }) => {
    if (!expiryDate) {
        return (
            <Tag style={getOutlinedTagStyle("default", { fontWeight: 500 })}>
                N/A
            </Tag>
        );
    }

    const now = new Date();
    const expiry = new Date(expiryDate);
    const isExpired = expiry < now;

    return (
        <Tag
            style={getOutlinedTagStyle(isExpired ? "red" : "green")}
        >
            {showIcon && (isExpired ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />)}
            {isExpired ? " Expired" : " Current"}
        </Tag>
    );
};

/**
 * CheckerStatusTag - Specific tag for checker decision status
 * @param {Object} props
 * @param {string} props.status - The checker status (approved/rejected/pending)
 */
export const CheckerStatusTag = ({ status }) => {
    const statusLower = (status || "pending").toLowerCase();

    let config = {
        approved: { color: "green", icon: <CheckCircleOutlined />, label: "Approved" },
        rejected: { color: "red", icon: <CloseCircleOutlined />, label: "Rejected" },
        pending: { color: "orange", icon: <ClockCircleOutlined />, label: "Pending" },
    };

    const { color, icon, label } = config[statusLower] || config.pending;

    return (
        <Tag
            style={getOutlinedTagStyle(color)}
        >
            {icon} {label}
        </Tag>
    );
};

export default StatusTag;
