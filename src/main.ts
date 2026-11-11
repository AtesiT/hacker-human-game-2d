import Phaser from 'phaser';
import '@fontsource/press-start-2p/latin.css';
import '@fontsource/press-start-2p/cyrillic.css';
import './style.css';
import { VIEW_H, VIEW_W } from './data/config';
import { DB32, css } from './data/palette';
import { BootScene } from './scenes/BootScene';
import { RoomScene } from './scenes/RoomScene';
import { FONT_FAMILY } from './ui/theme';

/**
 * Подгоняет канвас под окно браузера.
 *
 * Масштаб целочисленный и считается в физических пикселях экрана, а не в CSS-пикселях:
 * при масштабе системы 125–150 % или зуме страницы CSS-пиксель — это дробное число
 * физических, и «×2 в CSS» дало бы пиксели арта разной ширины. Поэтому сначала
 * выбирается размер в физических пикселях, а в CSS он переводится делением на devicePixelRatio.
 */
function fitCanvas(game: Phaser.Game): void {
  const canvas = game.canvas;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const availW = Math.floor(window.innerWidth * dpr);
  const availH = Math.floor(window.innerHeight * dpr);

  const fit = Math.min(availW / VIEW_W, availH / VIEW_H);
  const whole = Math.floor(fit);
  // Если окно меньше 960×540, целого масштаба нет. Тогда канвас ужимается целиком,
  // чтобы ничего не обрезалось, и сглаживается: дробное уменьшение «без сглаживания»
  // просто выбрасывает часть пикселей, и текст перестаёт читаться.
  const scale = whole >= 1 ? whole : fit;

  const w = Math.round(VIEW_W * scale);
  const h = Math.round(VIEW_H * scale);
  const style = canvas.style;
  style.width = `${w / dpr}px`;
  style.height = `${h / dpr}px`;
  style.left = `${Math.floor((availW - w) / 2) / dpr}px`;
  style.top = `${Math.floor((availH - h) / 2) / dpr}px`;
  style.imageRendering = whole >= 1 ? 'pixelated' : 'auto';

  // Phaser запоминает положение канваса на странице — пусть пересчитает.
  game.scale.refresh();
}

async function start(): Promise<void> {
  // Phaser рисует текст на канвасе один раз и не перерисовывает, когда шрифт догрузится.
  // Поэтому шрифт нужно дождаться до создания игры. Пример текста обязателен:
  // по нему браузер понимает, что нужны и латиница, и кириллица.
  try {
    await document.fonts.load(`8px ${FONT_FAMILY}`, 'AZaz09 АЯая');
  } catch {
    // Шрифт не загрузился — игра запустится с системным.
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: css(DB32.black),
    // Отключает сглаживание текстур и привязывает спрайты и камеру к целым пикселям.
    pixelArt: true,
    // Масштабированием под окно занимается fitCanvas(), а не Phaser.
    scale: { mode: Phaser.Scale.NONE },
    // Звука в игре нет: без этой настройки Phaser создал бы AudioContext,
    // и браузер ругался бы в консоли на звук без действия пользователя.
    audio: { noAudio: true },
    // Управление только с клавиатуры.
    input: { mouse: false, touch: false, gamepad: false },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
    scene: [BootScene, RoomScene],
  });

  const fit = (): void => fitCanvas(game);
  window.addEventListener('resize', fit);
  game.events.once(Phaser.Core.Events.READY, fit);
  fit();

  // Только в режиме разработки: доступ к игре из консоли браузера для отладки.
  if (import.meta.env.DEV) {
    (window as unknown as { __game: Phaser.Game }).__game = game;
  }
}

void start();
