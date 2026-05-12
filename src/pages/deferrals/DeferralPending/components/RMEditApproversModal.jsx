import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select, Spin, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useLazySearchAdUsersQuery } from "../../../../api/adSearchApi";
import { WARNING_ORANGE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const { Text } = Typography;

const RMEditApproversModal = ({
  open,
  embedded = false,
  editedApprovers,
  handleApproverChange,
  handleApproverSelection,
  handleRemoveApprover,
  handleAddApprover,
  approversFromDb,
  loadingApprovers,
  confirmingApprovers,
  onCancel,
  onConfirm,
  /** Hide hero + “Approval Flow Setup” intro (e.g. embedded in Resubmit modal). */
  suppressIntro = false,
  /** Hide Cancel / Confirm Approvers footer. */
  suppressFooter = false,
  /** Hide the orange note block. */
  suppressNote = false,
  /** Show a trailing “+” to append an approver (Resubmit modal parity). */
  showTrailingInsert = false,
}) => {
  const [directoryApprovers, setDirectoryApprovers] = useState([]);
  const debounceRef = useRef(null);
  const directorySearchCacheRef = useRef(new Map());
  const directorySearchRequestIdRef = useRef(0);
  const [directoryHint, setDirectoryHint] = useState(
    "Open the list or type at least 1 character to search Active Directory staff",
  );
  const [directorySearchText, setDirectorySearchText] = useState("");
  const [triggerDirectorySearch, { isFetching: isSearchingDirectory }] =
    useLazySearchAdUsersQuery();

  const upsertDirectoryApprovers = (users = []) => {
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
            "",
        ).trim();

        if (!identifier) return null;

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
          role: user?.role ?? user?.Role ?? "",
        };
      })
      .filter(Boolean);

    setDirectoryApprovers((prev) => {
      const map = new Map(prev.map((item) => [String(item.id), item]));

      normalizedUsers.forEach((user) => {
        map.set(String(user.id), user);
      });

      return Array.from(map.values());
    });
  };

  const allDirectoryApprovers = useMemo(() => {
    const map = new Map();

    [...(approversFromDb || []), ...(directoryApprovers || [])].forEach((user) => {
      const id = String(user?.id || user?._id || "").trim();
      if (!id) return;
      map.set(id, {
        id,
        name: user?.name || user?.displayName || user?.email || user?.samAccountName || id,
        email: user?.email || "",
        samAccountName: user?.samAccountName || "",
        department: user?.department || "",
        title: user?.title || user?.position || "",
        position: user?.position || user?.title || "",
        role: user?.role || "",
      });
    });

    (editedApprovers || []).forEach((approver) => {
      if (!approver?.userId) return;
      map.set(String(approver.userId), {
        id: String(approver.userId),
        name: approver.name || approver.email || approver.samAccountName || String(approver.userId),
        email: approver.email || "",
        samAccountName: approver.samAccountName || "",
        department: approver.department || "",
        title: "",
        position: approver.position || approver.role || "",
        role: approver.role || "",
      });
    });

    return Array.from(map.values());
  }, [approversFromDb, directoryApprovers, editedApprovers]);

  const getAvailableApproversForStep = useCallback(
    (stepIndex, stepApprover) => {
      const normalizedQuery = String(directorySearchText || "").trim().toLowerCase();

      const matchesQuery = (user) => {
        const haystack = [
          user?.name,
          user?.email,
          user?.samAccountName,
          user?.department,
          user?.title,
          user?.position,
          user?.role,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      };

      const list = (allDirectoryApprovers || []).filter((user) => {
        const userId = user.id;
        if (String(userId) === String(stepApprover?.userId)) {
          return true;
        }
        if (normalizedQuery && !matchesQuery(user)) {
          return false;
        }
        return !editedApprovers.some(
          (a, i) =>
            i !== stepIndex &&
            a.userId &&
            String(a.userId) === String(userId),
        );
      });

      return [...list].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
          sensitivity: "base",
        }),
      );
    },
    [allDirectoryApprovers, directorySearchText, editedApprovers],
  );

  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const searchDirectoryOnServer = async (rawQuery, { openDropdown = false } = {}) => {
    const trimmed = String(rawQuery || "").trim();
    const shouldLoadAllStaff = openDropdown || trimmed.length === 1;
    const effectiveQuery = shouldLoadAllStaff ? "*" : trimmed;
    const effectiveMaxResults = shouldLoadAllStaff ? 1000 : 200;

    if (!openDropdown && !trimmed) {
      return;
    }

    const normalizedKey = shouldLoadAllStaff ? "__all__" : trimmed.toLowerCase();
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

  const handleDirectorySearch = (rawQuery) => {
    const trimmed = String(rawQuery || "").trim();
    setDirectorySearchText(trimmed);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (trimmed.length >= 1) {
      debounceRef.current = setTimeout(() => {
        searchDirectoryOnServer(trimmed);
      }, 120);
      return;
    }

    setDirectoryHint(
      "Type at least 1 character to search Active Directory staff",
    );
  };

  const notFoundText = useMemo(() => {
    if (isSearchingDirectory) return "";
    const normalizedQuery = String(directorySearchText || "").trim();
    const hintLooksLikeError = /unavailable|timed out|failed/i.test(
      String(directoryHint || ""),
    );
    if (!normalizedQuery) {
      return (
        directoryHint ||
        "Type at least 1 character to search Active Directory staff"
      );
    }
    if (hintLooksLikeError) {
      return directoryHint;
    }
    return "No matching staff found in Active Directory";
  }, [directoryHint, directorySearchText, isSearchingDirectory]);

  if (!open) {
    return null;
  }

  return (
    <>
      <style>{`
        .rm-edit-approvers-panel {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 24px;
        }
        .rm-edit-approvers-modal-hero {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding-right: 0;
          margin-bottom: 24px;
        }
        .rm-edit-approvers-modal-hero-copy h2 {
          margin: 0;
          color: var(--color-heading);
          font-size: 16px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }
        .rm-edit-approvers-modal-hero-copy p {
          margin: 6px 0 0;
          color: var(--color-text-light);
          font-size: 13px;
          line-height: 1.45;
        }
        .rm-edit-approvers-modal-shell {
          margin-bottom: 26px;
        }
        .rm-edit-approvers-modal-heading {
          margin-bottom: 20px;
        }
        .rm-edit-approvers-modal-heading h3 {
          margin: 0;
          color: var(--color-text-dark);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .rm-edit-approvers-modal-heading p {
          margin: 10px 0 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.55;
        }
        .rm-edit-approvers-modal-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .rm-edit-approvers-modal-step {
          display: flex;
          gap: 16px;
          padding: 18px 18px 16px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 14px;
          border: 1px solid rgba(214, 189, 152, 0.18);
          align-items: flex-start;
          box-shadow: 0 10px 28px rgba(26, 54, 54, 0.06);
        }
        .rm-edit-approvers-modal-step--locked {
          background: #f2f4f7;
          border-color: rgba(208, 213, 221, 0.9);
        }
        .rm-edit-approvers-modal-step-index {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%);
          color: var(--color-white);
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 8px 18px rgba(26, 54, 54, 0.16);
        }
        .rm-edit-approvers-modal-step-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .rm-edit-approvers-modal-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rm-edit-approvers-modal-label {
          color: var(--color-text-medium);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .rm-edit-approvers-modal-step-fields .ant-input,
        .rm-edit-approvers-modal-step-fields .ant-select-selector {
          border: 1px solid #eaecf0 !important;
          border-radius: 10px !important;
          box-shadow: none !important;
          min-height: 46px !important;
          background: var(--color-white) !important;
          padding-inline: 14px !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-input {
          color: var(--color-text-dark);
          font-size: 13px;
        }
        .rm-edit-approvers-modal-step-fields .ant-input::placeholder,
        .rm-edit-approvers-modal-step-fields .ant-select-selection-placeholder {
          color: #98a2b3 !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-select-selection-item,
        .rm-edit-approvers-modal-step-fields .ant-select-selection-placeholder,
        .rm-edit-approvers-modal-step-fields .ant-input,
        .rm-edit-approvers-modal-note {
          font-size: 13px !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-select-selection-item {
          color: var(--color-text-dark) !important;
          line-height: 44px !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-input:hover,
        .rm-edit-approvers-modal-step-fields .ant-input:focus,
        .rm-edit-approvers-modal-step-fields .ant-select-selector:hover,
        .rm-edit-approvers-modal-step-fields .ant-select-focused .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .rm-edit-approvers-modal-delete.ant-btn {
          color: #b42318 !important;
          border-radius: 10px !important;
          margin-top: 24px;
          border: 1px solid transparent !important;
        }
        .rm-edit-approvers-modal-delete.ant-btn:hover,
        .rm-edit-approvers-modal-delete.ant-btn:focus {
          background: rgba(180, 35, 24, 0.06) !important;
          border-color: rgba(180, 35, 24, 0.12) !important;
        }
        .rm-edit-approvers-modal-insert {
          display: flex;
          justify-content: center;
          padding: 0;
        }
        .rm-edit-approvers-modal-insert-btn.ant-btn {
          width: 38px;
          height: 38px;
          border-radius: 999px !important;
          border: 1px dashed rgba(52, 80, 76, 0.3) !important;
          background: transparent !important;
          color: var(--color-primary-medium) !important;
          box-shadow: none !important;
        }
        .rm-edit-approvers-modal-note {
          margin-top: 24px;
          padding: 15px 16px;
          background: #fffaf0;
          border: 1px solid rgba(214, 189, 152, 0.42);
          border-left: 4px solid ${WARNING_ORANGE};
          border-radius: 12px;
          font-size: 12px;
          color: var(--color-text-medium);
          line-height: 1.6;
        }
        .rm-edit-approvers-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 0;
          padding-top: 20px;
          border-top: 1px solid rgba(214, 189, 152, 0.16);
        }
        .rm-edit-approvers-modal-cancel.ant-btn {
          min-width: 92px;
          height: 44px;
          border-radius: 10px !important;
          border: 1px solid #d0d5dd !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
          font-weight: 600 !important;
        }
        .rm-edit-approvers-modal-cancel.ant-btn:disabled,
        .rm-edit-approvers-modal-cancel.ant-btn[disabled] {
          background: #d1d5db !important;
          border-color: #d1d5db !important;
          color: #374151 !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn {
          min-width: 156px;
          height: 44px;
          border-radius: 10px !important;
          border: none !important;
          background: var(--ncb-primary-500) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(58, 179, 229, 0.18) !important;
          font-weight: 700 !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn,
        .rm-edit-approvers-modal-confirm.ant-btn span,
        .rm-edit-approvers-modal-confirm.ant-btn .anticon,
        .rm-edit-approvers-modal-confirm.ant-btn * {
          color: #ffffff !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn:disabled,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] {
          background: #d1d5db !important;
          border-color: #d1d5db !important;
          box-shadow: none !important;
          color: #374151 !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn:disabled span,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] span,
        .rm-edit-approvers-modal-confirm.ant-btn:disabled .anticon,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] .anticon,
        .rm-edit-approvers-modal-confirm.ant-btn:disabled *,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] * {
          color: #374151 !important;
        }
        @media (max-width: 640px) {
          .rm-edit-approvers-panel {
            padding: 18px;
          }
          .rm-edit-approvers-modal-step {
            flex-direction: column;
          }
          .rm-edit-approvers-modal-delete.ant-btn {
            margin-top: 0;
            align-self: flex-end;
          }
          .rm-edit-approvers-modal-actions {
            flex-direction: column-reverse;
          }
          .rm-edit-approvers-modal-cancel.ant-btn,
          .rm-edit-approvers-modal-confirm.ant-btn {
            width: 100%;
          }
        }
      `}</style>
      <div className={`rm-edit-approvers-panel ${embedded ? "rm-edit-approvers-panel--embedded" : ""}`}>
        {!suppressIntro ? (
          <div className="rm-edit-approvers-modal-hero">
            <div className="rm-edit-approvers-modal-hero-copy">
              <h2>Edit Approvers</h2>
              <p>Review each step below, assign the right approver, and keep the existing sequence intact.</p>
            </div>
          </div>
        ) : null}

        <div className="rm-edit-approvers-modal-shell">
          {!suppressIntro ? (
            <div className="rm-edit-approvers-modal-heading">
              <h3>Approval Flow Setup</h3>
              <p>
                Review each step below, assign the right approver, and keep the
                existing sequence intact.
              </p>
            </div>
          ) : null}

          <div className="rm-edit-approvers-modal-list">
          {editedApprovers.map((approver, idx) => {
            const hasApproved = approver.approved || approver.approvalStatus === "approved";
            const nextApproverApproved =
              editedApprovers[idx + 1]?.approved ||
              editedApprovers[idx + 1]?.approvalStatus === "approved";

            return (
              <div key={approver._id || idx}>
                <div
                  className={`rm-edit-approvers-modal-step ${hasApproved ? "rm-edit-approvers-modal-step--locked" : ""}`}
                >
                  <div className="rm-edit-approvers-modal-step-index">
                    {idx + 1}
                  </div>

                  <div className="rm-edit-approvers-modal-step-fields">
                    <div className="rm-edit-approvers-modal-field">
                      <span className="rm-edit-approvers-modal-label">Role</span>
                      <Input
                        placeholder="Role/Designation"
                        value={approver.role || ""}
                        onChange={(e) => handleApproverChange(idx, "role", e.target.value)}
                        disabled={hasApproved}
                      />
                    </div>
                    <div className="rm-edit-approvers-modal-field">
                      <span className="rm-edit-approvers-modal-label">Approver</span>
                      <Select
                        optionLabelProp="label"
                        placeholder="Search Active Directory staff"
                        value={approver.userId != null ? approver.userId : undefined}
                        onChange={(userId, option) => {
                          const id = userId;
                          const user =
                            (option && option.directoryApprover) ||
                            allDirectoryApprovers.find(
                              (u) => String(u.id) === String(id),
                            );
                          const displayName =
                            user?.name ||
                            (typeof option?.label === "string" ? option.label : "") ||
                            "";
                          setDirectorySearchText("");
                          handleApproverSelection(idx, {
                            value: id,
                            label: displayName,
                            directoryApprover: user || null,
                          });
                        }}
                        onSearch={handleDirectorySearch}
                        onDropdownVisibleChange={(openDropdown) => {
                          if (openDropdown) {
                            setDirectorySearchText("");
                            setDirectoryHint(
                              "Type at least 1 character to search Active Directory staff",
                            );
                            if (debounceRef.current) {
                              clearTimeout(debounceRef.current);
                            }
                            debounceRef.current = setTimeout(() => {
                              searchDirectoryOnServer("", { openDropdown: true });
                            }, 120);
                          }
                        }}
                        style={{ width: "100%" }}
                        showSearch
                        filterOption={false}
                        loading={loadingApprovers || isSearchingDirectory}
                        disabled={hasApproved}
                        notFoundContent={
                          loadingApprovers || isSearchingDirectory ? (
                            <div style={{ textAlign: "center", padding: "10px 0" }}>
                              <Spin size="small" />
                            </div>
                          ) : (
                            <Text type="secondary">{notFoundText}</Text>
                          )
                        }
                      >
                        {(() => {
                          const availableApprovers = getAvailableApproversForStep(
                            idx,
                            approver,
                          );

                          return availableApprovers.length > 0 ? (
                            availableApprovers.map((user) => (
                              <Select.Option
                                key={user.id}
                                value={user.id}
                                label={user.name}
                                directoryApprover={user}
                              >
                                {user.name}
                                {user.role ? ` [${user.role}]` : ""}
                                {(user.title || user.position)
                                  ? ` — ${user.title || user.position}`
                                  : ""}
                                {user.department ? ` (${user.department})` : ""}
                              </Select.Option>
                            ))
                          ) : (
                            <Select.Option disabled>
                              No other approvers available
                            </Select.Option>
                          );
                        })()}
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="text"
                    className="rm-edit-approvers-modal-delete"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveApprover(idx)}
                    disabled={hasApproved || editedApprovers.length <= 1}
                  />
                </div>

                {idx < editedApprovers.length - 1 && (
                  <div className="rm-edit-approvers-modal-insert">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<PlusOutlined />}
                      className="rm-edit-approvers-modal-insert-btn"
                      onClick={() => handleAddApprover(idx)}
                      disabled={nextApproverApproved}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {showTrailingInsert ? (
            <div className="rm-edit-approvers-modal-insert">
              <Button
                type="text"
                shape="circle"
                icon={<PlusOutlined />}
                className="rm-edit-approvers-modal-insert-btn"
                onClick={() => handleAddApprover(undefined)}
              />
            </div>
          ) : null}

          {!suppressNote ? (
            <div className="rm-edit-approvers-modal-note">
              <strong>Note:</strong> Any approver who has already approved is locked,
              greyed out, and cannot be removed or replaced. You also cannot insert a
              new approver before an already-approved step.
            </div>
          ) : null}
        </div>

        {!suppressFooter ? (
          <div className="rm-edit-approvers-modal-actions">
            <Button className="rm-edit-approvers-modal-cancel" onClick={onCancel} disabled={confirmingApprovers}>
              Cancel
            </Button>
            <Button
              type="primary"
              className="rm-edit-approvers-modal-confirm"
              onClick={onConfirm}
              loading={confirmingApprovers}
              disabled={confirmingApprovers}
            >
              Confirm Approvers
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default RMEditApproversModal;
