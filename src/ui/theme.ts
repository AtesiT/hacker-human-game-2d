import type Phaser from 'phaser';
import { DB32, css, cssAlpha } from '../data/palette';

/**
 * Пиксельный шрифт с кириллицей (ставится из npm, файлы лежат внутри сборки).
 * Он нарисован по сетке 8×8, поэтому размеры берутся только кратные 8 px —
 * при других буквы получаются размытыми.
 */
export const FONT_FAMILY = '"Press Start 2P"';

export type FontSize = 8 | 16 | 24;

export function textStyle(size: FontSize, color: number): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT_FAMILY, fontSize: `${size}px`, color: css(color) };
}

/** Цвета интерфейса: тёмная панель и зелёный текст, как в терминале. */
export const UI = {
  panel: DB32.valhalla,
  text: DB32.atlantis,
  textDim: DB32.elfGreen, // пояснения и подсказки
  disabled: DB32.topaz, // то, что сейчас недоступно
  accent: DB32.goldenFizz, // деньги и выбранная строка
  selection: DB32.deepKoamaru, // фон выбранной строки
  good: DB32.atlantis,
  bad: DB32.mandy,
} as const;

/** Полупрозрачная подложка под текстом интерфейса, чтобы он читался поверх комнаты. */
export const TEXT_BACKING = cssAlpha(UI.panel, 0.88);

/** Порядок отрисовки в слое интерфейса. */
export const UI_DEPTH = {
  terminal: 10,
  hud: 20, // поверх затемнения терминала: деньги видны и в магазине
} as const;
