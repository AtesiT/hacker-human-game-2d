import Phaser from 'phaser';
import { Hud } from '../ui/Hud';
import { Terminal } from '../ui/Terminal';

/**
 * Слой интерфейса. Это отдельная сцена поверх мира: у неё своя камера без зума,
 * поэтому текст рисуется в пикселях канваса и не зависит от движения камеры по комнате.
 * Сцена только держит элементы интерфейса, а управляет ими RoomScene.
 */
export class UIScene extends Phaser.Scene {
  hud!: Hud;
  terminal!: Terminal;

  constructor() {
    super('UI');
  }

  create(): void {
    this.hud = new Hud(this);
    this.terminal = new Terminal(this);
  }
}
