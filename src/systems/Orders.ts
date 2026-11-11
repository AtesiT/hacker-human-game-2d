import Phaser from 'phaser';
import type { OrderDef } from '../data/orders';

/**
 * Заказы на взлом. Мини-игры нет: взятый заказ выполняется сам, в фоне,
 * а когда время выходит, жребий решает — успех или провал.
 */
export class Orders {
  /** Заказ, который сейчас выполняется, и сколько ему осталось, мс. Одновременно — только один. */
  active: { def: OrderDef; left: number } | null = null;

  /** @param onDone вызывается, когда заказ закончился: награда в долларах или 0 при провале */
  constructor(private readonly onDone: (reward: number) => void) {}

  /** Берёт заказ в работу. Пока выполняется другой, ничего не делает. */
  accept(def: OrderDef): void {
    if (!this.active) this.active = { def, left: def.duration };
  }

  update(delta: number): void {
    if (!this.active) return;
    this.active.left -= delta;
    if (this.active.left > 0) return;

    const { chance, rewardMin, rewardMax } = this.active.def;
    this.active = null;
    const success = Math.random() < chance;
    this.onDone(success ? Phaser.Math.Between(rewardMin, rewardMax) : 0);
  }
}
