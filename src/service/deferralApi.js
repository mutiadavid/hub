import { API_BASE_URL } from "../config/runtimeConfig";
import { store } from "../app/store";

const API_BASE = `${API_BASE_URL}/deferrals`;

function normalizeStatus(status) {
  const raw = String(status || "").trim();
  if (!raw) return raw;
  const key = raw.replace(/[\s_-]/g, "").toLowerCase();
  const map = {
    pending: "pending_approval",
    inreview: "in_review",
    approved: "approved",
    partiallyapproved: "partially_approved",
    rejected: "rejected",
    returnedforrework: "returned_for_rework",
    closerequested: "close_requested",
    closerequestedcreatorapproved: "close_requested_creator_approved",
    closed: "closed",
  };
  return map[key] || raw.toLowerCase();
}

function isApproverMarkedApproved(approver) {
  if (!approver || typeof approver !== "object") return false;
  if (approver.approved === true) return true;

  const status = String(
    approver.status || approver.approvalStatus || approver.state || "",
  )
    .trim()
    .toLowerCase();

  return status === "approved";
}

function computeAllApproversApproved(deferral, normalizedApproverFlow, normalizedApprovers) {
  if (typeof deferral?.allApproversApproved === "boolean") {
    return deferral.allApproversApproved;
  }

  const approvalEntries = Array.isArray(normalizedApproverFlow) && normalizedApproverFlow.length > 0
    ? normalizedApproverFlow
    : Array.isArray(normalizedApprovers) && normalizedApprovers.length > 0
      ? normalizedApprovers
      : Array.isArray(deferral?.approvals)
        ? deferral.approvals
        : [];

  if (!approvalEntries.length) return false;
  return approvalEntries.every(isApproverMarkedApproved);
}

function deriveWorkflowStatus(deferral, normalizedStatus, allApproversApproved) {
  const creatorStatus = String(deferral?.creatorApprovalStatus || "").toLowerCase();
  const checkerStatus = String(deferral?.checkerApprovalStatus || "").toLowerCase();
  const deferralApprovalStatus = String(deferral?.deferralApprovalStatus || "").toLowerCase();

  const hasCreatorApproved = creatorStatus === "approved";
  const hasCheckerApproved = checkerStatus === "approved";
  const isFullyApproved = deferralApprovalStatus === "approved" || (hasCreatorApproved && hasCheckerApproved);

  if (isFullyApproved) {
    return normalizedStatus;
  }

  const terminalStatuses = new Set([
    "approved",
    "deferral_approved",
    "rejected",
    "deferral_rejected",
    "returned_for_rework",
    "returned_by_creator",
    "returned_by_checker",
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
    "close_requested",
    "close_requested_creator_approved",
  ]);

  if (allApproversApproved && !terminalStatuses.has(normalizedStatus)) {
    return "partially_approved";
  }

  return normalizedStatus;
}

