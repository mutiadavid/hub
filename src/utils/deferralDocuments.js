import dayjs from "dayjs";

const getFileExtension = (name) => {
  const fileName = String(name || "").trim();
  if (!fileName || !fileName.includes(".")) return "";
  return fileName.split(".").pop().toLowerCase();
};

const getDocumentSectionFromUrl = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const marker = "#docSection=";
  const markerIndex = raw.toLowerCase().lastIndexOf(marker.toLowerCase());
  if (markerIndex < 0) return null;

  const sectionPart = raw
    .substring(markerIndex + marker.length)
    .split("#")[0]
    .trim()
    .toLowerCase();

  if (sectionPart === "dcl" || sectionPart === "additional") {
    return sectionPart;
  }

  return null;
};

const stripDocumentSectionMarker = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return url;

  const marker = "#docSection=";
  const markerIndex = raw.toLowerCase().lastIndexOf(marker.toLowerCase());
  if (markerIndex < 0) return url;

  return raw.substring(0, markerIndex);
};

const getDocumentTargetFromUrl = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const hashIndex = raw.indexOf("#");
  const withoutHash = hashIndex >= 0 ? raw.substring(0, hashIndex) : raw;
  const queryIndex = withoutHash.indexOf("?");
  if (queryIndex < 0) return null;

  const queryString = withoutHash.substring(queryIndex + 1);
  const params = new URLSearchParams(queryString);
  const target = params.get("docTarget");
  return target ? decodeURIComponent(target).trim() : null;
};

const normalizeDocName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const hasDclPrefix = (name) => /^\s*dcl(?:[\s_-]|$)/i.test(String(name || "").trim());

const includesDclNumber = (name, dclNo) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  const normalizedDclNo = String(dclNo || "").trim().toLowerCase();
  if (!normalizedName || !normalizedDclNo) return false;
  return normalizedName.includes(normalizedDclNo);
};

const toEpoch = (value) => {
  const epoch = new Date(value || 0).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
};

const pickPrimaryDclDocument = (documents, dclNo) => {
  if (!Array.isArray(documents) || documents.length === 0) return null;

  const ranked = [...documents].sort((left, right) => {
    const leftName = String(left?.name || "");
    const rightName = String(right?.name || "");

    const leftDclMatch = includesDclNumber(leftName, dclNo) ? 1 : 0;
    const rightDclMatch = includesDclNumber(rightName, dclNo) ? 1 : 0;
    if (leftDclMatch !== rightDclMatch) return rightDclMatch - leftDclMatch;

    const leftPrefixMatch = hasDclPrefix(leftName) ? 1 : 0;
    const rightPrefixMatch = hasDclPrefix(rightName) ? 1 : 0;
    if (leftPrefixMatch !== rightPrefixMatch) return rightPrefixMatch - leftPrefixMatch;

    return toEpoch(right?.uploadDate) - toEpoch(left?.uploadDate);
  });

  return ranked[0] || null;
};

