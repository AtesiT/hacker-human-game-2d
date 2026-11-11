/** Сумма как в интерфейсе: 1000 → «$1000». */
export function money(amount: number): string {
  return `$${amount}`;
}

/**
 * Изменение баланса: 5 → «+$5», -2 → «-$2».
 * Минус — обычный дефис: настоящего знака минуса в пиксельном шрифте нет.
 */
export function signedMoney(amount: number): string {
  return `${amount < 0 ? '-' : '+'}${money(Math.abs(amount))}`;
}
