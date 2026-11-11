import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../data/config';
import { DB32 } from '../data/palette';
import { money } from './format';
import { TEXT_BACKING, UI, UI_DEPTH, setLabel, textStyle } from './theme';

/** Отступ элементов от края экрана, px. */
const MARGIN = 16;
/** Отступ текста от края его подложки, px. */
const PADDING = { x: 8, y: 6 };
/** Высота строки подсказки у нижнего края экрана вместе с промежутком над ней, px. */
const HINT_ROW = 36;

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
  private readonly focus: Phaser.GameObjects.Text;
  /** Какие строки столбика уведомлений сейчас заняты. */
  private readonly noteRows: boolean[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.money = this.label(MARGIN, MARGIN, UI.accent);
    this.hint = this.label(VIEW_W / 2, VIEW_H - MARGIN, DB32.white).setOrigin(0.5, 1).setVisible(false);
    this.order = this.label(VIEW_W - MARGIN, MARGIN, DB32.white).setOrigin(1, 0).setVisible(false);
    // Отметка о сохранении стоит над строкой подсказки, а не в самом углу:
    // длинная подсказка занимает почти всю ширину экрана и легла бы на отметку.
    this.saved = scene.add
      .text(MARGIN, VIEW_H - MARGIN - HINT_ROW, '', {
        ...textStyle(8, UI.text),
        backgroundColor: TEXT_BACKING,
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 1)
      .setDepth(UI_DEPTH.hud)
      .setAlpha(0);
    // Просьба о клике — над головой игрока: он обычно стоит в центре экрана.
    this.focus = this.label(VIEW_W / 2, VIEW_H / 2 - 72, UI.accent)
      .setOrigin(0.5)
      .setText('КЛИКНИТЕ ПО ИГРЕ, ЧТОБЫ УПРАВЛЯТЬ')
      .setVisible(false);
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
    this.order.setVisible(text !== '');
    if (text !== '') this.order.setText(text);
  }

  /** Мелкая отметка слева внизу: игра сохранилась (или сохранить не вышло). Гаснет сама. */
  showSaved(ok: boolean): void {
    setLabel(this.saved, ok ? 'СОХРАНЕНО' : 'НЕ УДАЛОСЬ СОХРАНИТЬ', ok ? UI.text : UI.bad);
    this.scene.tweens.killTweensOf(this.saved);
    this.saved.setAlpha(1);
    this.scene.tweens.add({ targets: this.saved, alpha: 0, delay: 1200, duration: 400 });
  }

  /** Просьба кликнуть по игре — пока у страницы нет фокуса, клавиши до игры не доходят. */
  setFocusHint(visible: boolean): void {
    this.focus.setVisible(visible);
  }

  /** Подсказка внизу экрана. Пустая строка её убирает. */
  setHint(text: string, color: number = DB32.white): void {
    // Метод вызывается каждый кадр, но надпись перерисовывается, только когда она изменилась
    // (см. setLabel). Скрытую подсказку не трогаем вовсе: чаще всего она вернётся с тем же текстом.
    this.hint.setVisible(text !== '');
    if (text !== '') setLabel(this.hint, text, color);
  }

  /** Текст на тёмной подложке — так он читается поверх любого места комнаты. */
  private label(x: number, y: number, color: number): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, '', { ...textStyle(16, color), backgroundColor: TEXT_BACKING, padding: PADDING })
      .setDepth(UI_DEPTH.hud);
  }
}
