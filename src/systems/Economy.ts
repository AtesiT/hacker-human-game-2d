import { DEVICES, PAY_PERIOD, type DeviceKind } from '../data/devices';
import type { Device } from '../entities/Device';

/** Деньги игрока и устройства, которые их приносят. */
export class Economy {
  /** Устройства, поставленные в комнате. */
  readonly devices: Device[] = [];

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

  /** Сколько устройств этого вида уже стоит. */
  count(kind: DeviceKind): number {
    return this.devices.filter((device) => device.kind === kind).length;
  }

  /**
   * Выплаты. У каждого устройства свой отсчёт от момента установки.
   * Время идёт только в открытой вкладке: в свёрнутой браузер не вызывает обновление игры,
   * так что дохода «пока вас не было» нет.
   */
  update(delta: number): void {
    for (const device of this.devices) {
      device.elapsed += delta;
      if (device.elapsed < PAY_PERIOD) continue;
      device.elapsed -= PAY_PERIOD;

      const { income, expense } = DEVICES[device.kind];
      this.add(income);
      if (expense > 0) this.add(-expense);
    }
  }
}
