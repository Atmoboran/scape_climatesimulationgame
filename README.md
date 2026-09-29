# SCAPE° — Klimasimulationsspiel

A browser app for the game master of the SCAPE° climate simulation game.
Nine people stand in a 3×3 grid: the top row is the northern hemisphere, the
middle row the tropics, the bottom row the southern hemisphere. Each holds
a number of "temperature points". Round by round, winds shift the rows, the
tropics pass heat to the hemispheres, the sun heats and space cools, and
at some point the greenhouse effect tips the energy balance. The rules
come from `Climatesimulationgame.pdf`, and the model is a port of
`klimasimulationsspiel.py`.

The app has four tabs:

- **Anleitung**: the game itself, covering the goal, materials, the formation
  (with a diagram), the four steps of a round, the greenhouse twist, what to
  watch for, tips for the game master and discussion questions.
- **Modell**: the game without humans. The computer plays all nine roles on
  an animated field and moves through wind, exchange and radiation phase by
  phase. You can play it, step through it, or jump to the end. Every rule
  is a parameter (sun, radiation, greenhouse radiation and its start round,
  start energy and range, number of rounds, tie rule), and a seed makes
  every run repeatable.
- **Spiel leiten**: tracks the live game. Setup takes the players' names
  (optional; names travel with the wind) and the tropics start values, which
  can be typed in or rolled. Each round then has two entry modes, and you
  can switch between them from one round to the next:
  - *Geführt* walks the game master through the four steps. It animates the
    wind, suggests for every tropics player which pole to give to and the
    maximum allowed, and warns about rule breaks. It then applies the
    radiation and asks the game master to confirm the nine values, which
    can be overwritten when a player's paper says otherwise.
  - *Nur Endwerte* asks only for the nine end-of-round values.

  Both modes run an **energy check**: the exchange only moves points around,
  so the grid's sum must change by exactly `3·sun − 6·radiation`. The same
  view has the greenhouse switch, a protocol table and undo. The game
  autosaves to `localStorage`, and exports and imports as JSON (the full
  game) or CSV (values by position and by person, for Excel).
- **Auswertung**: all the plots from the Python script, for the live game or
  the model run. They are the temperature field (the `imshow` heatmap, with
  a round slider and playback), the global mean, and the 3×3 time series,
  either by grid position as in the script or by person. The app adds two
  more:
  - the zonal means, with an optional band from 100 model runs that start
    from the same state and use the same greenhouse rounds;
  - the global mean drawn against what the energy balance predicts, which
    makes any arithmetic slip visible.

  Each chart has a crosshair tooltip and a PNG download, and a projector
  view shows only the charts, full screen.

The model follows the script step for step. The hemispheres move right and
the tropics left (`np.roll`). Each tropics position gives a random integer
between 0 and `diff // 2` to the pole with the larger difference, and gives
nothing if neither pole is colder. Then the tropics gain +8, and the
hemispheres lose −4, or −3 once the greenhouse twist is on. The defaults
match the script: start values 25–50 with the remainder to 135, 24 rounds
after the start, and the greenhouse from round 15. The only deliberate
difference is the tie rule. When the differences to both poles are equal,
the script always picks south, while the app picks at random, as the rules
say. The script's behaviour is still available as a setting.

Because the exchange conserves energy, the global mean is fully determined.
It stays at 135 / 9 = 15 while the balance is even, and then rises by 6/9
per round. The individual positions, meanwhile, jump around at random: that
contrast between weather and climate is the core lesson, and the app points
it out.

- Pure client-side canvas + JavaScript. There is no build step, no server
  and no dependency beyond a Google Fonts stylesheet.
- Design: SCAPE° corporate design (Archivo, thick ink borders, poster-hero
  layout), in the same style as the Galton board. It is mobile-first for the
  game master's phone, with a desktop view that is detected automatically
  and can also be toggled by hand.

Open `index.html` directly, or serve the folder with any static file server.
