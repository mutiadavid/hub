import { useEffect, useRef } from "react";
import { saveDraft } from "../utils/draftsUtils";

/**
 * Auto-save hook for form drafts
 * Automatically saves form data to localStorage every few seconds
 *
 * @param {string} type - Draft type (e.g., 'cocreator', 'rm', 'checker')
 * @param {object} formData - The form data to save
 * @param {number} interval - Save interval in milliseconds (default: 5000ms)
 * @param {string} draftId - Optional existing draft ID to update
 * @param {boolean} enabled - Whether auto-save is enabled
 * @returns {object} { draftId, lastSaved }
 */
export const useAutoSaveDraft = ({
  type,
  formData,
  interval = 5000,
  draftId = null,
  enabled = true,
}) => {
  const savedDraftIdRef = useRef(draftId);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (!enabled || !type || !formData) {
      return;
    }

    // Save immediately when draftId changes or on mount
    if (formData && Object.keys(formData).length > 0) {
      const saved = saveDraft(type, formData, savedDraftIdRef.current);
      if (saved) {
        savedDraftIdRef.current = saved.id;
        lastSavedRef.current = saved.updatedAt;
      }
    }

    // Set up auto-save interval
    const intervalId = setInterval(() => {
      if (formData && Object.keys(formData).length > 0) {
        const saved = saveDraft(type, formData, savedDraftIdRef.current);
        if (saved) {
          savedDraftIdRef.current = saved.id;
          lastSavedRef.current = saved.updatedAt;
          console.log('📝 Auto-saved draft:', saved.id);
        }
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [type, formData, interval, enabled]);

  return {
    draftId: savedDraftIdRef.current,
    lastSaved: lastSavedRef.current,
  };
};

export default useAutoSaveDraft;
