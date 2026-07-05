const state = {
  collection: [],
  favorites: [],
  nowPlayingId: null,
};

const els = {
  navButtons: document.querySelectorAll('[data-view]'),
  viewLinks: document.querySelectorAll('[data-view-link]'),
  views: document.querySelectorAll('.view'),
  albumGrid: document.querySelector('#album-grid'),
  favoritesGrid: document.querySelector('#favorites-grid'),
  searchInput: document.querySelector('#search-input'),
  cardTemplate: document.querySelector('#album-card-template'),
  nowCover: document.querySelector('#now-cover'),
  nowTitle: document.querySelector('#now-title'),
  nowArtist: document.querySelector('#now-artist'),
  nowMeta: document.querySelector('#now-meta'),
  nowNote: document.querySelector('#now-note'),
  collectionCount: document.querySelector('#collection-count'),
  surpriseButton: document.querySelector('#surprise-button'),
  surpriseFromNow: document.querySelector('#surprise-from-now'),
  surpriseResult: document.querySelector('#surprise-result'),
};

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return await response.json();
  } catch (error) {
    console.warn(error);
    return fallback;
  }
}

async function init() {
  const [collection, favorites, nowPlaying] = await Promise.all([
    loadJson('data/collection.json', []),
    loadJson('data/favorites.json', []),
    loadJson('data/now-playing.json', {}),
  ]);

  state.collection = collection;
  state.favorites = favorites;
  state.nowPlayingId = nowPlaying.id ?? collection[0]?.id ?? null;

  renderNowPlaying();
  renderCollection(collection);
  renderFavorites();
  bindEvents();

  els.collectionCount.textContent = `${collection.length} records`;
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });

  els.viewLinks.forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.viewLink));
  });

  els.searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const matches = state.collection.filter((album) => {
      const haystack = `${album.artist} ${album.title} ${album.year} ${(album.genres || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
    renderCollection(matches);
  });

  els.surpriseButton.addEventListener('click', chooseSurprise);
  els.surpriseFromNow.addEventListener('click', () => {
    showView('surprise');
    chooseSurprise();
  });

  document.addEventListener('keydown', handleKeyboardShortcuts);
}

function showView(viewName) {
  els.views.forEach((view) => view.classList.remove('is-visible'));
  document.querySelector(`#view-${viewName}`)?.classList.add('is-visible');

  els.navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === viewName);
  });
}

function renderNowPlaying() {
  const album = findAlbum(state.nowPlayingId);
  if (!album) return;

  els.nowCover.src = album.cover || 'images/placeholder-cover.svg';
  els.nowCover.alt = `${album.title} album cover`;
  els.nowTitle.textContent = album.title;
  els.nowArtist.textContent = album.artist;
  els.nowNote.textContent = album.note || 'No listening note yet.';
  els.nowMeta.innerHTML = '';

  [album.year, ...(album.genres || []).slice(0, 3)].filter(Boolean).forEach((item) => {
    const pill = document.createElement('span');
    pill.className = 'meta-pill';
    pill.textContent = item;
    els.nowMeta.appendChild(pill);
  });
}

function renderCollection(albums) {
  els.albumGrid.innerHTML = '';
  albums.forEach((album) => els.albumGrid.appendChild(createAlbumCard(album)));
}

function renderFavorites() {
  els.favoritesGrid.innerHTML = '';
  const albums = state.favorites.map(findAlbum).filter(Boolean);
  albums.forEach((album) => els.favoritesGrid.appendChild(createAlbumCard(album)));
}

function createAlbumCard(album) {
  const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
  const cover = node.querySelector('.album-cover');
  cover.src = album.cover || 'images/placeholder-cover.svg';
  cover.alt = `${album.title} album cover`;
  node.querySelector('.album-title').textContent = album.title;
  node.querySelector('.album-artist').textContent = album.artist;
  node.querySelector('.album-meta').textContent = [album.year, ...(album.genres || []).slice(0, 1)].filter(Boolean).join(' • ');

  node.addEventListener('click', () => setNowPlaying(album.id));
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') setNowPlaying(album.id);
  });

  return node;
}

function setNowPlaying(albumId) {
  state.nowPlayingId = albumId;
  renderNowPlaying();
  showView('now');
}

function chooseSurprise() {
  const candidates = state.collection.filter((album) => album.id !== state.nowPlayingId);
  const album = candidates[Math.floor(Math.random() * candidates.length)] || state.collection[0];
  if (!album) return;

  els.surpriseResult.innerHTML = '';
  const card = createAlbumCard(album);
  els.surpriseResult.appendChild(card);
}

function findAlbum(id) {
  return state.collection.find((album) => String(album.id) === String(id));
}

function handleKeyboardShortcuts(event) {
  if (event.target.matches('input, textarea')) return;
  const shortcuts = {
    '1': 'now',
    '2': 'browse',
    '3': 'recommends',
    '4': 'surprise',
  };
  if (shortcuts[event.key]) showView(shortcuts[event.key]);
}

init();
