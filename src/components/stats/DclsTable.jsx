import React from "react";

function SimpleCell({ children }) {
  return (
    <td style={{ padding: "8px", border: "1px solid #e6e6e6" }}>{children}</td>
  );
}

export default function DclsTable({ items = [], loading = false }) {
  if (loading) return <div>Loading DCLs...</div>;

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
              DCL No / ID
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Status
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Creator
            </th>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #ddd",
              }}
            >
              Created
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
            <tr key={it._id || it.id || it.dclNo || Math.random()}>
              <SimpleCell>{it.dclNo || it.id || it._id || "-"}</SimpleCell>
              <SimpleCell>{it.status || it.checklistStatus || "-"}</SimpleCell>
              <SimpleCell>
                {(it.creator && it.creator.name) || it.creatorName || "-"}
              </SimpleCell>
              <SimpleCell>{it.createdAt || it.created || "-"}</SimpleCell>
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
