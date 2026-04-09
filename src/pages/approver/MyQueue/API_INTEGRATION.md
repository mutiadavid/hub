# MyQueue API Integration Guide

## Overview

This document details all API integrations within the modularized MyQueue component, including endpoints called, expected responses, error handling, and real-time event patterns.

---

## API Endpoints

### 1. Fetch Approver Deferrals Queue
**Endpoint**: `GET /api/deferrals/approver/queue`  
**Hook**: `useMyQueueData()`  
**Called**: On component mount  

**Parameters**: Query params (handled by deferralApi)
- `status` (optional) - Filter by status

**Expected Response**:
```javascript
{
  success: true,
  data: [
    {
      id: "uuid",
      dclNumber: "DCL-123456",
      deferralNumber: "DEF-789012",
      customerName: "Customer A",
      customerNumber: "CUST001",
      loanType: "Commercial",
      status: "pending_approval",
      priority: "high|medium|low",
      nextDueDate: "2024-03-15T00:00:00Z",
      createdAt: "2024-03-01T10:30:00Z",
      documents: [{id, name, type, status}],
      facilities: [{id, facilityName, assetClass, amount}],
      currentApprover: {id, name, role},
      approvals: [{step, approver, status, timestamp}],
      history: [{type, timestamp, details}]
    }
  ]
}
```

**Success Handling**:
- Updates `deferrals` state in `useMyQueueData`
- Filters applied in `useMyQueueFilters`
- Displayed in main table

**Error Handling**:
- Message: "Failed to load queue"
- Retry mechanism: User can click refresh button

---

### 2. Fetch Approver Extensions Queue
**Endpoint**: `GET /api/extensions/approver/queue`  
**Hook**: `useMyQueueData()`  
**Called**: On component mount  

**Parameters**: None

**Expected Response**:
```javascript
{
  success: true,
  data: [
    {
      id: "uuid",
      deferralId: "uuid",
      deferralNumber: "DEF-789012",
      customerName: "Customer A",
      status: "pending|approved|rejected",
      requestedDays: 30,
      requestedAt: "2024-03-15T10:00:00Z",
      deferral: {
        id, dclNumber, deferralNumber, customerName, //embedded deferral when needed
      }
    }
  ]
}
```

**Deduplication Logic**:
- Extensions deduplicated by `deferralId` to avoid duplicates
- Only newest extension for each deferral shown

**Error Handling**:
- Message: "Failed to load extensions"
- Retry mechanism: User can click refresh button

---

### 3. Get Deferral Details
**Endpoint**: `GET /api/deferrals/:id`  
**Hook**: `useMyQueueModal()`  
**Called**: When extension is clicked (to load full deferral details)  

**Parameters**:
- `id` (path) - Deferral UUID
- `token` (header) - Auth token

**Expected Response**:
```javascript
{
  success: true,
  data: {
    id: "uuid",
    dclNumber: "DCL-123456",
    deferralNumber: "DEF-789012",
    customerName: "Customer A",
    customerId: "uuid",
    requestedBy: "RM Name",
    daysSought: 30,
    nextDueDate: "2024-03-15T00:00:00Z",
    
    // Nested entities
    documents: [
      {
        id, 
        documentName, 
        documentType,
        status, 
        checkerStatus,
        creatorStatus,
        rmStatus,
        comments: [{author, role, text, timestamp}]
      }
    ],
    facilities: [
      {
        id, 
        facilityName, 
        assetClass, 
        currency,
        amount
      }
    ],
    
    // Approval workflow
    approvals: [
      {
        step: 1,
        approverRole: "RM",
        approver: {id, name},
        status: "approved|rejected|pending",
        timestamp: "2024-03-10T10:00:00Z",
        comment: ""
      }
    ],
    
    // Activity history
    history: [
      {
        type: "status_changed|comment_added|document_uploaded",
        author: {id, name, role},
        timestamp: "2024-03-10T10:00:00Z",
        details: {}
      }
    ]
  }
}
```

**Usage**:
- Sets `detailOverrides` with extension-specific data
- Modal displays with "EXTENSION APPLICATION" header tag

**Error Handling**:
- Message: "Unable to load deferral details"
- Modal stays closed

---

### 4. Approve Deferral
**Endpoint**: `POST /api/deferrals/:id/approve`  
**Hook**: `useMyQueueActions()`  
**Called**: When user clicks "Approve" and confirms  

**Parameters**:
- `id` (path) - Deferral UUID
- Body: `{ comment: "optional approval notes" }`
- Headers: Authorization token

**Expected Response**:
```javascript
{
  success: true,
  data: {
    id: "uuid",
    status: "approved",
    approvals: [...],
    history: [...]
  },
  message: "Deferral approved successfully"
}
```

**Success Behavior**:
1. Modal closes
2. Dispatches `deferral:updated` custom event
3. Shows toast: "Deferral approved successfully"
4. Updates deferral in state via event listener
5. Table refreshes to remove approved deferral

