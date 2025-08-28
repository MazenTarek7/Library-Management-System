const EOL = "\n";

/**
 * Convert an array of objects to CSV string
 *
 * @param {Array<Record<string, any>>} rows
 * @param {string[]} [columns]
 * @returns {string}
 */
function toCSV(rows, columns) {
  const safeRows = Array.isArray(rows) ? rows : [];

  let headerColumns = columns && columns.length > 0 ? columns.slice() : [];
  if (headerColumns.length === 0) {
    const keySet = new Set();
    for (const row of safeRows) {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => keySet.add(k));
      }
    }
    headerColumns = Array.from(keySet).sort();
  }

  const escapeCell = (value) => {
    if (value === null || value === undefined) return "";
    const str = value instanceof Date ? value.toISOString() : String(value);
    const needsQuoting = /[",\n\r]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuoting ? `"${escaped}"` : escaped;
  };

  const header = headerColumns.map(escapeCell).join(",");
  const body = safeRows
    .map((row) =>
      headerColumns.map((c) => escapeCell(row ? row[c] : undefined)).join(",")
    )
    .join(EOL);

  return [header, body].filter(Boolean).join(EOL) + EOL;
}

module.exports = { toCSV };
