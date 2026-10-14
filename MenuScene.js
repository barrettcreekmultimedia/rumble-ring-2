export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#07101d');

    const bg = this.add.graphics();
    bg.fillStyle(0x0b1d30, 1).fillCircle(width * 0.5, height * 0.42, 270);
    bg.fillStyle(0x102a42, 0.6).fillCircle(width * 0.5, height * 0.42, 190);
    bg.lineStyle(3, 0x54d7ff, 0.28).strokeCircle(width * 0.5, height * 0.42, 235);

    this.add.text(width / 2, 145, 'RUMBLE', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '78px', color: '#ffffff',
      stroke: '#07101d', strokeThickness: 12,
    }).setOrigin(0.5);
    this.add.text(width / 2, 215, 'RING', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '88px', color: '#54d7ff',
      stroke: '#07101d', strokeThickness: 12,
    }).setOrigin(0.5);

    this.add.text(width / 2, 310, 'BUMP HARD. STAY ON.', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#b8d5e8',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, 400, 270, 70, 0xffd34e, 1)
      .setStrokeStyle(4, 0xffffff, 0.22)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(width / 2, 400, 'PLAY', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '28px', color: '#141006',
    }).setOrigin(0.5);

    const start = () => {
      button.disableInteractive();
      this.cameras.main.flash(120, 255, 255, 255, false);
      this.time.delayedCall(90, () => this.scene.start('GameScene'));
    };
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', start);

    this.add.text(width / 2, 505, 'HOW TO PLAY', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '17px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add.text(width / 2, 552, 'MOVE  —  WASD     •     BUMP  —  SPACE\nLAST PLAYER STANDING WINS', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#b8d5e8', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5);

    this.add.text(width / 2, 646, 'Original arcade prototype • Keyboard + AI', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#66869d',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);

    this.tweens.add({ targets: [button, buttonText], y: '-=7', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
}
