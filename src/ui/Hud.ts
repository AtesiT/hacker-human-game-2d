import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../data/config';
import { DB32, css } from '../data/palette';
import { money } from './format';
import { TEXT_BACKING, UI, UI_DEPTH, textStyle } from './theme';

/** Отступ элементов от края экрана, px. */
const MARGIN = 16;
/** Отступ текста от края его подложки, px. */
const PADDING = { x: 8, y: 6 };

// Уведомления встают в столбик под счётчиком денег.
const NOTES_TOP = MARGIN + 36;
const NOTE_STEP = 32;
/** Сколько уведомление висит на месте и сколько потом исчезает, мс. */
const NOTE_HOLD = 1400;
const NOTE_FADE = 500;

/** Постоянные элементы интерфейса поверх комнаты: деньги, уведомления, таймер заказа, подсказки. */
export class Hud {
  private readonly money: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly order: Phaser.GameObjects.Text;
  private readonly saved: Phaser.GameObjects.Text;
  /** Какие строки столбика уведомлений сейчас заняты. */
  private readonly noteRows: boolean[] = [];
  /** Что сейчас показано в подсказке: по этому ключу видно, изменилась ли она. */
  private hintKey = '';

  constructor(private readonly scene: Phaser.Scene) {
    this.money = this.label(MARGIN, MARGIN, UI.accent);
    this.hint = this.label(VIEW_W / 2, VIEW_H - MARGIN, DB32.white).setOrigin(0.5, 1).setVisible(false);
    this.order = this.label(VIEW_W - MARGIN, MARGIN, DB32.white).setOrigin(1, 0).setVisible(false);
    this.saved = scene.add
      .text(MARGIN, VIEW_H - MARGIN, '', { ...textStyle(8, UI.text), backgroundColor: TEXT_BACKING, padding: { x: 6, y: 4 } })
      .setOrigin(0, 1)
      .setDepth(UI_DEPTH.hud)
      .setAlpha(0);
  }

  setMoney(amount: number): void {
    this.money.setText(money(amount));
  }

  /** Короткое уведомление под счётчиком денег: «+$5», «-$2». Исчезает само. */
  notify(text: string, color: number): void {
    // Каждое уведомление занимает первую свободную строку,
    // поэтому несколько одновременных не накладываются друг на друга.
    let row = this.noteRows.indexOf(false);
    if (row === -1) row = this.noteRows.length;
    this.noteRows[row] = true;

    const note = this.label(MARGIN, NOTES_TOP + row * NOTE_STEP, color).setText(text);
    this.scene.tweens.add({
      targets: note,
      alpha: 0,
      y: note.y - 8,
      delay: NOTE_HOLD,
      duration: NOTE_FADE,
      onComplete: () => {
        note.destroy();
        this.noteRows[row] = false;
      },
    });
  }

  /** Заказ в работе и его таймер — в правом верхнем углу. Пустая строка их убирает. */
  setOrder(text: string): void {
    this.order.setText(text).setVisible(text !== '');
  }

  /** Мелкая отметка в углу: игра сохранилась (или сохранить не вышло). Гаснет сама. */
  showSaved(ok: boolean): void {
    this.saved.setText(ok ? 'СОХРАНЕНО' : 'НЕ УДАЛОСЬ СОХРАНИТЬ').setColor(css(ok ? UI.text : UI.bad));
    this.scene.tweens.killTweensOf(this.saved);
    this.saved.setAlpha(1);
    this.scene.tweens.add({ targets: this.saved, alpha: 0, delay: 1200, duration: 400 });
  }

  /** Подсказка внизу экрана. Пустая строка её убирает. */
  setHint(text: string, color: number = DB32.white): void {
    // Метод вызывается каждый кадр, а перерисовка текста стоит дорого,
    // поэтому текст и цвет меняются, только когда они действительно другие.
    const key = `${color}:${text}`;
    if (key === this.hintKey) return;
    this.hintKey = key;
    this.hint.setColor(css(color)).setText(text).setVisible(text !== '');
  }

  /** Текст на тёмной подложке — так он читается поверх любого места комнаты. */
  private label(x: number, y: number, color: number): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, '', { ...textStyle(16, color), backgroundColor: TEXT_BACKING, padding: PADDING })
      .setDepth(UI_DEPTH.hud);
  }
}
