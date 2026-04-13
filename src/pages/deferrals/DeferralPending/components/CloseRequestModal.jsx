import React, { useMemo, useState } from "react";
import { Button, Input, Table, Upload } from "antd";
import { FileDoneOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PRIMARY_BLUE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const MODAL_STYLES = `
    .close-request-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .close-request-page__body {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .close-request-modal__section {
      border: 1px solid rgba(214, 189, 152, 0.18);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.96);
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(26, 54, 54, 0.06);
    }

    .close-request-modal__section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(214, 189, 152, 0.16);
      background: linear-gradient(180deg, rgba(245, 247, 244, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%);
    }

    .close-request-modal__section-title {
      margin: 0;
      color: var(--color-text-dark);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .close-request-modal__section-copy {
      margin: 4px 0 0;
      color: var(--color-text-light);
      font-size: 12px;
      line-height: 1.55;
    }

    .close-request-modal__section-body {
      padding: 16px;
    }

    .close-request-modal__table-shell .ant-table {
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 10px;
      overflow: hidden;
    }

    .close-request-modal__table-shell .ant-table-thead > tr > th {
      background: var(--color-bg, #f5f7f4) !important;
      color: #64748b !important;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    }

    .close-request-modal__table-shell .ant-table-tbody > tr > td {
      vertical-align: top;
      border-bottom: 1px solid rgba(214, 189, 152, 0.14) !important;
    }

    .close-request-modal__doc-cell {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      min-width: 0;
    }

    .close-request-modal__doc-copy {
      min-width: 0;
      flex: 1;
    }

    .close-request-modal__doc-icon {
      color: ${PRIMARY_BLUE};
      font-size: 18px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .close-request-modal__doc-title {
      color: ${PRIMARY_BLUE};
      font-size: 14px;
      font-weight: 700;
      line-height: 1.45;
      white-space: normal;
      word-break: break-word;
    }

    .close-request-modal__doc-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .close-request-modal__doc-detail {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(214, 226, 239, 0.56);
      color: var(--color-text-medium);
      font-size: 11px;
      line-height: 1.4;
    }

    .close-request-modal__doc-detail-label {
      color: var(--color-text-light);
      font-weight: 600;
    }

    .close-request-modal__doc-detail-value {
      color: var(--color-text-dark);
      font-weight: 700;
    }

    .close-request-modal__upload-cell {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 220px;
    }

    .close-request-modal__upload.ant-btn,
    .close-request-modal__upload.ant-btn:hover,
    .close-request-modal__upload.ant-btn:focus {
      min-height: 40px;
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(214, 189, 152, 0.34);
      color: var(--color-text-dark);
      box-shadow: none;
    }

    .close-request-modal__comment textarea {
      min-height: 92px !important;
    }

    .close-request-modal__files {
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(214, 189, 152, 0.08);
      color: var(--color-text-medium);
      font-size: 12px;
      line-height: 1.6;
    }

    .close-request-page__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (max-width: 900px) {
      .close-request-modal__upload-cell {
        min-width: 180px;
      }
    }
  `;

  const normalizeFiles = (files = []) =>
    files.map((file, index) => ({
      uid: file.uid || `${file.name || "file"}-${index}`,
      name: file.name || `document-${index + 1}`,
      status: "done",
      originFileObj: file.originFileObj || file,
    }));

  const createInitialEntries = (documents = []) =>
    documents.map((document, index) => ({
      key: String(document?.name || document?.label || `document-${index + 1}`)
        .trim()
        .toLowerCase(),
      documentName: document?.name || document?.label || `Document ${index + 1}`,
      requestedDays: document?.requestedDays || document?.daysSought || null,
      newDueDate: document?.newDueDate || document?.nextDocumentDueDate || null,
      comment: "",
      files: [],
    }));

  const CloseRequestModal = ({
    documents = [],
    loading = false,
    onClose,
    onSubmit,
  }) => {
    const [overallComment, setOverallComment] = useState("");
    const [entries, setEntries] = useState(() => createInitialEntries(documents));

    const allDocumentsReady = useMemo(
      () => entries.length > 0 && entries.every((entry) => entry.files.length > 0),
      [entries],
    );

    const updateEntry = (entryKey, patch) => {
      setEntries((prev) =>
        prev.map((entry) => (entry.key === entryKey ? { ...entry, ...patch } : entry)),
      );
    };

    const requestedDocumentsColumns = [
      {
        title: "Document",
        dataIndex: "documentName",
        key: "documentName",
        width: 320,
        render: (_, entry) => (
          <div className="close-request-modal__doc-cell">
            <FileDoneOutlined className="close-request-modal__doc-icon" />
            <div className="close-request-modal__doc-copy">
              <div className="close-request-modal__doc-title">{entry.documentName}</div>
              <div className="close-request-modal__doc-details">
                <div className="close-request-modal__doc-detail">
                  <span className="close-request-modal__doc-detail-label">Requested days</span>
                  <span className="close-request-modal__doc-detail-value">{entry.requestedDays || "-"}</span>
                </div>
                <div className="close-request-modal__doc-detail">
                  <span className="close-request-modal__doc-detail-label">New due date</span>
                  <span className="close-request-modal__doc-detail-value">
                    {entry.newDueDate ? dayjs(entry.newDueDate).format("DD MMM YYYY") : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Comment",
        key: "comment",
        width: 320,
        render: (_, entry) => (
          <Input.TextArea
            rows={4}
            placeholder="Optional comment for this specific document"
            value={entry.comment}
            onChange={(event) => updateEntry(entry.key, { comment: event.target.value })}
            className="creator-input close-request-modal__comment"
          />
        ),
      },
      {
        title: "Supporting Files",
        key: "files",
        width: 280,
        render: (_, entry) => (
          <div className="close-request-modal__upload-cell">
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={entry.files}
              onChange={({ fileList }) =>
                updateEntry(entry.key, { files: normalizeFiles(fileList) })
              }
            >
              <Button icon={<UploadOutlined />} className="close-request-modal__upload">
                Upload Supporting File(s)
              </Button>
            </Upload>

            {entry.files.length > 0 ? (
              <div className="close-request-modal__files">
                {entry.files.length} supporting file{entry.files.length === 1 ? "" : "s"} selected: {entry.files.map((file) => file.name).join(", ")}
              </div>
            ) : (
              <div className="close-request-modal__files">No supporting files selected yet.</div>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="close-request-page">
        <style>{MODAL_STYLES}</style>

        <div className="close-request-page__body">
          <section className="close-request-modal__section">
            <div className="close-request-modal__section-head">
              <div>
                <h3 className="close-request-modal__section-title">Overall Comment</h3>
                <p className="close-request-modal__section-copy">
                  Summarize the closure request and any shared context that applies across the uploaded evidence.
                </p>
              </div>
            </div>
            <div className="close-request-modal__section-body">
              <Input.TextArea
                rows={4}
                placeholder="Describe the close request and any important context for creator/checker review"
                value={overallComment}
                onChange={(event) => setOverallComment(event.target.value)}
                className="creator-input"
              />
            </div>
          </section>

          <section className="close-request-modal__section">
            <div className="close-request-modal__section-head">
              <div>
                <h3 className="close-request-modal__section-title">
                  Per-document Uploads & Comments ({entries.length})
                </h3>
                <p className="close-request-modal__section-copy">
                  Each requested document needs at least one supporting file before the close request can be submitted.
                </p>
              </div>
            </div>
            <div className="close-request-modal__section-body">
              <div className="close-request-modal__table-shell">
                <Table
                  dataSource={entries}
                  columns={requestedDocumentsColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 980 }}
                />
              </div>
            </div>
          </section>

          <div className="close-request-page__footer">
            <Button
              onClick={onClose}
              disabled={loading}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!allDocumentsReady}
              onClick={() =>
                onSubmit?.({
                  comment: overallComment,
                  documents: entries,
                })
              }
              className="admin-page__action-button admin-page__action-button--primary deferral-review-actionbar__button"
            >
              Submit Close Request
            </Button>
          </div>
        </div>
      </div>
    );
  };

  export default CloseRequestModal;