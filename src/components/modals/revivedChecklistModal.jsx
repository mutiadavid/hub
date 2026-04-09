// components/RevivedChecklistsModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useGetRevivedChecklistsQuery } from "../features/api/apiSlice";
import { formatDate } from "../../utils/checklistUtils";
import RevivedChecklistDetails from "./RevivedChecklistDetails";

const RevivedChecklistsModal = ({ open, onClose, embedded = false }) => {
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // RTK Query
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRevivedChecklistsQuery({
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearch,
  });

  const { checklists = [], pagination } = response || {};

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (checklist) => {
    setSelectedChecklist(checklist);
    setShowDetails(true);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedChecklist(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // If showing details, render the details component
  if (showDetails && selectedChecklist) {
    const detailsContent = (
      <Box sx={embedded ? panelStyle : modalStyle}>
        <RevivedChecklistDetails
          checklist={selectedChecklist}
          onBack={handleBackToList}
          onClose={onClose}
        />
      </Box>
    );

    return embedded ? detailsContent : <Modal open={open} onClose={onClose}>{detailsContent}</Modal>;
  }

  const listContent = (
    <Box sx={embedded ? panelStyle : modalStyle}>
      <Box sx={headerStyle}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Revived Checklists History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review revived checklist records in a structured table workspace.
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={controlsStyle}>
        <TextField
          placeholder="Search by DCL No, Customer Name, or Customer Number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading revived checklists: {error?.data?.message || error?.message}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={loadingStyle}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading revived checklists...
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ maxHeight: 500, borderRadius: 2, boxShadow: 'none', border: '1px solid rgba(214, 189, 152, 0.2)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>DCL No</strong></TableCell>
                  <TableCell><strong>Customer Name</strong></TableCell>
                  <TableCell><strong>Loan Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Revived By</strong></TableCell>
                  <TableCell><strong>Revived At</strong></TableCell>
                  <TableCell><strong>New DCL</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checklists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No revived checklists found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  checklists.map((checklist) => (
                    <TableRow key={checklist.id || checklist._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {checklist.dclNo}
                        </Typography>
                      </TableCell>
                      <TableCell>{checklist.customerName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {checklist.loanType || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          {checklist.status || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{checklist.revivedBy?.name || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(checklist.revivedAt)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary">
                          {checklist.revivedTo?.dclNo || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(checklist)}
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Revival History">
                            <IconButton
                              size="small"
                              onClick={() => {
                                /* Open history modal */
                              }}
                              color="secondary"
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          )}

          <Box sx={statsStyle}>
            <Typography variant="caption" color="text.secondary">
              Showing {checklists.length} of {pagination?.total || 0} revived checklists
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  return embedded ? listContent : <Modal open={open} onClose={onClose}>{listContent}</Modal>;
};

// Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 1200,
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  overflow: "auto",
};

const panelStyle = {
  width: "100%",
  maxWidth: 1200,
  bgcolor: "background.paper",
  border: "1px solid rgba(214, 189, 152, 0.2)",
  borderRadius: 2,
  p: 3,
  overflow: "auto",
  boxShadow: "0 1px 2px rgba(26, 54, 54, 0.06)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mb: 2,
};

const controlsStyle = {
  display: "flex",
  gap: 2,
  mb: 3,
  alignItems: "center",
};

const loadingStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  py: 8,
};

const statsStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mt: 2,
  pt: 2,
  borderTop: "1px solid #e0e0e0",
};

export default RevivedChecklistsModal;