**Error Handling**:
```javascript
{
  "message": "Cannot approve. Current approver status is not pending",
  "code": "INVALID_APPROVER_STATUS"
}
```
- Shows error toast
- Modal stays open
- User can modify comment and retry

---

### 5. Reject Deferral
**Endpoint**: `POST /api/deferrals/:id/reject`  
**Hook**: `useMyQueueActions()`  
**Called**: When user clicks "Reject" and confirms with reason  

**Parameters**:
- `id` (path) - Deferral UUID
- Body: `{ reason: "rejection reason (required)" }`
- Headers: Authorization token

**Expected Response**:
```javascript
{
  success: true,
  data: {
    id: "uuid",
    status: "rejected",
    approvals: [...],
    history: [...]
  },
  message: "Deferral rejected successfully"
}
```

**Success Behavior**:
1. Posts rejection reason as comment to history
2. Modal closes
3. Shows toast: "Deferral rejected successfully"
4. Table refreshes
5. Notifications sent to original RM and CoCreator

**Note**: Rejection reason is REQUIRED - form validation prevents empty submit

**Error Handling**:
- Message: "Failed to reject deferral"
- Shows specific error details if available
- Modal stays open for retry

---

### 6. Return for Rework
**Endpoint**: `POST /api/deferrals/:id/return-for-rework`  
**Hook**: `useMyQueueActions()`  
**Called**: When user clicks "Return for Rework" and confirms  

**Parameters**:
- `id` (path) - Deferral UUID
- Body: `{ instructions: "rework instructions (required)" }`
- Headers: Authorization token

**Expected Response**:
```javascript
{
  success: true,
  data: {
    id: "uuid",
    status: "rework_requested",
    currentApprover: null, // reset
    history: [...]
  },
  message: "Deferral returned for rework"
}
```

**Success Behavior**:
1. Posts instructions as comment
2. Resets currentApprover to CoCreator
3. Modal closes
4. Shows toast: "Deferral returned for rework"
5. Dispatches `deferral:updated` custom event
6. Table refreshes

**Permission Check**:
- Validates user is current approver before allowing
- If not approved yet, shows: "You can only return approved deferrals"

**Error Handling**:
- Message: "Failed to return deferral for rework"
- Shows permission errors if user is not current approver

---

### 7. Post Comment
**Endpoint**: `POST /api/deferrals/:id/comments`  
**Hook**: Used in `DeferralDetailsModal`  
**Called**: When user adds comment in modal  

**Parameters**:
- `id` (path) - Deferral UUID
- Body: `{ text: "comment text" }`
- Headers: Authorization token

**Expected Response**:
```javascript
{
  success: true,
  data: {
    id: "comment-uuid",
    deferralId: "uuid",
    author: {id, name, role},
    text: "comment text",
    timestamp: "2024-03-15T10:30:00Z"
  }
}
```

**Success Behavior**:
1. Adds comment to comment trail immediately (optimistic update)
2. Shows toast: "Comment added"
3. Clears input field
4. Comment displayed in CommentTrail component

**Error Handling**:
- Message: "Failed to post comment"
- Comment removed from UI on error (rollback optimistic update)
- User can retry

---

## Event System

### Custom Events Dispatched

#### deferral:updated
**Pattern**:
```javascript
window.dispatchEvent(
  new CustomEvent("deferral:updated", {
    detail: {
      id: "uuid",
      status: "approved|rejected|rework_requested",
      updatedAt: "2024-03-15T10:30:00Z"
    }
  })
);
```

**Listeners**: `useMyQueueData` hook  
**Behavior**:
- Updates deferral in state
- Triggers table refresh
- Removes completed deferrals from queue

#### extension:updated
**Triggered**: When extension status changes  
**Listeners**: `useMyQueueData` hook  
**Behavior**: Refetches entire extensions list

#### extension:created
**Triggered**: When new extension created elsewhere  
**Listeners**: `useMyQueueData` hook  
**Behavior**: Refetches entire extensions list to show new item

---

## Error Handling Strategy

