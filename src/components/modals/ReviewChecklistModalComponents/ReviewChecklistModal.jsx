// // export default ReviewChecklistModal;
// import React, { useState, useEffect } from "react";
// import dayjs from "dayjs";
// import { Modal, Button, Tag, Input } from "antd";
// import {
//   FilePdfOutlined,
//   LeftOutlined,
//   CloseOutlined,
//   PlusOutlined,
//   LockOutlined,
// } from "@ant-design/icons";
// import ActionButtons from "./ActionButtons";
// import DocumentSidebar from "./DocumentSidebar";
// import ChecklistHeader from "./ChecklistHeader";
// import { useDocumentHandlers } from "../../../hooks/useDocumentHandlers";
// import { useChecklistOperations } from "../../../hooks/useChecklistOperations";
// import { PRIMARY_BLUE } from "../../../utils/constants";
// import CommentHistory from "../../common/CommentHistory";
// import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
// // import { API_BASE_URL } from "../../../utils/checklistUtils";
// // import { customStyles } from "../../../styles/theme";
// import { RightOutlined } from "@ant-design/icons";
// // import { LeftOutlined } from "@ant-design/icons";
// import DocumentTable from "./DocumentTable";
// import { customStyles } from "../../styles/Theme";
// import { useSelector } from "react-redux";
// import ProgressStats from "./ProgressStats";
// import AddDocumentModal from "../../common/AddDocumentModal";
// import { getUniqueCategories } from "../../../utils/checklistUtils";
// import { loanTypeDocuments } from "../../../pages/docTypes";
// import {
//   useAddDocumentMutation,
//   useDeleteDocumentMutation,
//   useUnlockDclMutation,
// } from "../../../api/checklistApi";
// import { message } from "antd";
// import { Upload } from "antd";
// import { UploadOutlined } from "@ant-design/icons";
// import deferralApi from "../../../service/deferralApi";

// const normalizeLookupValue = (value) =>
//   String(value || "")
//     .trim()
//     .toLowerCase();

// const isDeferredAction = (value) =>
//   ["deferred", "deferralrequested", "defferalrequested"].includes(
//     normalizeLookupValue(value).replace(/[^a-z]/g, ""),
//   );

// const isDeferralFullyApproved = (deferral) => {
//   const normalizedStatus = normalizeLookupValue(deferral?.status).replace(
//     /[^a-z]/g,
//     "",
//   );
//   const creatorApproved = normalizeLookupValue(
//     deferral?.creatorApprovalStatus,
//   ) === "approved";
//   const checkerApproved = normalizeLookupValue(
//     deferral?.checkerApprovalStatus,
//   ) === "approved";
//   const allApproversApproved = deferral?.allApproversApproved === true;

//   return (
//     normalizedStatus === "approved" &&
//     creatorApproved &&
//     checkerApproved &&
//     allApproversApproved
//   );
// };

// const ReviewChecklistModal = ({
//   checklist,
//   open,
//   onClose,
//   readOnly = false,
//   onChecklistUpdate = null, // Callback to update parent with fresh checklist data
// }) => {
//   const auth = useSelector((state) => state.auth);
//   const token = auth?.token || localStorage.getItem("token");

//   // Check if DCL is locked by someone else (early, before used in JSX)
//   const currentUserId = auth?.user?.id || auth?.user?._id;
//   const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
//   const lockedByUserName =
//     checklist?.lockedBy?.name || checklist?.lockedByUserName;
//   const isLockedBySomeoneElse =
//     lockedByUserId && lockedByUserId !== currentUserId;
//   const isLockedByMe = lockedByUserId === currentUserId;

//   // State
//   const [docs, setDocs] = useState([]);
//   const [supportingDocs, setSupportingDocs] = useState([]);
//   const [creatorComment, setCreatorComment] = useState("");
//   const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
//   const [localChecklist, setLocalChecklist] = useState(checklist);
//   const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
//   const [isUploadingSupportingDoc, setIsUploadingSupportingDoc] =
//     useState(false);
//   const [deferralValidationByDoc, setDeferralValidationByDoc] = useState({});

//   // Hooks
//   // const documentStats = useDocumentStats(docs);
//   const [addDocumentMutation] = useAddDocumentMutation();
//   const [deleteDocumentMutation] = useDeleteDocumentMutation();
//   const [unlockDcl] = useUnlockDclMutation();

//   const { data: comments, isLoading: commentsLoading } =
//     useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
//       skip: !checklist?.id && !checklist?._id,
//     });

//   // DEBUG: Log comment fetching
//   React.useEffect(() => {
//     const checklistId = checklist?.id || checklist?._id;
//     console.log(
//       "📋 ReviewChecklistModal - Checklist ID for comments:",
//       checklistId,
//     );
//     console.log("📋 Comments Loading:", commentsLoading);
//     console.log("📋 Comments Data:", comments);
//     if (comments && Array.isArray(comments)) {
//       console.log(`📋 Total comments fetched: ${comments.length}`);
//     }
//   }, [checklist?.id, checklist?._id, comments, commentsLoading]);

