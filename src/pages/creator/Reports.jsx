import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import "../../styles/creatorTableOverrides.css";
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

const { Text } = Typography;
const LIVE_REPORT_TICK_MS = 1000;
const loadingStateClassName = "flex justify-center p-8";
const pageRootClassName =
  "min-h-full w-full bg-white [font-family:'Century_Gothic','CenturyGothic','AppleGothic',sans-serif]";
const shellClassName = "flex w-full flex-col gap-4";
const cardClassName =
  "overflow-hidden rounded-lg border border-[#d6bd9833] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName =
  "flex flex-col gap-3 border-b border-[#d6bd9833] bg-white p-4 md:flex-row md:flex-wrap md:items-center md:justify-between";
const titleBlockClassName = "flex min-w-[260px] flex-col gap-1";
const titleClassName = "m-0 text-[15px] font-bold leading-tight tracking-[-0.02em] text-[#1f2933]";
const subtitleClassName = "text-xs text-[#6b7280]";
const actionsClassName = "flex flex-1 flex-wrap items-center justify-end gap-2.5";
const tabsClassName =
  "min-w-0 flex-1 [&_.ant-tabs-ink-bar]:h-0.5 [&_.ant-tabs-ink-bar]:rounded-none [&_.ant-tabs-ink-bar]:bg-[#3ab3e5] [&_.ant-tabs-nav]:m-0 [&_.ant-tabs-nav]:border-b-0 [&_.ant-tabs-nav-wrap]:overflow-auto [&_.ant-tabs-nav:before]:hidden [&_.ant-tabs-tab]:mr-6 [&_.ant-tabs-tab]:rounded-none [&_.ant-tabs-tab]:border-0 [&_.ant-tabs-tab]:bg-transparent [&_.ant-tabs-tab]:px-2 [&_.ant-tabs-tab]:pb-3 [&_.ant-tabs-tab]:pt-3.5 [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-[#6b7280] [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-[#3ab3e5] [&_.ant-tabs-tab-btn]:text-[13px] [&_.ant-tabs-tab-btn]:font-semibold [&_.ant-tabs-tab-btn]:leading-tight [&_.ant-tabs-tab-btn]:text-[#4b5563] max-md:[&_.ant-tabs-tab]:mr-[22px] max-md:[&_.ant-tabs-tab]:pb-2.5 max-md:[&_.ant-tabs-tab]:pt-3";
const exportButtonClassName =
  "h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-md border border-[#d6bd9833] bg-white text-[#4b5563] shadow-none hover:border-[#3ab3e5] hover:bg-white hover:text-[#3ab3e5] focus:border-[#3ab3e5] focus:bg-white focus:text-[#3ab3e5]";
const contentClassName =
  "overflow-hidden rounded-lg border border-[#d6bd9833] bg-white p-4 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-md:p-3 [&_.ant-card]:border-0 [&_.ant-card]:shadow-none [&_.ant-card-body]:bg-transparent [&_.ant-card-body]:shadow-none";
const generatedClassName = "mt-[-2px] text-xs text-[#6b7280]";
const modalRootClassName =
  "[&_.ant-modal-body]:bg-white [&_.ant-modal-body]:p-5 [&_.ant-modal-close]:top-3.5 [&_.ant-modal-close]:end-3.5 [&_.ant-modal-close]:text-[#4b5563] hover:[&_.ant-modal-close]:bg-[#d6bd981f] hover:[&_.ant-modal-close]:text-[#1f2933] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-xl [&_.ant-modal-content]:border [&_.ant-modal-content]:border-[#d6bd9833] [&_.ant-modal-content]:bg-white [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:shadow-[0_20px_45px_rgba(17,24,39,0.16)] [&_.ant-modal-header]:m-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-[#d6bd9833] [&_.ant-modal-header]:bg-white [&_.ant-modal-header]:px-5 [&_.ant-modal-header]:pb-3 [&_.ant-modal-header]:pt-[18px] [&_.ant-modal-title]:text-[15px] [&_.ant-modal-title]:font-bold [&_.ant-modal-title]:leading-tight [&_.ant-modal-title]:text-[#1f2933]";