export const getDeferralDocumentBuckets = (deferral) => {
  if (!deferral) {
    return { allDocs: [], dclDocs: [], uploadedDocs: [], requestedDocs: [] };
  }

  const deferralAttachments = Array.isArray(deferral.attachments)
    ? deferral.attachments
    : Array.isArray(deferral.Attachments)
      ? deferral.Attachments
      : [];

  const deferralAdditionalFiles = Array.isArray(deferral.additionalFiles)
    ? deferral.additionalFiles
    : Array.isArray(deferral.AdditionalFiles)
      ? deferral.AdditionalFiles
      : [];

  const deferralAdditionalDocuments = Array.isArray(deferral.additionalDocuments)
    ? deferral.additionalDocuments
    : Array.isArray(deferral.AdditionalDocuments)
      ? deferral.AdditionalDocuments
      : [];

  const deferralDocuments = Array.isArray(deferral.documents)
    ? deferral.documents
    : Array.isArray(deferral.Documents)
      ? deferral.Documents
      : [];

  const selectedDocumentsJson =
    deferral.selectedDocumentsJson ||
    deferral.SelectedDocumentsJson ||
    "";

  const dclNumber =
    deferral.dclNo ||
    deferral.dclNumber ||
    deferral.DclNo ||
    deferral.DclNumber ||
    "";

  let selectedDocumentsSource = Array.isArray(deferral.selectedDocuments)
    ? deferral.selectedDocuments
    : Array.isArray(deferral.SelectedDocuments)
      ? deferral.SelectedDocuments
    : [];

  if (
    selectedDocumentsSource.length === 0 &&
    typeof selectedDocumentsJson === "string" &&
    selectedDocumentsJson.trim()
  ) {
    try {
      const parsedSelectedDocuments = JSON.parse(selectedDocumentsJson);
      if (Array.isArray(parsedSelectedDocuments)) {
        selectedDocumentsSource = parsedSelectedDocuments;
      }
    } catch {
      selectedDocumentsSource = [];
    }
  }

  const allDocs = [];
  const selectedDocNames = new Set();

  // Helper to normalize document names for comparison
  deferralAttachments.forEach((attachment, index) => {
    const attachmentName = attachment.name || attachment.Name || attachment.fileName || attachment.FileName || "";
    const attachmentUrl = attachment.url || attachment.Url || attachment.fileUrl || attachment.FileUrl || "";
    const attachmentId = attachment.id || attachment.Id || attachment._id || attachment._Id || `att_${index}`;
    const attachmentUploadDate = attachment.uploadDate || attachment.UploadDate || attachment.uploadedAt || attachment.UploadedAt || attachment.createdAt || attachment.CreatedAt || null;
    const sectionFromUrl = getDocumentSectionFromUrl(attachmentUrl);
    const documentTarget = getDocumentTargetFromUrl(attachmentUrl);
    const isDCL =
      attachment.isDCL === true ||
      attachment.IsDCL === true ||
      sectionFromUrl === "dcl" ||
      hasDclPrefix(attachmentName) ||
      includesDclNumber(attachmentName, dclNumber);

    allDocs.push({
      id: attachmentId,
      name: attachmentName,
      type: getFileExtension(attachmentName),
      url: attachmentUrl,
      isDCL,
      isAdditional:
        attachment.isAdditional === true ||
        attachment.IsAdditional === true ||
        sectionFromUrl === "additional" ||
        !isDCL,
      documentTarget,
      isCloseRequestEvidence: !!documentTarget,
      isUploaded: true,
      source: "attachments",
      uploadDate: attachmentUploadDate,
    });
  });

  const additionalFileSources = [
    ...deferralAdditionalFiles,
    ...deferralAdditionalDocuments,
  ];

  additionalFileSources.forEach((file, index) => {
    const fileName = file.name || file.Name || file.fileName || file.FileName || "";
    const fileUrl = file.url || file.Url || file.fileUrl || file.FileUrl || "";
    allDocs.push({
      id: file.id || file.Id || file._id || file._Id || `add_${index}`,
      name: fileName,
      type: getFileExtension(fileName),
      url: fileUrl,
      isAdditional: true,
      isUploaded: true,
      source: "additionalFiles",
      uploadDate: file.uploadDate || file.UploadDate || file.uploadedAt || file.UploadedAt || file.createdAt || file.CreatedAt || null,
    });
  });

  selectedDocumentsSource.forEach((document, index) => {
    const docName =
      typeof document === "string"
        ? document
        : document.name || document.Name || document.label || document.Label || "Document";
    selectedDocNames.add(normalizeDocName(docName));
    
    allDocs.push({
      id: document.id || document.Id || document._id || document._Id || `req_${index}`,
      name: docName,
      type: document.type || document.Type || "",
      documentType:
        typeof document === "object"
          ? document.documentType || document.DocumentType || document.type || document.Type || document.docType || document.DocType || ""
          : "",
      category:
        typeof document === "object"
          ? document.category || document.Category || document.documentCategory || document.DocumentCategory || document.classification || document.Classification || ""
          : "",
      allowability:
        typeof document === "object"
          ? document.allowability || document.Allowability || document.allowableType || document.AllowableType || ""
          : "",
      isRequested: true,
      isSelected: true,
      source: "selected",
      // preserve per-document deferral metadata when present
      daysSought: (typeof document === 'object' && (document.daysSought || document.DaysSought || document.requestedDaysSought || document.RequestedDaysSought)) || undefined,
      nextDocumentDueDate: (typeof document === 'object' && (document.nextDocumentDueDate || document.NextDocumentDueDate || document.nextDueDate || document.NextDueDate)) || undefined,
    });
  });

  deferralDocuments.forEach((document, index) => {
    // Skip if this document was already added from selectedDocuments
    const documentName = document.name || document.Name || document.fileName || document.FileName || "";
    if (selectedDocNames.has(normalizeDocName(documentName))) {
      return;
    }

    const name = String(documentName || "");
    const documentUrl = document.url || document.Url || document.fileUrl || document.FileUrl || "";
    const sectionFromUrl = getDocumentSectionFromUrl(documentUrl);
    const documentTarget = getDocumentTargetFromUrl(documentUrl);
    const dclNameMatch =
      hasDclPrefix(name) ||
      includesDclNumber(name, dclNumber);

    const isDCLFlag =
      (typeof document.isDCL !== "undefined" && document.isDCL) ||
      (typeof document.IsDCL !== "undefined" && document.IsDCL) ||
      sectionFromUrl === "dcl" ||
      dclNameMatch;

    const isAdditionalFlag =
      typeof document.isAdditional !== "undefined"
        ? document.isAdditional
        : typeof document.IsAdditional !== "undefined"
          ? document.IsAdditional
        : sectionFromUrl === "additional" || !isDCLFlag;

    const cleanUrl = stripDocumentSectionMarker(documentUrl);
    const hasUrl = !!String(cleanUrl || "").trim();
    const isUploadedFlag = hasUrl;
    const isRequestedFromPersistedSelection = !hasUrl && !isDCLFlag;

    allDocs.push({
      id: document._id || document._Id || document.id || document.Id || `doc_${index}`,
      name,
      type: document.type || document.Type || getFileExtension(name),
      documentType: document.documentType || document.DocumentType || document.type || document.Type || "",
      category: document.category || document.Category || document.documentCategory || document.DocumentCategory || document.classification || document.Classification || "",
      allowability: document.allowability || document.Allowability || document.allowableType || document.AllowableType || "",
      url: cleanUrl,
      isDocument: true,
      isUploaded: isUploadedFlag,
      isRequested: isRequestedFromPersistedSelection,
      isSelected: isRequestedFromPersistedSelection,
      source: "documents",
      isDCL: !!isDCLFlag,
      isAdditional: !!isAdditionalFlag,
      documentTarget,
      isCloseRequestEvidence: !!documentTarget,
      uploadDate: document.uploadDate || document.UploadDate || document.uploadedAt || document.UploadedAt || document.createdAt || document.CreatedAt || null,
      size: document.size || document.Size || null,
      uploadedBy: document.uploadedBy || document.UploadedBy,
      uploadedById: document.uploadedById || document.UploadedById,
      // preserve any per-document deferral metadata
      daysSought: (document && (document.daysSought || document.DaysSought || document.requestedDaysSought || document.RequestedDaysSought)) || undefined,
      nextDocumentDueDate: (document && (document.nextDocumentDueDate || document.NextDocumentDueDate || document.nextDueDate || document.NextDueDate)) || undefined,
    });
  });

  const uploadedDocuments = allDocs.filter((document) => document.isUploaded);
  
  // Improved DCL detection: first try URL marker, then name-based detection
  const dclCandidates = uploadedDocuments.filter((document) => {
    const sectionFromUrl = getDocumentSectionFromUrl(document.url);
    return document.isDCL || sectionFromUrl === "dcl" || hasDclPrefix(document.name);
  });
  
  const primaryDcl = pickPrimaryDclDocument(dclCandidates, dclNumber) || dclCandidates[0] || null;

  const dclDocs = primaryDcl ? [primaryDcl] : [];
  const uploadedDocs = uploadedDocuments
    .filter((document) => !primaryDcl || document.id !== primaryDcl.id)
    .map((document) => (document.isDCL ? { ...document, isDCL: false, isAdditional: true } : document));

  const requestedDocs = allDocs.filter((document) => document.isRequested || document.isSelected);

  return { allDocs, dclDocs, uploadedDocs, requestedDocs };
};

