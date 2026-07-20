const cover = document.getElementById("now-cover");
const artist = document.getElementById("now-artist");
const title = document.getElementById("now-title");

const browseOverlay = document.getElementById("browse-overlay");
const browseButton = document.getElementById("browse-button");
const closeBrowseButton = document.getElementById("close-browse");
const grid = document.getElementById("album-grid");
const searchInput = document.getElementById("search-input");
const albumCount = document.getElementById("album-count");
const browseBackground = document.getElementById("browse-background");
const browseArtist = document.getElementById("browse-artist");
const browseTitle = document.getElementById("browse-title");
const browseMeta = document.getElementById("browse-meta");

let collection = [];
let albumCards = [];
let selectedIndex = 0;
let currentRecord = null;
let selectedRecord = null;
let ambientTimer;

// --------------------
// Preview Updater
// --------------------


function updateBrowsePreview() {

  if (!selectedRecord) return;

  browseArtist.textContent = selectedRecord.artist;
  browseTitle.textContent = selectedRecord.title;

  const meta = [];

  if (selectedRecord.year)
    meta.push(selectedRecord.year);

  if (selectedRecord.genre)
    meta.push(selectedRecord.genre);

  if (selectedRecord.label)
    meta.push(selectedRecord.label);

  browseMeta.textContent = meta.join(" • ");
}

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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
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
        target.focus({ preventScroll: true });

        target.scrollIntoView({
          behavior: "auto",
          block: "center",
          inline: "center"
        });
      } else {
        searchInput.focus();
      }
    });
  });
}

function closeBrowse() {
  browseOverlay.classList.remove("is-open");
  browseOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");

  browseButton.focus();
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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

  const visible = getVisibleCards();

  if (
    visible.length &&
    document.activeElement !== searchInput
  ) {
    selectedIndex = 0;
    updateSelection();
  }
}

function getVisibleCards() {
  return albumCards.filter(card =>
    card.element.style.display !== "none"
  );
}

function updateSelection() {
  const visible = getVisibleCards();

  if (!visible.length) return;

  selectedIndex = Math.max(
    0,
    Math.min(selectedIndex, visible.length - 1)
  );

  const selectedElement =
    visible[selectedIndex].element;

  selectedElement.focus({
    preventScroll: true
  });

  selectedRecord =
    visible[selectedIndex].record;

  updateBrowseBackground();
  updateBrowsePreview();

  selectedElement.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth"
  });

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

  const visible = getVisibleCards();

  if (!visible.length) return;

  selectedIndex = visible.findIndex(card =>
    card.element === document.activeElement
  );

  if (selectedIndex === -1) {
    selectedIndex = 0;
  }

  const columnCount = getComputedStyle(grid)
    .gridTemplateColumns
    .split(" ")
    .filter(Boolean)
    .length;

  switch (event.key) {
    case "Enter":
    case " ":
      event.preventDefault();
      visible[selectedIndex].element.click();
      return;

    case "ArrowRight":
      event.preventDefault();

      if (selectedIndex < visible.length - 1) {
        selectedIndex++;
      } else {
        selectedIndex = 0;
      }

      updateSelection();
      return;

    case "ArrowLeft":
      event.preventDefault();

      if (selectedIndex > 0) {
        selectedIndex--;
      } else {
        selectedIndex = visible.length - 1;
      }

      updateSelection();
      return;

    case "ArrowDown":
      event.preventDefault();

      if (selectedIndex + columnCount < visible.length) {
        selectedIndex += columnCount;
      } else {
        selectedIndex = selectedIndex % columnCount;
        if (selectedIndex >= visible.length) {
          selectedIndex = visible.length - 1;
        }
      }

      updateSelection();
      return;

    case "ArrowUp":
      event.preventDefault();

      if (selectedIndex - columnCount >= 0) {
        selectedIndex -= columnCount;
      } else {
        let lastRow =
          visible.length -
          (visible.length % columnCount || columnCount);

        let candidate = lastRow + selectedIndex;

        if (candidate >= visible.length) {
          candidate -= columnCount;
        }

        selectedIndex = candidate;
      }

      updateSelection();
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

// --------------------
// Background Updater
// --------------------

function updateBrowseBackground() {
  if (!selectedRecord || !selectedRecord.cover) return;

  browseBackground.style.backgroundImage =
    `url("${selectedRecord.cover}")`;
}