//   const isActionDisabled = readOnly;
//   // Check if checklist status allows actions (Creator can act on pending or cocreatorreview)
//   const checklistStatus = (
//     localChecklist?.status ||
//     checklist?.status ||
//     ""
//   ).toLowerCase();
//   const isCreatorReviewAllowed = [
//     "pending",
//     "cocreatorreview",
//     "co_creator_review",
//   ].includes(checklistStatus);
//   // Disable actions if locked by someone else
//   const shouldGrayOut =
//     isActionDisabled || !isCreatorReviewAllowed || isLockedBySomeoneElse;

//   const {
//     handleNameChange,
//     handleActionChange: baseHandleActionChange,
//     handleCommentChange,
//     handleDeferralNoChange: baseHandleDeferralNoChange,
//     handleExpiryDateChange,
//   } = useDocumentHandlers(docs, setDocs, isActionDisabled);

//   const getChecklistCustomerContext = () => ({
//     customerNumber: normalizeLookupValue(
//       checklist?.customerNumber || localChecklist?.customerNumber,
//     ),
//     customerName: normalizeLookupValue(
//       checklist?.customerName || localChecklist?.customerName,
//     ),
//   });

//   const clearDeferralValidation = (docIdx) => {
//     setDeferralValidationByDoc((prev) => {
//       if (!(docIdx in prev)) {
//         return prev;
//       }

//       const next = { ...prev };
//       delete next[docIdx];
//       return next;
//     });
//   };

//   const markDeferralValidationPending = (docIdx) => {
//     setDeferralValidationByDoc((prev) => ({
//       ...prev,
//       [docIdx]: {
//         status: "idle",
//         message: "This deferral will be checked before submission to Co-Checker.",
//       },
//     }));
//   };

//   const validateDeferredDocument = async (docIdx, valueOverride, options = {}) => {
//     const doc = docs.find((entry) => entry.docIdx === docIdx);
//     const deferralNumber = String(
//       valueOverride ?? doc?.deferralNo ?? doc?.deferralNumber ?? "",
//     ).trim();

//     if (!doc || !isDeferredAction(doc.action || doc.status)) {
//       clearDeferralValidation(docIdx);
//       return { valid: true, skipped: true };
//     }

//     if (!deferralNumber) {
//       const missingResult = {
//         status: "invalid",
//         message: "Enter a deferral number before sending to Co-Checker.",
//       };
//       setDeferralValidationByDoc((prev) => ({
//         ...prev,
//         [docIdx]: missingResult,
//       }));
//       return { valid: false, ...missingResult };
//     }

//     setDeferralValidationByDoc((prev) => ({
//       ...prev,
//       [docIdx]: {
//         status: "validating",
//         message: "Checking deferral approval status...",
//       },
//     }));

//     try {
//       const matches = await deferralApi.searchDeferrals({ deferralNumber }, token);
//       const exactMatches = (Array.isArray(matches) ? matches : []).filter(
//         (item) => normalizeLookupValue(item?.deferralNumber) === normalizeLookupValue(deferralNumber),
//       );

//       if (!exactMatches.length) {
//         const invalidResult = {
//           status: "invalid",
//           message: `Deferral number ${deferralNumber} was not found.`,
//         };
//         setDeferralValidationByDoc((prev) => ({
//           ...prev,
//           [docIdx]: invalidResult,
//         }));
//         return { valid: false, ...invalidResult };
//       }

//       const customerContext = getChecklistCustomerContext();
//       const matchedDeferral = exactMatches.find((item) => {
//         const resultCustomerNumber = normalizeLookupValue(item?.customerNumber);
//         const resultCustomerName = normalizeLookupValue(item?.customerName);

//         if (customerContext.customerNumber && resultCustomerNumber) {
//           return customerContext.customerNumber === resultCustomerNumber;
//         }

//         if (customerContext.customerName && resultCustomerName) {
//           return customerContext.customerName === resultCustomerName;
//         }

//         return true;
//       });

//       if (!matchedDeferral) {
//         const customerMismatchResult = {
//           status: "invalid",
//           message: "This deferral number does not belong to this checklist customer.",
//         };
//         setDeferralValidationByDoc((prev) => ({
//           ...prev,
//           [docIdx]: customerMismatchResult,
//         }));
//         return { valid: false, ...customerMismatchResult };
//       }

//       const fullDeferral = await deferralApi.getDeferralById(matchedDeferral.id, token);

//       if (!isDeferralFullyApproved(fullDeferral)) {
//         const notApprovedResult = {
//           status: "invalid",
//           message: "This deferral is not yet fully approved by all approvers, co-creator and co-checker.",
//         };
//         setDeferralValidationByDoc((prev) => ({
//           ...prev,
//           [docIdx]: notApprovedResult,
//         }));
//         return { valid: false, ...notApprovedResult };
//       }

