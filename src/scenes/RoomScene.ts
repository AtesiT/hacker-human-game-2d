import Phaser from 'phaser';
import { TILE, ZOOM } from '../data/config';
import { FURNITURE, ROOM_COLS, ROOM_MAP, ROOM_ROWS, SPAWN, TILE_FLOOR, TILE_WALL } from '../data/room';
import { Furniture } from '../entities/Furniture';

/** Игровой мир: комната и всё, что в ней находится. */
export class RoomScene extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create(): void {
    this.createRoom();
    this.setupCamera();
  }

  private createRoom(): void {
    const data = ROOM_MAP.map((row) => [...row].map((ch) => (ch === '#' ? TILE_WALL : TILE_FLOOR)));
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    if (!tileset) throw new Error('Не найдена текстура тайлсета "tiles"');
    map.createLayer(0, tileset, 0, 0);

    for (const def of FURNITURE) new Furniture(this, def);
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setZoom(ZOOM);
    // Границы не дают камере показать пустоту за стенами.
    camera.setBounds(0, 0, ROOM_COLS * TILE, ROOM_ROWS * TILE);
    camera.centerOn(SPAWN.x, SPAWN.y);
  }
}
