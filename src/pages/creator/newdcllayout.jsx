import React, { useMemo, useState, useEffect } from "react";
import {
  Button,
  Divider,
  Table,
  Tag,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Input,
  Badge,
  Typography,
  Space,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal";
import dayjs from "dayjs";

// Theme Colors (same as other queues)
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

const { Text } = Typography;

// MOCK DATA for Creator's In-Progress Checklists
const MOCK_CREATOR_QUEUE = [
  {
    _id: "q1",
    dclNo: "DCL-2024-011",
    customerNumber: "CUST011",
    customerName: "Global Tech Ltd",
    loanType: "Technology Loan",
    title: "IT Infrastructure Upgrade",
    assignedToRM: {
      _id: "rm1",
      name: "John Kamau",
      email: "john.k@ncba.co.ke",
    },
    status: "draft",
    priority: "high",
    createdAt: "2024-12-20T09:30:00Z",
    updatedAt: "2024-12-20T09:30:00Z",
    documents: [
      {
        category: "Technical Documents",
        docList: [
          {
            _id: "docq1_1",
            name: "Project Proposal",
            status: "pending",
            comment: "Need detailed budget",
          },
          {
            _id: "docq1_2",
            name: "Vendor Quotations",
            status: "pending",
            comment: "Waiting for 3 quotes",
          },
        ],
      },
    ],
  },
  {
    _id: "q2",
    dclNo: "DCL-2024-012",
    customerNumber: "CUST012",
    customerName: "Prime Construction Ltd",
    loanType: "Construction Loan",
    title: "Commercial Building - $2.5M",
    assignedToRM: {
      _id: "rm2",
      name: "Sarah Wangui",
      email: "sarah.w@ncba.co.ke",
    },
    status: "pending_rm_review",
    priority: "high",
    createdAt: "2024-12-19T14:15:00Z",
    updatedAt: "2024-12-19T14:15:00Z",
    documents: [
      {
        category: "Construction Documents",
        docList: [
          {
            _id: "docq2_1",
            name: "Architectural Plans",
            status: "submitted",
            comment: "Approved by RM",
          },
          {
            _id: "docq2_2",
            name: "Building Permits",
            status: "pending",
            comment: "Application in progress",
          },
        ],
      },
    ],
  },
  {
    _id: "q3",
    dclNo: "DCL-2024-013",
    customerNumber: "CUST013",
    customerName: "Fresh Farm Produce Ltd",
    loanType: "Agricultural Loan",
    title: "Greenhouse Expansion",
    assignedToRM: {
      _id: "rm3",
      name: "Peter Kariuki",
      email: "peter.k@ncba.co.ke",
    },
    status: "in_review",
    priority: "medium",
    createdAt: "2024-12-18T11:45:00Z",
    updatedAt: "2024-12-18T11:45:00Z",
    documents: [
      {
        category: "Agricultural Documents",
        docList: [
          {
            _id: "docq3_1",
            name: "Land Title Deed",
            status: "sighted",
            comment: "Verified",
          },
          {
            _id: "docq3_2",
            name: "Market Analysis",
            status: "pending",
            comment: "In progress",
          },
        ],
      },
    ],
  },
  {
    _id: "q4",
    dclNo: "DCL-2024-014",
    customerNumber: "CUST014",
    customerName: "MediCare Equipment Ltd",
    loanType: "Medical Equipment Loan",
    title: "MRI Machine Purchase",
    assignedToRM: {
      _id: "rm1",
      name: "John Kamau",
      email: "john.k@ncba.co.ke",
    },
    status: "draft",
    priority: "low",
    createdAt: "2024-12-21T10:00:00Z",
    updatedAt: "2024-12-21T10:00:00Z",
    documents: [
      {
        category: "Medical Documents",
        docList: [
          {
            _id: "docq4_1",
            name: "Equipment Specifications",
            status: "pending",
            comment: "Pending vendor details",
          },
        ],
      },
    ],
  },
];

const MyQueue = ({ userId = "creator_current" }) => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mockData, setMockData] = useState([]);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMockData(MOCK_CREATOR_QUEUE);
      setLoading(false);
    }, 300);
  }, []);

  const filteredData = useMemo(() => {
    let filtered = mockData;

    if (searchText) {
      filtered = filtered.filter(
        (c) =>
          c.dclNo.toLowerCase().includes(searchText.toLowerCase()) ||
          c.customerNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          c.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
          c.loanType.toLowerCase().includes(searchText.toLowerCase()) ||
          c.assignedToRM?.name
            ?.toLowerCase()
            .includes(searchText.toLowerCase()),
      );
    }

    return filtered;
  }, [mockData, searchText]);

  const clearFilters = () => setSearchText("");

  const refetch = () => {
    setLoading(true);
    setTimeout(() => {
      setMockData([...MOCK_CREATOR_QUEUE]);
      setLoading(false);
    }, 200);
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: { color: "default", text: "Draft", icon: <EditOutlined /> },
      pending_rm_review: {
        color: "processing",
        text: "Pending RM Review",
        icon: <ClockCircleOutlined />,
      },
      in_review: { color: "warning", text: "In Review", icon: <EyeOutlined /> },
      submitted: { color: "success", text: "Submitted", icon: <EyeOutlined /> },
      completed: { color: "success", text: "Completed", icon: <EyeOutlined /> },
    };
    return configs[status] || { color: "default", text: status, icon: null };
  };

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileTextOutlined style={{ color: SECONDARY_PURPLE }} />
          {text}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 160,
      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: 12 }} />
          {text}
        </div>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 140,
      render: (rm) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
          <span style={{ color: PRIMARY_BLUE, fontWeight: 500, fontSize: 13 }}>
            {rm?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs) => {
        const totalDocs =
          docs?.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;
        return (
          <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
            {totalDocs}
          </span>
        );
      },
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      width: 120,
      render: (date) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {dayjs(date).format("DD/MM/YYYY")}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      fixed: "right",
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag
            color={config.color}
            style={{ fontWeight: "bold", fontSize: 11 }}
            icon={config.icon}
          >
            {config.text}
          </Tag>
        );
      },
    },
  ];

  const customTableStyles = `
    .creator-queue-table .ant-table-wrapper { 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08); 
      border: 1px solid #e0e0e0; 
    }
    .creator-queue-table .ant-table-thead > tr > th { 
      background-color: #f7f7f7 !important; 
      color: ${PRIMARY_BLUE} !important; 
      font-weight: 700; 
      fontSize: 13px; 
      padding: 14px 12px !important; 
      border-bottom: 3px solid ${ACCENT_LIME} !important; 
      border-right: none !important; 
    }
    .creator-queue-table .ant-table-tbody > tr > td { 
      border-bottom: 1px solid #f0f0f0 !important; 
      border-right: none !important; 
      padding: 12px 12px !important; 
      fontSize: 13px; 
      color: #333; 
    }
    .creator-queue-table .ant-table-tbody > tr.ant-table-row:hover > td { 
      background-color: rgba(181, 211, 52, 0.1) !important; 
      cursor: pointer;
    }
    .creator-queue-table .ant-pagination .ant-pagination-item-active { 
      background-color: ${ACCENT_LIME} !important; 
      border-color: ${ACCENT_LIME} !important; 
    }
    .creator-queue-table .ant-pagination .ant-pagination-item-active a { 
      color: ${PRIMARY_BLUE} !important; 
      font-weight: 600; 
    }
  `;

  return (
    <div style={{ padding: "8px 2px", boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>

      {/* Header */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${ACCENT_LIME}`,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2
              style={{
                margin: 0,
                color: PRIMARY_BLUE,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              My Checklists Queue
              <Badge
                count={filteredData.length}
                style={{
                  backgroundColor: ACCENT_LIME,
                  fontSize: 12,
                }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              In-progress checklists created by you
            </p>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                style={{ backgroundColor: PRIMARY_BLUE }}
                onClick={() => (window.location.href = "/creator/create")}
              >
                + Create New Checklist
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card
        style={{
          marginBottom: 16,
          background: "#fafafa",
          border: `1px solid ${PRIMARY_BLUE}20`,
          borderRadius: 8,
        }}
        size="small"
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by DCL No, Customer, Loan Type, or RM"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="middle"
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button
              onClick={clearFilters}
              style={{ width: "100%" }}
              size="middle"
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table Title */}
      <Divider style={{ margin: "12px 0" }}>
        <span style={{ color: PRIMARY_BLUE, fontSize: 16, fontWeight: 600 }}>
          Active Checklists ({filteredData.length} items)
        </span>
      </Divider>

      {/* Table */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Spin tip="Loading your checklists..." />
        </div>
      ) : filteredData.length === 0 ? (
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                No checklists found
              </p>
              <p style={{ color: "#999" }}>
                {searchText
                  ? "Try changing your search term"
                  : "Create your first checklist to get started"}
              </p>
              <Button
                type="primary"
                style={{ marginTop: 16, backgroundColor: PRIMARY_BLUE }}
                onClick={() => (window.location.href = "/creator/create")}
              >
                Create New Checklist
              </Button>
            </div>
          }
          style={{ padding: 40 }}
        />
      ) : (
        <div className="creator-queue-table">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              position: ["bottomCenter"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} checklists`,
            }}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedChecklist(record);
                setModalOpen(true);
              },
            })}
          />
        </div>
      )}

      {/* Footer Info */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "#f8f9fa",
          borderRadius: 8,
          fontSize: 12,
          color: "#666",
          border: `1px solid ${PRIMARY_BLUE}10`,
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            Report generated on: {dayjs().format("DD/MM/YYYY HH:mm:ss")}
          </Col>
          <Col>
            <Text type="secondary">
              Showing {filteredData.length} items • Data as of latest system
              update
            </Text>
          </Col>
        </Row>
      </div>

      {/* Action Modal */}
      {selectedChecklist && (
        <CreatorCompletedChecklistModal
          checklist={selectedChecklist}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedChecklist(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default MyQueue;
