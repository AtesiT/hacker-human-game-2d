import Phaser from 'phaser';

const { KeyCodes } = Phaser.Input.Keyboard;

type Direction = 'up' | 'down' | 'left' | 'right';

/** Действие игрока, не привязанное к конкретной клавише. */
export type Action = Direction | 'confirm' | 'cancel';

/**
 * Какие клавиши вызывают каждое действие.
 * Phaser различает клавиши по коду, а не по букве, поэтому WASD и E работают и в русской раскладке.
 */
const KEYS: Record<Action, number[]> = {
  up: [KeyCodes.W, KeyCodes.UP],
  down: [KeyCodes.S, KeyCodes.DOWN],
  left: [KeyCodes.A, KeyCodes.LEFT],
  right: [KeyCodes.D, KeyCodes.RIGHT],
  confirm: [KeyCodes.E, KeyCodes.ENTER],
  cancel: [KeyCodes.ESC],
};

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/** Автоповтор зажатого направления: пауза перед первым повтором и интервал между следующими, мс. */
const REPEAT_DELAY = 300;
const REPEAT_EVERY = 90;

/**
 * Клавиатурное управление. Работает двумя способами:
 * - direction() — опрос зажатых клавиш, для плавной ходьбы;
 * - onAction — событие на каждое нажатие, для меню и расстановки объектов.
 */
export class Controls {
  private readonly keys: Record<Action, Phaser.Input.Keyboard.Key[]>;
  /** Сколько миллисекунд осталось до следующего автоповтора по каждому направлению. */
  private readonly repeatIn: Record<Direction, number> = {
    up: REPEAT_DELAY,
    down: REPEAT_DELAY,
    left: REPEAT_DELAY,
    right: REPEAT_DELAY,
  };

  constructor(
    scene: Phaser.Scene,
    private readonly onAction: (action: Action) => void,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Клавиатура недоступна');

    const bind = (action: Action): Phaser.Input.Keyboard.Key[] =>
      KEYS[action].map((code) => {
        // addKey заодно отключает стандартную реакцию браузера на клавишу:
        // стрелки перестают прокручивать страницу.
        const key = keyboard.addKey(code);
        // Системный автоповтор зажатой клавиши Phaser отсекает сам. Но если за один кадр
        // приходит три события клавиатуры и больше, он обрабатывает уже разобранные ещё раз,
        // и короткое нажатие срабатывает дважды. Повтор выдаёт время события: оно не новее
        // последнего обработанного.
        let handledAt = -1;
        key.on(Phaser.Input.Keyboard.Events.DOWN, (_key: unknown, event: KeyboardEvent) => {
          if (event.timeStamp <= handledAt) return;
          handledAt = event.timeStamp;
          this.onAction(action);
        });
        return key;
      });

    this.keys = {
      up: bind('up'),
      down: bind('down'),
      left: bind('left'),
      right: bind('right'),
      confirm: bind('confirm'),
      cancel: bind('cancel'),
    };
  }

  /** Направление движения по зажатым клавишам: −1, 0 или 1 по каждой оси. */
  direction(): { x: number; y: number } {
    const on = (dir: Direction): number => (this.isDown(dir) ? 1 : 0);
    // Противоположные клавиши гасят друг друга.
    return { x: on('right') - on('left'), y: on('down') - on('up') };
  }

  /**
   * Свой автоповтор направлений: если клавишу держать, действие повторяется.
   * Системный автоповтор не используется, потому что его скорость у всех разная.
   */
  update(delta: number): void {
    for (const dir of DIRECTIONS) {
      if (!this.isDown(dir)) {
        this.repeatIn[dir] = REPEAT_DELAY;
        continue;
      }
      this.repeatIn[dir] -= delta;
      if (this.repeatIn[dir] <= 0) {
        this.repeatIn[dir] += REPEAT_EVERY;
        this.onAction(dir);
      }
    }
  }

  /**
   * Отключает автоповтор уже зажатых направлений, пока их не отпустят.
   * Нужно при открытии меню: клавиша, зажатая при ходьбе, не должна тут же его листать.
   */
  waitForRelease(): void {
    for (const dir of DIRECTIONS) this.repeatIn[dir] = Infinity;
  }

  private isDown(action: Action): boolean {
    return this.keys[action].some((key) => key.isDown);
  }
}
