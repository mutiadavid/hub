import React from "react";
import CreatorCompletedChecklistPage from "./CreatorCompletedChecklistPage";

const CreatorCompletedChecklistModal = ({
	checklist,
	open,
	embedded = false,
	onClose,
	readOnly = false,
}) => {
	if (!embedded && !open) {
		return null;
	}

	return (
		<CreatorCompletedChecklistPage
			checklistId={checklist?.id || checklist?._id}
			initialChecklist={checklist}
			onClose={onClose}
			readOnly={readOnly}
		/>
	);
};

export default CreatorCompletedChecklistModal;

// import React from "react";
// import { Button, Spin } from "antd";
// import {
//   RedoOutlined,
//   UnorderedListOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
// import ReviveConfirmationModal from "./ReviveConfirmationModal";
// import ChecklistInfoCard from "./ChecklistInfoCard";
// import ProgressStatsSection from "./ProgressStatsSection";
// import DocumentsTable from "./DocumentsTable";
// import CommentHistorySection from "./CommentHistorySection";
// import DocumentSidebarComponent from "../CompletedChecklistModalComponents/DocumentSidebarComponent";
// import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
// import { useReviveChecklist } from "./hooks/useReviveChecklist";
// import PDFGenerator from "./PDFGenerator";
// import "../../../styles/creatorDesignSystem.css";

// const CreatorCompletedChecklistModal = ({
//   checklist,
//   open,
//   onClose,
//   onRevive,
//   onRefreshData,
//   readOnly = false,
//   embedded = false,
// }) => {
//   // Get documents using custom hook
//   const { docs } = useChecklistDocuments(checklist);
//   const [showDocumentSidebar, setShowDocumentSidebar] = React.useState(false);
//   const [supportingDocs, setSupportingDocs] = React.useState([]);
//   const [activeTab, setActiveTab] = React.useState("documents");

//   React.useEffect(() => {
//     if (open) {
//       setActiveTab("documents");
//       return;
//     }

//     setShowDocumentSidebar(false);
//   }, [open, checklist?.id, checklist?._id]);

//   // Fetch supporting docs from backend when modal opens or checklist changes
//   React.useEffect(() => {
//     const checklistId = checklist?.id || checklist?._id;

//     if (!checklistId || !open) return;

//     const fetchSupportingDocs = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const response = await fetch(
//           `http://localhost:5000/api/uploads/checklist/${checklistId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           },
//         );

//         if (response.ok) {
//           const result = await response.json();
//           console.log("📄 Supporting docs API response:", result);
//           if (
//             result.data &&
//             Array.isArray(result.data) &&
//             result.data.length > 0
//           ) {
//             // Add category and isSupporting flag for proper sidebar grouping
//             const docsWithCategory = result.data.map((doc) => ({
//               ...doc,
//               category: "Supporting Documents",
//               isSupporting: true,
//             }));
//             setSupportingDocs(docsWithCategory);
//             console.log(
//               "📄 Supporting docs fetched successfully (",
//               docsWithCategory.length,
//               " docs)",
//             );
//           } else {
//             console.log(
//               "✓ API returned ok but no supporting docs for checklist",
//               checklistId,
//             );
//             setSupportingDocs([]);
//           }
//         } else {
//           console.warn(
//             `⚠️ API returned ${response.status} for checklist ${checklistId}:`,
//             await response.text(),
//           );
//           // Don't clear existing docs on error - keep what we have
//         }
//       } catch (error) {
//         console.error("❌ Error fetching supporting docs:", error.message);
//         // Don't clear existing docs on error - supporting docs are optional
//       }
//     };

//     // Always fetch from API
//     fetchSupportingDocs();
//   }, [checklist?.id, checklist?._id, open]);

//   // Use custom hooks
//   const {
//     isReviving,
//     showReviveConfirm,
//     handleReviveChecklist,
//     handleConfirmRevive,
//     handleCancelRevive,
//   } = useReviveChecklist(checklist, onRevive, onRefreshData, onClose);

//   // Get comments
//   const { data: comments, isLoading: commentsLoading } =
//     useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
//       skip: !checklist?.id && !checklist?._id,
//     });

//   // DEBUG: Log comment fetching
//   React.useEffect(() => {
//     const checklistId = checklist?.id || checklist?._id;
//     console.log(
//       "👤 CreatorCompletedChecklistModal - Checklist ID for comments:",
//       checklistId,
//     );
//     console.log("👤 Comments Loading:", commentsLoading);
//     console.log("👤 Comments Data:", comments);
//     if (comments && Array.isArray(comments)) {
//       console.log(`👤 Total comments fetched: ${comments.length}`);
//     }
//   }, [checklist?.id, checklist?._id, comments, commentsLoading]);

