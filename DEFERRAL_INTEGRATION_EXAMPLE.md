# Deferral Component Integration Example

## How to Use Extracted Modules in Your Main Component

This guide shows practical examples of how to replace the old monolithic code with the new modular architecture.

---

## 🔄 Before & After Comparison

### BEFORE: Large Component with Inline Functions
```javascript
// src/pages/checker/Deferral.jsx (5,192 lines!)
const Deferrals = () => {
  const [deferrals, setDeferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ ... });
  const [activeTab, setActiveTab] = useState("pending");
  const [filteredDeferrals, setFilteredDeferrals] = useState([]);
  
  // 40+ internal functions defined here
  const fetchDeferrals = async () => { /* 100+ lines */ };
  const applyFilters = () => { /* 150+ lines */ };
  const handleApproveDeferral = async () => { /* 80+ lines */ };
  const handleRejectDeferral = async () => { /* 120+ lines */ };
  // ... many more functions
  
  // Massive JSX return with nested components
  return (
    <div>
      {/* 2000+ lines of JSX */}
    </div>
  );
};
```

### AFTER: Clean Component Using Hooks
```javascript
// src/pages/checker/Deferral.jsx (~1,000 lines)
import { useDeferralData } from "../../hooks/useDeferralData";
import { useDeferralActions } from "../../hooks/useDeferralActions";
import { useDeferralFilters } from "../../hooks/useDeferralFilters";
import { getToken, getCurrentUser } from "../../hooks/useDeferralData";
import CommentTrail from "../../components/checker/CommentTrail";
import DeferralStatusAlert from "../../components/checker/DeferralStatusAlert";

const Deferrals = () => {
  // All data and logic now in hooks!
  const { deferrals, loading, loadDeferrals } = useDeferralData();
  const { 
    filters, 
    activeTab, 
    filteredDeferrals,
    setActiveTab,
    setSearchFilter,
  } = useDeferralFilters(deferrals);
  const { 
    handleApproveDeferral,
    handleRejectDeferral,
    handleReturnForRework,
  } = useDeferralActions(token, loadDeferrals);
  
  // Simple component logic
  useEffect(() => {
    loadDeferrals();
  }, [loadDeferrals]);
  
  return (
    // Simplified JSX using extracted components
    <DeferralFilters ... />
    <DeferralTable ... />
    <DeferralModal ... />
  );
};
```

---

## 📖 Integration Guide by Section

### 1️⃣ Data Management

#### What Moved
- `useState` for deferrals → `useDeferralData()`
- `useState` for filters → `useDeferralFilters()`
- `useState` for loading → `useDeferralData()`

#### Integration Example
```javascript
import { useDeferralData } from "../../hooks/useDeferralData";
import { useDeferralFilters } from "../../hooks/useDeferralFilters";

const Deferrals = () => {
  // Instead of:
  // const [deferrals, setDeferrals] = useState([]);
  // const [loading, setLoading] = useState(false);
  // const fetchDeferrals = async () => { ... };
  
  // Now do:
  const { deferrals, loading, loadDeferrals } = useDeferralData();
  const { 
    filters, 
    filteredDeferrals, 
    activeTab,
    applyFilters,
  } = useDeferralFilters(deferrals);
  
  // Initialization
  useEffect(() => {
    loadDeferrals();
  }, [loadDeferrals]);
  
  // Filtering happens automatically in hook
  // No need to manually call applyFilters!
};
```

---

### 2️⃣ Action Handlers

#### What Moved
All action functions → `useDeferralActions()` hook

#### Integration Example
```javascript
import { useDeferralActions } from "../../hooks/useDeferralActions";

const Deferrals = () => {
  const token = localStorage.getItem("token");
  
  // Instead of defining 8 separate functions:
  // const handleApproveDeferral = async () => { ... };
  // const handleRejectDeferral = async () => { ... };
  // ...
  
  // Now get all from hook:
  const {
    handleApproveDeferral,
    handleRejectDeferral,
    handleReturnForRework,
    handleApproveCloseRequestByChecker,
    handleCloseDeferral,
    handlePostComment,
    handleApproveExtension,
    handleRejectExtension,
  } = useDeferralActions(token, onRefresh);
  
  // Use them the same way:
  const onApprove = async () => {
    const result = await handleApproveDeferral(
      selectedDeferral,
      approvalComment
    );
    if (result) {
      // Success - UI already updated
    }
  };
};
```