export const getCloseRequestDocumentGroups = (deferral) => {
  if (!deferral) return [];

  const { requestedDocs = [], uploadedDocs = [] } = getDeferralDocumentBuckets(deferral);
  const storedDocuments = Array.isArray(deferral.closeRequestDocuments)
    ? deferral.closeRequestDocuments
    : [];

  const uploadsByTarget = uploadedDocs.reduce((accumulator, document) => {
    const key = normalizeDocName(document.documentTarget);
    if (!key) return accumulator;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(document);
    return accumulator;
  }, {});

  const requestedByName = requestedDocs.reduce((accumulator, document) => {
    const key = normalizeDocName(document.name);
    if (key && !accumulator[key]) {
      accumulator[key] = document;
    }
    return accumulator;
  }, {});

  const storedByName = storedDocuments.reduce((accumulator, document) => {
    const key = normalizeDocName(document.documentName);
    if (key && !accumulator[key]) {
      accumulator[key] = document;
    }
    return accumulator;
  }, {});

  const names = Array.from(
    new Set([
      ...Object.keys(requestedByName),
      ...Object.keys(storedByName),
      ...Object.keys(uploadsByTarget),
    ]),
  );

  return names
    .map((name) => {
      const requestedDocument = requestedByName[name] || null;
      const storedDocument = storedByName[name] || null;
      const uploadsFromTaggedDocuments = uploadsByTarget[name] || [];
      const uploadsFromStoredState = Array.isArray(storedDocument?.files)
        ? storedDocument.files
            .filter((file) => file && (file.url || file.fileName))
            .map((file, index) => ({
              id: file.documentId || `${name}-stored-${index}`,
              name: file.fileName || file.name || "Supporting document",
              fileName: file.fileName || file.name || "Supporting document",
              url: file.url || "",
              fileUrl: file.url || "",
              uploadDate: file.uploadedAt || null,
              uploadedAt: file.uploadedAt || null,
              documentTarget:
                storedDocument?.documentName ||
                requestedDocument?.name ||
                "",
              isCloseRequestEvidence: true,
              source: "closeRequestStore",
            }))
        : [];
      const seenUploadKeys = new Set();
      const uploads = [...uploadsFromStoredState, ...uploadsFromTaggedDocuments].filter((upload) => {
        const normalizedUrl = stripDocumentSectionMarker(upload?.url || upload?.fileUrl || "");
        const key = `${String(normalizedUrl || "").trim().toLowerCase()}|${String(upload?.name || upload?.fileName || "").trim().toLowerCase()}`;
        if (seenUploadKeys.has(key)) {
          return false;
        }
        seenUploadKeys.add(key);
        return true;
      });
      const documentName =
        storedDocument?.documentName ||
        requestedDocument?.name ||
        uploads[0]?.documentTarget ||
        "";

      return {
        key: name,
        documentName,
        requestedDocument,
        uploads,
        comment: storedDocument?.comment || "",
        creatorStatus: storedDocument?.creatorStatus || "pending",
        creatorComment: storedDocument?.creatorComment || "",
        checkerStatus: storedDocument?.checkerStatus || "pending",
        checkerComment: storedDocument?.checkerComment || "",
        creatorReviewedAt: storedDocument?.creatorReviewedAt || null,
        checkerReviewedAt: storedDocument?.checkerReviewedAt || null,
      };
    })
    .filter((document) => document.documentName);
};

