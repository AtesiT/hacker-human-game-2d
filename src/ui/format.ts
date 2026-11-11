/** Сумма как в интерфейсе: 1000 → «$1000». */
export function money(amount: number): string {
  return `$${amount}`;
}

/** Остаток времени: 23400 мс → «0:24». Секунды округляются вверх, чтобы «0:00» не висело на экране. */
export function clock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Изменение баланса: 5 → «+$5», -2 → «-$2».
 * Минус — обычный дефис: настоящего знака минуса в пиксельном шрифте нет.
 */
export function signedMoney(amount: number): string {
  return `${amount < 0 ? '-' : '+'}${money(Math.abs(amount))}`;
}