//   const safeDocs = React.useMemo(() => (Array.isArray(docs) ? docs : []), [docs]);
//   const preparedChecklist = React.useMemo(
//     () => ({
//       ...checklist,
//       bankName: checklist?.bankName || "NCBA BANK KENYA PLC",
//       bankInitials: checklist?.bankInitials || "NCBA",
//       dclNo: checklist?.dclNo || "N/A",
//       ibpsNo: checklist?.ibpsNo || "Not provided",
//       loanType: checklist?.loanType || "N/A",
//       customerNumber: checklist?.customerNumber || "N/A",
//       customerName: checklist?.customerName || checklist?.customerNumber || "N/A",
//       createdBy: checklist?.createdBy || { name: "N/A" },
//       assignedToRM: checklist?.assignedToRM || { name: "N/A" },
//       assignedToCoChecker: checklist?.assignedToCoChecker || { name: "Pending" },
//       status: checklist?.status || "completed",
//       createdAt: checklist?.createdAt || new Date().toISOString(),
//       completedAt: checklist?.completedAt || checklist?.updatedAt || new Date().toISOString(),
//       segment: checklist?.segment || "Corporate",
//       branch: checklist?.branch || "Head Office",
//     }),
//     [checklist],
//   );

//   const handleReviveClick = () => {
//     console.log("🚀 [CreatorCompletedChecklistModal] Revive button clicked!");
//     console.log("📋 Checklist ID:", checklist?._id || checklist?.id);
//     console.log("📋 readOnly:", readOnly);
//     handleReviveChecklist();
//   };

//   const renderFooter = () => {
//     // Always show revive button for completed/approved checklists, regardless of readOnly
//     const checklistStatus = checklist?.status?.toLowerCase() || "";
//     const isCompletedOrApproved =
//       checklistStatus === "approved" ||
//       checklistStatus === "completed" ||
//       checklistStatus === "approvedandcompleted";

//     return (
//       <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", width: "100%", flexWrap: "wrap" }}>
//         <Button
//           key="close"
//           className="creator-completed-action-button creator-completed-action-button--secondary"
//           onClick={onClose}
//         >
//           Close
//         </Button>
//         {isCompletedOrApproved && (
//           <Button
//             key="revive"
//             className="creator-completed-action-button"
//             icon={<RedoOutlined />}
//             loading={isReviving}
//             disabled={isReviving}
//             onClick={handleReviveClick}
//           >
//             Revive Checklist
//           </Button>
//         )}
//         <PDFGenerator
//           checklist={preparedChecklist}
//           docs={safeDocs}
//           supportingDocs={supportingDocs}
//           creatorComment={checklist?.creatorComment || ""}
//           comments={comments || []}
//         />
//       </div>
//     );
//   };

//   return (
//     <>
//       <style>{`
//         .creator-completed-modal-overlay {
//           position: fixed;
//           top: 65px;
//           left: var(--sidebar-width, 150px);
//           right: 0;
//           bottom: 0;
//           background: rgba(0, 0, 0, 0.36);
//           backdrop-filter: blur(4px);
//           display: flex;
//           align-items: flex-start;
//           justify-content: center;
//           z-index: 990;
//           overflow-y: auto;
//           padding-top: 20px;
//           padding-bottom: 20px;
//           transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
//         }
        
//         .creator-completed-modal-container {
//           background: var(--color-bg);
//           border-radius: 12px;
//           overflow: visible;
//           width: 1200px;
//           max-width: calc(100vw - 310px);
//           max-height: calc(125vh - 130px);
//           box-shadow: 0 12px 32px rgba(26, 54, 54, 0.14);
//           border: 1px solid rgba(214, 189, 152, 0.2);
//           margin: 0 auto;
//           position: relative;
//           z-index: 1001;
//           display: flex;
//           flex-direction: column;
//         }
//         .creator-completed-modal-header {
//           padding: 20px 20px 0;
//           display: flex;
//           align-items: flex-start;
//           justify-content: space-between;
//           gap: 12px;
//           flex-wrap: wrap;
//           width: 100%;
//         }
//         .creator-completed-modal-header-main {
//           display: flex;
//           flex-direction: column;
//           gap: 4px;
//         }
//         .creator-completed-modal-title {
//           margin: 0;
//           font-size: 18px;
//           font-weight: 700;
//           letter-spacing: -0.02em;
//           color: var(--color-text-dark);
//         }
//         .creator-completed-modal-subtitle {
//           margin: 0;
//           font-size: 12px;
//           color: var(--color-text-light);
//         }
//         .creator-completed-modal-header-actions {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .creator-completed-viewdocs {
//           display: inline-flex !important;
//           align-items: center !important;
//           gap: 8px !important;
//           padding: 8px 12px !important;
//           border-radius: 6px !important;
//           border: 1px solid rgba(214, 189, 152, 0.2) !important;
//           background: var(--color-white) !important;
//           color: var(--color-text-medium) !important;
//           box-shadow: none !important;
//         }
//         .creator-completed-viewdocs-count {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           min-width: 18px;
//           height: 18px;
//           padding: 0 5px;
//           border-radius: 999px;
//           background: rgba(214, 189, 152, 0.2);
//           color: var(--color-text-dark);
//           font-size: 9px;
//           font-weight: 600;
//         }
//         .creator-completed-close-button {
//           width: 32px !important;
//           height: 32px !important;
//           border-radius: 6px !important;
//           border: none !important;
//           background: transparent !important;
//           color: var(--color-text-medium) !important;
//           box-shadow: none !important;
//         }
//         .creator-completed-close-button:hover {
//           background: rgba(214, 189, 152, 0.08) !important;
//           color: var(--color-text-dark) !important;
//         }
//         .creator-completed-close-button .anticon {
//           font-size: 16px !important;
//         }
//         .creator-completed-modal-actionbar {
//           background: var(--color-white);
//           border: 1px solid rgba(214, 189, 152, 0.2);
//           border-radius: 8px;
//           box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
//           margin: 16px 20px 0;
//         }
//         .creator-completed-modal-body {
//           padding: 12px 20px 20px;
//           overflow-y: auto;
//           flex: 1;
//         }
//         .creator-completed-modal-layout {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }
//         .creator-completed-details-layout {
//           display: grid;
//           grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
//           gap: 16px;
//           align-items: start;
//         }
//         .creator-completed-details-main {
//           min-width: 0;
//         }
//         .creator-completed-tabs {
//           display: flex;
//           gap: 4px;
//           border-bottom: 1px solid rgba(214, 189, 152, 0.2);
//           margin-bottom: 16px;
//           overflow-x: auto;
//         }
//         .creator-completed-tab {
//           padding: 6px 12px;
//           border: none;
//           border-bottom: 2px solid transparent;
//           background: transparent;
//           color: var(--color-text-light);
//           font-size: 9px;
//           font-weight: 500;
//           cursor: pointer;
//           white-space: nowrap;
//           font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
//         }
//         .creator-completed-tab--active {
//           color: var(--color-primary-dark);
//           border-bottom-color: var(--color-primary-dark);
//         }
//         .creator-completed-modal-footer {
//           padding: 12px 16px;
//           background: var(--color-white);
//           border-bottom-left-radius: 12px;
//           border-bottom-right-radius: 12px;
//         }
//         .creator-completed-action-button.ant-btn,
//         .creator-completed-action-button.ant-btn:hover,
//         .creator-completed-action-button.ant-btn:focus,
//         .creator-completed-action-button.ant-btn:active {
//           min-height: 34px !important;
//           height: 34px !important;
//           padding: 0 14px !important;
//           border-radius: 6px !important;
//           font-size: 12px !important;
//           font-weight: 600 !important;
//           display: inline-flex !important;
//           align-items: center !important;
//           justify-content: center !important;
//           gap: 6px !important;
//           background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
//           border: none !important;
//           color: #FFFFFF !important;
//           box-shadow: none !important;
//         }
//         .creator-completed-action-button--secondary.ant-btn,
//         .creator-completed-action-button--secondary.ant-btn:hover,
//         .creator-completed-action-button--secondary.ant-btn:focus,
//         .creator-completed-action-button--secondary.ant-btn:active {
//           background: transparent !important;
//           border: 1px solid rgba(214, 189, 152, 0.2) !important;
//           color: var(--color-text-medium) !important;
//         }
//         .creator-completed-action-button--secondary.ant-btn span,
//         .creator-completed-action-button--secondary.ant-btn .anticon {
//           color: inherit !important;
//         }
//         @media (min-width: 768px) and (max-width: 1099px) {
//           .creator-completed-modal-overlay {
//             left: var(--sidebar-width, 40px);
//             transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
//           }
//           .creator-completed-modal-container {
//             width: calc(100vw - 120px) !important;
//             max-width: calc(100vw - 120px) !important;
//             margin: 0 16px 0 0 !important;
//           }
//         }
        
//         @media (max-width: 767px) {
//           .creator-completed-modal-overlay {
//             left: 0;
//             padding-left: 0;
//             padding-right: 16px;
//           }
//           .creator-completed-modal-container {
//             width: calc(100vw - 32px) !important;
//             max-width: calc(100vw - 32px) !important;
//             margin: 0 16px 0 0px !important;
//           }
//         }
//         @media (max-width: 1023px) {
//           .creator-completed-details-layout {
//             grid-template-columns: 1fr;
//           }
//         }
//         @media (max-width: 767px) {
//           .creator-completed-modal-header,
//           .creator-completed-modal-body {
//             padding-left: 16px;
//             padding-right: 16px;
//           }
//           .creator-completed-modal-actionbar {
//             margin-left: 16px;
//             margin-right: 16px;
//           }
//           .creator-completed-modal-footer {
//             padding: 12px;
//           }
//         }
//       `}</style>

