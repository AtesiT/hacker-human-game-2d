import Phaser from 'phaser';

const { KeyCodes } = Phaser.Input.Keyboard;

type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Клавиши направлений: WASD и стрелки.
 * Phaser различает клавиши по коду, а не по букве, поэтому WASD работает и в русской раскладке.
 */
const DIRECTION_KEYS: Record<Direction, number[]> = {
  up: [KeyCodes.W, KeyCodes.UP],
  down: [KeyCodes.S, KeyCodes.DOWN],
  left: [KeyCodes.A, KeyCodes.LEFT],
  right: [KeyCodes.D, KeyCodes.RIGHT],
};

/** Клавиатурное управление. */
export class Controls {
  private readonly held: Record<Direction, Phaser.Input.Keyboard.Key[]>;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Клавиатура недоступна');

    // addKey заодно отключает стандартную реакцию браузера на клавишу:
    // стрелки перестают прокручивать страницу.
    const keys = (dir: Direction): Phaser.Input.Keyboard.Key[] =>
      DIRECTION_KEYS[dir].map((code) => keyboard.addKey(code));
    this.held = { up: keys('up'), down: keys('down'), left: keys('left'), right: keys('right') };
  }

  /** Направление движения по зажатым клавишам: −1, 0 или 1 по каждой оси. */
  direction(): { x: number; y: number } {
    const on = (dir: Direction): number => (this.held[dir].some((key) => key.isDown) ? 1 : 0);
    // Противоположные клавиши гасят друг друга.
    return { x: on('right') - on('left'), y: on('down') - on('up') };
  }
}
