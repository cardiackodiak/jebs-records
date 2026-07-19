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

async function fetchReleaseData(releaseId) {
  try {
    const { data: release } = await api.get(`/releases/${releaseId}`);

    let cover =
      release.images?.find(image => image.type === "primary")?.uri ??
      release.images?.[0]?.uri ??
      release.cover_image ??
      release.thumb ??
      "images/placeholder-cover.svg";

    let thumb =
      release.images?.find(image => image.type === "primary")?.uri150 ??
      release.images?.[0]?.uri150 ??
      release.thumb ??
      cover;

    // Prefer the master release image for cleaner, canonical artwork.
    if (release.master_id) {
      await wait(1100);

      try {
        const { data: master } = await api.get(
          `/masters/${release.master_id}`
        );

        const masterImage =
          master.images?.find(image => image.type === "primary") ??
          master.images?.[0];

        if (masterImage?.uri) {
          cover = masterImage.uri;
          thumb = masterImage.uri150 ?? master.thumb ?? cover;
        }
      } catch (error) {
        console.warn(
          `Could not load master artwork for ${releaseId}; using release artwork.`
        );
      }
    }

    return {
      releaseData: release,
      cover,
      thumb
    };
  } catch (error) {
    console.warn(`Could not load release ${releaseId}`);

    return {
      releaseData: {},
      cover: "images/placeholder-cover.svg",
      thumb: "images/placeholder-cover.svg"
    };
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

    const { releaseData, cover, thumb } =
      await fetchReleaseData(item.release_id);

    records.push({
      id: `${item.release_id}-${index + 1}`,
      releaseId: item.release_id,
      masterId: releaseData.master_id ?? null,
      artist: item.Artist,
      title: item.Title,
      year: item.Released,
      country: releaseData.country ?? "",
      genres: releaseData.genres ?? [],
      styles: releaseData.styles ?? [],
      labels: releaseData.labels?.map(label => label.name) ?? [],
      label: item.Label,
      format: item.Format,
      rating: item.Rating,
      dateAdded: item["Date Added"],
      notes: item["Collection Notes"],
      cover,
      thumb
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