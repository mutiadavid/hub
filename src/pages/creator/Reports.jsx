import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Tabs,
  Tooltip,
  Button,
  Typography,
  Spin,
  Modal,
  message,
} from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import deferralApi from "../../service/deferralApi";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";
import AllDCLsTable from "./AllDCLsTable";
import ReportsFilters from "./ReportsFilters";
import useReportsFilters from "../../hooks/useReportsFilters";
import DclAnalyticsDashboard from "./reports/DclAnalyticsDashboard";
import DeferralsDashboard from "./reports/DeferralsDashboard";
import DeferralsReportTable from "./reports/DeferralsReportTable";
import DeferralTATTable from "./reports/DeferralTATTable";
import TATConsumedDashboard from "./reports/TATConsumedDashboard";
import TATConsumedTablesView from "./reports/TATConsumedTablesView";
import {
  DCL_DISPLAY_NAME,
  DCL_PLURAL_DISPLAY_NAME,
  DCL_TABS,
  DEFERRAL_TABS,
  TAT_TABS,
} from "./reports/reportTheme";
import { buildTATTableRows, getDocumentEntries, safeLower } from "./reports/reportUtils";
import "../../styles/creatorDesignSystem.css";

const { Text } = Typography;
const LIVE_REPORT_TICK_MS = 1000;

