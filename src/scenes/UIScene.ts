import Phaser from 'phaser';
import { Hud } from '../ui/Hud';
import { Terminal } from '../ui/Terminal';

/**
 * Слой интерфейса. Это отдельная сцена поверх мира: у неё своя камера без зума,
 * поэтому текст рисуется в пикселях канваса и не зависит от движения камеры по комнате.
 * Сцена только держит элементы интерфейса, а управляет ими RoomScene.
 * Сама она следит за одним: есть ли у страницы фокус клавиатуры.
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

    // Клавиши доходят до игры, только пока у страницы есть фокус. Если игра встроена
    // в другую страницу (например, в окно предпросмотра), фокус сначала нужно получить кликом.
    this.game.events.on(Phaser.Core.Events.BLUR, () => this.hud.setFocusHint(true));
    this.game.events.on(Phaser.Core.Events.FOCUS, () => this.hud.setFocusHint(false));
    this.hud.setFocusHint(!document.hasFocus());
  }
}
