import Phaser from 'phaser';
import { createPlaceholders, loadSprites } from '../systems/Placeholders';

/** Готовит текстуры (спрайты или заглушки) и запускает комнату. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    loadSprites(this);
  }

  create(): void {
    createPlaceholders(this);
    this.scene.start('Room');
  }
}
