import Phaser from 'phaser';
import { DEPTH, PLAYER_HITBOX, PLAYER_SPEED } from '../data/config';
import { addLabel } from '../systems/Placeholders';

export type Facing = 'down' | 'left' | 'right' | 'up';

/** Порядок рядов в листе игрока: в каждом ряду кадры одного направления. */
const FACINGS: Facing[] = ['down', 'left', 'right', 'up'];
const FRAMES_PER_FACING = 4;

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.player);
    this.setBodySize(PLAYER_HITBOX, PLAYER_HITBOX); // по умолчанию встаёт по центру кадра
    addLabel(scene, this, 'player', true);
  }

  /** Анимации шага на четыре стороны. Вызывается один раз при загрузке. */
  static createAnimations(anims: Phaser.Animations.AnimationManager): void {
    FACINGS.forEach((facing, row) => {
      const start = row * FRAMES_PER_FACING;
      anims.create({
        key: `player-walk-${facing}`,
        frames: anims.generateFrameNumbers('player', { start, end: start + FRAMES_PER_FACING - 1 }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  /** Мгновенно переносит игрока в точку: вместе со спрайтом двигается и физическое тело. */
  teleport(x: number, y: number): void {
    (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
  }

  /** Хитбокс в координатах мира. */
  hitbox(): Phaser.Geom.Rectangle {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  /**
   * Задаёт движение на текущий кадр.
   * @param dx, dy направление: −1, 0 или 1 по каждой оси; оба нуля — стоять
   */
  move(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) {
      this.setVelocity(0, 0);
      this.anims.stop();
      // Стоячая поза — первый кадр ряда для текущего направления.
      this.setFrame(FACINGS.indexOf(this.facing) * FRAMES_PER_FACING);
      return;
    }

    // Анимаций четыре, а направлений движения восемь. При ходьбе по диагонали
    // взгляд не меняется, пока зажата клавиша его стороны, — иначе спрайт дёргался бы.
    const held: Record<Facing, boolean> = { left: dx < 0, right: dx > 0, up: dy < 0, down: dy > 0 };
    if (!held[this.facing]) {
      if (dx !== 0) this.facing = dx < 0 ? 'left' : 'right';
      else this.facing = dy < 0 ? 'up' : 'down';
    }

    // Делим на длину вектора, чтобы по диагонали скорость была той же, что по прямой.
    const length = Math.hypot(dx, dy);
    this.setVelocity((dx / length) * PLAYER_SPEED, (dy / length) * PLAYER_SPEED);
    this.anims.play(`player-walk-${this.facing}`, true);
  }
}
