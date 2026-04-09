import { useState, useCallback } from "react";

/**
 * Custom hook for managing deferral modal state
 * @returns {object} Modal state and control functions
 */
export const useDeferralModal = () => {
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOverrides, setDetailOverrides] = useState(null);

  const openModal = useCallback((deferral) => {
    setSelectedDeferral(deferral);
    setDetailOverrides(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedDeferral(null);
    setDetailOverrides(null);
  }, []);

  return {
    selectedDeferral,
    setSelectedDeferral,
    modalOpen,
    setModalOpen,
    detailOverrides,
    setDetailOverrides,
    openModal,
    closeModal,
  };
};
