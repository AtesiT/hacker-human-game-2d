import Phaser from 'phaser';
import { TILE, ZOOM } from '../data/config';
import { FURNITURE, ROOM_COLS, ROOM_MAP, ROOM_ROWS, SPAWN, TILE_FLOOR, TILE_WALL } from '../data/room';
import { Furniture } from '../entities/Furniture';
import { Player } from '../entities/Player';
import { Controls } from '../systems/Controls';

/** Игровой мир: комната и всё, что в ней находится. */
export class RoomScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Player;

  constructor() {
    super('Room');
  }

  create(): void {
    this.controls = new Controls(this);
    this.player = new Player(this, SPAWN.x, SPAWN.y);
    this.createRoom();
    this.setupCamera();
  }

  override update(): void {
    const dir = this.controls.direction();
    this.player.move(dir.x, dir.y);
  }

  private createRoom(): void {
    const data = ROOM_MAP.map((row) => [...row].map((ch) => (ch === '#' ? TILE_WALL : TILE_FLOOR)));
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    if (!tileset) throw new Error('Не найдена текстура тайлсета "tiles"');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('Не удалось создать слой комнаты');

    // Столкновения — обычные AABB из Arcade Physics: игрок против тайлов стен
    // и против неподвижных тел сплошной мебели.
    layer.setCollision(TILE_WALL);
    this.physics.add.collider(this.player, layer);

    const solids = this.physics.add.staticGroup();
    for (const def of FURNITURE) {
      const furniture = new Furniture(this, def);
      if (def.solid) solids.add(furniture);
    }
    this.physics.add.collider(this.player, solids);
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setZoom(ZOOM);
    // Границы не дают камере показать пустоту за стенами.
    camera.setBounds(0, 0, ROOM_COLS * TILE, ROOM_ROWS * TILE);
    // Второй аргумент обязателен: без него startFollow выключает привязку камеры
    // к целым пикселям, которую включил pixelArt.
    camera.startFollow(this.player, true);
  }
}
