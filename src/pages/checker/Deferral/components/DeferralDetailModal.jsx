import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Input,
  message as antMessage,
  Modal,
  Spin,
  Table,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getCloseRequestDocumentGroups,
  getDeferralDocumentBuckets,
} from "../../../../utils/deferralDocuments";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import DeferralReviewHeader from "../../../creator/Deferrals/components/DeferralReviewHeader";
import DeferralStatusAlert from "./DeferralStatusAlert";
import "../../../../styles/creatorDesignSystem.css";

const { TextArea } = Input;
const { Text } = Typography;

const PRIMARY_BLUE = "var(--color-primary-dark)";
const SUCCESS_GREEN = "var(--color-status-success)";
const ERROR_RED = "var(--color-status-danger)";

const GENERIC_ROLE_LABELS = new Set([
  "user",
  "system",
  "approver",
  "rm",
  "creator",
  "checker",
  "cocreator",
  "co creator",
  "cochecker",
  "co checker",
  "customer",
  "admin",
]);

const DUPLICATE_TIME_WINDOW_MS = 2 * 60 * 1000;

const normalizeHistoryValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getTimestampValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.valueOf();
};

const normalizeCloseRequestDecisionKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

const getRoleSpecificityScore = (roleLabel) => {
  const normalizedRole = normalizeHistoryValue(roleLabel);
  if (!normalizedRole) return 0;
  if (GENERIC_ROLE_LABELS.has(normalizedRole)) return 1;
  return 10 + normalizedRole.length;
};

const dedupeHistoryEntries = (entries) => {
  const deduped = [];

  entries.forEach((entry, index) => {
    const normalizedUser = normalizeHistoryValue(entry.user);
    const normalizedComment = normalizeHistoryValue(entry.comment);
    const entryTime = getTimestampValue(
      entry.date || entry.createdAt || entry.timestamp,
    );

    const current = {
      ...entry,
      __index: index,
      __score: getRoleSpecificityScore(entry.userRole || entry.role),
      __user: normalizedUser,
      __comment: normalizedComment,
      __time: entryTime,
    };

    const existingIndex = deduped.findIndex((candidate) => {
      if (
        candidate.__user !== current.__user ||
        candidate.__comment !== current.__comment
      ) {
        return false;
      }

      if (candidate.__time == null || current.__time == null) {
        return true;
      }

      return Math.abs(candidate.__time - current.__time) <= DUPLICATE_TIME_WINDOW_MS;
    });

    if (existingIndex === -1) {
      deduped.push(current);
      return;
    }

    const existing = deduped[existingIndex];
    const shouldReplace =
      current.__score > existing.__score ||
      (current.__score === existing.__score && current.__index < existing.__index);

    if (shouldReplace) {
      deduped[existingIndex] = current;
    }
  });

  return deduped
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .map((entry) => {
      const nextEntry = { ...entry };
      delete nextEntry.__index;
      delete nextEntry.__score;
      delete nextEntry.__user;
      delete nextEntry.__comment;
      delete nextEntry.__time;
      return nextEntry;
    });
};

const TABS = [
  { key: "details", label: "Deferral Details" },
  { key: "documents", label: "Required Documents" },
];

