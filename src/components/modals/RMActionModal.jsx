import { API_BASE_URL } from "../../config/runtimeConfig";
import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Card,
  Upload,
  message,
  Row,
  Col,
  Tag,
  Space,
  Select,
  DatePicker
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  FileOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const INFO_BLUE = "#1890ff";

const { TextArea } = Input;
const { Option } = Select;

const customStyles = `
  .ant-modal-header { background-color: white !important; color: ${PRIMARY_BLUE} !important; }
  .ant-input, .ant-input-textarea { border-radius: 6px !important; }
  .ant-upload-list-item {
    border-radius: 6px !important;
    margin-top: 8px !important;
  }
`;

const RMActionModal = ({ checklist, open, onClose, actionType }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [additionalFiles, setAdditionalFiles] = useState([]);

  useEffect(() => {
    if (checklist && actionType === 'returned') {
      // Pre-fill form for returned items
      form.setFieldsValue({
        generalComment: checklist.creatorComments || ""
      });
    }
  }, [checklist, actionType, form]);

  const handleDocumentUpload = (file, documentId) => {
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploadedFiles(prev => ({
        ...prev,
        [documentId]: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          file: file
        }
      }));
      message.success(`${file.name} uploaded successfully`);
      setUploading(false);
    }, 1000);
    return false; // Prevent default
  };

  const handleAdditionalUpload = (file) => {
    const fileName = file.name || `Supporting_${Date.now()}`;
    const fileWithPreview = {
      uid: file.uid || `additional-${Date.now()}-${Math.random()}`,
      name: fileName,
      size: file.size,
      type: file.type,
      originalFile: file,
      url: URL.createObjectURL(file),
      status: 'done',
      uploadedAt: new Date().toISOString()
    };
   
    setAdditionalFiles((prev) => [...prev, fileWithPreview]);
    message.success(`Supporting file uploaded: ${fileName}`);
    return false;
  };

  const removeAdditionalFile = (file) => {
    setAdditionalFiles((prev) => prev.filter(f => f.uid !== file.uid));
    message.success(`File removed: ${file.name}`);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      // Upload supporting documents if any
      if (additionalFiles && additionalFiles.length > 0) {
        const formData = new FormData();
        additionalFiles.forEach((file) => {
          const fileObj = file.originalFile || file;
          formData.append('files', fileObj);
        });

        const token = localStorage.getItem('authToken') ||
                     (JSON.parse(localStorage.getItem('user') || '{}')?.token);
       
        const response = await fetch(`${API_BASE_URL}/checklist/${checklist.id || checklist._id}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload supporting documents');
        }

        await response.json();
        message.success('Supporting documents uploaded successfully');
      }

      message.success(
        actionType === 'deferral'
          ? "Deferral requested successfully"
          : "Documents submitted to Creator successfully"
      );
     
      setUploading(false);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      message.error(error.message || 'Failed to process your request');
      setUploading(false);
    }
  };

  const getModalTitle = () => {
    if (actionType === 'upload') {
      return "Upload Documents";
    } else if (actionType === 'deferral') {
      return "Request Document Deferral";
    } else if (actionType === 'returned') {
      return "Review Returned Documents";
    }
    return "RM Action";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (fileName, fileType) => {
    if (fileType && fileType !== "FILE") {
      return fileType.toUpperCase();
    }
    if (fileName) {
      const extension = fileName.split('.').pop().toUpperCase();
      return extension === fileName ? 'FILE' : extension;
    }
    return 'FILE';
  };

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={getModalTitle()}
        open={open}
        onCancel={() => !uploading && onClose()}
        width={900}
        centered={false}
        wrapperClassName="modal-centered-in-content"
        footer={[
          <Button key="cancel" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={uploading}
            onClick={() => form.submit()}
          >
            {actionType === 'deferral' ? 'Request Deferral' : 'Submit to Creator'}
          </Button>
        ]}
        closable={!uploading}
        maskClosable={!uploading}
      >
        {uploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            borderRadius: 8,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: PRIMARY_BLUE, marginBottom: 16 }}>
                {actionType === 'deferral' ? 'Submitting deferral request...' : 'Uploading documents...'}
              </div>
            </div>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={uploading}
        >
          {/* Checklist Info */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 'bold', color: PRIMARY_BLUE, fontSize: 16 }}>
                  {checklist?.dclNo} - {checklist?.title}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Customer: {checklist?.customerName} ({checklist?.customerNumber}) •
                  Loan Type: {checklist?.loanType}
                </div>
              </div>
              <Tag color={PRIMARY_BLUE} style={{ fontWeight: 'bold', fontSize: 12 }}>
                {actionType === 'returned' ? 'Returned for Re-upload' : 'Pending Upload'}
              </Tag>
            </div>
          </Card>

          {/* Creator Comments for returned items */}
          {actionType === 'returned' && checklist?.creatorComments && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: ERROR_RED, marginBottom: 8, fontSize: 14 }}>
                Creator's Feedback
              </h4>
              <Card
                size="small"
                style={{
                  background: '#fff2f0',
                  borderColor: ERROR_RED + '30',
                  fontSize: 13
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ color: ERROR_RED, fontWeight: 'bold' }}>⚠️</div>
                  <div>{checklist.creatorComments}</div>
                </div>
              </Card>
            </div>
          )}

          {/* Documents List */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: PRIMARY_BLUE, marginBottom: 12, fontSize: 15 }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              Required Documents
            </h4>
           
            {checklist?.documents?.map((category, catIndex) => (
              <div key={catIndex} style={{ marginBottom: 20 }}>
                <div style={{
                  padding: "10px 12px",
                  background: "#f0f5ff",
                  borderRadius: 6,
                  marginBottom: 10,
                  fontWeight: 600,
                  color: PRIMARY_BLUE,
                  fontSize: 14
                }}>
                  {category.category}
                </div>
               
                {category.docList.map((doc) => {
                  const isUploaded = uploadedFiles[doc.id || doc._id] || doc.status === 'uploaded';
                  const isDeferred = doc.status === 'deferred';
                 
                  return (
                    <Card
                      key={doc.id || doc._id}
                      size="small"
                      style={{
                        marginBottom: 10,
                        borderLeft: `4px solid ${
                          isUploaded ? SUCCESS_GREEN :
                          isDeferred ? WARNING_ORANGE :
                          ERROR_RED
                        }`
                      }}
                    >
                      <Row gutter={16} align="middle">
                        <Col span={12}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                              {doc.name}
                              {doc.required && (
                                <Tag color="red" style={{ marginLeft: 8, fontSize: 10, padding: '0 6px' }}>
                                  Required
                                </Tag>
                              )}
                            </div>
                            {doc.description && (
                              <div style={{ fontSize: 12, color: '#666' }}>{doc.description}</div>
                            )}
                            {isDeferred && doc.deferralReason && (
                              <div style={{ fontSize: 11, color: WARNING_ORANGE, marginTop: 6,
                                background: '#fff7e6', padding: '4px 8px', borderRadius: 4 }}>
                                ⏳ Deferred: {doc.deferralReason}
                              </div>
                            )}
                          </div>
                        </Col>
                       
                        <Col span={12}>
                          {actionType !== 'deferral' ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <Upload
                                beforeUpload={(file) => handleDocumentUpload(file, doc.id || doc._id)}
                                showUploadList={false}
                                disabled={uploading}
                              >
                                <Button
                                  icon={<UploadOutlined />}
                                  size="middle"
                                  disabled={uploading}
                                  style={{
                                    background: isUploaded ? SUCCESS_GREEN : PRIMARY_BLUE,
                                    borderColor: isUploaded ? SUCCESS_GREEN : PRIMARY_BLUE
                                  }}
                                >
                                  {isUploaded ? 'Re-upload' : 'Upload'}
                                </Button>
                              </Upload>
                             
                              {isUploaded && (
                                <div style={{ fontSize: 12 }}>
                                  <Tag color="green" style={{ marginRight: 4 }}>
                                    ✓ Uploaded
                                  </Tag>
                                  <span style={{ color: '#666' }}>
                                    {uploadedFiles[doc.id || doc._id]?.name || 'File uploaded'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Form.Item
                              name={`deferralReason_${doc.id || doc._id}`}
                              label="Deferral Reason"
                              style={{ marginBottom: 0 }}
                              rules={[{ required: true, message: 'Please enter deferral reason' }]}
                            >
                              <TextArea
                                placeholder="Why do you need to defer this document?"
                                rows={2}
                                disabled={uploading}
                                defaultValue={doc.deferralReason || ""}
                              />
                            </Form.Item>
                          )}
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>

          {/* General Comments */}
          <Form.Item
            name="generalComment"
            label="General Comments"
            rules={[{ required: actionType !== 'deferral', message: 'Please enter your comments' }]}
          >
            <TextArea
              rows={3}
              placeholder="Add any general comments about this submission..."
              disabled={uploading}
            />
          </Form.Item>

          {/* Deferral Specific Fields */}
          {actionType === 'deferral' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="deferralExpiry"
                    label="Defer Until"
                    rules={[{ required: true, message: 'Please select deferral expiry date' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      disabled={uploading}
                      disabledDate={(current) => {
                        return current && current < dayjs().startOf('day');
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="deferralPriority"
                    label="Deferral Priority"
                    rules={[{ required: true, message: 'Please select priority' }]}
                  >
                    <Select placeholder="Select priority" disabled={uploading}>
                      <Option value="low">Low</Option>
                      <Option value="medium">Medium</Option>
                      <Option value="high">High</Option>
                      <Option value="critical">Critical</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
             
              <Form.Item
                name="alternativeDocuments"
                label="Alternative Documents (if any)"
              >
                <TextArea
                  rows={2}
                  placeholder="List any alternative documents provided instead..."
                  disabled={uploading}
                />
              </Form.Item>
            </>
          )}

          {/* Additional Supporting Documents */}
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <h4 style={{ color: PRIMARY_BLUE, marginBottom: 8, fontSize: 14 }}>
              <PaperClipOutlined style={{ marginRight: 8 }} />
              Additional Supporting Documents
            </h4>
            <div style={{
              fontSize: 12,
              color: "#666",
              marginBottom: 12,
              padding: "8px 12px",
              background: "#f5f5f5",
              borderRadius: 4
            }}>
              Upload any supporting documents not included in the original checklist
            </div>
          </div>

          <Upload
            beforeUpload={handleAdditionalUpload}
            multiple={true}
            showUploadList={false}
            disabled={uploading}
          >
            <Button
              icon={<UploadOutlined />}
              disabled={uploading}
              style={{ marginBottom: 12 }}
            >
              Click to Upload Supporting Documents
            </Button>
          </Upload>

          {/* Show uploaded supporting files */}
          {additionalFiles.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: "16px",
              background: "#f8f9fa",
              borderRadius: 6,
              border: "1px solid #e9ecef"
            }}>
              <div style={{
                color: PRIMARY_BLUE,
                fontWeight: 600,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PaperClipOutlined />
                  <span>Supporting Documents ({additionalFiles.length})</span>
                </div>
                <Tag color="blue" style={{ fontWeight: 500 }}>
                  {additionalFiles.length} file{additionalFiles.length !== 1 ? 's' : ''}
                </Tag>
              </div>
             
              <div style={{
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: 4
              }}>
                {additionalFiles.map((file, index) => {
                  const fileType = getFileType(file.name, file.type);
                  const fileSize = formatFileSize(file.size);
                  const uploadTime = file.uploadedAt
                    ? dayjs(file.uploadedAt).format('HH:mm')
                    : 'Just now';
                 
                  return (
                    <div
                      key={file.uid || index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        marginBottom: 8,
                        background: "white",
                        borderRadius: 4,
                        border: "1px solid #dee2e6",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 4,
                          background: PRIMARY_BLUE + "15",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <FileOutlined style={{ color: PRIMARY_BLUE, fontSize: 18 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 600,
                            color: "#333",
                            fontSize: 14,
                            marginBottom: 2
                          }}>
                            {file.name || `Document ${index + 1}`}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: "#6c757d",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: 'wrap'
                          }}>
                            {fileSize !== "0 Bytes" && (
                              <>
                                <span>{fileSize}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>Type: {fileType}</span>
                            <span>•</span>
                            <span>Uploaded: {uploadTime}</span>
                          </div>
                        </div>
                      </div>
                     
                      <Space size={8}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            if (file.url) {
                              window.open(file.url, "_blank");
                            } else {
                              message.warning(`Preview not available for ${file.name}`);
                            }
                          }}
                          disabled={uploading || !file.url}
                          title="Preview file"
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            if (file.url) {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name || `document_${index + 1}`;
                              link.click();
                              message.success(`Downloading ${file.name || 'document'}`);
                            }
                          }}
                          disabled={uploading || !file.url}
                          title="Download file"
                        />
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeAdditionalFile(file)}
                          disabled={uploading}
                          title="Remove file"
                        />
                      </Space>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default RMActionModal;