### Global Error Handling
1. Try-catch blocks in all async operations
2. Specific error messages for each operation
3. Toast notifications to user
4. Graceful degradation (UI doesn't break)

### Common Error Codes
```
UNAUTHORIZED - User not authenticated
FORBIDDEN - User doesn't have permission
NOT_FOUND - Deferral doesn't exist
INVALID_APPROVER_STATUS - User is not current approver
DEFERRAL_ALREADY_APPROVED - Cannot approve twice
DUPLICATE_APPROVAL - User has already approved
```

### Error Message Formatting
```javascript
function formatErrorMessage(errors) {
  if (typeof errors === 'string') return errors;
  if (Array.isArray(errors)) return errors.join(', ');
  if (errors?.message) return errors.message;
  return 'An error occurred';
}
```

---

## API Service Integration

### deferralApi Service
All endpoints called through `deferralApi` service (from Redux/API folder)

**Methods Used**:
- `deferralApi.getApproverQueue(token)` - Fetches deferrals
- `deferralApi.getDeferralById(id)` - Fetch single deferral
- `deferralApi.approveDeferral(id, data)` - Approves deferral
- `deferralApi.rejectDeferral(id, data)` - Rejects deferral
- `deferralApi.returnForRework(id, data)` - Returns for rework
- `deferralApi.postComment(id, data)` - Posts comment

**Token Handling**:
```javascript
const token = useSelector(state => state.auth.token);
// Token passed to all API calls automatically
```

---

## Real-Time Update Flow

```
User Action
    ↓
API Call (deferralApi)
    ↓
Server Updates Database
    ↓
Server Responds with Success
    ↓
Client Dispatches Custom Event (deferral:updated)
    ↓
Event Listener Updates State
    ↓
Component Re-renders with New Data
    ↓
Deferral Removed from Queue (if approved/rejected)
```

---

## Retry and Loading States

### Loading States
Each action has corresponding loading state:
- `approveLoading` - True during approval
- `rejectingLoading` - True during rejection  
- `returnReworkLoading` - True during rework return

Action buttons disabled while loading to prevent double-submission

### Retry Mechanism
- Manual refresh button available in UI
- Automatic retry not implemented (user initiates)
- Error messages guide user to retry

---

## API Response Validation

### Expected Status Codes
- **200/201** - Success
- **400** - Bad request (validation error)
- **401** - Unauthorized  
- **403** - Forbidden (permission denied)
- **404** - Not found
- **500** - Server error

### Response Structure
All responses follow pattern:
```javascript
{
  success: boolean,
  data: {...} or null,
  message: string (optional),
  error: string (optional),
  errors: [] (optional for validation)
}
```

---

## Monitoring and Debugging

### Log Points
Key places to check API calls:

1. **Browser Network Tab**:
   - Look for `/api/deferrals/approver/queue` request
   - Check response body for correct data structure
   - Verify auth token in Authorization header

2. **Console Logs**:
   - Error messages from failed API calls
   - Event dispatches with custom events
   - State updates in React DevTools

3. **Redux DevTools**:
   - Check if auth token is present
   - Verify token format

### Debugging Checklist
- [ ] Network tab shows successful API requests
- [ ] Response data matches expected schema
- [ ] Token is present in Authorization header
- [ ] Custom events are dispatching
- [ ] Modal data reflects API response
- [ ] Table updates after action completion

---

## Performance Considerations

### Caching Strategy
Currently: No explicit caching (fetches on mount, refetch on action)

**Potential Improvements**:
1. Cache deferral list for X seconds
2. Cache individual deferral details
3. Use React Query for advanced caching

### Pagination
Currently: No pagination (all items fetched)

**Recommendation**:
Consider pagination if queue grows > 100 items:
- Add `limit` and `offset` query params
- Implement Ant Design Pagination component

### Batch Operations
Currently: Single deferral operations only

**Future Enhancement**:
- Batch approve multiple deferrals
- Batch reject with template reasons

---

## Security Considerations

### Token Management
- Token obtained from Redux auth state
- Included in `Authorization: Bearer <token>` header
- Never exposed in URL or logs

### CORS
- API likely same domain (no CORS issues)
- If cross-origin, ensure headers are correct

### Data Privacy
- Sensitive data (amounts, customer details) transmitted via HTTPS
- Never log sensitive data
- Clear comments before retry scenarios

---

## Testing API Interactions

### Mock API Responses
```javascript
const mockDeferral = {
  id: "test-uuid",
  dclNumber: "DCL-000001",
  deferralNumber: "DEF-000001",
  customerName: "Test Customer",
  status: "pending_approval",
  // ... other fields
};

// Mock fetch
jest.mock('deferralApi', () => ({
  getApproverQueue: jest.fn().mockResolvedValue([mockDeferral])
}));
```

### Integration Test Example
```javascript
test('should approve deferral and refresh queue', async () => {
  render(<MyQueue />);
  
  // Wait for initial data load
  await waitFor(() => {
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });
  
  // Click deferral row
  fireEvent.click(screen.getByText('DEF-000001'));
  
  // Click approve
  fireEvent.click(screen.getByText('Approve'));
  
  // Confirm
  fireEvent.click(screen.getByText('Confirm Approval'));
  
  // Verify success message
  await waitFor(() => {
    expect(screen.getByText('approved successfully')).toBeInTheDocument();
  });
});
```

---

## Endpoint Future Roadmap

**Planned Enhancements**:
1. Bulk approval endpoint
2. Workflow analytics endpoint  
3. Queue statistics endpoint
4. Export queue to CSV endpoint
5. WebSocket for real-time queue updates
6. Email notification preferences endpoint

---

## Related Resources

- Deferral Module API docs
- Authentication guide (CLAUDE.md)
- Database schema documentation
- Backend implementation details

---

Generated: March 2026  
Last Updated: Modularization Phase 2  
Version: 1.0
