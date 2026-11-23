# Rune Clash

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/damijune31-alt/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/damijune31-alt/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A duel card game for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).
You are the Rune Warden. Morgath, the Ash Herald, stands across the table.
Both start at 30 life. Mana grows every turn. First to 0 life loses.

Your deck holds 30 rune cards: Ember Strikes, Frost Bites, Thorn Lashes and
Storm Slashes for damage, Frost/Thorn/Storm Guards for shield, and Mends that
restore life. Every card shows its cost in the blue mana gem, its power as a
big number, and its suit. Morgath plays back with a simple brain: he heals
when hurt, guards when pressured, and otherwise swings his biggest strike.

## Play

Open `game/index.html` in a desktop browser. No network, no build step.

- **Click a card** — play it (if you can pay its mana cost)
- **Keys 1–5** — play the card in that hand slot
- **Space / Enter** — end turn
- **R** — restart the duel
- **Esc** — back to the title screen

## Structure

- `game/index.html` — the page: title screen, table, hands, win/loss overlay
- `game/style.css` — the 1280x480 table layout, cards, HP bars, overlays
- `game/game.js` — deck, turns, mana, shield, damage, Morgath's AI, scenes
- `main.ts` — hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json`
- `screenshots/` — four real renders of the game's own code: title, table,
  victory, defeat

## License

MIT — see `LICENSE`.
