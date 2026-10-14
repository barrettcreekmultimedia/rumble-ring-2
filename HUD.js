export class HUD {
  constructor(scene) {
    this.scene = scene;

    this.playersText = scene.add.text(30, 28, '4 REMAIN', {
      fontFamily: 'Arial, sans-serif', fontSize: '21px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#07101d', strokeThickness: 5,
    }).setDepth(100).setScrollFactor(0);

    this.timerText = scene.add.text(scene.scale.width - 30, 28, '0:00.0', {
      fontFamily: 'Arial, sans-serif', fontSize: '21px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#07101d', strokeThickness: 5,
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    this.warningBox = scene.add.rectangle(scene.scale.width / 2, 86, 360, 58, 0x06111e, 0.86)
      .setStrokeStyle(2, 0xffd34e, 0.9).setDepth(98).setVisible(false);
    this.warningText = scene.add.text(scene.scale.width / 2, 86, '', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '22px', color: '#fff2a8', align: 'center',
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.toast = scene.add.text(scene.scale.width / 2, 150, '', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '28px', color: '#ffffff',
      stroke: '#07101d', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(102).setAlpha(0);

    this.debugText = scene.add.text(20, scene.scale.height - 20, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#8ef4ff', backgroundColor: '#02060aaa',
      padding: { x: 7, y: 5 },
    }).setOrigin(0, 1).setDepth(120).setVisible(false);
  }

  update(playersRemaining, elapsed) {
    this.playersText.setText(`${playersRemaining} REMAIN`);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.timerText.setText(`${minutes}:${seconds.toFixed(1).padStart(4, '0')}`);
  }

  showWarning(label, symbol = '⚠') {
    this.warningBox.setVisible(true).setAlpha(0);
    this.warningText.setText(`${symbol}  ${label}  ${symbol}`).setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: [this.warningBox, this.warningText], alpha: 1, duration: 120, yoyo: true, repeat: 1 });
  }

  clearWarning() {
    this.warningBox.setVisible(false);
    this.warningText.setVisible(false);
  }

  showToast(text, color = '#ffffff', duration = 950) {
    this.toast.setText(text).setColor(color).setAlpha(0).setScale(0.78);
    this.scene.tweens.killTweensOf(this.toast);
    this.scene.tweens.add({
      targets: this.toast,
      alpha: 1,
      scale: 1,
      duration: 130,
      ease: 'Back.Out',
      hold: Math.max(0, duration - 280),
      yoyo: true,
    });
  }

  setDebug(text, visible) {
    this.debugText.setVisible(visible);
    if (visible) this.debugText.setText(text);
  }
}
