import React from "react";

import MyQueueExtensionApplicationModal from "../../pages/approver/MyQueue/components/ExtensionApplicationModal";

const ExtensionApprovalModal = ({
  extension,
  open = false,
  onClose,
  onApprove,
  onReject,
  loading = false,
}) => {
  if (!open || !extension) {
    return null;
  }

  return (
    <MyQueueExtensionApplicationModal
      selectedExtension={extension}
      open={open}
      onClose={onClose}
      onApprove={(comment) => onApprove?.(extension?._id || extension?.id, comment)}
      onReject={(reason) => onReject?.(extension?._id || extension?.id, reason)}
      approveLoading={loading}
      rejectLoading={loading}
      showActions
    />
  );
};

export default ExtensionApprovalModal;