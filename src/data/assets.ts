import { DB32 } from './palette';

/** Ключ ассета: он же ключ текстуры в Phaser и имя файла спрайта. */
export type AssetKey =
  | 'tiles'
  | 'player'
  | 'window'
  | 'door'
  | 'desk'
  | 'bed'
  | 'shelf'
  | 'couch'
  | 'fridge'
  | 'rug';

export interface AssetDef {
  /** Размер одного кадра в пикселях. */
  frameW: number;
  frameH: number;
  /** Сетка кадров в листе. По умолчанию лист состоит из одного кадра. */
  cols?: number;
  rows?: number;
  /**
   * Цвета заглушки из DB32: [заливка, обводка].
   * У тайлсета — по такой паре на каждый тайл подряд, у игрока третий цвет — «лицо».
   */
  colors: number[];
  /** Подпись поверх заглушки. */
  label?: string;
}

/**
 * Манифест ассетов: что из чего состоит и как выглядит заглушка.
 *
 * Чтобы заменить заглушку настоящим спрайтом, положите PNG с именем ключа
 * в src/assets/sprites/ — например, desk.png. Размер листа должен быть
 * (frameW × cols) на (frameH × rows) пикселей. Код менять не нужно:
 * файл подхватится сам, а подпись заглушки пропадёт.
 */
export const ASSETS: Record<AssetKey, AssetDef> = {
  // Тайлсет комнаты. Порядок тайлов: 0 — пол, 1 — стена (см. data/room.ts).
  tiles: {
    frameW: 16,
    frameH: 16,
    cols: 2,
    colors: [DB32.oiledCedar, DB32.loulou, DB32.dimGray, DB32.smokeyAsh],
  },

  // Игрок: 4 ряда по направлению взгляда (вниз, влево, вправо, вверх) × 4 кадра шага.
  // Первый кадр ряда — он же поза «стоит».
  player: {
    frameW: 16,
    frameH: 24,
    cols: 4,
    rows: 4,
    colors: [DB32.royalBlue, DB32.deepKoamaru, DB32.pancho],
    label: 'ИГРОК',
  },

  // Мебель и детали комнаты. Размер кадра кратен тайлу: 48×32 — это 3×2 тайла.
  window: { frameW: 32, frameH: 16, colors: [DB32.viking, DB32.veniceBlue], label: 'ОКНО' },
  door: { frameW: 32, frameH: 16, colors: [DB32.rope, DB32.loulou], label: 'ДВЕРЬ' },
  desk: { frameW: 48, frameH: 32, colors: [DB32.twine, DB32.rope], label: 'СТОЛ' },
  bed: { frameW: 32, frameH: 48, colors: [DB32.veniceBlue, DB32.deepKoamaru], label: 'КРОВАТЬ' },
  shelf: { frameW: 32, frameH: 16, colors: [DB32.stinger, DB32.verdigris], label: 'ШКАФ' },
  couch: { frameW: 48, frameH: 16, colors: [DB32.clairvoyant, DB32.loulou], label: 'ДИВАН' },
  fridge: { frameW: 16, frameH: 16, colors: [DB32.lightSteelBlue, DB32.heather], label: 'ХОЛОД' },
  rug: { frameW: 64, frameH: 48, colors: [DB32.brown, DB32.loulou], label: 'КОВЁР' },
};
