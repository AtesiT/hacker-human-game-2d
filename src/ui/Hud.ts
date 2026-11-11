import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../data/config';
import { DB32 } from '../data/palette';
import { TEXT_BACKING, UI_DEPTH, textStyle } from './theme';

/** Отступ текста от подложки, px. */
const PADDING = { x: 8, y: 6 };

/** Постоянные элементы интерфейса поверх комнаты. */
export class Hud {
  private readonly hint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.hint = scene.add
      .text(VIEW_W / 2, VIEW_H - 16, '', {
        ...textStyle(16, DB32.white),
        backgroundColor: TEXT_BACKING,
        padding: PADDING,
      })
      .setOrigin(0.5, 1)
      .setDepth(UI_DEPTH.hud)
      .setVisible(false);
  }

  /** Подсказка внизу экрана. Пустая строка её убирает. */
  setHint(text: string): void {
    this.hint.setText(text).setVisible(text !== '');
  }
}
