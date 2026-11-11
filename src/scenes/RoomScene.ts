import Phaser from 'phaser';
import { tilesOf } from '../data/assets';
import { AUTOSAVE_PERIOD, PLAYER_HITBOX, START_MONEY, TILE, ZOOM } from '../data/config';
import { DEVICES, type DeviceKind } from '../data/devices';
import { DB32 } from '../data/palette';
import { FURNITURE, ROOM_COLS, ROOM_MAP, ROOM_ROWS, SPAWN, TILE_FLOOR, TILE_WALL } from '../data/room';
import { Device } from '../entities/Device';
import { Furniture } from '../entities/Furniture';
import { Player } from '../entities/Player';
import { BuildMode } from '../systems/BuildMode';
import { Controls, type Action } from '../systems/Controls';
import { Economy } from '../systems/Economy';
import { Grid } from '../systems/Grid';
import { Interaction } from '../systems/Interaction';
import { Orders } from '../systems/Orders';
import { loadSave, resetIfRequested, writeSave, type SaveData } from '../systems/Save';
import { clock, signedMoney } from '../ui/format';
import type { Hud } from '../ui/Hud';
import { ordersTab, shopTab } from '../ui/tabs';
import type { Terminal } from '../ui/Terminal';
import { UI } from '../ui/theme';
import type { UIScene } from './UIScene';

/** Чем сейчас управляют клавиши: ходьбой, окном терминала или расстановкой устройства. */
type Mode = 'walk' | 'terminal' | 'build';

/** Подсказка об управлении для того, кто видит игру впервые. */
const INTRO_HINT = 'WASD/СТРЕЛКИ - ХОДИТЬ   E У СТОЛА - ТЕРМИНАЛ';

/** Игровой мир: комната и всё, что в ней находится. Здесь же связаны системы игры. */
export class RoomScene extends Phaser.Scene {
  private build!: BuildMode;
  private controls!: Controls;
  private economy!: Economy;
  private grid!: Grid;
  private interaction!: Interaction;
  private orders!: Orders;
  /** Строка с таймером заказа, которая сейчас на экране. */
  private orderText = '';
  private player!: Player;
  /** Всё, сквозь что игрок не проходит: сплошная мебель и устройства. */
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: Hud;
  private terminal!: Terminal;
  private mode: Mode = 'walk';
  /** Показывать ли вводную подсказку: да — в новой игре, пока игрок не открыл терминал. */
  private showIntro = false;

  constructor() {
    super('Room');
  }

  create(): void {
    // Сцена интерфейса к этому моменту уже создана (см. BootScene).
    const ui = this.scene.get('UI') as UIScene;
    this.hud = ui.hud;
    this.terminal = ui.terminal;

    const wasReset = resetIfRequested();
    const save = loadSave();
    this.showIntro = save === null;

    this.economy = new Economy(save?.money ?? START_MONEY, (money, delta) => {
      this.hud.setMoney(money);
      this.hud.notify(signedMoney(delta), delta < 0 ? UI.bad : UI.good);
      // От баланса зависит, что можно купить: открытый магазин нужно перерисовать.
      this.terminal.refresh();
    });
    this.hud.setMoney(this.economy.money);

    this.orders = new Orders((reward) => {
      if (reward > 0) {
        this.hud.notify('ЗАКАЗ ВЫПОЛНЕН', UI.good);
        this.economy.add(reward);
      } else {
        this.hud.notify('ЗАКАЗ ПРОВАЛЕН', UI.bad);
      }
    });

    this.controls = new Controls(this, (action) => this.onAction(action));
    this.interaction = new Interaction(this);
    this.grid = new Grid();
    this.player = new Player(this, SPAWN.x, SPAWN.y);
    this.build = new BuildMode(this, this.grid, this.player);
    this.createRoom();
    this.setupCamera();

    this.terminal.setTabs([
      shopTab(this.economy, (kind) => this.startBuild(kind)),
      ordersTab(this.orders),
    ]);

    if (save) {
      this.restore(save);
      this.hud.notify('ИГРА ЗАГРУЖЕНА', DB32.white);
    } else if (wasReset) {
      this.hud.notify('ПРОГРЕСС СБРОШЕН', DB32.white);
    }
    this.setupAutosave();
  }

  override update(_time: number, delta: number): void {
    this.controls.update(delta);
    this.economy.update(delta);
    this.orders.update(delta);
    this.updateOrderTimer();

    const walking = this.mode === 'walk';
    const dir = walking ? this.controls.direction() : { x: 0, y: 0 };
    this.player.move(dir.x, dir.y);

    this.updateInteraction();
    this.updateHint();
  }

  /** Одно нажатие клавиши. Что оно значит, зависит от режима. */
  private onAction(action: Action): void {
    switch (this.mode) {
      case 'walk':
        if (action === 'confirm') this.interaction.target?.interact();
        break;
      case 'terminal':
        if (action === 'cancel') this.setMode('walk');
        else this.terminal.handle(action);
        break;
      case 'build':
        if (action === 'cancel') this.setMode('walk');
        else if (action === 'confirm') this.placeDevice();
        else this.build.handle(action);
        break;
    }
  }

