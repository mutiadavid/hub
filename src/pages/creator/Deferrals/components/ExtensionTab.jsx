import React from "react";
import ExtensionApprovalModal from "../../../../components/modals/ExtensionApprovalModal";

/**
 * ExtensionTab Component
 * Handles extension application reviews and approvals
 */
const ExtensionTab = ({
  extensionsLoading,
  extensionModalOpen,
  selectedExtension,
  onModalClose,
  onApprove,
  onReject,
}) => {
  return (
    <>
      {extensionModalOpen && selectedExtension && (
        <ExtensionApprovalModal
          extension={selectedExtension}
          open={extensionModalOpen}
          embedded
          onApprove={onApprove}
          onReject={onReject}
          onClose={onModalClose}
        />
      )}
    </>
  );
};

export default ExtensionTab;
