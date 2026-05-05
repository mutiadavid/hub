import React from "react";
import { Card } from "antd";
import ApproverSelector from "../../../../components/deferrals/ApproverSelector";
import "../../../../styles/creatorDesignSystem.css";

export default function ApproverSidebar({
  approverSlots,
  updateApprover,
  addApprover,
  removeApprover,
  onSubmitDeferral,
  isSubmitting,
  currentUser,
  selectedDocuments,
  loanAmount,
  onCancel,
}) {
  return (
    <>
      <style>{`
        .deferral-form-approver-card.ant-card {
          height: calc(100vh - 48px);
          position: sticky;
          top: 24px;
          border-radius: 10px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06) !important;
          overflow: hidden;
        }
        .deferral-form-approver-card .ant-card-body {
          padding: 16px 12px !important;
          background: linear-gradient(180deg, rgba(245, 247, 244, 0.4) 0%, rgba(255, 255, 255, 0.98) 100%);
        }
      `}</style>
    <Card className="deferral-form-approver-card">
      <ApproverSelector
        slots={approverSlots}
        updateApprover={updateApprover}
        addApprover={addApprover}
        removeApprover={removeApprover}
        onSubmitDeferral={onSubmitDeferral}
        isSubmitting={isSubmitting}
        currentUser={currentUser}
        selectedDocuments={selectedDocuments}
        loanAmount={loanAmount}
        onCancel={onCancel}
      />
    </Card>
    </>
  );
}