//       const validResult = {
//         status: "valid",
//         message: "Fully approved deferral verified.",
//         approvedAtText: fullDeferral?.checkerApprovalDate
//           ? dayjs(fullDeferral.checkerApprovalDate).format("DD MMM YYYY")
//           : "",
//       };
//       setDeferralValidationByDoc((prev) => ({
//         ...prev,
//         [docIdx]: validResult,
//       }));
//       return { valid: true, ...validResult };
//     } catch (error) {
//       const failedResult = {
//         status: "invalid",
//         message:
//           error?.message || "Unable to validate deferral approval right now.",
//       };
//       setDeferralValidationByDoc((prev) => ({
//         ...prev,
//         [docIdx]: failedResult,
//       }));
//       if (!options.silent) {
//         message.error(failedResult.message);
//       }
//       return { valid: false, ...failedResult };
//     }
//   };

//   const applyDeferredSubmissionErrorToRows = (errorMessage) => {
//     const messageText = String(errorMessage || "").trim();
//     if (!messageText) {
//       return;
//     }

//     const deferralNumberMatch = messageText.match(/Deferral number\s+([^\s]+)\s+/i);
//     const documentNameMatch = messageText.match(/Deferred document '([^']+)'/i);
//     const matchedDeferralNumber = deferralNumberMatch?.[1]?.trim();
//     const matchedDocumentName = documentNameMatch?.[1]?.trim();

//     const matchingDocs = docs.filter((doc) => {
//       if (!isDeferredAction(doc.action || doc.status)) {
//         return false;
//       }

//       if (matchedDeferralNumber) {
//         const docDeferralNumber = String(
//           doc.deferralNo || doc.deferralNumber || "",
//         ).trim();
//         return docDeferralNumber.toLowerCase() === matchedDeferralNumber.toLowerCase();
//       }

//       if (matchedDocumentName) {
//         return String(doc.name || "").trim().toLowerCase() === matchedDocumentName.toLowerCase();
//       }

//       return true;
//     });

//     if (!matchingDocs.length) {
//       return;
//     }

//     setDeferralValidationByDoc((prev) => {
//       const next = { ...prev };
//       matchingDocs.forEach((doc) => {
//         next[doc.docIdx] = {
//           status: "invalid",
//           message: messageText,
//         };
//       });
//       return next;
//     });
//   };

//   const handleActionChange = (docIdx, value) => {
//     baseHandleActionChange(docIdx, value);

//     setDocs((prevDocs) =>
//       prevDocs.map((doc) => {
//         if (doc.docIdx !== docIdx) {
//           return doc;
//         }

//         if (isDeferredAction(value)) {
//           return {
//             ...doc,
//             action: value,
//             status: value,
//             deferralNo: "",
//             deferralNumber: "",
//           };
//         }

//         return {
//           ...doc,
//           action: value,
//           status: value,
//           deferralNo: "",
//           deferralNumber: "",
//         };
//       }),
//     );

//     clearDeferralValidation(docIdx);
//   };

//   const handleDeferralNoChange = (docIdx, value) => {
//     baseHandleDeferralNoChange(docIdx, value);
//     markDeferralValidationPending(docIdx);
//   };

//   const handleDelete = async (docIdx) => {
//     if (isActionDisabled) return;

//     const documentToDelete = docs[docIdx];
//     if (!documentToDelete) return;

//     const checklistId = checklist?.id || checklist?._id;
//     const documentId = documentToDelete._id || documentToDelete.id;

//     try {
//       if (checklistId && documentId && !documentToDelete.isNew) {
//         await deleteDocumentMutation({ id: checklistId, docId: documentId }).unwrap();
//       }

//       setDocs((prevDocs) =>
//         prevDocs
//           .filter((_, index) => index !== docIdx)
//           .map((doc, index) => ({ ...doc, docIdx: index })),
//       );

//       message.success("Document deleted.");
//     } catch (error) {
//       console.error("❌ Error deleting document:", error);
//       message.error(
//         error?.data?.message || error?.data?.error || "Failed to delete document",
//       );
//     }
//   };

//   const handleChecklistUpdate = (updatedChecklist) => {
//     // Merge the updated checklist with existing localChecklist to preserve fields not returned by submission
//     const mergedChecklist = {
//       ...localChecklist,
//       ...checklist,
//       ...updatedChecklist,
//       // Ensure supportingDocs from backend response is preserved
//       supportingDocs:
//         updatedChecklist?.supportingDocs ||
//         checklist?.supportingDocs ||
//         localChecklist?.supportingDocs ||
//         [],
//     };

//     console.log("🔄 handleChecklistUpdate called:");
//     console.log(
//       "   Updated checklist supportingDocs:",
//       updatedChecklist?.supportingDocs?.length || 0,
//     );
//     console.log(
//       "   Merged checklist supportingDocs:",
//       mergedChecklist.supportingDocs?.length || 0,
//     );

