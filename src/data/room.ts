import type { AssetKey } from './assets';
import { TILE } from './config';

/** Номера тайлов в тайлсете `tiles`. */
export const TILE_FLOOR = 0;
export const TILE_WALL = 1;

/**
 * Карта комнаты: `#` — стена, `.` — пол, один символ — один тайл.
 * Комната 24×16 тайлов чуть больше экрана (20×11), поэтому камера следует за игроком.
 */
export const ROOM_MAP = [
  '########################',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '#......................#',
  '########################',
];

export const ROOM_COLS = ROOM_MAP[0].length;
export const ROOM_ROWS = ROOM_MAP.length;

export interface FurnitureDef {
  asset: AssetKey;
  /** Левый верхний тайл. Размер предмета берётся из размера его ассета. */
  tx: number;
  ty: number;
  /** Сплошной предмет: сквозь него не пройти и на его место ничего не поставить. */
  solid: boolean;
}

export const FURNITURE: FurnitureDef[] = [
  // Детали на стенах — только для вида, выйти из комнаты нельзя.
  { asset: 'window', tx: 5, ty: 0, solid: false },
  { asset: 'window', tx: 17, ty: 0, solid: false },
  { asset: 'door', tx: 11, ty: 15, solid: false },

  { asset: 'bed', tx: 1, ty: 1, solid: true },
  { asset: 'shelf', tx: 3, ty: 1, solid: true },
  { asset: 'desk', tx: 10, ty: 1, solid: true },
  { asset: 'fridge', tx: 22, ty: 1, solid: true },
  { asset: 'couch', tx: 18, ty: 14, solid: true },
  { asset: 'rug', tx: 10, ty: 7, solid: false },
];

/** Точка появления игрока: центр тайла перед столом. */
export const SPAWN = { x: 11 * TILE + TILE / 2, y: 5 * TILE + TILE / 2 };
