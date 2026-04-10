/**
 * Drafts Utility - Save and retrieve form drafts from localStorage
 */

const DRAFTS_STORAGE_KEY = 'ncba_dcl_drafts';

export const cloneDraftRecord = (record) => {
  if (!record || typeof record !== 'object') {
    return record;
  }

  return JSON.parse(JSON.stringify(record));
};

export const buildDraftCommentTrail = ({
  comments = [],
  currentComment = '',
  currentUserName = 'Current User',
  role = 'user',
}) => {
  const persistedComments = Array.isArray(comments)
    ? comments.map((comment) => cloneDraftRecord(comment)).filter(Boolean)
    : [];

  const normalizedComment = String(currentComment || '').trim();
  if (!normalizedComment) {
    return persistedComments;
  }

  const alreadyPresent = persistedComments.some((comment) => {
    const message = String(comment?.message || comment?.comment || '').trim();
    return message === normalizedComment;
  });

  if (alreadyPresent) {
    return persistedComments;
  }

  return [
    {
      _id: `draft-comment-${role}`,
      message: normalizedComment,
      comment: normalizedComment,
      createdAt: new Date().toISOString(),
      userName: currentUserName,
      role,
      isDraftComment: true,
      userId: {
        name: currentUserName,
        role,
      },
    },
    ...persistedComments,
  ];
};

/**
 * Save a draft to localStorage
 * @param {string} type - Type of draft (e.g., 'checklist', 'deferral', 'cocreator')
 * @param {object} data - The draft data to save
 * @param {string} id - Optional ID for updating existing draft
 * @returns {object} The saved draft with timestamp
 */
export const saveDraft = (type, data, id = null) => {
  try {
    const existingDrafts = getDrafts();
    const now = new Date().toISOString();

    const draft = {
      id: id || `${type}_${Date.now()}`,
      type,
      data,
      updatedAt: now,
      createdAt: id ? existingDrafts.find(d => d.id === id)?.createdAt || now : now,
    };

    // Remove old version if updating
    const filteredDrafts = id
      ? existingDrafts.filter(d => d.id !== id)
      : existingDrafts;

    // Add new draft at the beginning
    const updatedDrafts = [draft, ...filteredDrafts];

    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));

    return draft;
  } catch (error) {
    console.error('Error saving draft:', error);
    return null;
  }
};

/**
 * Get all drafts from localStorage
 * @param {string} type - Optional filter by type
 * @returns {array} Array of drafts
 */
export const getDrafts = (type = null) => {
  try {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    const drafts = stored ? JSON.parse(stored) : [];

    if (type) {
      return drafts.filter(d => d.type === type);
    }

    return drafts;
  } catch (error) {
    console.error('Error getting drafts:', error);
    return [];
  }
};

/**
 * Get a specific draft by ID
 * @param {string} id - Draft ID
 * @returns {object|null} The draft or null if not found
 */
export const getDraftById = (id) => {
  try {
    const drafts = getDrafts();
    return drafts.find(d => d.id === id) || null;
  } catch (error) {
    console.error('Error getting draft by ID:', error);
    return null;
  }
};

/**
 * Delete a draft by ID
 * @param {string} id - Draft ID
 * @returns {boolean} Success status
 */
export const deleteDraft = (id) => {
  try {
    const drafts = getDrafts();
    const updatedDrafts = drafts.filter(d => d.id !== id);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
};

/**
 * Clear all drafts
 * @returns {boolean} Success status
 */
export const clearAllDrafts = () => {
  try {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing drafts:', error);
    return false;
  }
};

/**
 * Get draft type label for display
 * @param {string} type - Draft type
 * @returns {string} Display label
 */
export const getDraftTypeLabel = (type) => {
  const labels = {
    'cocreator': 'Co-Creator Draft',
    'rm': 'RM Draft',
    'checker': 'Checker Draft',
    'admin': 'Admin Draft',
    'approver': 'Approver Draft',
    'deferral': 'Deferral Draft',
  };
  return labels[type] || 'Draft';
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDraftDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};