  private setMode(mode: Mode): void {
    this.mode = mode;
    // Клавиша, зажатая в прошлом режиме, не должна сразу листать меню или двигать контур.
    this.controls.waitForRelease();
    if (mode === 'terminal') {
      this.terminal.open();
      this.showIntro = false;
    } else {
      this.terminal.close();
    }
    if (mode !== 'build') this.build.stop();
    // Объект рядом с игроком ищется сразу, а не на следующем кадре:
    // иначе E, нажатая сразу после Esc, ни на что бы не попала.
    this.updateInteraction();
  }

  /** Подсветка и подсказка есть только при ходьбе: в меню и при расстановке E занята другим. */
  private updateInteraction(): void {
    if (this.mode === 'walk') this.interaction.update(this.player.x, this.player.y);
    else this.interaction.clear();
  }

  /** Таймер заказа в HUD и в открытом терминале. Перерисовывается, только когда сменилась секунда. */
  private updateOrderTimer(): void {
    const order = this.orders.active;
    const text = order ? `${order.def.name} ${clock(order.left)}` : '';
    if (text === this.orderText) return;
    this.orderText = text;
    this.hud.setOrder(text);
    this.terminal.refresh();
  }

  private updateHint(): void {
    if (this.mode === 'build') {
      const problem = this.build.problem;
      const text = `WASD - ДВИГАТЬ   ${problem ?? 'E - ПОСТАВИТЬ'}   ESC - ОТМЕНА`;
      this.hud.setHint(text, problem ? UI.bad : undefined);
    } else {
      const target = this.interaction.target;
      if (target) this.hud.setHint(`[E] ${target.hint}`);
      else this.hud.setHint(this.showIntro ? INTRO_HINT : '');
    }
  }

  /** Покупка в магазине: сначала выбирается место, деньги списываются только при установке. */
  private startBuild(kind: DeviceKind): void {
    this.setMode('build');
    this.build.start(kind);
  }

  /** Ставит устройство на выбранное место и списывает его цену. */
  private placeDevice(): void {
    if (this.build.problem) return;
    const { kind, area } = this.build;
    this.economy.add(-DEVICES[kind].price);
    this.addDevice(kind, area.tx, area.ty);
    this.setMode('walk');
    // Покупка — самое ценное, что можно потерять, поэтому сохраняемся сразу.
    this.save();
  }

  private addDevice(kind: DeviceKind, tx: number, ty: number): Device {
    const device = new Device(this, kind, tx, ty);
    this.solids.add(device);
    this.grid.occupy({ tx, ty, ...tilesOf(DEVICES[kind].asset) });
    this.economy.devices.push(device);
    return device;
  }

  private setupAutosave(): void {
    this.time.addEvent({ delay: AUTOSAVE_PERIOD, loop: true, callback: () => this.save() });

    // Ещё одно сохранение — когда вкладку закрывают, перезагружают или сворачивают:
    // так не теряется то, что случилось после последнего автосохранения.
    window.addEventListener('pagehide', () => this.save());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.save();
    });
  }

  private save(): void {
    const ok = writeSave({
      money: this.economy.money,
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      devices: this.economy.devices.map(({ kind, tx, ty, elapsed }) => ({
        kind,
        tx,
        ty,
        elapsed: Math.round(elapsed),
      })),
    });
    this.hud.showSaved(ok);
  }

  /** Расставляет по комнате то, что было в сохранении. Деньги из него уже взяты при создании экономики. */
  private restore(save: SaveData): void {
    for (const { kind, tx, ty, elapsed } of save.devices) {
      const def = DEVICES[kind];
      // Сохранение могло остаться от версии игры с другой комнатой или другими лимитами.
      // Устройство, которому теперь нет места, просто не ставится.
      const fits = this.grid.isFree({ tx, ty, ...tilesOf(def.asset) });
      if (!fits || this.economy.count(kind) >= def.max) continue;
      this.addDevice(kind, tx, ty).elapsed = elapsed;
    }

    // По той же причине игрок возвращается на сохранённое место, только если оно свободно.
    const { x, y } = save.player;
    const half = PLAYER_HITBOX / 2;
    const tx = Math.floor((x - half) / TILE);
    const ty = Math.floor((y - half) / TILE);
    const w = Math.ceil((x + half) / TILE) - tx;
    const h = Math.ceil((y + half) / TILE) - ty;
    if (this.grid.isFree({ tx, ty, w, h })) this.player.teleport(x, y);
  }

  private createRoom(): void {
    const data = ROOM_MAP.map((row) => [...row].map((ch) => (ch === '#' ? TILE_WALL : TILE_FLOOR)));
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    if (!tileset) throw new Error('Не найдена текстура тайлсета "tiles"');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('Не удалось создать слой комнаты');

    // Столкновения — обычные AABB из Arcade Physics: игрок против тайлов стен
    // и против неподвижных тел сплошной мебели и устройств.
    layer.setCollision(TILE_WALL);
    this.physics.add.collider(this.player, layer);

    this.solids = this.physics.add.staticGroup();
    for (const def of FURNITURE) {
      const furniture = new Furniture(this, def);
      if (def.solid) this.solids.add(furniture);
      if (def.opens === 'terminal') {
        this.interaction.add({
          bounds: furniture.getBounds(),
          hint: 'ТЕРМИНАЛ',
          interact: () => this.setMode('terminal'),
        });
      }
    }
    this.physics.add.collider(this.player, this.solids);
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
