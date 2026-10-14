import { GAME, PLAYER_DEFS } from '../config.js';
import { Player } from '../entities/Player.js';
import { BotPlayer } from '../entities/BotPlayer.js';
import { InputManager } from '../systems/InputManager.js';
import { ArenaEventManager } from '../systems/ArenaEventManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { EffectsManager } from '../systems/EffectsManager.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.createTextures();

    this.baseArenaCenterX = GAME.WIDTH / 2;
    this.baseArenaCenterY = GAME.HEIGHT / 2 + 28;
    this.arenaCenterX = this.baseArenaCenterX;
    this.arenaCenterY = this.baseArenaCenterY;
    this.arenaScale = 1;
    this.arenaSpinSpeed = 0;
    this.arenaSpinUntil = 0;
    this.surfaceGrip = 1;
    this.knockbackMultiplier = 1;
    this.roundActive = false;
    this.roundOver = false;
    this.roundStartAt = 0;
    this.roundElapsed = 0;
    this.chaosTriggered = false;
    this.lastPairHit = new Map();
    this.realTimeTimers = [];

    this.drawBackground();
    this.createArena();

    this.inputManager = new InputManager(this);
    this.audioManager = new AudioManager(this);
    this.effects = new EffectsManager(this);
    this.hud = new HUD(this);
    this.players = [];
    this.createPlayers();
    this.setupCollisions();

    this.arenaEvents = new ArenaEventManager(this);
    this.debugGraphics = this.add.graphics().setDepth(130);

    this.input.keyboard.on('keydown-M', () => {
      const muted = this.audioManager.toggleMuted();
      this.hud.showToast(muted ? 'SOUND OFF' : 'SOUND ON', '#b8d5e8', 650);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.startCountdown();
  }

  createTextures() {
    if (!this.textures.exists('player-body')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(24, 24, 21);
      g.lineStyle(4, 0x08111f, 0.85);
      g.strokeCircle(24, 24, 20);
      g.fillStyle(0xffffff, 0.28);
      g.fillCircle(18, 17, 7);
      g.generateTexture('player-body', 48, 48);
      g.destroy();
    }
  }

  drawBackground() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x07101d, 1).fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    bg.fillStyle(0x0b1f33, 0.65).fillCircle(500, 330, 320);
    bg.lineStyle(2, 0x1d4668, 0.16);
    for (let r = 120; r < 460; r += 62) bg.strokeCircle(500, 345, r);
    for (let i = 0; i < 55; i += 1) {
      bg.fillStyle(0x9bdcff, Phaser.Math.FloatBetween(0.05, 0.20));
      bg.fillCircle(Phaser.Math.Between(15, 985), Phaser.Math.Between(20, 680), Phaser.Math.FloatBetween(0.6, 1.8));
    }
  }

  createArena() {
    this.arenaContainer = this.add.container(this.arenaCenterX, this.arenaCenterY).setDepth(5);

    const underside = this.add.graphics();
    underside.fillStyle(0x02070b, 0.70).fillEllipse(0, 33, GAME.ARENA_RADIUS_X * 2.08, GAME.ARENA_RADIUS_Y * 1.92);
    underside.fillStyle(0x0a2331, 1).fillEllipse(0, 24, GAME.ARENA_RADIUS_X * 2.03, GAME.ARENA_RADIUS_Y * 1.92);

    this.deck = this.add.graphics();
    this.redrawDeck();

    this.arenaMarks = this.add.container(0, 0);
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * GAME.ARENA_RADIUS_X * 0.74;
      const y = Math.sin(a) * GAME.ARENA_RADIUS_Y * 0.74;
      const mark = this.add.rectangle(x, y, 42, 8, i % 2 ? 0x54d7ff : 0xffd34e, 0.20)
        .setRotation(a)
        .setOrigin(0.5);
      this.arenaMarks.add(mark);
    }

    const core = this.add.ellipse(0, 0, 154, 98, 0x0b1b28, 0.74).setStrokeStyle(3, 0x54d7ff, 0.22);
    this.arenaContainer.add([underside, this.deck, this.arenaMarks, core]);
  }

  redrawDeck() {
    this.deck.clear();
    this.deck.fillStyle(0x17384d, 1);
    this.deck.fillEllipse(0, 0, GAME.ARENA_RADIUS_X * 2, GAME.ARENA_RADIUS_Y * 2);
    this.deck.fillStyle(0x1d465d, 0.78);
    this.deck.fillEllipse(0, -7, GAME.ARENA_RADIUS_X * 1.95, GAME.ARENA_RADIUS_Y * 1.80);
    this.deck.lineStyle(7, 0x6c9aad, 0.50);
    this.deck.strokeEllipse(0, 0, GAME.ARENA_RADIUS_X * 2, GAME.ARENA_RADIUS_Y * 2);
    this.deck.lineStyle(2, 0x89cde7, 0.16);
    this.deck.strokeEllipse(0, 0, GAME.ARENA_RADIUS_X * 1.65, GAME.ARENA_RADIUS_Y * 1.63);
  }

  createPlayers() {
    const cx = this.arenaCenterX;
    const cy = this.arenaCenterY;
    const spawn = [
      { x: cx, y: cy + 95 },
      { x: cx - 150, y: cy - 45 },
      { x: cx + 150, y: cy - 45 },
      { x: cx, y: cy - 112 },
    ];

    for (let i = 0; i < PLAYER_DEFS.length; i += 1) {
      const def = PLAYER_DEFS[i];
      const p = def.human
        ? new Player(this, def, spawn[i].x, spawn[i].y)
        : new BotPlayer(this, def, spawn[i].x, spawn[i].y);
      this.players.push(p);
    }
  }

  setupCollisions() {
    for (let i = 0; i < this.players.length; i += 1) {
      for (let j = i + 1; j < this.players.length; j += 1) {
        const a = this.players[i];
        const b = this.players[j];
        this.physics.add.collider(a.sprite, b.sprite, () => this.handlePlayerCollision(a, b));
      }
    }
  }

  startCountdown() {
    this.players.forEach((p) => p.setControlEnabled(false));
    const centerX = GAME.WIDTH / 2;
    const centerY = 175;
    const countdown = this.add.text(centerX, centerY, '3', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '76px', color: '#ffffff',
      stroke: '#07101d', strokeThickness: 12,
    }).setOrigin(0.5).setDepth(110);

    const sequence = ['3', '2', '1', 'RUMBLE!'];
    let index = 0;
    const step = () => {
      countdown.setText(sequence[index]).setScale(index === 3 ? 0.72 : 1.25).setAlpha(1);
      this.tweens.add({ targets: countdown, scale: index === 3 ? 1.1 : 0.78, alpha: index === 3 ? 1 : 0.55, duration: 530, ease: 'Back.Out' });
      this.audioManager.start();
      index += 1;
      if (index < sequence.length) {
        this.time.delayedCall(650, step);
      } else {
        this.time.delayedCall(600, () => {
          countdown.destroy();
          this.beginRound();
        });
      }
    };
    step();
  }

  beginRound() {
    this.roundActive = true;
    this.roundStartAt = this.time.now;
    this.players.forEach((p) => p.setControlEnabled(true));
    this.arenaEvents.start();
  }

  update(time, delta) {
    if (!this.players?.length) return;

    if (this.roundActive) {
      this.roundElapsed = Math.max(0, (time - this.roundStartAt) / 1000);
      this.arenaEvents.update(time, delta);
      this.updateArenaSpin(time, delta);
    }

    for (const player of this.players) player.update(time, delta);

    if (this.roundActive) {
      this.checkFalls();
      this.hud.update(this.getActivePlayers().length, this.roundElapsed);
      if (!this.chaosTriggered && this.roundElapsed >= GAME.ROUND_CHAOS_TIME) {
        this.chaosTriggered = true;
        this.hud.showToast('CHAOS MODE', '#ffdf65', 1500);
        this.cameras.main.shake(550, 0.005);
        this.flashArena(0xffd34e);
      }
    }

    if (GAME.DEBUG) this.drawDebug();
  }

  handlePlayerCollision(a, b) {
    if (!this.roundActive || a.eliminated || b.eliminated || a.falling || b.falling) return;

    const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
    const now = this.time.now;
    if (now - (this.lastPairHit.get(key) ?? -9999) < GAME.COLLISION_COOLDOWN) return;
    this.lastPairHit.set(key, now);

    const dx = b.sprite.x - a.sprite.x;
    const dy = b.sprite.y - a.sprite.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const aVel = a.sprite.body.velocity;
    const bVel = b.sprite.body.velocity;
    const relativeToward = Math.max(0, (aVel.x - bVel.x) * nx + (aVel.y - bVel.y) * ny);
    const speedFactor = Phaser.Math.Clamp(relativeToward / 300, 0, 1.2);

    const aAttackAlignment = Phaser.Math.Clamp(a.facing.x * nx + a.facing.y * ny, 0, 1);
    const bAttackAlignment = Phaser.Math.Clamp(b.facing.x * -nx + b.facing.y * -ny, 0, 1);
    const aDashPower = a.isDashing ? GAME.DASH_KNOCKBACK * (0.60 + 0.40 * aAttackAlignment) : 0;
    const bDashPower = b.isDashing ? GAME.DASH_KNOCKBACK * (0.60 + 0.40 * bAttackAlignment) : 0;
    const normal = GAME.NORMAL_KNOCKBACK * (0.55 + speedFactor * 0.65);
    const global = this.knockbackMultiplier;

    const forceOnB = (normal + aDashPower) * global;
    const forceOnA = (normal + bDashPower) * global;
    b.applyImpulse(nx * forceOnB, ny * forceOnB);
    a.applyImpulse(-nx * forceOnA, -ny * forceOnA);

    const heavy = a.isDashing || b.isDashing;
    const impactStrength = heavy ? 1.35 : 0.7;
    this.effects.impact((a.sprite.x + b.sprite.x) / 2, (a.sprite.y + b.sprite.y) / 2, heavy ? 0xffec9a : 0xb9eaff, impactStrength);
    this.audioManager.bump(heavy);
    this.cameras.main.shake(heavy ? 90 : 45, heavy ? 0.005 : 0.0018);

    if (heavy) {
      [a, b].forEach((p) => {
        this.tweens.add({ targets: p.sprite, scaleX: 1.24, scaleY: 0.82, duration: 55, yoyo: true, ease: 'Quad.Out' });
      });
    }
  }

  checkFalls() {
    for (const player of this.players) {
      if (player.eliminated || player.falling) continue;
      const normalized = this.getArenaNormalizedDistance(player.sprite.x, player.sprite.y);
      if (normalized > 1.035) this.eliminatePlayer(player);
    }
  }

  eliminatePlayer(player) {
    if (!this.roundActive || player.falling || player.eliminated) return;

    this.roundSlowMo();
    this.effects.impact(player.sprite.x, player.sprite.y, player.def.color, 1.15);
    player.beginFall((finishedPlayer) => {
      this.hud.showToast(`${finishedPlayer.name} OUT!`, '#ffffff', 700);
      const active = this.getActivePlayers();
      if (active.length === 2) this.cameras.main.zoomTo(GAME.FINAL_TWO_ZOOM, 450, 'Sine.easeOut');
      if (active.length <= 1) this.finishRound(active[0] ?? null);
    });
  }

  roundSlowMo() {
    if (!this.roundActive) return;
    this.time.timeScale = 0.35;
    const timer = window.setTimeout(() => {
      if (this.sys?.isActive()) this.time.timeScale = 1;
    }, 115);
    this.realTimeTimers.push(timer);
  }

  finishRound(winner) {
    if (this.roundOver) return;
    this.roundOver = true;
    this.roundActive = false;
    this.time.timeScale = 1;
    this.arenaEvents.stop();
    this.players.forEach((p) => p.setControlEnabled(false));
    this.cameras.main.zoomTo(1, 350);

    if (winner) {
      winner.canControl = false;
      winner.sprite.setVelocity(0, 0);
      this.audioManager.win();
      this.tweens.add({ targets: winner.sprite, scaleX: 1.25, scaleY: 1.25, angle: '+=360', duration: 650, ease: 'Back.Out' });
    }

    this.time.delayedCall(520, () => this.showWinnerOverlay(winner));
  }

  showWinnerOverlay(winner) {
    const panel = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, 500, 250, 0x06101b, 0.94)
      .setStrokeStyle(4, winner?.def.color ?? 0xffffff, 0.8).setDepth(200);
    const title = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 68, winner ? `${winner.name} WINS` : 'DRAW', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '42px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);
    const sub = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 14, `Survived ${this.roundElapsed.toFixed(1)} seconds`, {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#a8c8db',
    }).setOrigin(0.5).setDepth(201);

    const button = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 68, 220, 58, 0xffd34e, 1)
      .setInteractive({ useHandCursor: true }).setDepth(201);
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 68, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '20px', color: '#171106',
    }).setOrigin(0.5).setDepth(202);

    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.once('pointerdown', () => this.restartRound());
    this.input.keyboard.once('keydown-ENTER', () => this.restartRound());

    this.tweens.add({ targets: [panel, title, sub, button], alpha: { from: 0, to: 1 }, duration: 240 });
  }

  restartRound() {
    this.cleanup();
    this.scene.restart();
  }

  getActivePlayers() {
    return this.players.filter((p) => !p.eliminated && !p.falling);
  }

  getArenaCenter() {
    return { x: this.arenaCenterX, y: this.arenaCenterY };
  }

  getArenaNormalizedDistance(x, y) {
    const rx = GAME.ARENA_RADIUS_X * this.arenaScale;
    const ry = GAME.ARENA_RADIUS_Y * this.arenaScale;
    const dx = (x - this.arenaCenterX) / rx;
    const dy = (y - this.arenaCenterY) / ry;
    return Math.sqrt(dx * dx + dy * dy);
  }

  shiftArena(vector, amount) {
    const maxOffsetX = 62;
    const maxOffsetY = 42;
    const currentOffsetX = this.arenaCenterX - this.baseArenaCenterX;
    const currentOffsetY = this.arenaCenterY - this.baseArenaCenterY;
    const targetOffsetX = Phaser.Math.Clamp(currentOffsetX + vector.x * amount, -maxOffsetX, maxOffsetX);
    const targetOffsetY = Phaser.Math.Clamp(currentOffsetY + vector.y * amount * 0.72, -maxOffsetY, maxOffsetY);
    const targetX = this.baseArenaCenterX + targetOffsetX;
    const targetY = this.baseArenaCenterY + targetOffsetY;

    this.tweens.add({
      targets: this.arenaContainer,
      x: targetX,
      y: targetY,
      duration: 240,
      ease: 'Back.Out',
      onUpdate: () => {
        this.arenaCenterX = this.arenaContainer.x;
        this.arenaCenterY = this.arenaContainer.y;
      },
    });
  }

  shrinkArena(multiplier) {
    const start = this.arenaScale;
    const next = Math.max(GAME.ARENA_MIN_SCALE, start * multiplier);
    if (next === start) return;

    const state = { value: start };
    this.tweens.add({
      targets: state,
      value: next,
      duration: 850,
      ease: 'Sine.InOut',
      onUpdate: () => {
        this.arenaScale = state.value;
        this.arenaContainer.setScale(state.value);
      },
      onComplete: () => {
        this.arenaScale = next;
        this.arenaContainer.setScale(next);
      },
    });
    this.cameras.main.shake(450, 0.0035);
  }

  setArenaSpin(speed, duration) {
    this.arenaSpinSpeed = speed;
    this.arenaSpinUntil = this.time.now + duration;
  }

  updateArenaSpin(time, delta) {
    if (time > this.arenaSpinUntil) {
      this.arenaSpinSpeed *= 0.92;
      if (Math.abs(this.arenaSpinSpeed) < 0.002) this.arenaSpinSpeed = 0;
    }
    this.arenaMarks.rotation += this.arenaSpinSpeed * Math.min(delta, 40) / 1000;
  }

  flashArena(color) {
    const flash = this.add.ellipse(
      this.arenaCenterX,
      this.arenaCenterY,
      GAME.ARENA_RADIUS_X * 2 * this.arenaScale,
      GAME.ARENA_RADIUS_Y * 2 * this.arenaScale,
      color,
      0.28,
    ).setDepth(8);
    this.tweens.add({ targets: flash, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
  }

  drawDebug() {
    const g = this.debugGraphics;
    g.clear();
    g.lineStyle(2, 0x00ffcc, 0.65);
    g.strokeEllipse(
      this.arenaCenterX,
      this.arenaCenterY,
      GAME.ARENA_RADIUS_X * 2 * this.arenaScale,
      GAME.ARENA_RADIUS_Y * 2 * this.arenaScale,
    );

    for (const p of this.players) {
      if (p.eliminated || p.falling) continue;
      const v = p.sprite.body.velocity;
      g.lineStyle(2, p.def.color, 0.8);
      g.lineBetween(p.sprite.x, p.sprite.y, p.sprite.x + v.x * 0.18, p.sprite.y + v.y * 0.18);
      if (p.target) {
        g.lineStyle(1, 0xff66ff, 0.45);
        g.lineBetween(p.sprite.x, p.sprite.y, p.target.sprite.x, p.target.sprite.y);
      }
    }

    this.hud.setDebug(
      `FPS ${Math.round(this.game.loop.actualFps)}\nEVENT ${this.arenaEvents.currentEvent}\nSCALE ${this.arenaScale.toFixed(2)}\nKB x${this.knockbackMultiplier.toFixed(2)}`,
      true,
    );
  }

  cleanup() {
    this.arenaEvents?.stop();
    this.time.timeScale = 1;
    for (const timer of this.realTimeTimers ?? []) window.clearTimeout(timer);
    this.realTimeTimers = [];
  }
}