export default function Reports() {
  const [activeTab, setActiveTab] = useState("deferrals");
  const [loading, setLoading] = useState(false);
  const [allDeferrals, setAllDeferrals] = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState("");
  const [reportNow, setReportNow] = useState(() => dayjs());
  const token = useSelector((state) => state?.auth?.token);
  const reportContentRef = React.useRef(null);

  const { filters, setFilters, clearFilters } = useReportsFilters();
  const isTatTab = TAT_TABS.includes(activeTab);

  useEffect(() => {
    setReportNow(dayjs());

    if (!isTatTab) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setReportNow(dayjs());
    }, LIVE_REPORT_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isTatTab]);

  const { data: allDcls = [] } = useGetAllCoCreatorChecklistsQuery(undefined, {
    skip: !DCL_TABS.includes(activeTab) && !TAT_TABS.includes(activeTab),
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!DEFERRAL_TABS.includes(activeTab) && !TAT_TABS.includes(activeTab)) {
      return;
    }

    const fetchLiveDeferrals = async () => {
      setLoading(true);
      try {
        const allRows = await deferralApi.getAllDeferrals(token).catch(async () => {
          const [pending, approved, returned, mine, closeWorkflow] = await Promise.all([
            deferralApi.getPendingDeferrals(token).catch(() => []),
            deferralApi.getApprovedDeferrals(token).catch(() => []),
            deferralApi.getReturnedDeferrals(token).catch(() => []),
            deferralApi.getMyDeferrals(token).catch(() => []),
            deferralApi.getCloseWorkflowDeferrals(token).catch(() => []),
          ]);

          const combined = [
            ...(Array.isArray(pending) ? pending : []),
            ...(Array.isArray(approved) ? approved : []),
            ...(Array.isArray(returned) ? returned : []),
            ...(Array.isArray(mine) ? mine : []),
            ...(Array.isArray(closeWorkflow) ? closeWorkflow : []),
          ];

          return Array.from(
            new Map(combined.map((d) => [String(d?._id || d?.id || ""), d])).values(),
          ).filter((d) => !!(d?._id || d?.id));
        });

        setAllDeferrals(Array.isArray(allRows) ? allRows : []);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveDeferrals();
  }, [activeTab, token]);

  const filteredDeferrals = useMemo(() => {
    if (isTatTab && filters.itemType === "DCL") {
      return [];
    }

    let rows = [...allDeferrals];

    if (filters.searchText) {
      const query = safeLower(filters.searchText);
      rows = rows.filter((deferral) => {
        const docNames = getDocumentEntries(deferral)
          .map((doc) => safeLower(doc.name))
          .join(" ");

        return (
          safeLower(deferral.deferralNumber).includes(query) ||
          safeLower(deferral.customerName).includes(query) ||
          safeLower(deferral.customerNumber).includes(query) ||
          safeLower(deferral.dclNo || deferral.dclNumber).includes(query) ||
          safeLower(deferral.createdBy?.name).includes(query) ||
          docNames.includes(query)
        );
      });
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const [start, end] = filters.dateRange;
      const startTime = start.startOf("day").valueOf();
      const endTime = end.endOf("day").valueOf();
      rows = rows.filter((deferral) => {
        const createdAt = deferral.createdAt ? dayjs(deferral.createdAt) : null;
        return (
          createdAt &&
          createdAt.isValid() &&
          createdAt.valueOf() >= startTime &&
          createdAt.valueOf() <= endTime
        );
      });
    }

    if (isTatTab && filters.status) {
      rows = rows.filter(
        (deferral) => String(deferral?.status || "").toLowerCase() === String(filters.status).toLowerCase(),
      );
    }

    return rows;
  }, [allDeferrals, filters, isTatTab]);

  const filteredAllDcls = useMemo(() => {
    if (isTatTab && filters.itemType === "Deferral") {
      return [];
    }

    return (allDcls || []).filter((row) => {
      const searchMatch = !filters.searchText
        ? true
        : row.dclNo?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          row.customerName?.toLowerCase().includes(filters.searchText.toLowerCase());

      const dateMatch = !isTatTab || !filters.dateRange || !filters.dateRange[0] || !filters.dateRange[1]
        ? true
        : (() => {
            const startTime = filters.dateRange[0].startOf("day").valueOf();
            const endTime = filters.dateRange[1].endOf("day").valueOf();
            const createdAt = row.createdAt ? dayjs(row.createdAt) : null;
            return (
              createdAt &&
              createdAt.isValid() &&
              createdAt.valueOf() >= startTime &&
              createdAt.valueOf() <= endTime
            );
          })();

      const statusMatch = !filters.status
        ? true
        : String(row.status).toLowerCase() === String(filters.status).toLowerCase();

      return searchMatch && statusMatch && dateMatch;
    });
  }, [allDcls, filters, isTatTab]);

  const tatExportRows = useMemo(
    () => {
      const nowAt = reportNow;
      const deferralTatRows = DeferralTATTable.buildRows(filteredDeferrals, nowAt);
      const dclTatRows = buildTATTableRows([], filteredAllDcls, nowAt).filter(
        (row) => row.workflowType === "DCL",
      );

      return [...deferralTatRows, ...dclTatRows]
        .sort((left, right) => (right.totalTatMinutes || 0) - (left.totalTatMinutes || 0))
        .map((row) => ({
        itemId: row.itemId,
        workflowType: row.workflowType,
        customerName: row.customerName,
        status: row.status,
        createdAt: row.createdAt,
        rmTat: row.rmTat.label,
        approversTat: row.approversTat?.label || "",
        coCreatorTat: row.coCreatorTat.label,
        coCheckerTat: row.coCheckerTat.label,
        totalTat: row.totalTatLabel,
        totalTatDays: row.totalTatDays,
        rmCompletedAt: row.rmCompletedAt,
        firstApproverAt: row.firstApproverAt,
        lastApproverAt: row.lastApproverAt,
        coCreatorCompletedAt: row.coCreatorCompletedAt,
        coCheckerCompletedAt: row.coCheckerCompletedAt || row.creatorCompletedAt,
      }));
    },
    [filteredAllDcls, filteredDeferrals, reportNow],
  );

  const currentExportRows = useMemo(
    () => (isTatTab ? tatExportRows : DCL_TABS.includes(activeTab) ? filteredAllDcls : filteredDeferrals),
    [activeTab, filteredAllDcls, filteredDeferrals, isTatTab, tatExportRows],
  );

  const currentExportLabel = useMemo(() => {
    if (activeTab === "allDCLs") return "all_dcls";
    if (activeTab === "dclCharts") return "dcl_charts";
    if (activeTab === "deferralCharts") return "deferral_charts";
    if (activeTab === "tatConsumed") return "tat_consumed";
    if (activeTab === "tatConsumedCharts") return "tat_consumed_charts";
    return "deferrals";
  }, [activeTab]);

  const getExportFileBase = () =>
    `${currentExportLabel}_${dayjs().format("YYYYMMDD_HHmmss")}`;

  const getSerializableValue = (value) => {
    if (value == null) return "";
    if (dayjs.isDayjs(value)) return value.format("DD/MM/YYYY HH:mm:ss");
    if (Array.isArray(value)) {
      return value
        .map((item) => getSerializableValue(item))
        .filter(Boolean)
        .join(" | ");
    }
    if (typeof value === "object") {
      if (value.name) return value.name;
      if (value.label) return value.label;
      return JSON.stringify(value);
    }
    return String(value);
  };

  const exportCsvReport = (data) => {
    if (!data?.length) {
      message.warning("No report data available to export.");
      return;
    }

    const filename = `${getExportFileBase()}.csv`;
    const keys = Array.from(
      data.reduce((set, row) => {
        Object.keys(row || {}).forEach((key) => set.add(key));
        return set;
      }, new Set()),
    );

    const csvRows = [
      keys.join(","),
      ...data.map((row) =>
        keys
          .map((key) => JSON.stringify(getSerializableValue(row?.[key])))
          .join(","),
      ),
    ];

    const csv = `data:text/csv;charset=utf-8,${csvRows.join("\n")}`;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = filename;
    link.click();
  };

  const exportCurrentSurface = async (format) => {
    const target = reportContentRef.current;
    if (!target) {
      message.error("Report surface not ready for export.");
      return;
    }

    setExportingFormat(format);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      if (format === "chart") {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${getExportFileBase()}_chart.png`;
        link.click();
        message.success("Chart downloaded successfully.");
        return;
      }

      if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const imageHeight = (canvas.height * usableWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/png");

        let heightLeft = imageHeight;
        let position = margin;

        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
        heightLeft -= pageHeight - margin * 2;

        while (heightLeft > 0) {
          position = heightLeft - imageHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
          heightLeft -= pageHeight - margin * 2;
        }

        pdf.save(`${getExportFileBase()}.pdf`);
        message.success("PDF downloaded successfully.");
      }
    } catch (error) {
      console.error("Report export failed:", error);
      message.error("Failed to export report. Please try again.");
    } finally {
      setExportingFormat("");
      setExportModalOpen(false);
    }
  };

  const handleSelectExportFormat = async (format) => {
    if (format === "csv") {
      exportCsvReport(currentExportRows);
      setExportModalOpen(false);
      return;
    }

    await exportCurrentSurface(format);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "deferrals":
        if (loading) {
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Spin />
            </div>
          );
        }
        return <DeferralsReportTable rows={filteredDeferrals} />;
      case "deferralCharts":
        if (loading) {
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Spin />
            </div>
          );
        }
        return <DeferralsDashboard rows={filteredDeferrals} />;
      case "allDCLs":
        return <AllDCLsTable filters={filters} />;
      case "dclCharts":
        return <DclAnalyticsDashboard rows={filteredAllDcls} />;
      case "tatConsumed":
        if (loading) {
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Spin />
            </div>
          );
        }
        return <TATConsumedTablesView deferralRows={filteredDeferrals} dclRows={filteredAllDcls} />;
      case "tatConsumedCharts":
        if (loading) {
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Spin />
            </div>
          );
        }
        return <TATConsumedDashboard deferralRows={filteredDeferrals} dclRows={filteredAllDcls} />;
      default:
        return null;
    }
  };

  const reportsPageStyles = `
    .creator-reports-page {
      min-height: 100%;
      width: 100%;
      background: var(--color-white);
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
    }
    .creator-reports-shell {
      width: 100%;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .creator-reports-card {
      background: var(--color-white);
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
      overflow: hidden;
    }
    .creator-reports-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-white);
    }
    .creator-reports-title-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 260px;
    }
    .creator-reports-title {
      margin: 0;
      font-size: 15px;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-text-dark);
    }
    .creator-reports-subtitle {
      color: var(--color-text-light) !important;
      font-size: 12px;
    }
    .creator-reports-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
      flex: 1;
    }
    .creator-reports-tabs .ant-tabs-nav {
      margin: 0;
      padding: 0;
      background: transparent;
      border-bottom: none;
    }
    .creator-reports-tabs .ant-tabs-nav::before {
      display: none !important;
    }
    .creator-reports-tabs .ant-tabs-nav-wrap {
      overflow: auto;
    }
    .creator-reports-tabs .ant-tabs-tab {
      border: none !important;
      background: transparent !important;
      border-radius: 0 !important;
      padding: 14px 8px 12px !important;
      color: var(--color-text-light);
      font-size: 12px;
      font-weight: 500;
      margin: 0 24px 0 0 !important;
    }
    .creator-reports-tabs .ant-tabs-tab-btn {
      color: var(--color-text-medium) !important;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
    }
    .creator-reports-tabs .ant-tabs-tab-active {
      background: transparent !important;
      border-color: transparent !important;
    }
    .creator-reports-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: var(--color-primary-dark) !important;
      font-weight: 600;
    }
    .creator-reports-tabs .ant-tabs-ink-bar {
      display: block !important;
      height: 2px !important;
      background: var(--color-primary-dark) !important;
      border-radius: 0 !important;
    }
    .creator-reports-export {
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 6px !important;
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      color: var(--color-text-medium) !important;
      box-shadow: none !important;
      flex-shrink: 0;
    }
    .creator-reports-export:hover,
    .creator-reports-export:focus {
      border-color: var(--color-primary-dark) !important;
      background: var(--color-white) !important;
      color: var(--color-primary-dark) !important;
    }
    .creator-reports-content {
      background: var(--color-white);
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
      overflow: hidden;
      padding: 16px;
    }
    .creator-reports-generated {
      margin-top: -2px;
      font-size: 12px;
      color: var(--color-text-light);
    }
    .reports-export-modal .ant-modal-content {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(214, 189, 152, 0.2);
      box-shadow: 0 20px 45px rgba(17, 24, 39, 0.16);
      padding: 0 !important;
      background: var(--color-white) !important;
    }
    .reports-export-modal .ant-modal-header {
      margin: 0 !important;
      padding: 18px 20px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
    }
    .reports-export-modal .ant-modal-title {
      color: var(--color-text-dark) !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      line-height: 1.2;
    }
    .reports-export-modal .ant-modal-close {
      top: 14px !important;
      inset-inline-end: 14px !important;
      color: var(--color-text-medium) !important;
    }
    .reports-export-modal .ant-modal-close:hover {
      color: var(--color-text-dark) !important;
      background: rgba(214, 189, 152, 0.12) !important;
    }
    .reports-export-modal .ant-modal-body {
      padding: 20px !important;
      background: var(--color-white) !important;
    }
    .reports-export-modal__title {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-right: 28px;
    }
    .reports-export-modal__title-text {
      color: var(--color-text-dark);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
    }
    .reports-export-modal__title-copy {
      color: var(--color-text-light);
      font-size: 12px;
      line-height: 1.45;
    }
    .reports-export-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .reports-export-option {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 10px !important;
      min-height: 44px !important;
      height: 44px;
      padding: 0 14px !important;
      border-radius: 8px !important;
      border: 1px solid rgba(214, 189, 152, 0.22) !important;
      background: var(--color-white) !important;
      color: var(--color-text-dark) !important;
      font-weight: 600 !important;
      box-shadow: none !important;
    }
    .reports-export-option:hover,
    .reports-export-option:focus {
      border-color: rgba(26, 54, 54, 0.22) !important;
      background: #faf7f3 !important;
      color: var(--color-text-dark) !important;
      box-shadow: none !important;
    }
    .reports-export-option .anticon {
      color: var(--color-primary-dark);
      font-size: 15px;
    }
    .reports-export-note {
      font-size: 12px;
      color: var(--color-text-light) !important;
      margin-top: 4px;
      padding-left: 2px;
    }
    .creator-reports-content .ant-card,
    .creator-reports-content .ant-card-body {
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    @media (max-width: 768px) {
      .creator-reports-shell {
        padding: 0;
      }
      .creator-reports-toolbar {
        align-items: stretch;
        flex-direction: column;
      }
      .creator-reports-actions {
        justify-content: flex-start;
      }
      .creator-reports-tabs .ant-tabs-tab {
        margin-right: 22px !important;
        padding-top: 12px !important;
        padding-bottom: 10px !important;
      }
      .creator-reports-content {
        padding: 12px;
      }
    }
  `;

  return (
    <div className="creator-reports-page creator-theme">
      <style>{reportsPageStyles}</style>
      <div className="creator-reports-shell">
        <div className="creator-reports-card">
        <div className="creator-reports-toolbar">
          <div className="creator-reports-title-block">
            <div className="creator-reports-title-block">
              <h2 className="creator-reports-title">
                {DCL_DISPLAY_NAME} Reports & Analytics
              </h2>
              <Text className="creator-reports-subtitle">
                Simple operational reporting with export-ready views.
              </Text>
            </div>
          </div>

          <div className="creator-reports-actions">
            <Tabs
              className="creator-reports-tabs"
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                clearFilters();
              }}
              type="card"
              style={{ margin: 0 }}
              items={[
                {
                  key: "deferrals",
                  label: (
                    <>
                      <CheckCircleOutlined /> Deferrals
                    </>
                  ),
                },
                {
                  key: "allDCLs",
                  label: (
                    <>
                      <FileTextOutlined /> All {DCL_PLURAL_DISPLAY_NAME}
                    </>
                  ),
                },
                {
                  key: "deferralCharts",
                  label: (
                    <>
                      <BarChartOutlined /> Deferral Charts
                    </>
                  ),
                },
                {
                  key: "dclCharts",
                  label: (
                    <>
                      <BarChartOutlined /> {DCL_DISPLAY_NAME} Charts
                    </>
                  ),
                },
                {
                  key: "tatConsumed",
                  label: (
                    <>
                      <ClockCircleOutlined /> TAT Consumed
                    </>
                  ),
                },
                {
                  key: "tatConsumedCharts",
                  label: (
                    <>
                      <BarChartOutlined /> TAT Charts
                    </>
                  ),
                },
              ]}
            />

            <Tooltip title="Export Report" overlayClassName="reports-export-tooltip">
              <Button
                className="creator-reports-export"
                icon={<DownloadOutlined />}
                onClick={() => setExportModalOpen(true)}
              />
            </Tooltip>
          </div>
        </div>
      </div>

      <ReportsFilters
        activeTab={activeTab}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
      />

      <div
        className="creator-reports-content"
        ref={reportContentRef}
      >
        {renderContent()}
      </div>

      <div className="creator-reports-generated">
        Generated on {reportNow.format("DD/MM/YYYY HH:mm:ss")}
      </div>

      <Modal
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={null}
        title={(
          <div className="reports-export-modal__title">
            <span className="reports-export-modal__title-text">Download Report</span>
            <span className="reports-export-modal__title-copy">
              Export the current tab using the active report filters.
            </span>
          </div>
        )}
        width={420}
        centered
        className="reports-export-modal"
      >
        <div className="reports-export-options">
          <Button
            block
            icon={<FilePdfOutlined />}
            loading={exportingFormat === "pdf"}
            onClick={() => handleSelectExportFormat("pdf")}
            className="reports-export-option"
          >
            Download as PDF
          </Button>
          <Button
            block
            icon={<FileTextOutlined />}
            loading={exportingFormat === "csv"}
            onClick={() => handleSelectExportFormat("csv")}
            className="reports-export-option"
          >
            Download as CSV
          </Button>
          <Button
            block
            icon={<BarChartOutlined />}
            loading={exportingFormat === "chart"}
            onClick={() => handleSelectExportFormat("chart")}
            className="reports-export-option"
          >
            Download as Chart (PNG)
          </Button>
          <Text type="secondary" className="reports-export-note">
            Exports use the current tab and active filters.
          </Text>
        </div>
      </Modal>
      </div>
    </div>
  );
}