import React, { useState } from "react";
import {
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Table,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getDeferralDocumentBuckets,
  resolveDocumentDaysAndDateWithExtension,
} from "../../../../utils/deferralDocuments";
import { getLivePartyApprovalStatuses } from "../../../../utils/deferralApprovalStatus";
import {
  buildExtensionCommentEntries,
  resolveDisplayName,
} from "../../../../utils/extensionHistory";
import { downloadFile, openFileInNewTab } from "../../../../utils/fileUtils";
import { PRIMARY_BLUE, SUCCESS_GREEN, ERROR_RED } from "../utils/constants";
import CommentTrail from "./CommentTrail";
import "../../../../styles/creatorDesignSystem.css";

const TABS = [
  { key: "details", label: "Extension Details" },
  { key: "documents", label: "Documents & Flow" },
];

const REVIEW_STYLES = `
  .approver-extension-review {
    border-top: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-bg);
  }

  .approver-extension-review__page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .approver-extension-review__topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .approver-extension-review__title-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .approver-extension-review__title-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 54, 54, 0.08);
    color: var(--color-primary-dark);
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text-dark);
  }

  .approver-extension-review__subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-light);
  }

  .approver-extension-review__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-white);
    color: var(--color-text-medium);
  }

  .approver-extension-review__banner,
  .approver-extension-review__section,
  .approver-extension-review__comments,
  .approver-extension-review__decision-card {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .approver-extension-review__banner {
    padding: 12px 14px;
  }

  .approver-extension-review__actionbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px 14px;
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .approver-extension-review__banner-title {
    color: ${PRIMARY_BLUE};
    font-weight: 700;
    font-size: 13px;
  }

  .approver-extension-review__banner-copy {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-medium);
  }

  .approver-extension-review__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    overflow-x: auto;
  }

  .approver-extension-review__tab {
    padding: 10px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }

  .approver-extension-review__tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }

  .approver-extension-review__details-layout {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    gap: 16px;
    align-items: start;
  }

  .approver-extension-review__details-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .approver-extension-review__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .approver-extension-review__section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-dark);
  }

  .approver-extension-review__section-body {
    padding: 16px;
  }

  .approver-extension-review__comments {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .approver-extension-review__decision-card .ant-input {
    padding: 8px !important;
    font-size: 12px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
  }

  .approver-extension-review__primary-btn.ant-btn,
  .approver-extension-review__decision-primary.ant-btn {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .approver-extension-review__decision-primary.ant-btn span {
    color: var(--color-white) !important;
  }

  .approver-extension-review__primary-btn.ant-btn:hover,
  .approver-extension-review__primary-btn.ant-btn:focus,
  .approver-extension-review__primary-btn.ant-btn:active,
  .approver-extension-review__decision-primary.ant-btn:hover,
  .approver-extension-review__decision-primary.ant-btn:focus,
  .approver-extension-review__decision-primary.ant-btn:active {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  .approver-extension-review__decision-primary.ant-btn:hover span,
  .approver-extension-review__decision-primary.ant-btn:focus span,
  .approver-extension-review__decision-primary.ant-btn:active span {
    color: var(--color-white) !important;
  }

  .approver-extension-review__danger-btn.ant-btn:hover,
  .approver-extension-review__danger-btn.ant-btn:focus,
  .approver-extension-review__danger-btn.ant-btn:active {
    background: ${ERROR_RED} !important;
  }

  .approver-extension-review__secondary-btn.ant-btn,
  .approver-extension-review__decision-secondary.ant-btn {
    border: 1px solid var(--color-primary-soft) !important;
    background: transparent !important;
    color: var(--color-primary-medium) !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .approver-extension-review__secondary-btn.ant-btn:hover,
  .approver-extension-review__secondary-btn.ant-btn:focus,
  .approver-extension-review__secondary-btn.ant-btn:active,
  .approver-extension-review__decision-secondary.ant-btn:hover,
  .approver-extension-review__decision-secondary.ant-btn:focus,
  .approver-extension-review__decision-secondary.ant-btn:active {
    border-color: var(--color-primary-soft) !important;
    background: rgba(214, 189, 152, 0.1) !important;
    color: var(--color-primary-dark) !important;
    box-shadow: none !important;
  }

  .approver-extension-review__primary-btn.ant-btn:disabled,
  .approver-extension-review__primary-btn.ant-btn[disabled],
  .approver-extension-review__secondary-btn.ant-btn:disabled,
  .approver-extension-review__secondary-btn.ant-btn[disabled],
  .approver-extension-review__decision-primary.ant-btn:disabled,
  .approver-extension-review__decision-primary.ant-btn[disabled],
  .approver-extension-review__decision-secondary.ant-btn:disabled,
  .approver-extension-review__decision-secondary.ant-btn[disabled] {
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .approver-extension-review__primary-btn.ant-btn:disabled span,
  .approver-extension-review__primary-btn.ant-btn[disabled] span,
  .approver-extension-review__secondary-btn.ant-btn:disabled span,
  .approver-extension-review__secondary-btn.ant-btn[disabled] span,
  .approver-extension-review__decision-primary.ant-btn:disabled span,
  .approver-extension-review__decision-primary.ant-btn[disabled] span,
  .approver-extension-review__decision-secondary.ant-btn:disabled span,
  .approver-extension-review__decision-secondary.ant-btn[disabled] span {
    color: #fff !important;
  }

  .approver-extension-review__table-shell {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .approver-extension-review__table-shell + .approver-extension-review__table-shell {
    margin-top: 16px;
  }

  .approver-extension-review .ant-descriptions-item-label {
    font-weight: 700 !important;
    color: var(--color-text-light) !important;
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .approver-extension-review .ant-descriptions-item-content {
    color: var(--color-text-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }

  .approver-extension-review .ant-table,
  .approver-extension-review .ant-table-wrapper,
  .approver-extension-review .ant-spin-nested-loading,
  .approver-extension-review .ant-spin-container,
  .approver-extension-review .ant-table-container,
  .approver-extension-review .ant-table-content,
  .approver-extension-review table,
  .approver-extension-review thead,
  .approver-extension-review tbody,
  .approver-extension-review tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .approver-extension-review .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-medium) !important;
    font-size: 11px;
    font-weight: 600;
    padding: 12px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    text-transform: uppercase;
    border-right: none !important;
  }

  .approver-extension-review .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-right: none !important;
    color: var(--color-text-medium);
    font-size: 12px;
  }

  .approver-extension-review .ant-table-thead > tr > th::before,
  .approver-extension-review .ant-table-cell::before,
  .approver-extension-review .ant-table-cell::after {
    display: none !important;
  }

  .approver-extension-review__empty {
    padding: 24px;
  }

  .approver-extension-decision-modal .ant-modal-content {
    border-radius: 16px !important;
    border: 1px solid rgba(214, 189, 152, 0.28) !important;
    box-shadow: 0 24px 64px rgba(26, 54, 54, 0.14) !important;
    overflow: hidden;
    padding: 0 !important;
  }

  .approver-extension-decision-modal .ant-modal-header {
    margin: 0 !important;
    padding: 18px 20px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    background: var(--color-white) !important;
  }

  .approver-extension-decision-modal .ant-modal-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-dark) !important;
  }

  .approver-extension-decision-modal .ant-modal-close,
  .approver-extension-decision-modal .ant-modal-close-x,
  .approver-extension-decision-modal .ant-modal-close-icon {
    color: var(--color-text-medium) !important;
  }

  .approver-extension-decision-modal .ant-modal-body {
    padding: 16px 20px 20px !important;
    background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(247, 243, 236, 0.72) 100%) !important;
  }

  .approver-extension-decision-modal .ant-modal-footer {
    margin: 0 !important;
    padding: 0 20px 20px !important;
    background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(247, 243, 236, 0.72) 100%) !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-content {
    border-radius: 0 !important;
    overflow: hidden;
    padding: 0 !important;
    background: var(--color-white) !important;
    border: none !important;
    box-shadow: 0 32px 72px rgba(18, 36, 36, 0.24) !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-header {
    margin-bottom: 0 !important;
    padding: 22px 26px 18px !important;
    background: linear-gradient(180deg, #34504c 0%, #2b4541 100%) !important;
    border-bottom: none !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-title {
    color: var(--color-white) !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-close {
    top: 20px !important;
    inset-inline-end: 20px !important;
    width: 32px !important;
    height: 32px !important;
    color: rgba(255, 255, 255, 0.88) !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-close:hover {
    color: var(--color-white) !important;
    background: rgba(255, 255, 255, 0.12) !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-close-x,
  .approver-extension-decision-modal--edit-style .ant-modal-close-icon {
    color: inherit !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-body {
    max-height: 70vh;
    overflow-y: auto;
    padding: 28px 26px 24px !important;
    background: #f7f6f2 !important;
  }

  .approver-extension-decision-modal--edit-style .ant-modal-footer {
    margin: 0 !important;
    padding: 0 26px 24px !important;
    background: #f7f6f2 !important;
  }

  .approver-extension-review__decision-card {
    padding: 14px;
    border: 1px solid rgba(214, 189, 152, 0.22);
    border-radius: 12px;
    background: var(--color-white);
  }

  .approver-extension-review__decision-summary {
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 10px;
    background: rgba(214, 189, 152, 0.12);
  }

  .approver-extension-review__decision-label {
    display: block;
    margin-bottom: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-light);
  }

  .approver-extension-review__decision-title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text-dark);
  }

  .approver-extension-review__decision-title-icon {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(22, 68, 121, 0.08);
    border: 1px solid rgba(22, 68, 121, 0.12);
    flex-shrink: 0;
  }

  .approver-extension-review__decision-title-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .approver-extension-review__decision-title-copy strong {
    color: var(--color-text-dark);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
  }

  .approver-extension-review__decision-title-copy span {
    color: rgba(255, 255, 255, 0.82);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
  }

  .approver-extension-review__decision-title--edit-style {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding-right: 36px;
    color: var(--color-white);
  }

  .approver-extension-review__decision-title-icon--edit-style {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.92);
    flex-shrink: 0;
  }

  .approver-extension-review__decision-title-icon--edit-style svg {
    width: 26px;
    height: 26px;
  }

  .approver-extension-review__decision-title-copy--edit-style strong {
    margin: 0;
    color: var(--color-white);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }

  .approver-extension-review__decision-card--edit-style {
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .approver-extension-review__decision-summary--edit-style {
    margin-bottom: 24px;
    padding: 18px 18px 16px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 14px;
    border: 1px solid rgba(214, 189, 152, 0.18);
    box-shadow: 0 10px 28px rgba(26, 54, 54, 0.06);
  }

  .approver-extension-review__decision-label--edit-style {
    display: block;
    margin-bottom: 8px;
    color: var(--color-text-medium);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input,
  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input-textarea textarea {
    border: 1px solid #eaecf0 !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    min-height: 120px !important;
    background: var(--color-white) !important;
    padding: 14px !important;
    font-size: 15px !important;
    color: var(--color-text-dark) !important;
  }

  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input::placeholder,
  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input-textarea textarea::placeholder {
    color: #98a2b3 !important;
  }

  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input:hover,
  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input:focus,
  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input-textarea textarea:hover,
  .approver-extension-decision-modal--edit-style .approver-extension-review__decision-card .ant-input-textarea textarea:focus {
    border-color: var(--color-primary-dark) !important;
    box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
  }

  .approver-extension-review__decision-secondary--edit-style.ant-btn {
    min-width: 92px;
    height: 44px;
    border-radius: 10px !important;
    border: 1px solid #d0d5dd !important;
    background: var(--color-white) !important;
    color: var(--color-text-medium) !important;
    box-shadow: none !important;
    font-weight: 600 !important;
  }

  .approver-extension-review__decision-primary--edit-style.ant-btn {
    min-width: 156px;
    height: 44px;
    border-radius: 10px !important;
    border: none !important;
    background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
    color: var(--color-white) !important;
    box-shadow: 0 10px 20px rgba(26, 54, 54, 0.18) !important;
    font-weight: 700 !important;
  }

  .approver-extension-review__decision-primary--edit-style.ant-btn span {
    color: var(--color-white) !important;
  }

  .approver-extension-review__decision-secondary--edit-style.ant-btn:hover,
  .approver-extension-review__decision-secondary--edit-style.ant-btn:focus,
  .approver-extension-review__decision-secondary--edit-style.ant-btn:active {
    border-color: #d0d5dd !important;
    background: var(--color-white) !important;
    color: var(--color-text-medium) !important;
    box-shadow: none !important;
  }

  .approver-extension-review__decision-primary--edit-style.ant-btn:hover,
  .approver-extension-review__decision-primary--edit-style.ant-btn:focus,
  .approver-extension-review__decision-primary--edit-style.ant-btn:active {
    background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
    color: var(--color-white) !important;
    box-shadow: 0 10px 20px rgba(26, 54, 54, 0.18) !important;
  }

  .approver-extension-review__decision-primary--edit-style.ant-btn:hover span,
  .approver-extension-review__decision-primary--edit-style.ant-btn:focus span,
  .approver-extension-review__decision-primary--edit-style.ant-btn:active span {
    color: var(--color-white) !important;
  }

  .approver-extension-review__decision-secondary--edit-style.ant-btn:disabled,
  .approver-extension-review__decision-secondary--edit-style.ant-btn[disabled],
  .approver-extension-review__decision-primary--edit-style.ant-btn:disabled,
  .approver-extension-review__decision-primary--edit-style.ant-btn[disabled] {
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .approver-extension-review__decision-secondary--edit-style.ant-btn:disabled span,
  .approver-extension-review__decision-secondary--edit-style.ant-btn[disabled] span,
  .approver-extension-review__decision-primary--edit-style.ant-btn:disabled span,
  .approver-extension-review__decision-primary--edit-style.ant-btn[disabled] span {
    color: #fff !important;
  }

  @media (max-width: 1023px) {
    .approver-extension-review__details-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    .approver-extension-review__topbar,
    .approver-extension-review__title-wrap,
    .approver-extension-review__actionbar {
      flex-direction: column;
      align-items: stretch;
    }

    .approver-extension-review__actionbar .ant-btn {
      width: 100%;
    }
  }
`;

