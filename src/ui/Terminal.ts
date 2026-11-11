import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../data/config';
import { DB32 } from '../data/palette';
import type { Action } from '../systems/Controls';
import { UI, UI_DEPTH, setLabel, textStyle } from './theme';

/** Строка списка в терминале. */
export interface TerminalRow {
  title: string;
  /** Короткое значение справа: цена или награда. */
  value: string;
  /** Пояснение мелким шрифтом под названием. */
  detail: string;
  /** Причина, по которой строку сейчас нельзя выбрать. Если её нет — выбрать можно. */
  blocked?: string;
  /** Что происходит по клавише E. */
  run(): void;
}

/** Вкладка терминала. Сам терминал не знает, что в ней: строки ему отдаёт игра. */
export interface TerminalTab {
  title: string;
  /** Что делает клавиша E на этой вкладке — для подсказки внизу окна. */
  verb: string;
  /** Вызывается при каждой перерисовке, поэтому строки всегда актуальны. */
  rows(): TerminalRow[];
}

// Размеры окна, px канваса. Всё кратно 8 — под сетку шрифта.
const W = 640;
const H = 352;
const X = (VIEW_W - W) / 2;
const Y = (VIEW_H - H) / 2;
const BORDER = 4;
const PAD = 24;
const TAB_PADDING = { x: 8, y: 6 };
const ROWS_TOP = Y + 72;
const ROW_H = 56;
const MAX_ROWS = 4;

interface RowView {
  bar: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  detail: Phaser.GameObjects.Text;
}

/** Окно терминала: вкладки, в каждой — список строк с курсором. Управляется с клавиатуры. */
export class Terminal {
  private readonly root: Phaser.GameObjects.Container;
  private readonly tabsRoot: Phaser.GameObjects.Container;
  /** Плашка под названием активной вкладки. */
  private readonly tabPlate: Phaser.GameObjects.Rectangle;
  private readonly rowViews: RowView[] = [];
  private readonly empty: Phaser.GameObjects.Text;
  private readonly footer: Phaser.GameObjects.Text;

  private tabs: TerminalTab[] = [];
  private tabTitles: Phaser.GameObjects.Text[] = [];
  private rows: TerminalRow[] = [];
  private tabIndex = 0;
  private cursor = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const add = scene.add;

    // Затемнение комнаты: видно, что игра под окном не реагирует на клавиши.
    const backdrop = add.rectangle(0, 0, VIEW_W, VIEW_H, DB32.black, 0.6).setOrigin(0);
    const frame = add.rectangle(X, Y, W, H, UI.text).setOrigin(0);
    const panel = add
      .rectangle(X + BORDER, Y + BORDER, W - BORDER * 2, H - BORDER * 2, UI.panel)
      .setOrigin(0);
    const divider = add.rectangle(X + PAD, Y + 56, W - PAD * 2, 2, UI.textDim).setOrigin(0);

    this.tabPlate = add.rectangle(0, 0, 1, 1, UI.text).setOrigin(0).setVisible(false);
    this.tabsRoot = add.container(0, 0);
    this.empty = add.text(VIEW_W / 2, ROWS_TOP + 64, 'ПУСТО', textStyle(16, UI.disabled)).setOrigin(0.5);
    this.footer = add.text(X + PAD, Y + H - PAD, '', textStyle(8, UI.textDim)).setOrigin(0, 1);

    this.root = add
      .container(0, 0, [backdrop, frame, panel, divider, this.tabPlate, this.tabsRoot, this.empty, this.footer])
      .setDepth(UI_DEPTH.terminal)
      .setVisible(false);

