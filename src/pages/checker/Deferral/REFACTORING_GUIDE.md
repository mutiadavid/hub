# Deferral Module Refactoring - Modularization Guide

## Overview

The Deferral module has been refactored from a monolithic 5544-line file into a modular, maintainable structure using React best practices, Redux Toolkit Query, and custom hooks.

## New Directory Structure

```
src/pages/checker/Deferral/
├── Deferral.jsx                      # Main orchestration component (< 300 lines)
├── Deferral.css                      # Styles
├── components/
│   ├── DeferralTable.jsx            # Tabbed table displaying deferrals
│   ├── DeferralDetailModal.jsx       # Modal for viewing/editing details
│   ├── DeferralHeader.jsx            # Page header with stats badge
│   ├── DeferralStats.jsx             # Statistics cards
│   ├── DeferralFilters.jsx           # Search and filter controls
│   ├── DeferralStatusAlert.jsx       # Status-based alerts
│   ├── CommentTrail.jsx              # Comment history display
│   └── ...other components
├── hooks/
│   └── useDeferrals.js               # Custom hooks for state & actions
├── utils/
│   ├── constants.js                  # Colors and enums
│   ├── helpers.js                    # Utility functions
│   └── filters.js                    # Filter logic
├── styles/
│   └── ...component styles
```

## Key Components

### 1. Deferral.jsx (Main Orchestrator)
**Purpose:** Manages the overall state, data fetching, and event handling for the entire Deferral module.

**Responsibilities:**
- Orchestrate sub-components
- Manage local component state
- Handle API calls via custom hooks
- Coordinate event handlers and callbacks
- Manage modal visibility and data
- Apply filtering and searching

**Key Props Passed Down:**
```javascript
// DeferralHeader
<DeferralHeader
  filteredCount={currentTabData.length}
  onRefresh={handleRefresh}
  isLoading={isDeferralsLoading}
/>

// DeferralTable
<DeferralTable
  activeTab={activeTab}
  onTabChange={handleTabChange}
  tabCounts={tabCounts}
  isLoading={isDeferralsLoading}
  currentData={currentTabData}
  onRowClick={handleRowClick}
/>

// DeferralDetailModal
<DeferralDetailModal
  isVisible={modalVisible}
  deferralRecord={selectedDeferral}
  onClose={handleModalClose}
  onApproveSuccess={handleRefresh}
  onRejectSuccess={handleRefresh}
  userRole={userRole}
/>
```

### 2. DeferralTable.jsx
**Purpose:** Display deferrals in a tabbed, paginated table.

**Features:**
- Multiple tabs (Pending, Approved, Close Requests, Completed)
- Dynamic tab counts
- Sortable columns
- Row click handlers
- Empty state handling
- Loading spinner

**Props:**
- `activeTab`: Current active tab
- `onTabChange`: Tab change callback
- `tabCounts`: Object with counts for each tab
- `isLoading`: Loading state
- `currentData`: Array of deferrals to display
- `onRowClick`: Row click handler

### 3. DeferralDetailModal.jsx
**Purpose:** Modal for viewing and managing individual deferral details.

**Features:**
- View deferral information
- Edit deferral (for RM role)
- Approve deferral (for CoChecker role)
- Reject deferral (for CoChecker role)
- Real-time API integration

**Props:**
- `isVisible`: Modal visibility
- `deferralRecord`: Selected deferral data
- `onClose`: Close handler
- `onApproveSuccess`: Callback on successful approval
- `onRejectSuccess`: Callback on successful rejection
- `userRole`: Current user's role for authorization

### 4. DeferralStats.jsx
**Purpose:** Display deferral statistics in card format.

**Features:**
- Total deferrals count
- Pending deferrals count
- Approved deferrals count
- Rejected deferrals count
- Color-coded cards
- Loading skeleton

**Props:**
- `stats`: Object with statistics
- `loading`: Loading state

### 5. DeferralFilters.jsx
**Purpose:** Provide search and sort controls.

**Features:**
- Search input for deferrals
- Sort dropdown
- Clear filters button
- Responsive layout

**Props:**
- `searchQuery`: Current search query
- `onSearchChange`: Search input change callback
- `sortBy`: Current sort field
- `onSortChange`: Sort change callback
- `onSearch`: Search action callback
- `onClear`: Clear filters callback

### 6. DeferralHeader.jsx
**Purpose:** Display page title and header info.

**Features:**
- Page title with badge count
- Refresh button
- Description text

**Props:**
- `filteredCount`: Count to display in badge
- `onRefresh`: Refresh callback
- `isLoading`: Loading state

## Custom Hooks

### useDeferrals.js

#### useDeferralState()
Access and modify global deferral Redux state.

```javascript
const {
  deferrals,
  currentDeferral,
  loading,
  error,
  filters,
  tabCounts,
  stats,
  setDeferrals,
  setCurrentDeferral,
  setLoading,
  setError,
  setFilters,
  setTabCounts,
} = useDeferralState();
```

#### useDeferrals(status?)
Fetch deferrals with automatic Redux integration and caching.

```javascript
const { deferrals, isLoading, error, refetch } = useDeferrals();
// or with specific status
const { deferrals, isLoading, error, refetch } = useDeferrals("pending");
```

