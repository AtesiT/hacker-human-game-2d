/** Деньги игрока. О каждом изменении баланса сообщает через onChange. */
export class Economy {
  /**
   * @param balance стартовый баланс
   * @param onChange вызывается после каждого изменения: новый баланс и на сколько он изменился
   */
  constructor(
    private balance: number,
    private readonly onChange: (money: number, delta: number) => void,
  ) {}

  get money(): number {
    return this.balance;
  }

  canAfford(price: number): boolean {
    return this.balance >= price;
  }

  /** Меняет баланс: положительная сумма — доход, отрицательная — расход. */
  add(amount: number): void {
    this.balance += amount;
    this.onChange(this.balance, amount);
  }
}
