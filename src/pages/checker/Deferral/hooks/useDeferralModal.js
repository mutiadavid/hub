import { useState, useEffect } from "react";

export const useDeferralModal = () => {
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [localDeferral, setLocalDeferral] = useState(null);

  // Sync local copy with selected deferral (for state updates without reload)
  useEffect(() => {
    setLocalDeferral(selectedDeferral);
  }, [selectedDeferral]);

  const openModal = (deferral) => {
    setSelectedDeferral(deferral);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDeferral(null);
    setLocalDeferral(null);
  };

  const updateLocalDeferral = (updates) => {
    setLocalDeferral((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  return {
    selectedDeferral,
    setSelectedDeferral,
    modalVisible,
    setModalVisible,
    localDeferral,
    setLocalDeferral,
    openModal,
    closeModal,
    updateLocalDeferral,
  };
};