const getNormalizedApprovalStatus = (approver) =>
  String(
    approver?.approvalStatus || approver?.ApprovalStatus || approver?.status || "pending",
  )
    .trim()
    .toLowerCase();

const isApproverApproved = (approver) =>
  approver?.approved === true || getNormalizedApprovalStatus(approver) === "approved";

const getApproverDisplayName = (approver, index) =>
  resolveDisplayName(
    approver?.user?.name,
    approver?.user?.fullName,
    approver?.userName,
    approver?.name,
    approver?.approverName,
    approver?.email,
    `Approver ${index + 1}`,
  );

const buildAdditionalDocuments = (uploadedDocs, extensionFiles) => {
  const combined = [...(uploadedDocs || []), ...(extensionFiles || [])];
  const seen = new Set();

  return combined.filter((doc) => {
    const key = `${doc?.id || doc?._id || ""}|${doc?.name || doc?.originalName || ""}|${doc?.url || doc?.fileUrl || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getExtensionLabel = (extension) => {
  const explicitNumber = extension?.extensionNumber || extension?.ExtensionNumber;
  if (explicitNumber) {
    return explicitNumber;
  }

  const deferralNumber = extension?.deferralNumber || extension?.DeferralNumber || "";
  if (!deferralNumber) {
    return "";
  }

  if (/^DEF-/i.test(deferralNumber)) {
    return deferralNumber.replace(/^DEF-/i, "EXT-");
  }

  return /^EXT-/i.test(deferralNumber) ? deferralNumber : `EXT-${deferralNumber}`;
};

const renderStatusLabel = (status) =>
  String(status || "pending")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const ExtensionApplicationModal = ({
  selectedExtension,
  open = false,
  onClose,
  onApprove,
  onReject,
  onReturnForRework,
  approveLoading = false,
  rejectLoading = false,
  reworkLoading = false,
  showActions = true,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reworkModalVisible, setReworkModalVisible] = useState(false);
  const [reworkReason, setReworkReason] = useState("");

  const currentExtension = selectedExtension || null;

  if (!open || !currentExtension) {
    return null;
  }

  const extensionLabel = getExtensionLabel(currentExtension);
  const linkedDeferral = currentExtension.deferral || currentExtension.linkedDeferral || {};
  const livePartyStatuses = getLivePartyApprovalStatuses(currentExtension);
  const { requestedDocs = [] } = getDeferralDocumentBuckets(currentExtension);
  const { dclDocs = [], uploadedDocs = [] } = getDeferralDocumentBuckets(linkedDeferral);
  const approvalFlow = currentExtension.approvers || [];
  const documentsToBeDeferred = requestedDocs.map((doc) => {
    const { days, nextDate } = resolveDocumentDaysAndDateWithExtension(
      doc,
      linkedDeferral,
      currentExtension,
    );

    return {
      ...doc,
      requestedDays: days,
      newDueDate: nextDate,
    };
  });
  const additionalDocuments = buildAdditionalDocuments(
    uploadedDocs,
    currentExtension.additionalFiles,
  );
  const extensionComments = buildExtensionCommentEntries(currentExtension);

  const approvalFlowWithCurrent = approvalFlow.map((approver, index) => {
    const approved = isApproverApproved(approver);
    const previousApprovalsComplete = approvalFlow.slice(0, index).every(isApproverApproved);

    return {
      ...approver,
      current: !approved && previousApprovalsComplete,
    };
  });

  const handleReject = () => {
    if (!rejectReason.trim()) {
      message.error("Please provide a rejection reason");
      return;
    }

    onReject?.(rejectReason);
    setRejectReason("");
    setRejectModalVisible(false);
  };

  const handleApprove = () => {
    onApprove?.(approveComment);
    setApproveComment("");
    setApproveModalVisible(false);
  };

  const handleReturnForRework = () => {
    if (!reworkReason.trim()) {
      message.error("Please provide rework instructions");
      return;
    }

    onReturnForRework?.(reworkReason);
    setReworkReason("");
    setReworkModalVisible(false);
  };

  const documentColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {value || "Untitled document"}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value, record) => value || record.documentType || "-",
    },
    {
      title: "Days Sought",
      dataIndex: "requestedDays",
      key: "requestedDays",
      width: 120,
      render: (value, record) => value || record.daysSought || "-",
    },
    {
      title: "New Due Date",
      dataIndex: "newDueDate",
      key: "newDueDate",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
  ];

  const uploadedDocumentColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {value || record.originalName || "Document"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(record.fileUrl || record.url)}
            disabled={!record.fileUrl && !record.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadFile(record.fileUrl || record.url, record.name || record.originalName || "document")
            }
            disabled={!record.fileUrl && !record.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const approvalColumns = [
    {
      title: "Approver",
      key: "approver",
      render: (_, record, index) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {getApproverDisplayName(record, index)}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "designation",
      key: "designation",
      render: (value, record) => value || record.role || "-",
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      render: (_, record) => {
        const approved = isApproverApproved(record);
        const reviewState = String(record.approvalStatus || "pending").trim().toLowerCase();
        const returnedForRework = reviewState === "returnedforrework" || reviewState === "returned_for_rework";
        const rejected = reviewState === "rejected";
        return (
          <span
            style={{
              fontWeight: 700,
              color: approved
                ? SUCCESS_GREEN
                : returnedForRework || rejected
                  ? ERROR_RED
                  : PRIMARY_BLUE,
            }}
          >
            {approved
              ? "Approved"
              : returnedForRework
                ? "Returned for Rework"
                : rejected
                  ? "Rejected"
                  : record.current
                    ? "Current Reviewer"
                    : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  const detailsSubtitle = `${currentExtension.customerName || linkedDeferral.customerName || "Customer"} • ${currentExtension.deferralNumber || linkedDeferral.deferralNumber || "No Deferral"}`;

  const renderDecisionModal = ({
    title,
    subtitle,
    titleIcon,
    open: modalOpen,
    onCancel,
    onConfirm,
    confirmText,
    confirmLoading,
    confirmDisabled = false,
    confirmClassName,
    summaryCopy,
    inputLabel,
    inputRequired = false,
    inputValue,
    onInputChange,
    inputPlaceholder,
    modalClassName,
    titleClassName,
    titleIconClassName,
    titleCopyClassName,
    cardClassName,
    summaryClassName,
    labelClassName,
    cancelButtonClassName,
    confirmButtonClassName,
  }) => (
    <Modal
      title={(
        <div className={`approver-extension-review__decision-title ${titleClassName || ""}`.trim()}>
          <span className={`approver-extension-review__decision-title-icon ${titleIconClassName || ""}`.trim()}>{titleIcon}</span>
          <span className={`approver-extension-review__decision-title-copy ${titleCopyClassName || ""}`.trim()}>
            <strong>{title}</strong>
            {/* Moved subtitle to summary body */}
          </span>
        </div>
      )}
      open={modalOpen}
      onCancel={onCancel}
      maskClosable={false}
      wrapClassName={`approver-extension-decision-modal ${modalClassName || ""}`.trim()}
      footer={[
        <Button
          key="cancel"
          className={`approver-extension-review__decision-secondary ${cancelButtonClassName || ""}`.trim()}
          onClick={onCancel}
          disabled={confirmLoading}
        >
          Cancel
        </Button>,
        <Button
          key="confirm"
          className={`approver-extension-review__decision-primary ${confirmClassName || ""} ${confirmButtonClassName || ""}`.trim()}
          loading={confirmLoading}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmText}
        </Button>,
      ]}
    >
      <div className={`approver-extension-review__decision-card ${cardClassName || ""}`.trim()}>
        <div className={`approver-extension-review__decision-summary ${summaryClassName || ""}`.trim()}>
          <div style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
            {extensionLabel || "Extension request"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-medium)" }}>
            {currentExtension.customerName || linkedDeferral.customerName || "Customer"}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-medium)" }}>
            {subtitle}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-medium)" }}>
            {summaryCopy}
          </div>
        </div>

        <label className={`approver-extension-review__decision-label ${labelClassName || ""}`.trim()}>
          {inputLabel}
          {inputRequired ? " (Required)" : ""}
        </label>
        <Input.TextArea
          rows={4}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={inputPlaceholder}
        />
      </div>
    </Modal>
  );

  return (
    <>
      <style>{REVIEW_STYLES}</style>

      <div className="approver-extension-review">
        <div className="approver-extension-review__page">
          <div className="approver-extension-review__topbar">
            <div className="approver-extension-review__title-wrap">
              <span className="approver-extension-review__title-icon">
                <CalendarOutlined />
              </span>
              <div>
                <h2 className="approver-extension-review__title">
                  Extension Request: {extensionLabel || "-"}
                </h2>
                <div className="approver-extension-review__subtitle">{detailsSubtitle}</div>
              </div>
            </div>

            <Button
              className="approver-extension-review__close"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          <div className="approver-extension-review__banner">
            <div className="approver-extension-review__banner-title">Under Review by Approvers</div>
            <div className="approver-extension-review__banner-copy">
              This extension request is currently undergoing approval from the designated approvers.
            </div>
          </div>

          <div className="approver-extension-review__actionbar">
            <Button
              className="approver-extension-review__secondary-btn"
              onClick={onClose}
              disabled={approveLoading || rejectLoading || reworkLoading}
            >
              Close
            </Button>
            {showActions ? (
              <>
                <Button
                  className="approver-extension-review__secondary-btn"
                  icon={<RedoOutlined />}
                  onClick={() => setReworkModalVisible(true)}
                  loading={reworkLoading}
                >
                  Return for Rework
                </Button>
                <Button
                  className="approver-extension-review__primary-btn approver-extension-review__danger-btn"
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  loading={rejectLoading}
                >
                  Reject
                </Button>
                <Button
                  className="approver-extension-review__primary-btn"
                  icon={<CheckOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                  loading={approveLoading}
                >
                  Approve
                </Button>
              </>
            ) : null}
          </div>

          <div className="approver-extension-review__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`approver-extension-review__tab ${activeTab === tab.key ? "approver-extension-review__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "details" ? (
            <div className="approver-extension-review__details-layout">
              <div className="approver-extension-review__details-main">
                <section className="approver-extension-review__section">
                  <div className="approver-extension-review__section-head">
                    <h3 className="approver-extension-review__section-title">Customer Information</h3>
                  </div>
                  <div className="approver-extension-review__section-body">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Customer Name">
                        {currentExtension.customerName || linkedDeferral.customerName || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Customer Number">
                        {currentExtension.customerNumber || linkedDeferral.customerNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loan Type">{linkedDeferral.loanType || "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="approver-extension-review__section">
                  <div className="approver-extension-review__section-head">
                    <h3 className="approver-extension-review__section-title">Extension Summary</h3>
                  </div>
                  <div className="approver-extension-review__section-body">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Deferral Number">
                        {currentExtension.deferralNumber || linkedDeferral.deferralNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="DCL No">
                        {linkedDeferral.dclNumber || linkedDeferral.dclNo || currentExtension.dclNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {renderStatusLabel(currentExtension.status)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Creator Status">{livePartyStatuses.creatorLabel}</Descriptions.Item>
                      <Descriptions.Item label="Checker Status">{livePartyStatuses.checkerLabel}</Descriptions.Item>
                      <Descriptions.Item label="Approver Status">
                        {`${approvalFlowWithCurrent.filter(isApproverApproved).length} of ${approvalFlowWithCurrent.length} Approved`}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loan Amount">
                        {linkedDeferral.loanAmountCategory || "Below 75 million"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {currentExtension.createdAt ? dayjs(currentExtension.createdAt).format("DD MMM YYYY") : "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="approver-extension-review__section">
                  <div className="approver-extension-review__section-head">
                    <h3 className="approver-extension-review__section-title">Extension Reason</h3>
                  </div>
                  <div className="approver-extension-review__section-body">
                    <Typography.Paragraph
                      style={{ marginBottom: 0, whiteSpace: "pre-wrap", color: "var(--color-text-medium)" }}
                    >
                      {currentExtension.extensionReason || currentExtension.reason || "-"}
                    </Typography.Paragraph>
                  </div>
                </section>
              </div>

              <aside className="approver-extension-review__comments">
                <div className="creator-caption">Comments</div>
                <CommentTrail history={extensionComments} isLoading={false} />
              </aside>
            </div>
          ) : (
            <div>
              <div className="approver-extension-review__table-shell">
                <div className="approver-extension-review__section-head">
                  <h3 className="approver-extension-review__section-title">Documents To Be Deferred</h3>
                </div>
                {documentsToBeDeferred.length > 0 ? (
                  <Table
                    columns={documentColumns}
                    dataSource={documentsToBeDeferred}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `${record.name}-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="approver-extension-review__empty"><Empty description="No deferred documents" /></div>
                )}
              </div>

              <div className="approver-extension-review__table-shell">
                <div className="approver-extension-review__section-head">
                  <h3 className="approver-extension-review__section-title">Facility Details</h3>
                </div>
                {linkedDeferral.facilities?.length > 0 ? (
                  <Table
                    dataSource={linkedDeferral.facilities}
                    columns={getFacilityColumns()}
                    pagination={false}
                    rowKey={(record, index) => record.facilityNumber || record._id || `facility-${index}`}
                    scroll={{ x: 720 }}
                  />
                ) : (
                  <div className="approver-extension-review__empty"><Empty description="No facilities available" /></div>
                )}
              </div>

              <div className="approver-extension-review__table-shell">
                <div className="approver-extension-review__section-head">
                  <h3 className="approver-extension-review__section-title">Mandatory DCL Upload</h3>
                </div>
                {dclDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={dclDocs}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `dcl-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="approver-extension-review__empty"><Empty description="No DCL document uploaded" /></div>
                )}
              </div>

              <div className="approver-extension-review__table-shell">
                <div className="approver-extension-review__section-head">
                  <h3 className="approver-extension-review__section-title">Additional Documents</h3>
                </div>
                {additionalDocuments.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={additionalDocuments}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `${record.name || record.originalName || "uploaded"}-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="approver-extension-review__empty"><Empty description="No additional documents" /></div>
                )}
              </div>

              <div className="approver-extension-review__table-shell">
                <div className="approver-extension-review__section-head">
                  <h3 className="approver-extension-review__section-title">Approval Flow</h3>
                </div>
                {approvalFlowWithCurrent.length > 0 ? (
                  <Table
                    columns={approvalColumns}
                    dataSource={approvalFlowWithCurrent}
                    pagination={false}
                    rowKey={(record, index) => record._id || `${getApproverDisplayName(record, index)}-${index}`}
                    scroll={{ x: 540 }}
                  />
                ) : (
                  <div className="approver-extension-review__empty"><Empty description="No approval flow recorded" /></div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {renderDecisionModal({
        title: "Confirm Approval",
        subtitle: "Approve this extension using the same review flow as the other workspaces.",
        titleIcon: <CheckOutlined />,
        open: approveModalVisible,
        onCancel: () => {
          setApproveModalVisible(false);
          setApproveComment("");
        },
        onConfirm: handleApprove,
        confirmText: "Yes, Approve",
        confirmLoading: approveLoading,
        summaryCopy: "Approving this request will move the extension forward in the workflow and capture your comments in context.",
        inputLabel: "Approval comments",
        inputValue: approveComment,
        onInputChange: setApproveComment,
        inputPlaceholder: "Enter approval comments...",
        modalClassName: "approver-extension-decision-modal--edit-style",
        titleClassName: "approver-extension-review__decision-title--edit-style",
        titleIconClassName: "approver-extension-review__decision-title-icon--edit-style",
        titleCopyClassName: "approver-extension-review__decision-title-copy--edit-style",
        cardClassName: "approver-extension-review__decision-card--edit-style",
        summaryClassName: "approver-extension-review__decision-summary--edit-style",
        labelClassName: "approver-extension-review__decision-label--edit-style",
        cancelButtonClassName: "approver-extension-review__decision-secondary--edit-style",
        confirmButtonClassName: "approver-extension-review__decision-primary--edit-style",
      })}

      {renderDecisionModal({
        title: "Return for Rework",
        subtitle: "Send this extension back to the RM with the exact corrections required before resubmission.",
        titleIcon: <RedoOutlined />,
        open: reworkModalVisible,
        onCancel: () => {
          setReworkModalVisible(false);
          setReworkReason("");
        },
        onConfirm: handleReturnForRework,
        confirmText: "Yes, Return for Rework",
        confirmLoading: reworkLoading,
        confirmDisabled: !reworkReason.trim(),
        confirmClassName: "approver-extension-review__danger-btn",
        summaryCopy: "Returning for rework pauses the current extension review and routes the resubmission back to you after the RM corrects it.",
        inputLabel: "Rework instructions",
        inputRequired: true,
        inputValue: reworkReason,
        onInputChange: setReworkReason,
        inputPlaceholder: "Enter rework instructions...",
        modalClassName: "approver-extension-decision-modal--edit-style",
        titleClassName: "approver-extension-review__decision-title--edit-style",
        titleIconClassName: "approver-extension-review__decision-title-icon--edit-style",
        titleCopyClassName: "approver-extension-review__decision-title-copy--edit-style",
        cardClassName: "approver-extension-review__decision-card--edit-style",
        summaryClassName: "approver-extension-review__decision-summary--edit-style",
        labelClassName: "approver-extension-review__decision-label--edit-style",
        cancelButtonClassName: "approver-extension-review__decision-secondary--edit-style",
        confirmButtonClassName: "approver-extension-review__decision-primary--edit-style",
      })}

      {renderDecisionModal({
        title: "Confirm Rejection",
        subtitle: "Provide a concise rationale before rejecting this extension request.",
        titleIcon: <ExclamationCircleOutlined />,
        open: rejectModalVisible,
        onCancel: () => {
          setRejectModalVisible(false);
          setRejectReason("");
        },
        onConfirm: handleReject,
        confirmText: "Yes, Reject",
        confirmLoading: rejectLoading,
        confirmDisabled: !rejectReason.trim(),
        confirmClassName: "approver-extension-review__danger-btn",
        summaryCopy: "Rejecting this request will stop the extension review and record your reason for the originating team.",
        inputLabel: "Rejection reason",
        inputRequired: true,
        inputValue: rejectReason,
        onInputChange: setRejectReason,
        inputPlaceholder: "Enter rejection reason...",
        modalClassName: "approver-extension-decision-modal--edit-style",
        titleClassName: "approver-extension-review__decision-title--edit-style",
        titleIconClassName: "approver-extension-review__decision-title-icon--edit-style",
        titleCopyClassName: "approver-extension-review__decision-title-copy--edit-style",
        cardClassName: "approver-extension-review__decision-card--edit-style",
        summaryClassName: "approver-extension-review__decision-summary--edit-style",
        labelClassName: "approver-extension-review__decision-label--edit-style",
        cancelButtonClassName: "approver-extension-review__decision-secondary--edit-style",
        confirmButtonClassName: "approver-extension-review__decision-primary--edit-style",
      })}
    </>
  );
};

export default ExtensionApplicationModal;