import type Phaser from 'phaser';
import { css } from '../data/palette';

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
