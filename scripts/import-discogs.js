const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "imports", "discogs.csv");
const outputPath = path.join(__dirname, "..", "data", "collection.json");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
      if (char === "\r" && next === "\n") i++;
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

const csv = fs.readFileSync(inputPath, "utf8");
const rows = parseCSV(csv);
const headers = rows.shift();

const records = rows.map((row, index) => {
  const item = Object.fromEntries(headers.map((header, i) => [header, row[i] || ""]));

  return {
    id: `${item.release_id}-${index + 1}`,
    releaseId: item.release_id,
    artist: item.Artist,
    title: item.Title,
    year: item.Released,
    label: item.Label,
    format: item.Format,
    rating: item.Rating,
    dateAdded: item["Date Added"],
    notes: item["Collection Notes"],
    cover: "images/placeholder-cover.svg"
  };
});

fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

console.log(`Imported ${records.length} records to data/collection.json`);