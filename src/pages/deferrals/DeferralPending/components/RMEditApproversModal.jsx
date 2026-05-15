import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select, Spin, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useLazySearchAdUsersQuery } from "../../../../api/adSearchApi";
import { WARNING_ORANGE } from "../utils/constants";

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
  suppressIntro = false,
  suppressFooter = false,
  suppressNote = false,
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
    <div className={`bg-white border border-[rgba(214,189,152,0.2)] rounded-xl shadow-sm p-6 ${embedded ? "" : ""}`}>
      {/* Hero Section */}
      {!suppressIntro && (
        <div className="flex items-start gap-4 pr-0 mb-6">
          <div className="flex-1">
            <h2 className="m-0 text-[#164679] text-base font-bold tracking-tight">Edit Approvers</h2>
            <p className="mt-1.5 m-0 text-gray-500 text-sm leading-relaxed">
              Review each step below, assign the right approver, and keep the existing sequence intact.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        {/* Approval Flow Setup Header */}
        {!suppressIntro && (
          <div className="mb-5">
            <h3 className="m-0 text-gray-700 text-[11px] font-bold tracking-[0.18em] uppercase">
              Approval Flow Setup
            </h3>
            <p className="mt-2.5 m-0 text-gray-500 text-sm leading-relaxed">
              Review each step below, assign the right approver, and keep the
              existing sequence intact.
            </p>
          </div>
        )}

        {/* Approvers List */}
        <div className="flex flex-col gap-4">
          {editedApprovers.map((approver, idx) => {
            const hasApproved = approver.approved || approver.approvalStatus === "approved";
            const nextApproverApproved =
              editedApprovers[idx + 1]?.approved ||
              editedApprovers[idx + 1]?.approvalStatus === "approved";

            return (
              <div key={approver._id || idx}>
                <div
                  className={`flex gap-4 p-4 bg-white/98 rounded-xl border ${hasApproved ? "bg-gray-50 border-gray-300" : "border-[rgba(214,189,152,0.18)] shadow-[0_10px_28px_rgba(26,54,54,0.06)]"}`}
                >
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-center w-[42px] h-[42px] min-w-[42px] rounded-full bg-gradient-to-b from-[#164679] to-[#2a8cb5] text-white font-bold text-sm shadow-md">
                    {idx + 1}
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 flex flex-col gap-3.5">
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-600 text-[11px] font-bold tracking-[0.16em] uppercase">
                        Role
                      </span>
                      <Input
                        placeholder="Role/Designation"
                        value={approver.role || ""}
                        onChange={(e) => handleApproverChange(idx, "role", e.target.value)}
                        disabled={hasApproved}
                        className="border border-[#eaecf0] rounded-lg shadow-none hover:border-[#164679] focus:border-[#164679] focus:ring-2 focus:ring-[rgba(22,70,121,0.08)]"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-gray-600 text-[11px] font-bold tracking-[0.16em] uppercase">
                        Approver
                      </span>
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
                        className="w-full"
                        showSearch
                        filterOption={false}
                        loading={loadingApprovers || isSearchingDirectory}
                        disabled={hasApproved}
                        notFoundContent={
                          loadingApprovers || isSearchingDirectory ? (
                            <div className="text-center py-2.5">
                              <Spin size="small" />
                            </div>
                          ) : (
                            <Text className="text-gray-400">{notFoundText}</Text>
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

                  {/* Delete Button */}
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveApprover(idx)}
                    disabled={hasApproved || editedApprovers.length <= 1}
                    className="text-red-700 rounded-lg mt-6 border border-transparent hover:bg-red-50 hover:border-red-200"
                  />
                </div>

                {/* Insert Button Between Steps */}
                {idx < editedApprovers.length - 1 && (
                  <div className="flex justify-center py-0">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddApprover(idx)}
                      disabled={nextApproverApproved}
                      className="w-[38px] h-[38px] rounded-full border border-dashed border-[rgba(52,80,76,0.3)] bg-transparent text-[#2a8cb5] shadow-none hover:bg-gray-50"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trailing Insert Button */}
        {showTrailingInsert && (
          <div className="flex justify-center py-0 mt-2">
            <Button
              type="text"
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => handleAddApprover(undefined)}
              className="w-[38px] h-[38px] rounded-full border border-dashed border-[rgba(52,80,76,0.3)] bg-transparent text-[#2a8cb5] shadow-none hover:bg-gray-50"
            />
          </div>
        )}

        {/* Note Section */}
        {!suppressNote && (
          <div className="mt-6 p-4 bg-amber-50 border border-[rgba(214,189,152,0.42)] border-l-4 rounded-xl text-gray-600 text-sm leading-relaxed" style={{ borderLeftColor: WARNING_ORANGE }}>
            <strong>Note:</strong> Any approver who has already approved is locked,
            greyed out, and cannot be removed or replaced. You also cannot insert a
            new approver before an already-approved step.
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {!suppressFooter && (
        <div className="flex justify-end gap-3 pt-5 border-t border-[rgba(214,189,152,0.16)]">
          <Button
            onClick={onCancel}
            disabled={confirmingApprovers}
            className="min-w-[92px] h-11 rounded-xl border border-[#d0d5dd] bg-white text-gray-600 shadow-none font-semibold hover:bg-gray-50 disabled:bg-gray-300 disabled:text-gray-600"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={onConfirm}
            loading={confirmingApprovers}
            disabled={confirmingApprovers}
            className="min-w-[156px] h-11 rounded-xl border-none bg-[#3ab3e5] text-white shadow-md font-bold hover:bg-[#2a8cb5] disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
          >
            Confirm Approvers
          </Button>
        </div>
      )}
    </div>
  );
};

export default RMEditApproversModal;