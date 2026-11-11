/**
 * Палитра DawnBringer 32 (DB32).
 * Все цвета в игре — и заглушки, и интерфейс — берутся только отсюда.
 */
export const DB32 = {
  black: 0x000000,
  valhalla: 0x222034,
  loulou: 0x45283c,
  oiledCedar: 0x663931,
  rope: 0x8f563b,
  tahitiGold: 0xdf7126,
  twine: 0xd9a066,
  pancho: 0xeec39a,
  goldenFizz: 0xfbf236,
  atlantis: 0x99e550,
  christi: 0x6abe30,
  elfGreen: 0x37946e,
  dell: 0x4b692f,
  verdigris: 0x524b24,
  opal: 0x323c39,
  deepKoamaru: 0x3f3f74,
  veniceBlue: 0x306082,
  royalBlue: 0x5b6ee1,
  cornflower: 0x639bff,
  viking: 0x5fcde4,
  lightSteelBlue: 0xcbdbfc,
  white: 0xffffff,
  heather: 0x9badb7,
  topaz: 0x847e87,
  dimGray: 0x696a6a,
  smokeyAsh: 0x595652,
  clairvoyant: 0x76428a,
  brown: 0xac3232,
  mandy: 0xd95763,
  plum: 0xd77bba,
  rainForest: 0x8f974a,
  stinger: 0x8a6f30,
} as const;

/** 0xRRGGBB → '#rrggbb': для стилей текста и рисования на канвасе. */
export function css(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Светлый ли цвет: по этому выбирается тёмный или белый текст поверх него. */
export function isLight(color: number): boolean {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