const DETAIL_STYLES = `
  .deferral-review-panel {
    margin-top: 0;
  }

  .deferral-review-container {
    background: transparent;
    border-radius: 0;
    overflow: visible;
    width: 100%;
    max-width: 100%;
    box-shadow: none;
    border: none;
    margin: 0;
    position: relative;
    z-index: 1;
  }

  .deferral-review-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .deferral-review-topbar__main {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .deferral-review-topbar__back.ant-btn {
    padding: 8px 12px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(214, 189, 152, 0.35) !important;
    color: var(--color-text-medium) !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .deferral-review-topbar__title {
    color: ${PRIMARY_BLUE};
    font-size: 16px;
    font-weight: 700;
  }

  .deferral-review-topbar__subtitle {
    margin-top: 4px;
    color: var(--color-text-subtle);
    font-size: 12px;
  }

  .deferral-review-topbar__docs.ant-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
    background: var(--color-white) !important;
    color: var(--color-text-medium) !important;
    box-shadow: none !important;
  }

  .deferral-review-topbar__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(214, 189, 152, 0.2);
    color: var(--color-text-dark);
    font-size: 9px;
    font-weight: 600;
  }

  .deferral-review-actionbar {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .deferral-review-actionbar__group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .deferral-review-actionbar__group--end {
    margin-left: auto;
  }

  .deferral-review-actionbar__button.ant-btn {
    min-height: 34px !important;
    height: 34px !important;
    padding: 0 14px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    border: none !important;
    background: var(--gradient-primary) !important;
    border-color: transparent !important;
    color: var(--color-white) !important;
  }

  .deferral-review-actionbar__button.ant-btn span {
    color: var(--color-white) !important;
  }

  .deferral-review-actionbar__button.ant-btn--secondary,
  .deferral-review-actionbar__button.ant-btn--secondary:hover,
  .deferral-review-actionbar__button.ant-btn--secondary:focus,
  .deferral-review-actionbar__button.ant-btn--secondary:active {
    background: var(--color-white) !important;
    color: var(--color-text-medium) !important;
    border: 1px solid rgba(214, 189, 152, 0.28) !important;
    box-shadow: none !important;
  }

  .deferral-review-actionbar__button.ant-btn--secondary span,
  .deferral-review-actionbar__button.ant-btn--secondary:hover span,
  .deferral-review-actionbar__button.ant-btn--secondary:focus span,
  .deferral-review-actionbar__button.ant-btn--secondary:active span {
    color: var(--color-text-medium) !important;
  }

  .deferral-review-actionbar__button.ant-btn:disabled,
  .deferral-review-actionbar__button.ant-btn[disabled] {
    background: var(--color-disabled) !important;
    border-color: var(--color-disabled) !important;
    color: var(--color-white) !important;
    border: none !important;
  }

  .deferral-review-actionbar__button.ant-btn:disabled span,
  .deferral-review-actionbar__button.ant-btn[disabled] span {
    color: var(--color-white) !important;
  }

  .deferral-review-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    margin-bottom: 16px;
    overflow-x: auto;
  }

  .deferral-review-tab {
    padding: 8px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }

  .deferral-review-tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }

  .deferral-review-workspace {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(300px, 3fr);
    gap: 16px;
    align-items: start;
  }

  .deferral-review-main {
    min-width: 0;
  }

  .deferral-review-body {
    padding: 0;
    overflow: visible;
  }

  .deferral-review-sidebar {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .deferral-review-sidebar__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .deferral-review-sidebar__section + .deferral-review-sidebar__section {
    padding-top: 14px;
    border-top: 1px solid rgba(214, 189, 152, 0.14);
  }

  .deferral-review-sidebar__title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-medium);
  }

  .deferral-review-sidebar__empty,
  .deferral-review-sidebar__history-text {
    color: var(--color-text-medium);
    font-size: 12px;
    line-height: 1.5;
  }

  .deferral-review-sidebar__history {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .deferral-review-sidebar__history-item {
    padding-top: 10px;
    border-top: 1px solid rgba(214, 189, 152, 0.14);
  }

  .deferral-review-sidebar__history-item:first-child {
    border-top: none;
    padding-top: 0;
  }

  .deferral-review-sidebar__history-meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .deferral-review-sidebar__history-user {
    color: ${PRIMARY_BLUE};
    font-size: 12px;
    font-weight: 600;
  }

  .deferral-review-sidebar__history-time {
    color: #94a3b8;
    font-size: 11px;
  }

  .deferral-review-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .deferral-review-stat {
    padding: 12px;
    border: 1px solid rgba(214, 189, 152, 0.16);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(245, 240, 231, 0.58) 0%, #fff 100%);
  }

  .deferral-review-stat__label {
    color: var(--color-text-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .deferral-review-stat__value {
    margin-top: 8px;
    color: var(--color-text-dark);
    font-size: 22px;
    font-weight: 700;
  }

  .deferral-review-table-shell {
    margin-bottom: 18px;
  }

  .deferral-review-table-shell .ant-table {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .deferral-review-table-shell .ant-table-thead > tr > th {
    background: var(--color-bg, #f5f7f4) !important;
    color: var(--color-text-muted) !important;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
  }

  .deferral-review-table-shell .ant-table-tbody > tr > td {
    color: var(--color-text-body);
    font-size: 12px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.14) !important;
    vertical-align: top;
  }

  .deferral-info-card .ant-card-head {
    border-bottom: 2px solid var(--color-success-soft-border) !important;
  }

  .deferral-info-card .ant-descriptions-item-label {
    font-weight: 600 !important;
    color: var(--color-role-accent) !important;
    padding-bottom: 4px;
  }

  .deferral-info-card .ant-descriptions-item-content {
    color: ${PRIMARY_BLUE} !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }

  .deferral-review-summary .ant-descriptions-view {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .deferral-review-summary .ant-descriptions-row > th,
  .deferral-review-summary .ant-descriptions-row > td {
    border-bottom: 1px solid rgba(214, 189, 152, 0.14);
  }

  .deferral-review-summary .ant-descriptions-row:last-child > th,
  .deferral-review-summary .ant-descriptions-row:last-child > td {
    border-bottom: none;
  }

  .deferral-review-summary .ant-descriptions-item-label {
    background: var(--color-bg, #f5f7f4);
    min-width: 140px;
    padding: 12px 14px !important;
  }

  .deferral-review-summary .ant-descriptions-item-content {
    padding: 12px 14px !important;
    background: #fff;
  }

  .deferral-review-text-block {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    padding: 14px 16px;
    color: var(--color-text-body-soft);
    font-size: 13px;
    line-height: 1.6;
    background: #fff;
    white-space: pre-wrap;
  }

  .deferral-review-actionset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .deferral-review-actionset .ant-btn {
    min-width: 0;
    height: 27px;
    padding: 0 8px;
    border-radius: 7px;
    font-size: 12px;
  }

  .deferral-review-actionset .ant-btn > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .deferral-review-status-pill {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
  }

  .deferral-review-confirm.admin-page__modal .ant-modal-content {
    overflow: hidden;
    padding: 0;
    border-radius: 16px;
    border: 1px solid rgba(214, 189, 152, 0.28);
    box-shadow: 0 24px 64px rgba(26, 54, 54, 0.14);
  }

  .deferral-review-confirm.admin-page__modal .ant-modal-header {
    background: var(--color-white) !important;
    padding: 18px 20px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    margin: 0 !important;
  }

  .deferral-review-confirm--acceptance.admin-page__modal .ant-modal-header {
    background: transparent !important;
    border-bottom: none !important;
  }

  .deferral-review-confirm.admin-page__modal .ant-modal-title,
  .deferral-review-confirm.admin-page__modal .ant-modal-close,
  .deferral-review-confirm.admin-page__modal .ant-modal-close-x,
  .deferral-review-confirm.admin-page__modal .ant-modal-close-icon {
    color: var(--color-text-dark) !important;
  }

  .deferral-review-confirm--acceptance.admin-page__modal .ant-modal-title,
  .deferral-review-confirm--acceptance.admin-page__modal .ant-modal-close,
  .deferral-review-confirm--acceptance.admin-page__modal .ant-modal-close-x,
  .deferral-review-confirm--acceptance.admin-page__modal .ant-modal-close-icon {
    color: var(--color-primary-dark) !important;
  }

  .deferral-review-confirm .ant-modal-body,
  .deferral-review-confirm .ant-modal-footer {
    background: var(--gradient-surface-soft);
  }

  .deferral-review-confirm__icon {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 54, 54, 0.08);
    border: 1px solid rgba(26, 54, 54, 0.12);
    border-radius: 999px;
    flex-shrink: 0;
  }

  .deferral-review-confirm__icon .anticon {
    color: ${PRIMARY_BLUE};
    font-size: 16px;
  }

  .deferral-review-confirm--acceptance .deferral-review-confirm__title,
  .deferral-review-confirm--acceptance .deferral-review-confirm__icon .anticon {
    color: var(--color-primary-dark);
  }

  .deferral-review-confirm__title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text-dark);
  }

  .deferral-review-confirm__body-card {
    border: 1px solid rgba(214, 189, 152, 0.22);
    border-radius: 12px;
    background: var(--color-white);
    padding: 14px;
  }

  .deferral-review-confirm__summary {
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 10px;
    background: rgba(214, 189, 152, 0.12);
  }

  .deferral-review-confirm__summary-title {
    color: var(--color-text-dark);
    font-size: 14px;
    font-weight: 700;
  }

  .deferral-review-confirm__summary-copy,
  .deferral-review-confirm__text {
    margin-top: 4px;
    color: var(--color-text-medium);
    font-size: 12px;
    line-height: 1.6;
  }

  .deferral-review-confirm__label {
    display: block;
    margin-bottom: 6px;
    color: var(--color-text-light);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .deferral-review-confirm__textarea.ant-input {
    border-radius: 10px;
  }

  .deferral-review-confirm .admin-page__modal-footer .deferral-review-confirm__confirm.ant-btn,
  .deferral-review-confirm .admin-page__modal-footer .deferral-review-confirm__confirm.ant-btn:hover,
  .deferral-review-confirm .admin-page__modal-footer .deferral-review-confirm__confirm.ant-btn:focus,
  .deferral-review-confirm .admin-page__modal-footer .deferral-review-confirm__confirm.ant-btn:active {
    border: none !important;
    background: var(--gradient-primary) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  .approver-decision-modal .ant-modal-content {
    overflow: hidden;
    border-radius: 24px !important;
    border: 1px solid rgba(64, 83, 76, 0.12) !important;
    box-shadow: 0 28px 60px rgba(20, 34, 34, 0.2) !important;
  }

  .approver-decision-modal .ant-modal-header {
    margin: 0 !important;
    padding: 28px 26px 22px !important;
    background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
    border-bottom: none !important;
  }

  .approver-decision-modal .ant-modal-title,
  .approver-decision-modal .ant-modal-close,
  .approver-decision-modal .ant-modal-close-x,
  .approver-decision-modal .ant-modal-close-icon {
    color: var(--color-white) !important;
  }

  .approver-decision-modal .ant-modal-close {
    inset-inline-end: 24px !important;
    top: 22px !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 999px !important;
    color: rgba(255, 255, 255, 0.92) !important;
    background: rgba(255, 255, 255, 0.08) !important;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .approver-decision-modal .ant-modal-close-x {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 32px !important;
    height: 32px !important;
  }

  .approver-decision-modal .ant-modal-close:hover {
    color: var(--color-white) !important;
    background: rgba(255, 255, 255, 0.12) !important;
  }

  .approver-decision-modal .ant-modal-body {
    padding: 28px 26px 24px !important;
    background: #f7f6f2 !important;
  }

  .approver-decision-modal .ant-modal-footer {
    margin: 0 !important;
    padding: 0 26px 24px !important;
    background: #f7f6f2 !important;
  }

  .approver-deferral-review__decision-title {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding-right: 36px;
  }

  .approver-deferral-review__decision-title-icon {
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

  .approver-deferral-review__decision-title-icon .anticon {
    font-size: 22px;
  }

  .approver-deferral-review__decision-title-copy {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .approver-deferral-review__decision-title-copy strong {
    color: var(--color-white);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }

  .approver-deferral-review__decision-title-copy span {
    color: rgba(255, 255, 255, 0.82);
    font-size: 13px;
    line-height: 1.45;
  }

  .approver-deferral-review__decision-card {
    padding: 20px;
    border: 1px solid rgba(214, 189, 152, 0.18);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 28px rgba(26, 54, 54, 0.06);
  }

  .approver-deferral-review__decision-summary {
    margin-bottom: 20px;
    padding: 18px;
    border-radius: 14px;
    background: #f4efe7;
  }

  .approver-deferral-review__decision-summary-title {
    color: var(--color-text-dark);
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }

  .approver-deferral-review__decision-summary-subtitle {
    margin-top: 8px;
    color: var(--color-text-medium);
    font-size: 18px;
    line-height: 1.35;
  }

  .approver-deferral-review__decision-summary-copy {
    margin-top: 16px;
    color: var(--color-text-medium);
    font-size: 15px;
    line-height: 1.65;
  }

  .approver-deferral-review__decision-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .approver-deferral-review__decision-label {
    display: block;
    color: var(--color-text-medium);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .approver-deferral-review__decision-card .ant-input {
    border: 1px solid #eaecf0 !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    min-height: 132px !important;
    background: var(--color-white) !important;
    color: var(--color-text-dark) !important;
    font-size: 15px !important;
    padding: 14px !important;
    resize: vertical !important;
  }

  .approver-deferral-review__decision-card .ant-input::placeholder {
    color: #98a2b3 !important;
  }

  .approver-deferral-review__decision-card .ant-input:hover,
  .approver-deferral-review__decision-card .ant-input:focus {
    border-color: var(--color-primary-dark) !important;
    box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
  }

  .approver-deferral-review__decision-secondary.ant-btn {
    min-width: 92px;
    height: 44px;
    border-radius: 10px !important;
    border: 1px solid #d0d5dd !important;
    background: var(--color-white) !important;
    color: var(--color-text-medium) !important;
    box-shadow: none !important;
    font-weight: 600 !important;
  }

  .approver-deferral-review__decision-secondary.ant-btn:hover,
  .approver-deferral-review__decision-secondary.ant-btn:focus,
  .approver-deferral-review__decision-secondary.ant-btn:active {
    border-color: #d0d5dd !important;
    background: #f8fafc !important;
    color: var(--color-text-dark) !important;
    box-shadow: none !important;
  }

  .approver-deferral-review__decision-primary.ant-btn {
    min-width: 156px;
    height: 44px;
    border-radius: 10px !important;
    border: none !important;
    background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
    color: var(--color-white) !important;
    box-shadow: 0 10px 20px rgba(26, 54, 54, 0.18) !important;
    font-weight: 700 !important;
  }

  .approver-deferral-review__decision-primary.ant-btn:hover,
  .approver-deferral-review__decision-primary.ant-btn:focus,
  .approver-deferral-review__decision-primary.ant-btn:active {
    background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
    color: var(--color-white) !important;
    box-shadow: 0 10px 20px rgba(26, 54, 54, 0.18) !important;
  }

  .approver-deferral-review__warning-btn.ant-btn,
  .approver-deferral-review__warning-btn.ant-btn:hover,
  .approver-deferral-review__warning-btn.ant-btn:focus,
  .approver-deferral-review__warning-btn.ant-btn:active,
  .approver-deferral-review__warning-btn.ant-btn:disabled,
  .approver-deferral-review__warning-btn.ant-btn[disabled],
  .approver-deferral-review__warning-btn.ant-btn > span,
  .approver-deferral-review__warning-btn.ant-btn > span > span,
  .approver-deferral-review__warning-btn.ant-btn:disabled > span,
  .approver-deferral-review__warning-btn.ant-btn[disabled] > span,
  .approver-deferral-review__warning-btn.ant-btn:disabled > span > span,
  .approver-deferral-review__warning-btn.ant-btn[disabled] > span > span {
    color: var(--color-white) !important;
  }

  .approver-deferral-review__decision-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  @media (max-width: 1023px) {
    .deferral-review-workspace {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    .deferral-review-topbar,
    .deferral-review-topbar__main,
    .deferral-review-actionbar,
    .deferral-review-actionbar__group,
    .deferral-review-actionbar__group--end {
      flex-direction: column;
      align-items: stretch;
    }

    .deferral-review-topbar__docs.ant-btn,
    .deferral-review-topbar__back.ant-btn,
    .deferral-review-actionbar .ant-btn {
      width: 100%;
    }

    .approver-decision-modal .ant-modal {
      max-width: calc(100vw - 24px) !important;
      margin: 12px auto !important;
    }

    .approver-decision-modal .ant-modal-header {
      padding: 18px 18px 16px !important;
    }

    .approver-decision-modal .ant-modal-body,
    .approver-decision-modal .ant-modal-footer {
      padding-left: 18px !important;
      padding-right: 18px !important;
    }

    .approver-deferral-review__decision-title {
      gap: 12px;
    }

    .approver-deferral-review__decision-title-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
    }

    .approver-deferral-review__decision-title-copy strong {
      font-size: 18px;
    }

    .approver-deferral-review__decision-summary-title {
      font-size: 22px;
    }

    .approver-deferral-review__decision-summary-subtitle {
      font-size: 16px;
    }

    .approver-deferral-review__decision-summary-copy {
      font-size: 14px;
    }

    .approver-deferral-review__decision-actions {
      flex-direction: column-reverse;
    }

    .approver-deferral-review__decision-secondary.ant-btn,
    .approver-deferral-review__decision-primary.ant-btn {
      width: 100%;
    }
  }
`;

