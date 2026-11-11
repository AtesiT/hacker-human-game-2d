import Phaser from 'phaser';
import { ASSETS } from '../data/assets';
import { DEPTH, TILE } from '../data/config';
import { DEVICES, type DeviceKind } from '../data/devices';
import { addLabel } from '../systems/Placeholders';

/** Устройство, купленное в магазине и поставленное в комнате. */
export class Device extends Phaser.GameObjects.Image {
  /** Сколько миллисекунд прошло с последней выплаты. */
  elapsed = 0;

  /** @param tx, ty левый верхний тайл */
  constructor(
    scene: Phaser.Scene,
    readonly kind: DeviceKind,
    readonly tx: number,
    readonly ty: number,
  ) {
    const asset = DEVICES[kind].asset;
    const { frameW, frameH } = ASSETS[asset];
    super(scene, tx * TILE + frameW / 2, ty * TILE + frameH / 2, asset);

    scene.add.existing(this);
    this.setDepth(DEPTH.object);
    addLabel(scene, this, asset);
  }
}
