import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { createPlaceholders, loadSprites } from '../systems/Placeholders';

/** Готовит текстуры (спрайты или заглушки) и анимации, затем запускает игру. */
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
    // Мир и интерфейс работают параллельно, двумя сценами. Команды выполняются по порядку:
    // интерфейс создаётся первым, потому что комната при создании сразу к нему обращается.
    // Рисуется он при этом последним — порядок отрисовки задан списком сцен в main.ts.
    this.scene.launch('UI');
    this.scene.start('Room');
  }
}
