import { GAME } from '../config.js';

export class ArenaEventManager {
  constructor(scene) {
    this.scene = scene;
    this.running = false;
    this.currentEvent = 'CALM';
    this.warningVector = null;
    this.force = null;
    this.pendingTimer = null;
    this.cleanupTimer = null;
    this.lastEvent = null;
  }

  start() {
    this.running = true;
    this.scheduleNext(1800);
  }

  stop() {
    this.running = false;
    this.pendingTimer?.remove(false);
    this.cleanupTimer?.remove(false);
    this.pendingTimer = null;
    this.cleanupTimer = null;
    this.force = null;
    this.warningVector = null;
    this.scene.surfaceGrip = 1;
    this.scene.knockbackMultiplier = 1;
    this.currentEvent = 'STOPPED';
    this.scene.hud?.clearWarning();
  }

  getIntensity() {
    const t = this.scene.roundElapsed;
    if (t >= GAME.ROUND_CHAOS_TIME) return 2.15;
    if (t >= 30) return 1.65;
    if (t >= 15) return 1.30;
    return 1.0;
  }

  scheduleNext(forcedDelay = null) {
    if (!this.running) return;
    const intensity = this.getIntensity();
    const min = GAME.EVENT_MIN_DELAY / intensity;
    const max = GAME.EVENT_MAX_DELAY / intensity;
    const delay = forcedDelay ?? Phaser.Math.Between(Math.round(min), Math.round(max));
    this.pendingTimer = this.scene.time.delayedCall(delay, () => this.queueEvent());
  }

  queueEvent() {
    if (!this.running || !this.scene.roundActive) return;

    const t = this.scene.roundElapsed;
    let choices = ['rotate', 'jolt', 'rumble', 'wind'];
    if (t >= 12) choices.push('shift', 'slippery');
    if (t >= 24) choices.push('knockback', 'shrink');

    if (this.lastEvent && choices.length > 1) choices = choices.filter((event) => event !== this.lastEvent);
    const type = Phaser.Utils.Array.GetRandom(choices);
    this.lastEvent = type;

    const event = this.buildEvent(type);
    this.currentEvent = `WARNING: ${event.label}`;
    this.warningVector = event.vector ?? null;
    this.scene.hud.showWarning(event.label, event.symbol);
    this.scene.audioManager.warning();

    this.pendingTimer = this.scene.time.delayedCall(GAME.EVENT_TELEGRAPH_MS, () => {
      if (!this.running || !this.scene.roundActive) return;
      this.warningVector = null;
      this.scene.hud.clearWarning();
      this.trigger(event);
    });
  }

  buildEvent(type) {
    if (type === 'rotate') {
      const dir = Math.random() < 0.5 ? -1 : 1;
      return { type, dir, label: dir > 0 ? 'SPIN RIGHT' : 'SPIN LEFT', symbol: dir > 0 ? '↻' : '↺' };
    }
    if (type === 'shift') {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const vector = { x: Math.cos(angle), y: Math.sin(angle) };
      return { type, vector, label: 'PLATFORM SHIFT', symbol: this.arrowFor(vector) };
    }
    if (type === 'jolt') {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const vector = { x: Math.cos(angle), y: Math.sin(angle) };
      return { type, vector, label: 'HARD JOLT', symbol: this.arrowFor(vector) };
    }
    if (type === 'rumble') return { type, label: 'HEAVY RUMBLE', symbol: '⚠' };
    if (type === 'slippery') return { type, label: 'LOW FRICTION', symbol: '◇' };
    if (type === 'knockback') return { type, label: 'POWER SURGE', symbol: '✦' };
    if (type === 'shrink') return { type, label: 'RING SHRINK', symbol: '◎' };

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const vector = { x: Math.cos(angle), y: Math.sin(angle) };
    return { type: 'wind', vector, label: 'CROSSWIND', symbol: this.arrowFor(vector) };
  }

