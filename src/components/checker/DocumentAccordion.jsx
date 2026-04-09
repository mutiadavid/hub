import React from "react";
import { Table, Select, Input, Button, Collapse } from "antd";

const { Panel } = Collapse;
const { Option } = Select;

const actionToStatus = {
  submitted: "submitted",
  rejected: "rejected",
  tbo: "tbo",
  sighted: "sighted",
  waived: "waived",
  deferred: "deferred",
};

const DocumentAccordion = ({ documents, setDocuments }) => {

  const handleDocumentChange = (catIdx, docIdx, field, value) => {
    const updated = [...documents];
    const doc = updated[catIdx].docList[docIdx];
    doc[field] = value;
    
    // Auto-update status when action changes
    if (field === 'action') {
        doc.status = actionToStatus[value] || "pending";
    }

    setDocuments(updated);
  };

  const handleRemoveDocument = (catIdx, docIdx) => {
    const updated = [...documents];
    updated[catIdx].docList.splice(docIdx, 1);
    setDocuments(updated);
  };

  const getColumns = (catIdx) => [
    { title: "Document", dataIndex: "name" },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Select
          value={record.action}
          onChange={(action) => handleDocumentChange(catIdx, record.docIdx, 'action', action)}
          style={{ width: 130 }}
        >
          <Option value="submitted">Submitted</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="tbo">TBO</Option>
          <Option value="sighted">Sighted</Option>
          <Option value="waived">Waived</Option>
          <Option value="deferred">Deferred</Option>
        </Select>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <strong>{s}</strong>,
    },
    {
      title: "Comment",
      dataIndex: "comment",
      render: (_, record) => (
        <Input
          value={record.comment}
          onChange={(e) => handleDocumentChange(catIdx, record.docIdx, 'comment', e.target.value)}
        />
      ),
    },
    {
      title: "Remove",
      render: (_, record) => (
        <Button
          danger
          onClick={() => handleRemoveDocument(catIdx, record.docIdx)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Collapse accordion>
      {documents.map((cat, catIdx) => (
        <Panel header={cat.category} key={catIdx}>
          <Table
            pagination={false}
            dataSource={cat.docList.map((doc, docIdx) => ({
              key: `${catIdx}-${docIdx}`,
              ...doc,
              docIdx,
            }))}
            columns={getColumns(catIdx)}
          />
        </Panel>
      ))}
    </Collapse>
  );
};

export default DocumentAccordion;