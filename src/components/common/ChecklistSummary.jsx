import React, { useMemo } from "react";
import { Card, Progress } from "antd";

const GREEN = "#52c41a";
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";

// Helper to calculate stats
export const calculateDocumentStats = (docs) => {
    if (!docs) return {};

    const total = docs.length;

    const submitted = docs.filter(d =>
        d.status?.toLowerCase() === "submitted" || d.action?.toLowerCase() === "submitted" || d.coStatus?.toLowerCase() === "submitted" || d.rmStatus?.toLowerCase() === "appoved" || d.checkerStatus?.toLowerCase() === "approved"
    ).length;

    const pendingFromRM = docs.filter(d =>
        d.status?.toLowerCase() === "pendingrm" || d.action?.toLowerCase() === "pendingrm" || d.coStatus?.toLowerCase() === "pendingrm"
    ).length;

    const pendingFromCo = docs.filter(d =>
        d.status?.toLowerCase() === "pendingco" || d.action?.toLowerCase() === "pendingco" || d.coStatus?.toLowerCase() === "pendingco"
    ).length;

    const deferred = docs.filter(d =>
        d.status?.toLowerCase() === "deferred" || d.action?.toLowerCase() === "deferred" || d.coStatus?.toLowerCase() === "deferred" || d.rmStatus?.toLowerCase() === "deferred"
    ).length;

    const sighted = docs.filter(d =>
        d.status?.toLowerCase() === "sighted" || d.action?.toLowerCase() === "sighted"
    ).length;

    const waived = docs.filter(d =>
        d.status?.toLowerCase() === "waived" || d.action?.toLowerCase() === "waived"
    ).length;

    const tbo = docs.filter(d =>
        d.status?.toLowerCase() === "tbo" || d.action?.toLowerCase() === "tbo"
    ).length;

    // Checker specific stats
    const checkerApproved = docs.filter(d =>
        d.checkerStatus?.toLowerCase() === "approved"
    ).length;

    const checkerRejected = docs.filter(d =>
        d.checkerStatus?.toLowerCase() === "rejected"
    ).length;

    const checkerPending = docs.filter(d =>
        !d.checkerStatus || ["pending", "not reviewed", ""].includes((d.checkerStatus || "").toLowerCase())
    ).length;

    // Calculate progress based on role context roughly, or just general completion
    // For Checker, completion is Reviewed (Approved + Rejected) / Total
    const checkerReviewed = checkerApproved + checkerRejected;

    // Logic: if any checker stats exist, show checker progress, else show submission progress
    const isCheckerContext = checkerApproved > 0 || checkerRejected > 0 || String(docs[0]?.checkerStatus || "").length > 0;

    let progressPercent = 0;
    if (isCheckerContext && total > 0) {
        progressPercent = Math.round((checkerReviewed / total) * 100);
    } else if (total > 0) {
        progressPercent = Math.round((submitted / total) * 100);
    }

    return {
        total, submitted, pendingFromRM, pendingFromCo, deferred, sighted, waived, tbo,
        checkerApproved, checkerRejected, checkerPending, progressPercent, isCheckerContext
    };
};

const StatItem = ({ label, value, color }) => (
    <div style={{ fontWeight: "700", color: color }}>
        {label}: {value}
    </div>
);

