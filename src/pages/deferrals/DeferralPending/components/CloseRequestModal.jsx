import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  Modal,
  Typography,
  Upload,
} from "antd";
import { FileDoneOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PRIMARY_BLUE } from "../utils/constants";

const normalizeFiles = (files = []) =>
  files.map((file, index) => ({
    uid: file.uid || `${file.name || "file"}-${index}`,
    name: file.name || `document-${index + 1}`,
    status: "done",
    originFileObj: file.originFileObj || file,
  }));

const createInitialEntries = (documents = []) =>
  documents.map((document, index) => ({
    key:
      String(document?.name || document?.label || `document-${index + 1}`)
        .trim()
        .toLowerCase(),
    documentName: document?.name || document?.label || `Document ${index + 1}`,
    requestedDays: document?.requestedDays || document?.daysSought || null,
    newDueDate: document?.newDueDate || document?.nextDocumentDueDate || null,
    comment: "",
    files: [],
  }));

const CloseRequestModal = ({
  open = false,
  documents = [],
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [overallComment, setOverallComment] = useState("");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!open) return;
    setOverallComment("");
    setEntries(createInitialEntries(documents));
  }, [documents, open]);

  const allDocumentsReady = useMemo(
    () => entries.length > 0 && entries.every((entry) => entry.files.length > 0),
    [entries],
  );

  const updateEntry = (entryKey, patch) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.key === entryKey ? { ...entry, ...patch } : entry,
      ),
    );
  };

  return (
    <Modal
      title={<span style={{ color: PRIMARY_BLUE }}>Submit Close Request</span>}
      open={open}
      onCancel={onClose}
      width={900}
      destroyOnClose
      styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!allDocumentsReady}
          onClick={() =>
            onSubmit?.({
              comment: overallComment,
              documents: entries,
            })
          }
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
          }}
        >
          Submit Close Request
        </Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card
          size="small"
          title={<span style={{ color: PRIMARY_BLUE }}>Overall Close Request Comment</span>}
        >
          <Input.TextArea
            rows={4}
            placeholder="Describe the close request and any important context for creator/checker review"
            value={overallComment}
            onChange={(event) => setOverallComment(event.target.value)}
          />
        </Card>

        <Card
          size="small"
          title={
            <span style={{ color: PRIMARY_BLUE }}>
              Per-document Uploads & Comments ({entries.length})
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {entries.map((entry) => (
              <div
                key={entry.key}
                style={{
                  border: "1px solid #d9e2ef",
                  borderRadius: 10,
                  padding: 16,
                  background: "#fafcff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "flex-start",
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <FileDoneOutlined style={{ color: PRIMARY_BLUE, fontSize: 18, marginTop: 2 }} />
                    <div>
                      <Typography.Text strong style={{ color: PRIMARY_BLUE, fontSize: 15 }}>
                        {entry.documentName}
                      </Typography.Text>
                      <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                        Requested days: {entry.requestedDays || "-"}
                        <span style={{ margin: "0 6px" }}>•</span>
                        New due date: {entry.newDueDate ? dayjs(entry.newDueDate).format("DD MMM YYYY") : "-"}
                      </div>
                    </div>
                  </div>
                  <Upload
                    multiple
                    beforeUpload={() => false}
                    fileList={entry.files}
                    onChange={({ fileList }) =>
                      updateEntry(entry.key, { files: normalizeFiles(fileList) })
                    }
                  >
                    <Button icon={<UploadOutlined />}>Upload Supporting File(s)</Button>
                  </Upload>
                </div>

                <Input.TextArea
                  rows={3}
                  placeholder="Optional comment for this specific document"
                  value={entry.comment}
                  onChange={(event) =>
                    updateEntry(entry.key, { comment: event.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default CloseRequestModal;