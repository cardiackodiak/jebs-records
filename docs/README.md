# Jeb's Records

A quiet, living-room-friendly vinyl collection interface for Fire TV and phones.

## What this first starter version includes

- Now Spinning screen prioritized for TV/living-room use
- Browse grid
- Instant search
- Jeb Recommends from `data/favorites.json`
- Surprise Me
- Sample collection data in `data/collection.json`

## How to preview locally

Open `index.html` in a browser. If your browser blocks local JSON fetches, run a tiny local server:

```bash
cd jebs-records
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Editing Now Playing

For this starter version, edit `data/now-playing.json`:

```json
{
  "id": 1
}
```

That `id` should match an album in `data/collection.json`.

## Editing Jeb Recommends

Edit `data/favorites.json` with album IDs:

```json
[1, 2, 3]
```

## Next step

Replace the sample records with real Discogs data for username `prettyarmored` using a sync script.
