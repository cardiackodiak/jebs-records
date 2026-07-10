require("dotenv").config();

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { parse } = require("csv-parse/sync");

const inputPath = path.join(__dirname, "..", "imports", "discogs.csv");
const outputPath = path.join(__dirname, "..", "data", "collection.json");

const token = process.env.DISCOGS_TOKEN;

if (!token) {
  throw new Error("DISCOGS_TOKEN is missing from .env");
}

const api = axios.create({
  baseURL: "https://api.discogs.com",
  headers: {
    Authorization: `Discogs token=${token}`,
    "User-Agent": "JebsRecords/1.0"
  }
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchArtwork(releaseId) {
  try {
    const { data: release } = await api.get(`/releases/${releaseId}`);

    // Prefer the master release image for cleaner, canonical artwork.
    if (release.master_id) {
      await wait(1100);

      try {
        const { data: master } = await api.get(`/masters/${release.master_id}`);

        const masterImage =
          master.images?.find(image => image.type === "primary") ??
          master.images?.[0];

        if (masterImage?.uri) {
          return masterImage.uri;
        }
      } catch (error) {
        console.warn(`Could not load master artwork for ${releaseId}`);
      }
    }

    const releaseImage =
      release.images?.find(image => image.type === "primary") ??
      release.images?.[0];

    return (
      releaseImage?.uri ??
      release.cover_image ??
      release.thumb ??
      "images/placeholder-cover.svg"
    );
  } catch (error) {
    console.warn(`Could not load release ${releaseId}`);
    return "images/placeholder-cover.svg";
  }
}

async function importCollection() {
  const csv = fs.readFileSync(inputPath, "utf8");

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });

  const records = [];

  for (let index = 0; index < rows.length; index++) {
    const item = rows[index];

    console.log(
      `[${index + 1}/${rows.length}] ${item.Artist} — ${item.Title}`
    );

    const cover = await fetchArtwork(item.release_id);

    records.push({
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
      cover
    });

    await wait(1100);
  }

  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

  console.log(`Imported ${records.length} records with artwork.`);
}

importCollection().catch(error => {
  console.error(error.message);
  process.exit(1);
});