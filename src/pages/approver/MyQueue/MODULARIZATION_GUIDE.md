# MyQueue Module Modularization Guide

## Overview

The MyQueue component has been successfully modularized following the DRY (Don't Repeat Yourself) principle and the architectural patterns established in the Deferral module refactoring.

**Original Size**: 4,199 lines (monolithic)  
**New Size**: ~250 lines (orchestrator) + modular components  
**Size Reduction**: ~94% reduction in main orchestrator

---

## Project Structure

```
src/pages/approver/MyQueue/
├── MyQueue.jsx                 # Main orchestrator component (~250 lines)
├── components/
│   ├── DeferralDetailsModal.jsx     # Deferral approval modal (~1500 lines)
│   ├── ExtensionApplicationsTab.jsx # Extension applications table (~50 lines)
│   ├── CommentTrail.jsx             # Comment history display (~100 lines)
│   └── index.js                     # Component barrel exports
├── hooks/
│   ├── useMyQueueData.js            # Data fetching and real-time updates
│   ├── useMyQueueFilters.js         # Filtering and search logic
│   ├── useMyQueueActions.js         # Approval/rejection/rework actions
│   └── index.js                     # Hooks barrel exports
├── utils/
│   ├── constants.js                 # Colors, statuses, styles
│   ├── helpers.js                   # Utility functions  
│   ├── tableColumns.js              # Table column definitions
│   └── index.js                     # Utils barrel exports
└── README.md                    # This file
```

---

## Component Responsibilities

### MyQueue.jsx (Main Orchestrator)
**Purpose**: Central component that brings together all modular pieces  
**Responsibilities**:
- Coordinate data fetching via hooks
- Manage tab switching between deferrals and extensions
- Display search and filter controls
- Render the filtered deferral table
- Render extension applications component
- Handle deferral row clicks to open detail modal
- Pass state and callbacks to child components

**Key Features**:
- Clean, readable ~250 line component
- All concerns delegated to specialized modules
- Minimal state management (uses hooks for complex logic)
- Easy to understand main flow

---

### components/DeferralDetailsModal.jsx
**Purpose**: Modal displaying full deferral details with approval workflow  
**Responsibilities**:
- Display customer information, facilities, documents
- Show approval flow with current approver status
- Provide approval, rejection, return for rework actions
- Handle modal confirmation dialogs
- Generate PDF export of deferral
- Display comment trail history

**Props**:
```javascript
{
  deferral,              // Main deferral object
  extension,             // Optional extension data
  open,                  // Modal visibility
  onClose,               // Close callback
  onAction,              // Action callback (approve, reject, etc.)
  token,                 // Auth token
  overrideApprovals,     // Override approval data (for extensions)
  headerTag,             // Custom header (e.g., "EXTENSION APPLICATION")
  overrideDaysSought,    // Override requested days
  overrideNextDueDate,   // Override next due date
  readOnly               // Disable action buttons if true
}
```

---

### components/ExtensionApplicationsTab.jsx
**Purpose**: Simple table displaying pending extension applications  
**Responsibilities**:
- Display extension queue in table format
- Allow clicking rows to view extension details
- Show deferral number, customer, status, request date

**Props**:
```javascript
{
  extensions = [],               // Array of extension objects
  loading = false,               // Loading state
  tableClassName = "",           // CSS class for styling
  onOpenExtensionDetails = () => {} // Click handler
}
```

---

### components/CommentTrail.jsx
**Purpose**: Display historical comments and approvals  
**Responsibilities**:
- Group comments by user and timestamp
- Distinguish system messages from user comments
- Show user avatar, name, role, and comment
- Display timestamp in readable format

**Props**:
```javascript
{
  history,      // Array of comment/event objects
  isLoading     // Loading state
}
```

---

## Custom Hooks

### useMyQueueData()
**Purpose**: Centralize all data fetching and real-time update logic  

**Returns**:
```javascript
{
  deferrals,                    // Array of deferral objects
  isLoading,                    // Loading state for deferrals
  queueExtensions,              // Array of extension applications
  extensionsLoading,            // Loading state for extensions
  refetchDeferrals,             // Function to refresh deferral data
  refetchExtensions,            // Function to refresh extensions
  setDeferrals                  // Manual state setter
}
```

**What It Does**:
- Fetches pending deferrals for current approver on mount
- Fetches extension applications from approver queue
- Handles API failures gracefully with error messages
- Deduplicates extensions by deferralId
- Listens to custom events:
  - `deferral:updated` - Updates individual deferral in state
  - `extension:updated` - Refetches extensions
  - `extension:created` - Refetches extensions

---

### useMyQueueModal()
**Purpose**: Manage deferral detail modal state and extension handling  

**Returns**:
```javascript
{
  selectedDeferral,             // Currently selected deferral object
  setSelectedDeferral,          // Set deferral
  modalOpen,                    // Modal visibility state
  setModalOpen,                 // Set modal visibility
  selectedExtension,            // Currently selected extension
  setSelectedExtension,         // Set extension
  extensionModalOpen,           // Extension modal visibility
  setExtensionModalOpen,        // Set extension modal visibility
  detailOverrides,              // Override configurations
  setDetailOverrides,           // Set overrides
  handleOpenExtensionDetails,   // Opens extension with override setup
  handleCloseModal,             // Close deferral modal
  handleCloseExtensionModal     // Close extension modal
}
```

---

### useMyQueueFilters(deferrals)
**Purpose**: Manage search, filter, sort, and date range logic  

**Returns**:
```javascript
{
  searchText,        // Search input value
  setSearchText,     // Update search
  statusFilter,      // Current status filter
  setStatusFilter,   // Update status
  priorityFilter,    // Current priority filter
  setPriorityFilter, // Update priority
  dateRange,         // [startDate, endDate] or []
  setDateRange,      // Update date range
  filteredDeferrals, // Computed filtered/searched results
  resetFilters,      // Clear all filters
  hasActiveFilters   // Boolean indicating if any filters active
}
```

**Filtering Logic**:
1. Filters to pending approver statuses only
2. Filters by current user (shows only deferrals where user is current approver)
3. Applies search across: customer name, DCL No, deferral number, RM name, document
4. Applies status, priority, and date range filters
5. Returns memoized results to prevent unnecessary re-renders

---

### useExtensionFilters(extensions)
**Purpose**: Manage extension-specific search and filtering  

**Returns**:
```javascript
{
  searchText,              // Search input value
  setSearchText,           // Update search
  filteredExtensions,      // Computed filtered results
  resetFilters             // Clear search
}
```

---

### useMyQueueActions(onActionComplete)
**Purpose**: Centralize all approval workflow actions  

**Returns**:
```javascript
{
  // Action handlers
  handleApprove,              // Execute approval with comment
  handleReject,               // Execute rejection with reason
  handleReturnForRework,      // Execute return for rework with instructions
  
  // Loading states
  approveLoading,             // True while approval in progress
  rejectingLoading,           // True while rejection in progress
  returnReworkLoading,        // True while rework return in progress
  
  // Comment/reason states
  approvalComment,            // Approval comment text
  setApprovalComment,         // Update approval comment
  rejectComment,              // Rejection reason text
  setRejectComment,           // Update rejection reason
  reworkComment,              // Rework instructions text
  setReworkComment,           // Update rework instructions
  
  // Dialog control states
  showApproveConfirm,         // Approval confirmation modal visibility
  showRejectConfirm,          // Rejection confirmation modal visibility
  showReworkConfirm,          // Rework confirmation modal visibility
  
  // Dialog control functions
  openApproveConfirm,         // Open approval confirmation
  openRejectConfirm,          // Open rejection confirmation
  openReworkConfirm,          // Open rework confirmation
  closeConfirmDialogs         // Close all confirmation dialogs
}
```

**Action Behavior**:
- **Approve**: Posts approval to API, dispatches `deferral:updated` event
- **Reject**: Posts rejection with audit trail as comment history entry
- **Return for Rework**: Returns deferral to RM with validation of current approver

---

### useMyQueueTabs(initialTab)
**Purpose**: Manage active tab state (deferrals vs extensions)  

**Returns**:
```javascript
{
  activeTab,         // Current active tab key ("deferrals" or "extensions")
  setActiveTab,      // Set active tab
  handleTabChange    // Tab change callback
}
```

---

## Utility Functions

### constants.js
**Colors**:
```javascript
PRIMARY_BLUE = "#164679"
ACCENT_LIME = "#b5d334"
SUCCESS_GREEN = "#52c41a"
ERROR_RED = "#ff4d4f"
WARNING_ORANGE = "#faad14"
PROCESSING_BLUE = "#1890ff"
```

**Status Configurations**:
```javascript
STATUS_CONFIG = {
  pending_approval: { color: WARNING_ORANGE, text: "Pending" },
  in_review: { color: PROCESSING_BLUE, text: "In Review" },
  approved: { color: SUCCESS_GREEN, text: "Approved" },
  rejected: { color: ERROR_RED, text: "Rejected" }
}
```

**CSS Styles**: Pre-defined styles for tables, modals, and cards

---

### helpers.js
**Format Functions**:
- `formatUsername(username)` - Removes role suffix in parentheses
- `formatDateTime(date)` - Formats date and time
- `formatDateOnly(date)` - Formats date only
- `formatErrorMessage(errors)` - Converts error objects to readable strings

**Status Functions**:
- `getRoleTag(role)` - Returns role badge configuration
- `getStatusConfig(status)` - Returns status badge configuration
- `getDaysRemaining(dueDate)` - Calculates days remaining or overdue

**Utility Functions**:
- `isSystemMessage(comment)` - Checks if message is system-generated
- `truncateText(text, maxLength)` - Truncates text with ellipsis
- `searchMatch(text, searchTerm)` - Case-insensitive search matching
- `getInitials(name)` - Gets initials from full name

---

### tableColumns.js
**Export Functions**:
- `getDeferralColumns(onRowClick)` - Deferral queue table columns
- `getExtensionColumns(onRowClick)` - Extension applications table columns
- `getDeferralDetailColumns()` - Facility details table columns
- `getDocumentColumns()` - Documents table columns

Each function returns Ant Design table column configuration with custom rendering

---

## Imports and Dependencies

### Main Orchestrator Imports
```javascript
import { useMyQueueData, useMyQueueModal, useMyQueueTabs } from "./hooks";
import { useMyQueueFilters, useExtensionFilters } from "./hooks";
import { useMyQueueActions } from "./hooks";
import { DeferralDetailsModal, ExtensionApplicationsTab } from "./components";
```

### Component Dependencies
- **React**: Hooks API
- **Ant Design**: UI components (Table, Modal, Card, Button, Input, Select, etc.)
- **React Router**: Navigation
- **dayjs**: Date formatting
- **deferralApi**: Backend API calls
- **jsPDF**: PDF generation

---

## Usage Example

### Import the new modular MyQueue
```javascript
// Before: from original monolithic file
// import MyQueue from './MyQueue.jsx';

// After: from new modular structure
import MyQueue from './MyQueue/MyQueue.jsx';
```

### Or import specific components
```javascript
import DeferralDetailsModal from './MyQueue/components/DeferralDetailsModal';
export { default as DeferralDetailsModal } from "./components";
```

---

## Integration with Redux and Custom Events

### Redux Integration
- Uses `useSelector` to get auth token from Redux state
- Token passed to API calls for authentication

### Custom Event System
The module uses browser custom events for real-time updates:
- `deferral:updated` - Dispatched when deferral status changes
- `extension:updated` - Dispatched when extension status changes  
- `extension:created` - Dispatched when new extension created

**Example**:
```javascript
// Dispatch event after action completes
window.dispatchEvent(
  new CustomEvent("deferral:updated", { detail: updatedDeferral })
);

// Listen to events
window.addEventListener("deferral:updated", (e) => {
  const updatedDeferral = e.detail;
  // Update UI...
});
```

---

## Testing Considerations

Each module can now be tested independently:

### Component Unit Tests
- Test DeferralDetailsModal with mock props
- Test ExtensionApplicationsTab with extension data
- Test CommentTrail with comment history

### Hook Tests
- Test useMyQueueData with mock API responses
- Test useMyQueueFilters with various filter combinations
- Test useMyQueueActions with mock deferral data

### Integration Tests
- Test MyQueue with all hooks and components together
- Test modal open/close flows
- Test approval workflow end-to-end

---

## Performance Optimizations

1. **Memoization**: Used in filter hooks to prevent unnecessary recalculations
2. **Callback memoization**: useCallback prevents unnecessary child re-renders
3. **Code splitting**: Modular components can be lazy-loaded if needed
4. **Event delegation**: Table click events handled at row level

---

## Maintenance Benefits

1. **Single Responsibility**: Each file has clear, focused purpose
2. **DRY Principle**: No code duplication across modules
3. **Readability**: Small, focused files easier to understand
4. **Testability**: Independent units easier to unit test
5. **Reusability**: Hooks and components can be reused in other features
6. **Extensibility**: Easy to add new features without touching existing code

---

## Migration Checklist

- [ ] Update all imports from old MyQueue path to new structure
- [ ] Verify all custom events ('deferral:updated', 'extension:updated') still dispatch
- [ ] Test approval, rejection, return for rework workflows
- [ ] Test search and filtering functionality
- [ ] Test PDF download feature
- [ ] Test modal open/close flows
- [ ] Verify comment trail displays correctly
- [ ] Test extension applications tab
- [ ] Check styling and responsive layout
- [ ] Update documentation and team wiki

---

## Common Issues and Solutions

### Issue: Modal not receiving token
**Solution**: Ensure Redux auth state is configured and useSelector hook works

### Issue: Custom events not triggering
**Solution**: Check window object availability (not available in server-side contexts)

### Issue: Filters not applying
**Solution**: Verify deferral status values match STATUS_CONFIG keys

### Issue: Extensions not loading
**Solution**: Check API URL configuration in useMyQueueData hook

---

## Future Enhancements

1. **Pagination**: Add pagination to deferral table
2. **Sorting**: Add column sorting to deferral table
3. **Bulk Actions**: Select multiple deferrals for batch approval
4. **Advanced Filters**: More granular filtering options
5. **Export**: Export queue to CSV/Excel
6. **Caching**: Cache fetched data with React Query or SWR
7. **Real-time**: Use WebSocket for live queue updates
8. **Analytics**: Track approver actions and metrics

---

## Related Documentation

- See [Deferral Module Refactoring](../../../defferals/REFACTORING_GUIDE.md) for similar patterns
- See [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md) for overall project status
- See CLAUDE.md for project setup and architecture overview

---

Generated: March 2026  
By: Modularization Initiative  
Reference: MyQueue Refactoring v1.0
