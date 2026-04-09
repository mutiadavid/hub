import React, { useState } from "react";
import {
  Table,
  Button,
  Upload,
  message,
  Modal,
  Input,
  Tag,
  Divider,
  Card,
  Descriptions,
  Space,
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  useGetChecklistsQuery,
  useSubmitRmChecklistMutation,
} from "../../api/checklistApi";

const RMReviewPage = () => {
  const { user } = useSelector((state) => state.auth);
  const rmId = user?._id;

  const { data: checklists = [], refetch } = useGetChecklistsQuery();
  const [submitRmChecklist, { isLoading }] = useSubmitRmChecklistMutation();

  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [deferralModal, setDeferralModal] = useState({
    open: false,
    docIdx: null,
  });
  const [deferralComment, setDeferralComment] = useState("");

  // Only RM assigned checklists
  const myChecklists = checklists.filter(
    (c) => String(c.assignedToRM?._id) === String(rmId),
  );

  // Upload doc
  const handleFileUpload = (docIdx, file) => {
    const updated = [...selectedChecklist.documents];
    updated[docIdx].fileUrl = URL.createObjectURL(file);
    updated[docIdx].status = "uploaded";

    setSelectedChecklist({ ...selectedChecklist, documents: updated });
    message.success("File uploaded");
    return false;
  };

  // Deferral
  const openDeferral = (docIdx) => {
    setDeferralModal({ open: true, docIdx });
    setDeferralComment("");
  };

  const submitDeferral = () => {
    if (!deferralComment.trim()) return message.error("Enter deferral reason");

    const updated = [...selectedChecklist.documents];
    updated[deferralModal.docIdx].status = "deferred";
    updated[deferralModal.docIdx].deferralReason = deferralComment;

    setSelectedChecklist({ ...selectedChecklist, documents: updated });
    setDeferralModal({ open: false, docIdx: null });
    message.success("Deferral submitted");
  };

  // ================================
  // FIXED: SUBMIT CHECKLIST TO CO
  // ================================
  const submitToCoCreator = async () => {
    try {
      const payload = {
        checklistId: selectedChecklist.id || selectedChecklist._id,

        // Send back only status + deferrals + uploaded file

        documents: selectedChecklist.documents.map((doc) => ({
          _id: doc.id || doc._id,
          status: doc.status, // uploaded / deferred
          fileUrl: doc.fileUrl || null,
          deferralReason: doc.deferralReason || null,
        })),

        // This tells backend to send it back to whoever assigned to RM
        returnTo:
          selectedChecklist.assignedToCoChecker?.id ||
          selectedChecklist.assignedToCoChecker?._id,
      };

      await submitRmChecklist(payload).unwrap();

      message.success("Checklist submitted back to Co-Creator!");
      setSelectedChecklist(null);
      refetch();
    } catch (err) {
      console.error(err);
      message.error(err?.data?.error || "Submission failed");
    }
  };

  // Document table columns
  const docColumns = [
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Document Name",
      dataIndex: "name",
      render: (text, record) => (
        <Input
          size="small"
          value={text}
          onChange={(e) => {
            const updated = [...selectedChecklist.documents];
            updated[record.docIdx].name = e.target.value;
            setSelectedChecklist({ ...selectedChecklist, documents: updated });
          }}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const colors = {
          pending: "default",
          uploaded: "blue",
          approved: "green",
          deferred: "gold",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Comment",
      dataIndex: "comment",
      render: (text, record) => (
        <Input
          size="small"
          value={text}
          onChange={(e) => {
            const updated = [...selectedChecklist.documents];
            updated[record.docIdx].comment = e.target.value;
            setSelectedChecklist({ ...selectedChecklist, documents: updated });
          }}
        />
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => handleFileUpload(record.docIdx, file)}
          >
            <Button size="small" icon={<UploadOutlined />}>
              Upload
            </Button>
          </Upload>

          {record.fileUrl && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(record.fileUrl, "_blank")}
            >
              View
            </Button>
          )}

          <Button
            size="small"
            disabled={record.status === "deferred"}
            onClick={() => openDeferral(record.docIdx)}
          >
            Request Deferral
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2>RM Checklist Review</h2>
      <Divider />

      <Table
        dataSource={myChecklists}
        rowKey="_id"
        bordered
        size="small"
        pagination={{ pageSize: 5 }}
        columns={[
          { title: "DCL No", dataIndex: "_id", width: 180 },
          { title: "Customer Name", dataIndex: "Customer Name", width: 200 },
          { title: "Loan Type", dataIndex: "loanType", width: 150 },
          {
            title: "Status",
            render: (_, r) => {
              const total = r.documents.length;
              const approved = r.documents.filter(
                (d) => d.status === "approved",
              ).length;
              return (
                <Tag color={approved === total ? "green" : "orange"}>
                  {approved === total ? "Fully Approved" : "In Progress"}
                </Tag>
              );
            },
          },
          {
            title: "Action",
            render: (_, r) => (
              <Button
                size="small"
                type="link"
                onClick={() => {
                  const preparedDocs = (r.documents || []).map((doc, idx) => ({
                    ...doc,
                    docIdx: idx,
                    status: doc.status || "pending",
                    comment: doc.comment || "",
                    action: doc.action || "pending",
                    fileUrl: doc.fileUrl || null,
                  }));
                  setSelectedChecklist({
                    ...r,
                    documents: preparedDocs,
                  });
                }}
              >
                Review
              </Button>
            ),
          },
        ]}
      />

      {/* REVIEW MODAL */}
      {selectedChecklist && (
        <Modal
          title={`Review Checklist — ${selectedChecklist.title}`}
          open
          width={1000}
          onCancel={() => setSelectedChecklist(null)}
          footer={[
            <Button
              key="close"
              size="small"
              onClick={() => setSelectedChecklist(null)}
            >
              Close
            </Button>,
            <Button
              key="submit"
              size="small"
              type="primary"
              loading={isLoading}
              onClick={submitToCoCreator} // FIXED
            >
              Submit to Co-Checker
            </Button>,
          ]}
        >
          <Card size="small" style={{ marginBottom: 12 }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="DCL No">
                {selectedChecklist.id || selectedChecklist._id}
              </Descriptions.Item>
              <Descriptions.Item label="Title">
                {selectedChecklist.title}
              </Descriptions.Item>
              <Descriptions.Item label="Loan Type">
                {selectedChecklist.loanType}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedChecklist.createdBy?.name}
              </Descriptions.Item>
              <Descriptions.Item label="RM">
                {selectedChecklist.assignedToRM?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Co-Checker">
                {selectedChecklist.assignedToCoChecker?.name || "Pending"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Table
            bordered
            size="small"
            pagination={false}
            rowKey="docIdx"
            dataSource={selectedChecklist.documents}
            columns={docColumns}
          />
        </Modal>
      )}

      {/* DEFERRAL MODAL */}
      <Modal
        title="Request Deferral"
        open={deferralModal.open}
        onCancel={() => setDeferralModal({ open: false, docIdx: null })}
        footer={[
          <Button
            key="cancel"
            size="small"
            onClick={() => setDeferralModal({ open: false, docIdx: null })}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            size="small"
            type="primary"
            onClick={submitDeferral}
          >
            Submit
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={3}
          value={deferralComment}
          onChange={(e) => setDeferralComment(e.target.value)}
          placeholder="Enter deferral reason"
        />
      </Modal>
    </div>
  );
};

export default RMReviewPage;
