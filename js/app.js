const cover = document.getElementById("now-cover");
const artist = document.getElementById("now-artist");
const title = document.getElementById("now-title");
const nowDetails = document.getElementById("now-details");
const nowMeta = document.getElementById("now-meta");
const nowGenres = document.getElementById("now-genres");
const nowTracklist = document.getElementById("now-tracklist");

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
let detailsVisible = false;
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
// Liner Notes
// --------------------

function formatRecordList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" • ");
  }

  return value || "";
}

function hasMeaningfulYear(value) {
  return value && String(value) !== "0";
}

function getVinylSide(position) {
  const normalized = String(position || "").trim().toUpperCase();
  const match = normalized.match(/^([A-Z]+)(?=\d|$)/);

  return match ? match[1] : null;
}

function createTrackRow(track) {
  const row = document.createElement("li");
  row.className = "track-row";

  const trackTitle = document.createElement("span");
  trackTitle.className = "track-title";
  trackTitle.textContent = track.title || "Untitled";
  row.appendChild(trackTitle);

  if (track.duration) {
    const duration = document.createElement("span");
    duration.className = "track-duration";
    duration.textContent = track.duration;
    row.appendChild(duration);
  }

  if (Array.isArray(track.subTracks) && track.subTracks.length) {
    const subtrackList = document.createElement("ul");
    subtrackList.className = "subtrack-list";

    track.subTracks.forEach(subTrack => {
      const subtrackRow = document.createElement("li");
      subtrackRow.className = "subtrack-row";

      const subtrackTitle = document.createElement("span");
      subtrackTitle.textContent = subTrack.title || "Untitled";
      subtrackRow.appendChild(subtrackTitle);

      if (subTrack.duration) {
        const duration = document.createElement("span");
        duration.className = "track-duration";
        duration.textContent = subTrack.duration;
        subtrackRow.appendChild(duration);
      }

      subtrackList.appendChild(subtrackRow);
    });

    row.appendChild(subtrackList);
  }

  return row;
}

function createTrackSide(label, tracks) {
  const section = document.createElement("section");
  section.className = "track-side";

  const heading = document.createElement("h3");
  heading.className = "track-side-title";
  heading.textContent = label;
  section.appendChild(heading);

  const list = document.createElement("ol");
  list.className = "track-list";

  tracks.forEach(track => {
    list.appendChild(createTrackRow(track));
  });

  section.appendChild(list);
  return section;
}

function renderTracklist(tracklist) {
  nowTracklist.replaceChildren();

  const playableTracks = Array.isArray(tracklist)
    ? tracklist.filter(track =>
        track &&
        track.type !== "heading" &&
        (track.title || track.position)
      )
    : [];

  if (!playableTracks.length) {
    const empty = document.createElement("p");
    empty.className = "tracklist-empty";
    empty.textContent = "Track listing unavailable.";
    nowTracklist.appendChild(empty);
    return;
  }

  const vinylTracks = playableTracks.filter(track =>
    getVinylSide(track.position)
  );

  // Some Discogs releases bundle a CD after the vinyl track list.
  // When vinyl-style positions exist, only render those sides.
  const tracksToRender = vinylTracks.length
    ? vinylTracks
    : playableTracks;

  if (!vinylTracks.length) {
    nowTracklist.appendChild(
      createTrackSide("Track Listing", tracksToRender)
    );
    return;
  }

  const sides = new Map();

  tracksToRender.forEach(track => {
    const side = getVinylSide(track.position);

    if (!sides.has(side)) {
      sides.set(side, []);
    }

    sides.get(side).push(track);
  });

  sides.forEach((tracks, side) => {
    nowTracklist.appendChild(
      createTrackSide(`Side ${side}`, tracks)
    );
  });
}

function updateNowDetails(record) {
  const meta = [];

  if (hasMeaningfulYear(record.year)) meta.push(record.year);
  if (record.label) meta.push(record.label);

  nowMeta.textContent = meta.join(" • ");

  const genres = [
    formatRecordList(record.genres),
    formatRecordList(record.styles)
  ].filter(Boolean);

  nowGenres.textContent = genres.join(" • ");
  renderTracklist(record.tracklist);
}