const modalTitleClassName = "flex flex-col gap-1 pr-7";
const modalTitleTextClassName = "text-[15px] font-bold leading-tight text-[#1f2933]";
const modalTitleCopyClassName = "text-xs leading-[1.45] text-[#6b7280]";
const modalOptionsClassName = "flex flex-col gap-2.5";
const modalOptionButtonClassName =
  "flex h-11 min-h-11 items-center justify-start gap-2.5 rounded-lg border border-[#d6bd9838] bg-white px-3.5 text-left font-semibold text-[#1f2933] shadow-none hover:border-[#1a363638] hover:bg-[#faf7f3] hover:text-[#1f2933] focus:border-[#1a363638] focus:bg-[#faf7f3] focus:text-[#1f2933] [&_.anticon]:text-[15px] [&_.anticon]:text-[#3ab3e5]";
const modalNoteClassName = "mt-1 pl-0.5 text-xs text-[#6b7280]";

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
            <div className={loadingStateClassName}>
              <Spin />
            </div>
          );
        }
        return <DeferralsReportTable rows={filteredDeferrals} />;
      case "deferralCharts":
        if (loading) {
          return (
            <div className={loadingStateClassName}>
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
            <div className={loadingStateClassName}>
              <Spin />
            </div>
          );
        }
        return <TATConsumedTablesView deferralRows={filteredDeferrals} dclRows={filteredAllDcls} />;
      case "tatConsumedCharts":
        if (loading) {
          return (
            <div className={loadingStateClassName}>
              <Spin />
            </div>
          );
        }
        return <TATConsumedDashboard deferralRows={filteredDeferrals} dclRows={filteredAllDcls} />;
      default:
        return null;
    }
  };

  return (
    <div className={pageRootClassName}>
      <div className={shellClassName}>
        <div className={cardClassName}>
        <div className={toolbarClassName}>
          <div className={titleBlockClassName}>
            <div className={titleBlockClassName}>
              <h2 className={titleClassName}>
                {DCL_DISPLAY_NAME} Reports & Analytics
              </h2>
              <Text className={subtitleClassName}>
                Simple operational reporting with export-ready views.
              </Text>
            </div>
          </div>

          <div className={actionsClassName}>
            <Tabs
              className={tabsClassName}
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                clearFilters();
              }}
              type="card"
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
                className={exportButtonClassName}
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
        className={contentClassName}
        ref={reportContentRef}
      >
        {renderContent()}
      </div>

      <div className={generatedClassName}>
        Generated on {reportNow.format("DD/MM/YYYY HH:mm:ss")}
      </div>

      <Modal
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={null}
        title={(
          <div className={modalTitleClassName}>
            <span className={modalTitleTextClassName}>Download Report</span>
            <span className={modalTitleCopyClassName}>
              Export the current tab using the active report filters.
            </span>
          </div>
        )}
        width={420}
        centered
        className={modalRootClassName}
      >
        <div className={modalOptionsClassName}>
          <Button
            block
            icon={<FilePdfOutlined />}
            loading={exportingFormat === "pdf"}
            onClick={() => handleSelectExportFormat("pdf")}
            className={modalOptionButtonClassName}
          >
            Download as PDF
          </Button>
          <Button
            block
            icon={<FileTextOutlined />}
            loading={exportingFormat === "csv"}
            onClick={() => handleSelectExportFormat("csv")}
            className={modalOptionButtonClassName}
          >
            Download as CSV
          </Button>
          <Button
            block
            icon={<BarChartOutlined />}
            loading={exportingFormat === "chart"}
            onClick={() => handleSelectExportFormat("chart")}
            className={modalOptionButtonClassName}
          >
            Download as Chart (PNG)
          </Button>
          <Text type="secondary" className={modalNoteClassName}>
            Exports use the current tab and active filters.
          </Text>
        </div>
      </Modal>
      </div>
    </div>
  );
}