//     // Update local state with merged checklist
//     setLocalChecklist(mergedChecklist);

//     // Call parent callback if provided
//     if (onChecklistUpdate) {
//       onChecklistUpdate(mergedChecklist);
//     }
//   };

//   const {
//     isSubmittingToRM,
//     isCheckerSubmitting,
//     isSavingDraft,
//     submitToRM,
//     submitToCheckers,
//     saveDraft,
//   } = useChecklistOperations(
//     checklist,
//     docs,
//     supportingDocs, // Pass supportingDocs state
//     creatorComment,
//     null,
//     handleChecklistUpdate,
//     // ✅ NEW: Pass refetch callback to ensure parent refetches after submission
//     () => {
//       console.log("📡 useChecklistOperations requesting parent refetch");
//       if (onChecklistUpdate) {
//         onChecklistUpdate(checklist);
//       }
//     },
//   );

//   // Wrapper functions that unlock DCL after submission
//   const submitToRMWithUnlock = async () => {
//     const result = await submitToRM();
//     // Unlock after successful submission
//     const checklistId = checklist?.id || checklist?._id;
//     if (checklistId) {
//       try {
//         await unlockDcl(checklistId).unwrap();
//         console.log("🔓 DCL unlocked after RM submission");
//       } catch (error) {
//         console.warn("Failed to unlock DCL after RM submission:", error);
//       }
//     }
//     return result;
//   };

//   const submitToCheckersWithUnlock = async () => {
//     const deferredDocs = docs.filter((doc) =>
//       isDeferredAction(doc.action || doc.status),
//     );

//     for (const doc of deferredDocs) {
//       const validationResult = await validateDeferredDocument(
//         doc.docIdx,
//         doc.deferralNo || doc.deferralNumber || "",
//         { silent: true },
//       );

//       if (!validationResult.valid) {
//         message.error(
//           validationResult.message || "Fix deferred rows before submitting.",
//         );
//         return false;
//       }
//     }

//     let result;
//     try {
//       result = await submitToCheckers();
//     } catch (error) {
//       const errorMessage =
//         error?.data?.message ||
//         error?.data?.error ||
//         error?.message ||
//         "Failed to submit checklist.";
//       applyDeferredSubmissionErrorToRows(errorMessage);
//       message.error(errorMessage);
//       return false;
//     }

//     // Unlock after successful submission
//     const checklistId = checklist?.id || checklist?._id;
//     if (checklistId) {
//       try {
//         await unlockDcl(checklistId).unwrap();
//         console.log("🔓 DCL unlocked after Checker submission");
//       } catch (error) {
//         console.warn("Failed to unlock DCL after Checker submission:", error);
//       }
//     }
//     return result;
//   };

//   // Handle closing modal - do NOT unlock (only unlocks on submit)
//   const handleClose = () => {
//     onClose();
//   };

//   // Get available categories based on loan type or existing documents
//   const getAvailableCategories = () => {
//     const loanType = checklist?.loanType || localChecklist?.loanType;
//     if (loanType && loanTypeDocuments[loanType]) {
//       // Get categories from the predefined loan type documents
//       return loanTypeDocuments[loanType].map((cat) => cat.title);
//     }
//     // Fallback to existing document categories
//     return getUniqueCategories(docs);
//   };

//   // Handle adding a new document - saves to database immediately
//   const handleAddDocument = async (newDoc) => {
//     console.log("Adding new document:", newDoc);
//     const checklistId = checklist?.id || checklist?._id;

//     if (!checklistId) {
//       message.error("Checklist ID missing - cannot add document");
//       return;
//     }

//     try {
//       // Prepare document data for API
//       const documentData = {
//         name: newDoc.name,
//         category: newDoc.category,
//         status: newDoc.status || "pending",
//         comment: newDoc.comment || "",
//       };

//       console.log("📤 Saving new document to database:", documentData);

//       // Call API to add document to database
//       const result = await addDocumentMutation({
//         id: checklistId,
//         data: documentData,
//       }).unwrap();

//       console.log("✅ Document saved to database:", result);

//       // Add the new document to local state with the returned ID
//       const savedDoc = {
//         ...newDoc,
//         docIdx: docs.length,
//         _id:
//           result?.document?._id ||
//           result?.document?.id ||
//           result?._id ||
//           result?.id,
//         id:
//           result?.document?.id ||
//           result?.document?._id ||
//           result?.id ||
//           result?._id,
//         status: result?.document?.status || newDoc.status || "pending",
//       };

//       setDocs((prevDocs) => [...prevDocs, savedDoc]);

//       message.success("Document added successfully!");

