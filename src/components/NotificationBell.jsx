import { Badge, Drawer, Tag, Button, Empty, Spin, Typography } from "antd";
import {
  BellOutlined,
  CalendarOutlined,
  CheckOutlined,
  EyeOutlined,
  NotificationOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../api/notificationApi";
import { formatCommentTimestamp } from "../utils/checklistUtils";

const { Text } = Typography;
const DRAWER_CLASS = "creator-notification-sidebar";

const getNotificationTone = (message = "") => {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("rejected") ||
    normalizedMessage.includes("returned") ||
    normalizedMessage.includes("action")
  ) {
    return {
      label: "Action",
      tagBg: "rgba(248, 113, 113, 0.14)",
      tagColor: "#B91C1C",
      iconBg: "rgba(248, 113, 113, 0.12)",
      iconColor: "#B91C1C",
      accent: "#DC2626",
    };
  }

  if (
    normalizedMessage.includes("approved") ||
    normalizedMessage.includes("completed")
  ) {
    return {
      label: "Done",
      tagBg: "rgba(34, 197, 94, 0.14)",
      tagColor: "#15803D",
      iconBg: "rgba(34, 197, 94, 0.12)",
      iconColor: "#15803D",
      accent: "#65A30D",
    };
  }

  if (
    normalizedMessage.includes("submitted") ||
    normalizedMessage.includes("review")
  ) {
    return {
      label: "New",
      tagBg: "rgba(59, 130, 246, 0.14)",
      tagColor: "#2563EB",
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#2563EB",
      accent: "#1A3636",
    };
  }

  return {
    label: "Info",
    tagBg: "rgba(148, 163, 184, 0.18)",
    tagColor: "#475569",
    iconBg: "rgba(148, 163, 184, 0.12)",
    iconColor: "#475569",
    accent: "#D6BD98",
  };
};

