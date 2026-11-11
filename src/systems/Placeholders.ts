import Phaser from 'phaser';
import { ASSETS, type AssetDef, type AssetKey } from '../data/assets';
import { DEPTH, ZOOM } from '../data/config';
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
 */
export function addLabel(scene: Phaser.Scene, target: Phaser.GameObjects.Image, key: AssetKey): void {
  const { label, colors } = ASSETS[key];
  if (!label || !placeholders.has(key)) return;

  const color = isLight(colors[0]) ? DB32.valhalla : DB32.white;
  const text = scene.add
    .text(target.x, target.y, label, textStyle(8, color))
    .setOrigin(0.5)
    .setScale(1 / ZOOM)
    .setDepth(DEPTH.label);

  target.once(Phaser.GameObjects.Events.DESTROY, () => text.destroy());
}

type Ctx = CanvasRenderingContext2D;

/** Прямоугольник с обводкой в один пиксель. */
function paintBox(ctx: Ctx, x: number, y: number, w: number, h: number, fill: number, edge: number): void {
  ctx.fillStyle = css(edge);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = css(fill);
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
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