/**
 * Resolves extension days and calculated next due date for a document
 * Takes into account extension-specific data when available
 * @param {Object} doc - The document object
 * @param {Object} deferral - The main deferral object
 * @param {Object} extension - The extension object (if present)
 * @returns {Object} { days, nextDate }
 */
export const resolveDocumentDaysAndDateWithExtension = (
  doc,
  deferral,
  extension
) => {
  if (!doc) return { days: undefined, nextDate: undefined };

  const extensionSelectedDocuments = Array.isArray(extension?.selectedDocuments)
    ? extension.selectedDocuments
    : typeof extension?.selectedDocumentsJson === "string" && extension.selectedDocumentsJson.trim()
      ? (() => {
          try {
            const parsed = JSON.parse(extension.selectedDocumentsJson);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  if (extensionSelectedDocuments.length > 0) {
    const docName = String(doc?.name || doc?.label || "").toLowerCase().trim();
    const matchedExtensionDocument = extensionSelectedDocuments.find((item) => {
      const itemName = String(item?.name || item?.label || "").toLowerCase().trim();
      return itemName && itemName === docName;
    });

    if (matchedExtensionDocument) {
      return {
        days:
          matchedExtensionDocument.daysSought ||
          matchedExtensionDocument.requestedDaysSought ||
          undefined,
        nextDate:
          matchedExtensionDocument.nextDocumentDueDate ||
          matchedExtensionDocument.nextDueDate ||
          undefined,
      };
    }
  }

  // For extension applications, show extension days and calculated new due date
  if (extension && extension.extensionDaysByDoc) {
    // Get document name for lookup
    const docName = doc?.name || doc?.label || "";
    const docNameLower = String(docName).toLowerCase().trim();

    // Try to get extension days from extensionDaysByDoc
    let extensionDays = undefined;
    if (extension.extensionDaysByDoc && typeof extension.extensionDaysByDoc === "object") {
      // Try exact match first
      if (extension.extensionDaysByDoc[docName]) {
        extensionDays = extension.extensionDaysByDoc[docName];
      } else {
        // Try case-insensitive match
        const matchKey = Object.keys(extension.extensionDaysByDoc).find(
          (key) => String(key).toLowerCase().trim() === docNameLower
        );
        if (matchKey) {
          extensionDays = extension.extensionDaysByDoc[matchKey];
        }
      }
    }

    // Parse extensionDaysByDoc if it's a JSON string
    if (
      extensionDays === undefined &&
      typeof extension.extensionDaysByDoc === "string"
    ) {
      try {
        const parsed = JSON.parse(extension.extensionDaysByDoc);
        if (parsed && typeof parsed === "object") {
          if (parsed[docName]) {
            extensionDays = parsed[docName];
          } else {
            const matchKey = Object.keys(parsed).find(
              (key) => String(key).toLowerCase().trim() === docNameLower
            );
            if (matchKey) {
              extensionDays = parsed[matchKey];
            }
          }
        }
      } catch {
        // JSON parse failed, continue
      }
    }

    // If we found extension days, calculate the new due date
    if (
      typeof extensionDays !== "undefined" &&
      extensionDays !== null &&
      extensionDays > 0
    ) {
      // Get the original due date from the document or deferral
      const origDate =
        doc?.nextDocumentDueDate ||
        doc?.nextDueDate ||
        deferral?.nextDocumentDueDate ||
        deferral?.nextDueDate;

      let nextDate = undefined;
      if (origDate) {
        const dateObj = dayjs(origDate);
        if (dateObj.isValid()) {
          nextDate = dateObj.add(extensionDays, "days").toISOString();
        }
      }

      return {
        days: extensionDays,
        nextDate,
      };
    }
  }

  // Standard behavior: use original deferral days and dates
  const tryValues = (obj, keys) => {
    for (const k of keys) {
      if (typeof obj[k] !== "undefined" && obj[k] !== null) return obj[k];
    }
    return undefined;
  };

  // Candidate keys to try for days and next date
  const dayKeys = [
    "daysSought",
    "requestedDaysSought",
    "requestedDays",
    "days",
    "requested_days",
    "requested_days_sought",
  ];
  const dateKeys = [
    "nextDocumentDueDate",
    "nextDueDate",
    "next_document_due_date",
    "next_due_date",
    "nextDocumentDue",
    "next_due",
  ];

  let days = tryValues(doc, dayKeys);
  let nextDate = tryValues(doc, dateKeys);

  // If still missing, try to match against deferral.selectedDocuments for persisted metadata
  if (
    (typeof days === "undefined" || typeof nextDate === "undefined") &&
    Array.isArray(deferral?.selectedDocuments)
  ) {
    const docName = (doc && (doc.name || doc.label)) || String(doc || "");
    const match = deferral.selectedDocuments.find((sd) => {
      const sdName = (sd && (sd.name || sd.label)) || String(sd || "");
      return (
        sdName &&
        sdName.toLowerCase().trim() === String(docName).toLowerCase().trim()
      );
    });
    if (match) {
      if (typeof days === "undefined") days = tryValues(match, dayKeys);
      if (typeof nextDate === "undefined")
        nextDate = tryValues(match, dateKeys);
    }
  }

  return { days, nextDate };
};