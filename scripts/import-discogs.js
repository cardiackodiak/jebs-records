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
  },
  timeout: 20000
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiGet(url) {
  const response = await api.get(url);

  // Discogs may return rate-limit information in these headers.
  const remaining = Number(response.headers["x-discogs-ratelimit-remaining"]);

  if (Number.isFinite(remaining) && remaining <= 2) {
    console.log("Discogs rate limit is low; pausing briefly...");
    await wait(5000);
  }

  return response.data;
}

function normalizeTrack(track) {
  const normalized = {
    position: track.position ?? "",
    type: track.type_ ?? "track",
    title: track.title ?? "",
    duration: track.duration ?? ""
  };

  if (Array.isArray(track.sub_tracks) && track.sub_tracks.length) {
    normalized.subTracks = track.sub_tracks.map(normalizeTrack);
  }

  return normalized;
}

function normalizeTracklist(tracklist) {
  if (!Array.isArray(tracklist)) {
    return [];
  }

  return tracklist
    .map(normalizeTrack)
    .filter(track => track.title || track.position);
}

function findPrimaryImage(images) {
  if (!Array.isArray(images) || !images.length) {
    return null;
  }

  return images.find(image => image.type === "primary") ?? images[0];
}

async function fetchRelease(releaseId) {
  try {
    return await apiGet(`/releases/${releaseId}`);
  } catch (error) {
    const status = error.response?.status;
    const detail = status ? `HTTP ${status}` : error.message;

    console.warn(`Could not load release ${releaseId}: ${detail}`);
    return null;
  }
}

async function fetchMasterArtwork(masterId) {
  if (!masterId) {
    return null;
  }

  await wait(1100);

  try {
    const master = await apiGet(`/masters/${masterId}`);
    return findPrimaryImage(master.images)?.uri ?? null;
  } catch (error) {
    const status = error.response?.status;
    const detail = status ? `HTTP ${status}` : error.message;

    console.warn(`Could not load master ${masterId}: ${detail}`);
    return null;
  }
}

async function buildRecord(item, index) {
  const releaseId = item.release_id;
  const release = await fetchRelease(releaseId);

  if (!release) {
    return {
      id: `${releaseId}-${index + 1}`,
      releaseId,
      masterId: null,
      artist: item.Artist,
      title: item.Title,
      year: item.Released,
      country: "",
      genres: [],
      styles: [],
      labels: [],
      label: item.Label,
      format: item.Format,
      rating: item.Rating,
      dateAdded: item["Date Added"],
      notes: item["Collection Notes"],
      cover: "images/placeholder-cover.svg",
      thumb: "images/placeholder-cover.svg",
      tracklist: []
    };
  }

  const releaseImage = findPrimaryImage(release.images);
  const masterArtwork = await fetchMasterArtwork(release.master_id);

  const cover =
    masterArtwork ??
    releaseImage?.uri ??
    release.cover_image ??
    release.thumb ??
    "images/placeholder-cover.svg";

  return {
    id: `${releaseId}-${index + 1}`,
    releaseId,
    masterId: release.master_id ?? null,
    artist: item.Artist,
    title: item.Title,
    year: item.Released,
    country: release.country ?? "",
    genres: release.genres ?? [],
    styles: release.styles ?? [],
    labels: release.labels?.map(label => label.name) ?? [],
    label: item.Label,
    format: item.Format,
    rating: item.Rating,
    dateAdded: item["Date Added"],
    notes: item["Collection Notes"],
    cover,
    thumb: release.thumb ?? cover,

    // Exact track listing for this Discogs release.
    tracklist: normalizeTracklist(release.tracklist)
  };
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

    const record = await buildRecord(item, index);
    records.push(record);

    // Keep requests comfortably inside Discogs' API limits.
    await wait(1100);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

  const trackCount = records.reduce(
    (total, record) => total + record.tracklist.length,
    0
  );

  console.log(
    `Imported ${records.length} records with artwork and ${trackCount} tracklist entries.`
  );
}

importCollection().catch(error => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
