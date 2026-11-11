import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { createPlaceholders, loadSprites } from '../systems/Placeholders';

/** Готовит текстуры (спрайты или заглушки) и анимации, затем запускает комнату. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    loadSprites(this);
  }

  create(): void {
    createPlaceholders(this);
    Player.createAnimations(this.anims);
    this.scene.start('Room');
  }
}
