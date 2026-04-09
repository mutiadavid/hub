import { useCallback, useState } from "react";
import { computeDefaultRoles } from "../utils/helpers";

/**
 * Custom hook to manage approver slots and logic
 */
export const useApprovers = (selectedDocuments, loanAmount) => {
  const [approvers, setApprovers] = useState([""]);
  const [approverSlots, setApproverSlots] = useState([]);
  const [approverCustomized, setApproverCustomized] = useState(false);

  // Update approver slots when documents or loan amount changes
  const updateApproverSlots = useCallback(() => {
    const defaultRoles = computeDefaultRoles(selectedDocuments, loanAmount);
    if (defaultRoles.length === 0) {
      setApproverSlots((prevSlots) => (prevSlots.length === 0 ? prevSlots : []));
      return;
    }

    setApproverSlots((prevSlots) => {
      const nextSlots = defaultRoles.map((role, index) => {
        const existingSlot = prevSlots[index];
        return {
          role,
          userId: existingSlot?.userId || "",
          isCustom: existingSlot?.isCustom || false,
        };
      });

      const unchanged =
        prevSlots.length === nextSlots.length &&
        prevSlots.every((slot, index) => {
          const nextSlot = nextSlots[index];
          return (
            slot?.role === nextSlot.role &&
            slot?.userId === nextSlot.userId &&
            slot?.isCustom === nextSlot.isCustom
          );
        });

      return unchanged ? prevSlots : nextSlots;
    });
  }, [loanAmount, selectedDocuments]);

  const addApprover = (insertIndex, role) => {
    setApproverCustomized(true);
    const next = [...approverSlots];
    const slot = { role: role || "Approver", userId: "", isCustom: true };

    if (typeof insertIndex === "number" && Number.isFinite(insertIndex)) {
      const clampedIndex = Math.max(1, Math.min(insertIndex, next.length - 1));
      next.splice(clampedIndex, 0, slot);
      setApproverSlots(next);
      return;
    }

    setApproverSlots([...approverSlots, slot]);
  };

  const updateApprover = (index, userId, role) => {
    setApproverCustomized(true);
    const arr = [...approverSlots];
    arr[index] = {
      ...arr[index],
      userId,
      ...(role ? { role } : {}),
    };
    setApproverSlots(arr);
  };

  const removeApprover = (index) => {
    setApproverCustomized(true);
    setApproverSlots(approverSlots.filter((_, i) => i !== index));
  };

  return {
    approvers,
    setApprovers,
    approverSlots,
    setApproverSlots,
    approverCustomized,
    setApproverCustomized,
    updateApproverSlots,
    addApprover,
    updateApprover,
    removeApprover,
  };
};
