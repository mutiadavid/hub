// components/RevivedChecklistDetails.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useGetCoCreatorChecklistByIdQuery } from '../../api/checklistApi';
import { useChecklistDocuments } from '../../hooks/useChecklistDocuments';
import { formatDateTime } from '../../utils/checklistUtils';
import DocumentSidebarComponent from './CompletedChecklistModalComponents/DocumentSidebarComponent';

const RevivedChecklistDetails = ({ checklist, onBack, onClose }) => {
  const checklistId = checklist?.id || checklist?._id;
  const [showDocumentSidebar, setShowDocumentSidebar] = React.useState(false);

  const {
    data: fetchedChecklist,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetCoCreatorChecklistByIdQuery(checklistId, {
    skip: !checklistId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const detailedChecklist = fetchedChecklist || checklist;
  const { docs } = useChecklistDocuments(detailedChecklist);

  const supportingDocs = React.useMemo(
    () =>
      (Array.isArray(detailedChecklist?.supportingDocs)
        ? detailedChecklist.supportingDocs
        : []
      ).map((doc) => ({
        ...doc,
        category: doc.category || 'Supporting Documents',
        isSupporting: true,
      })),
    [detailedChecklist],
  );

  const uploadedDocumentCount = React.useMemo(() => {
    let mainDocs = 0;
    (docs || []).forEach((doc) => {
      const uploads = Array.isArray(doc.uploads) ? doc.uploads : [];
      if (uploads.length > 0) {
        mainDocs += uploads.length;
      } else if (doc.fileUrl || doc.uploadData?.fileUrl) {
        mainDocs += 1;
      }
    });

    const supportingDocCount = (supportingDocs || []).filter(
      (doc) => doc.fileUrl || doc.uploadData?.fileUrl,
    ).length;
    return mainDocs + supportingDocCount;
  }, [docs, supportingDocs]);

  const documentSummary = React.useMemo(() => {
    const grouped = new Map();

    docs.forEach((doc) => {
      const category = doc.category || 'Main Documents';
      grouped.set(category, (grouped.get(category) || 0) + 1);
    });

    supportingDocs.forEach((doc) => {
      const category = doc.category || 'Supporting Documents';
      grouped.set(category, (grouped.get(category) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }, [docs, supportingDocs]);

  const formatDate = (dateString) => formatDateTime(dateString) || 'N/A';

  const getStatusColor = (status) => {
    const colors = {
      revived: 'warning',
      approved: 'success',
      completed: 'info',
      pending: 'default',
    };
    return colors[status] || 'default';
  };

  const statusLabel = detailedChecklist?.status || checklist?.status || 'N/A';
  const revivedByName = checklist?.revivedBy?.name || detailedChecklist?.revivedBy?.name || 'Unknown';
  const revivedAt = checklist?.revivedAt || detailedChecklist?.revivedAt;
  const originalStatus = checklist?.originalStatus || detailedChecklist?.originalStatus || 'N/A';
  const revivedTo = checklist?.revivedTo || detailedChecklist?.revivedTo;

  return (
    <Box>
      <DocumentSidebarComponent
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          variant="outlined"
          size="small"
        >
          Back to List
        </Button>
        <Typography variant="h6" fontWeight="bold">
          Revived Checklist Details
        </Typography>
        <Chip
          label={statusLabel}
          color={getStatusColor(statusLabel)}
          size="medium"
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {isError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Unable to load full revived checklist metadata. Showing available details only.
          {error?.data?.message ? ` ${error.data.message}` : ''}
        </Alert>
      )}

      {(isLoading || isFetching) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading document metadata...
          </Typography>
        </Box>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Customer Information
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="DCL Number" 
                  secondary={detailedChecklist?.dclNo || checklist?.dclNo || 'N/A'}
                  secondaryTypographyProps={{ fontWeight: 'bold' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Customer Name" 
                  secondary={detailedChecklist?.customerName || checklist?.customerName || 'N/A'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Customer Number" 
                  secondary={detailedChecklist?.customerNumber || checklist?.customerNumber || 'N/A'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Loan Type" 
                  secondary={
                    <Chip 
                      label={detailedChecklist?.loanType || checklist?.loanType || 'N/A'} 
                      size="small" 
                      variant="outlined" 
                    />
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Right Column - Revival Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Revival Information
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Revived By" 
                  secondary={revivedByName}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Revived At" 
                  secondary={formatDate(revivedAt)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Original Status" 
                  secondary={
                    <Chip 
                      label={originalStatus} 
                      size="small"
                      color="info"
                    />
                  }
                />
              </ListItem>
              
              {revivedTo && (
                <ListItem>
                  <ListItemIcon>
                    <ArrowBackIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="New Checklist" 
                    secondary={
                      <Chip 
                        label={revivedTo.dclNo || 'N/A'}
                        size="small"
                        color="success"
                        clickable
                        onClick={() => {/* Navigate to new checklist */}}
                      />
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Full Width - Documents */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Documents Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review the same document drawer used in completed checklists.
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<FolderOpenIcon />}
                onClick={() => setShowDocumentSidebar(true)}
                disabled={uploadedDocumentCount === 0}
              >
                View Documents ({uploadedDocumentCount})
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {documentSummary.length === 0 ? (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No documents available for this checklist.
                    </Typography>
                  </Paper>
                </Grid>
              ) : (
                documentSummary.map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.category}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {category.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {category.count} document{category.count === 1 ? '' : 's'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {/* Navigate to new checklist */}}
          disabled={!revivedTo}
        >
          View New Checklist
        </Button>
      </Box>
    </Box>
  );
};

export default RevivedChecklistDetails;