function showDetails() {
  detailsVisible = true;
  document.body.classList.add("details-open");
  nowDetails.setAttribute("aria-hidden", "false");
  nowTracklist.scrollTop = 0;
}

function hideDetails() {
  detailsVisible = false;
  document.body.classList.remove("details-open");
  nowDetails.setAttribute("aria-hidden", "true");
}

function toggleDetails() {
  if (detailsVisible) {
    hideDetails();
  } else {
    showDetails();
  }
}

function scrollLinerNotes(direction) {
  const distance = Math.max(
    180,
    Math.round(nowTracklist.clientHeight * .72)
  );

  nowTracklist.scrollBy({
    top: distance * direction,
    behavior: "smooth"
  });
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
    updateNowDetails(record);

    cover.style.opacity = 1;
    artist.style.opacity = 1;
    title.style.opacity = 1;
  }, 180);
}

function findCollectionRecord(record) {
  if (!record) return null;

  return collection.find(candidate =>
    (record.id && candidate.id === record.id) ||
    (
      record.releaseId &&
      String(candidate.releaseId) === String(record.releaseId)
    ) ||
    (
      candidate.artist === record.artist &&
      candidate.title === record.title
    )
  ) || null;
}

async function loadNowPlaying() {
  try {
    const savedRecord = localStorage.getItem("nowPlaying");

    if (savedRecord) {
      const parsedRecord = JSON.parse(savedRecord);
      fadeToRecord(findCollectionRecord(parsedRecord) || parsedRecord);
      return;
    }

    const response = await fetch("data/now-playing.json");

    if (!response.ok) {
      throw new Error(`Unable to load Now Playing: ${response.status}`);
    }

    const record = await response.json();
    fadeToRecord(findCollectionRecord(record) || record);
  } catch (error) {
    console.error(error);
  }
}

// --------------------
// Browse Collection
// --------------------

function openBrowse() {
  hideDetails();
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

const RemoteCommand = Object.freeze({
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
  SELECT: "select",
  BACK: "back",
  TEXT: "text"
});

const keyCommandMap = new Map([
  ["ArrowUp", RemoteCommand.UP],
  ["Up", RemoteCommand.UP],
  ["ArrowDown", RemoteCommand.DOWN],
  ["Down", RemoteCommand.DOWN],
  ["ArrowLeft", RemoteCommand.LEFT],
  ["Left", RemoteCommand.LEFT],
  ["ArrowRight", RemoteCommand.RIGHT],
  ["Right", RemoteCommand.RIGHT],
  ["Enter", RemoteCommand.SELECT],
  ["NumpadEnter", RemoteCommand.SELECT],
  [" ", RemoteCommand.SELECT],
  ["Spacebar", RemoteCommand.SELECT],
  ["Escape", RemoteCommand.BACK],
  ["Esc", RemoteCommand.BACK],
  ["Backspace", RemoteCommand.BACK],
  ["BrowserBack", RemoteCommand.BACK],
  ["GoBack", RemoteCommand.BACK]
]);

// Includes legacy browser key codes and Android / Fire TV KeyEvent codes.
// A future native wrapper can pass one of these as detail.nativeKeyCode.
const nativeKeyCommandMap = new Map([
  [4, RemoteCommand.BACK],       // Android KEYCODE_BACK
  [8, RemoteCommand.BACK],       // Browser Backspace
  [13, RemoteCommand.SELECT],    // Browser Enter
  [19, RemoteCommand.UP],        // Android KEYCODE_DPAD_UP
  [20, RemoteCommand.DOWN],      // Android KEYCODE_DPAD_DOWN
  [21, RemoteCommand.LEFT],      // Android KEYCODE_DPAD_LEFT
  [22, RemoteCommand.RIGHT],     // Android KEYCODE_DPAD_RIGHT
  [23, RemoteCommand.SELECT],    // Android KEYCODE_DPAD_CENTER
  [27, RemoteCommand.BACK],      // Browser Escape
  [32, RemoteCommand.SELECT],    // Browser Space
  [37, RemoteCommand.LEFT],      // Browser ArrowLeft
  [38, RemoteCommand.UP],        // Browser ArrowUp
  [39, RemoteCommand.RIGHT],     // Browser ArrowRight
  [40, RemoteCommand.DOWN],      // Browser ArrowDown
  [62, RemoteCommand.SELECT],    // Android KEYCODE_SPACE
  [66, RemoteCommand.SELECT],    // Android KEYCODE_ENTER
  [111, RemoteCommand.BACK]      // Android KEYCODE_ESCAPE
]);

function normalizeRemoteCommand(value) {
  if (!value) return null;

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    up: RemoteCommand.UP,
    dpad_up: RemoteCommand.UP,

    down: RemoteCommand.DOWN,
    dpad_down: RemoteCommand.DOWN,

    left: RemoteCommand.LEFT,
    dpad_left: RemoteCommand.LEFT,

    right: RemoteCommand.RIGHT,
    dpad_right: RemoteCommand.RIGHT,

    select: RemoteCommand.SELECT,
    enter: RemoteCommand.SELECT,
    ok: RemoteCommand.SELECT,
    center: RemoteCommand.SELECT,
    dpad_center: RemoteCommand.SELECT,

    back: RemoteCommand.BACK,
    escape: RemoteCommand.BACK,
    esc: RemoteCommand.BACK,

    text: RemoteCommand.TEXT,
    type: RemoteCommand.TEXT
  };

  return aliases[normalized] || null;
}

