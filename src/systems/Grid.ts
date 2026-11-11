import { tilesOf } from '../data/assets';
import { FURNITURE, ROOM_COLS, ROOM_MAP, ROOM_ROWS } from '../data/room';

export interface Tile {
  tx: number;
  ty: number;
}

/** Прямоугольник в тайлах: левый верхний тайл и размер. */
export interface Area extends Tile {
  w: number;
  h: number;
}

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Карта занятости комнаты по тайлам: стены, сплошная мебель и поставленные устройства. */
export class Grid {
  /** blocked[ty][tx] — в этот тайл нельзя ни зайти, ни что-то поставить. */
  private readonly blocked: boolean[][];
  /** Тайлы вплотную к предметам, которыми игрок пользуется (к столу). */
  private readonly access: Tile[] = [];

  constructor() {
    this.blocked = ROOM_MAP.map((row) => [...row].map((ch) => ch === '#'));
    for (const def of FURNITURE) {
      const area = { tx: def.tx, ty: def.ty, ...tilesOf(def.asset) };
      if (def.solid) this.occupy(area);
      if (def.opens) this.access.push(...around(area));
    }
  }

  occupy(area: Area): void {
    for (let ty = area.ty; ty < area.ty + area.h; ty++) {
      for (let tx = area.tx; tx < area.tx + area.w; tx++) this.blocked[ty][tx] = true;
    }
  }

  /** Свободны ли все тайлы прямоугольника. За пределами комнаты свободных тайлов нет. */
  isFree(area: Area): boolean {
    for (let ty = area.ty; ty < area.ty + area.h; ty++) {
      for (let tx = area.tx; tx < area.tx + area.w; tx++) {
        if (tx < 0 || ty < 0 || tx >= ROOM_COLS || ty >= ROOM_ROWS || this.blocked[ty][tx]) return false;
      }
    }
    return true;
  }

  /**
   * Сможет ли игрок из тайла `from` дойти до стола, если занять ещё и `area`.
   * Обычный поиск в ширину по свободным тайлам. Ходы — только по четырём сторонам:
   * хитбокс игрока проходит в щель шириной в тайл, но не протискивается по диагонали между углами.
   */
  keepsAccess(from: Tile, area: Area): boolean {
    const inArea = (t: Tile): boolean =>
      t.tx >= area.tx && t.tx < area.tx + area.w && t.ty >= area.ty && t.ty < area.ty + area.h;
    const open = (t: Tile): boolean => !inArea(t) && this.isFree({ ...t, w: 1, h: 1 });
    const id = (t: Tile): number => t.ty * ROOM_COLS + t.tx;

    const goals = new Set(this.access.filter(open).map(id));
    const seen = new Set([id(from)]);
    const queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const tile = queue[i];
      if (goals.has(id(tile))) return true;
      for (const [dx, dy] of STEPS) {
        const next = { tx: tile.tx + dx, ty: tile.ty + dy };
        if (!open(next) || seen.has(id(next))) continue;
        seen.add(id(next));
        queue.push(next);
      }
    }
    return false;
  }
}

/** Тайлы, которые касаются прямоугольника стороной (угловые не в счёт). */
function around(area: Area): Tile[] {
  const tiles: Tile[] = [];
  for (let tx = area.tx; tx < area.tx + area.w; tx++) {
    tiles.push({ tx, ty: area.ty - 1 }, { tx, ty: area.ty + area.h });
  }
  for (let ty = area.ty; ty < area.ty + area.h; ty++) {
    tiles.push({ tx: area.tx - 1, ty }, { tx: area.tx + area.w, ty });
  }
  return tiles;
}
