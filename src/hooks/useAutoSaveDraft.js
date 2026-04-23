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
  const latestFormDataRef = useRef(formData);
  const hasSavedOnEnableRef = useRef(false);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    savedDraftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    if (!enabled || !type || !latestFormDataRef.current) {
      hasSavedOnEnableRef.current = false;
      return;
    }

    const saveCurrentDraft = () => {
      const currentFormData = latestFormDataRef.current;
      if (!currentFormData || Object.keys(currentFormData).length === 0) {
        return null;
      }

      const saved = saveDraft(type, currentFormData, savedDraftIdRef.current);
      if (saved) {
        savedDraftIdRef.current = saved.id;
        lastSavedRef.current = saved.updatedAt;
      }
      return saved;
    };

    if (!hasSavedOnEnableRef.current) {
      saveCurrentDraft();
      hasSavedOnEnableRef.current = true;
    }

    const intervalId = setInterval(() => {
      saveCurrentDraft();
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [type, interval, enabled]);

  return {
    draftId: savedDraftIdRef.current,
    lastSaved: lastSavedRef.current,
  };
};

export default useAutoSaveDraft;
