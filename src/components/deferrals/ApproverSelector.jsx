import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Divider, Select, Spin, Typography } from "antd";
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useLazySearchAdUsersQuery } from "../../api/adSearchApi";
import "../../styles/creatorDesignSystem.css";

const { Text } = Typography;
const { Option } = Select;

export default function ApproverSelector({
  slots = [],
  updateApprover,
  addApprover,
  removeApprover,
  onSubmitDeferral,
  isSubmitting,
  selectedDocuments = [],
  loanAmount = "",
}) {
  const [directoryApprovers, setDirectoryApprovers] = useState([]);
  const [directorySearchText, setDirectorySearchText] = useState("");
  const directorySearchCacheRef = useRef(new Map());
  const directorySearchDebounceRef = useRef(null);
  const directorySearchRequestIdRef = useRef(0);
  const [directoryHint, setDirectoryHint] = useState(
    "Type to filter Active Directory staff",
  );
  const [triggerDirectorySearch, { isFetching: isSearchingDirectory }] =
    useLazySearchAdUsersQuery();

  const requiredSteps = slots.length;
  const selectedCount = slots.filter((slot) => !!slot.userId).length;
  const remainingApprovers = Math.max(requiredSteps - selectedCount, 0);
  const selectedUserIds = slots
    .filter((slot) => !!slot.userId)
    .map((slot) => String(slot.userId));
  const hasDuplicateApprovers =
    new Set(selectedUserIds).size !== selectedUserIds.length;
  const hasDocuments =
    Array.isArray(selectedDocuments) && selectedDocuments.length > 0;
  const hasLoanAmount = !!String(loanAmount || "").trim();
  const canDetermineMatrix = hasDocuments && hasLoanAmount;

  const parsedLoanAmount = useMemo(() => {
    const loanStr = String(loanAmount || "")
      .toLowerCase()
      .trim();

    // Handle predefined dropdown values
    if (loanStr === "above75") return 76000000; // Above threshold
    if (loanStr === "below75") return 74000000; // Below threshold

    // Handle numeric input (fallback for direct number entry)
    const normalized = loanStr.replace(/[^0-9.-]+/g, "");
    return parseFloat(normalized) || 0;
  }, [loanAmount]);

  const matrixLabel = useMemo(() => {
    if (!canDetermineMatrix || requiredSteps === 0) {
      return "Approver Matrix Pending";
    }

    const hasPrimary = selectedDocuments.some(
      (doc) => String(doc?.type || "").toLowerCase() === "primary",
    );
    const hasSecondary = selectedDocuments.some(
      (doc) => String(doc?.type || "").toLowerCase() === "secondary",
    );
    const amountLabel = parsedLoanAmount > 75000000 ? "Above 75M" : "Below 75M";

    if (hasPrimary) return `Primary Documents (${amountLabel})`;
    if (hasSecondary) return `Secondary Documents (${amountLabel})`;
    return `Selected Documents (${amountLabel})`;
  }, [canDetermineMatrix, requiredSteps, selectedDocuments, parsedLoanAmount]);

  const canSubmit =
    requiredSteps > 0 &&
    selectedCount === requiredSteps &&
    !hasDuplicateApprovers;

  const upsertDirectoryApprovers = (users) => {
    const normalizedUsers = (users || [])
      .map((user) => {
        const identifier = String(
          user?.id ??
            user?._id ??
            user?.userId ??
            user?.UserIdentifier ??
            user?.userIdentifier ??
            user?.samAccountName ??
            user?.samAccount ??
            user?.email ??
            user?.mail ??
            user?.userPrincipalName ??
            user?.accountName ??
            ""
        ).trim();

        if (!identifier) {
          return null;
        }

        return {
          id: identifier,
          name:
            user?.displayName ??
            user?.name ??
            user?.fullName ??
            user?.commonName ??
            user?.cn ??
            user?.email ??
            user?.mail ??
            user?.samAccountName ??
            user?.samAccount ??
            "Unknown Staff",
          email: user?.email ?? user?.mail ?? "",
          samAccountName: user?.samAccountName ?? user?.samAccount ?? "",
          department:
            user?.department ?? user?.Department ?? user?.division ?? "",
          title:
            user?.title ??
            user?.jobTitle ??
            user?.position ??
            user?.role ??
            "",
          position:
            user?.position ?? user?.jobTitle ?? user?.title ?? user?.role ?? "",
          role:
            user?.role ??
            user?.Role ??
            "",
        };
      })
      .filter(Boolean);

    setDirectoryApprovers((prev) => {
      const optionMap = new Map(prev.map((item) => [String(item.id), item]));

      slots.forEach((slot) => {
        if (!slot?.userId) {
          return;
        }

        optionMap.set(String(slot.userId), {
          id: String(slot.userId),
          name: slot.name || slot.email || slot.samAccountName || String(slot.userId),
          email: slot.email || "",
          samAccountName: slot.samAccountName || "",
          department: slot.department || "",
          title: "",
          position: slot.position || slot.role || "",
        });
      });

      normalizedUsers.forEach((user) => {
        optionMap.set(String(user.id), user);
      });

      return Array.from(optionMap.values());
    });
  };

  const searchDirectoryOnServer = async (rawQuery) => {
    const query = String(rawQuery || "").trim();
    if (!query) return;

    // Requirement: once user types one character, show the full AD staff listing.
    const shouldLoadAllStaff = query.length === 1;
    const effectiveQuery = shouldLoadAllStaff ? "*" : query;
    const effectiveMaxResults = shouldLoadAllStaff ? 1000 : 200;

    const normalizedKey = shouldLoadAllStaff ? "__all__" : query.toLowerCase();
    if (directorySearchCacheRef.current.has(normalizedKey)) {
      const cachedUsers = directorySearchCacheRef.current.get(normalizedKey) || [];
      upsertDirectoryApprovers(cachedUsers);
      setDirectoryHint("");
      return;
    }

    const requestId = ++directorySearchRequestIdRef.current;
    setDirectoryHint("Searching Active Directory...");

    try {
      const users = await triggerDirectorySearch(
        { query: effectiveQuery, maxResults: effectiveMaxResults },
        true,
      ).unwrap();

      if (requestId !== directorySearchRequestIdRef.current) return;

      const arr = Array.isArray(users) ? users : [];
      directorySearchCacheRef.current.set(normalizedKey, arr);
      upsertDirectoryApprovers(arr);
      setDirectoryHint(arr.length ? "" : "No matching staff found in Active Directory");
    } catch (error) {
      if (requestId !== directorySearchRequestIdRef.current) return;
      const status = Number(error?.status ?? error?.originalStatus);
      if (status === 503) {
        setDirectoryHint("Active Directory service is unavailable right now.");
      } else if (status === 504) {
        setDirectoryHint("Active Directory request timed out. Please retry.");
      } else {
        setDirectoryHint("Active Directory search failed. Try again.");
      }
    }
  };

  const filteredDirectoryApprovers = useMemo(() => {
    const normalizedQuery = String(directorySearchText || "")
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return directoryApprovers;
    }

    // Always keep selected approvers visible even if they don't match the current filter.
    const selectedIdSet = new Set(selectedUserIds.map(String));

    return (directoryApprovers || []).filter((user) => {
      const id = String(user?.id ?? user?._id ?? "");
      if (selectedIdSet.has(id)) return true;

      const haystack = [
        user?.name,
        user?.email,
        user?.samAccountName,
        user?.department,
        user?.title,
        user?.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [directoryApprovers, directorySearchText, selectedUserIds]);

  const notFoundText = useMemo(() => {
    if (isSearchingDirectory) return "";
    const normalizedQuery = String(directorySearchText || "").trim();
    const hintLooksLikeError = /unavailable|timed out|failed/i.test(
      String(directoryHint || ""),
    );
    if (!normalizedQuery) {
      return directoryHint || "Type at least 1 character to search Active Directory staff";
    }
    if (hintLooksLikeError) {
      return directoryHint;
    }
    return "No matching staff found in Active Directory";
  }, [directoryHint, directorySearchText, isSearchingDirectory]);

  const getApproverLabel = (index) => {
    if (index === requiredSteps - 1) return "Final Approver";
    return `Approver ${index + 1}`;
  };

  const handleSubmitClick = () => {
    if (!canSubmit || isSubmitting) return;
    if (typeof onSubmitDeferral === "function") {
      onSubmitDeferral();
    }
  };

  const handleAddApproverBetween = (insertIndex) => {
    if (typeof addApprover !== "function") return;
    addApprover(insertIndex, "Approver");
  };

  return (
    <div className="deferral-approver-selector">
      <style>{`
        .deferral-approver-selector {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 78vh;
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          padding: 0 4px 12px;
          min-height: 0;
        }
        .deferral-approver-selector-title {
          color: var(--color-text-dark) !important;
          margin-bottom: 8px !important;
          font-size: 17px !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em;
        }
        .deferral-approver-selector .ant-divider {
          border-color: rgba(214, 189, 152, 0.18) !important;
        }
        .deferral-approver-alert.ant-alert {
          border-radius: 10px !important;
          background: rgba(214, 189, 152, 0.12) !important;
          border: 1px solid rgba(214, 189, 152, 0.45) !important;
          color: var(--color-text-dark) !important;
          margin-bottom: 12px;
        }
        .deferral-approver-alert .ant-alert-message {
          color: var(--color-text-dark) !important;
          font-size: 13px;
          font-weight: 600;
        }
        .deferral-approver-summary {
          border: 1px solid rgba(214, 189, 152, 0.28);
          border-radius: 10px;
          padding: 12px;
          background: rgba(245, 247, 244, 0.82);
          margin-bottom: 10px;
        }
        .deferral-approver-summary-title {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-dark);
          font-size: 13px;
          font-weight: 600;
        }
        .deferral-approver-summary-caption {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .deferral-approver-summary-stats {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .deferral-approver-summary-stat {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          color: var(--color-text-light);
        }
        .deferral-approver-summary-pill {
          border: 1px solid rgba(214, 189, 152, 0.22);
          background: var(--color-white);
          color: var(--color-text-medium);
          border-radius: 999px;
          padding: 2px 8px;
          font-weight: 600;
        }
        .deferral-approver-empty {
          text-align: center;
          padding: 42px 14px;
          color: var(--color-text-light);
        }
        .deferral-approver-empty-icon {
          font-size: 64px;
          color: rgba(103, 125, 106, 0.28);
        }
        .deferral-approver-empty-dots {
          margin-top: 14px;
          color: rgba(103, 125, 106, 0.36);
          line-height: 1;
        }
        .deferral-approver-empty-title {
          margin: 12px 0 6px !important;
          color: rgba(64, 83, 76, 0.52) !important;
          font-size: 15px;
          font-weight: 600;
        }
        .deferral-approver-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .deferral-approver-slot {
          padding: 12px;
          border: 1px solid rgba(214, 189, 152, 0.18);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.92);
        }
        .deferral-approver-slot-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-dark) !important;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .deferral-approver-selector .ant-select-selection-item,
        .deferral-approver-selector .ant-select-selection-placeholder,
        .deferral-approver-selector .ant-select-item,
        .deferral-approver-selector .ant-typography,
        .deferral-approver-selector .ant-btn {
          font-size: 13px !important;
        }
        .deferral-approver-selector .ant-select-selector {
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 8px !important;
          min-height: 42px !important;
          box-shadow: none !important;
        }
        .deferral-approver-selector .ant-select-selector:hover,
        .deferral-approver-selector .ant-select-focused .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .deferral-approver-add-btn.ant-btn {
          width: 100%;
          margin-top: 10px;
          border-radius: 8px !important;
          border: 1px dashed rgba(214, 189, 152, 0.45) !important;
          background: rgba(245, 247, 244, 0.8) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .deferral-approver-remove-btn.ant-btn {
          margin-top: 6px;
          padding-left: 0 !important;
          color: #b42318 !important;
        }
        .deferral-approver-footer {
          background: transparent;
          border-top: 1px solid rgba(214, 189, 152, 0.16);
          padding: 14px 0 10px;
          margin-top: 10px;
        }
        .deferral-approver-submit.ant-btn {
          width: 100%;
          border-radius: 8px !important;
          border: none !important;
          background: var(--ncb-primary-500) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(26, 54, 54, 0.12) !important;
        }
        .deferral-approver-submit.ant-btn[disabled],
        .deferral-approver-submit.ant-btn:disabled {
          background: #d1d5db !important;
          color: #6b7280 !important;
          box-shadow: none !important;
        }
        .deferral-approver-status {
          font-size: 13px;
          text-align: center;
          min-height: 36px;
          padding-top: 10px;
          line-height: 1.45;
        }
        .deferral-approver-status--danger {
          color: #b42318;
        }
        .deferral-approver-status--success {
          color: #166534;
          font-weight: 600;
        }
        .deferral-approver-status--warning {
          color: #b45309;
        }
        .deferral-approver-matrix-note {
          margin-top: 4px;
        }
        .deferral-approver-selector-title {
          color: #164679 !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          font-family: inherit !important;
          letter-spacing: -0.02em;
          line-height: 1.3;
          margin: 0 0 12px !important;
        }
      `}</style>
      <div className="deferral-approver-selector-title">
        Approver Selection Matrix
      </div>

      {!canDetermineMatrix || requiredSteps === 0 ? (
        <Alert
          className="deferral-approver-alert"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Select loan amount and documents to determine approver matrix"
        />
      ) : (
        <div className="deferral-approver-summary">
          <div className="deferral-approver-summary-title">
            Applied: {matrixLabel}
          </div>
          <div className="deferral-approver-summary-caption">
            For selected documents with current loan amount
          </div>
          <div className="deferral-approver-summary-stats">
            <Text type="secondary" className="deferral-approver-summary-stat">
              <span>Required Steps:</span>
              <span className="deferral-approver-summary-pill">
                {requiredSteps} levels
              </span>
            </Text>
            <Text type="secondary" className="deferral-approver-summary-stat">
              <span>Completed:</span>
              <span className="deferral-approver-summary-pill">
                {selectedCount}/{requiredSteps}
              </span>
            </Text>
          </div>
        </div>
      )}

      <Divider style={{ margin: "16px 0" }} />

      <div className="deferral-approver-list">
        {!canDetermineMatrix || requiredSteps === 0 ? (
          <div className="deferral-approver-empty">
            <InfoCircleOutlined className="deferral-approver-empty-icon" />
            <div className="deferral-approver-empty-dots" style={{ fontSize: 32 }}>·</div>
            <div className="deferral-approver-empty-dots" style={{ fontSize: 28 }}>·</div>
            <div className="deferral-approver-empty-title">
              Approver Matrix Pending
            </div>
            <Text type="secondary">
              Select loan amount and documents to determine approver matrix
            </Text>
          </div>
        ) : (
          <>
            {slots.map((slot, index) => (
              <div key={`selector-${index}`} className="deferral-approver-slot">
                <Text strong className="deferral-approver-slot-label">
                  {getApproverLabel(index)}: {slot.role || "Approver"}
                </Text>
                <Select
                  value={slot.userId || undefined}
                  onChange={(value, option) => {
                    const selectedApprover =
                      option?.directoryApprover ||
                      directoryApprovers.find(
                        (approver) => String(approver.id) === String(value),
                      );

                    updateApprover(index, value, slot.role || "Approver", {
                      name: selectedApprover?.name || "",
                      email: selectedApprover?.email || "",
                      samAccountName: selectedApprover?.samAccountName || "",
                      department: selectedApprover?.department || "",
                      role: selectedApprover?.role || "",
                      position: slot.role || slot.position || "",
                    });
                  }}
                  onClear={() =>
                    updateApprover(index, "", slot.role || "Approver", {})
                  }
                  onSearch={(value) => {
                    const v = String(value || "");
                    setDirectorySearchText(v);

                    if (directorySearchDebounceRef.current) {
                      clearTimeout(directorySearchDebounceRef.current);
                    }

                    const trimmed = v.trim();
                    if (trimmed.length >= 1) {
                      directorySearchDebounceRef.current = setTimeout(() => {
                        searchDirectoryOnServer(trimmed);
                      }, 220);
                      return;
                    }

                    if (!trimmed) {
                      return;
                    }

                    setDirectoryHint(
                      "Type at least 1 character to search Active Directory staff"
                    );
                  }}
                  onDropdownVisibleChange={(open) => {
                    if (open) {
                      setDirectorySearchText("");
                      if (directorySearchDebounceRef.current) {
                        clearTimeout(directorySearchDebounceRef.current);
                      }
                      setDirectoryHint(
                        "Type at least 1 character to search Active Directory staff"
                      );
                    }
                  }}
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="Search Active Directory staff"
                  size="middle"
                  showSearch
                  allowClear
                  filterOption={false}
                  loading={isSearchingDirectory}
                  notFoundContent={
                    isSearchingDirectory ? (
                      <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <Spin size="small" />
                      </div>
                    ) : (
                      <Text type="secondary">{notFoundText}</Text>
                    )
                  }
                >
                  {Array.isArray(filteredDirectoryApprovers) &&
                  filteredDirectoryApprovers.length > 0
                    ? filteredDirectoryApprovers.map((approver) => (
                        <Option
                          key={approver.id}
                          value={approver.id}
                          directoryApprover={approver}
                          disabled={
                            selectedUserIds.includes(String(approver.id)) &&
                            String(slot.userId || "") !==
                              String(approver.id)
                          }
                        >
                          {approver.name}
                          {approver.role
                            ? ` [${approver.role}]`
                            : ""}
                          {(approver.title || approver.position)
                            ? ` — ${approver.title || approver.position}`
                            : ""}
                          {approver.department
                            ? ` (${approver.department})`
                            : ""}
                        </Option>
                      ))
                    : null}
                </Select>

                {index < slots.length - 1 && (
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => handleAddApproverBetween(index + 1)}
                    className="deferral-approver-add-btn"
                    aria-label="Add approver"
                  />
                )}

                {slot.isCustom === true &&
                  typeof removeApprover === "function" && (
                    <Button
                      type="link"
                      className="deferral-approver-remove-btn"
                      onClick={() => removeApprover(index)}
                    >
                      Remove
                    </Button>
                  )}
              </div>
            ))}
          </>
        )}
      </div>
      <div className="deferral-approver-footer">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            onClick={handleSubmitClick}
            htmlType="button"
            loading={isSubmitting}
            size="large"
            type="primary"
            className="deferral-approver-submit"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Deferral"}
          </Button>
        </div>

        <div className="deferral-approver-status">
          {!canDetermineMatrix || requiredSteps === 0 ? (
            <Text type="secondary">
              Complete loan amount and document selection first
            </Text>
          ) : hasDuplicateApprovers ? (
            <div className="deferral-approver-status--danger">
              <WarningOutlined /> Same approver cannot be selected in more than
              one step
            </div>
          ) : canSubmit ? (
            <div className="deferral-approver-status--success">
              <CheckCircleOutlined /> All approvers correctly selected
            </div>
          ) : (
            <div className="deferral-approver-status--warning">
              <WarningOutlined /> Need {remainingApprovers} more approver(s)
            </div>
          )}
          {canDetermineMatrix && requiredSteps > 0 && (
            <div className="deferral-approver-matrix-note">
              <Text type="secondary" style={{ fontSize: 11 }}>
                Matrix: {matrixLabel}
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}