  trigger(event) {
    this.currentEvent = event.label;
    const intensity = this.getIntensity();

    switch (event.type) {
      case 'rotate':
        this.force = { type: 'rotate', dir: event.dir, strength: 56 * intensity, until: this.scene.time.now + 2500 };
        this.scene.setArenaSpin(event.dir * (0.42 + intensity * 0.12), 2500);
        this.scene.cameras.main.shake(180, 0.0028);
        this.cleanupAfter(2550);
        break;
      case 'shift':
        this.scene.shiftArena(event.vector, 48 + intensity * 16);
        this.scene.cameras.main.shake(150, 0.004);
        this.scene.getActivePlayers().forEach((p) => p.applyImpulse(-event.vector.x * 78 * intensity, -event.vector.y * 58 * intensity));
        this.scene.effects.arenaDust(this.scene.arenaCenterX, this.scene.arenaCenterY);
        this.cleanupAfter(900);
        break;
      case 'jolt':
        this.scene.cameras.main.shake(190, 0.007 * Math.min(intensity, 1.8));
        this.scene.getActivePlayers().forEach((p) => p.applyImpulse(event.vector.x * 145 * intensity, event.vector.y * 105 * intensity));
        this.cleanupAfter(650);
        break;
      case 'rumble':
        this.scene.cameras.main.shake(720, 0.006);
        this.scene.effects.arenaDust(this.scene.arenaCenterX, this.scene.arenaCenterY);
        this.scene.getActivePlayers().forEach((p) => {
          p.applyImpulse(Phaser.Math.Between(-60, 60) * intensity, Phaser.Math.Between(-44, 44) * intensity);
        });
        this.cleanupAfter(900);
        break;
      case 'slippery':
        this.scene.surfaceGrip = 0.18;
        this.cleanupAfter(3200, () => { this.scene.surfaceGrip = 1; });
        break;
      case 'knockback':
        this.scene.knockbackMultiplier = 1.65;
        this.scene.flashArena(0xffe66a);
        this.cleanupAfter(3000, () => { this.scene.knockbackMultiplier = 1; });
        break;
      case 'shrink':
        this.scene.shrinkArena(0.91);
        this.cleanupAfter(1200);
        break;
      case 'wind':
        this.force = { type: 'wind', vector: event.vector, strength: 54 * intensity, until: this.scene.time.now + 2400 };
        this.cleanupAfter(2450);
        break;
      default:
        this.cleanupAfter(500);
        break;
    }
  }

  cleanupAfter(ms, resetFn = null) {
    this.cleanupTimer = this.scene.time.delayedCall(ms, () => {
      resetFn?.();
      this.force = null;
      this.currentEvent = 'CALM';
      this.scheduleNext();
    });
  }

  update(time, delta) {
    if (!this.running || !this.force) return;
    if (time > this.force.until) {
      this.force = null;
      return;
    }

    const dt = Math.min(delta, 40) / 1000;
    const players = this.scene.getActivePlayers();
    if (this.force.type === 'wind') {
      for (const player of players) {
        player.applyImpulse(this.force.vector.x * this.force.strength * dt, this.force.vector.y * this.force.strength * dt);
      }
    } else if (this.force.type === 'rotate') {
      const center = this.scene.getArenaCenter();
      for (const player of players) {
        const dx = player.sprite.x - center.x;
        const dy = player.sprite.y - center.y;
        const len = Math.hypot(dx, dy) || 1;
        const tangentX = (-dy / len) * this.force.dir;
        const tangentY = (dx / len) * this.force.dir;
        const edgeFactor = Phaser.Math.Clamp(this.scene.getArenaNormalizedDistance(player.sprite.x, player.sprite.y), 0.25, 1.15);
        player.applyImpulse(tangentX * this.force.strength * edgeFactor * dt, tangentY * this.force.strength * edgeFactor * dt);
      }
    }
  }

  arrowFor(vector) {
    if (Math.abs(vector.x) > Math.abs(vector.y)) return vector.x > 0 ? '→' : '←';
    return vector.y > 0 ? '↓' : '↑';
  }
}
