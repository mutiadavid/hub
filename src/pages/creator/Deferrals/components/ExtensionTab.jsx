import React from "react";
import ExtensionApprovalModal from "../../../../components/modals/ExtensionApprovalModal";

/**
 * ExtensionTab Component
 * Handles extension application reviews and approvals
 */
const ExtensionTab = ({
  extensionModalOpen,
  selectedExtension,
  onModalClose,
  onApprove,
  onReturnForRework,
  onReject,
  approveText = "Approve",
}) => {
  return (
    <>
      {extensionModalOpen && selectedExtension && (
        <ExtensionApprovalModal
          extension={selectedExtension}
          open={extensionModalOpen}
          embedded
          onApprove={onApprove}
          onReturnForRework={onReturnForRework}
          onReject={onReject}
          onClose={onModalClose}
          approveText={approveText}
        />
      )}
    </>
  );
};

export default ExtensionTab;
