import type { AssetKey } from './assets';

/** Вид устройства из магазина. */
export type DeviceKind = 'rack' | 'farm';

export interface DeviceDef {
  /** Ассет устройства. Его размер задаёт и место, которое устройство занимает на полу. */
  asset: AssetKey;
  /** Название в магазине. */
  name: string;
  price: number;
  /** Доход и расход за один период выплаты, $. */
  income: number;
  expense: number;
  /** Сколько таких устройств можно поставить в комнате. */
  max: number;
}

/** Период выплаты: раз в минуту каждое устройство приносит доход (и забирает расход). */
export const PAY_PERIOD = 60_000;

export const DEVICES: Record<DeviceKind, DeviceDef> = {
  rack: { asset: 'rack', name: 'СЕРВЕРНАЯ СТОЙКА', price: 500, income: 5, expense: 0, max: 4 },
  farm: { asset: 'farm', name: 'МАЙНИНГ-ФЕРМА', price: 2000, income: 15, expense: 2, max: 2 },
};

export const DEVICE_KINDS = Object.keys(DEVICES) as DeviceKind[];
