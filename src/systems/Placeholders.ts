import Phaser from 'phaser';
import { ASSETS, type AssetDef, type AssetKey } from '../data/assets';
import { ZOOM } from '../data/config';
import { DB32, css, isLight } from '../data/palette';
import { textStyle } from '../ui/theme';

/**
 * Настоящие спрайты из src/assets/sprites/: путь к файлу → его URL.
 * Список собирает Vite, поэтому достаточно положить в папку <ключ>.png —
 * он попадёт сюда сам. Пока папка пуста, объект пустой и рисуются заглушки.
 */
const SPRITE_URLS = import.meta.glob<string>('../assets/sprites/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Ключи ассетов, для которых спрайта нет и нарисована заглушка. */
const placeholders = new Set<AssetKey>();

const assetKeys = Object.keys(ASSETS) as AssetKey[];

/** Вызывается в preload: ставит в очередь загрузки все найденные спрайты. */
export function loadSprites(scene: Phaser.Scene): void {
  for (const key of assetKeys) {
    const url = SPRITE_URLS[`../assets/sprites/${key}.png`];
    if (!url) continue;
    const { frameW, frameH } = ASSETS[key];
    scene.load.spritesheet(key, url, { frameWidth: frameW, frameHeight: frameH });
  }
}

/** Вызывается в create: рисует заглушку для каждого ассета, у которого нет спрайта. */
export function createPlaceholders(scene: Phaser.Scene): void {
  for (const key of assetKeys) {
    if (scene.textures.exists(key)) continue;

    const def = ASSETS[key];
    const cols = def.cols ?? 1;
    const rows = def.rows ?? 1;
    const texture = scene.textures.createCanvas(key, def.frameW * cols, def.frameH * rows);
    if (!texture) continue;

    if (key === 'tiles') paintTiles(texture.context, def);
    else if (key === 'player') paintPlayer(texture.context, def);
    else paintBox(texture.context, 0, 0, def.frameW, def.frameH, def.colors[0], def.colors[1]);

    // Кадры нумеруются слева направо и сверху вниз — как в обычном spritesheet,
    // поэтому анимации и тайлмап не заметят подмены заглушки на спрайт.
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols) * def.frameW;
      const y = Math.floor(i / cols) * def.frameH;
      texture.add(i, 0, x, y, def.frameW, def.frameH);
    }
    texture.refresh();
    placeholders.add(key);
  }
}

/**
 * Подпись поверх заглушки. Для настоящего спрайта ничего не делает.
 *
 * Текст задаётся в экранных пикселях: масштаб 1/ZOOM компенсирует зум камеры,
 * и шрифт 8 px остаётся чётким, хотя объект лежит в «увеличенном» мире.
 *
 * @param follow подпись ездит за объектом (нужно только тому, кто двигается)
 */
export function addLabel(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Image,
  key: AssetKey,
  follow = false,
): void {
  const { label, colors } = ASSETS[key];
  if (!label || !placeholders.has(key)) return;

  const color = isLight(colors[0]) ? DB32.valhalla : DB32.white;
  const text = scene.add
    .text(target.x, target.y, label, textStyle(8, color))
    .setOrigin(0.5)
    .setScale(1 / ZOOM)
    .setDepth(target.depth + 1);

  // Физика сдвигает объекты в конце кадра (POST_UPDATE), уже после update сцены.
  // Если переставлять подпись раньше, она отставала бы от объекта на кадр.
  const sync = (): void => void text.setPosition(target.x, target.y);
  if (follow) scene.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);

  target.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync);
    text.destroy();
  });
}

type Ctx = CanvasRenderingContext2D;

/** Прямоугольник с обводкой в один пиксель. */
function paintBox(ctx: Ctx, x: number, y: number, w: number, h: number, fill: number, edge: number): void {
  ctx.fillStyle = css(edge);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = css(fill);
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}

/**
 * Лист игрока: ряд — направление взгляда, столбец — кадр шага.
 * Светлая полоса показывает, куда игрок смотрит, а два тёмных «башмака»
 * по бокам сдвигаются от кадра к кадру — так видно, что анимация идёт.
 */
function paintPlayer(ctx: Ctx, def: AssetDef): void {
  const [fill, edge, face] = def.colors;
  const { frameW: w, frameH: h } = def;
  const swing = [0, 2, 0, -2]; // сдвиг «башмаков» в каждом из четырёх кадров

  // Порядок рядов должен совпадать с FACINGS в entities/Player.ts.
  (['down', 'left', 'right', 'up'] as const).forEach((facing, row) => {
    swing.forEach((shift, col) => {
      const x = col * w;
      const y = row * h;
      paintBox(ctx, x, y, w, h, fill, edge);

      ctx.fillStyle = css(face);
      if (facing === 'down') ctx.fillRect(x + 4, y + h - 7, 8, 4);
      else if (facing === 'up') ctx.fillRect(x + 4, y + 3, 8, 4);
      else if (facing === 'left') ctx.fillRect(x + 2, y + 8, 4, 8);
      else ctx.fillRect(x + w - 6, y + 8, 4, 8);

      ctx.fillStyle = css(edge);
      if (facing === 'down' || facing === 'up') {
        ctx.fillRect(x + 2, y + 10 - shift, 3, 4);
        ctx.fillRect(x + w - 5, y + 10 + shift, 3, 4);
      } else {
        ctx.fillRect(x + 6 - shift, y + 2, 4, 3);
        ctx.fillRect(x + 6 + shift, y + h - 5, 4, 3);
      }
    });
  });
}

/** Тайлсет: у каждого тайла линия справа и снизу, чтобы в комнате была видна сетка. */
function paintTiles(ctx: Ctx, def: AssetDef): void {
  const count = def.cols ?? 1;
  for (let i = 0; i < count; i++) {
    const x = i * def.frameW;
    ctx.fillStyle = css(def.colors[i * 2 + 1]);
    ctx.fillRect(x, 0, def.frameW, def.frameH);
    ctx.fillStyle = css(def.colors[i * 2]);
    ctx.fillRect(x, 0, def.frameW - 1, def.frameH - 1);
  }
}
