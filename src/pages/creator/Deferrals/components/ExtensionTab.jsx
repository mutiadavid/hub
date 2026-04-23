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
}) => {
  return (
    <>
      {extensionModalOpen && selectedExtension && (
        <ExtensionApprovalModal
          extension={selectedExtension}
          open={extensionModalOpen}
          embedded
          onApprove={onApprove}
          onClose={onModalClose}
        />
      )}
    </>
  );
};

export default ExtensionTab;