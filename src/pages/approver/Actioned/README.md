# Actioned Module Modularization Guide

## Overview

The Actioned component has been successfully modularized following the DRY (Don't Repeat Yourself) principle and architectural patterns established in the MyQueue and Deferral modules.

**Original Size**: 2,803 lines (monolithic)  
**New Size**: ~250 lines (orchestrator) + modular components  
**Size Reduction**: ~91% in main orchestrator

---

## Project Structure

```
src/pages/approver/Actioned/
├── Actioned.jsx                    # Main orchestrator (~250 lines)
├── components/
│   ├── ActionedTable.jsx           # Main table component (~70 lines)
│   ├── DeferralDetailsModal.jsx    # Full-screen modal (~600 lines)
│   ├── CommentTrail.jsx            # Comment history (~70 lines)
│   ├── ExtensionApplicationsTab.jsx # Extensions queue (~60 lines)
│   └── index.js                    # Component barrel exports
├── hooks/
│   ├── useActionedData.js          # Data fetching (~120 lines)
│   ├── useCommentHandler.js        # Comment posting (~60 lines)
│   ├── useDocumentHandlers.js      # File operations (~50 lines)
│   └── index.js                    # Hooks barrel exports
├── utils/
│   ├── constants.js                # Colors, styles, config (~80 lines)
│   ├── helpers.js                  # 13 utility functions (~180 lines)
│   ├── actionedColumns.js          # Table columns (~100 lines)
│   ├── pdfGenerator.js             # PDF generation (~400 lines)
│   └── index.js                    # Utils barrel exports
└── README.md                       # This file
```

---

## Component Responsibilities

### Actioned.jsx (Main Orchestrator)
**Purpose**: Central component coordinating all modular pieces

**Responsibilities**:
- Fetch actioned deferrals using hooks
- Manage modal state for detail viewing
- Coordinate comment posting
- Handle table interactions
- Pass state to child components

**Key Features**:
- Clean ~250 line component
- All side effects via hooks
- Minimal state management
- Easy to understand data flow

---

### components/ActionedTable.jsx
**Purpose**: Display table of completed deferrals

**Props**:
```javascript
{
  deferrals = [],              // Array of deferral objects
  loading = false,             // Loading state
  onRowClick = () => {},       // Row click callback
  tableClassName = "actioned-table"
}
```

**Features**:
- 7-column table with formatting
- Pagination (10, 20, 50 items)
- Click to view details
- Empty state handling

---

### components/DeferralDetailsModal.jsx
**Purpose**: Full-screen modal viewing completed deferrals

**Props**:
```javascript
{
  deferral,                    // Deferral object to display
  open,                        // Modal visibility
  onClose,                     // Close callback
  newComment,                  // Comment text input
  onCommentChange,             // Update comment
  onPostComment,               // Post comment callback
  postingComment,              // Loading state
  handleViewDocument,          // View file callback
  handleDownloadDocument,      // Download file callback
  dclDocs, uploadedDocs, requestedDocs
}
```

**Renders**:
- Customer information
- Deferral status and details
- Documents to be deferred
- Facilities table
- Approval flow
- Comment trail
- Comment input form
- PDF download button

---

### components/CommentTrail.jsx
**Purpose**: Display historical comments and activity

**Props**:
```javascript
{
  history = [],    // Array of comment/event objects
  isLoading = false
}
```

---

### components/ExtensionApplicationsTab.jsx
**Purpose**: Display extension applications in table

**Props**:
```javascript
{
  extensions = [],
  loading = false,
  tableClassName = "actioned-table",
  onOpenExtensionDetails = () => {}
}
```

---

## Custom Hooks

### useActionedData()
**Purpose**: Fetch and manage actioned deferrals

**Returns**:
```javascript
{
  deferrals,      // Array of deferral objects
  loading,        // Loading state
  refetch,        // Refresh function
  setDeferrals    // Manual state setter
}
```

**Behavior**:
- Fetches completed deferrals on mount
- Listens to `deferral:updated` events
- Adds newly actioned items to list
- Updates existing items when modified

---

### useDeferralModal(selected, modalOpen)
**Purpose**: Manage modal polling for live data

**Returns**:
```javascript
{
  deferral,   // Live-polled deferral data
  setDeferral // Update deferral
}
```

**Behavior**:
- Polls deferral every 5 seconds when modal open
- Keeps approval flow current
- Auto-cleanup on unmount

---

### useActionedTabs(initialTab)
**Purpose**: Manage active tab state

**Returns**:
```javascript
{
  activeTab,      // Current tab key
  setActiveTab,   // Set tab
  handleTabChange // Tab change handler
}
```

---

### useCommentHandler(selected, onCommentPosted)
**Purpose**: Manage comment posting

**Returns**:
```javascript
{
  newComment,        // Comment text
  setNewComment,     // Update text
  postingComment,    // Loading state
  handlePostComment  // Submit comment
}
```

**Behavior**:
- Validates comment not empty
- Posts to backend
- Refreshes deferral
- Alerts parent via callback

---

### useDocumentHandlers()
**Purpose**: File viewing and downloading

**Returns**:
```javascript
{
  handleViewDocument,    // Opens file in new tab
  handleDownloadDocument // Downloads file locally
}
```

---

### useDocumentBuckets(deferral)
**Purpose**: Get organized document lists

**Returns**:
```javascript
{
  dclDocs,      // DCL documents only
  uploadedDocs, // Successfully uploaded documents
  requestedDocs // Requested but may not be uploaded
}
```

---

## Utility Functions

### constants.js
**Exports**:
- `PRIMARY_BLUE`, `SUCCESS_GREEN`, `ERROR_RED`, `WARNING_ORANGE` - Colors
- `PRIMARY_BLUE_RGB`, etc. - RGB versions for PDF
- `STATUS_CONFIG` - Status to color mapping
- `customTableStyles` - Pre-defined table CSS
- `modalHeaderStyle`, `cardHeaderStyle` - Component styles

---

### helpers.js (13 Functions)
**Formatting**:
- `formatUsername()` - Removes role suffix
- `formatDateTime()` - Date with time
- `formatDateOnly()` - Date only
- `getDaysRemaining()` - Days until due date

**Status/Data**:
- `getApproverStats()` - Counts approved/pending
- `resolveDocDaysAndDate()` - Extracts doc days/dates
- `getRoleTag()` - Colored role badge
- `isSystemMessage()` - Detects system messages
- `getStatusConfig()` - Status configuration
- `getInitials()` - Name initials

**Utility**:
- `truncateText()` - Text truncation
- `searchMatch()` - Case-insensitive search
- `formatErrorMessage()` - Error formatting
- `safe()` - Safe conversion to string
- `nameOf()` - Extract name from objects

---

### actionedColumns.js
**Export**: `getActionedColumns()`

Returns 7 table columns:
1. Deferral No (bold blue, fixed width)
2. DCL No
3. Customer Name (bold blue)
4. Loan Type
5. Status (color-coded icons)
6. SLA (countdown format)
7. Actioned At (date/time)

---

### pdfGenerator.js
**Export**: `downloadDeferralAsPDF(deferral)`

Generates comprehensive PDF with:
- Header with deferral number
- Customer information
- Deferral details and status
- Loan classification
- Facilities table
- Approval flow
- Attached documents
- Comment trail
- Footer with generation timestamp

---

## Integration Points

### Redux Auth
```javascript
const token = useSelector((s) => s.auth.token);
```

Uses Redux auth token for API calls.

### API Service
```javascript
import deferralApi from "../../service/deferralApi";
```

Calls:
- `getActionedDeferrals(token)` 
- `getDeferralById(id)`
- `postComment(id, data, token)`

### Custom Events
Listens to: `deferral:updated`

Updates actioned list when deferrals change elsewhere in app.

### Utils
- `getLoanDisplay()` - Loan classification
- `formatDeferralDocumentType()` - Document type display
- `getDeferralDocumentBuckets()` - Document organization

---

## Import Patterns

### From Barrel Exports (Clean Paths)
```javascript
import { PRIMARY_BLUE, formatUsername, getActionedColumns } from "../utils";
import { useActionedData, useCommentHandler } from "../hooks";
import { ActionedTable, DeferralDetailsModal } from "../components";
```

### From Specific Modules
```javascript
import { downloadDeferralAsPDF } from "../utils/pdfGenerator";
import { useActionedData } from "../hooks/useActionedData";
```

---

## Usage Example

```javascript
// In parent component or routing
import Actioned from './Actioned/Actioned';

export default function ApproverPage() {
  return (
    <div>
      <Actioned />
    </div>
  );
}
```

---

## Testing Considerations

### Component Unit Tests
```javascript
describe("ActionedTable", () => {
  it("renders table with deferrals", () => {
    render(
      <ActionedTable 
        deferrals={mockDeferrals} 
        onRowClick={jest.fn()} 
      />
    );
    expect(screen.getByText("DEF-123456")).toBeInTheDocument();
  });
});
```

### Hook Tests
```javascript
test("useActionedData fetches deferrals on mount", async () => {
  const { result } = renderHook(() => useActionedData());
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.deferrals.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```javascript
test("clicking deferral opens modal", async () => {
  render(<Actioned />);
  fireEvent.click(screen.getByText("DEF-123456"));
  await waitFor(() => {
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
  });
});
```

---

## Performance Optimizations

1. **Memoization**: useCallback for callbacks
2. **Polling**: Only polls when modal open
3. **Document Organization**: Pre-buckets documents
4. **Event Delegation**: Table row click handled at row level
5. **Code Splitting**: Modular components can be lazy-loaded

---

## Common Tasks

### Adding a New Document Type
1. Update `formatDeferralDocumentType()` in utils/helpers.js
2. Add icon mapping if needed in PDF generator
3. Test in comment trail and document sections

### Changing Status Colors
1. Update `STATUS_CONFIG` in utils/constants.js
2. Update `actionedColumns.js` rendering
3. Update Badge colors in DeferralDetailsModal

### Adding New Column to Table
1. Add column definition in `getActionedColumns()`
2. Ensure deferral data has the field
3. Add responsive width handling

---

## Known Limitations

1. **No Search**: Search bar placeholder but not functional
2. **No Extensions**: Extension applications tab empty (placeholder)
3. **View-Only**: Modal doesn't support actions (approve/reject)
4. **No Sorting**: Table columns not sortable yet
5. **No Filters**: No status/date filtering like MyQueue

---

## Future Enhancements

1. **Search & Filter**: Add search and filter controls
2. **Advanced Sorting**: Enable column sorting
3. **Date Range Picker**: Filter by date range
4. **Export**: CSV/Excel export of actioned deferrals
5. **Comments Bulk Download**: Download all comments as PDF
6. **Performance**: Pagination optimization with infinite scroll
7. **Real-time**: WebSocket for live updates instead of polling
8. **Extensions**: Implement extension applications functionality

---

## Migration Checklist

- [ ] Update parent component import from `./Actioned.jsx` to `./Actioned/Actioned.jsx`
- [ ] Verify all custom events (`deferral:updated`) still dispatch
- [ ] Test opening deferral details from table
- [ ] Test comment posting in modal
- [ ] Test PDF download
- [ ] Test document viewing/downloading
- [ ] Check styling and responsive layout
- [ ] Verify approval flow displays correctly
- [ ] Test with various screen sizes
- [ ] Update team documentation

---

## Related Modules

- **MyQueue**: Similar architecture for pending deferrals
- **Deferral**: Original modularization reference
- **DefferalPending**: Sibling component for pending deferrals

---

Generated: March 2026  
By: Modularization Initiative  
Reference: Actioned Refactoring v1.0
