import React, { useMemo } from "react";
import { Drawer, Tag, Button, Upload } from "antd";
import {
  CalendarOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  PaperClipOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { formatDateTime, getFullUrl as resolveFullUrl } from "../../../utils/checklistUtils";
import "../../../styles/creatorDesignSystem.css";

const DRAWER_CLASS = "creator-review-document-sidebar";

const DocumentSidebar = ({
  documents = [],
  supportingDocs = [],
  open,
  onClose,
  getFullUrl,
  onUploadSupportingDoc,
  readOnly = false,
}) => {
  const buildFullUrl = getFullUrl || resolveFullUrl;

  const getRoleLabel = (role) => {
    const normalizedRole = String(role || "").trim().toLowerCase();

    switch (normalizedRole) {
      case "rm":
      case "admin":
        return "RM";
      case "cocreator":
      case "co_creator":
      case "co creator":
        return "CO Creator";
      case "checker":
      case "cochecker":
      case "co_checker":
      case "co checker":
        return "CO Checker";
      default:
        return role || "Unknown role";
    }
  };

  const getRoleTone = (role) => {
    const normalizedRole = String(role || "").trim().toLowerCase();

    if (normalizedRole === "rm" || normalizedRole === "admin") {
      return { bg: "#FFF7E6", color: "#B45309", text: "RM" };
    }

    if (["cocreator", "co_creator", "co creator"].includes(normalizedRole)) {
      return {
        bg: "rgba(214, 189, 152, 0.22)",
        color: "#6B4F36",
        text: "CO Creator",
      };
    }

    if (["checker", "cochecker", "co_checker", "co checker"].includes(normalizedRole)) {
      return {
        bg: "rgba(26, 54, 54, 0.12)",
        color: "#1A3636",
        text: "CO Checker",
      };
    }

    return {
      bg: "rgba(148, 163, 184, 0.18)",
      color: "#475569",
      text: getRoleLabel(role),
    };
  };

  const getFileIcon = (fileName) => {
    if (!fileName) {
      return <FileOutlined style={{ fontSize: 15, color: "#1A3636" }} />;
    }

    const extension = fileName.split(".").pop().toLowerCase();

    if (extension === "pdf") {
      return <FileOutlined style={{ fontSize: 15, color: "#DC2626" }} />;
    }

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return <FileOutlined style={{ fontSize: 15, color: "#15803D" }} />;
    }

    if (["doc", "docx"].includes(extension)) {
      return <FileOutlined style={{ fontSize: 15, color: "#2563EB" }} />;
    }

    if (["xls", "xlsx", "csv"].includes(extension)) {
      return <FileOutlined style={{ fontSize: 15, color: "#CA8A04" }} />;
    }

    return <FileOutlined style={{ fontSize: 15, color: "#1A3636" }} />;
  };

  const resolveUploaderInfo = (doc) => {
    const extractName = (value) => {
      if (!value) return null;
      if (typeof value === "string") return value;
      return value.name || value.fullName || value.userName || null;
    };

    const extractRole = (value) => {
      if (!value) return null;
      if (typeof value === "string") return value;
      return value.role || value.userRole || null;
    };

    const uploadedBy =
      extractName(doc.uploadedBy) ||
      doc.uploadedByName ||
      doc.uploaderName ||
      extractName(doc.user) ||
      extractName(doc.uploadData?.uploadedBy) ||
      doc.uploadData?.uploadedByName ||
      doc.uploadData?.userName ||
      extractName(doc.createdBy) ||
      doc.userName ||
      null;

    const uploadedByRole =
      doc.uploadedByRole ||
      extractRole(doc.uploadedBy) ||
      extractRole(doc.user) ||
      doc.uploadData?.uploadedByRole ||
      extractRole(doc.uploadData?.uploadedBy) ||
      extractRole(doc.createdBy) ||
      doc.role ||
      null;

    return { uploadedBy, uploadedByRole };
  };

  const resolveUploadDate = (doc) => {
    return (
      doc.uploadedAt ||
      doc.uploadDate ||
      doc.createdAt ||
      doc.updatedAt ||
      doc.uploadData?.uploadedAt ||
      doc.uploadData?.createdAt ||
      doc.uploadData?.updatedAt ||
      null
    );
  };

  const handleDownloadFile = (fileName, fileUrl) => {
    try {
      const resolvedUrl = buildFullUrl(fileUrl);
      const link = document.createElement("a");
      link.href = resolvedUrl;
      link.download = fileName || "document";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const allDocs = useMemo(() => {
    const processedDocs = documents
      .filter(
        (doc) =>
          (doc.uploadData && doc.uploadData.status !== "deleted") || doc.fileUrl,
      )
      .map((doc, index) => {
        const uploaderInfo = resolveUploaderInfo(doc);
        const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl;
        const fallbackFileName = fileUrl ? fileUrl.split("/").pop() : null;

        return {
          id: doc.id || doc._id || `main-${index}`,
          title: doc.name || `Document ${index + 1}`,
          category: doc.category || "Main Documents",
          fileName:
            doc.fileName ||
            doc.uploadData?.fileName ||
            fallbackFileName ||
            doc.name ||
            `Document ${index + 1}`,
          fileUrl,
          uploadedBy: uploaderInfo.uploadedBy,
          uploadedByRole: uploaderInfo.uploadedByRole,
          uploadDate: resolveUploadDate(doc),
          modifiedDate: doc.modifiedDate || doc.updatedAt || null,
          isSupporting: false,
        };
      });

    const processedSupportingDocs = supportingDocs.map((doc, index) => {
      const uploaderInfo = resolveUploaderInfo(doc);

      return {
        id: doc.id || doc._id || `support-${index}`,
        title: doc.fileName || doc.name || `Supporting Doc ${index + 1}`,
        category: doc.category || "Supporting Documents",
        fileName: doc.fileName || doc.name || `Supporting Doc ${index + 1}`,
        fileUrl: doc.fileUrl,
        uploadedBy: uploaderInfo.uploadedBy,
        uploadedByRole: uploaderInfo.uploadedByRole,
        uploadDate: resolveUploadDate(doc),
        modifiedDate: doc.modifiedDate || doc.updatedAt || null,
        isSupporting: true,
      };
    });

    return [...processedDocs, ...processedSupportingDocs];
  }, [documents, supportingDocs]);

  const groupedDocs = useMemo(() => {
    return allDocs.reduce((accumulator, doc) => {
      const group = doc.category || "Main Documents";
      if (!accumulator[group]) {
        accumulator[group] = [];
      }
      accumulator[group].push(doc);
      return accumulator;
    }, {});
  }, [allDocs]);

  return (
    <>
      <style>{`
        .${DRAWER_CLASS}.ant-drawer {
          z-index: 2000 !important;
        }
        .${DRAWER_CLASS} .ant-drawer-mask {
          z-index: 1999 !important;
        }
        .${DRAWER_CLASS} .ant-drawer-content {
          background: linear-gradient(180deg, rgba(250, 248, 244, 0.98) 0%, #f7f4ef 100%) !important;
        }
        .${DRAWER_CLASS} .ant-drawer-header {
          padding: 16px 18px 14px !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
        }
        .${DRAWER_CLASS} .ant-drawer-body {
          padding: 12px !important;
        }
        .${DRAWER_CLASS} .ant-drawer-close {
          width: 34px !important;
          height: 34px !important;
          border-radius: 999px !important;
          background: rgba(255, 255, 255, 0.12) !important;
          color: #fff !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .${DRAWER_CLASS} .ant-drawer-close:hover,
        .${DRAWER_CLASS} .ant-drawer-close:focus {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #fff !important;
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
          padding: 8px 10px 9px;
        }
        .${DRAWER_CLASS}__item--supporting {
          border-left-color: #D6BD98;
        }
        .${DRAWER_CLASS}__action.ant-btn,
        .${DRAWER_CLASS}__action.ant-btn:hover,
        .${DRAWER_CLASS}__action.ant-btn:focus,
        .${DRAWER_CLASS}__action.ant-btn:active {
          min-height: 24px !important;
          height: 24px !important;
          border-radius: 5px !important;
          padding: 0 8px !important;
          font-size: 9px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .${DRAWER_CLASS}__action.ant-btn .anticon {
          font-size: 11px !important;
        }
        .${DRAWER_CLASS}__action--view.ant-btn,
        .${DRAWER_CLASS}__action--view.ant-btn:hover,
        .${DRAWER_CLASS}__action--view.ant-btn:focus,
        .${DRAWER_CLASS}__action--view.ant-btn:active {
          background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
          border: none !important;
          color: #fff !important;
        }
        .${DRAWER_CLASS}__action--download.ant-btn,
        .${DRAWER_CLASS}__action--download.ant-btn:hover,
        .${DRAWER_CLASS}__action--download.ant-btn:focus,
        .${DRAWER_CLASS}__action--download.ant-btn:active {
          background: #fff !important;
          border: 1px solid rgba(214, 189, 152, 0.38) !important;
          color: var(--color-text-dark) !important;
        }
        .${DRAWER_CLASS}__empty {
          padding: 36px 18px;
          border-radius: 14px;
          border: 1px dashed rgba(214, 189, 152, 0.4);
          background: rgba(255, 255, 255, 0.72);
          text-align: center;
          color: var(--color-text-light);
        }
      `}</style>

      <Drawer
        className={DRAWER_CLASS}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Documents</span>
              <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 11 }}>
                Uploaded checklist and supporting files
              </span>
            </div>
            <Tag className={`${DRAWER_CLASS}__badge`}>{allDocs.length}</Tag>
          </div>
        }
        placement="right"
        width={400}
        open={open}
        onClose={onClose}
        zIndex={1100}
        mask={false}
      >
        {!readOnly && onUploadSupportingDoc && (
          <div style={{ marginBottom: 10 }}>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadSupportingDoc(file);
                return false;
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="small"
                block
                style={{
                  background: "linear-gradient(135deg, #1A3636 0%, #40534C 100%)",
                  borderColor: "transparent",
                  fontSize: "10px",
                  height: "26px",
                }}
              >
                Upload
              </Button>
            </Upload>
          </div>
        )}

        <div
          style={{
            maxHeight: "calc(100vh - 112px)",
            overflowY: "auto",
            paddingBottom: allDocs.length > 0 ? 50 : 0,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 6,
                  color: "var(--color-text-dark)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <span>{category}</span>
                <span style={{ color: "var(--color-text-light)", fontSize: 10, fontWeight: 600 }}>
                  {docs.length} file{docs.length === 1 ? "" : "s"}
                </span>
              </div>

              {docs.map((doc) => {
                const roleTone = getRoleTone(doc.uploadedByRole);
                const uploadLabel = formatDateTime(doc.uploadDate || doc.modifiedDate) || "Not available";
                const uploaderName = doc.uploadedBy || "Unknown User";
                const uploaderRole = getRoleLabel(doc.uploadedByRole);

                return (
                  <div
                    key={doc.id}
                    className={`${DRAWER_CLASS}__item ${doc.isSupporting ? `${DRAWER_CLASS}__item--supporting` : ""}`}
                    style={{ marginBottom: 4 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: doc.isSupporting ? "rgba(214, 189, 152, 0.18)" : "rgba(26, 54, 54, 0.08)",
                            color: doc.isSupporting ? "#6B4F36" : "#1A3636",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {getFileIcon(doc.fileName || doc.title)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              color: "var(--color-text-dark)",
                              fontSize: 12,
                              fontWeight: 700,
                              lineHeight: 1.25,
                              wordBreak: "break-word",
                            }}
                          >
                            {doc.fileName || doc.title}
                          </div>
                        </div>
                      </div>

                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          border: "none",
                          padding: "0 8px",
                          backgroundColor: roleTone.bg,
                          color: roleTone.color,
                          fontSize: 9,
                          fontWeight: 700,
                          lineHeight: "18px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {roleTone.text}
                      </Tag>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 8,
                        color: "var(--color-text-light)",
                        fontSize: 10,
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                        <UserOutlined />
                        <span style={{ color: "var(--color-text-dark)", fontWeight: 600, wordBreak: "break-word" }}>
                          {uploaderName}
                        </span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <TeamOutlined />
                        <span style={{ color: "var(--color-text-dark)", fontWeight: 600 }}>
                          {uploaderRole}
                        </span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CalendarOutlined />
                        <span style={{ color: "var(--color-text-dark)", fontWeight: 600 }}>
                          {uploadLabel}
                        </span>
                      </span>
                    </div>

                    {doc.fileUrl && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          className={`${DRAWER_CLASS}__action ${DRAWER_CLASS}__action--view`}
                          icon={<EyeOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            try {
                              window.open(buildFullUrl(doc.fileUrl), "_blank");
                            } catch (error) {
                              console.error("Error opening file:", error);
                            }
                          }}
                        >
                          View
                        </Button>

                        <Button
                          size="small"
                          className={`${DRAWER_CLASS}__action ${DRAWER_CLASS}__action--download`}
                          icon={<DownloadOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownloadFile(doc.fileName || "document", doc.fileUrl);
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {allDocs.length === 0 && (
            <div className={`${DRAWER_CLASS}__empty`} onClick={(event) => event.stopPropagation()}>
              <FileOutlined style={{ fontSize: 30, marginBottom: 10, opacity: 0.55 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-dark)" }}>
                No documents available
              </div>
              <div style={{ marginTop: 6, fontSize: 11 }}>
                Uploads added to the checklist will appear here.
              </div>
            </div>
          )}
        </div>

        {allDocs.length > 0 && (
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
              color: "var(--color-text-medium)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>
                <PaperClipOutlined style={{ marginRight: 6 }} />
                Total files: <strong>{allDocs.length}</strong>
              </span>
              <span style={{ color: "var(--color-primary-medium)", fontWeight: 600 }}>
                Review workspace
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default DocumentSidebar;