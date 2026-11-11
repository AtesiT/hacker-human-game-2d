import Phaser from 'phaser';
import { ASSETS } from '../data/assets';
import { DEPTH, TILE } from '../data/config';
import type { FurnitureDef } from '../data/room';
import { addLabel } from '../systems/Placeholders';

/** Предмет обстановки: стоит на месте, описан в data/room.ts. */
export class Furniture extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, readonly def: FurnitureDef) {
    const { frameW, frameH } = ASSETS[def.asset];
    // Позиция в данных — левый верхний тайл, а у картинки точка привязки в центре.
    super(scene, def.tx * TILE + frameW / 2, def.ty * TILE + frameH / 2, def.asset);

    scene.add.existing(this);
    this.setDepth(def.solid ? DEPTH.object : DEPTH.decor);
    addLabel(scene, this, def.asset);
  }
}
