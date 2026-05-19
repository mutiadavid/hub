
import React, { useEffect, useState } from "react";
import { Table, Button, Drawer, Space, message, Input } from "antd";
// import axios from "axios";
import api from "./api"

const pageClassName =
  "min-h-full w-full bg-white font-['Century_Gothic','CenturyGothic','AppleGothic',sans-serif] [&_.ant-table-wrapper]:bg-white [&_.ant-spin-nested-loading]:bg-white [&_.ant-spin-container]:bg-white [&_.ant-table]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:bg-white [&_table]:bg-white [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-tbody>tr>td]:bg-white";

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
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
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
        <Button className="rounded-lg border-0 bg-(--ncb-primary-500) text-white shadow-none hover:bg-(--ncb-primary-700) hover:text-white" type="primary" onClick={() => openDrawer(record)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className={pageClassName}>
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
              <div key={index} className="mb-2.5">
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.name}
                </a>
              </div>
            ))}

            <h3>CO Review Notes</h3>
            <p>{selectedDCL.coComment || "No comments"}</p>

            <Space className="mt-4">
              <Button className="rounded-lg border-0 bg-(--ncb-primary-500) text-white shadow-none hover:bg-(--ncb-primary-700) hover:text-white" type="primary" onClick={approveDCL}>
                Approve
              </Button>

              <Button danger onClick={rejectDCL}>
                Reject
              </Button>
            </Space>

            <Input.TextArea
              className="mt-4"
              rows={4}
              placeholder="Reason for rejection (required if rejecting)"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ActiveDCLs;