//       // Trigger checklist update to refresh data from server
//       if (onChecklistUpdate && result?.checklist) {
//         handleChecklistUpdate(result.checklist);
//       }
//     } catch (error) {
//       console.error("❌ Error adding document:", error);
//       message.error(
//         error?.data?.message || error?.data?.error || "Failed to add document",
//       );

//       // Even if API call fails, add to local state so user can still submit with it
//       // This allows the document to be included when submitting to RM
//       const fallbackDoc = {
//         ...newDoc,
//         docIdx: docs.length,
//         isNew: true, // Mark as new so backend knows to create it
//       };
//       setDocs((prevDocs) => [...prevDocs, fallbackDoc]);
//     }
//   };

//   // Wrapper for uploading supporting docs - uploads to backend and adds to main docs array
//   const handleUploadSupportingDoc = async (file) => {
//     try {
//       setIsUploadingSupportingDoc(true);
//       console.log(
//         "📤 Co-Creator Modal - Uploading supporting document:",
//         file.name,
//       );

//       const checklistId = checklist?.id || checklist?._id;
//       if (!checklistId) {
//         throw new Error("Checklist ID missing");
//       }

//       const API_BASE_URL =
//         import.meta.env?.VITE_API_URL || "http://localhost:5000";

//       // Upload to backend using the document upload endpoint
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("checklistId", checklistId);
//       formData.append("documentName", file.name);
//       formData.append("category", "Supporting Documents");

//       const response = await fetch(`${API_BASE_URL}/api/uploads`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Upload failed: ${response.status} ${errorText}`);
//       }

//       const result = await response.json();
//       console.log("✅ Co-Creator Modal - Upload response:", result);

//       if (!result.success || !result.data) {
//         throw new Error("Invalid upload response");
//       }

//       const uploadedDoc = result.data;

//       // Create document object for the uploaded supporting doc
//       const newSupportingDoc = {
//         id: uploadedDoc.id || uploadedDoc._id,
//         _id: uploadedDoc._id || uploadedDoc.id,
//         name: uploadedDoc.name || uploadedDoc.fileName || file.name,
//         fileName: uploadedDoc.fileName || file.name,
//         category: "Supporting Documents",
//         status: "submitted",
//         action: "submitted",
//         creatorStatus: "submitted",
//         checkerStatus: null,
//         comment: "",
//         fileUrl: uploadedDoc.fileUrl,
//         fileSize: uploadedDoc.fileSize,
//         fileType: uploadedDoc.fileType,
//         uploadedBy: uploadedDoc.uploadedBy,
//         uploadedByRole:
//           uploadedDoc.uploadedByRole || auth?.user?.role || "cocreator",
//         uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
//         isSupporting: true,
//         uploadData: {
//           fileName: uploadedDoc.fileName || file.name,
//           fileUrl: uploadedDoc.fileUrl,
//           createdAt: uploadedDoc.createdAt || new Date().toISOString(),
//           fileSize: uploadedDoc.fileSize,
//           fileType: uploadedDoc.fileType,
//           uploadedBy:
//             uploadedDoc.uploadedBy || auth?.user?.name || "Co-Creator",
//         },
//       };

//       console.log(
//         "✅ Co-Creator Modal - Adding supporting doc to supportingDocs state (NOT to docs array):",
//         newSupportingDoc,
//       );

//       // Add to supportingDocs state (separate from main docs - won't appear in DocumentTable)
//       setSupportingDocs((prevDocs) => [...prevDocs, newSupportingDoc]);

//       message.success(`"${file.name}" uploaded successfully!`);
//     } catch (error) {
//       console.error(
//         "❌ Co-Creator Modal - Error uploading supporting doc:",
//         error,
//       );
//       message.error(error.message || "Failed to upload supporting document");
//       throw error;
//     } finally {
//       setIsUploadingSupportingDoc(false);
//     }
//   };

//   //   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
//   //   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
//   //     checklist?.status?.toLowerCase(),
//   //   );

//   // Sync localChecklist with prop when modal opens or checklist changes
//   useEffect(() => {
//     setLocalChecklist(checklist);
//   }, [checklist, open]);

//   useEffect(() => {
//     const sourceChecklist = localChecklist || checklist;
//     if (!sourceChecklist) {
//       console.warn("⚠️ No checklist available for document loading");
//       setDocs([]);
//       return;
//     }

//     // Try multiple document sources: documents, docList, items
//     const documentArray =
//       sourceChecklist.documents ||
//       sourceChecklist.docList ||
//       sourceChecklist.items ||
//       [];

//     if (!Array.isArray(documentArray)) {
//       console.warn("⚠️ Document array is not an array:", documentArray);
//       setDocs([]);
//       return;
//     }

//     console.log("📋 Raw document array from sourceChecklist:", {
//       documentsCount: documentArray.length,
//       firstDoc: documentArray[0],
//     });

