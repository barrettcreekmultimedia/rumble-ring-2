export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.p1 = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  getHumanIntent(slot = 0) {
    if (slot !== 0) return { x: 0, y: 0, dash: false };

    let x = 0;
    let y = 0;
    if (this.p1.left.isDown) x -= 1;
    if (this.p1.right.isDown) x += 1;
    if (this.p1.up.isDown) y -= 1;
    if (this.p1.down.isDown) y += 1;

    if (x !== 0 || y !== 0) {
      const length = Math.hypot(x, y) || 1;
      x /= length;
      y /= length;
    }

    return {
      x,
      y,
      dash: Phaser.Input.Keyboard.JustDown(this.p1.dash),
    };
  }
}
