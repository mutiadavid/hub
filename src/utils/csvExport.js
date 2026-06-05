/**
 * Shared CSV export utility for admin dashboards.
 * Converts an array of objects to a CSV file and triggers download.
 */
export function downloadCSV(data, columns, filename) {
  if (!data || data.length === 0) return;

  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns
      .map((col) => {
        let value = typeof col.accessor === "function"
          ? col.accessor(row)
          : row[col.key] ?? "";
        value = String(value).replace(/"/g, '""');
        return `"${value}"`;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