//     const flatDocs = documentArray.reduce((acc, item) => {
//       // Handle nested structure with docList
//       if (
//         item.docList &&
//         Array.isArray(item.docList) &&
//         item.docList.length > 0
//       ) {
//         const nestedDocs = item.docList.map((doc) => ({
//           ...doc,
//           category: item.category || doc.category,
//           checkerStatus: doc.checkerStatus || item.checkerStatus,
//         }));
//         return acc.concat(nestedDocs);
//       }
//       // Handle flat structure (direct documents)
//       if (item.title || item.fileName || item.status) {
//         return acc.concat(item);
//       }
//       return acc;
//     }, []);

//     console.log("📋 Flattened documents:", {
//       count: flatDocs.length,
//       firstDoc: flatDocs[0],
//     });

//     const shouldClearCreatorDeferralInput = ["pending", "cocreatorreview", "co_creator_review"].includes(
//       checklistStatus,
//     );

//     const preparedDocs = flatDocs.map((doc, idx) => ({
//       ...doc,
//       docIdx: idx,
//       status: doc.status || doc.action || "pending", // PRESERVE original status from backend
//       creatorStatus: doc.creatorStatus, // PRESERVE creator status from backend
//       checkerStatus: doc.checkerStatus, // PRESERVE checker status from backend
//       checkerComment: doc.checkerComment || "", // ✅ Include checker comment from backend
//       action: doc.action || doc.status || "pending", // Use action if it exists, otherwise use status
//       comment: doc.comment || "",
//       fileUrl: doc.fileUrl || null,
//       expiryDate: doc.expiryDate || null,
//       finalCheckerStatus: doc.checkerStatus || doc.finalCheckerStatus,
//       sourceDeferralNumber: doc.deferralNumber || doc.deferralNo || "",
//       deferralNumber: shouldClearCreatorDeferralInput
//         ? ""
//         : doc.deferralNumber || doc.deferralNo || "",
//       deferralNo: shouldClearCreatorDeferralInput
//         ? ""
//         : doc.deferralNo || doc.deferralNumber || "",
//       rmStatus: doc.rmStatus || "",
//       uploadedBy:
//         doc.uploadedBy ||
//         doc.uploadedByName ||
//         doc.uploadData?.uploadedBy ||
//         doc.uploadData?.uploadedByName ||
//         doc.uploadData?.userName ||
//         null,
//       uploadedByRole:
//         doc.uploadedByRole ||
//         doc.uploadData?.uploadedByRole ||
//         doc.uploadData?.uploadedBy?.role ||
//         null,
//       uploadedAt:
//         doc.uploadedAt ||
//         doc.uploadDate ||
//         doc.uploadData?.uploadedAt ||
//         doc.uploadData?.createdAt ||
//         doc.modifiedDate ||
//         doc.updatedAt ||
//         doc.createdAt ||
//         null,
//     }));

//     console.log("📋 Documents prepared in ReviewChecklistModal:", {
//       count: preparedDocs.length,
//       firstDoc: preparedDocs[0],
//     });

//     // Set main docs WITHOUT supporting docs
//     setDocs(preparedDocs);
//     setDeferralValidationByDoc({});
//     console.log("📋 Main docs (excluding supporting):", preparedDocs.length);

//     // Set supporting docs separately from checklist
//     const supportingDocsData = sourceChecklist.supportingDocs || [];
//     setSupportingDocs(supportingDocsData);
//     console.log("📎 Supporting docs loaded:", supportingDocsData.length);
//   }, [localChecklist, checklist, checklistStatus]);

//   const uploadedDocumentCount = React.useMemo(() => {
//     const mainDocumentCount = docs.filter((doc) => doc.fileUrl || doc.uploadData?.fileUrl).length;
//     const supportingDocumentCount = supportingDocs.filter((doc) => doc.fileUrl).length;
//     return mainDocumentCount + supportingDocumentCount;
//   }, [docs, supportingDocs]);

//   return (
//     <>
//       <style>{customStyles}</style>
//       <style>{`
//         /* Overlay styling - full screen with proper z-index */
//         .review-modal-overlay {
//           position: fixed;
//           top: 65px;
//           left: var(--sidebar-width, 150px);
//           right: 0;
//           bottom: 0;
//           background-color: rgba(0, 0, 0, 0.5);
//           display: flex;
//           align-items: flex-start;
//           justify-content: center;
//           z-index: 990;
//           overflow: auto;
//           padding-top: 20px;
//           padding-bottom: 20px;
//           transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
//           max-height: 100vh;
//         }
        
//         /* Modal container - centered */
//         .review-modal-container {
//           background: white;
//           border-radius: 12px;
//           overflow: visible;
//           width: 1200px;
//           max-width: calc(100vw - 310px);
//           box-shadow: none;
//           border: 1px solid #e5e7eb;
//           margin: 0 auto;
//           position: relative;
//           z-index: 1001;
//         }
        
