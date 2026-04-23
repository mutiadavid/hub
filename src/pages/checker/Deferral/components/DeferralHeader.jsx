import React from "react";
import { Button } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";

const DeferralHeader = ({
  deferrals,
  onRefresh,
  onExport,
  loading,
  disabledExport,
}) => {
  return (
    <div className="rounded-[28px] border border-[rgba(214,189,152,0.18)] bg-[linear-gradient(135deg,#fffdf8_0%,#f7f3ea_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-[24px] leading-none font-semibold tracking-[-0.03em] text-(--color-text-dark)">
              Deferral Requests
            </h2>
            <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-[rgba(214,189,152,0.24)] bg-white px-3 py-1 text-sm font-semibold text-(--color-primary-dark)">
              {deferrals.length}
            </span>
          </div>
          <p className="mt-2 mb-0 text-sm text-(--color-text-medium)">
            Deferrals currently assigned across checker workflows
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            className="h-11 rounded-xl border-0 bg-(--ncb-primary-500) px-4 text-white shadow-none hover:bg-(--ncb-primary-700) hover:text-white"
          >
            Refresh
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={disabledExport}
            className="h-11 rounded-xl border-[rgba(214,189,152,0.22)] bg-white px-4 text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.32)] hover:bg-[#faf7f2] hover:text-(--color-text-dark)"
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeferralHeader;
