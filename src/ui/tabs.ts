import { DEVICES, DEVICE_KINDS, type DeviceKind } from '../data/devices';
import { ORDERS } from '../data/orders';
import type { Economy } from '../systems/Economy';
import type { Orders } from '../systems/Orders';
import { clock, money } from './format';
import type { TerminalTab } from './Terminal';

/**
 * Содержимое вкладок терминала. Сам терминал умеет только показывать список,
 * а что в нём написано и что происходит по E — описано здесь.
 */

/** Магазин: по строке на каждый вид устройства. */
export function shopTab(economy: Economy, onBuy: (kind: DeviceKind) => void): TerminalTab {
  return {
    title: 'МАГАЗИН',
    verb: 'КУПИТЬ',
    rows: () =>
      DEVICE_KINDS.map((kind) => {
        const def = DEVICES[kind];
        const owned = economy.count(kind);

        let blocked: string | undefined;
        if (owned >= def.max) blocked = `КУПЛЕНО ${owned} ИЗ ${def.max} - БОЛЬШЕ НЕЛЬЗЯ`;
        else if (!economy.canAfford(def.price)) blocked = `НЕ ХВАТАЕТ ${money(def.price - economy.money)}`;

        const expense = def.expense > 0 ? `, РАСХОД ${money(def.expense)}/МИН` : '';
        return {
          title: def.name,
          value: money(def.price),
          detail: `ДОХОД ${money(def.income)}/МИН${expense} · КУПЛЕНО ${owned} ИЗ ${def.max}`,
          blocked,
          run: () => onBuy(kind),
        };
      }),
  };
}

/** Заказы: по строке на каждый шаблон. Взять можно один заказ за раз. */
export function ordersTab(orders: Orders): TerminalTab {
  return {
    title: 'ЗАКАЗЫ',
    verb: 'ВЗЯТЬ',
    rows: () =>
      ORDERS.map((def) => {
        const active = orders.active;
        const running = active?.def === def;
        return {
          title: def.name,
          value: `${money(def.rewardMin)}-${def.rewardMax}`,
          detail: running
            ? `ВЫПОЛНЯЕТСЯ - ОСТАЛОСЬ ${clock(active.left)}`
            : `${def.duration / 1000} СЕК · ШАНС ${Math.round(def.chance * 100)}%`,
          blocked: active && !running ? 'СНАЧАЛА ЗАКОНЧИТЕ ТЕКУЩИЙ ЗАКАЗ' : undefined,
          run: () => orders.accept(def),
        };
      }),
  };
}
