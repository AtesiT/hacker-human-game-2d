import { DEVICE_KINDS, PAY_PERIOD, type DeviceKind } from '../data/devices';

/**
 * Ключ в localStorage. В нём есть имя игры: на GitHub Pages хранилище общее
 * для всех страниц одного автора, и без имени игры могли бы затереть сохранения друг друга.
 */
const KEY = 'hacker-human-game-2d/save';
/** Версия формата. Сохранение с другой версией не читается — игра начнётся заново. */
const VERSION = 1;

/** Что сохраняется: деньги, место игрока и устройства. Заказ в работе не сохраняется. */
export interface SaveData {
  money: number;
  player: { x: number; y: number };
  devices: { kind: DeviceKind; tx: number; ty: number; elapsed: number }[];
}

/** Записывает сохранение. Возвращает false, если записать не удалось. */
export function writeSave(data: SaveData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...data }));
    return true;
  } catch {
    // Хранилище бывает недоступно (приватный режим, запрет в настройках браузера) или переполнено.
    // Игра при этом должна работать дальше, просто без сохранений.
    return false;
  }
}

/** Читает сохранение. Если его нет или оно испорчено — возвращает null. */
export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/**
 * Сброс прогресса: если в адресе страницы есть `?reset`, стирает сохранение.
 * @returns был ли сброс
 */
export function resetIfRequested(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('reset')) return false;

  try {
    localStorage.removeItem(KEY);
    // Параметр убирается из адреса: иначе следующая перезагрузка страницы
    // снова стёрла бы прогресс, уже новый.
    params.delete('reset');
    const query = params.toString();
    const url = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    window.history.replaceState(null, '', url);
  } catch {
    // Нет доступа к хранилищу или к адресной строке — стирать нечего или незачем.
  }
  return true;
}

/**
 * Проверяет прочитанные данные: в localStorage может лежать что угодно —
 * например, запись от старой версии игры. Подходят ли устройства и игрок
 * к самой комнате, здесь не проверяется: это делает RoomScene при восстановлении.
 */
function parse(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { version, money, player, devices } = raw as Record<string, unknown>;
  if (version !== VERSION || !isAmount(money) || !Array.isArray(devices)) return null;
  if (typeof player !== 'object' || player === null) return null;
  const { x, y } = player as Record<string, unknown>;
  if (!isAmount(x) || !isAmount(y)) return null;

  const restored: SaveData['devices'] = [];
  for (const item of devices as Record<string, unknown>[]) {
    if (typeof item !== 'object' || item === null) continue;
    const { kind, tx, ty, elapsed } = item;
    if (!DEVICE_KINDS.includes(kind as DeviceKind)) continue;
    if (!Number.isInteger(tx) || !Number.isInteger(ty) || !isAmount(elapsed)) continue;
    restored.push({
      kind: kind as DeviceKind,
      tx: tx as number,
      ty: ty as number,
      // Отсчёт до выплаты не может быть длиннее самого периода.
      elapsed: Math.min(elapsed, PAY_PERIOD - 1),
    });
  }
  return { money: Math.floor(money), player: { x, y }, devices: restored };
}

/** Конечное неотрицательное число. */
function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
