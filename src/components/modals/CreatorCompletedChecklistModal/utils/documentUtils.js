import { API_BASE_URL, STATUS_COLORS } from "./constants";
import dayjs from "dayjs";

export const prepareDocuments = (checklist) => {
  console.log("🔍 prepareDocuments - checklist:", checklist);

  if (!checklist || !checklist.documents) {
    console.log("❌ No checklist or documents");
    return [];
  }

  console.log("📄 checklist.documents:", checklist.documents);
  console.log("📄 Type:", typeof checklist.documents);
  console.log("📄 Is array?", Array.isArray(checklist.documents));
  console.log("📄 Length:", checklist.documents?.length);

  const flatDocs = checklist.documents.reduce((acc, item, itemIndex) => {
    console.log(`📄 Item ${itemIndex}:`, item);

    if (item.docList && Array.isArray(item.docList) && item.docList.length) {
      console.log(
        `📄 Item ${itemIndex} has docList with ${item.docList.length} docs`,
      );
      const nestedDocs = item.docList.map((doc, docIndex) => {
        console.log(`📄   Nested doc ${docIndex}:`, doc);
        return {
          ...doc,
          category: item.category,
          checkerStatus:
            doc.checkerStatus ||
            doc.coCheckerStatus ||
            doc.co_checker_status ||
            null,
        };
      });
      return acc.concat(nestedDocs);
    }

    if (item.category) {
      console.log(
        `📄 Item ${itemIndex} is direct document with category: ${item.category}`,
      );
      return acc.concat({
        ...item,
        checkerStatus:
          item.checkerStatus ||
          item.coCheckerStatus ||
          item.co_checker_status ||
          null,
      });
    }

    console.log(`📄 Item ${itemIndex} has no category or docList`);
    return acc;
  }, []);

  console.log("📄 Flat docs after processing:", flatDocs);
  console.log("📄 Flat docs length:", flatDocs.length);

  const result = flatDocs.map((doc, idx) => {
    let finalCheckerStatus = doc.checkerStatus || null;

    if (checklist.status === "approved" || checklist.status === "completed") {
      finalCheckerStatus = "approved";
    } else if (checklist.status === "rejected") {
      finalCheckerStatus = "rejected";
    } else {
      finalCheckerStatus = doc.checkerStatus || "pending";
    }

    const transformed = {
      ...doc,
      docIdx: idx,
      status: doc.status || "pending",
      action: doc.action || doc.status || "pending",
      comment: doc.comment || "",
      fileUrl: doc.fileUrl || null,
      expiryDate: doc.expiryDate || null,
      checkerStatus: doc.checkerStatus || null,
      finalCheckerStatus: finalCheckerStatus,
      deferralNo: doc.deferralNo || null,
      name: doc.name || doc.documentName || `Document ${idx + 1}`,
    };

    console.log(`📄 Transformed doc ${idx}:`, transformed);
    return transformed;
  });

  console.log("✅ Final prepared documents:", result);
  return result;
};

export const calculateDocumentStats = (docs) => {
  // ADDED: Safety check for non-array input
  if (!Array.isArray(docs)) {
    console.warn("calculateDocumentStats received non-array:", docs);
    return {
      total: 0,
      submitted: 0,
      pendingFromRM: 0,
      pendingFromCo: 0,
      deferred: 0,
      sighted: 0,
      waived: 0,
      tbo: 0,
      progressPercent: 0,
    };
  }

  // Original function remains the same
  const total = docs.length;

  const submitted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "submitted" ||
      d.action?.toLowerCase() === "submitted" ||
      d.coStatus?.toLowerCase() === "submitted",
  ).length;

  const pendingFromRM = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingrm" ||
      d.action?.toLowerCase() === "pendingrm" ||
      d.coStatus?.toLowerCase() === "pendingrm",
  ).length;

  const pendingFromCo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingco" ||
      d.action?.toLowerCase() === "pendingco" ||
      d.coStatus?.toLowerCase() === "pendingco",
  ).length;

  const deferred = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "deferred" ||
      d.action?.toLowerCase() === "deferred" ||
      d.coStatus?.toLowerCase() === "deferred",
  ).length;

  const sighted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "sighted" ||
      d.action?.toLowerCase() === "sighted" ||
      d.coStatus?.toLowerCase() === "sighted",
  ).length;

  const waived = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "waived" ||
      d.action?.toLowerCase() === "waived" ||
      d.coStatus?.toLowerCase() === "waived",
  ).length;

  const tbo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "tbo" ||
      d.action?.toLowerCase() === "tbo" ||
      d.coStatus?.toLowerCase() === "tbo",
  ).length;

  const progressPercent =
    total === 0
      ? 0
      : docs.filter(
            (d) =>
              d.action?.toLowerCase() === "pendingco" ||
              d.status?.toLowerCase() === "pendingco",
          ).length === 0
        ? 100
        : Math.round((submitted / total) * 100);

  return {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    progressPercent,
  };
};

export const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase();
  return STATUS_COLORS[statusLower] || STATUS_COLORS.default;
};

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");
  return expiry.isBefore(today) ? "expired" : "current";
};

// Additional helper function for date formatting
export const formatDate = (date, format = "DD/MM/YYYY") => {
  if (!date) return "N/A";
  return dayjs(date).format(format);
};
