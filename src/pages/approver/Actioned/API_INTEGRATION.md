# Actioned Module - API and Integration Guide

## Overview

This document details all API integrations, hooks, and data flows within the modularized Actioned component.

---

## Data Flow Architecture

```
┌─────────────────────────────────────────┐
│     Actioned Main Orchestrator          │
│         (250 lines)                     │
├─────────────────────────────────────────┤
│                                         │
│  ├─ useActionedData()                  │
│  │  ├─ Fetch deferred deferrals       │
│  │  └─ Listen for real-time updates   │
│  │                                     │
│  ├─ useDeferralModal()                 │
│  │  └─ Poll modalopen deferrals       │
│  │                                     │
│  ├─ useCommentHandler()                │
│  │  └─ Post comments via API          │
│  │                                     │
│  └─ useDocumentHandlers()              │
│     └─ View/download files            │
│                                         │
└─────────────────────────────────────────┘
         │
         ├──► ActionedTable (UI)
         ├──► DeferralDetailsModal (UI)
         ├──► CommentTrail (UI)
         └──► ExtensionApplicationsTab (UI)
```

---

## API Endpoints

### 1. Get Actioned Deferrals
**Endpoint**: `GET /api/deferrals/approver/actioned`  
**Hook**: `useActionedData()`  
**Called**: On component mount

**Parameters**: None

**Response** (Success):
```javascript
{
  success: true,
  data: [
    {
      _id: "uuid",
      dclNumber: "DCL-123456",
      deferralNumber: "DEF-789012",
      customerName: "Customer A",
      status: "approved|rejected|withdrawn",
      createdAt: "2024-03-01T10:30:00Z",
      approvedAt: "2024-03-15T10:30:00Z",
      // ... other deferral fields
    }
  ]
}
```

**Error Handling**:
- Message: "Failed to load actioned items"
- User can retry by refreshing component

---

### 2. Get Single Deferral (Polling)
**Endpoint**: `GET /api/deferrals/:id`  
**Hook**: `useDeferralModal()`  
**Called**: Every 5 seconds when modal open

**Purpose**: Keep approval flow current while viewing

**Response**: Complete deferral object with latest approvals

---

### 3. Post Comment
**Endpoint**: `POST /api/deferrals/:id/comments`  
**Hook**: `useCommentHandler()`  
**Called**: When user submits comment in modal

**Body**:
```javascript
{
  text: "comment text",
  author: {
    name: "User Name",
    role: "approver"
  },
  createdAt: "2024-03-15T10:30:00Z"
}
```

**Response**:
```javascript
{
  success: true,
  data: {
    _id: "comment-uuid",
    text: "comment text",
    author: {...},
    createdAt: "2024-03-15T10:30:00Z"
  },
  message: "Comment posted successfully"
}
```

**Success Behavior**:
1. Clears comment input
2. Shows success message
3. Fetches updated deferral with new comment
4. Updates list

**Error Handling**:
- Shows error message
- Input remains filled for retry

---

## Event System

### Custom Event: deferral:updated
**Dispatched**: From MyQueue when deferral action completes

**Payload**:
```javascript
{
  detail: {
    _id: "uuid",
    status: "approved|rejected",
    approvedAt: "timestamp"
  }
}
```

**Handler**: useActionedData - Automatically adds/updates deferral

---

## Data Fetching Flow

### Initial Load
```
Component Mount
  ↓
useActionedData()
  ├─ Fetch via deferralApi.getActionedDeferrals()
  ├─ Set deferrals state
  └─ Register event listener for "deferral:updated"
  ↓
Render ActionedTable with deferrals
```

### Modal Open
```
Row Click
  ↓
Set selected deferral
  ├─ Open modal
  └─ Start useDeferralModal()
     ├─ Fetch via deferralApi.getDeferralById()
     └─ Poll every 5 seconds
     
Keeps approval flow live
```

### Comment Post
```
User clicks "Post Comment"
  ↓
useCommentHandler.handlePostComment()
  ├─ Validate comment not empty
  ├─ Get current user from localStorage
  ├─ POST via deferralApi.postComment()
  ├─ Clear input on success
  ├─ Fetch updated deferral
  └─ Update selected state
  
Updates comment trail in real-time
```

---

## Hook Integration Guide

### Using useActionedData

```javascript
const { deferrals, loading, refetch, setDeferrals } = useActionedData();

// deferrals: Array of completed deferral objects
// loading: Boolean, true while fetching initial data
// refetch: Function to manually refresh the list
// setDeferrals: Direct state setter (rarely needed)
```

### Using useDeferralModal

```javascript
const { deferral, setDeferral } = useDeferralModal(selected, modalOpen);

// deferral: Live-polled deferral data (updates every 5s when modal open)
// setDeferral: Manual state setter (for special cases)

// Use 'deferral || selected' to prefer live data, fallback to selected
```

### Using useCommentHandler

```javascript
const { newComment, setNewComment, postingComment, handlePostComment } =
  useCommentHandler(selectedDeferral, (refreshedDeferral) => {
    // Callback after successful comment post
    updateLocalState(refreshedDeferral);
  });

// newComment: Current comment text input
// setNewComment: Update comment text
// postingComment: Boolean, true while posting
// handlePostComment: Submit function
```

### Using useDocumentHandlers

