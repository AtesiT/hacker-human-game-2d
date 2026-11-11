import Phaser from 'phaser';
import { tilesOf } from '../data/assets';
import { DEPTH, TILE } from '../data/config';
import { DEVICES, type DeviceKind } from '../data/devices';
import { DB32 } from '../data/palette';
import { ROOM_COLS, ROOM_ROWS } from '../data/room';
import type { Player } from '../entities/Player';
import type { Action } from './Controls';
import type { Area, Grid } from './Grid';
import { addLabel } from './Placeholders';

/**
 * Режим расстановки: полупрозрачный контур устройства двигается по сетке тайлов.
 * Сам режим ничего не покупает и не ставит — он только выбирает место и говорит, годится ли оно.
 */
export class BuildMode {
  /** Что ставим. */
  kind: DeviceKind = 'rack';
  /** Выбранное место: левый верхний тайл и размер устройства. */
  area: Area = { tx: 0, ty: 0, w: 1, h: 1 };
  /** Почему сюда поставить нельзя. null — можно. */
  problem: string | null = null;

  private ghost: Phaser.GameObjects.Image | null = null;
  private marker: Phaser.GameObjects.Rectangle | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly grid: Grid,
    private readonly player: Player,
  ) {}

  start(kind: DeviceKind): void {
    this.stop();
    this.kind = kind;

    const asset = DEVICES[kind].asset;
    const { w, h } = tilesOf(asset);
    this.ghost = this.scene.add.image(0, 0, asset).setAlpha(0.8).setDepth(DEPTH.ghost);
    addLabel(this.scene, this.ghost, asset, true);
    // Цветная плашка поверх контура: зелёная — поставить можно, красная — нельзя.
    this.marker = this.scene.add.rectangle(0, 0, w * TILE, h * TILE, DB32.white, 0.45).setDepth(DEPTH.ghost);

    this.moveTo(this.nearestFreeSpot(w, h));
    // Пока идёт расстановка, камера следит за контуром: так достаётся любой угол комнаты.
    this.scene.cameras.main.startFollow(this.ghost, true);
  }

  stop(): void {
    if (!this.ghost) return;
    this.ghost.destroy();
    this.marker?.destroy();
    this.ghost = null;
    this.marker = null;
    this.scene.cameras.main.startFollow(this.player, true);
  }

  /** Сдвигает контур на один тайл. Остальные действия режим не обрабатывает. */
  handle(action: Action): void {
    const { tx, ty } = this.area;
    if (action === 'left') this.moveTo({ ...this.area, tx: tx - 1 });
    else if (action === 'right') this.moveTo({ ...this.area, tx: tx + 1 });
    else if (action === 'up') this.moveTo({ ...this.area, ty: ty - 1 });
    else if (action === 'down') this.moveTo({ ...this.area, ty: ty + 1 });
  }

  private moveTo(area: Area): void {
    // Контур не выходит за стены: крайние ряд и столбец карты — это они.
    const tx = Phaser.Math.Clamp(area.tx, 1, ROOM_COLS - 1 - area.w);
    const ty = Phaser.Math.Clamp(area.ty, 1, ROOM_ROWS - 1 - area.h);
    this.area = { ...area, tx, ty };
    this.problem = this.check(this.area);

    const x = (tx + area.w / 2) * TILE;
    const y = (ty + area.h / 2) * TILE;
    this.ghost?.setPosition(x, y);
    this.marker?.setPosition(x, y).setFillStyle(this.problem ? DB32.brown : DB32.christi, 0.45);
  }

  /** Правила расстановки. Возвращает причину отказа или null. */
  private check(area: Area): string | null {
    if (!this.grid.isFree(area)) return 'МЕСТО ЗАНЯТО';

    const rect = new Phaser.Geom.Rectangle(area.tx * TILE, area.ty * TILE, area.w * TILE, area.h * TILE);
    if (Phaser.Geom.Rectangle.Overlaps(rect, this.player.hitbox())) return 'ЗДЕСЬ СТОИТЕ ВЫ';

    // Устройства нельзя убрать, поэтому нельзя и отгородить ими игрока от стола:
    // без терминала игра встанет.
    const from = { tx: Math.floor(this.player.x / TILE), ty: Math.floor(this.player.y / TILE) };
    if (!this.grid.keepsAccess(from, area)) return 'ЗАКРОЕТ ПРОХОД К СТОЛУ';

    return null;
  }

  /** Ближайшее к игроку место, куда устройство можно поставить: с него контур начинает. */
  private nearestFreeSpot(w: number, h: number): Area {
    const { x, y } = this.player;
    let best: Area | null = null;
    let bestDistance = Infinity;
    for (let ty = 1; ty <= ROOM_ROWS - 1 - h; ty++) {
      for (let tx = 1; tx <= ROOM_COLS - 1 - w; tx++) {
        const area = { tx, ty, w, h };
        if (this.check(area) !== null) continue;
        const distance = Phaser.Math.Distance.Between((tx + w / 2) * TILE, (ty + h / 2) * TILE, x, y);
        if (distance < bestDistance) {
          best = area;
          bestDistance = distance;
        }
      }
    }
    // Свободного места нет совсем — контур встаёт там же, где игрок, и показывает отказ.
    return best ?? { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE), w, h };
  }
}
