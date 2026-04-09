/**
 * Custom hook for managing checklist draft saving
 * Provides save draft functionality with auto-save option
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { message } from "antd";
import { useSaveChecklistDraftMutation } from "../api/checklistApi";
import { nestDocuments } from "../utils/checklistUtils";

/**
 * Hook for handling checklist draft saving
 * @param {Object} options - Hook options
 * @param {string} options.checklistId - The checklist ID
 * @param {boolean} options.autoSave - Enable auto-save (default: false)
 * @param {number} options.autoSaveIntervalMs - Auto-save interval in ms (default: 60000)
 * @returns {Object} Draft methods and state
 */
export const useChecklistDraft = ({
    checklistId,
    autoSave = false,
    autoSaveIntervalMs = 60000,
} = {}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const autoSaveRef = useRef(null);

    // RTK Query mutation
    const [saveChecklistDraft, { isLoading: isMutationLoading }] = useSaveChecklistDraftMutation();

    /**
     * Save draft to backend
     * @param {Object} draftData - Draft data to save
     * @param {string} draftData.checklistId - Checklist ID
     * @param {Array} draftData.documents - Documents array (flat)
     * @param {string} draftData.comment - Role-specific comment
     * @param {string} draftData.role - User role (rm|creator|checker)
     * @param {number} draftData.expiryHours - Draft expiry in hours (default: 24)
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    const saveDraft = useCallback(
        async (draftData) => {
            const {
                checklistId: id,
                documents = [],
                rmGeneralComment,
                creatorComment,
                checkerComment,
                role = "creator",
                expiryHours = 24,
            } = draftData;

            if (!id) {
                message.error("Checklist ID is required to save draft");
                return { success: false, error: "Checklist ID required" };
            }

            setIsSaving(true);

            try {
                // Build payload based on role
                const payload = {
                    checklistId: id,
                    isDraft: true,
                    draftExpiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
                    documents: documents.map((d) => ({
                        _id: d._id,
                        name: d.name,
                        category: d.category,
                        status: d.action || d.status,
                        rmStatus: d.rmStatus,
                        checkerStatus: d.checkerStatus || d.finalCheckerStatus,
                        finalCheckerStatus: d.checkerStatus || d.finalCheckerStatus,
                        comment: d.comment,
                        deferralReason: d.deferralReason,
                        deferralNumber: d.deferralNumber,
                        expiryDate: d.expiryDate,
                        fileUrl: d.fileUrl,
                        isNew: d.isNew,
                    })),
                };

                // Add role-specific comments
                if (rmGeneralComment !== undefined) payload.rmGeneralComment = rmGeneralComment;
                if (creatorComment !== undefined) payload.creatorComment = creatorComment;
                if (checkerComment !== undefined) payload.checkerComment = checkerComment;

                await saveChecklistDraft(payload).unwrap();

                setLastSaved(new Date());
                setHasUnsavedChanges(false);
                message.success("Draft saved successfully");

                return { success: true };
            } catch (error) {
                console.error("Save draft error:", error);
                message.error(error?.data?.error || "Failed to save draft");
                return { success: false, error: error?.data?.error || error.message };
            } finally {
                setIsSaving(false);
            }
        },
        [saveChecklistDraft]
    );

    /**
     * Mark that there are unsaved changes
     */
    const markUnsaved = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    /**
     * Clear unsaved changes flag
     */
    const clearUnsaved = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    // Auto-save effect
    useEffect(() => {
        if (autoSave && checklistId && hasUnsavedChanges) {
            autoSaveRef.current = setInterval(() => {
                // This would need access to current draft data
                // For now, just log that auto-save would trigger
                console.log("Auto-save would trigger here");
            }, autoSaveIntervalMs);
        }

        return () => {
            if (autoSaveRef.current) {
                clearInterval(autoSaveRef.current);
            }
        };
    }, [autoSave, checklistId, hasUnsavedChanges, autoSaveIntervalMs]);

    // Warn on unsaved changes before leaving
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    return {
        saveDraft,
        isSaving: isSaving || isMutationLoading,
        lastSaved,
        hasUnsavedChanges,
        markUnsaved,
        clearUnsaved,
    };
};

export default useChecklistDraft;
