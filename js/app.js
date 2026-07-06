
const cover = document.getElementById("now-cover");
const artist = document.getElementById("now-artist");
const title = document.getElementById("now-title");

async function loadNowPlaying() {
cover.style.opacity = 0;
artist.style.opacity = 0;
title.style.opacity = 0;

const response = await fetch("data/now-playing.json");
const record = await response.json();

setTimeout(() => {
  cover.src = record.cover;
  cover.alt = `${record.title} album cover`;
  artist.textContent = record.artist;
  title.textContent = record.title;

  cover.style.opacity = 1;
  artist.style.opacity = 1;
  title.style.opacity = 1;
}, 200);

  document.getElementById("now-cover").src = record.cover;
  document.getElementById("now-cover").alt = `${record.title} album cover`;
  document.getElementById("now-artist").textContent = record.artist;
  document.getElementById("now-title").textContent = record.title;
}

setTimeout(loadNowPlaying, 250);

let ambientTimer;

function enterAmbient() {
  document.body.classList.add("is-ambient");
}

function exitAmbient() {
  document.body.classList.remove("is-ambient");

  clearTimeout(ambientTimer);

  ambientTimer = setTimeout(enterAmbient, 60000);
}

["mousemove", "keydown", "click", "touchstart"].forEach(event =>
  window.addEventListener(event, exitAmbient)
);

exitAmbient();