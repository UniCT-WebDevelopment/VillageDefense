export class WoodenFort extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    console.log("Da WoodenFort il forte è stato istanziato");
    this.scene = scene;
    this.endurance = 100;
    this.isDestroyed = false;

    this.fortImage = scene.add.image(0, 0, 'woodenFort')
      .setOrigin(0)
      .setDisplaySize(230, 230);

    this.labelBg = scene.add.graphics();
    this.labelBg.fillStyle(0x8B4513, 1); // Marrone
    this.labelBg.fillRect(0, -20, 60, 20);

    // Testo endurance (bianco)
    this.labelText = scene.add.text(5, -18, `${this.endurance}`, {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    });

    // Aggiungi tutti al container
    this.add([this.fortImage, this.labelBg, this.labelText]);
    this.setSize(250, 250);
    scene.add.existing(this);
  }

  acquireWood(wood) {
    console.log("Il forte ha acquistato una quantità di legna pari a " + wood);
    this.endurance += wood;
    this.labelText.setText(`${this.endurance.toFixed(0)}`);
  }

  takeDamage(damage) {
    console.log("Il forte può subire danni")
    if (this.isDestroyed) return;
    console.log("Il forte subisce danni");

    this.endurance -= damage;
    this.labelText.setText(`${this.endurance.toFixed(0)}`);

    if (this.endurance < 1) {
      this.destroy();
    }
  }


  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.emit('fortDestroyed', this.scene.ranking);
    super.destroy();
  }


}