const NotificationBell = ({ onOpenChecklist }) => {
  const [open, setOpen] = useState(false);
  const {
    data: notifications = [],
    isLoading,
    isFetching,
  } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [markNotificationAsRead, { isLoading: isMarkingRead }] =
    useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsAsReadMutation();
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const unreadCount = unreadNotifications.length;
  const visibleNotifications = unreadNotifications;
  const isUpdatingNotifications = isMarkingRead || isMarkingAllRead;

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    try {
      await markNotificationAsRead(notificationId).unwrap();
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsAsRead().unwrap();
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const handleOpenNotifications = () => {
    setOpen(true);
  };

  const handleOpenChecklist = async (item) => {
    if (!item?.checklistId || !onOpenChecklist) {
      return;
    }

    if (!item.read && item.id) {
      try {
        await markNotificationAsRead(item.id).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }

    onOpenChecklist(item.checklistId);
  };

  return (
    <>
      <style>{`
        .${DRAWER_CLASS}.ant-drawer {
          z-index: 10000 !important;
        }
        .${DRAWER_CLASS} .ant-drawer-mask {
          z-index: 9999 !important;
          pointer-events: auto !important;
        }
        .${DRAWER_CLASS} .ant-drawer-content-wrapper {
          z-index: 10001 !important;
          pointer-events: auto !important;
        }
        .${DRAWER_CLASS} .ant-drawer-content {
          background: #ffffff !important;
          pointer-events: auto !important;
        }
        .${DRAWER_CLASS} .ant-drawer-wrapper-body {
          pointer-events: auto !important;
        }
        .${DRAWER_CLASS} .ant-drawer-header {
          padding: 16px 18px 14px !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: #ffffff !important;
        }
        .${DRAWER_CLASS} .ant-drawer-body {
          padding: 12px !important;
        }
        .${DRAWER_CLASS} .ant-drawer-close {
          width: 34px !important;
          height: 34px !important;
          border-radius: 999px !important;
          background: rgba(64, 83, 76, 0.06) !important;
          color: #1f2937 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .${DRAWER_CLASS} .ant-drawer-close:hover,
        .${DRAWER_CLASS} .ant-drawer-close:focus {
          background: rgba(64, 83, 76, 0.12) !important;
          color: #1f2937 !important;
        }
        .${DRAWER_CLASS} .ant-drawer-close .anticon {
          color: inherit !important;
        }
        .${DRAWER_CLASS}__badge.ant-tag {
          margin-inline-end: 0 !important;
          min-width: 28px !important;
          height: 28px !important;
          padding: 0 8px !important;
          border-radius: 999px !important;
          border: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: #b5d334 !important;
          color: #1A3636 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
        }
        .${DRAWER_CLASS}__item {
          border-left: 3px solid #1A3636;
          border-bottom: 1px solid rgba(214, 189, 152, 0.24);
          background: rgba(255, 255, 255, 0.68);
          padding: 10px 10px 11px;
        }
        .${DRAWER_CLASS}__action.ant-btn,
        .${DRAWER_CLASS}__action.ant-btn:hover,
        .${DRAWER_CLASS}__action.ant-btn:focus,
        .${DRAWER_CLASS}__action.ant-btn:active {
          min-height: 22px !important;
          height: 22px !important;
          border-radius: 5px !important;
          padding: 0 7px !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .${DRAWER_CLASS}__action.ant-btn .anticon {
          font-size: 10px !important;
        }
        .${DRAWER_CLASS}__action--primary.ant-btn,
        .${DRAWER_CLASS}__action--primary.ant-btn:hover,
        .${DRAWER_CLASS}__action--primary.ant-btn:focus,
        .${DRAWER_CLASS}__action--primary.ant-btn:active {
          background: #fff !important;
          border: 1px solid rgba(203, 213, 225, 0.9) !important;
          color: #1f2937 !important;
        }
        .${DRAWER_CLASS}__action--secondary.ant-btn,
        .${DRAWER_CLASS}__action--secondary.ant-btn:hover,
        .${DRAWER_CLASS}__action--secondary.ant-btn:focus,
        .${DRAWER_CLASS}__action--secondary.ant-btn:active {
          background: #fff !important;
          border: 1px solid rgba(214, 189, 152, 0.38) !important;
          color: #1f2937 !important;
        }
        .${DRAWER_CLASS}__empty {
          padding: 36px 18px;
          border-radius: 14px;
          border: 1px dashed rgba(214, 189, 152, 0.4);
          background: rgba(255, 255, 255, 0.72);
          text-align: center;
          color: #64748b;
        }
      `}</style>
      <Badge count={unreadCount} offset={[-2, 2]} size="small">
        <BellOutlined
          style={{ fontSize: 20, cursor: "pointer" }}
          onClick={handleOpenNotifications}
        />
      </Badge>

      <Drawer
        rootClassName={DRAWER_CLASS}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ color: "#1f2937", fontWeight: 700, fontSize: 15 }}>Notifications</span>
              <span style={{ color: "#64748b", fontSize: 11 }}>
                System workflow updates only
              </span>
            </div>
            <Tag className={`${DRAWER_CLASS}__badge`}>{unreadCount}</Tag>
          </div>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={isMobile ? 340 : 400}
        zIndex={10000}
        styles={{
          body: {
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {isLoading || isFetching ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <Spin />
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className={`${DRAWER_CLASS}__empty`}>
            <NotificationOutlined style={{ fontSize: 30, marginBottom: 10, opacity: 0.55 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
              No unread notifications
            </div>
            <div style={{ marginTop: 6, fontSize: 11 }}>
              New workflow activity will appear here.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 10,
                padding: "2px 0 8px",
                borderBottom: "1px solid rgba(214, 189, 152, 0.22)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    color: "#1f2937",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Inbox
                </span>
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {unreadCount} unread item{unreadCount === 1 ? "" : "s"}
                </span>
              </div>

              <Button
                size="small"
                className={`${DRAWER_CLASS}__action ${DRAWER_CLASS}__action--secondary`}
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                loading={isMarkingAllRead}
              >
                Mark all as read
              </Button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                maxHeight: "calc(125vh - 186px)",
                overflowY: "auto",
                paddingBottom: 50,
                overscrollBehavior: "contain",
              }}
            >
              {visibleNotifications.map((item) => {
                const tone = getNotificationTone(item.message);
                const timestamp = formatCommentTimestamp(
                  item.createdAt || item.timestamp || item.updatedAt,
                );

                return (
                  <div
                    key={item.id}
                    className={`${DRAWER_CLASS}__item`}
                    style={{
                      marginBottom: 6,
                      borderLeftColor: tone.accent,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: tone.iconBg,
                            color: tone.iconColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <BellOutlined style={{ fontSize: 15, color: tone.iconColor }} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                color: "#1f2937",
                                fontSize: 12,
                                fontWeight: 700,
                                lineHeight: 1.25,
                                wordBreak: "break-word",
                              }}
                            >
                              {item.message || "Notification"}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                flexWrap: "wrap",
                                color: "#64748b",
                                fontSize: 10,
                                lineHeight: 1.2,
                              }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <CalendarOutlined />
                                <span style={{ color: "#475569", fontWeight: 600 }}>
                                  {timestamp}
                                </span>
                              </span>

                              <Button
                                size="small"
                                className={`${DRAWER_CLASS}__action ${DRAWER_CLASS}__action--primary`}
                                icon={<CheckOutlined />}
                                onClick={() => handleMarkAsRead(item.id)}
                                loading={isMarkingRead}
                              >
                                Mark as read
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          border: "none",
                          padding: "0 8px",
                          backgroundColor: tone.tagBg,
                          color: tone.tagColor,
                          fontSize: 9,
                          fontWeight: 700,
                          lineHeight: "18px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tone.label}
                      </Tag>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {item.checklistId && onOpenChecklist && (
                        <Button
                          size="small"
                          className={`${DRAWER_CLASS}__action ${DRAWER_CLASS}__action--secondary`}
                          icon={<EyeOutlined />}
                          onClick={() => handleOpenChecklist(item)}
                        >
                          View checklist
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.96)",
                borderTop: "1px solid rgba(214, 189, 152, 0.24)",
                backdropFilter: "blur(8px)",
                fontSize: 11,
                color: "#64748b",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>
                  <PaperClipOutlined style={{ marginRight: 6 }} />
                  Unread alerts: <strong>{unreadCount}</strong>
                </span>
                <span style={{ color: "#40534C", fontWeight: 600 }}>
                  {isUpdatingNotifications ? "Updating inbox" : "Review workspace"}
                </span>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
};

export default NotificationBell;
