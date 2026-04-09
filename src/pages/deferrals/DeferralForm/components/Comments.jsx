import React from "react";
import {
  Card,
  Button,
  Input,
  List,
  Avatar,
  Tag,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { message } from "antd";
import { PRIMARY_BLUE } from "../utils/constants";
import { validateComment } from "../utils/validation";
import "../../../../styles/creatorDesignSystem.css";

const { TextArea } = Input;
const { Title } = Typography;

export default function Comments({
  comments,
  setComments,
  postedComments,
  setPostedComments,
  currentUser,
}) {
  const handlePostComment = () => {
    if (!validateComment(comments)) return;

    const newComment = {
      message: comments.trim(),
      user: {
        name: currentUser.name || "You",
        role: currentUser.role || "rm",
      },
      createdAt: new Date().toISOString(),
    };
    setPostedComments((p) => [newComment, ...p]);
    setComments("");
    message.success("Comment posted");
  };

  return (
    <>
      <style>{`
        .deferral-form-comments.ant-card {
          margin-bottom: 16px;
          border-radius: 10px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06) !important;
        }
        .deferral-form-comments .ant-card-body {
          padding: 16px !important;
        }
        .deferral-form-comments-title {
          color: var(--color-text-dark);
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 12px;
        }
        .deferral-form-comments .ant-input {
          border-radius: 8px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
        }
        .deferral-form-comments .ant-input:hover,
        .deferral-form-comments .ant-input:focus {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .deferral-form-comments .deferral-form-comments-secondary.ant-btn {
          border-radius: 8px !important;
          border: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .deferral-form-comments .deferral-form-comments-primary.ant-btn {
          border-radius: 8px !important;
          border: none !important;
          background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(26, 54, 54, 0.12) !important;
        }
        .deferral-form-comments .ant-list-item {
          padding: 12px 0 !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
        }
        .deferral-form-comments .ant-list-item:last-child {
          border-bottom: none !important;
        }
        .deferral-form-comments-comment {
          width: 100%;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px 12px;
          align-items: start;
        }
        .deferral-form-comments-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .deferral-form-comments-tag.ant-tag {
          margin: 0;
          border-radius: 999px;
          border: 1px solid rgba(214, 189, 152, 0.2);
          background: rgba(245, 247, 244, 0.9);
          color: var(--color-text-medium);
          text-transform: uppercase;
          font-size: 11px;
        }
        .deferral-form-comments-message {
          color: var(--color-text-medium);
          font-size: 13px;
          line-height: 1.5;
          white-space: normal;
          word-break: break-word;
        }
        .deferral-form-comments-date {
          color: var(--color-text-light);
          font-size: 11px;
          white-space: nowrap;
          text-align: right;
        }
        @media (max-width: 767px) {
          .deferral-form-comments-comment {
            grid-template-columns: 1fr;
          }
          .deferral-form-comments-date {
            text-align: left;
          }
        }
      `}</style>
    <Card size="small" className="deferral-form-comments">
      <Title level={4} className="deferral-form-comments-title" style={{ color: PRIMARY_BLUE }}>
        Comments
      </Title>

      <TextArea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={4}
        placeholder="Add any notes or comments for the deferral (optional)"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 12,
          gap: 8,
        }}
      >
        <Button type="default" className="deferral-form-comments-secondary" onClick={() => setComments("")}>
          Clear
        </Button>
        <Button
          type="primary"
          onClick={handlePostComment}
          className="deferral-form-comments-primary"
        >
          Post Comment
        </Button>
      </div>

      {postedComments.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <List
            dataSource={postedComments}
            itemLayout="horizontal"
            renderItem={(item) => (
              <List.Item style={{ paddingTop: 4, paddingBottom: 4 }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ marginRight: 8 }}
                    />
                  }
                  title={
                    <div className="deferral-form-comments-comment">
                      <div className="deferral-form-comments-meta">
                        <b>{item.user.name}</b>
                        <Tag className="deferral-form-comments-tag">
                          {item.user.role}
                        </Tag>
                      </div>
                      <div className="deferral-form-comments-message">
                        {item.message}
                      </div>
                      <div className="deferral-form-comments-date">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
    </>
  );
}