```javascript
const { handleViewDocument, handleDownloadDocument } = useDocumentHandlers();

// handleViewDocument(file): Opens file in new tab
// handleDownloadDocument(file): Downloads file to computer
```

### Using useDocumentBuckets

```javascript
const { dclDocs, uploadedDocs, requestedDocs } = useDocumentBuckets(deferral);

// dclDocs: Array of DCL documents only
// uploadedDocs: Successfully uploaded documents
// requestedDocs: Documents requested but may not be uploaded
```

---

## Error Handling

### API Errors
```javascript
try {
  await deferralApi.getActionedDeferrals(token);
} catch (err) {
  message.error("Failed to load actioned items");
  console.error(err);
}
```

### Missing Data
```javascript
// Graceful fallbacks throughout
const name = deferral?.customerName || "Unknown Customer";
const status = (deferral?.status || "pending").toLowerCase();
```

### Event Handler Errors
```javascript
window.addEventListener("deferral:updated", (e) => {
  try {
    // Process event
  } catch (err) {
    console.warn("Event handler error", err);
    // Silent fail - doesn't break UI
  }
});
```

---

## Token Management

### Redux Integration
```javascript
const token = useSelector((s) => s.auth.token);

// Automatically included in all API calls via deferralApi service
```

### Token Expiry
- No explicit token refresh in this component
- Relies on global Redux auth handling
- Failed API calls due to auth handled by service layer

---

## Real-time Updates

### Polling Strategy
- **When**: Modal open with deferral selected
- **Interval**: Every 5 seconds
- **Purpose**: Keep approval flow current
- **Cleanup**: Auto-stops when modal closes

### Event Listener Strategy
- **Event**: `deferral:updated` from other pages
- **Action**: Adds/updates deferral in list
- **Cleanup**: Removed on component unmount
- **Use Case**: When action completed in MyQueue or elsewhere

---

## Performance Considerations

### Data Optimization
- **Document Buckets**: Pre-organize documents in hook
- **Memoization**: Callbacks memoized to prevent re-renders
- **Event Cleanup**: All listeners removed on unmount
- **Polling Cancellation**: Interval cleared when modal closes

### Rendering Optimization
- **Component Splitting**: Table, modal, comments separate
- **Lazy Loading**: Documentsin modal lazy-loaded
- **Conditional Rendering**: Only render what's visible

---

## Debugging Guide

### Check API Calls
1. Open Browser DevTools → Network tab
2. Look for:
   - `GET /api/deferrals/approver/actioned`
   - `GET /api/deferrals/:id` (every 5 seconds when modal open)
   - `POST /api/deferrals/:id/comments`
3. Verify response status 200/201
4. Check Authorization header present

### Check State
1. Open Redux DevTools
2. Find `useActionedData` in action history
3. Verify `deferrals` array updating
4. Check for event listener registrations

### Check Events
1. Open Console
2. Run: `window.addEventListener("deferral:updated", e => console.log(e))`
3. Trigger action in MyQueue
4. Verify event fires with correct payload

### Common Issues
- **Modal not polling**: Verify `modalOpen` and `selected._id` set
- **Comments not posting**: Check localStorage has user data
- **Events not firing**: Verify other component dispatches event
- **Documents not showing**: Check `getDeferralDocumentBuckets()` result

---

## Testing Helpers

### Mock API Responses
```javascript
jest.mock("../../service/deferralApi", () => ({
  getActionedDeferrals: jest.fn().mockResolvedValue([
    {
      _id: "test-uuid",
      deferralNumber: "DEF-000001",
      status: "approved"
    }
  ])
}));
```

### Mock Events
```javascript
const event = new CustomEvent("deferral:updated", {
  detail: { _id: "test-uuid", status: "approved" }
});
window.dispatchEvent(event);
```

### Mock User Data
```javascript
localStorage.setItem("user", JSON.stringify({
  name: "Test User",
  role: "approver"
}));
```

---

## API Response Validation

### Expected Fields in Deferral Object
```javascript
{
  _id,                           // Required
  deferralNumber,               // Display in table
  dclNumber,                    // Display in modal
  customerName,                 // Display in modal
  customerNumber,               // Display in modal
  loanType,                     // Display in modal
  status,                       // approved, rejected, pending
  createdAt,                    // Display timestamps
  updatedAt,
  approvedAt,
  documents: [{name, url}],     // File handling
  comments: [{text, author}],   // Comment trail
  approverFlow: [{...}],        // Approval history
  facilities: [{...}],          // Facility details
  daysSought,                   // Deferral duration
  nextDueDate                   // Calculated due date
}
```

---

## Monitoring & Analytics

### Key Events to Track
1. "getActionedDeferrals" - Initial load
2. "getDeferralById" - Modal polling calls
3. "postComment" - User engagement
4. "document:viewed" - Document access
5. "pdf:downloaded" - PDF generation

### Metrics to Monitor
- Load time for actioned list
- Polling frequency vs updates
- Comment post success rate
- Document access patterns
- PDF generation time

---

## Related Documentation

- See MODULARIZATION_GUIDE.md for architecture overview
- See README.md for component details
- See MyQueue module for similar patterns
- See Deferral module for original reference

---

Generated: March 2026  
Version: 1.0  
Last Updated: Modularization Complete
