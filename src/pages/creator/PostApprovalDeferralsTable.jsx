import { Table, Spin, Empty } from "antd";
import { useGetDeferralsQuery } from "../../api/checklistApi";
import dayjs from "dayjs";

export default function PostApprovalDeferralsTable({ filters }) {
  const { data = [], isLoading } = useGetDeferralsQuery("Approved");

  const filtered = data.filter((d) =>
    !filters.searchText
      ? true
      : d.checklistId?.customerName
        ?.toLowerCase()
        .includes(filters.searchText.toLowerCase())
  );

  if (isLoading) return <Spin />;
  if (!filtered.length) return <Empty />;

  return (
    <Table
      rowKey="_id"
      dataSource={filtered}
      columns={[
        {
          title: "DCL No",
          dataIndex: ["checklistId", "dclNo"],
        },
        {
          title: "Customer",
          dataIndex: ["checklistId", "customerName"],
        },
        {
          title: "Document",
          dataIndex: "document",
        },
        {
          title: "Expiry",
          dataIndex: "expiryDate",
          render: (d) => dayjs(d).format("DD/MM/YYYY"),
        },
        {
          title: "RM",
          render: (_, r) => r.checklistId?.assignedRM?.name || "—",
        },
        {
          title: "Status",
          dataIndex: "status",
        },
      ]}
      pagination={{ pageSize: 10 }}
    />
  );
}