const ChecklistSummary = ({ docs }) => {

    const stats = useMemo(() => calculateDocumentStats(docs), [docs]);

    if (!docs || docs.length === 0) return null;

    // Decide what to show based on context - if we have checker data, prioritize that view
    const showCheckerStats = stats.isCheckerContext || stats.checkerApproved > 0;

    return (
        <div
            style={{
                padding: "16px",
                background: "#f7f9fc",
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                marginBottom: 18,
                marginTop: 18,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    flexWrap: "wrap",
                    gap: "8px",
                }}
            >
                <StatItem label="Total" value={stats.total} color={PRIMARY_BLUE} />

                {!showCheckerStats ? (
                    <>
                        <StatItem label="Submitted" value={stats.submitted} color={GREEN} />
                        <StatItem label="Pending RM" value={stats.pendingFromRM} color="#f59e0b" />
                        <StatItem label="Pending Co" value={stats.pendingFromCo} color="#8b5cf6" />
                        <StatItem label="Deferred" value={stats.deferred} color="#ef4444" />
                        <StatItem label="Sighted" value={stats.sighted} color="#3b82f6" />
                        <StatItem label="Waived" value={stats.waived} color="#f59e0b" />
                        <StatItem label="TBO" value={stats.tbo} color="#06b6d4" />
                    </>
                ) : (
                    <>
                        {/* Checker View */}
                        <StatItem label="Approved" value={stats.checkerApproved} color={GREEN} />
                        <StatItem label="Rejected" value={stats.checkerRejected} color="#ef4444" />
                        <StatItem label="Pending" value={stats.checkerPending} color="#8b5cf6" />
                        {/* Still show context of original submission if needed, or maybe just simplified */}
                        <span style={{ borderLeft: "1px solid #ccc", margin: "0 8px" }}></span>
                        <StatItem label="Deferred" value={stats.deferred} color="#ef4444" />
                    </>
                )}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 16 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                    }}
                >
                    <span style={{ fontSize: "12px", color: "#666" }}>
                        {showCheckerStats ? "Review Progress" : "Completion Progress"}
                    </span>
                    <span
                        style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: PRIMARY_BLUE,
                        }}
                    >
                        {stats.progressPercent}%
                    </span>
                </div>
                <Progress
                    percent={stats.progressPercent}
                    strokeColor={{
                        "0%": PRIMARY_BLUE,
                        "100%": ACCENT_LIME,
                    }}
                    strokeWidth={8}
                    showInfo={false}
                />
            </div>

            {/* Status Distribution (Detailed Breakdown) */}
            <div style={{ fontSize: "12px", color: "#333", fontWeight: 600, marginBottom: 6 }}>
                Status Distribution
            </div>
            <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", width: "100%" }}>
                {stats.submitted > 0 && <div style={{ width: `${(stats.submitted / stats.total) * 100}%`, background: GREEN }} title="Submitted" />}
                {stats.pendingFromRM > 0 && <div style={{ width: `${(stats.pendingFromRM / stats.total) * 100}%`, background: "#f59e0b" }} title="Pending RM" />}
                {stats.pendingFromCo > 0 && <div style={{ width: `${(stats.pendingFromCo / stats.total) * 100}%`, background: "#8b5cf6" }} title="Pending Co" />}
                {stats.deferred > 0 && <div style={{ width: `${(stats.deferred / stats.total) * 100}%`, background: "#ef4444" }} title="Deferred" />}
                {stats.sighted > 0 && <div style={{ width: `${(stats.sighted / stats.total) * 100}%`, background: "#3b82f6" }} title="Sighted" />}
                {stats.waived > 0 && <div style={{ width: `${(stats.waived / stats.total) * 100}%`, background: "#f59e0b" }} title="Waived" />}
                {stats.tbo > 0 && <div style={{ width: `${(stats.tbo / stats.total) * 100}%`, background: "#06b6d4" }} title="TBO" />}
                {/* For Checker Approved/Rejected representation if main progress is checker */}
                {showCheckerStats && stats.checkerApproved > 0 && <div style={{ width: `${(stats.checkerApproved / stats.total) * 100}%`, background: GREEN }} title="Approved" />}
                {showCheckerStats && stats.checkerRejected > 0 && <div style={{ width: `${(stats.checkerRejected / stats.total) * 100}%`, background: "#ef4444" }} title="Rejected" />}
                {/* Pending space */}
                <div style={{ flex: 1, background: "#e5e7eb" }} title="Pending/Others" />
            </div>
        </div>
    );
};

export default ChecklistSummary;
