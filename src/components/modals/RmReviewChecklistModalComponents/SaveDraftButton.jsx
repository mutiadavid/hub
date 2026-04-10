import React from "react";
import { Button } from "antd";
import { message } from "antd";
import {
  buildDraftCommentTrail,
  cloneDraftRecord,
  saveDraft as saveDraftToStorage,
} from "../../../utils/draftsUtils";

const SaveDraftButton = ({
  checklist,
  docs,
  rmGeneralComment,
  supportingDocs,
  comments = [],
  currentUserName = "Current User",
  className = "",
  icon,
}) => {
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      message.loading({ content: "Saving draft...", key: "saveDraft" });

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      // Prepare draft data for localStorage
      const draftData = {
        checklistId: checklistId,
        dclNo: checklist?.dclNo,
        title: checklist?.title,
        customerName: checklist?.customerName,
        customerNumber: checklist?.customerNumber,
        loanType: checklist?.loanType,
        status: checklist?.status,
        documents: docs.map((doc) => ({
          ...cloneDraftRecord(doc),
          _id: doc._id || doc.id,
          id: doc.id || doc._id,
          deferralNo: doc.deferralNo || doc.deferralNumber || "",
          deferralNumber: doc.deferralNumber || doc.deferralNo || "",
        })),
        creatorComment: rmGeneralComment,
        rmGeneralComment,
        supportingDocs: supportingDocs.map((doc) => cloneDraftRecord(doc)),
        commentTrail: buildDraftCommentTrail({
          comments,
          currentComment: rmGeneralComment,
          currentUserName,
          role: "rm",
        }),
      };

      // Save to localStorage instead of API
      saveDraftToStorage("rm", draftData, checklistId);

      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({
        content: error?.message || "Failed to save draft",
        key: "saveDraft",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <Button
      key="save-draft"
      onClick={handleSaveDraft}
      loading={isSavingDraft}
      disabled={isSavingDraft}
      className={className}
      icon={icon}
      style={{ borderRadius: "6px", fontWeight: 600 }}
    >
      Save Draft
    </Button>
  );
};

export default SaveDraftButton;
