import React, { useState } from "react";
import { Modal } from "antd";
import ChecklistTable from "./ChecklistTable";
import ReviewChecklistPage from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistPage";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

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
  console.log(completedQueue);
  console.log(
    "Status Values:",
    (checklists || []).map((c) => c.status)
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>Completed Checklists</h2>
      <ChecklistTable data={completedQueue} onView={setSelectedChecklist} />

      {selectedChecklist && (
        <Modal
          open={!!selectedChecklist}
          onCancel={() => setSelectedChecklist(null)}
          footer={null}
          closable={false}
          width="92vw"
          style={{ top: 24, maxWidth: 1400 }}
          styles={{
            body: { padding: 0, maxHeight: "calc(100vh - 80px)", overflow: "auto" },
            content: { padding: 0, borderRadius: 16, overflow: "hidden" },
            mask: { backgroundColor: "rgba(15, 23, 42, 0.45)" },
          }}
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
