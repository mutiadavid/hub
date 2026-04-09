import { FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, FileTextOutlined } from "@ant-design/icons";
import UniformTag from "../../../../components/common/UniformTag";
import { ERROR_RED, PRIMARY_BLUE, SECONDARY_PURPLE } from "./constants";

/**
 * Get the appropriate icon for a file type
 * @param {string} type - File type (pdf, word, excel, image)
 * @returns {JSX.Element} Icon component
 */
export const getFileIcon = (type) => {
  switch (type) {
    case "pdf":
      return <FilePdfOutlined style={{ color: ERROR_RED }} />;
    case "word":
      return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
    case "excel":
      return <FileExcelOutlined style={{ color: "#52c41a" }} />;
    case "image":
      return <FileImageOutlined style={{ color: SECONDARY_PURPLE }} />;
    default:
      return <FileTextOutlined />;
  }
};

/**
 * Get the uniform tag for a user role
 * @param {string} role - User role
 * @returns {JSX.Element} UniformTag component
 */
export const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();
  switch (roleLower) {
    case "rm":
      color = "blue";
      break;
    case "deferral management":
      color = "green";
      break;
    case "creator":
      color = "green";
      break;
    case "co_checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }
  return (
    <UniformTag
      color={color}
      text={roleLower.replace(/_/g, " ")}
      uppercase
      maxChars={14}
      style={{ marginLeft: 8 }}
    />
  );
};

/**
 * Remove role from username if it appears in brackets
 * @param {string} username - Username possibly with role in brackets
 * @returns {string} Formatted username
 */
export const formatUsername = (username) => {
  if (!username) return "System";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

/**
 * Determine if a status represents a withdrawn deferral
 * @param {object} deferral - Deferral record
 * @returns {boolean}
 */
export const isWithdrawnStatus = (deferral) => {
  return Boolean(
    deferral?.closedByName ||
    deferral?.ClosedByName ||
    deferral?.closedBy ||
    deferral?.closedByUser
  );
};

/**
 * Get return/rework reason from deferral data
 * @param {object} deferral - Deferral record
 * @returns {string} Reason text
 */
export const getReturnedForReworkReason = (deferral) => {
  if (!deferral) return "";

  // Try direct reason fields
  const directReason = deferral.returnReason || deferral.reworkReason || deferral.reworkComment;
  if (typeof directReason === "string" && directReason.trim()) {
    return directReason.trim();
  }

  // Try JSON-encoded rework comments
  const rawReworkComments = deferral.reworkComments;
  if (typeof rawReworkComments === "string" && rawReworkComments.trim()) {
    try {
      const parsed = JSON.parse(rawReworkComments);
      if (parsed && typeof parsed.reworkComment === "string" && parsed.reworkComment.trim()) {
        return parsed.reworkComment.trim();
      }
    } catch {
      return rawReworkComments.trim();
    }
  }

  // Try object-based rework comments
  if (rawReworkComments && typeof rawReworkComments === "object") {
    const objectReason = rawReworkComments.reworkComment;
    if (typeof objectReason === "string" && objectReason.trim()) {
      return objectReason.trim();
    }
  }

  // Try comments array
  if (Array.isArray(deferral.comments) && deferral.comments.length > 0) {
    const rolePriority = [
      "creator",
      "cocreator",
      "co_creator",
      "checker",
      "cochecker",
      "co_checker",
    ];
    const normalizedRole = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    const hasPreferredRole = (role) => rolePriority.includes(normalizedRole(role));

    // Look for preferred role first
    const preferredComment = [...deferral.comments]
      .reverse()
      .find((comment) => {
        const role = comment?.author?.role || comment?.authorRole || comment?.role;
        const text = comment?.text || comment?.comment;
        return hasPreferredRole(role) && typeof text === "string" && text.trim();
      });

    if (preferredComment) {
      return (preferredComment.text || preferredComment.comment || "").trim();
    }

    // Fall back to latest comment
    const latestComment = [...deferral.comments]
      .reverse()
      .find((comment) => {
        const text = comment?.text || comment?.comment;
        return typeof text === "string" && text.trim();
      });

    if (latestComment) {
      return (latestComment.text || latestComment.comment || "").trim();
    }
  }

  return "";
};

/**
 * Get search text from deferral documents
 * @param {object} deferral - Deferral record
 * @returns {string} Searchable document text
 */
export const getDocumentSearchText = (deferral) => {
  if (!deferral) return "";

  const selected = Array.isArray(deferral.selectedDocuments)
    ? deferral.selectedDocuments
        .map((doc) =>
          typeof doc === "string"
            ? doc
            : doc?.name || doc?.label || doc?.documentName || "",
        )
        .filter(Boolean)
    : [];

  const uploaded = Array.isArray(deferral.documents)
    ? deferral.documents
        .map((doc) => doc?.name || doc?.documentName || "")
        .filter(Boolean)
    : [];

  const attachments = Array.isArray(deferral.attachments)
    ? deferral.attachments.map((file) => file?.name || "").filter(Boolean)
    : [];

  const additionalFiles = Array.isArray(deferral.additionalFiles)
    ? deferral.additionalFiles
        .map((file) => file?.name || "")
        .filter(Boolean)
    : [];

  return [...selected, ...uploaded, ...attachments, ...additionalFiles]
    .join(" ")
    .toLowerCase();
};
