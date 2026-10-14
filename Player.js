import { GAME } from '../config.js';

export class Player {
  constructor(scene, def, x, y) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.isHuman = Boolean(def.human);
    this.eliminated = false;
    this.falling = false;
    this.canControl = false;
    this.isDashing = false;
    this.lastDashAt = -99999;
    this.dashEndsAt = 0;
    this.lastIntent = { x: 0, y: 0 };
    this.facing = new Phaser.Math.Vector2(0, -1);

    this.shadow = scene.add.ellipse(x, y + 13, 42, 18, 0x000000, 0.32).setDepth(14);
    this.sprite = scene.physics.add.image(x, y, 'player-body')
      .setTint(def.color)
      .setDepth(20)
      .setBounce(0.62)
      .setCollideWorldBounds(false);

    this.sprite.body.setCircle(GAME.PLAYER_RADIUS, 2, 2);
    this.sprite.body.setMaxVelocity(GAME.PLAYER_SPEED * 1.8, GAME.PLAYER_SPEED * 1.8);
    this.sprite.body.setDrag(GAME.PLAYER_DRAG, GAME.PLAYER_DRAG);
    this.sprite.setData('player', this);

    this.facingDot = scene.add.circle(x, y - 14, 5, def.dark, 0.95).setDepth(23);
    this.nameTag = scene.add.text(x, y - 39, def.human ? 'YOU' : def.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: def.human ? '14px' : '11px',
      fontStyle: 'bold',
      color: def.human ? '#ffffff' : '#dbe9f4',
      stroke: '#06101b',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(24);

    this.cooldownBg = scene.add.rectangle(x, y + 34, 42, 5, 0x02050a, 0.6).setDepth(24);
    this.cooldownFill = scene.add.rectangle(x - 20, y + 34, 40, 3, def.color, 0.95)
      .setOrigin(0, 0.5)
      .setDepth(25);
  }

  getIntent() {
    return this.scene.inputManager.getHumanIntent(this.id);
  }

  setControlEnabled(enabled) {
    this.canControl = enabled;
  }

  update(time, delta) {
    if (this.eliminated || this.falling) return;

    const dt = Math.min(delta, 40) / 1000;
    let intent = { x: 0, y: 0, dash: false };

    if (this.canControl) intent = this.getIntent(time, delta);

    const inputLength = Math.hypot(intent.x, intent.y);
    if (inputLength > 0.05) {
      this.lastIntent.x = intent.x;
      this.lastIntent.y = intent.y;
      this.facing.set(intent.x, intent.y).normalize();
      this.sprite.setAcceleration(
        intent.x * GAME.PLAYER_ACCELERATION,
        intent.y * GAME.PLAYER_ACCELERATION,
      );
    } else {
      this.sprite.setAcceleration(0, 0);
    }

    const drag = GAME.PLAYER_DRAG * (this.scene.surfaceGrip ?? 1);
    this.sprite.body.setDrag(drag, drag);

    if (intent.dash) this.tryDash(time);
    if (this.isDashing && time >= this.dashEndsAt) this.isDashing = false;

    const speed = this.sprite.body.velocity.length();
    if (!this.isDashing && speed > GAME.PLAYER_SPEED) {
      this.sprite.body.velocity.scale(GAME.PLAYER_SPEED / speed);
    }

    this.updatePresentation(time, dt);
  }

  tryDash(time) {
    if (!this.canControl || this.eliminated || this.falling) return false;
    if (time - this.lastDashAt < GAME.DASH_COOLDOWN) return false;

    if (this.facing.lengthSq() < 0.5) this.facing.set(0, -1);
    this.lastDashAt = time;
    this.dashEndsAt = time + GAME.DASH_DURATION;
    this.isDashing = true;

    const current = this.sprite.body.velocity;
    this.sprite.setVelocity(
      current.x + this.facing.x * GAME.DASH_FORCE,
      current.y + this.facing.y * GAME.DASH_FORCE,
    );

    this.scene.effects.dashTrail(this);
    this.scene.audioManager.dash();
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.24,
      scaleY: 0.82,
      duration: 70,
      yoyo: true,
      ease: 'Quad.Out',
    });
    return true;
  }

  applyImpulse(x, y) {
    if (this.eliminated || this.falling) return;
    this.sprite.body.velocity.x += x;
    this.sprite.body.velocity.y += y;
  }

  updatePresentation(time) {
    const x = this.sprite.x;
    const y = this.sprite.y;
    const depthScale = Phaser.Math.Clamp(0.93 + ((y - 170) / 600) * 0.12, 0.88, 1.08);
    if (!this.scene.tweens.isTweening(this.sprite)) this.sprite.setScale(depthScale);

    this.shadow.setPosition(x, y + 14 * depthScale);
    this.shadow.setScale(depthScale * 1.03, depthScale);
    this.facingDot.setPosition(
      x + this.facing.x * 14 * depthScale,
      y + this.facing.y * 14 * depthScale,
    );
    this.nameTag.setPosition(x, y - 38 * depthScale);
    this.cooldownBg.setPosition(x, y + 34 * depthScale);
    this.cooldownFill.setPosition(x - 20, y + 34 * depthScale);

    const elapsed = time - this.lastDashAt;
    const ready = Phaser.Math.Clamp(elapsed / GAME.DASH_COOLDOWN, 0, 1);
    this.cooldownFill.displayWidth = Math.max(0.01, 40 * ready);
    this.cooldownFill.setAlpha(ready >= 1 ? 0.95 : 0.55);
  }

  beginFall(onComplete) {
    if (this.eliminated || this.falling) return;
    this.falling = true;
    this.canControl = false;
    this.sprite.setAcceleration(0, 0);
    this.sprite.body.enable = false;
    this.nameTag.setVisible(false);
    this.cooldownBg.setVisible(false);
    this.cooldownFill.setVisible(false);
    this.facingDot.setVisible(false);

    this.scene.audioManager.fall();
    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      scaleX: 0.25,
      scaleY: 0.25,
      duration: 360,
      ease: 'Quad.In',
    });
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y + 86,
      scaleX: 0.08,
      scaleY: 0.08,
      rotation: Phaser.Math.FloatBetween(-3.2, 3.2),
      alpha: 0.15,
      duration: 430,
      ease: 'Quad.In',
      onComplete: () => {
        this.eliminated = true;
        this.falling = false;
        this.sprite.setVisible(false);
        this.shadow.setVisible(false);
        onComplete?.(this);
      },
    });
  }

  destroy() {
    [this.sprite, this.shadow, this.facingDot, this.nameTag, this.cooldownBg, this.cooldownFill]
      .forEach((obj) => obj?.destroy());
  }
}
