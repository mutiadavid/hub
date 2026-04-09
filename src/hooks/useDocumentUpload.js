/**
 * Custom hook for managing document uploads in checklist modals
 * Provides file upload functionality with progress tracking and validation
 */
import { useState, useCallback } from "react";
import { message } from "antd";
import { API_BASE_URL, isValidFileType, isValidFileSize } from "../utils/checklistUtils";

/**
 * Hook for handling document file uploads
 * @param {string} checklistId - The checklist ID to associate uploads with
 * @returns {Object} Upload methods and state
 */
export const useDocumentUpload = (checklistId) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Upload a file to the backend
     * @param {File} file - The file to upload
     * @param {string} documentName - The document name
     * @param {string} category - The document category
     * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
     */
    const uploadDocument = useCallback(
        async (file, documentName, category) => {
            if (!file) {
                return { success: false, error: "No file selected" };
            }

            // Validate file type
            if (!isValidFileType(file)) {
                message.error("Invalid file type. Allowed: PDF, JPEG, PNG");
                return { success: false, error: "Invalid file type" };
            }

            // Validate file size (max 10MB)
            if (!isValidFileSize(file, 10)) {
                message.error("File size exceeds 10MB limit");
                return { success: false, error: "File too large" };
            }

            setIsUploading(true);
            setUploadProgress(0);

            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("checklistId", checklistId);
                formData.append("documentName", documentName || file.name);
                formData.append("category", category || "Other");

                const token = localStorage.getItem("token");

                const response = await fetch(`${API_BASE_URL}/api/uploads`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                const data = await response.json();
                setUploadProgress(100);
                message.success(`File "${file.name}" uploaded successfully`);

                return {
                    success: true,
                    data: {
                        fileUrl: data.fileUrl || data.url,
                        fileName: data.fileName || file.name,
                        uploadId: data._id || data.id,
                        uploadDate: new Date().toISOString(),
                        uploadedBy: data.uploadedBy,
                    },
                };
            } catch (error) {
                console.error("Upload error:", error);
                message.error(error.message || "Failed to upload file");
                return { success: false, error: error.message };
            } finally {
                setIsUploading(false);
            }
        },
        [checklistId]
    );

    /**
     * Create a local preview URL for a file (client-side only)
     * @param {File} file - The file to preview
     * @returns {string} Blob URL for preview
     */
    const createLocalPreview = useCallback((file) => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, []);

    /**
     * Delete an uploaded file
     * @param {string} uploadId - The upload ID to delete
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    const deleteUpload = useCallback(
        async (uploadId) => {
            if (!uploadId) {
                return { success: false, error: "No upload ID provided" };
            }

            try {
                const token = localStorage.getItem("token");

                const response = await fetch(`${API_BASE_URL}/api/uploads/${uploadId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Delete failed");
                }

                message.success("File deleted successfully");
                return { success: true };
            } catch (error) {
                console.error("Delete error:", error);
                message.error(error.message || "Failed to delete file");
                return { success: false, error: error.message };
            }
        },
        []
    );

    /**
     * Handle file change from Upload component (for direct use with Ant Design Upload)
     * @param {Object} info - Upload info from Ant Design
     * @param {Function} onSuccess - Callback on successful upload
     */
    const handleFileChange = useCallback(
        async (info, onSuccess) => {
            const { file } = info;
            if (file.status === "uploading") {
                return;
            }

            // For direct file handling
            const result = await uploadDocument(file.originFileObj || file);
            if (result.success && onSuccess) {
                onSuccess(result.data);
            }
        },
        [uploadDocument]
    );

    return {
        uploadDocument,
        createLocalPreview,
        deleteUpload,
        handleFileChange,
        isUploading,
        uploadProgress,
    };
};

export default useDocumentUpload;
