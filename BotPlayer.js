import { Player } from './Player.js';
import { GAME } from '../config.js';

export class BotPlayer extends Player {
  constructor(scene, def, x, y) {
    super(scene, def, x, y);
    this.personality = def.personality ?? 'aggressive';
    this.nextDecisionAt = 0;
    this.intent = { x: 0, y: 0, dash: false };
    this.target = null;
    this.wanderAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  getIntent(time) {
    if (time >= this.nextDecisionAt) this.makeDecision(time);
    const dash = this.intent.dash;
    this.intent.dash = false;
    return { x: this.intent.x, y: this.intent.y, dash };
  }

  makeDecision(time) {
    const baseReaction = GAME.AI_REACTION_TIME;
    const personalityDelay = this.personality === 'chaotic' ? 1.25 : this.personality === 'aggressive' ? 0.88 : 1.08;
    this.nextDecisionAt = time + baseReaction * personalityDelay + Phaser.Math.Between(-55, 95);

    const center = this.scene.getArenaCenter();
    const dxCenter = center.x - this.sprite.x;
    const dyCenter = center.y - this.sprite.y;
    const norm = this.scene.getArenaNormalizedDistance(this.sprite.x, this.sprite.y);
    const edgeDanger = norm > (this.personality === 'defensive' ? 0.61 : GAME.AI_EDGE_DANGER);

    const opponents = this.scene.getActivePlayers().filter((p) => p !== this);
    this.target = this.chooseTarget(opponents, center);

    let tx = dxCenter;
    let ty = dyCenter;
    let dash = false;

    if (!edgeDanger && this.target) {
      const toTargetX = this.target.sprite.x - this.sprite.x;
      const toTargetY = this.target.sprite.y - this.sprite.y;
      const targetDistance = Math.hypot(toTargetX, toTargetY);

      if (this.personality === 'aggressive') {
        tx = toTargetX * 1.0 + dxCenter * 0.16;
        ty = toTargetY * 1.0 + dyCenter * 0.16;
        dash = targetDistance < 165 && Math.random() < 0.58;
      } else if (this.personality === 'defensive') {
        tx = dxCenter * 0.75 + toTargetX * 0.32;
        ty = dyCenter * 0.75 + toTargetY * 0.32;
        dash = targetDistance < 118 && norm < 0.55 && Math.random() < 0.31;
      } else {
        this.wanderAngle += Phaser.Math.FloatBetween(-1.3, 1.3);
        tx = toTargetX * 0.52 + Math.cos(this.wanderAngle) * 155 + dxCenter * 0.25;
        ty = toTargetY * 0.52 + Math.sin(this.wanderAngle) * 125 + dyCenter * 0.25;
        dash = targetDistance < 185 && Math.random() < 0.42;
      }
    }

    const warning = this.scene.arenaEvents?.warningVector;
    if (warning && !edgeDanger) {
      tx += warning.x * 58;
      ty += warning.y * 42;
    }

    if (Math.random() < 0.045) {
      tx *= -0.45;
      ty *= -0.45;
      dash = false;
    }

    const length = Math.hypot(tx, ty) || 1;
    this.intent.x = tx / length;
    this.intent.y = ty / length;
    this.intent.dash = dash;
  }

  chooseTarget(opponents, center) {
    if (!opponents.length) return null;

    if (this.personality === 'chaotic' && Math.random() < 0.35) {
      return Phaser.Utils.Array.GetRandom(opponents);
    }

    let best = opponents[0];
    let bestScore = Infinity;
    for (const opponent of opponents) {
      const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, opponent.sprite.x, opponent.sprite.y);
      const edge = this.scene.getArenaNormalizedDistance(opponent.sprite.x, opponent.sprite.y);
      const edgeBonus = this.personality === 'aggressive' ? edge * 85 : 0;
      const centerPenalty = Phaser.Math.Distance.Between(opponent.sprite.x, opponent.sprite.y, center.x, center.y) * 0.05;
      const score = d - edgeBonus + centerPenalty;
      if (score < bestScore) {
        best = opponent;
        bestScore = score;
      }
    }
    return best;
  }
}