const isApprovalMarkedApproved = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "approved";

const formatHistoryTimestamp = (value) => {
  if (!value) return "";

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return String(value);
  }

  return parsed.format("DD MMM YYYY HH:mm");
};

const DeferralDetailModal = ({
  visible = true,
  deferral,
  actionLoading,
  onDownloadPDF,
  onClose,
  onApprove,
  onReturnForRework,
  approvalConfirmVisible,
  onApprovalConfirm,
  onApprovalCancel,
  reworkConfirmVisible,
  reworkComment,
  onReworkCommentChange,
  onReworkConfirm,
  onReworkCancel,
  creatorComment,
  onCreatorCommentChange,
  sourceTab,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const isCloseRequestAction = sourceTab === "closeRequests";
  const closeRequestDocuments = useMemo(
    () => {
      if (!deferral) {
        return [];
      }

      if (isCloseRequestAction && Array.isArray(deferral.checkerCloseRequestDocuments)) {
        return getCloseRequestDocumentGroups({
          ...deferral,
          closeRequestDocuments: deferral.checkerCloseRequestDocuments,
        });
      }

      return getCloseRequestDocumentGroups(deferral);
    },
    [deferral, isCloseRequestAction],
  );
  const [checkerDocumentDecisions, setCheckerDocumentDecisions] = useState({});

  useEffect(() => {
    const nextState = closeRequestDocuments.reduce((accumulator, document) => {
      const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
      if (!key) {
        return accumulator;
      }

      const statusValue = String(document.checkerStatus || "").trim().toLowerCase();
      accumulator[key] = {
        status: ["approved", "rejected"].includes(statusValue) ? statusValue : "",
        comment: document.checkerComment || "",
        documentName: document.documentName,
      };
      return accumulator;
    }, {});

    setCheckerDocumentDecisions(nextState);
  }, [deferral?._id, deferral?.id, deferral?.updatedAt, closeRequestDocuments]);

  if (!deferral || !visible) {
    return null;
  }

  const approvalFlow = Array.isArray(deferral.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral.approvers)
      ? deferral.approvers
      : [];
  const normalizedCreatorApprovalStatus = String(
    deferral.creatorApprovalStatus || deferral.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const normalizedCheckerApprovalStatus = String(
    deferral.checkerApprovalStatus || deferral.checkerStatus || "",
  )
    .trim()
    .toLowerCase();
  const creatorApproved = isApprovalMarkedApproved(normalizedCreatorApprovalStatus);
  const checkerApproved = isApprovalMarkedApproved(normalizedCheckerApprovalStatus);
  const approvedApproversCount = approvalFlow.filter(
    (approver) =>
      approver?.approved === true ||
      isApprovalMarkedApproved(approver?.approvalStatus) ||
      isApprovalMarkedApproved(approver?.status),
  ).length;
  const allApproversApproved = approvalFlow.length > 0
    ? approvedApproversCount === approvalFlow.length
    : deferral.allApproversApproved === true;
  const status = String(deferral.status || "").trim().toLowerCase();
  const isRejected = ["rejected", "deferral_rejected"].includes(status);
  const isClosed = [
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
  ].includes(status);
  const canAccept = isCloseRequestAction
    ? status === "close_requested_creator_approved"
    : allApproversApproved && creatorApproved && !checkerApproved && !isRejected && !isClosed;
  const canReturnForRework = !isCloseRequestAction && canAccept;
  const { dclDocs, uploadedDocs, requestedDocs } =
    getDeferralDocumentBuckets(deferral);
  const generalUploadedDocs = uploadedDocs.filter(
    (doc) => !doc.isCloseRequestEvidence,
  );
  const isCloseRequestContext = [
    "close_requested",
    "close_requested_creator_approved",
    "closed",
  ].includes(status);
  const requestedDocsWithDates = requestedDocs.map((doc) => {
    const requestedDays = doc.requestedDays || doc.daysSought || 0;
    const newDueDate =
      doc.nextDocumentDueDate ||
      deferral.nextDocumentDueDate ||
      (deferral.createdAt
        ? dayjs(deferral.createdAt).add(requestedDays, "days").toISOString()
        : null);

    return {
      ...doc,
      newDueDate,
    };
  });
  const uploadedDocumentCount =
    dclDocs.length + generalUploadedDocs.length + closeRequestDocuments.length;
  const pendingCheckerDecisions = isCloseRequestAction
    ? closeRequestDocuments.filter((document) => {
        const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const decision = checkerDocumentDecisions[key];
        return !["approved", "rejected"].includes(String(decision?.status || "").toLowerCase());
      }).length
    : 0;

  const updateCheckerDocumentDecision = (document, updates) => {
    const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
    if (!key) {
      return;
    }

    setCheckerDocumentDecisions((current) => ({
      ...current,
      [key]: {
        status: current[key]?.status || "",
        comment: current[key]?.comment || "",
        documentName: document.documentName,
        ...updates,
      },
    }));
  };

  const history = (function buildHistory() {
    const events = [];

    if (Array.isArray(deferral.comments)) {
      deferral.comments.forEach((comment) => {
        if (comment.isSystemComment || comment.isSystem) {
          return;
        }
        if (!String(comment.text || "").trim()) {
          return;
        }
        events.push({
          user:
            comment.author?.name || comment.authorName || comment.userName || "User",
          userRole: comment.author?.role || comment.authorRole || "User",
          date: comment.createdAt,
          comment: comment.text || "",
          isSystemComment: Boolean(comment.isSystemComment || comment.isSystem),
        });
      });
    }

    return dedupeHistoryEntries(events);
  })();

  const downloadDeferralAsPDF = async () => {
    if (!deferral?._id) {
      return;
    }

    setDownloadLoading(true);
    try {
      await downloadDeferralPdf(deferral, {
        requestedDocsWithDates,
        history,
        closeRequestDocuments,
      });
      antMessage.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      antMessage.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  const requestedDocsColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>{value || "-"}</span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, doc) => doc.type || doc.documentType || "-",
    },
    {
      title: "Requested Days",
      key: "requestedDays",
      render: (_, doc) => doc.requestedDays || doc.daysSought || "-",
    },
    {
      title: "New Due Date",
      key: "newDueDate",
      render: (_, doc) =>
        doc.newDueDate ? dayjs(doc.newDueDate).format("DD MMM YYYY") : "-",
    },
  ];

  const uploadedDocumentColumns = [
    {
      title: "Document",
      key: "document",
      render: (_, doc) => (
        <div>
          <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {doc.name || "Uploaded Document"}
          </div>
          {doc.uploadDate ? (
            <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
              {`Uploaded ${dayjs(doc.uploadDate).format("DD MMM YYYY")}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, doc) => (
        <div className="deferral-review-actionset">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(doc.fileUrl || doc.url)}
            disabled={!doc.fileUrl && !doc.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(doc.fileUrl || doc.url, doc.name)}
            disabled={!doc.fileUrl && !doc.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const closeRequestUploadColumns = [
    {
      title: "File",
      key: "file",
      render: (_, upload) => (
        <div>
          <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {upload.name || "Evidence Document"}
          </div>
          {upload.uploadDate ? (
            <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
              {`Uploaded ${dayjs(upload.uploadDate).format("DD MMM YYYY")}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, upload) => (
        <div className="deferral-review-actionset">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(upload.fileUrl || upload.url)}
            disabled={!upload.fileUrl && !upload.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(upload.fileUrl || upload.url, upload.name)}
            disabled={!upload.fileUrl && !upload.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const closeRequestColumns = [
    {
      title: "Document",
      dataIndex: "documentName",
      key: "documentName",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>{value || "-"}</span>
      ),
    },
    {
      title: "RM Comment",
      dataIndex: "comment",
      key: "comment",
      render: (value) => value || "-",
    },
    {
      title: "Creator Review",
      key: "creatorReview",
      render: (_, document) => {
        const reviewState = String(document.creatorStatus || "pending").toLowerCase();
        const label =
          reviewState === "approved"
            ? "Approved"
            : reviewState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{
                color:
                  reviewState === "approved"
                    ? SUCCESS_GREEN
                    : reviewState === "rejected"
                      ? ERROR_RED
                      : PRIMARY_BLUE,
              }}
            >
              {label}
            </div>
          </div>
        );
      },
    },
    {
      title: "Checker Review",
      key: "checkerReview",
      render: (_, document) => {
        const decisionKey = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const liveDecision = checkerDocumentDecisions[decisionKey];
        const reviewState = String(liveDecision?.status || document.checkerStatus || "pending").toLowerCase();
        const label =
          reviewState === "approved"
            ? "Approved"
            : reviewState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{
                color:
                  reviewState === "approved"
                    ? SUCCESS_GREEN
                    : reviewState === "rejected"
                      ? ERROR_RED
                      : PRIMARY_BLUE,
              }}
            >
              {label}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 220,
      render: (_, document) => {
        const decisionKey = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const decision = checkerDocumentDecisions[decisionKey] || {
          status: "",
          comment: "",
          documentName: document.documentName,
        };

        if (!isCloseRequestAction || !canAccept) {
          return (
            <span className="deferral-review-status-pill" style={{ color: PRIMARY_BLUE }}>
              {decision.status === "approved"
                ? "Approved"
                : decision.status === "rejected"
                  ? "Rejected"
                  : "Awaiting checker decision"}
            </span>
          );
        }

        return (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                size="small"
                type={decision.status === "approved" ? "primary" : "default"}
                onClick={() => updateCheckerDocumentDecision(document, { status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger={decision.status === "rejected"}
                type={decision.status === "rejected" ? "primary" : "default"}
                onClick={() => updateCheckerDocumentDecision(document, { status: "rejected" })}
              >
                Reject
              </Button>
            </div>
          </div>
        );
      },
    },
  ];

  const approvalFlowColumns = [
    {
      title: "Step",
      key: "step",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Role",
      key: "role",
      render: (_, approver) => approver.designation || approver.role || "-",
    },
    {
      title: "Approver",
      key: "approver",
      render: (_, approver) => approver.name || approver.approverName || "User",
    },
    {
      title: "Status",
      key: "status",
      render: (_, approver, index) => {
        const approved =
          approver.approved || isApprovalMarkedApproved(approver.approvalStatus);
        const isCurrent =
          !approved &&
          approvalFlow
            .slice(0, index)
            .every(
              (item) =>
                item.approved || isApprovalMarkedApproved(item.approvalStatus),
            );

        return (
          <span
            className="deferral-review-status-pill"
            style={{
              color: approved
                ? SUCCESS_GREEN
                : isCurrent
                  ? PRIMARY_BLUE
                  : "var(--color-text-muted)",
            }}
          >
            {approved ? "Approved" : isCurrent ? "Current" : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <style>{DETAIL_STYLES}</style>

      <div className="deferral-review-panel">
        <div className="deferral-review-container">
          <DeferralReviewHeader
            deferral={deferral}
            onClose={onClose}
            onViewDocuments={() => setActiveTab("documents")}
            documentCount={uploadedDocumentCount}
          />

          <div className="deferral-review-actionbar">
            <div className="deferral-review-actionbar__group">
              {canAccept ? (
                <Button
                  className="deferral-review-actionbar__button"
                  disabled={Boolean(actionLoading)}
                  onClick={onApprove}
                  icon={<CheckCircleOutlined />}
                >
                  {isCloseRequestAction ? "Submit Review" : "Accept"}
                </Button>
              ) : null}

              {canReturnForRework ? (
                <Button
                  className="deferral-review-actionbar__button"
                  disabled={Boolean(actionLoading)}
                  onClick={onReturnForRework}
                  icon={<ExclamationCircleOutlined />}
                >
                  Return for Rework
                </Button>
              ) : null}
            </div>

            <div className="deferral-review-actionbar__group deferral-review-actionbar__group--end">
              <Button
                className="deferral-review-actionbar__button"
                icon={<DownloadOutlined />}
                loading={downloadLoading || Boolean(actionLoading)}
                onClick={onDownloadPDF || downloadDeferralAsPDF}
              >
                Download PDF
              </Button>
              <Button
                className="deferral-review-actionbar__button ant-btn--secondary"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="deferral-review-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`deferral-review-tab${activeTab === tab.key ? " deferral-review-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="deferral-review-workspace">
            <div className="deferral-review-main">
              <div className="deferral-review-body">
                <Spin spinning={Boolean(actionLoading)}>
                  {activeTab === "details" ? (
                    <>
                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Workflow Status</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <DeferralStatusAlert deferral={deferral} />
                      </Card>

                      <Card
                        className="deferral-info-card deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <Descriptions className="deferral-review-summary" size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                          <Descriptions.Item label="Customer Name">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerName || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Customer Number">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Deferral No">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.deferralNumber || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="DCL No">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.dclNo || deferral.dclNumber || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Type">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanType || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Created At">
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              {deferral.createdAt ? dayjs(deferral.createdAt).format("DD MMM YYYY") : "-"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Status">
                            <Text
                              strong
                              style={{
                                color: checkerApproved
                                  ? SUCCESS_GREEN
                                  : isRejected
                                    ? ERROR_RED
                                    : PRIMARY_BLUE,
                              }}
                            >
                              {deferral.status
                                ? deferral.status.replace(/_/g, " ")
                                : "-"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Creator Status">
                            <Text style={{ color: creatorApproved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
                              {creatorApproved ? "Approved" : "Pending"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Checker Status">
                            <Text style={{ color: checkerApproved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
                              {checkerApproved ? "Approved" : "Pending"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Approvers Status">
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              {approvedApproversCount} of {approvalFlow.length} Approved
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Amount">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanAmountCategory || deferral.loanAmount || "Below 75 million"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Requested Documents">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{requestedDocsWithDates.length}</Text>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Review Summary</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-stats">
                          <div className="deferral-review-stat">
                            <div className="deferral-review-stat__label">Requested Docs</div>
                            <div className="deferral-review-stat__value">{requestedDocsWithDates.length}</div>
                          </div>
                          <div className="deferral-review-stat">
                            <div className="deferral-review-stat__label">Uploaded Docs</div>
                            <div className="deferral-review-stat__value">{dclDocs.length + generalUploadedDocs.length}</div>
                          </div>
                          <div className="deferral-review-stat">
                            <div className="deferral-review-stat__label">Approvals</div>
                            <div className="deferral-review-stat__value">{approvedApproversCount}</div>
                          </div>
                        </div>
                      </Card>

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Deferral Description</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-text-block">
                          {deferral.deferralDescription || "No description provided."}
                        </div>
                      </Card>

                      {deferral.facilities?.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({deferral.facilities.length})</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={deferral.facilities}
                              columns={getFacilityColumns()}
                              pagination={false}
                              size="small"
                              rowKey={(row, index) => row.facilityNumber || row._id || `facility-${index}`}
                              scroll={{ x: 600 }}
                            />
                          </div>
                        </Card>
                      ) : null}

                      {approvalFlow.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Approval Flow</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={approvalFlow}
                              columns={approvalFlowColumns}
                              pagination={false}
                              size="small"
                              rowKey={(approver, index) => approver._id || approver.userId || `approver-${index}`}
                              scroll={{ x: 640 }}
                            />
                          </div>
                        </Card>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {requestedDocsWithDates.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Document(s) to be Deferred ({requestedDocsWithDates.length})</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={requestedDocsWithDates}
                              columns={requestedDocsColumns}
                              pagination={false}
                              size="small"
                              rowKey={(doc, index) => doc.id || doc._id || `${doc.name || "doc"}-${index}`}
                              scroll={{ x: 720 }}
                            />
                          </div>
                        </Card>
                      ) : null}

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Mandatory: DCL Upload</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-table-shell">
                          <Table
                            dataSource={dclDocs}
                            columns={uploadedDocumentColumns}
                            pagination={false}
                            size="small"
                            rowKey={(doc, index) => doc.id || doc._id || `dcl-${index}`}
                            locale={{ emptyText: "Auto-generated DCL document pending upload" }}
                          />
                        </div>
                      </Card>

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Additional Documents ({generalUploadedDocs.length})</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-table-shell">
                          <Table
                            dataSource={generalUploadedDocs}
                            columns={uploadedDocumentColumns}
                            pagination={false}
                            size="small"
                            rowKey={(doc, index) => doc.id || doc._id || `upload-${index}`}
                            locale={{ emptyText: "No additional supporting documents" }}
                          />
                        </div>
                      </Card>

                      {isCloseRequestContext && closeRequestDocuments.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Close Request Documents ({closeRequestDocuments.length})</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={closeRequestDocuments}
                              columns={closeRequestColumns}
                              pagination={false}
                              size="small"
                              rowKey={(document) => document.key || document.documentName}
                              expandable={{
                                expandedRowRender: (document) => (
                                  <Table
                                    dataSource={document.uploads || []}
                                    columns={closeRequestUploadColumns}
                                    pagination={false}
                                    size="small"
                                    rowKey={(upload, index) => upload.id || upload._id || `${document.key}-upload-${index}`}
                                    locale={{ emptyText: "No uploaded close-request evidence found for this document." }}
                                  />
                                ),
                              }}
                              scroll={{ x: 1100 }}
                            />
                          </div>
                        </Card>
                      ) : null}
                    </>
                  )}
                </Spin>
              </div>
            </div>

            <aside className="deferral-review-sidebar">
              <div className="deferral-review-sidebar__section">
                <div className="deferral-review-sidebar__title">Recent Comments</div>
                {history.length === 0 ? (
                  <div className="deferral-review-sidebar__empty">No user comments yet.</div>
                ) : (
                  <div className="deferral-review-sidebar__history">
                    {history.map((item, index) => (
                      <div
                        key={`${item.date || item.createdAt || "comment"}-${index}`}
                        className="deferral-review-sidebar__history-item"
                      >
                        <div className="deferral-review-sidebar__history-meta">
                          <span className="deferral-review-sidebar__history-user">
                            {item.user || "User"}
                          </span>
                          <span className="deferral-review-sidebar__history-time">
                            {formatHistoryTimestamp(item.date || item.createdAt || item.timestamp)}
                          </span>
                        </div>
                        <div className="deferral-review-sidebar__history-text">
                          {item.comment || item.notes || item.message || item.text || "No comment provided."}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Modal
        title={(
          <div className="approver-deferral-review__decision-title">
            <span className="approver-deferral-review__decision-title-icon"><CheckCircleOutlined /></span>
            <span className="approver-deferral-review__decision-title-copy">
              <strong>{`${isCloseRequestAction ? "Submit Close Request Review" : "Confirm Acceptance"}: ${deferral.deferralNumber || "Deferral request"}`}</strong>
              <span>{isCloseRequestAction ? "Confirm the review and advance the close request to the next workflow stage." : "Confirm the request and advance it to the next workflow stage."}</span>
            </span>
          </div>
        )}
        open={approvalConfirmVisible}
        onCancel={onApprovalCancel}
        maskClosable={false}
        wrapClassName="approver-decision-modal"
        width={760}
        footer={[
          <div key="actions" className="approver-deferral-review__decision-actions">
            <Button
              className="approver-deferral-review__decision-secondary"
              onClick={onApprovalCancel}
              disabled={Boolean(actionLoading)}
            >
              Cancel
            </Button>,
            <Button
              className="approver-deferral-review__decision-primary"
              onClick={() => onApprovalConfirm?.({
                comment: creatorComment,
                checkerDocumentDecisions: closeRequestDocuments.map((document) => {
                  const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
                  const decision = checkerDocumentDecisions[key] || {};
                  return {
                    documentName: document.documentName,
                    status: decision.status || "pending",
                    comment: decision.comment || "",
                  };
                }),
              })}
              loading={Boolean(actionLoading)}
              disabled={Boolean(actionLoading) || (isCloseRequestAction && pendingCheckerDecisions > 0)}
            >
              {isCloseRequestAction ? "Yes, Submit Review" : "Yes, Approve"}
            </Button>
          </div>,
        ]}
      >
        <div className="approver-deferral-review__decision-card">
          <div className="approver-deferral-review__decision-summary">
            <div className="approver-deferral-review__decision-summary-title">
              {deferral.deferralNumber || (isCloseRequestAction ? "Close request review" : "Deferral request")}
            </div>
            <div className="approver-deferral-review__decision-summary-subtitle">
              {deferral.customerName || "Customer"}
            </div>
            <div className="approver-deferral-review__decision-summary-copy">
              {isCloseRequestAction
                ? pendingCheckerDecisions > 0
                  ? `Review ${pendingCheckerDecisions} remaining close-request document${pendingCheckerDecisions === 1 ? "" : "s"} before you submit.`
                  : "Approving this review will advance the close request and publish your decision to the workflow trail."
                : "Approving this request will advance it in the workflow and publish your decision to the review trail."}
            </div>
          </div>

          <div className="approver-deferral-review__decision-field">
            <label className="approver-deferral-review__decision-label" htmlFor="checker-approval-comment">
              Approval comments
            </label>
            <TextArea
              id="checker-approval-comment"
              rows={4}
              placeholder="Enter any additional comments..."
              value={creatorComment}
              onChange={(event) => onCreatorCommentChange?.(event.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={(
          <div className="approver-deferral-review__decision-title">
            <span className="approver-deferral-review__decision-title-icon"><RedoOutlined /></span>
            <span className="approver-deferral-review__decision-title-copy">
              <strong>{`Return for Rework: ${deferral.deferralNumber || "Deferral request"}`}</strong>
              <span>Send the request back with clear corrective instructions.</span>
            </span>
          </div>
        )}
        open={reworkConfirmVisible}
        onCancel={onReworkCancel}
        maskClosable={false}
        wrapClassName="approver-decision-modal"
        width={760}
        footer={[
          <div key="actions" className="approver-deferral-review__decision-actions">
            <Button
              className="approver-deferral-review__decision-secondary"
              onClick={onReworkCancel}
              disabled={Boolean(actionLoading)}
            >
              Cancel
            </Button>,
            <Button
              className="approver-deferral-review__decision-primary approver-deferral-review__warning-btn"
              style={{ color: "#fff" }}
              onClick={onReworkConfirm}
              loading={Boolean(actionLoading)}
              disabled={!String(reworkComment || "").trim()}
            >
              Yes, Return for Rework
            </Button>
          </div>,
        ]}
      >
        <div className="approver-deferral-review__decision-card">
          <div className="approver-deferral-review__decision-summary">
            <div className="approver-deferral-review__decision-summary-title">
              {deferral.deferralNumber || "Deferral request"}
            </div>
            <div className="approver-deferral-review__decision-summary-subtitle">
              {deferral.customerName || "Customer"}
            </div>
            <div className="approver-deferral-review__decision-summary-copy">
              Returning this request will send it back with your instructions so the originating team can correct it.
            </div>
          </div>

          <div className="approver-deferral-review__decision-field">
            <label className="approver-deferral-review__decision-label" htmlFor="checker-rework-comment">
              Rework instructions (Required)
            </label>
            <TextArea
              id="checker-rework-comment"
              rows={4}
              placeholder="Enter rework instructions..."
              value={reworkComment}
              onChange={(event) => onReworkCommentChange?.(event.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeferralDetailModal;