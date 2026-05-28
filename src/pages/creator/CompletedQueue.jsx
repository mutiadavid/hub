import React, { useState } from "react";
import { Modal } from "antd";
import ChecklistTable from "./ChecklistTable";
import ReviewChecklistPage from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistPage";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

const pageClassName = "bg-white p-4";
const titleClassName = "mb-4 text-[15px] font-bold tracking-[-0.02em] text-(--color-text-dark)";
const modalRootClassName = "[&_.ant-modal]:top-6 [&_.ant-modal]:max-w-[1400px] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-body]:max-h-[calc(125vh-80px)] [&_.ant-modal-body]:overflow-auto [&_.ant-modal-body]:p-0 [&_.ant-modal-mask]:bg-[rgba(15,23,42,0.45)]";

const CompletedQueue = ({ userId }) => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const { data: checklists = [] } = useGetAllCoCreatorChecklistsQuery();


  const completedQueue = (checklists || []).filter((c) => {
    // Determine the user ID from the checklist item (Same logic, remains robust)
    const checklistUserId =
      // Case 1: Populated Object (e.g., { _id: '123' })
      c.createdBy?._id?.toString() ||
      // Case 2: Unpopulated ID String (e.g., '123')
      c.createdBy?.toString();

    // Check 1: User ID match
    const isMatch = checklistUserId === userId?.toString();

    // Check 2: Status must be ONLY 'Approved' (Note: This is NOW case-sensitive)
    // *** ENSURE YOUR DATA USES THIS EXACT CASING, e.g., 'Approved' ***
    const isStatusValid = ["Approved"].includes(c.status);

    return isMatch && isStatusValid;
  });

  return (
    <div className={pageClassName}>
      <h2 className={titleClassName}>Completed Checklists</h2>
      <ChecklistTable data={completedQueue} onView={setSelectedChecklist} showTat />

      {selectedChecklist && (
        <Modal
          open={!!selectedChecklist}
          onCancel={() => setSelectedChecklist(null)}
          footer={null}
          closable={false}
          width="92vw"
          rootClassName={modalRootClassName}
          destroyOnHidden
        >
          <ReviewChecklistPage
            checklistId={selectedChecklist?.id || selectedChecklist?._id}
            initialChecklist={selectedChecklist}
            onClose={() => setSelectedChecklist(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default CompletedQueue;