#### useDeferralActions()
Get approve/reject mutation hooks with error handling.

```javascript
const {
  handleApprove,
  handleReject,
  isApproving,
  isRejecting,
} = useDeferralActions();

// Usage
const result = await handleApprove(deferralId);
if (result.success) {
  message.success("Approved!");
} else {
  message.error(result.error);
}
```

#### useDeferralFiltering(deferrals)
Apply search and sort filters to deferrals.

```javascript
const { filteredDeferrals, applyFilters } = useDeferralFiltering(deferrals);
```

## Redux Integration

### deferralApi.js
Redux Toolkit Query API for all deferral endpoints.

**Hooks exported:**
- `useGetAllDeferralsQuery`
- `useGetDeferralByIdQuery`
- `useGetDeferralsByStatusQuery`
- `useSearchDeferralsQuery`
- `useCreateDeferralMutation`
- `useUpdateDeferralMutation`
- `useDeleteDeferralMutation`
- `useApproveDeferralMutation`
- `useRejectDeferralMutation`
- `useGetDeferralStatsQuery`
- More endpoints available...

### deferralSlice.js
Redux Slice for deferral state management.

**State shape:**
```javascript
{
  deferrals: [],
  currentDeferral: null,
  loading: false,
  error: null,
  filters: {
    status: "",
    searchQuery: "",
    sortBy: "createdAt"
  },
  tabCounts: {
    pending: 0,
    approved: 0,
    closeRequests: 0,
    closed: 0
  },
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  }
}
```

## Usage Example

```javascript
import Deferral from './pages/checker/Deferral/Deferral';

// In your routing
<Route path="/deferrals" component={Deferral} />
```

## Data Flow

```
┌─────────────────────────────────────┐
│      Deferral.jsx (Main)            │
├─────────────────────────────────────┤
│                                     │
│  useSelector (auth)                │
│  useDeferrals() ─────┐              │
│  useDeferralActions()│              │
│  useDeferralState()  │              │
│                      │              │
│  useState (local):   │              │
│  - activeTab         │              │
│  - selectedDeferral  │              │
│  - modalVisible      │              │
│  - filters           │              │
└─────────────────────────────────────┘
          │
          ├─────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│     Redux Store                     │
├─────────────────────────────────────┤
│ ├─ deferralApi (RTK Query)         │
│ ├─ deferralSlice (state)           │
│ └─ authSlice (user info)           │
└─────────────────────────────────────┘
          │
          │
          ├──────────────┬──────────────┬──────────────┐
          │              │              │              │
          ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Deferral │   │ Deferral │   │ Deferral │   │ Deferral │
    │ Header   │   │ Stats    │   │ Filters  │   │ Table    │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                       │
                                                       ▼
                                                  ┌──────────────┐
                                                  │ DetailModal  │
                                                  └──────────────┘
```

## Best Practices

### 1. State Management
- Use Redux for global state (deferrals list, filters, stats)
- Use local component state for UI (modal visibility, selected row)
- Use Redux Query for API caching

### 2. Error Handling
- All API calls wrapped with try-catch
- User-friendly error messages
- Error state in Redux for global access

### 3. Performance
- Memoized callbacks with `useCallback`
- Filtered data computed with `useCallback` in hooks
- RTK Query caching to minimize API calls

### 4. Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Color-coded visual indicators with text fallback

## Migration from Old Component

If you were using the old `Deferral.jsx` directly, update your imports:

**Old:**
```javascript
import Deferral from './pages/checker/Deferral';
```

**New:**
```javascript
import Deferral from './pages/checker/Deferral/Deferral';
```

The component API remains the same, so no other changes needed.

## Testing

Each component and hook can be tested independently:

```javascript
// Component Testing
import { render, screen } from '@testing-library/react';
import DeferralTable from './components/DeferralTable';

test('renders table with deferrals', () => {
  const mockData = [/* test data */];
  render(<DeferralTable currentData={mockData} {...otherProps} />);
  // assertions
});

// Hook Testing
import { renderHook, act } from '@testing-library/react-hooks';
import { useDeferrals } from './hooks/useDeferrals';

test('fetches deferrals', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useDeferrals());
  await waitForNextUpdate();
  expect(result.current.deferrals).toHaveLength(expected);
});
```

## Future Enhancements

1. Add virtualized tables for large datasets
2. Real-time updates via WebSocket
3. Advanced filtering with saved filters
4. Bulk operations
5. PDF export functionality
6. Email notifications for approvals
7. Audit logging
8. Undo/redo for actions

## Troubleshooting

### Issue: Components not rendering
**Solution:** Check Redux store configuration in `src/app/store.js`. Ensure `deferralApi` and `deferralReducer` are registered.

### Issue: API calls failing
**Solution:** Verify API endpoint URLs in `deferralApi.js` match backend routes. Check auth token in Redux store.

### Issue: State not updating
**Solution:** Use Redux DevTools to inspect state changes. Check that Redux actions are being dispatched.

### Issue: Styling issues
**Solution:** Import constants from `./utils/constants.js`. Check `Deferral.css` for overrides.
