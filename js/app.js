const cover = document.getElementById("now-cover");
const artist = document.getElementById("now-artist");
const title = document.getElementById("now-title");

const browseOverlay = document.getElementById("browse-overlay");
const browseButton = document.querySelector(".actions button");
const closeBrowseButton = document.getElementById("close-browse");
const grid = document.getElementById("album-grid");
const searchInput = document.getElementById("search-input");
let collection = [];

let ambientTimer;

function fadeToRecord(record) {
  cover.style.opacity = 0;
  artist.style.opacity = 0;
  title.style.opacity = 0;

  setTimeout(() => {
    cover.src = record.cover;
    cover.alt = `${record.title} album cover`;
    artist.textContent = record.artist;
    title.textContent = record.title;

    cover.style.opacity = 1;
    artist.style.opacity = 1;
    title.style.opacity = 1;
    localStorage.setItem("nowPlaying", JSON.stringify(record));
  }, 180);
}

async function loadNowPlaying() {
  const savedRecord = localStorage.getItem("nowPlaying");

  if (savedRecord) {
    fadeToRecord(JSON.parse(savedRecord));
    return;
  }

  const response = await fetch("data/now-playing.json");
  const record = await response.json();

  fadeToRecord(record);
}

function openBrowse() {
  browseOverlay.classList.add("is-open");
  document.body.classList.add("overlay-open");
}

function closeBrowse() {
  browseOverlay.classList.remove("is-open");
  document.body.classList.remove("overlay-open");
}

async function loadCollection() {
  const response = await fetch("data/collection.json");
  collection = await response.json();

  grid.innerHTML = "";

  renderCollection(collection);
}

function renderCollection(records) {
  grid.innerHTML = "";

  records.forEach(record => {
    const card = document.createElement("article");
    card.className = "album-card";

    card.innerHTML = `
      <img src="${record.cover}" alt="${record.title} album cover">
      <h3>${record.artist}</h3>
      <p>${record.title}</p>
    `;

    card.addEventListener("click", () => {
      fadeToRecord(record);
      closeBrowse();
    });

    grid.appendChild(card);
  });
}

function enterAmbient() {
  document.body.classList.add("is-ambient");
}

function exitAmbient() {
  document.body.classList.remove("is-ambient");
  clearTimeout(ambientTimer);
  ambientTimer = setTimeout(enterAmbient, 60000);
}

browseButton.addEventListener("click", openBrowse);
closeBrowseButton.addEventListener("click", closeBrowse);

["mousemove", "keydown", "click", "touchstart"].forEach(event =>
  window.addEventListener(event, exitAmbient)
);

searchInput.addEventListener("input", () => {
  const search = searchInput.value.trim().toLowerCase();

  const filtered = collection.filter(record =>
    record.artist.toLowerCase().includes(search) ||
    record.title.toLowerCase().includes(search)
  );

  renderCollection(filtered);
});

loadNowPlaying();
loadCollection();
exitAmbient();