/**
 * Shared progress section component for displaying document statistics
 * Used by RmReviewChecklistModal, ReviewChecklistModal, and CheckerReviewChecklistModal
 */
import React from "react";
import { Progress } from "antd";
import { calculateDocumentStats, THEME } from "../../utils/checklistUtils";

const PRIMARY_BLUE = THEME?.PRIMARY_BLUE || "#164679";
const SECONDARY_PURPLE = THEME?.SECONDARY_PURPLE || "#7e6496";

/**
 * ProgressSection - Displays document progress statistics in a simple layout
 * @param {Object} props
 * @param {Array} props.docs - Flat array of documents
 */
const ProgressSection = ({ docs = [] }) => {
    const stats = calculateDocumentStats(docs);

    // Calculate counts
    const total = stats.total || 0;
    const submitted = (stats.submitted || 0) + (stats.sighted || 0) + (stats.waived || 0) + (stats.tbo || 0);
    const pending = total - submitted;
    const deferred = stats.deferred || 0;

    // Calculate progress percentage
    const progressPercent = total === 0 ? 0 : Math.round((submitted / total) * 100);

    return (
        <div
            style={{
                padding: "16px",
                background: "#f7f9fc",
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                marginBottom: 18,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
                    Total: {total}
                </div>
                <div style={{ fontWeight: "700", color: "#FF4D4F" }}>
                    Pending: {pending}
                </div>
                <div style={{ fontWeight: "700", color: "#52C41A" }}>
                    Submitted: {submitted}
                </div>
                <div style={{ fontWeight: "700", color: "#FAAD14" }}>
                    Deferred: {deferred}
                </div>
            </div>
            <Progress
                percent={progressPercent}
                strokeColor={{
                    "0%": PRIMARY_BLUE,
                    "100%": "#b5d334",
                }}
                strokeWidth={8}
            />
        </div>
    );
};

export default ProgressSection;