function orderApprovers(approvers) {
  if (!Array.isArray(approvers)) return approvers;

  const guidRegex = /^([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const getOrderValue = (approver, fallbackIndex) => {
    const explicitOrder =
      approver?.approvalOrder ??
      approver?.order ??
      approver?.orderIndex ??
      approver?.sequence ??
      approver?.flowIndex;

    const explicitNumber = Number(explicitOrder);
    if (Number.isFinite(explicitNumber)) {
      return explicitNumber;
    }

    const rawId = approver?._id || approver?.id || "";
    const match = String(rawId).match(guidRegex);
    if (match) {
      return parseInt(match[1], 16);
    }

    return fallbackIndex;
  };

  return approvers
    .map((approver, originalIndex) => ({ approver, originalIndex }))
    .sort((a, b) => {
      const orderA = getOrderValue(a.approver, a.originalIndex);
      const orderB = getOrderValue(b.approver, b.originalIndex);
      if (orderA !== orderB) return orderA - orderB;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ approver }) => approver);
}

function normalizeApproverEntry(approver) {
  const userObj = approver?.user && typeof approver.user === "object"
    ? { ...approver.user, _id: approver.user._id || approver.user.id, id: approver.user.id || approver.user._id }
    : approver?.user;
  return {
    ...approver,
    _id: approver?._id || approver?.id,
    id: approver?.id || approver?._id,
    userId:
      approver?.userId?._id ||
      approver?.userId?.id ||
      approver?.userId ||
      approver?.user?._id ||
      approver?.user?.id ||
      approver?.user ||
      null,
    user: userObj,
    approved: isApproverMarkedApproved(approver) === true,
  };
}

function normalizeDeferralRecord(deferral) {
  if (!deferral || typeof deferral !== "object") return deferral;

  const normalizedId = deferral._id || deferral.id || deferral.Id || null;
  const createdAt = deferral.createdAt || deferral.CreatedAt || null;
  const updatedAt = deferral.updatedAt || deferral.UpdatedAt || null;
  const slaExpiry = deferral.slaExpiry || deferral.SlaExpiry || null;
  const nextDueDate = deferral.nextDueDate || deferral.NextDueDate || null;
  const nextDocumentDueDate =
    deferral.nextDocumentDueDate || deferral.NextDocumentDueDate || null;
  const normalizedApprovers = Array.isArray(deferral.approvers)
    ? orderApprovers(
        deferral.approvers.map((approver) => normalizeApproverEntry(approver)),
      )
    : deferral.approvers;

  const normalizedApproverFlow = Array.isArray(deferral.approverFlow)
    ? orderApprovers(
        deferral.approverFlow.map((approver) => normalizeApproverEntry(approver)),
      )
    : normalizedApprovers;

  const normalizedStatus = normalizeStatus(deferral.status);
  const allApproversApproved = computeAllApproversApproved(
    deferral,
    normalizedApproverFlow,
    normalizedApprovers,
  );
  const derivedStatus = deriveWorkflowStatus(deferral, normalizedStatus, allApproversApproved);

  // Determine and mark the current approver index and expose a lightweight currentApprover
  const safeIndex = Number.isInteger(deferral?.currentApproverIndex) ? deferral.currentApproverIndex : 0;
  const approversWithCurrentFlag = Array.isArray(normalizedApprovers)
    ? normalizedApprovers.map((a, i) => ({ ...a, isCurrent: i === safeIndex }))
    : normalizedApprovers;

  // Try to resolve current approver from approvers first, then from approverFlow if needed
  const pickCurrentFromList = (list) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const item = list[safeIndex] || list[0] || null;
    if (!item) return null;
    return {
      name: item?.user?.name || item?.name || "Approver",
      email: item?.user?.email || item?.email || item?.userEmail || null,
      role: item?.role || item?.position || null,
    };
  };

  let currentApprover = pickCurrentFromList(approversWithCurrentFlag);
  if (!currentApprover) {
    // fallback to approverFlow
    currentApprover = pickCurrentFromList(normalizedApproverFlow);
  }

  return {
    ...deferral,
    _id: normalizedId,
    id: normalizedId,
    createdAt,
    updatedAt,
    slaExpiry,
    nextDueDate,
    nextDocumentDueDate,
    status: derivedStatus,
    allApproversApproved,
    approvers: approversWithCurrentFlag,
    approverFlow: normalizedApproverFlow,
    currentApprover,
  };
}

function normalizeDeferralList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeDeferralRecord);
}

const EMAIL_SERVER_BASE =
  (import.meta.env.VITE_EMAIL_SERVER_URL || "http://localhost:4001").replace(/\/$/, "");

const parseStatusCode = (value) => {
  const directStatus = Number(value);
  if (Number.isInteger(directStatus) && directStatus >= 400 && directStatus <= 599) {
    return directStatus;
  }

  const matchedStatus = String(value || "").match(/\b([45]\d{2})\b/);
  if (matchedStatus) {
    return Number(matchedStatus[1]);
  }

  return 500;
};

const createSanitizedApiError = (status, message, data) => {
  const normalizedStatus = parseStatusCode(status);
  const resolvedMessage = String(message || "").trim() || String(normalizedStatus);
  const error = new Error(resolvedMessage);
  error.status = normalizedStatus;
  error.data = data;
  return error;
};

const sanitizeThrownApiError = async (error) => {
  if (error instanceof Response) {
    const status = error.status;
    let data = null;
    try {
      data = await error.json();
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // Not JSON
    }
    const message = data?.message || data?.error || error.statusText;
    return createSanitizedApiError(status, message, data);
  }

  const status = error?.status || error?.data?.status || error?.originalStatus || error?.message;
  const backendMessage =
    error?.data?.error ||
    error?.data?.message ||
    error?.error ||
    error?.message;

  return createSanitizedApiError(status, backendMessage, error?.data);
};

