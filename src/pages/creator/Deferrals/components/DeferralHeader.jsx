import React from "react";
import { Button } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";

const headerClassName = "rounded-[28px] border border-[#f0f0f0] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]";
const headerInnerClassName = "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between";
const titleRowClassName = "flex flex-wrap items-center gap-3";
const titleClassName = "m-0 text-[24px] leading-none font-semibold tracking-[-0.03em] text-(--color-text-dark)";
const countBadgeClassName = "inline-flex min-w-10 items-center justify-center rounded-full border border-[rgba(214,189,152,0.24)] bg-white px-3 py-1 text-sm font-semibold text-(--color-primary-dark)";
const metaClassName = "mt-2 mb-0 text-sm text-(--color-text-medium)";
const actionsClassName = "flex flex-wrap gap-2.5";
const primaryButtonClassName = "h-11 rounded-xl border-0 bg-(--ncb-primary-500) px-4 text-white shadow-none hover:bg-(--ncb-primary-700) hover:text-white";
const secondaryButtonClassName = "h-11 rounded-xl border-[#f0f0f0] bg-white px-4 text-(--color-text-medium) shadow-none hover:border-[#e0e0e0] hover:bg-[#f9fafb] hover:text-(--color-text-dark)";

/**
 * DeferralHeader Component
 * Displays page header with title, badge count, and action buttons
 */
const DeferralHeader = ({
  deferrals,
  onRefresh,
  onExport,
  loading,
  disabledExport,
}) => {
  return (
    <div className={headerClassName}>
      <div className={headerInnerClassName}>
        <div className="min-w-0">
          <div className={titleRowClassName}>
            <h2 className={titleClassName}>Deferral Requests</h2>
            <span className={countBadgeClassName}>{deferrals.length}</span>
          </div>
          <p className={metaClassName}>
            Deferrals currently assigned across creator workflows
          </p>
        </div>

        <div className={actionsClassName}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            className={primaryButtonClassName}
          >
            Refresh
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={disabledExport}
            className={secondaryButtonClassName}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeferralHeader;
