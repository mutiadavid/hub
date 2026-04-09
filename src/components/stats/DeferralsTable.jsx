import React from "react";

function SimpleCell({ children }) {
  return (
    <td style={{ padding: "8px", border: "1px solid #e6e6e6" }}>{children}</td>
  );
}

export default function DeferralsTable({ items = [], loading = false }) {
  if (loading) return <div>Loading deferrals...</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              ID
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              DCL No
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Stage / Status
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Requested By
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Requested At
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Raw
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id || it.id || Math.random()}>
              <SimpleCell>{it._id || it.id || "-"}</SimpleCell>
              <SimpleCell>
                {it.dclNo || it.dcl || it.checklist || "-"}
              </SimpleCell>
              <SimpleCell>{it.stage || it.status || "-"}</SimpleCell>
              <SimpleCell>
                {(it.requestedBy && it.requestedBy.name) ||
                  it.requesterName ||
                  "-"}
              </SimpleCell>
              <SimpleCell>{it.requestedAt || it.createdAt || "-"}</SimpleCell>
              <SimpleCell
                style={{
                  maxWidth: 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {JSON.stringify(it, null, 2)}
                </pre>
              </SimpleCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
