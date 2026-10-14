# Rumble Ring

Rumble Ring is an original browser-based last-player-standing arcade party game. Four characters fight for footing on a floating arena while the platform spins, jolts, shifts, shrinks and becomes increasingly unstable.

## Controls

- **WASD** — Move
- **Space** — Dash / bump
- **M** — Toggle synthesized sound effects
- **Enter** — Start / replay from supported screens

Player 1 is human-controlled. The other three players use different AI personalities: aggressive, defensive and chaotic.

## Gameplay

- Knock opponents beyond the arena edge.
- Normal collisions push slightly; dash collisions hit much harder.
- Arena events are telegraphed before they trigger.
- At 45 seconds the round enters **Chaos Mode** and event pacing becomes more aggressive.
- Last player standing wins.

## Project Structure

```text
index.html
.nojekyll
css/
  styles.css
js/
  main.js
  config.js
  scenes/
    MenuScene.js
    GameScene.js
  entities/
    Player.js
    BotPlayer.js
  systems/
    ArenaEventManager.js
    InputManager.js
    AudioManager.js
    EffectsManager.js
  ui/
    HUD.js
vendor/
  README.md
assets/
  README.md
```

## Run Locally

Because the game uses JavaScript modules, serve the folder with a local web server rather than double-clicking `index.html`.

### Python

From inside the `rumble-ring` folder:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

### VS Code

You can also use any static server extension such as Live Server.

## Testing Checklist

1. Start the game with the Play button.
2. Confirm the 3-2-1-RUMBLE countdown blocks movement.
3. Move with WASD.
4. Dash with Space and verify the cooldown bar refills under Player 1.
5. Confirm normal player contact creates a small push.
6. Confirm dash contact creates stronger knockback.
7. Let AI players fight and recover away from arena edges.
8. Confirm arena warnings appear before hazards.
9. Walk or get knocked beyond the arena and confirm elimination.
10. Confirm the last surviving player gets the win overlay.
11. Click Play Again and verify a clean new round starts.

## Balance / Debugging

Most tuning values are in `js/config.js`:

- `PLAYER_SPEED`
- `PLAYER_ACCELERATION`
- `PLAYER_DRAG`
- `DASH_FORCE`
- `DASH_DURATION`
- `DASH_COOLDOWN`
- `NORMAL_KNOCKBACK`
- `DASH_KNOCKBACK`
- `ARENA_RADIUS_X`
- `ARENA_RADIUS_Y`
- `EVENT_MIN_DELAY`
- `EVENT_MAX_DELAY`
- `AI_REACTION_TIME`

Set `DEBUG: true` in `js/config.js` to display the safe-zone ellipse, velocity vectors, bot targeting, current arena event and FPS.

## Deploy to GitHub Pages

1. Create a new GitHub repository, for example `rumble-ring`.
2. Upload all files in this folder to the repository root.
3. Commit and push the files.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select your default branch (usually `main`) and `/ (root)`.
7. Save.

GitHub will publish the game at a URL similar to:

```text
https://YOUR-USERNAME.github.io/rumble-ring/
```

All project paths are relative, so the game works when hosted from a repository subdirectory rather than only from a root domain.

## Phaser

The game loads **Phaser 3.90.0** from jsDelivr. No Node runtime, database, authentication service, backend API or build step is required for the deployed game. If you want a fully offline build later, download the same Phaser release into `vendor/` and point `index.html` at the local file.

## Future Additions

The architecture is ready to expand with:

- 2–4 local human players
- gamepad controls
- character select
- alternate arenas
- destructible or dropping tiles
- power-ups
- match scoring / best-of-three
- original sprite animation and audio
- online multiplayer as a separate future architecture step

## License Note

The Rumble Ring game code and generated placeholder presentation are original to this prototype. Phaser is distributed under its own MIT license. Do not add third-party art, music, characters or branding unless you have the rights to use them.
