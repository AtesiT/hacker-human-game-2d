import Phaser from 'phaser';
import { DEPTH, INTERACT_RADIUS } from '../data/config';
import { DB32 } from '../data/palette';

/** Объект, с которым можно взаимодействовать клавишей E. */
export interface Interactable {
  /** Границы объекта в мире: от них считается расстояние до игрока. */
  bounds: Phaser.Geom.Rectangle;
  /** Что произойдёт по E — текст для подсказки. */
  hint: string;
  interact(): void;
}

/** Находит объект рядом с игроком и обводит его рамкой. */
export class Interaction {
  /** Объект, с которым сейчас можно взаимодействовать. */
  target: Interactable | null = null;

  private readonly items: Interactable[] = [];
  private readonly outline: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.outline = scene.add.graphics().setDepth(DEPTH.highlight).setVisible(false);
    // Рамка мягко мигает, чтобы её было видно на любом фоне.
    scene.tweens.add({ targets: this.outline, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
  }

  add(item: Interactable): void {
    this.items.push(item);
  }

  /** Выбирает ближайший объект в радиусе от точки (x, y). Вызывается каждый кадр. */
  update(x: number, y: number): void {
    let nearest: Interactable | null = null;
    let nearestDistance = INTERACT_RADIUS;
    for (const item of this.items) {
      const distance = distanceToRect(x, y, item.bounds);
      if (distance <= nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    }
    this.setTarget(nearest);
  }

  /** Снимает подсветку — например, пока открыто меню. */
  clear(): void {
    this.setTarget(null);
  }

  private setTarget(target: Interactable | null): void {
    if (target === this.target) return;
    this.target = target;

    this.outline.clear().setVisible(target !== null);
    if (!target) return;

    // Рамка в один пиксель вплотную снаружи объекта. Она собрана из залитых полосок,
    // а не нарисована линией: линия легла бы между пикселями и вышла неровной.
    const { x, y, width, height } = target.bounds;
    this.outline.fillStyle(DB32.goldenFizz);
    this.outline.fillRect(x - 1, y - 1, width + 2, 1);
    this.outline.fillRect(x - 1, y + height, width + 2, 1);
    this.outline.fillRect(x - 1, y, 1, height);
    this.outline.fillRect(x + width, y, 1, height);
  }
}

/** Расстояние от точки до ближайшей точки прямоугольника (0, если точка внутри). */
function distanceToRect(x: number, y: number, rect: Phaser.Geom.Rectangle): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}
