/**
 * Shared modal component for adding new documents to a checklist
 * Used by RmReviewChecklistModal, ReviewChecklistModal, and CheckerReviewChecklistModal
 */
import React, { useState } from "react";
import { Modal, Input, Select, Button, Space, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { MAX_FILE_UPLOAD_SIZE_MB, THEME } from "../../utils/checklistUtils";
import "../../styles/creatorDesignSystem.css";

const { Option } = Select;

/**
 * AddDocumentModal - Modal for adding new documents to a checklist
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onAdd - Callback when document is added
 * @param {Array<string>} props.categories - Available categories
 * @param {boolean} props.showFileUpload - Whether to show file upload option (default: false)
 * @param {Function} props.onFileUpload - Callback for file upload
 * @param {string} props.title - Modal title (default: "Add New Document")
 */
const AddDocumentModal = ({
  open,
  onClose,
  onAdd,
  categories = [],
  showFileUpload = false,
  title = "Add New Document",
}) => {
  const [docName, setDocName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fileList, setFileList] = useState([]);

  const handleSubmit = () => {
    if (!docName.trim()) {
      return message.error("Please enter a document name");
    }
    if (!selectedCategory) {
      return message.error("Please select a category");
    }

    const newDoc = {
      name: docName.trim(),
      category: selectedCategory,
      status: "pending",
      comment: "",
      fileUrl: null,
      isNew: true,
    };

    // If file was selected, include it
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj || fileList[0];
      newDoc.file = file;
      newDoc.localPreviewUrl = URL.createObjectURL(file);
    }

    onAdd(newDoc);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setDocName("");
    setSelectedCategory(null);
    setFileList([]);
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const uploadProps = {
    beforeUpload: (file) => {
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        message.error("You can only upload PDF, JPEG, or PNG files!");
        return Upload.LIST_IGNORE;
      }
      if (file.size > MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024) {
        message.error(`File must be smaller than ${MAX_FILE_UPLOAD_SIZE_MB}MB!`);
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto-upload
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList.slice(-1)); // Only keep latest file
    },
    fileList,
    maxCount: 1,
  };

  const customCss = `
    .checklist-add-document-modal.ant-modal .ant-modal-content {
      border-radius: 16px !important;
      overflow: hidden !important;
      padding: 0 !important;
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      box-shadow: 0 24px 48px rgba(26, 54, 54, 0.16) !important;
      background: var(--color-white) !important;
    }

    .checklist-add-document-modal .ant-modal-header {
      background: #fff !important;
      padding: 18px 22px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      border-radius: 16px 16px 0 0 !important;
      margin: 0 !important;
    }

    .checklist-add-document-modal .ant-modal-title {
      color: var(--color-text-dark) !important;
      font-size: 16px !important;
      font-weight: 700 !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }

    .checklist-add-document-modal .ant-modal-close {
      top: 16px !important;
      right: 16px !important;
      inset-inline-end: 16px !important;
      color: var(--color-text-medium) !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
    }

    .checklist-add-document-modal .ant-modal-close:hover {
      background: rgba(64, 83, 76, 0.06) !important;
      border-radius: 8px !important;
    }

    .checklist-add-document-modal .ant-modal-close-x {
      color: var(--color-text-medium) !important;
      font-size: 18px !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .checklist-add-document-modal .ant-modal-body {
      padding: 22px !important;
      background: var(--color-white) !important;
    }

    .checklist-add-document-modal .ant-modal-footer {
      border-top: 1px solid rgba(214, 189, 152, 0.2) !important;
      padding: 16px 22px 18px !important;
      margin: 0 !important;
      background: #fff !important;
    }

    .checklist-add-document-modal__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(64, 83, 76, 0.06);
      color: var(--color-text-dark);
      font-size: 14px;
    }

    .checklist-add-document-modal__content {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .checklist-add-document-modal__field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checklist-add-document-modal__label {
      display: block;
      color: var(--color-text-dark);
      font-size: 13px;
      font-weight: 700;
    }

    .checklist-add-document-modal__required {
      color: #dc2626;
    }

    .checklist-add-document-modal__field .ant-input,
    .checklist-add-document-modal__field .ant-select-selector,
    .checklist-add-document-modal__upload-btn.ant-btn {
      min-height: 42px !important;
      border-radius: 10px !important;
      box-shadow: none !important;
    }

    .checklist-add-document-modal__field .ant-input,
    .checklist-add-document-modal__field .ant-select-selector {
      border-color: rgba(214, 189, 152, 0.22) !important;
      color: var(--color-text-dark) !important;
    }

    .checklist-add-document-modal__field .ant-input:hover,
    .checklist-add-document-modal__field .ant-select-selector:hover,
    .checklist-add-document-modal__field .ant-input:focus,
    .checklist-add-document-modal__field .ant-input-focused,
    .checklist-add-document-modal__field .ant-select-focused .ant-select-selector {
      border-color: rgba(64, 83, 76, 0.26) !important;
      box-shadow: 0 0 0 3px rgba(214, 189, 152, 0.12) !important;
    }

    .checklist-add-document-modal__field .ant-select-selection-placeholder,
    .checklist-add-document-modal__field .ant-input::placeholder {
      color: #94a3b8 !important;
    }

    .checklist-add-document-modal__upload-wrap {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
      border: 1px dashed rgba(214, 189, 152, 0.45);
      border-radius: 12px;
      background: #fff;
    }

    .checklist-add-document-modal__upload-btn.ant-btn,
    .checklist-add-document-modal__secondary-btn.ant-btn {
      border: 1px solid rgba(214, 189, 152, 0.28) !important;
      background: var(--color-white) !important;
      color: var(--color-text-medium) !important;
      font-weight: 600 !important;
    }

    .checklist-add-document-modal__upload-btn.ant-btn:hover,
    .checklist-add-document-modal__upload-btn.ant-btn:focus,
    .checklist-add-document-modal__secondary-btn.ant-btn:hover,
    .checklist-add-document-modal__secondary-btn.ant-btn:focus {
      border-color: rgba(64, 83, 76, 0.24) !important;
      background: rgba(214, 189, 152, 0.1) !important;
      color: var(--color-text-dark) !important;
    }

    .checklist-add-document-modal__primary-btn.ant-btn {
      border: none !important;
      background: var(--ncb-primary-500) !important;
      color: var(--color-white) !important;
      font-weight: 600 !important;
      border-radius: 10px !important;
      box-shadow: none !important;
      min-height: 42px !important;
    }

    .checklist-add-document-modal__primary-btn.ant-btn:hover,
    .checklist-add-document-modal__primary-btn.ant-btn:focus {
      background: var(--ncb-primary-700) !important;
      color: var(--color-white) !important;
      box-shadow: none !important;
    }

    .checklist-add-document-modal__helper {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }

    .checklist-add-document-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      width: 100%;
    }

    @media (max-width: 640px) {
      .checklist-add-document-modal {
        max-width: calc(100vw - 24px) !important;
        margin: 0 auto;
      }

      .checklist-add-document-modal .ant-modal-header,
      .checklist-add-document-modal .ant-modal-body,
      .checklist-add-document-modal .ant-modal-footer {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }

      .checklist-add-document-modal__footer {
        flex-direction: column-reverse;
      }

      .checklist-add-document-modal__footer .ant-btn,
      .checklist-add-document-modal__upload-btn.ant-btn {
        width: 100%;
      }
    }
  `;

  return (
    <>
      <style>{customCss}</style>
      <Modal
        className="checklist-add-document-modal"
        title={
          <span>
            <span className="checklist-add-document-modal__icon">
              <PlusOutlined />
            </span>
            <span>{title}</span>
          </span>
        }
        open={open}
        onCancel={handleCancel}
        footer={
          <Space className="checklist-add-document-modal__footer">
            <Button
              className="checklist-add-document-modal__secondary-btn"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="checklist-add-document-modal__primary-btn"
              onClick={handleSubmit}
              icon={<PlusOutlined />}
            >
              Add Document
            </Button>
          </Space>
        }
        width={520}
        destroyOnClose
        closeIcon={<span style={{ fontSize: "18px" }}>✕</span>}
      >
        <div className="checklist-add-document-modal__content">
          {/* Document Name */}
          <div className="checklist-add-document-modal__field">
            <label className="checklist-add-document-modal__label">
              Document Name <span className="checklist-add-document-modal__required">*</span>
            </label>
            <Input
              placeholder="Enter document name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Category Selection */}
          <div className="checklist-add-document-modal__field">
            <label className="checklist-add-document-modal__label">
              Category <span className="checklist-add-document-modal__required">*</span>
            </label>
            <Select
              placeholder="Select a category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: "100%" }}
              allowClear
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
              <Option value="Other">Other</Option>
            </Select>
          </div>

          {/* File Upload (optional) */}
          {showFileUpload && (
            <div className="checklist-add-document-modal__field">
              <label className="checklist-add-document-modal__label">
                Upload File (Optional)
              </label>
              <div className="checklist-add-document-modal__upload-wrap">
                <Upload {...uploadProps}>
                  <Button
                    className="checklist-add-document-modal__upload-btn"
                    icon={<UploadOutlined />}
                  >
                    Select File
                  </Button>
                </Upload>
                <div className="checklist-add-document-modal__helper">
                Max 25MB. Allowed: PDF, JPEG, PNG
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AddDocumentModal;
