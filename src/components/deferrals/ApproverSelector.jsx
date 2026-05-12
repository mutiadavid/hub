import React, { useMemo, useRef, useState } from "react";
import { Alert, Button, Divider, Select, Spin, Typography } from "antd";
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useLazySearchAdUsersQuery } from "../../api/adSearchApi";

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

    if (loanStr === "above75") return 76000000;
    if (loanStr === "below75") return 74000000;

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
        if (!slot?.userId) return;
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

    const selectedIdSet = new Set(selectedUserIds.map(String));

    let list = (directoryApprovers || []).filter((user) => {
      const id = String(user?.id ?? user?._id ?? "");
      if (selectedIdSet.has(id)) return true;

      if (!normalizedQuery) return true;

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
    });

    list = [...list].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
        sensitivity: "base",
      }),
    );

    return list;
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
    <div className="flex flex-col h-full max-h-[78vh] w-full overflow-y-auto overflow-x-hidden px-1 pb-3 min-h-0">
      <div className="text-[#164679] text-lg font-bold tracking-tight mb-3">
        Approver Selection Matrix
      </div>

      {!canDetermineMatrix || requiredSteps === 0 ? (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Select loan amount and documents to determine approver matrix"
          className="rounded-lg bg-[rgba(214,189,152,0.12)] border border-[rgba(214,189,152,0.45)] text-gray-700 mb-3"
        />
      ) : (
        <div className="border border-[rgba(214,189,152,0.28)] rounded-lg p-3 bg-[rgba(245,247,244,0.82)] mb-2.5">
          <div className="flex items-center gap-1.5 text-gray-700 text-sm font-semibold">
            Applied: {matrixLabel}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            For selected documents with current loan amount
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            <span className="text-xs flex items-center gap-1.5 flex-wrap text-gray-500">
              Required Steps:
              <span className="border border-[rgba(214,189,152,0.22)] bg-white text-gray-600 rounded-full px-2 py-0.5 font-semibold">
                {requiredSteps} levels
              </span>
            </span>
            <span className="text-xs flex items-center gap-1.5 flex-wrap text-gray-500">
              Completed:
              <span className="border border-[rgba(214,189,152,0.22)] bg-white text-gray-600 rounded-full px-2 py-0.5 font-semibold">
                {selectedCount}/{requiredSteps}
              </span>
            </span>
          </div>
        </div>
      )}

      <Divider className="my-4 border-[rgba(214,189,152,0.18)]" />

      <div className="flex flex-col gap-3.5">
        {!canDetermineMatrix || requiredSteps === 0 ? (
          <div className="text-center py-10 px-3.5 text-gray-400">
            <InfoCircleOutlined className="text-6xl text-[rgba(103,125,106,0.28)]" />
            <div className="text-[32px] leading-none text-[rgba(103,125,106,0.36)] mt-2">·</div>
            <div className="text-lg font-semibold text-[rgba(64,83,76,0.52)] mt-3 mb-1.5">
              Approver Matrix Pending
            </div>
            <span className="text-gray-400 text-sm">
              Select loan amount and documents to determine approver matrix
            </span>
          </div>
        ) : (
          <>
            {slots.map((slot, index) => (
              <div key={`selector-${index}`} className="p-3 border border-[rgba(214,189,152,0.18)] rounded-lg bg-white/90">
                <div className="inline-flex items-center gap-1.5 text-gray-700 text-sm font-semibold mb-2">
                  {getApproverLabel(index)}: {slot.role || "Approver"}
                </div>
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
                      }, 120);
                      return;
                    }

                    if (!trimmed) return;

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
                  className="w-full mt-1.5"
                  placeholder="Search Active Directory staff"
                  size="middle"
                  showSearch
                  allowClear
                  filterOption={false}
                  loading={isSearchingDirectory}
                  notFoundContent={
                    isSearchingDirectory ? (
                      <div className="text-center py-2.5">
                        <Spin size="small" />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">{notFoundText}</span>
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
                          {approver.role ? ` [${approver.role}]` : ""}
                          {(approver.title || approver.position)
                            ? ` — ${approver.title || approver.position}`
                            : ""}
                          {approver.department ? ` (${approver.department})` : ""}
                        </Option>
                      ))
                    : null}
                </Select>

                {index < slots.length - 1 && (
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => handleAddApproverBetween(index + 1)}
                    className="w-full mt-2.5 rounded-lg border border-dashed border-[rgba(214,189,152,0.45)] bg-[rgba(245,247,244,0.8)] text-gray-500 shadow-none hover:bg-gray-100"
                  >
                    Add Approver
                  </Button>
                )}

                {slot.isCustom === true &&
                  typeof removeApprover === "function" && (
                    <Button
                      type="link"
                      className="mt-1.5 pl-0 text-red-700"
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

      <div className="bg-transparent border-t border-[rgba(214,189,152,0.16)] pt-3.5 pb-2.5 mt-2.5">
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSubmitClick}
            htmlType="button"
            loading={isSubmitting}
            size="large"
            type="primary"
            className="w-full rounded-lg border-none bg-[#3ab3e5] text-white shadow-md hover:bg-[#2a8cb5] disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Deferral"}
          </Button>
        </div>

        <div className="text-center text-sm min-h-[36px] pt-2.5 leading-relaxed">
          {!canDetermineMatrix || requiredSteps === 0 ? (
            <span className="text-gray-500">
              Complete loan amount and document selection first
            </span>
          ) : hasDuplicateApprovers ? (
            <div className="text-red-700">
              <WarningOutlined className="mr-1" /> Same approver cannot be selected in more than one step
            </div>
          ) : canSubmit ? (
            <div className="text-green-800 font-semibold">
              <CheckCircleOutlined className="mr-1" /> All approvers correctly selected
            </div>
          ) : (
            <div className="text-amber-700">
              <WarningOutlined className="mr-1" /> Need {remainingApprovers} more approver(s)
            </div>
          )}
          {canDetermineMatrix && requiredSteps > 0 && (
            <div className="mt-1">
              <span className="text-gray-400 text-[11px]">Matrix: {matrixLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}