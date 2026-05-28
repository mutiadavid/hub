import React, { useMemo } from "react";
import { Drawer, Card, Tag, Button } from "antd";
import { DownloadOutlined, EyeOutlined, FileOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { API_ORIGIN } from "../../config/runtimeConfig";
import { openFileInNewTab, downloadFile } from "../../utils/fileUtils";

const API_BASE_URL = API_ORIGIN;

const DocumentSidebar = ({ documents, open, onClose, supportingDocs = [] }) => {
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileOutlined style={{ fontSize: "11px" }} />;
    const ext = fileName.split(".").pop().toLowerCase();

    if (ext === "pdf")
      return <FileOutlined style={{ fontSize: "11px", color: "#FF4D4F" }} />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext))
      return <FileOutlined style={{ fontSize: "11px", color: "#52C41A" }} />;
    if (["doc", "docx"].includes(ext))
      return <FileOutlined style={{ fontSize: "11px", color: "#1890FF" }} />;
    if (["xls", "xlsx"].includes(ext))
      return <FileOutlined style={{ fontSize: "11px", color: "#FAAD14" }} />;
    return <FileOutlined style={{ fontSize: "11px" }} />;
  };

  const getRoleColor = (role) => {
    if (!role) return "default";
    const roleLower = role.toLowerCase();
    if (roleLower === "rm" || roleLower === "admin")
      return { bg: "#FFF7E6", color: "#FA8C16", text: "RM" };
    if (roleLower === "cocreator" || roleLower === "co_creator")
      return { bg: "#E6F7FF", color: "#1890FF", text: "CO" };
    if (roleLower === "checker" || roleLower === "cochecker")
      return { bg: "#F9F0FF", color: "#722ED1", text: "Checker" };
    return { bg: "#F5F5F5", color: "#8C8C8C", text: role };
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm");
  };

  const allDocs = useMemo(() => {
    // Include ALL documents - those with uploads, fileUrl, OR newly added ones
    const uploadedDocs = documents.filter(
      (d) =>
        (d.uploadData && d.uploadData.status !== "deleted") ||
        d.fileUrl ||
        d.isNew,
    );

    // Combine with supporting docs
    return [...uploadedDocs, ...supportingDocs];
  }, [documents, supportingDocs]);

  const groupedDocs = useMemo(() => {
    return allDocs.reduce((acc, doc) => {
      const group = doc.category || "Main Documents";
      if (!acc[group]) acc[group] = [];
      acc[group].push(doc);
      return acc;
    }, {});
  }, [allDocs]);

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  return (
    <Drawer
      title={
        <div
          className="document-drawer-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "12px", color: "white" }}>
            Documents
          </span>
          <Tag
            className="document-drawer-badge"
            style={{ margin: 0, fontSize: "10px" }}
          >
            {allDocs.length}
          </Tag>
        </div>
      }
      placement="right"
      width={380}
      open={open}
      onClose={onClose}
      zIndex={1100}
      mask={false}
      styles={{
        header: {
          borderBottom: "1px solid #b5d334",
          padding: "10px 14px",
          background: "#164679",
        },
        body: { padding: "6px 10px", backgroundColor: "#FAFAFA" },
      }}
    >
      {allDocs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px 12px",
            color: "#8C8C8C",
            fontSize: "11px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <FileOutlined
            style={{ fontSize: "28px", marginBottom: 6, opacity: 0.5 }}
          />
          <div>No documents</div>
        </div>
      ) : (
        <div
          style={{ maxHeight: "calc(125vh - 100px)", overflowY: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category} style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#595959",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {category} ({docs.length})
              </div>

              {docs.map((doc, idx) => {
                const uploadData = doc.uploadData || doc;
                const fileName = uploadData.fileName || doc.name;
                const uploadDate =
                  uploadData.createdAt ||
                  uploadData.uploadDate ||
                  doc.uploadedAt;

                // Extract uploadedBy with better fallback logic
                const uploadedBy =
                  uploadData.uploadedBy?.name ||
                  uploadData.uploadedBy ||
                  doc.uploadedBy?.name ||
                  doc.uploadedBy ||
                  null;

                const role = uploadData.uploadedByRole || doc.uploadedByRole;
                const fileUrl = uploadData.fileUrl || doc.fileUrl;
                const roleStyle = getRoleColor(role);

                return (
                  <Card
                    key={idx}
                    size="small"
                    style={{
                      marginBottom: 4,
                      borderLeft: doc.isNew
                        ? "2px solid #b5d334"
                        : "2px solid #164679",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      fontSize: "10px",
                    }}
                    bodyStyle={{ padding: "6px 8px" }}
                  >
                    {/* Document Name */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginBottom: 4,
                        fontWeight: 500,
                        color: "#262626",
                        fontSize: "10px",
                      }}
                    >
                      {getFileIcon(fileName)}
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fileName}
                      </span>
                      {doc.isNew && (
                        <Tag
                          color="lime"
                          style={{ fontSize: "8px", margin: 0 }}
                        >
                          New
                        </Tag>
                      )}
                    </div>

                    {/* Upload Date & Time */}
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#8C8C8C",
                        marginBottom: 3,
                      }}
                    >
                      📅 {formatDateTime(uploadDate)}
                    </div>

                    {/* Uploader & Role */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        minHeight: "18px",
                      }}
                    >
                      <div style={{ fontSize: "9px", color: "#595959" }}>
                        👤 {uploadedBy || "System"}
                      </div>
                      {role && (
                        <Tag
                          style={{
                            margin: 0,
                            fontSize: "8px",
                            padding: "0 5px",
                            height: "16px",
                            lineHeight: "16px",
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.color,
                            border: "none",
                            fontWeight: 500,
                          }}
                        >
                          {roleStyle.text}
                        </Tag>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {fileUrl && (
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          marginTop: 3,
                        }}
                      >
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          style={{
                            padding: "0 6px",
                            fontSize: "9px",
                            height: "20px",
                            color: "#164679",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openFileInNewTab(fileUrl);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          style={{
                            padding: "0 6px",
                            fontSize: "9px",
                            height: "20px",
                            color: "#52C41A",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(fileUrl, fileName);
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      {allDocs.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "6px 10px",
            backgroundColor: "#F5F5F5",
            borderTop: "1px solid #E8E8E8",
            fontSize: "9px",
            color: "#595959",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Total: <strong>{allDocs.length}</strong>
            </span>
            <span style={{ color: "#52C41A" }}>● Active</span>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default DocumentSidebar;