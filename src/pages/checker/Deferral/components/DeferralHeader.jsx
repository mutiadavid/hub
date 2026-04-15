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
    <div className="deferrals-header">
      <div className="deferrals-header__main">
        <div className="deferrals-header__copy">
          <div className="deferrals-header__titleRow">
            <h2 className="deferrals-header__title">Deferral Requests</h2>
            <span className="deferrals-header__count">{deferrals.length}</span>
          </div>
          <p className="deferrals-header__meta">
            Deferrals currently assigned across checker workflows
          </p>
        </div>

        <div className="deferrals-header__actions">
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            className="deferrals-header__button deferrals-header__button--primary"
          >
            Refresh
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={disabledExport}
            className="deferrals-header__button"
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeferralHeader;
