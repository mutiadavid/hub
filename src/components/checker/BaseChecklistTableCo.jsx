import React, { useState, useMemo, useEffect } from "react";
import { Table, Tag, Button, Drawer, Typography, message } from "antd";
import axios from "axios";
import { API_BASE_URL } from "../../config/runtimeConfig";

const { Title, Text } = Typography;

const BaseChecklistTableCo = () => {
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---------------------- FETCH DATA FROM API ----------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get(
          `${API_BASE_URL}/checklists`
        );

        setChecklists(data || []);
      } catch (error) {
        console.error("Failed to load checklists:", error);
        message.error("Failed to fetch checklist data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------------------- OPEN DRAWER ----------------------
  const openChecklist = (record) => {
    setSelectedChecklist({ ...record });
    setDrawerVisible(true);
  };

  // ---------------------- CO ACTIONS (update with your API later) ----------------------
  const handleApprove = () => {
    message.success(`Checklist ${selectedChecklist.id} approved`);
    setDrawerVisible(false);
  };

  const handleReject = () => {
    message.error(`Checklist ${selectedChecklist.id} rejected`);
    setDrawerVisible(false);
  };

  const handleReturnToRm = () => {
    message.warning(`Checklist ${selectedChecklist.id} returned to RM`);
    setDrawerVisible(false);
  };

  // ---------------------- FILTER SUBMITTED CHECKLISTS ----------------------
  const submittedChecklists = useMemo(() => {
    return checklists.filter((c) =>
      c.categories?.some(
        (d) => d.status === "Submitted" || d.status === "Deferred"
      )
    );
  }, [checklists]);

  // ---------------------- TABLE COLUMNS ----------------------
  const columns = [
    { title: "Loan No", dataIndex: "id", width: 100 },
    { title: "Customer", dataIndex: "customerName", width: 150 },
    { title: "Loan Type", dataIndex: "loanType", width: 150 },
    {
      title: "Progress",
      render: (_, row) => {
        const total = row.categories?.length || 0;
        const submitted =
          row.categories?.filter((d) => d.status === "Submitted").length || 0;

        return total > 0 ? `${submitted}/${total} submitted` : "0/0";
      },
    },
    { title: "Status", dataIndex: "status", width: 130 },
    {
      title: "Action",
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => openChecklist(record)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={submittedChecklists}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {/* ---------------------- CO DRAWER ---------------------- */}
      <Drawer
        title={`Checklist Review — ${selectedChecklist?.customerName}`}
        width={450}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedChecklist && (
          <>
            <Text strong>Loan Type:</Text> {selectedChecklist.loanType} <br />
            <Text strong>RM:</Text> {selectedChecklist.rm} <br />
            <Text strong>Deadline:</Text> {selectedChecklist.deadline} <br />

            <Title level={5} style={{ marginTop: 20 }}>
              Documents
            </Title>

            {selectedChecklist.categories?.map((doc) => (
              <div
                key={doc.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span>{doc.name}</span>
                <Tag
                  color={
                    doc.status === "Submitted"
                      ? "green"
                      : doc.status === "Deferred"
                      ? "orange"
                      : "blue"
                  }
                >
                  {doc.status}
                </Tag>
              </div>
            ))}

            <Title level={5} style={{ marginTop: 25 }}>
              Actions
            </Title>

            <div style={{ display: "flex", gap: 8 }}>
              <Button type="primary" onClick={handleApprove}>
                Approve
              </Button>
              <Button danger onClick={handleReject}>
                Reject
              </Button>
              <Button onClick={handleReturnToRm}>Return to RM</Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default BaseChecklistTableCo;