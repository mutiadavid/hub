import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetAllDeferralsQuery,
  useGetDeferralByIdQuery,
  useApproveDeferralMutation,
  useRejectDeferralMutation,
} from "../../../../api/deferralApi";
import {
  setDeferrals,
  setCurrentDeferral,
  setLoading,
  setError,
  setFilters,
  setTabCounts,
  clearCurrentDeferral,
} from "../../../../api/deferralSlice";

export const useDeferralState = () => {
  const dispatch = useDispatch();
  const {
    deferrals,
    currentDeferral,
    loading,
    error,
    filters,
    tabCounts,
    stats,
  } = useSelector((state) => state.deferral || {});

  const setDefaultState = useCallback(() => {
    dispatch(clearCurrentDeferral());
  }, [dispatch]);

  return {
    deferrals,
    currentDeferral,
    loading,
    error,
    filters,
    tabCounts,
    stats,
    setDeferrals: (data) => dispatch(setDeferrals(data)),
    setCurrentDeferral: (data) => dispatch(setCurrentDeferral(data)),
    setLoading: (isLoading) => dispatch(setLoading(isLoading)),
    setError: (err) => dispatch(setError(err)),
    setFilters: (newFilters) => dispatch(setFilters(newFilters)),
    setTabCounts: (counts) => dispatch(setTabCounts(counts)),
    setDefaultState,
  };
};

export const useDeferrals = (status = null) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth?.user?.id);

  const queryParams = status ? { status } : undefined;
  const {
    data: deferralData,
    isLoading: isFetching,
    error: queryError,
    refetch,
  } = useGetAllDeferralsQuery(queryParams, {
    skip: !userId,
  });

  useEffect(() => {
    if (deferralData) {
      dispatch(setDeferrals(deferralData));
      
      // Calculate tab counts
      const counts = {
        pending: deferralData.filter((d) =>
          ["pending_approval", "in_review", "partially_approved"].includes(
            (d.status || "").toLowerCase()
          )
        ).length,
        approved: deferralData.filter((d) =>
          ["approved", "deferral_approved"].includes(
            (d.status || "").toLowerCase()
          )
        ).length,
        closeRequests: deferralData.filter((d) =>
          ["close_requested_creator_approved"].includes(
            (d.status || "").toLowerCase()
          )
        ).length,
        closed: deferralData.filter((d) =>
          ["closed", "deferral_closed", "closed_by_co", "closed_by_creator"].includes(
            (d.status || "").toLowerCase()
          )
        ).length,
      };
      dispatch(setTabCounts(counts));
    }
  }, [deferralData, dispatch]);

  useEffect(() => {
    if (queryError) {
      dispatch(setError(queryError.message));
    }
  }, [queryError, dispatch]);

  return {
    deferrals: deferralData || [],
    isLoading: isFetching || isLoading,
    error: queryError,
    refetch,
  };
};

export const useDeferralActions = () => {
  const dispatch = useDispatch();
  const [approveDeferral, { isLoading: isApproving }] =
    useApproveDeferralMutation();
  const [rejectDeferral, { isLoading: isRejecting }] =
    useRejectDeferralMutation();

  const handleApprove = useCallback(
    async (deferralId) => {
      try {
        await approveDeferral(deferralId).unwrap();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error?.data?.message || "Failed to approve deferral",
        };
      }
    },
    [approveDeferral]
  );

  const handleReject = useCallback(
    async (deferralId) => {
      try {
        await rejectDeferral(deferralId).unwrap();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error?.data?.message || "Failed to reject deferral",
        };
      }
    },
    [rejectDeferral]
  );

  return {
    handleApprove,
    handleReject,
    isApproving,
    isRejecting,
  };
};

export const useDeferralFiltering = (deferrals) => {
  const { filters } = useDeferralState();
  const [filteredDeferrals, setFilteredDeferrals] = useState([]);

  const applyFilters = useCallback(() => {
    let result = deferrals || [];

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((d) => {
        const dclNo = (d.dclNo || d.dclNumber || "").toLowerCase();
        const customerName = (d.customerName || "").toLowerCase();
        const deferralNumber = (d.deferralNumber || "").toLowerCase();
        return (
          dclNo.includes(query) ||
          customerName.includes(query) ||
          deferralNumber.includes(query)
        );
      });
    }

    // Sort results
    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        switch (filters.sortBy) {
          case "deferralNumber":
            return (a.deferralNumber || "").localeCompare(b.deferralNumber || "");
          case "customerName":
            return (a.customerName || "").localeCompare(b.customerName || "");
          case "status":
            return (a.status || "").localeCompare(b.status || "");
          case "createdAt":
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
    }

    setFilteredDeferrals(result);
  }, [deferrals, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    filteredDeferrals,
    applyFilters,
  };
};
