import React, { useMemo ,useState,useRef,useCallback} from "react";
import { Drawer, Input, Empty, Select, Form, Button, Typography, Space, Spin, Avatar, Divider, Tag } from "antd";
import { UserAddOutlined, SearchOutlined, CheckCircleFilled, IdcardOutlined, MailOutlined, TeamOutlined } from "@ant-design/icons";
import {useLazySearchAdUsersQuery} from "../../api/adSearchApi";

const { Title, Text } = Typography;

const roleOptions = [
  { value: "rm", label: "Relationship Manager" },
  { value: "cocreator", label: "CO Creator" },
  { value: "cochecker", label: "CO Checker" },
  { value: "admin", label: "System Administrator" },
  { value: "internalcontrols", label: "Internal Controls" },
];



const CreateUserDrawer = ({
  visible = false,
  loading = false,
  formData = {},
  setFormData = () => {},
  onCreate = () => {},
  onClose = () => {},
}) => {
  const roles = useMemo(() => roleOptions, []);

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchOptions, setSearchOptions] = useState([]);
  const debounceRef = useRef(null);
 
  // RTK Query lazy hook
  const [triggerSearch, { isFetching: searching }] = useLazySearchAdUsersQuery();
 
const handleClose = () => {
  setSearchOptions([]);
  setSelectedUser(null);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  onClose();
};
 
  // Debounced AD search via RTK Query
  const handleSearch = useCallback(
    (query) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
 
      if (!query || query.trim().length < 2) {
        setSearchOptions([]);
        return;
      }
 
      debounceRef.current = setTimeout(async () => {
        try {
          // second arg `true` enables cache subscription so RTKQ dedupes
          const users = await triggerSearch(query.trim(), true).unwrap();
          const options = (users || []).map((u) => ({
            value: u.samAccountName,
            label: u.displayName,
            user: u,
          }));
          setSearchOptions(options);
        } catch (err) {
          console.error("AD search failed", err);
          setSearchOptions([]);
        }
      }, 350);
    },
    [triggerSearch]
  );
 
  const handleSelectUser = (samAccountName, option) => {
    const u = option?.user;
    if (!u) return;
 
    setSelectedUser(u);
    setFormData({
      ...formData,
      name: u.displayName,
      email: u.email,
      samAccountName: u.samAccountName,
      department: u.department,
      title: u.title,
      phone: u.phone,
      role: formData?.role || "rm",
    });
  };
 
  const handleClear = () => {
    setSelectedUser(null);
    setSearchOptions([]);
    setFormData({ role: formData?.role || "rm" });
  };
 
  const renderOption = (option) => {
    const u = option.user;
    return (
      <div style={{ padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={32}
            style={{
              background: "linear-gradient(135deg, #2d7a99 0%, #164679 100%)",
              flexShrink: 0,
            }}
          >
            {u.displayName?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#1f2937",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {u.displayName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {u.email}
              {u.department ? ` • ${u.department}` : ""}
            </div>
          </div>
        </div>
      </div>
    );
  };
 
  const handleSubmit = () => {
    if (!selectedUser) return;
    onCreate();
  };
 

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #2d7a99 0%, #164679 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserAddOutlined style={{ color: "white", fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
              Create New User
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Add a new user to the system
            </Text>
          </div>
        </div>
      }
      placement="right"
      width={420}
      open={visible}
      onClose={handleClose}
      styles={{
        body: {
          paddingBottom: 100,
          background: "#f5f7fa",
        },
        header: {
          background: "linear-gradient(135deg, #164679 0%, #2d7a99 100%)",
          borderBottom: "1px solid #e0e7ff",
          padding: "16px 24px",
        },
        title: {
          color: "white",
        },
      }}
      headerStyle={{
        background: "linear-gradient(135deg, #164679 0%, #2d7a99 100%)",
        borderBottom: "1px solid #4a90c4",
      }}
    >
       <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={
            <Text strong style={{ color: "#374151" }}>
              Search Active Directory
            </Text>
          }
          required
        >
          <Select
            showSearch
            size="large"
            placeholder="Type a name, email, or username..."
            filterOption={false}
            onSearch={handleSearch}
            onSelect={handleSelectUser}
            onClear={handleClear}
            allowClear
            value={selectedUser?.samAccountName || undefined}
            notFoundContent={
              searching ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <Spin size="small" />{" "}
                  <Text type="secondary">Searching directory...</Text>
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Type at least 2 characters to search"
                />
              )
            }
            options={searchOptions}
            optionRender={(option) => renderOption(option.data)}
            suffixIcon={<SearchOutlined style={{ color: "#9ca3af" }} />}
            style={{ width: "100%" }}
          />
          <Text
            type="secondary"
            style={{ fontSize: 11, marginTop: 4, display: "block" }}
          >
            Users authenticate with their AD credentials—no password needed.
          </Text>
        </Form.Item>
 
        {selectedUser && (
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Avatar
                size={48}
                style={{
                  background:
                    "linear-gradient(135deg, #2d7a99 0%, #164679 100%)",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {selectedUser.displayName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <Text strong style={{ fontSize: 15, color: "#1f2937" }}>
                    {selectedUser.displayName}
                  </Text>
                  <CheckCircleFilled
                    style={{ color: "#10b981", fontSize: 14 }}
                  />
                </div>
                {selectedUser.title && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedUser.title}
                  </Text>
                )}
              </div>
            </div>
 
            <Divider style={{ margin: "8px 0 12px" }} />
 
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <IdcardOutlined style={{ color: "#6b7280" }} />
                <Text type="secondary" style={{ fontSize: 12 }}>Username:</Text>
                <Text style={{ fontSize: 13 }}>{selectedUser.samAccountName}</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <MailOutlined style={{ color: "#6b7280" }} />
                <Text type="secondary" style={{ fontSize: 12 }}>Email:</Text>
                <Text style={{ fontSize: 13 }}>{selectedUser.email}</Text>
              </div>
              {selectedUser.department && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <TeamOutlined style={{ color: "#6b7280" }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>Department:</Text>
                  <Text style={{ fontSize: 13 }}>{selectedUser.department}</Text>
                </div>
              )}
            </Space>
 
            {selectedUser.isEnabled === false && (
              <Tag color="warning" style={{ marginTop: 10 }}>
                AD account is disabled
              </Tag>
            )}
          </div>
        )}
 
        {selectedUser && (
          <Form.Item
            label={
              <Text strong style={{ color: "#374151" }}>
                Assign Role
              </Text>
            }
            required
          >
            <Select
              size="large"
              value={formData?.role || "rm"}
              onChange={(value) => setFormData({ ...formData, role: value })}
              options={roles}
              placeholder="Select user role"
            />
          </Form.Item>
        )}
 
        <Space style={{ width: "100%", marginTop: "24px" }}>
          <Button onClick={onClose} size="large" style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            htmlType="submit"
            type="primary"
            size="large"
            loading={loading}
            disabled={!selectedUser}
            style={{
              flex: 1,
              background: selectedUser
                ? "linear-gradient(135deg, #2d7a99 0%, #164679 100%)"
                : undefined,
              border: "none",
              fontWeight: 600,
            }}
          >
            Add User
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};

export default CreateUserDrawer;
