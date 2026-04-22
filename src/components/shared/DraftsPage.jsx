import React, { useState, useEffect, useMemo } from "react";
import { Card, List, Typography, Button, Empty, Popconfirm, message, Tooltip, Spin } from "antd";
import { DeleteOutlined, UndoOutlined, FileTextOutlined, HistoryOutlined } from "@ant-design/icons";
import { getDrafts, deleteDraft, getDraftTypeLabel, formatDraftDate } from "../../utils/draftsUtils";
import { formatDateTime } from "../../utils/checklistUtils";
import "../../styles/creatorDesignSystem.css";
import "./DraftsPage.css";

const { Title, Text, Paragraph } = Typography;

const DraftsPage = ({ type = null, onSelectDraft = null }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const allowedTypes = useMemo(() => {
    if (!type) {
      return null;
    }

    return Array.isArray(type) ? type : [type];
  }, [type]);

  const loadDrafts = () => {
    const allDrafts = getDrafts();
    const filteredDrafts = allowedTypes
      ? allDrafts.filter((draft) => allowedTypes.includes(draft.type))
      : allDrafts;

    setDrafts(filteredDrafts);
    setLoading(false);
  };

  useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedTypes]);

  const handleDeleteDraft = (id) => {
    const success = deleteDraft(id);
    if (success) {
      message.success("Draft deleted successfully");
      loadDrafts();
    } else {
      message.error("Failed to delete draft");
    }
  };

  const handleSelectDraft = (draft) => {
    if (onSelectDraft) {
      onSelectDraft(draft);
    }
  };

  const getTypeColor = (draftType) => {
    const colors = {
      'cocreator': 'blue',
      'rm': 'green',
      'checker': 'orange',
      'admin': 'purple',
      'approver': 'cyan',
      'deferral': 'red',
    };
    return colors[draftType] || 'default';
  };

  return (
    <div className="drafts-page creator-theme" style={{ boxSizing: "border-box" }}>
      <div className="drafts-shell">
        <div className="drafts-card-shell">
          <div className="drafts-header">
            <div className="drafts-title-wrap">
              <Title level={2} className="drafts-title">
                <FileTextOutlined /> My Drafts
              </Title>
              <Paragraph type="secondary" className="drafts-subtitle">
                Resume your work from where you left off
              </Paragraph>
            </div>
            <div className="drafts-count-pill">{drafts.length} Saved</div>
          </div>

          <Card className="drafts-card">
            {loading ? (
              <div className="drafts-state">
                <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
              </div>
            ) : drafts.length === 0 ? (
              <div className="drafts-state">
                <Empty
                  className="drafts-empty"
                  description={
                    <div>
                      <p style={{ fontSize: 16, marginBottom: 8 }}>No drafts found</p>
                      <p style={{ color: "var(--color-text-light)" }}>
                        Saved work will appear here when you create a draft.
                      </p>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : (
              <List
                className="drafts-list"
                itemLayout="horizontal"
                dataSource={drafts}
                renderItem={(draft) => (
                  <List.Item
                    className="draft-item"
                    actions={[
                      <Tooltip title="Restore this draft">
                        <Button
                          type="default"
                          size="small"
                          icon={<UndoOutlined />}
                          onClick={() => handleSelectDraft(draft)}
                          className="draft-action-btn draft-action-btn-primary"
                        >
                          Restore
                        </Button>
                      </Tooltip>,
                      <Popconfirm
                        title="Delete this draft?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDeleteDraft(draft.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          className="draft-action-btn draft-action-btn-danger"
                        >
                          Delete
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="draft-avatar">
                          <FileTextOutlined />
                        </div>
                      }
                      title={
                        <div className="draft-title-block">
                          <div className="draft-title-row">
                            <Text strong className="draft-name">
                              {draft.data?.title || draft.data?.customerName || draft.data?.checklistTitle || "Untitled Draft"}
                            </Text>
                            <span className={`draft-type-pill draft-type-pill-${getTypeColor(draft.type)}`}>
                              {getDraftTypeLabel(draft.type)}
                            </span>
                          </div>
                          <div className="draft-description">
                            {draft.data?.dclNo && <span className="draft-meta-pill">{draft.data.dclNo}</span>}
                            {draft.data?.loanType && <span className="draft-meta-pill">{draft.data.loanType}</span>}
                            {draft.data?.customerNumber && (
                              <span className="draft-inline-text">Customer: {draft.data.customerNumber}</span>
                            )}
                          </div>
                        </div>
                      }
                      description={
                        <div className="draft-meta">
                          <Text type="secondary" className="draft-time">
                            <HistoryOutlined /> {formatDraftDate(draft.updatedAt)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            <div className="drafts-footer">
              <div>Report generated on: {formatDateTime(new Date())}</div>
              <Text type="secondary">
                Showing {drafts.length} drafts • Data as of latest system update
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DraftsPage;
