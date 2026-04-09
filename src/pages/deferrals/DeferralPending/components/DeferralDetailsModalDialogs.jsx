import React from "react";
import CloseRequestModal from "./CloseRequestModal";
import ExtensionApplicationModal from "./ExtensionApplicationModal";
import ReturnForReworkModal from "./ReturnForReworkModal";
import RMEditApproversModal from "./RMEditApproversModal";
import RMWithdrawModal from "./RMWithdrawModal";

const DeferralDetailsModalDialogs = ({
  withdrawModalProps,
  editApproversModalProps,
  returnForReworkModalProps,
  extensionModalProps,
  closeRequestModalProps,
}) => (
  <>
    <RMWithdrawModal {...withdrawModalProps} />
    <RMEditApproversModal {...editApproversModalProps} />
    <ReturnForReworkModal {...returnForReworkModalProps} />
    <ExtensionApplicationModal {...extensionModalProps} />
    <CloseRequestModal {...closeRequestModalProps} />
  </>
);

export default DeferralDetailsModalDialogs;
