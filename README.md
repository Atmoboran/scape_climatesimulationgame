# SCAPE° — Klimasimulationsspiel

A browser app for the game master of the SCAPE° climate simulation game.
Nine people stand in a 3 × 3 grid: the top row is the northern hemisphere,
the middle row the tropics, the bottom row the southern hemisphere. Each
holds a number of "temperature points". Round by round, winds shift the
rows, the tropics pass heat to the hemispheres, the sun heats and space
cools, and at some point the greenhouse effect tips the energy balance. The
rules come from `Climatesimulationgame.pdf`, and the model is a port of
`klimasimulationsspiel.py`.

The app has four parts, as numbered buttons in the header (hash routes
`#anleitung`, `#modell`, `#spiel`, `#auswertung`):

1. **Anleitung** – the game itself in collapsible topics: goal, material and
   formation (with a diagram), the four steps of a round (with an energy
   diagram), the greenhouse twist, what to watch for, tips for the game
   master and discussion questions.
2. **Modell** – the game without humans. The computer plays all nine roles
   on an animated field and moves through wind, exchange and radiation phase
   by phase: play, step or jump to the end. Every rule is a setting (sun,
   radiation, greenhouse radiation and its start round, start energy and
   range, number of rounds), each with an "i" note on what keeps the model
   stable; a seed makes every run repeatable. A Merke box states the key
   insight (single values = weather, mean = energy balance = climate).
3. **Spiel leiten** – tracks the live game. Setup takes the players' names
   (optional; names travel with the wind) and the tropics start values,
   typed in or rolled. Each round has two entry modes, switchable from one
   round to the next:
   - *Geführt* walks through the four steps (numbered stepper), animates the
     wind, suggests the pole and the maximum for every tropics player, warns
     about rule breaks, applies the radiation and asks for the nine values
     (overwritable when a player's paper says otherwise);
   - *Nur Endwerte* asks only for the nine end-of-round values.

   Both run an **energy check**: the grid's sum must change by exactly
   `3·sun − 6·radiation`. Greenhouse switch, protocol table, undo, autosave
   to `localStorage`, JSON export/import (full game) and CSV export (by
   position and by person, for Excel).
4. **Auswertung** – all plots of the Python script for the live game or the
   model run: the temperature field (heatmap with round slider and
   playback), the global mean (against what the energy balance predicts),
   the zonal means (optionally with a band from 100 model runs) and the 3 × 3
   time series by position or by person. Crosshair tooltips, PNG download
   and a projector view ("Beamer-Ansicht") that shows only the charts, full
   screen.

The model follows the script step for step. The only deliberate difference
is the tie rule: when the differences to both poles are equal, the script
always picks south, the app picks at random, as the rules say. Because the
exchange conserves energy, the global mean stays at 135 / 9 = 15 while the
balance is even and then rises by 6/9 per round – the contrast between
jumping single values (weather) and a predictable mean (climate) is the core
lesson. Temperatures are coloured on the CD temperature scale (cold blue →
grey → warm red) over the script's range −20 … 70.

This is a staff tool: all game-master functions are visible; there is no
hidden staff panel.

## Run

Open `index.html` (double-click works, no build, no server, works offline),
or serve the folder with any static file server / GitHub Pages.

URL switches:

- `?kiosk` – exhibit mode: back to the start (Anleitung) after 3 minutes
  without touch. The autosaved live game is kept.
- `#modell`, `#spiel`, `#auswertung` – open a part directly.

## Files

```
index.html          structure only (data-t placeholders for every text)
css/kit.css         shared SCAPE° components (same in every app)
css/app.css         layout of this app
js/view.js          phone/desktop layout switch (loaded in <head>)
js/texts.js         fills the texts from content/
js/brand.js         fills logo and footer line from the theme
js/kit.js           fullscreen button, hint badge, info notes, kiosk switch
js/core.js          helpers and the model (window.KS)
js/draw.js          canvas drawing: field, line charts, heatmap
js/model-view.js    part 2 "Modell"
js/live.js          part 3 "Spiel leiten"
js/results.js       part 4 "Auswertung"
js/app.js           parts navigation, animation loop, start-up
content/texts.de.js every visible text (edit or translate here)
theme/              the design: font, palette, logo, colours (see theme/README.md)
klimasimulationsspiel.py, Climatesimulationgame.pdf   the original script and rules
```

## Layout

Sticky header with the wordmark, the four part buttons and the
"Desktop-/Handy-Ansicht" toggle (automatic from 1000 px, remembered for
this app only). Poster header with kicker ("Teil 2 von 4 · Modell"); it
shrinks to a slim band on parts 2–4. Phone: one column (round head, field,
inputs). Desktop: the square field on the left, sized to the screen and
sticky; all controls on the right. Every part ends with a "Weiter zu … →"
button.

## Adapting

Design: `theme/` only (field, chart and diagram colours in `THEME.game`,
temperature scale in `THEME.data` / `THEME.tempColor`). Texts:
`content/texts.de.js` only. Founders Grotesk is used when installed,
otherwise the system fallback.
