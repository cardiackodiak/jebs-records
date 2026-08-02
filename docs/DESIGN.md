# Jeb's Records

*A television-first vinyl collection browser.*

---

# Vision

Jeb's Records exists to make owning and listening to records more enjoyable.

It is **not** a Discogs client.

It is **not** a database browser.

It is **not** music library management software.

It is a television application designed to help someone browse, select, and enjoy a personal vinyl collection from the comfort of a listening room.

The application should disappear into the background and let the music become the focus.

---

# Guiding Principle

Every feature should answer one question:

> **Does this make listening to records more enjoyable?**

If the answer is no, the feature probably does not belong.

---

# Target Platform

The application is designed primarily for:

- Amazon Fire TV
- Android TV
- Google TV

The current web version exists because it is the fastest environment for development and testing.

Desktop browsers are considered a development platform—not the final experience.

---

# Input Philosophy

The application must be fully usable with only a television remote.

Supported actions:

- Up
- Down
- Left
- Right
- Select (Enter)
- Back (Escape)

No cursor should ever be required.

Keyboard navigation mirrors television remote behavior during development.

Business logic should remain independent from the input device so the same navigation code works with:

- keyboard
- Fire TV remote
- Android TV remote
- Bluetooth remotes
- game controllers

---

# Design Philosophy

The interface should feel calm.

It should encourage browsing.

It should encourage rediscovering forgotten albums.

The application should feel more like:

- Spotify TV
- Plex
- Apple TV
- Netflix
- Kodi

than:

- Discogs
- Excel
- database software
- a traditional website

---

# Listening Room Design

The application is intended to be used:

- while listening to records
- in a dim room
- from 8–15 feet away

Large bright surfaces quickly become distracting.

The interface should embrace darkness.

Backgrounds should be nearly black.

Accent colors should be subtle.

Album artwork should provide character—not illumination.

---

# Visual Style

Preferred characteristics:

- dark
- understated
- premium
- minimal
- warm

Avoid:

- bright white backgrounds
- excessive gradients
- visual clutter
- unnecessary animation
- information overload

---

# Typography

Text should remain readable across a room.

Information hierarchy should be obvious.

Primary:

Artist

Album

Secondary:

Year

Label

Genre

Styles

Everything else is optional.

---

# Home Screen

The Home screen centers around **Now Spinning**.

This is the emotional center of the application.

It should celebrate the record currently being played.

Most of the time the interface should remain quiet.

The listener should primarily see album artwork.

---

# Information Overlay

The Now Spinning screen supports two viewing modes.

## Artwork Mode

Default.

Displays:

- album artwork
- subtle title
- minimal interface

The screen should almost resemble framed album art.

---

## Information Mode

Activated by pressing **Enter**.

Displays:

- artist
- album
- year
- label
- genres
- styles
- additional metadata

The overlay should fade in gracefully.

Pressing Enter again hides the overlay.

The artwork should remain visible beneath the information.

---

# Browse Collection

Browse is the primary interaction.

Features:

- instant search
- keyboard navigation
- wrap-around navigation
- persistent selection
- smooth scrolling
- responsive grid
- live album count

The selected album always drives:

- preview metadata
- blurred background
- current selection

Selection should never become ambiguous.

---

# Search

Search should feel instantaneous.

Typing immediately filters visible albums.

Search is integrated into Browse.

A separate Search screen or Search button is unnecessary.

---

# Browse Background

Browse uses a heavily blurred version of the selected album artwork.

Purpose:

- atmosphere
- subtle color
- visual continuity

The background should never compete with foreground content.

---

# Vinyl First

The application should embrace what makes records different.

Future features should emphasize the physical listening experience.

Examples:

- last song on each side
- record side reminders
- double LP support
- pressing notes
- personal listening notes

Rather than pretending records behave like streaming music, the application should celebrate their physical nature.

---

# Metadata Philosophy

Only display information that helps someone:

- choose music
- appreciate music
- enjoy music

Avoid exposing database fields simply because they exist.

---

# Animation

Motion should feel natural.

Examples:

- fades
- gentle scaling
- smooth scrolling

Avoid flashy transitions.

The application should never feel busy.

---

# Accessibility

High contrast.

Large typography.

Visible focus.

Comfortable viewing from across the room.

Everything should remain usable with only a remote.

---

# Technical Philosophy

Prefer simplicity.

Plain:

- HTML
- CSS
- JavaScript

Avoid unnecessary frameworks.

State should remain explicit.

Examples:

- selectedRecord
- visibleRecords
- selectedIndex

Avoid duplicate sources of truth.

---

# Future Features

## Recently Played

Remember previous listening sessions.

---

## Random Album

Help answer:

"What should I listen to tonight?"

---

## Favorites

Quick access to favorite records.

---

## Record Side Information

Display:

Side A

Flip after:
"Track Name"

Side B

Ends with:
"Track Name"

Support multiple records naturally:

Sides C and D.

---

## Collection Statistics

Artists

Genres

Countries

Labels

Decades

---

## Personal Notes

Cleaning notes

Condition

Memories

Favorite pressing

---

## QR Code

Open the Discogs release on a phone.

---

# Success

Jeb's Records succeeds if it makes someone spend less time managing a collection...

...and more time listening to it.

When someone walks into the room, the application should quietly communicate:

"This person loves records."

The television should be beautiful even when nobody is interacting with it.