//         /* Responsive adjustments */
//         @media (min-width: 768px) and (max-width: 1099px) {
//           .review-modal-overlay {
//             left: var(--sidebar-width, 40px);
//             transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
//           }
//         }
        
//         @media (max-width: 767px) {
//           .review-modal-overlay {
//             left: 0;
//             padding-left: 0;
//             padding-right: 16px;
//           }
//           .review-modal-container {
//             width: calc(100vw - 32px) !important;
//             max-width: calc(100vw - 32px) !important;
//             margin: 0 !important;
//           }
//         }
//       `}</style>

//       <div
//         className="review-modal-overlay"
//         style={{
//           display: open ? "flex" : "none",
//         }}
//         onClick={handleClose}
//       >
//         {open && (
//           <div
//             className="review-modal-container"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Document Sidebar - Rendered inside modal */}
//             <DocumentSidebar
//               documents={docs}
//               supportingDocs={supportingDocs}
//               open={showDocumentSidebar}
//               onClose={() => setShowDocumentSidebar(false)}
//             />

//             {/* Header */}
//             <div
//               className="bg-linear-to-r from-blue-600 to-blue-800 text-white"
//               style={{
//                 background: PRIMARY_BLUE,
//                 borderRadius: "12px 12px 0 0",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   width: "100%",
//                   padding: "18px 24px",
//                 }}
//               >
//                 <div
//                   style={{ display: "flex", alignItems: "center", gap: "12px" }}
//                 >
//                   <span
//                     style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}
//                   >
//                     {`Review Checklist  ${checklist?.title || ""}`}
//                   </span>
//                   {isLockedByMe && (
//                     <Tag
//                       icon={<LockOutlined />}
//                       color="green"
//                       style={{ marginBottom: 0, fontWeight: 600 }}
//                     >
//                       Locked by you
//                     </Tag>
//                   )}
//                   {isLockedBySomeoneElse && (
//                     <Tag
//                       icon={<LockOutlined />}
//                       color="orange"
//                       style={{ marginBottom: 0, fontWeight: 600 }}
//                     >
//                       Locked by {lockedByUserName}
//                     </Tag>
//                   )}
//                 </div>
//                 <div
//                   style={{ display: "flex", alignItems: "center", gap: "8px" }}
//                 >
//                   <Button
//                     onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
//                     size="small"
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 6,
//                       backgroundColor: "#164679",
//                       borderColor: "#164679",
//                       color: "#fff",
//                       padding: "4px 12px",
//                       height: "32px",
//                     }}
//                   >
//                     View Documents
//                     {uploadedDocumentCount > 0 && (
//                       <span
//                         style={{
//                           marginLeft: 8,
//                           minWidth: 22,
//                           height: 22,
//                           padding: "0 7px",
//                           borderRadius: 999,
//                           display: "inline-flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           background: "#b5d334",
//                           color: "#164679",
//                           fontSize: 12,
//                           fontWeight: 700,
//                           lineHeight: 1,
//                           boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
//                         }}
//                       >
//                         {uploadedDocumentCount}
//                       </span>
//                     )}
//                   </Button>
//                   <Button
//                     icon={<CloseOutlined />}
//                     onClick={handleClose}
//                     size="small"
//                     type="default"
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       background: "rgba(255, 255, 255, 0.2)",
//                       borderColor: "rgba(255, 255, 255, 0.4)",
//                       color: "#fff",
//                       width: "32px",
//                       height: "32px",
//                       padding: 0,
//                     }}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Body */}
//             <div
//               className="p-6 space-y-6"
//               style={{ padding: "24px" }}
//               onClick={(e) => e.stopPropagation()}
//             >
//               {checklist && (
//                 <div
//                   style={{
//                     opacity: shouldGrayOut ? 0.5 : 1,
//                     pointerEvents: shouldGrayOut ? "none" : "auto",
//                     transition: "opacity 0.3s ease",
//                   }}
//                 >
//                   {/* Checklist Header */}
//                   <ChecklistHeader checklist={checklist} />

//                   {/* Progress Stats */}
//                   <ProgressStats docs={docs} />

