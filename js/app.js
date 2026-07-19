const cover = document.getElementById("now-cover");
const artist = document.getElementById("now-artist");
const title = document.getElementById("now-title");

const browseOverlay = document.getElementById("browse-overlay");
const browseButton = document.getElementById("browse-button");
const closeBrowseButton = document.getElementById("close-browse");
const grid = document.getElementById("album-grid");
const searchInput = document.getElementById("search-input");
const albumCount = document.getElementById("album-count");

let collection = [];
let albumCards = [];
let currentRecord = null;
let ambientTimer;

// --------------------
// Now Playing
// --------------------

function fadeToRecord(record) {
  currentRecord = record;
  localStorage.setItem("nowPlaying", JSON.stringify(record));

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
  }, 180);
}

async function loadNowPlaying() {
  try {
    const savedRecord = localStorage.getItem("nowPlaying");

    if (savedRecord) {
      fadeToRecord(JSON.parse(savedRecord));
      return;
    }

    const response = await fetch("data/now-playing.json");

    if (!response.ok) {
      throw new Error(`Unable to load Now Playing: ${response.status}`);
    }

    const record = await response.json();
    fadeToRecord(record);
  } catch (error) {
    console.error(error);
  }
}

// --------------------
// Browse Collection
// --------------------

function openBrowse() {
  browseOverlay.classList.add("is-open");
  browseOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-open");

  searchInput.value = "";
  buildAlbumGrid(collection);
  renderCollection(collection);

  setTimeout(() => {

    let target = null;

    if (currentRecord) {
      target = [...grid.querySelectorAll(".album-card")].find(card =>
        card.dataset.artist === currentRecord.artist &&
        card.dataset.title === currentRecord.title
      );
    }

    if (!target) {
      target = grid.querySelector(".album-card");
    }

    if (target) {

      target.focus();

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });

    } else {

      searchInput.focus();

    }

  }, 50);
}

function closeBrowse() {
  browseOverlay.classList.remove("is-open");
  browseOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");

  browseButton.focus();
}

async function loadCollection() {
  try {
    const response = await fetch("data/collection.json");

    if (!response.ok) {
      throw new Error(`Unable to load collection: ${response.status}`);
    }

    collection = await response.json();
  } catch (error) {
    console.error(error);
    albumCount.textContent = "Unable to load collection";
  }
}

function buildAlbumGrid(records) {
  grid.innerHTML = "";
  albumCards = [];

  albumCount.textContent =
    records.length === collection.length
      ? `${records.length} albums`
      : `${records.length} match${records.length === 1 ? "" : "es"}`;

  records.forEach(record => {
    const card = document.createElement("article");

    card.className = "album-card";
    card.dataset.artist = record.artist;
    card.dataset.title = record.title;
    card.tabIndex = 0;
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
    albumCards.push({
      element: card,
      record
    });
  });
}

function handleSearchInput() {

  const search = searchInput.value.trim().toLowerCase();

  let visibleCount = 0;

  albumCards.forEach(card => {

    const visible =
      card.record.artist.toLowerCase().includes(search) ||
      card.record.title.toLowerCase().includes(search);

    card.element.style.display = visible ? "" : "none";

    if (visible) visibleCount++;

  });

  albumCount.textContent =
    visibleCount === collection.length
      ? `${visibleCount} albums`
      : `${visibleCount} match${visibleCount === 1 ? "" : "es"}`;
}

// --------------------
// Keyboard / Remote Input
// --------------------

function handleBrowseKeys(event) {
  if (!browseOverlay.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeBrowse();
    return;
  }

  if (document.activeElement === searchInput) {
    if (event.key === "ArrowDown") {
      const firstCard = grid.querySelector(".album-card");

      if (firstCard) {
        event.preventDefault();
        firstCard.focus();
      }
    }

    return;
  }

  const cards = [...grid.querySelectorAll(".album-card")];
  const currentIndex = cards.indexOf(document.activeElement);

  if (currentIndex === -1) return;

  const columnCount = getComputedStyle(grid)
    .gridTemplateColumns
    .split(" ")
    .filter(Boolean)
    .length;

  switch (event.key) {
    case "Enter":
    case " ":
      event.preventDefault();
      cards[currentIndex].click();
      return;

    case "ArrowRight":
      event.preventDefault();
      cards[currentIndex + 1]?.focus();
      return;

    case "ArrowLeft":
      event.preventDefault();
      cards[currentIndex - 1]?.focus();
      return;

    case "ArrowDown":
      event.preventDefault();
      cards[currentIndex + columnCount]?.focus();
      return;

    case "ArrowUp":
      event.preventDefault();

      if (currentIndex - columnCount >= 0) {
        cards[currentIndex - columnCount].focus();
      } else {
        searchInput.focus();
      }

      return;
  }

  if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
    searchInput.value = event.key;
    searchInput.focus();
    handleSearchInput();
  }
}

// --------------------
// Ambient Mode
// --------------------

function enterAmbient() {
  document.body.classList.add("is-ambient");
}

function exitAmbient() {
  document.body.classList.remove("is-ambient");
  clearTimeout(ambientTimer);
  ambientTimer = setTimeout(enterAmbient, 60000);
}

// --------------------
// Event Listeners
// --------------------

browseButton.addEventListener("click", openBrowse);
closeBrowseButton.addEventListener("click", closeBrowse);
searchInput.addEventListener("input", handleSearchInput);
window.addEventListener("keydown", handleBrowseKeys);

["mousemove", "keydown", "click", "touchstart"].forEach(eventName => {
  window.addEventListener(eventName, exitAmbient);
});

// --------------------
// Startup
// --------------------

loadNowPlaying();
loadCollection();
exitAmbient();