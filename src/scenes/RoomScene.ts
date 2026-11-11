import Phaser from 'phaser';
import { TILE, ZOOM } from '../data/config';
import { FURNITURE, ROOM_COLS, ROOM_MAP, ROOM_ROWS, SPAWN, TILE_FLOOR, TILE_WALL } from '../data/room';
import { Furniture } from '../entities/Furniture';
import { Player } from '../entities/Player';
import { Controls, type Action } from '../systems/Controls';
import { Interaction } from '../systems/Interaction';
import type { Hud } from '../ui/Hud';
import type { Terminal } from '../ui/Terminal';
import type { UIScene } from './UIScene';

/** Чем сейчас управляют клавиши: ходьбой или окном терминала. */
type Mode = 'walk' | 'terminal';

/** Игровой мир: комната и всё, что в ней находится. Здесь же связаны системы игры. */
export class RoomScene extends Phaser.Scene {
  private controls!: Controls;
  private interaction!: Interaction;
  private player!: Player;
  private hud!: Hud;
  private terminal!: Terminal;
  private mode: Mode = 'walk';

  constructor() {
    super('Room');
  }

  create(): void {
    // Сцена интерфейса к этому моменту уже создана (см. BootScene).
    const ui = this.scene.get('UI') as UIScene;
    this.hud = ui.hud;
    this.terminal = ui.terminal;
    this.terminal.setTabs([
      { title: 'МАГАЗИН', verb: 'КУПИТЬ', rows: () => [] },
      { title: 'ЗАКАЗЫ', verb: 'ВЗЯТЬ', rows: () => [] },
    ]);

    this.mode = 'walk';
    this.controls = new Controls(this, (action) => this.onAction(action));
    this.interaction = new Interaction(this);
    this.player = new Player(this, SPAWN.x, SPAWN.y);
    this.createRoom();
    this.setupCamera();
  }

  override update(_time: number, delta: number): void {
    this.controls.update(delta);

    const walking = this.mode === 'walk';
    const dir = walking ? this.controls.direction() : { x: 0, y: 0 };
    this.player.move(dir.x, dir.y);

    if (walking) this.interaction.update(this.player.x, this.player.y);
    else this.interaction.clear();
    const target = this.interaction.target;
    this.hud.setHint(target ? `[E] ${target.hint}` : '');
  }

  /** Одно нажатие клавиши. Что оно значит, зависит от режима. */
  private onAction(action: Action): void {
    if (this.mode === 'walk') {
      if (action === 'confirm') this.interaction.target?.interact();
    } else if (action === 'cancel') {
      this.setMode('walk');
    } else {
      this.terminal.handle(action);
    }
  }

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.controls.waitForRelease();
    if (mode === 'terminal') this.terminal.open();
    else this.terminal.close();
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
      if (def.opens === 'terminal') {
        this.interaction.add({
          bounds: furniture.getBounds(),
          hint: 'ТЕРМИНАЛ',
          interact: () => this.setMode('terminal'),
        });
      }
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