//                   {/* Locked by someone else warning */}
//                   {isLockedBySomeoneElse && (
//                     <div
//                       style={{
//                         background: "#fff1f0",
//                         border: "1px solid #ffccc7",
//                         borderRadius: 8,
//                         padding: "12px 16px",
//                         marginBottom: 16,
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 12,
//                       }}
//                     >
//                       <LockOutlined
//                         style={{ fontSize: 20, color: "#ff4d4f" }}
//                       />
//                       <div>
//                         <div
//                           style={{
//                             fontWeight: 600,
//                             color: "#cf1322",
//                             fontSize: 14,
//                             marginBottom: 4,
//                           }}
//                         >
//                           This DCL is currently being edited by{" "}
//                           {lockedByUserName}
//                         </div>
//                         <div style={{ color: "#8c8c8c", fontSize: 12 }}>
//                           You cannot make changes while someone else is working
//                           on this checklist. Please try again later or contact
//                           them if you need access.
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {shouldGrayOut &&
//                     !isActionDisabled &&
//                     !isLockedBySomeoneElse && (
//                       <div
//                         style={{
//                           background: "#fff7e6",
//                           border: "1px solid #ffd591",
//                           borderRadius: 8,
//                           padding: "8px 16px",
//                           marginBottom: 16,
//                           color: "#d46b08",
//                           fontWeight: 600,
//                           fontSize: 13,
//                         }}
//                       >
//                         This checklist status doesn't allow Creator actions —
//                         all fields are read-only.
//                       </div>
//                     )}

//                   {/* Document Table */}
//                   <div>
//                     <h3
//                       style={{
//                         color: PRIMARY_BLUE,
//                         fontWeight: 700,
//                         marginBottom: 12,
//                         fontSize: 14,
//                       }}
//                     >
//                       Required Documents
//                     </h3>
//                     <DocumentTable
//                       docs={docs}
//                       onNameChange={handleNameChange}
//                       onActionChange={handleActionChange}
//                       onCommentChange={handleCommentChange}
//                       onDeferralNoChange={handleDeferralNoChange}
//                       onDelete={handleDelete}
//                       onExpiryDateChange={handleExpiryDateChange}
//                       isActionDisabled={isActionDisabled || shouldGrayOut}
//                       checklistStatus={checklist?.status}
//                       deferralValidationByDoc={deferralValidationByDoc}
//                       onValidateDeferralNo={validateDeferredDocument}
//                     />
//                   </div>

//                   {/* Add Document Button - Only show when actions are allowed */}
//                   {!shouldGrayOut && (
//                     <div style={{ marginTop: 16, marginBottom: 16 }}>
//                       <Button
//                         icon={<PlusOutlined />}
//                         onClick={() => setIsAddDocModalOpen(true)}
//                         style={{
//                           width: "100%",
//                           color: PRIMARY_BLUE,
//                           height: 40,
//                           fontWeight: 600,
//                           fontSize: 13,
//                           border: `1px solid ${PRIMARY_BLUE}`,
//                           background: "transparent",
//                         }}
//                       >
//                         Add New Document
//                       </Button>
//                     </div>
//                   )}

//                   {/* Creator Comment */}
//                   <div style={{ marginTop: 16 }}>
//                     <h4
//                       style={{
//                         color: PRIMARY_BLUE,
//                         fontWeight: 700,
//                         marginBottom: 4,
//                         fontSize: 13,
//                       }}
//                     >
//                       Creator Comment
//                     </h4>
//                     <Input.TextArea
//                       rows={2}
//                       value={creatorComment}
//                       onChange={(e) => setCreatorComment(e.target.value)}
//                       disabled={isActionDisabled || shouldGrayOut}
//                       placeholder="Add a comment for RM / Co-Checker"
//                       style={{ borderRadius: 6 }}
//                     />
//                   </div>

//                   {/* Comment History */}
//                   <div style={{ marginTop: 16 }}>
//                     <h4
//                       style={{
//                         color: PRIMARY_BLUE,
//                         fontWeight: 700,
//                         marginBottom: 4,
//                         fontSize: 13,
//                       }}
//                     >
//                       Comment Trail & History
//                     </h4>
//                     <CommentHistory
//                       comments={comments}
//                       isLoading={commentsLoading}
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             <div style={{ borderTop: "1px solid #e5e7eb" }}>
//               <ActionButtons
//                 readOnly={readOnly}
//                 isActionDisabled={isActionDisabled || shouldGrayOut}
//                 shouldGrayOut={shouldGrayOut}
//                 isSubmittingToRM={isSubmittingToRM}
//                 isCheckerSubmitting={isCheckerSubmitting}
//                 isSavingDraft={isSavingDraft}
//                 checklist={checklist}
//                 docs={docs}
//                 supportingDocs={[]}
//                 creatorComment={creatorComment}
//                 auth={auth}
//                 onSaveDraft={saveDraft}
//                 onSubmitToRM={submitToRMWithUnlock}
//                 onSubmitToCheckers={submitToCheckersWithUnlock}
//                 onUploadSupportingDoc={handleUploadSupportingDoc}
//                 uploadingSupportingDoc={isUploadingSupportingDoc}
//                 onClose={handleClose}
//                 comments={comments}
//                 isLockedBySomeoneElse={isLockedBySomeoneElse}
//                 lockedByUserName={lockedByUserName}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Add Document Modal */}
//       <AddDocumentModal
//         open={isAddDocModalOpen}
//         onClose={() => setIsAddDocModalOpen(false)}
//         onAdd={handleAddDocument}
//         categories={getAvailableCategories()}
//         title="Add New Document to Checklist"
//         showFileUpload={false}
//       />
//     </>
//   );
// };

// export default ReviewChecklistModal;
