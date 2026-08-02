# Remote Input Foundation

Jeb's Records now translates keyboard, browser-TV, Android TV, and Fire TV
input into a small set of canonical commands:

- `up`
- `down`
- `left`
- `right`
- `select`
- `back`
- `text`

## Browser and keyboard mappings

- Arrow keys → directional commands
- Enter / Space → `select`
- Escape / Backspace / BrowserBack → `back`
- Printable characters → `text`

## Android / Fire TV key codes prepared

- 19 → DPAD_UP
- 20 → DPAD_DOWN
- 21 → DPAD_LEFT
- 22 → DPAD_RIGHT
- 23 → DPAD_CENTER
- 4 → BACK
- 66 → ENTER
- 111 → ESCAPE

## Native wrapper bridge

A future Android or Fire TV wrapper can dispatch input without depending on
browser-specific key behavior:

```javascript
window.JebsRemoteInput.send("up");
window.JebsRemoteInput.send("select");
window.JebsRemoteInput.send("back");
```

It can also dispatch a native numeric key code:

```javascript
window.JebsRemoteInput.send("select", {
  nativeKeyCode: 23
});
```

The visual application logic only receives canonical commands, keeping input
hardware separate from Browse, Ambient, and Liner Notes behavior.