---

### 3️⃣ Utility Functions

#### What Moved
13 helper functions → `checkerDeferralHelpers.js`

#### Integration Example
```javascript
import {
  formatUsername,
  getRoleTag,
  getFileExtension,
  isFullyApproved,
  isRejected,
  normalizeDocKey,
  // ... import others as needed
} from "../../utils/checkerDeferralHelpers";

const Deferrals = () => {
  // Instead of defining inline:
  // const formatUsername = (username) => { ... };
  // const isFullyApproved = (deferral) => { ... };
  
  // Now import and use:
  const username = formatUsername(user);
  const isApproved = isFullyApproved(selectedDeferral);
  const fileType = getFileExtension(filename);
};
```

---

### 4️⃣ Sub-Components

#### What Moved
Inline sub-components → Separate `.jsx` files

#### Integration Example
```javascript
import CommentTrail from "../../components/checker/CommentTrail";
import DeferralStatusAlert from "../../components/checker/DeferralStatusAlert";

const Deferrals = () => {
  // Instead of:
  // <CommentTrail history={...} /> inside main JSX
  // <DeferralStatusAlert deferral={...} /> inline
  
  // Can now use elsewhere or keep same:
  return (
    <>
      <DeferralStatusAlert deferral={selectedDeferral} />
      {/* ... rest of JSX ... */}
      <CommentTrail 
        history={selectedDeferral?.comments}
        isLoading={false}
      />
    </>
  );
};
```

---

## 🔌 Complete Integration Example

```javascript
// pages/checker/Deferral.jsx
import React, { useEffect, useState } from "react";
import { Card, Button, Modal, message } from "antd";
import dayjs from "dayjs";

// Import hooks
import { useDeferralData } from "../../hooks/useDeferralData";
import { useDeferralActions } from "../../hooks/useDeferralActions";
import { useDeferralFilters } from "../../hooks/useDeferralFilters";

// Import components
import CommentTrail from "../../components/checker/CommentTrail";
import DeferralStatusAlert from "../../components/checker/DeferralStatusAlert";
import DeferralTable from "../../components/checker/DeferralTable";
import DeferralFilters from "../../components/checker/DeferralFilters";
import DeferralModal from "../../components/checker/DeferralModal";

// Import utilities
import {
  formatUsername,
  getRoleTag,
  isFullyApproved,
  isRejected,
} from "../../utils/checkerDeferralHelpers";

const Deferrals = () => {
  // Get token
  const token = localStorage.getItem("token");
  if (!token) {
    message.error("Not authenticated");
    return null;
  }

  // ========== HOOK USAGE ==========
  
  // 1. Data Management
  const { deferrals, loading, loadDeferrals } = useDeferralData();
  
  // 2. Filtering
  const {
    filters,
    activeTab,
    filteredDeferrals,
    setActiveTab,
    setSearchFilter,
    setDateRangeFilter,
    clearFilters,
  } = useDeferralFilters(deferrals);
  
  // 3. Actions
  const {
    handleApproveDeferral,
    handleRejectDeferral,
    handleReturnForRework,
    handleCloseDeferral,
    handlePostComment,
  } = useDeferralActions(token, loadDeferrals);

  // ========== LOCAL STATE ==========
  
  // Only UI state - business logic is in hooks!
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");

  // ========== INIT ==========
  
  useEffect(() => {
    const init = async () => {
      await loadDeferrals();
    };
    init();
  }, [loadDeferrals]);

  // ========== HANDLERS ==========
  
  const handleRowClick = (record) => {
    setSelectedDeferral(record);
    setModalVisible(true);
  };

  const onApprove = async () => {
    setActionLoading(true);
    try {
      const result = await handleApproveDeferral(
        selectedDeferral,
        approvalComment
      );
      if (result) {
        setModalVisible(false);
        setSelectedDeferral(null);
        setApprovalComment("");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const onReject = async () => {
    setActionLoading(true);
    try {
      const result = await handleRejectDeferral(
        selectedDeferral,
        approvalComment
      );
      if (result) {
        setModalVisible(false);
        setSelectedDeferral(null);
        setApprovalComment("");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ========== RENDER ==========
  
  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Deferral Management</h1>
      </Card>

      {/* Filters */}
      <DeferralFilters
        filters={filters}
        onSearchChange={setSearchFilter}
        onDateRangeChange={setDateRangeFilter}
        onClear={clearFilters}
      />

      {/* Table */}
      <DeferralTable
        deferrals={filteredDeferrals}
        loading={loading}
        onRowClick={handleRowClick}
      />

      {/* Modal */}
      <Modal
        title={selectedDeferral?.deferralNumber}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={actionLoading}
            onClick={onApprove}
          >
            Approve
          </Button>,
          <Button
            key="reject"
            danger
            loading={actionLoading}
            onClick={onReject}
          >
            Reject
          </Button>,
        ]}
        width={900}
      >
        {selectedDeferral && (
          <>
            {/* Status Alert */}
            <DeferralStatusAlert deferral={selectedDeferral} />

            {/* Details */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <p>
                <b>Customer:</b> {selectedDeferral.customerName}
              </p>
              <p>
                <b>Deferral #:</b> {selectedDeferral.deferralNumber}
              </p>
              <p>
                <b>Status:</b> {selectedDeferral.status}
              </p>
            </Card>

            {/* Comments */}
            <Card size="small" title="Comments" style={{ marginBottom: 16 }}>
              <CommentTrail
                history={selectedDeferral.comments}
                isLoading={false}
              />
            </Card>

            {/* Approval Comment */}
            <Card size="small">
              <textarea
                style={{ width: "100%", height: 100, padding: 8 }}
                placeholder="Enter your comment..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
              />
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Deferrals;
```

