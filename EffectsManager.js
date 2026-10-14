export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
  }

  impact(x, y, color = 0xffffff, strength = 1) {
    const ring = this.scene.add.circle(x, y, 14, color, 0.12)
      .setStrokeStyle(3, color, 0.9)
      .setDepth(35);

    this.scene.tweens.add({
      targets: ring,
      scale: 1 + strength * 1.6,
      alpha: 0,
      duration: 180 + strength * 70,
      ease: 'Quad.Out',
      onComplete: () => ring.destroy(),
    });

    const count = Math.round(4 + strength * 5);
    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(32, 78) * strength;
      const p = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(2, 4), color, 0.9).setDepth(34);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed * 0.7,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(170, 270),
        ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  dashTrail(player) {
    const ghost = this.scene.add.image(player.sprite.x, player.sprite.y, 'player-body')
      .setTint(player.def.color)
      .setAlpha(0.28)
      .setScale(player.sprite.scaleX, player.sprite.scaleY)
      .setDepth(player.sprite.depth - 1);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: ghost.scaleX * 0.65,
      scaleY: ghost.scaleY * 0.65,
      duration: 150,
      onComplete: () => ghost.destroy(),
    });
  }

  arenaDust(x, y) {
    for (let i = 0; i < 10; i += 1) {
      const p = this.scene.add.circle(
        x + Phaser.Math.Between(-260, 260),
        y + Phaser.Math.Between(-110, 110),
        Phaser.Math.Between(2, 5),
        0xe8f4ff,
        0.18,
      ).setDepth(7);
      this.scene.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(8, 22),
        alpha: 0,
        duration: Phaser.Math.Between(250, 420),
        onComplete: () => p.destroy(),
      });
    }
  }
}
