/** Шаблон заказа на взлом. */
export interface OrderDef {
  name: string;
  /** Сколько длится взлом, мс. */
  duration: number;
  /** Вероятность успеха: от 0 до 1. */
  chance: number;
  /** Награда за успех — случайная сумма из этого диапазона, $. */
  rewardMin: number;
  rewardMax: number;
}

// Сейчас шаблоны отличаются только названием. Но параметры хранятся в каждом из них,
// поэтому заказы можно сделать разными, поменяв одни лишь данные.
const BASE = { duration: 30_000, chance: 0.7, rewardMin: 100, rewardMax: 300 };

export const ORDERS: OrderDef[] = [
  { name: 'САЙТ ЗАКУСОЧНОЙ', ...BASE },
  { name: 'WI-FI БИБЛИОТЕКИ', ...BASE },
  { name: 'СЕРВЕР МЭРИИ', ...BASE },
];