    for (let i = 0; i < MAX_ROWS; i++) {
      const y = ROWS_TOP + i * ROW_H;
      const view: RowView = {
        bar: add.rectangle(X + PAD - 8, y, W - PAD * 2 + 16, ROW_H - 8, UI.selection).setOrigin(0),
        title: add.text(X + PAD, y + 8, '', textStyle(16, UI.text)),
        value: add.text(X + W - PAD, y + 8, '', textStyle(16, UI.accent)).setOrigin(1, 0),
        detail: add.text(X + PAD + 32, y + 32, '', textStyle(8, UI.textDim)),
      };
      this.root.add([view.bar, view.title, view.value, view.detail]);
      this.rowViews.push(view);
    }
  }

  get isOpen(): boolean {
    return this.root.visible;
  }

  /** Задаёт вкладки. Вызывается один раз, когда игра готова их наполнить. */
  setTabs(tabs: TerminalTab[]): void {
    this.tabs = tabs;
    this.tabIndex = 0;
    this.cursor = 0;

    this.tabsRoot.removeAll(true);
    let x = X + PAD;
    this.tabTitles = tabs.map((tab) => {
      const title = this.scene.add.text(x, Y + 16, tab.title, {
        ...textStyle(16, UI.text),
        padding: TAB_PADDING,
      });
      x += title.width + 16;
      return title;
    });
    this.tabsRoot.add(this.tabTitles);
    this.refresh();
  }

  /** Открывает окно на той же вкладке и строке, где его закрыли. */
  open(): void {
    this.root.setVisible(true);
    this.refresh();
  }

  close(): void {
    this.root.setVisible(false);
  }

  handle(action: Action): void {
    const count = this.rows.length;
    switch (action) {
      case 'left':
      case 'right': {
        const step = action === 'right' ? 1 : -1;
        this.tabIndex = Phaser.Math.Wrap(this.tabIndex + step, 0, this.tabs.length);
        this.cursor = 0;
        break;
      }
      case 'up':
      case 'down':
        if (count > 0) this.cursor = Phaser.Math.Wrap(this.cursor + (action === 'down' ? 1 : -1), 0, count);
        break;
      case 'confirm': {
        const row = this.rows[this.cursor];
        if (!row) return;
        if (row.blocked) this.flash(this.rowViews[this.cursor].detail);
        else row.run();
        break;
      }
      default:
        return;
    }
    this.refresh();
  }

  /** Перерисовывает окно. Пока оно закрыто, ничего не делает. */
  refresh(): void {
    if (!this.isOpen) return;

    const tab = this.tabs[this.tabIndex];
    this.rows = tab ? tab.rows().slice(0, MAX_ROWS) : [];
    this.cursor = Phaser.Math.Clamp(this.cursor, 0, Math.max(0, this.rows.length - 1));

    this.tabTitles.forEach((title, i) => {
      // Активная вкладка — «инверсией»: тёмный текст на зелёной плашке.
      const active = i === this.tabIndex;
      setLabel(title, title.text, active ? UI.panel : UI.text);
      if (active) {
        this.tabPlate.setPosition(title.x, title.y).setSize(title.width, title.height).setVisible(true);
      }
    });

    this.rowViews.forEach((view, i) => {
      const row = this.rows[i];
      const selected = i === this.cursor;
      view.bar.setVisible(row !== undefined && selected);
      view.title.setVisible(row !== undefined);
      view.value.setVisible(row !== undefined);
      view.detail.setVisible(row !== undefined);
      if (!row) return;

      const blocked = row.blocked !== undefined;
      setLabel(view.title, `${selected ? '>' : ' '} ${row.title}`, blocked ? UI.disabled : UI.text);
      setLabel(view.value, row.value, blocked ? UI.disabled : UI.accent);
      // У недоступной строки вместо пояснения показана причина.
      setLabel(view.detail, row.blocked ?? row.detail, blocked ? UI.bad : UI.textDim);
    });

    this.empty.setVisible(this.rows.length === 0);
    const verb = tab && this.rows.length > 0 ? `E - ${tab.verb}   ` : '';
    this.footer.setText(`W/S - ВЫБОР   A/D - ВКЛАДКА   ${verb}ESC - ЗАКРЫТЬ`);
  }

  /** Мигание текста: так видно, почему на нажатие ничего не произошло. */
  private flash(target: Phaser.GameObjects.Text): void {
    this.scene.tweens.killTweensOf(target);
    target.setAlpha(1);
    this.scene.tweens.add({ targets: target, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });
  }
}