---

## 🎯 Key Transition Points

| Old Way | New Way | Benefit |
|---------|---------|---------|
| `const [deferrals, setDeferrals]` | `const { deferrals } = useDeferralData()` | Encapsulation |
| Long filtering function | `useDeferralFilters()` hook | Reusability |
| 8 separate handler functions | `useDeferralActions()` hook | Single source |
| Inline `CommentTrail` component | `<CommentTrail ... />` | Reusable |
| `formatUsername()` inline | `import from utils` | DRY |
| Complex JSX (2000 lines) | Simple with components | Readability |

---

## ✅ Testing the Integration

Before running in production:

```javascript
// Test that hooks load correctly
test('useDeferralData returns deferrals', () => {
  const { result } = renderHook(() => useDeferralData());
  expect(result.current.deferrals).toBeDefined();
});

// Test hooks together
test('integration works', () => {
  const { result: dataResult } = renderHook(() => useDeferralData());
  const { result: filterResult } = renderHook(() => 
    useDeferralFilters(dataResult.current.deferrals)
  );
  expect(filterResult.current.filteredDeferrals).toBeDefined();
});

// Test component renders
test('component renders with hooks', () => {
  render(<Deferrals />);
  expect(screen.getByText(/Deferral Management/i)).toBeInTheDocument();
});
```

---

## 🚀 Migration Checklist

Use this to track your integration:

- [ ] Copy imports section from example
- [ ] Replace useState declarations with hooks
- [ ] Replace function definitions with hook calls
- [ ] Update useEffect to initialize from hooks
- [ ] Replace inline components with imported ones
- [ ] Replace inline utilities with imported functions
- [ ] Test component loads without errors
- [ ] Test all actions work (approve, reject, etc.)
- [ ] Test filters work (search, date, priority)
- [ ] Test modals open/close correctly
- [ ] Verify no console errors
- [ ] Verify styling unchanged
- [ ] Deploy to staging for full testing

---

## 💡 Common Issues & Solutions

### Issue: "Cannot find module..."
**Solution**: Check import paths match your folder structure

### Issue: "Hooks can't be called conditionally"
**Solution**: Move hook calls to top level of component

### Issue: "State not updating"
**Solution**: Use `await` on async hook functions

### Issue: "Modal appears empty"
**Solution**: Ensure `selectedDeferral` is passed to modal content

### Issue: "Filters not applying"
**Solution**: `useDeferralFilters` hook handles this automatically

---

## 📞 Need Help?

Refer to:
1. **DEFERRAL_REFACTORING_GUIDE.md** - Full architecture
2. **DEFERRAL_COMPLETION_SUMMARY.md** - What was completed
3. **JSDoc in each file** - Specific function documentation
4. **This file** - Integration examples

Each file has clear comments explaining its purpose and usage.
