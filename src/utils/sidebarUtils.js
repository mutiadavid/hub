/**
 * Calculate sidebar width based on screen size and collapsed state
 * Responsive breakpoints:
 * - < 768px: Mobile (sidebar hidden/overlay)
 * - 768px - 1099px: Tablet (half-size sidebar)
 * - >= 1100px: Desktop (full-size sidebar)
 */
export const getSidebarWidth = (collapsed) => {
  if (typeof window === 'undefined') return 150; // Default fallback
  
  const screenWidth = window.innerWidth;
  
  // Mobile: < 768px - sidebar hidden (uses fixed overlay, marginLeft = 0)
  if (screenWidth < 768) {
    return collapsed ? 0 : 150; // This is rarely used since marginLeft = 0 on mobile
  }
  
  // Tablet: 768px - 1099px - half-size sidebar
  if (screenWidth < 1100) {
    return collapsed ? 40 : 150;
  }
  
  // Desktop: >= 1100px - full-size sidebar
  return collapsed ? 80 : 300;
};
