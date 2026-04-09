import React, { useMemo } from "react";
import {
  useGetAllDclsQuery,
  useGetDeferralsQuery,
} from "../../api/checklistApi";
import DclsTable from "./DclsTable";
import DeferralsTable from "./DeferralsTable";
import StatsCharts from "./StatsCharts";

const containerStyle = {
  padding: 16,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 24,
};

export default function StatsPage() {
  const { data: dcls = [], isLoading: dclsLoading } = useGetAllDclsQuery();
  const { data: deferrals = [], isLoading: deferralsLoading } =
    useGetDeferralsQuery();

  const dclsList = Array.isArray(dcls) ? dcls : dcls?.data || [];
  const deferralsList = Array.isArray(deferrals)
    ? deferrals
    : deferrals?.data || [];

  const deferralCounts = useMemo(() => {
    const map = {};
    deferralsList.forEach((d) => {
      const s = (d.status || "unknown").toString();
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [deferralsList]);

  const dclCounts = useMemo(() => {
    const map = {};
    dclsList.forEach((c) => {
      const s = (c.status || c.checklistStatus || "unknown").toString();
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [dclsList]);

  return (
    <div style={containerStyle}>
      <h2>System Stats</h2>

      <section>
        <h3>Overview charts</h3>
        <StatsCharts
          dclCounts={dclCounts}
          deferralCounts={deferralCounts}
          loading={dclsLoading || deferralsLoading}
        />
      </section>

      <section>
        <h3>All DCLs (table)</h3>
        <DclsTable items={dclsList} loading={dclsLoading} />
      </section>

      <section>
        <h3>Deferrals (table)</h3>
        <DeferralsTable items={deferralsList} loading={deferralsLoading} />
      </section>
    </div>
  );
}