//       <div
//         className="creator-completed-modal-overlay"
//         style={{
//           display: open ? "flex" : "none",
//           position: embedded ? "relative" : "fixed",
//           top: embedded ? "auto" : 65,
//           left: embedded ? 0 : "var(--sidebar-width, 150px)",
//           right: embedded ? "auto" : 0,
//           bottom: embedded ? "auto" : 0,
//           width: embedded ? "100%" : "auto",
//           background: embedded ? "transparent" : "rgba(0, 0, 0, 0.36)",
//           backdropFilter: embedded ? "none" : "blur(4px)",
//           paddingTop: embedded ? 0 : 20,
//           paddingBottom: embedded ? 0 : 20,
//           overflowY: embedded ? "visible" : "auto",
//           zIndex: embedded ? "auto" : 990,
//         }}
//         onClick={embedded ? undefined : onClose}
//       >
//         {open && (
//           <div
//             className="creator-completed-modal-container"
//             style={{
//               width: embedded ? "100%" : 1200,
//               maxWidth: embedded ? "100%" : "calc(100vw - 310px)",
//               maxHeight: embedded ? "none" : "calc(125vh - 130px)",
//               borderRadius: embedded ? 16 : 12,
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="creator-completed-modal-header">
//               <div className="creator-completed-modal-header-main">
//                 <h1 className="creator-completed-modal-title">
//                   {checklist?.dclNo || checklist?.title || "Completed Checklist"}
//                 </h1>
//                 <p className="creator-completed-modal-subtitle">
//                   {checklist?.customerName || checklist?.title || "Checklist workspace"}
//                 </p>
//               </div>
//               <div className="creator-completed-modal-header-actions">
//                 <Button
//                   onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
//                   size="small"
//                   className="creator-completed-viewdocs"
//                 >
//                   <UnorderedListOutlined />
//                   View Documents
//                   <span className="creator-completed-viewdocs-count">
//                     {
//                       docs.filter(
//                         (d) => d.fileUrl || d.category === "Supporting Documents",
//                       ).length + supportingDocs.length
//                     }
//                   </span>
//                 </Button>
//                 <Button
//                   icon={<CloseOutlined />}
//                   onClick={onClose}
//                   size="small"
//                   type="text"
//                   className="creator-completed-close-button"
//                 />
//               </div>
//             </div>

//             <div className="creator-completed-modal-actionbar">
//               <div className="creator-completed-modal-footer">{renderFooter()}</div>
//             </div>

//             <div className="creator-completed-modal-body">
//               {checklist ? (
//                 <div className="creator-completed-modal-layout">
//                   <DocumentSidebarComponent
//                     documents={Array.isArray(docs) ? docs : []}
//                     supportingDocs={supportingDocs}
//                     open={showDocumentSidebar}
//                     onClose={() => setShowDocumentSidebar(false)}
//                   />

//                   <div className="creator-completed-tabs">
//                     <button
//                       type="button"
//                       className={`creator-completed-tab ${activeTab === "details" ? "creator-completed-tab--active" : ""}`}
//                       onClick={() => setActiveTab("details")}
//                     >
//                       Checklist Details
//                     </button>
//                     <button
//                       type="button"
//                       className={`creator-completed-tab ${activeTab === "documents" ? "creator-completed-tab--active" : ""}`}
//                       onClick={() => setActiveTab("documents")}
//                     >
//                       Required Documents
//                     </button>
//                   </div>

//                   {activeTab === "details" && (
//                     <div className="creator-completed-details-layout">
//                       <div className="creator-completed-details-main">
//                         <ChecklistInfoCard checklist={checklist} />
//                         <ProgressStatsSection docs={docs} />
//                       </div>
//                       <CommentHistorySection
//                         comments={comments}
//                         isLoading={commentsLoading}
//                       />
//                     </div>
//                   )}

//                   {activeTab === "documents" && (
//                     <DocumentsTable
//                       docs={Array.isArray(docs) ? docs : []}
//                       checklist={checklist}
//                     />
//                   )}
//                 </div>
//               ) : (
//                 <Spin tip="Loading checklist..." />
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       <ReviveConfirmationModal
//         open={showReviveConfirm}
//         onCancel={handleCancelRevive}
//         onConfirm={handleConfirmRevive}
//         loading={isReviving}
//       />
//     </>
//   );
// };

// export default CreatorCompletedChecklistModal;