function getNumericKeyCode(event) {
  const candidates = [
    event.detail?.nativeKeyCode,
    event.detail?.keyCode,
    event.nativeKeyCode,
    event.keyCode,
    event.which
  ];

  return candidates.find(value =>
    Number.isInteger(Number(value))
  );
}

function getRemoteInput(event) {
  const customCommand = normalizeRemoteCommand(
    event.detail?.command
  );

  if (customCommand) {
    return {
      command: customCommand,
      text: event.detail?.text || ""
    };
  }

  const keyCommand = keyCommandMap.get(event.key);

  if (keyCommand) {
    return {
      command: keyCommand,
      text: ""
    };
  }

  const numericCode = Number(getNumericKeyCode(event));
  const nativeCommand = nativeKeyCommandMap.get(numericCode);

  if (nativeCommand) {
    return {
      command: nativeCommand,
      text: ""
    };
  }

  if (
    event.key &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    return {
      command: RemoteCommand.TEXT,
      text: event.key
    };
  }

  return null;
}

function preventInputDefault(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function moveBrowseSelection(command, visible) {
  const columnCount = getComputedStyle(grid)
    .gridTemplateColumns
    .split(" ")
    .filter(Boolean)
    .length;

  switch (command) {
    case RemoteCommand.RIGHT:
      selectedIndex =
        selectedIndex < visible.length - 1
          ? selectedIndex + 1
          : 0;
      break;

    case RemoteCommand.LEFT:
      selectedIndex =
        selectedIndex > 0
          ? selectedIndex - 1
          : visible.length - 1;
      break;

    case RemoteCommand.DOWN:
      if (selectedIndex + columnCount < visible.length) {
        selectedIndex += columnCount;
      } else {
        selectedIndex = selectedIndex % columnCount;

        if (selectedIndex >= visible.length) {
          selectedIndex = visible.length - 1;
        }
      }
      break;

    case RemoteCommand.UP:
      if (selectedIndex - columnCount >= 0) {
        selectedIndex -= columnCount;
      } else {
        const lastRow =
          visible.length -
          (visible.length % columnCount || columnCount);

        let candidate = lastRow + selectedIndex;

        if (candidate >= visible.length) {
          candidate -= columnCount;
        }

        selectedIndex = candidate;
      }
      break;
  }

  updateSelection();
}

function handleAmbientCommand(input, event) {
  switch (input.command) {
    case RemoteCommand.SELECT:
      preventInputDefault(event);
      toggleDetails();
      return true;

    case RemoteCommand.BACK:
      if (!detailsVisible) return false;

      preventInputDefault(event);
      hideDetails();
      return true;

    case RemoteCommand.DOWN:
      if (detailsVisible) {
        preventInputDefault(event);
        scrollLinerNotes(1);
        return true;
      }

      preventInputDefault(event);
      openBrowse();
      return true;

    case RemoteCommand.UP:
      if (detailsVisible) {
        preventInputDefault(event);
        scrollLinerNotes(-1);
        return true;
      }

      preventInputDefault(event);
      openBrowse();
      return true;

    case RemoteCommand.LEFT:
    case RemoteCommand.RIGHT:
      preventInputDefault(event);
      openBrowse();
      return true;
  }

  return false;
}

function handleBrowseCommand(input, event) {
  if (input.command === RemoteCommand.BACK) {
    preventInputDefault(event);
    closeBrowse();
    return true;
  }

  if (document.activeElement === searchInput) {
    if (input.command === RemoteCommand.DOWN) {
      const firstVisibleCard = getVisibleCards()[0]?.element;

      if (firstVisibleCard) {
        preventInputDefault(event);
        firstVisibleCard.focus();
      }

      return true;
    }

    if (
      input.command === RemoteCommand.TEXT &&
      event.type === "jebs-remote-input"
    ) {
      preventInputDefault(event);
      searchInput.value += input.text;
      handleSearchInput();
      return true;
    }

    // Allow normal browser text editing while the search field is focused.
    return false;
  }

  const visible = getVisibleCards();

  if (!visible.length) return false;

  selectedIndex = visible.findIndex(card =>
    card.element === document.activeElement
  );

  if (selectedIndex === -1) {
    selectedIndex = 0;
  }

  if (input.command === RemoteCommand.SELECT) {
    preventInputDefault(event);
    visible[selectedIndex].element.click();
    return true;
  }

  if (
    [
      RemoteCommand.UP,
      RemoteCommand.DOWN,
      RemoteCommand.LEFT,
      RemoteCommand.RIGHT
    ].includes(input.command)
  ) {
    preventInputDefault(event);
    moveBrowseSelection(input.command, visible);
    return true;
  }

  if (input.command === RemoteCommand.TEXT && input.text) {
    preventInputDefault(event);
    searchInput.value = input.text;
    searchInput.focus();
    handleSearchInput();
    return true;
  }

  return false;
}

function handleInputEvent(event) {
  const input = getRemoteInput(event);

  if (!input) return;

  exitAmbient();

  if (browseOverlay.classList.contains("is-open")) {
    handleBrowseCommand(input, event);
  } else {
    handleAmbientCommand(input, event);
  }
}

function sendRemoteCommand(command, options = {}) {
  const normalizedCommand = normalizeRemoteCommand(command);

  if (!normalizedCommand) {
    throw new Error(`Unknown remote command: ${command}`);
  }

  window.dispatchEvent(
    new CustomEvent("jebs-remote-input", {
      detail: {
        command: normalizedCommand,
        text: options.text || "",
        nativeKeyCode: options.nativeKeyCode
      },
      cancelable: true
    })
  );
}

// Native Android / Fire TV wrappers can call:
// window.JebsRemoteInput.send("up")
// window.JebsRemoteInput.send("select")
// window.JebsRemoteInput.send("back")
window.JebsRemoteInput = Object.freeze({
  commands: RemoteCommand,
  send: sendRemoteCommand
});

// --------------------
// Ambient Mode
// --------------------

function enterAmbient() {
  document.body.classList.add("is-ambient");
}

function exitAmbient() {
  document.body.classList.remove("is-ambient");
  clearTimeout(ambientTimer);
  ambientTimer = setTimeout(enterAmbient, 30000);
}

// --------------------
// Event Listeners
// --------------------

browseButton.addEventListener("click", openBrowse);
closeBrowseButton.addEventListener("click", closeBrowse);
searchInput.addEventListener("input", handleSearchInput);
cover.addEventListener("click", toggleDetails);

window.addEventListener("keydown", handleInputEvent);
window.addEventListener("jebs-remote-input", handleInputEvent);

["mousemove", "click", "touchstart", "pointerdown"].forEach(eventName => {
  window.addEventListener(eventName, exitAmbient, { passive: true });
});

// --------------------
// Startup
// --------------------

async function startApp() {
  await loadCollection();
  await loadNowPlaying();
  exitAmbient();
}

startApp();

// --------------------
// Background Updater
// --------------------

function updateBrowseBackground() {
  if (!selectedRecord || !selectedRecord.cover) return;

  browseBackground.style.backgroundImage =
    `url("${selectedRecord.cover}")`;
}