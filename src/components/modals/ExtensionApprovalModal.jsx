import React from "react";

import MyQueueExtensionApplicationModal from "../../pages/approver/MyQueue/components/ExtensionApplicationModal";

const ExtensionApprovalModal = ({
  extension,
  open = false,
  onClose,
  onApprove,
  onReject,
  onReturnForRework,
  loading = false,
}) => {
  if (!open || !extension) {
    return null;
  }

  return (
    <MyQueueExtensionApplicationModal
      selectedExtension={extension}
      open={open}
      noHeaderGradient
      onClose={onClose}
      onApprove={(comment) => onApprove?.(extension?._id || extension?.id, comment)}
      onReject={(reason) => onReject?.(extension?._id || extension?.id, reason)}
      onReturnForRework={(reason) => onReturnForRework?.(extension?._id || extension?.id, reason)}
      approveLoading={loading}
      rejectLoading={loading}
      reworkLoading={loading}
      showActions
    />
  );
};

export default ExtensionApprovalModal;