async function sendViaLocalEmailServer(payload) {
  const res = await fetch(`${EMAIL_SERVER_BASE}/api/send-deferral`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Email server request failed (${res.status})`);
  }
  return json;
}

function pickFirstCurrentApprover(deferral) {
  const approvers = orderApprovers(
    Array.isArray(deferral?.approvers) ? deferral.approvers : [],
  );
  if (!approvers.length) return null;

  const index = Number.isInteger(deferral?.currentApproverIndex)
    ? deferral.currentApproverIndex
    : 0;
  const current = approvers[index] || approvers[0] || null;
  if (!current) return null;

  const email =
    current?.user?.email ||
    current?.email ||
    current?.userEmail ||
    null;
  return {
    name: current?.user?.name || current?.name || "Approver",
    email,
    position: current?.role || current?.position || current?.user?.position || "Approver",
  };
}

function collectRecipientsByType(deferral, notificationType, data = {}) {
  const type = String(notificationType || "").toLowerCase();
  const recipients = [];

  const rmRecipient = {
    name: deferral?.createdBy?.name || data?.userName || "RM",
    email: deferral?.createdBy?.email || data?.rmEmail || null,
    position: "Relationship Manager",
  };

  const approverRecipients = (Array.isArray(deferral?.approvers) ? deferral.approvers : [])
    .map((a) => ({
      name: a?.user?.name || a?.name || "Approver",
      email: a?.user?.email || a?.email || null,
      position: a?.role || a?.position || a?.user?.position || "Approver",
    }))
    .filter((r) => !!r.email);

  const currentApprover = pickFirstCurrentApprover(deferral);

  if (type.includes("to_rm") || type.includes("approved_by") || type.includes("rejected") || type.includes("returned")) {
    if (rmRecipient.email) recipients.push(rmRecipient);
  } else if (type === "recall" || type === "withdrawal" || type.includes("all_parties")) {
    if (rmRecipient.email) recipients.push(rmRecipient);
    recipients.push(...approverRecipients);
  } else {
    if (currentApprover?.email) recipients.push(currentApprover);
    else recipients.push(...approverRecipients.slice(0, 1));
  }

  const seen = new Set();
  return recipients.filter((r) => {
    const key = String(r.email || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getAuthHeaders(token) {
  const resolvedToken = token || store.getState().auth?.token;
  const headers = {
    "content-type": "application/json",
  };
  if (resolvedToken) {
    headers["authorization"] = `Bearer ${resolvedToken}`;
  }
  return headers;
}

// Returns a partial fetch options object that callers can spread into their fetch() call.
// Using { ...getAuthInit() } ensures credentials:'include' is present on every API call,
// which is required for the browser to send the HttpOnly accessToken cookie.
function getAuthInit(token, extraHeaders = {}) {
  const resolvedToken = typeof token === "string" ? token : undefined;
  const resolvedHeaders = typeof token === "object" ? token : extraHeaders;
  return {
    credentials: "include",
    headers: { ...getAuthHeaders(resolvedToken), ...resolvedHeaders },
  };
}

const deferralApi = {
  getAllDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/all`, {
      ...getAuthInit(),
    });
    if (!res.ok) throw new Error("Failed to fetch all deferrals");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getMyDeferrals: async (token) => {
    try {
      const res = await fetch(`${API_BASE}/my`, {
        ...getAuthInit(),
      });
     
      if (!res.ok) {
        throw createSanitizedApiError(res.status);
      }
     
      const data = await res.json();
      const normalized = normalizeDeferralList(data);
      return normalized;
    } catch (err) {
      throw sanitizeThrownApiError(err);
    }
  },

  getDeferralById: async (id, token) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      ...getAuthInit(),
    });
    if (!res.ok) throw new Error("Failed to fetch deferral");
    const data = await res.json();
    return normalizeDeferralRecord(data);
  },

  searchDeferrals: async (params = {}, token) => {
    const searchParams = new URLSearchParams();

    if (params.dclNumber) {
      searchParams.set("dclNumber", String(params.dclNumber).trim());
    }

    if (params.deferralNumber) {
      searchParams.set("deferralNumber", String(params.deferralNumber).trim());
    }

    const query = searchParams.toString();
    const res = await fetch(`${API_BASE}/search${query ? `?${query}` : ""}`, {
      ...getAuthInit(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to search deferrals");
    }

    return res.json();
  },

  createDeferral: async (payload, token) => {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const validationError =
        err?.error ||
        err?.message ||
        (err?.errors ? Object.values(err.errors).flat().join("; ") : "") ||
        `Failed to create deferral (${res.status})`;
      throw new Error(validationError);
    }
    const data = await res.json();
    if (data?.deferral && typeof data.deferral === "object") {
      return {
        ...normalizeDeferralRecord(data.deferral),
        selectedDocuments: data.selectedDocuments || data.deferral.selectedDocuments || [],
        emailNotification: data.emailNotification || null,
      };
    }
    return normalizeDeferralRecord(data);
  },

  getNextDeferralNumber: async (token) => {
    let res = await fetch(`${API_BASE}/next-number`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      // Backward compatibility with older API route
      res = await fetch(`${API_BASE}/preview-number`, {
        ...getAuthInit(),
      });
    }
    if (!res.ok) throw new Error("Failed to get preview deferral number");
    return res.json();
  },

  updateDeferral: async (id, patch, token) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const modelStateErrors = err?.errors
        ? Object.entries(err.errors)
            .flatMap(([field, messages]) =>
              (Array.isArray(messages) ? messages : [messages])
                .filter(Boolean)
                .map((message) => `${field}: ${message}`),
            )
            .join("; ")
        : "";
      const validationError =
        err?.error ||
        err?.message ||
        modelStateErrors ||
        err?.title ||
        `Failed to update deferral (${res.status})`;
      throw new Error(validationError);
    }
    const payload = await res.json().catch(() => null);
    if (!payload) return payload;
    // If backend returns wrapped object with deferral, normalize that deferral
    if (payload && typeof payload === 'object' && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    // If it's a plain deferral object, normalize it for consistency
    if (payload && typeof payload === 'object') return normalizeDeferralRecord(payload);
    return payload;
  },

  addHistory: async (id, entry, token) => {
    const res = await fetch(`${API_BASE}/${id}/history`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to add history");
    return res.json();
  },

  addDocument: async (id, doc, token) => {
    const res = await fetch(`${API_BASE}/${id}/documents`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error("Failed to add document");
    return res.json();
  },

  uploadDocument: async (id, file, opts = {}, token) => {
    const fd = new FormData();
    // If file is AntD Upload file, it might be an object with originFileObj
    const f = file.originFileObj || file;
    fd.append("file", f);
    if (opts.isDCL) fd.append("isDCL", "true");
    if (opts.isAdditional) fd.append("isAdditional", "true");
    if (opts.documentName) fd.append("documentName", String(opts.documentName));

    const res = await fetch(`${API_BASE}/${id}/documents/upload`, {
      method: "POST",
      headers: {
        // IMPORTANT: do not set Content-Type; browser will set multipart with boundary
      },
      credentials: "include",
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload document");
    }

    return res.json();
  },

  getApproverQueue: async (token) => {
    let res = await fetch(`${API_BASE}/approver-queue`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      // Backward compatibility with older route shape
      res = await fetch(`${API_BASE}/approver/queue`, {
        ...getAuthInit(),
      });
    }
    if (!res.ok) throw new Error("Failed to fetch approver queue");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getActionedDeferrals: async (token) => {
    let res = await fetch(`${API_BASE}/actioned`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      // Backward compatibility with older route shape
      res = await fetch(`${API_BASE}/approver/actioned`, {
        ...getAuthInit(),
      });
    }
    if (!res.ok) throw new Error("Failed to fetch actioned deferrals");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getPendingDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/pending`, {
      ...getAuthInit(),
    });
    if (!res.ok) throw new Error("Failed to fetch pending deferrals");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getApprovedDeferrals: async (token) => {
    try {
      const res = await fetch(`${API_BASE}/approved`, {
        ...getAuthInit(),
      });
     
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeDeferralList(data);
        return normalized;
      }

      throw createSanitizedApiError(res.status);
    } catch (err) {
      throw sanitizeThrownApiError(err);
    }
  },

  getCloseWorkflowDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/close-workflow`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch close workflow deferrals");
    }
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getCreatorQueue: async (token) => {
    try {
      const res = await fetch(`${API_BASE}/creator-queue`, {
        ...getAuthInit(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch creator queue");
      }
      const data = await res.json();
      return normalizeDeferralList(data);
    } catch {
      // Fallback to pending if creator-queue endpoint doesn't exist (backward compatibility)
      console.warn("creator-queue endpoint not available, falling back to pending");
      const res = await fetch(`${API_BASE}/pending`, {
        ...getAuthInit(),
      });
      if (!res.ok) throw new Error("Failed to fetch deferrals");
      const data = await res.json();
      return normalizeDeferralList(data);
    }
  },

  addComment: async (id, text, token) => {
    const res = await fetch(`${API_BASE}/${id}/comments`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return res.json();
  },

  sendReminder: async (id, token, payload = {}) => {
    const res = await fetch(`${API_BASE}/${id}/reminder`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send reminder");
    }
    return res.json();
  },

  // Send reminder without writing a comment into the deferral trail
  sendReminderAndLog: async (id, token) => {
    try {
      await deferralApi.sendReminder(id, token, {});
    } catch (e) {
      console.warn('sendReminder failed:', e?.message || e);
      throw e;
    }

    return { ok: true };
  },

  approveDeferral: async (id, data, token) => {
    // Handle both string and object inputs
    let body = {};
    if (typeof data === "string") {
      body = { comment: data };
    } else if (data && typeof data === "object") {
      body = data;
    } else {
      body = { comment: "" };
    }

    const requestApprove = (method) =>
      fetch(`${API_BASE}/${id}/approve`, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(body),
      });

    let res = await requestApprove("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestApprove("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to approve deferral");
    }
    return res.json();
  },

  rejectDeferral: async (id, data, token) => {
    // Handle both string and object inputs
    let body = {};
    if (typeof data === "string") {
      body = { reason: data };
    } else if (data && typeof data === "object") {
      // Map 'comment' to 'reason' if needed
      body = {
        reason: data.reason || data.comment || "",
        ...data,
      };
    } else {
      body = { reason: "" };
    }

    const requestReject = (method) =>
      fetch(`${API_BASE}/${id}/reject`, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(body),
      });

    let res = await requestReject("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestReject("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reject deferral");
    }
    return res.json();
  },

  // Delete/withdraw deferral
  deleteDeferral: async (id, token) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      ...getAuthInit(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to withdraw deferral");
    }
    return res.json();
  },

  // Withdraw (RM) - mark deferral as withdrawn/closed by RM
  withdrawDeferral: async (id, data, token) => {
    const payload = data || {};
    const res = await fetch(`${API_BASE}/${id}/withdraw`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to withdraw deferral");
    }
    const payloadRes = await res.json().catch(() => null);
    if (!payloadRes) return payloadRes;
    return typeof payloadRes === 'object' && payloadRes.deferral ? { ...payloadRes, deferral: normalizeDeferralRecord(payloadRes.deferral) } : normalizeDeferralRecord(payloadRes);
  },

  // Return deferral for re-work to RM - FIXED: Now properly handles the data parameter
  returnForRework: async (id, data, token) => {
    const reworkComment =
      data?.ReworkComment || data?.reworkComment || data?.comment || data?.reason || data?.reworkInstructions || "";

    const payload = {
      ReworkComment: String(reworkComment || "").trim(),
    };

    const requestReturnForRework = (method) =>
      fetch(`${API_BASE}/${id}/return-for-rework`, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(payload),
      });

    let res = await requestReturnForRework("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestReturnForRework("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err?.error ||
          err?.message ||
          `Failed to return deferral for rework (${res.status})`,
      );
    }
    return res.json();
  },

  // Get returned deferrals
  getReturnedDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/returned`, {
      ...getAuthInit(),
    });
    if (!res.ok) throw new Error("Failed to fetch returned deferrals");
    return res.json();
  },

  // ===========================
  // NEW METHODS FOR APPROVAL FLOW
  // ===========================

  // Creator approval
  approveByCreator: async (deferralId, data, token) => {
    const requestApproveByCreator = (url, method) =>
      fetch(url, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(data),
      });

    // Current backend endpoint
    let res = await requestApproveByCreator(
      `${API_BASE}/${deferralId}/approve-creator`,
      "POST",
    );

    // Backward-compat route/method fallback
    if (res.status === 404 || res.status === 405) {
      res = await requestApproveByCreator(
        `${API_BASE}/${deferralId}/approve-by-creator`,
        "PUT",
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve by creator");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  // Checker approval
  approveByChecker: async (deferralId, data, token) => {
    const requestApproveByChecker = (url, method) =>
      fetch(url, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(data),
      });

    let res = await requestApproveByChecker(
      `${API_BASE}/${deferralId}/approve-checker`,
      "POST",
    );

    if (res.status === 404 || res.status === 405) {
      res = await requestApproveByChecker(
        `${API_BASE}/${deferralId}/approve-by-checker`,
        "PUT",
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve by checker");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  // Creator rejection
  rejectByCreator: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/reject-by-creator`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reject by creator");
    }
    return res.json();
  },

  // Checker rejection
  rejectByChecker: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/reject-by-checker`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reject by checker");
    }
    return res.json();
  },

  // Return for rework by creator
  returnForReworkByCreator: async (deferralId, data, token) => {
    const reworkComment =
      data?.reworkComment || data?.comment || data?.reason || "";

    const dotnetPayload = {
      ReworkComment: String(reworkComment || "").trim(),
    };

    let res = await fetch(`${API_BASE}/${deferralId}/return-for-rework`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(dotnetPayload),
    });

    if (res.status === 404 || res.status === 405) {
      res = await fetch(`${API_BASE}/${deferralId}/return-by-creator`, {
        method: "PUT",
        ...getAuthInit(),
        body: JSON.stringify(data),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to return by creator");
    }
    return res.json();
  },

  // Return for rework by checker
  returnForReworkByChecker: async (deferralId, data, token) => {
    const reworkComment =
      data?.reworkComment || data?.comment || data?.reason || "";

    const dotnetPayload = {
      ReworkComment: String(reworkComment || "").trim(),
    };

    let res = await fetch(`${API_BASE}/${deferralId}/return-for-rework`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(dotnetPayload),
    });

    if (res.status === 404 || res.status === 405) {
      res = await fetch(`${API_BASE}/${deferralId}/return-by-checker`, {
        method: "PUT",
        ...getAuthInit(),
        body: JSON.stringify(data),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to return by checker");
    }
    return res.json();
  },

  // Close deferral
  closeDeferral: async (deferralId, data, token) => {
    const requestClose = (method) =>
      fetch(`${API_BASE}/${deferralId}/close`, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(data),
      });

    let res = await requestClose("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestClose("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to close deferral");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  approveCloseRequestByCreator: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/close-request/approve-creator`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve close request by creator");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  approveCloseRequestByChecker: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/close-request/approve-checker`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve close request by checker");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  // Recall deferral (reset approval flow and keep in pending)
  recallDeferral: async (deferralId, data = {}, token) => {
    const requestRecall = (method) =>
      fetch(`${API_BASE}/${deferralId}/recall`, {
        method,
        ...getAuthInit(),
        body: JSON.stringify(data),
      });

    let res = await requestRecall("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestRecall("PUT");
    }

    if (res.status === 404 || res.status === 405) {
      // Backward compatibility: older backend has no /recall route,
      // but PUT /{id} with Pending status resets approval flow.
      res = await fetch(`${API_BASE}/${deferralId}`, {
        method: "PUT",
        ...getAuthInit(),
        body: JSON.stringify({ status: "Pending" }),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to recall deferral");
    }
    return res.json();
  },

  // Send reminder (already exists, keeping for consistency)
  sendReminderToApprover: async (deferralId) => {
    return await deferralApi.sendReminder(deferralId);
  },

  // Send email notification
  sendEmailNotification: async (deferralId, notificationType, data = {}, token) => {
    // Try API endpoint first (if available in some deployments)
    try {
      const res = await fetch(`${API_BASE}/${deferralId}/send-notification`, {
        method: "POST",
        ...getAuthInit(),
        body: JSON.stringify({
          notificationType,
          ...data,
        }),
      });
      if (res.ok) return res.json();
    } catch {
      // fallback to local email server below
    }

    const deferral = await deferralApi.getDeferralById(deferralId, token).catch(() => null);
    if (!deferral) {
      throw new Error("Failed to send email notification: unable to load deferral details");
    }

    const recipients = collectRecipientsByType(deferral, notificationType, data);
    if (!recipients.length) {
      throw new Error("Failed to send email notification: no recipient email found");
    }

    const documents = Array.isArray(deferral?.selectedDocuments)
      ? deferral.selectedDocuments
      : Array.isArray(deferral?.documents)
      ? deferral.documents
      : [];

    const results = [];
    for (const recipient of recipients) {
      const payload = {
        deferralNumber: deferral?.deferralNumber,
        customerName: deferral?.customerName,
        documentName: documents?.[0]?.name || data?.documentName,
        documents,
        currentApprover: {
          name: recipient.name,
          email: recipient.email,
        },
        targetApproverPosition: recipient.position,
        notificationType,
        ...data,
      };
      const result = await sendViaLocalEmailServer(payload);
      results.push({ recipient: recipient.email, result });
    }

    return { success: true, sent: results.length, results };
  },

  // Additional utility method to get partially approved deferrals
  getPartiallyApprovedDeferrals: async () => {
    const res = await fetch(`${API_BASE}/partially-approved`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      // If endpoint doesn't exist, we'll filter from all deferrals on the client side
      const all = await fetch(`${API_BASE}/my`, { headers: getAuthHeaders() });
      if (!all.ok) throw new Error("Failed to fetch deferrals");
      const deferrals = await all.json();
      // Filter for partially approved deferrals
      return deferrals.filter((d) => {
        const hasCreatorApproved = d.creatorApprovalStatus === "approved";
        const hasCheckerApproved = d.checkerApprovalStatus === "approved";
        const allApproversApproved = d.allApproversApproved === true;
        const isFullyApproved =
          hasCreatorApproved && hasCheckerApproved && allApproversApproved;
        const isPartiallyApproved =
          (hasCreatorApproved || hasCheckerApproved || allApproversApproved) &&
          !isFullyApproved;
        return isPartiallyApproved;
      });
    }
    return res.json();
  },

  // Get deferrals requiring creator approval
  getDeferralsRequiringCreatorApproval: async () => {
    const res = await fetch(`${API_BASE}/requiring-creator-approval`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      // If endpoint doesn't exist, we'll filter from all deferrals on the client side
      const all = await fetch(`${API_BASE}/my`, { headers: getAuthHeaders() });
      if (!all.ok) throw new Error("Failed to fetch deferrals");
      const deferrals = await all.json();
      return deferrals.filter((d) => {
        const allApproversApproved = d.allApproversApproved === true;
        const creatorNotApproved = d.creatorApprovalStatus !== "approved";
        const checkerNotApproved = d.checkerApprovalStatus !== "approved";
        return allApproversApproved && creatorNotApproved && checkerNotApproved;
      });
    }
    return res.json();
  },

  // Get deferrals requiring checker approval
  getDeferralsRequiringCheckerApproval: async () => {
    const res = await fetch(`${API_BASE}/requiring-checker-approval`, {
      ...getAuthInit(),
    });
    if (!res.ok) {
      // If endpoint doesn't exist, we'll filter from all deferrals on the client side
      const all = await fetch(`${API_BASE}/my`, { headers: getAuthHeaders() });
      if (!all.ok) throw new Error("Failed to fetch deferrals");
      const deferrals = await all.json();
      return deferrals.filter((d) => {
        const allApproversApproved = d.allApproversApproved === true;
        const creatorApproved = d.creatorApprovalStatus === "approved";
        const checkerNotApproved = d.checkerApprovalStatus !== "approved";
        return allApproversApproved && creatorApproved && checkerNotApproved;
      });
    }
    return res.json();
  },

  postComment: async (id, commentData, token) => {
    const res = await fetch(`${API_BASE}/${id}/comments`, {
      method: "POST",
      ...getAuthInit(),
      body: JSON.stringify(commentData),
    });
    if (!res.ok) throw new Error("Failed to post comment");
    return res.json();
  },

  submitExtension: async (deferralId, extensionData, token) => {
    const extensionDaysObj = Object.entries(extensionData.extensionDaysByDoc || {}).reduce(
      (accumulator, [key, days]) => {
        const normalizedDays = Number(days);
        if (Number.isFinite(normalizedDays) && normalizedDays > 0) {
          accumulator[key] = normalizedDays;
        }
        return accumulator;
      },
      {},
    );

    const mappedFileUrls = (extensionData.fileUrls || []).map((url) => ({
      name: url.split("/").pop() || "file",
      url: url,
      size: 0,
      uploadedAt: new Date().toISOString(),
    }));
    const additionalFiles = Array.isArray(extensionData.additionalFiles) && extensionData.additionalFiles.length > 0
      ? extensionData.additionalFiles
      : mappedFileUrls;

    const payload = {
      // Redundant keys for backend compatibility
      DeferralId: deferralId,
      deferralId: deferralId,
      RequestedDaysSought: Number(extensionData.RequestedDaysSought || extensionData.requestedDaysSought) || 0,
      requestedDaysSought: Number(extensionData.RequestedDaysSought || extensionData.requestedDaysSought) || 0,
      ExtensionReason: extensionData.ExtensionReason || extensionData.extensionReason || extensionData.comment || extensionData.Comment || "",
      extensionReason: extensionData.ExtensionReason || extensionData.extensionReason || extensionData.comment || extensionData.Comment || "",
      ExtensionDaysByDoc: extensionDaysObj,
      extensionDaysByDoc: extensionDaysObj,
      AdditionalFiles: additionalFiles,
      additionalFiles: additionalFiles,
      ApproverFlow: extensionData.ApproverFlow || extensionData.approverFlow,
      approverFlow: extensionData.ApproverFlow || extensionData.approverFlow,
    };

    const jsonBody = JSON.stringify(payload);

    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions`, {
      method: "POST",
      ...getAuthInit(),
      body: jsonBody,
    });

    if (!res.ok) {
      throw res; // Throw the response to be handled by sanitizeThrownApiError
    }

    return res.json();
  },

  // Get RM Extension Applications
  getRMExtensionApplications: async (token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/rm/applications`, {
      method: "GET",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch RM extension applications");
    }

    return res.json();
  },

  // Extension Approval APIs

  getApproverExtensionQueue: async (token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/approver/queue`, {
      method: "GET",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch approver extension queue");
    }

    return res.json();
  },

  getApproverExtensionActioned: async (token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/approver/actioned`, {
      method: "GET",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch approver actioned extensions");
    }

    return res.json();
  },

  approveExtension: async (extensionId, comment, token) => {
    const payload = { comment };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/approve`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to approve extension");
    }

    return res.json();
  },

  rejectExtension: async (extensionId, reason, token) => {
    const payload = { reason };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/reject`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to reject extension");
    }

    return res.json();
  },

  getCreatorPendingExtensions: async (token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/creator/pending`, {
      method: "GET",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch creator pending extensions");
    }

    return res.json();
  },

  acceptExtensionAsCreator: async (extensionId, comment, token) => {
    const payload = { comment };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/accept-creator`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to accept extension as creator");
    }

    return res.json();
  },

  returnExtensionAsCreator: async (extensionId, reason, token) => {
    const payload = { reason };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/return-creator`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to return extension as creator");
    }

    return res.json();
  },

  rejectExtensionAsCreator: async (extensionId, reason, token) => {
    const payload = { reason };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/reject-creator`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to reject extension as creator");
    }

    return res.json();
  },

  getCheckerPendingExtensions: async (token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/checker/pending`, {
      method: "GET",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch checker pending extensions");
    }

    return res.json();
  },

  approveExtensionAsChecker: async (extensionId, comment, token) => {
    const payload = { comment };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/approve-checker`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to approve extension as checker");
    }

    return res.json();
  },

  returnExtensionAsChecker: async (extensionId, reason, token) => {
    const payload = { reason };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/return-checker`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to return extension as checker");
    }

    return res.json();
  },

  rejectExtensionAsChecker: async (extensionId, reason, token) => {
    const payload = { reason };
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/reject-checker`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to reject extension as checker");
    }

    return res.json();
  },

  getExtensionById: async (extensionId, token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}`, {
      method: "GET",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch extension details");
    }

    return res.json();
  },

  updateApprovers: async (deferralId, approvers, token) => {
    const guidPattern = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$|^[0-9a-fA-F]{24}$/;
    const normalizedApprovers = Array.isArray(approvers)
      ? approvers.map((approver) => {
          const rawUserId = approver?.userId ?? approver?.user ?? null;
          const normalizedUserId =
            typeof rawUserId === "string" && guidPattern.test(rawUserId)
              ? rawUserId
              : null;

          return {
            name: approver?.name || "",
            role: approver?.role || "",
            userId: normalizedUserId,
            email: approver?.email || "",
            samAccountName: approver?.samAccountName || "",
            department: approver?.department || "",
            position: approver?.position || "",
            approved: approver?.approved || approver?.approvalStatus === "approved",
            approvalStatus: approver?.approvalStatus || (approver?.approved ? "approved" : "pending"),
          };
        })
      : [];

    const res = await fetch(`${API_BASE}/${deferralId}/approvers`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(normalizedApprovers),
    });

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => null);
      const errorMessage =
        errorPayload?.error ||
        errorPayload?.message ||
        errorPayload?.title ||
        (typeof errorPayload === "string" ? errorPayload : "") ||
        "Failed to update approvers";
      throw new Error(errorMessage);
    }

    const payload = await res.json().catch(() => null);
    if (!payload) return payload;
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    if (payload && typeof payload === "object") {
      return normalizeDeferralRecord(payload);
    }
    return payload;
  },

  // Fetch all users with approver role
  getApprovers: async (token) => {
    try {
      const usersApiUrl = `${API_BASE_URL}/users?role=approver`;
      const res = await fetch(usersApiUrl, {
        ...getAuthInit(),
      });

      if (!res.ok) {
        return [];
      }

      const users = await res.json();
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  },

  sendExtensionReminder: async (extensionId, token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/reminder`, {
      method: "POST",
      ...getAuthInit(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to send extension reminder");
    }

    return res.json();
  },

  updateExtensionApprovers: async (extensionId, approvers, token) => {
    const guidPattern = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$|^[0-9a-fA-F]{24}$/;
    const normalizedApprovers = Array.isArray(approvers)
      ? approvers.map((approver) => {
          const rawUserId = approver?.userId ?? approver?.user ?? null;
          const normalizedUserId =
            typeof rawUserId === "string" && guidPattern.test(rawUserId)
              ? rawUserId
              : null;

          return {
            name: approver?.name || "",
            role: approver?.role || "",
            userId: normalizedUserId,
            email: approver?.email || "",
            samAccountName: approver?.samAccountName || "",
            department: approver?.department || "",
            position: approver?.position || "",
            approved: approver?.approved || approver?.approvalStatus === "approved",
            approvalStatus: approver?.approvalStatus || (approver?.approved ? "approved" : "pending"),
          };
        })
      : [];

    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/approvers`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify(normalizedApprovers),
    });

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => null);
      const errorMessage =
        errorPayload?.error ||
        errorPayload?.message ||
        errorPayload?.title ||
        (typeof errorPayload === "string" ? errorPayload : "") ||
        "Failed to update extension approvers";
      throw new Error(errorMessage);
    }

    return res.json();
  },


  returnExtensionForRework: async (extensionId, reason, token) => {
    const res = await fetch(`${API_BASE.replace(/\/deferrals$/, "")}/extensions/${extensionId}/return-for-rework`, {
      method: "PUT",
      ...getAuthInit(),
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to return extension for rework");
    }

    return res.json();
  },
};

const wrappedDeferralApi = Object.fromEntries(
  Object.entries(deferralApi).map(([key, value]) => {
    if (typeof value !== "function") {
      return [key, value];
    }

    return [
      key,
      async (...args) => {
        try {
          return await value(...args);
        } catch (error) {
          throw await sanitizeThrownApiError(error);
        }
      },
    ];
  }),
);

export default wrappedDeferralApi;