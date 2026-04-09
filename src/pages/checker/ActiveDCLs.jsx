
import React, { useEffect, useState } from "react";
import { Table, Button, Drawer, Space, message, Input } from "antd";
// import axios from "axios";
import api from "./api"

// ==========================
// Active DCLs (Checker View)
// ==========================
const ActiveDCLs = () => {
  const [dcls, setDcls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDCL, setSelectedDCL] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  useEffect(() => {
    fetchReviewedDCLs();
  }, []);

  const fetchReviewedDCLs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/dcls/checker/pending");
      setDcls(res.data);
    } catch (err) {
      message.error("Failed to load reviewed DCLs");
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (record) => {
    setSelectedDCL(record);
    setDrawerOpen(true);
  };

  const approveDCL = async () => {
    try {
      await api.post(`/dcls/${selectedDCL._id}/checker-approve`);
      message.success("DCL approved and sent to Disbursement");
      setDrawerOpen(false);
      fetchReviewedDCLs();
    } catch (err) {
      message.error("Failed to approve DCL");
    }
  };

  const rejectDCL = async () => {
    if (!rejectComment.trim()) return message.error("Comment is required");

    try {
      await api.post(`/dcls/${selectedDCL._id}/checker-reject`, {
        comment: rejectComment,
      });
      message.success("DCL rejected and sent back to CO");
      setDrawerOpen(false);
      setRejectComment("");
      fetchReviewedDCLs();
    } catch (err) {
      message.error("Failed to reject DCL");
    }
  };

  const columns = [
    {
      title: "Applicant",
      dataIndex: "applicantName",
    },
    {
      title: "DCL Number",
      dataIndex: "dclNumber",
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button type="primary" onClick={() => openDrawer(record)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={dcls}
        loading={loading}
        rowKey="_id"
      />

      <Drawer
        title="DCL Checker Review"
        placement="right"
        width={520}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedDCL && (
          <>
            <h3>Documents</h3>
            {selectedDCL.documents?.map((doc, index) => (
              <div key={index} style={{ marginBottom: 10 }}>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.name}
                </a>
              </div>
            ))}

            <h3>CO Review Notes</h3>
            <p>{selectedDCL.coComment || "No comments"}</p>

            <br />
            <Space>
              <Button type="primary" onClick={approveDCL}>
                Approve
              </Button>

              <Button danger onClick={rejectDCL}>
                Reject
              </Button>
            </Space>

            <br /><br />
            <Input.TextArea
              rows={4}
              placeholder="Reason for rejection (required if rejecting)"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </>
        )}
      </Drawer>
    </>
  );
};

export default ActiveDCLs;

