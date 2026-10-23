/**
 * High-Fidelity Retro Pixel Art Generator & Renderer
 * Authentic Dragon Quest III / SFC inspired 16-bit / 8-bit pixel art graphics.
 * Features:
 * - Detailed monster matrices with shadows, highlights, and characteristic silhouettes
 * - Layered hero rendering across all 4 facing directions with equipment tiers (Cloth, Leather, Iron, Loto)
 * - Detailed 16x16 pixel sprites for all weapons, shields, armors, helmets, herbs, potions, food, scrolls, and wands
 * - High-performance offscreen canvas caching
 */

import { Direction, Item, PlayerEquipment } from '../types/game';

export type PixelMatrix = (string | null)[][];

// Cache for generated offscreen canvases
const spriteCanvasCache: Map<string, HTMLCanvasElement> = new Map();
const itemCanvasCache: Map<string, HTMLCanvasElement> = new Map();

/**
 * Converts a 2D pixel matrix into an offscreen canvas
 */
export function createPixelCanvas(matrix: PixelMatrix, scale: number = 2): HTMLCanvasElement {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w * scale);
  canvas.height = Math.max(1, h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx || w === 0 || h === 0) return canvas;

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const color = matrix[y][x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return canvas;
}

// Master color palette (Authentic Super Famicom / Dragon Quest III palette)
export const PAL = {
  trans: null,
  dark: '#0c0d14',
  black: '#14151f',
  outline: '#1a1b26',
  white: '#ffffff',
  pureWhite: '#ffffff',

  // Hero Skin & Hair
  skinLight: '#ffe5cc',
  skin: '#ffcca3',
  skinShadow: '#d89468',
  hairDark: '#381e0f',
  hairMid: '#5c331a',
  hairLight: '#8a4e28',

  // Basic Tunic & Leather
  tunicBlue: '#2554b8',
  tunicLight: '#4d7cf0',
  tunicDark: '#173678',
  tunicWhite: '#e2ebf5',
  leatherTan: '#c48855',
  leatherMid: '#8e562a',
  leatherDark: '#5c3514',

  // Metals
  bronzeLight: '#df9c5c',
  bronzeMid: '#b26e32',
  bronzeDark: '#6b3c14',
  ironHighlight: '#f0f5fa',
  ironLight: '#c2d2e2',
  ironMid: '#829ab3',
  ironDark: '#44566c',
  goldGlint: '#fff9db',
  goldLight: '#ffe066',
  goldMid: '#f59f00',
  goldDark: '#ae6b00',

  // Roto / Legendary Gear & Elemental
  fireOrange: '#ff5722',
  emeraldGreen: '#2ec4b6',
  lotoBlueGleam: '#6cb7ff',
  lotoBlueLight: '#2684ff',
  lotoBlueMid: '#0055c4',
  lotoBlueDark: '#002f73',
  rubyGlint: '#ff85a1',
  rubyLight: '#e63946',
  rubyMid: '#ba182b',
  rubyDark: '#660714',

  // Consumables & Nature
  herbGreenGlow: '#b7efc5',
  herbGreenLight: '#52b788',
  herbGreenMid: '#2d6a4f',
  herbGreenDark: '#1b4332',
  sekaijuGold: '#ffe66d',
  waterGlint: '#e0fbfc',
  waterLight: '#90e0ef',
  waterMid: '#00b4d8',
  waterDark: '#0077b6',
  breadCrust: '#c67d36',
  breadGolden: '#e9a857',
  breadLight: '#fde4ba',
  breadShadow: '#7f4f24',
  scrollPaper: '#fefae0',
  scrollMid: '#dda15e',
  scrollDark: '#bc6c25',

  // Arcane & Magic
  purpleGlow: '#d8bbff',
  purpleLight: '#9d4edd',
  purpleMid: '#5a189a',
  purpleDark: '#240046',
  lightningYellow: '#ffff3f',
  warpPink: '#f72585',
  windCyan: '#4cc9f0',

  // Monsters
  slimeLight: '#70b5f9',
  slimeMid: '#2185d0',
  slimeDark: '#0c4a8a',
  slimeBesLight: '#ffb703',
  slimeBesMid: '#e65c00',
  slimeBesDark: '#992200',
  metalLight: '#f8f9fa',
  metalMid: '#ced4da',
  metalDark: '#6c757d',
  drackyFurLight: '#434773',
  drackyFurMid: '#272944',
  drackyFurDark: '#161726',
  drackyWingLight: '#ff4d6d',
  drackyWingDark: '#a4133c',
  ravenPlumageLight: '#53457a',
  ravenPlumageMid: '#302847',
  ravenPlumageDark: '#1a1528',
  anteaterStripe: '#ecd8bd',
  anteaterBody: '#7a5135',
  anteaterDark: '#442a18',
  crabShellLight: '#ff5400',
  crabShellMid: '#d00000',
  crabShellDark: '#6a040f',
  skeletonBoneWhite: '#f8f9fa',
  skeletonBoneMid: '#d3d7dc',
  skeletonBoneDark: '#7d8590',
  armorNavyLight: '#2c4060',
  armorNavyMid: '#162438',
  armorNavyDark: '#0b131e',
  chimeraBeigeLight: '#f2e9e4',
  chimeraBeigeMid: '#c9ada7',
  chimeraWingLight: '#b56546',
  chimeraWingMid: '#7e3820',
  dragonScaleLight: '#74c69d',
  dragonScaleMid: '#2d6a4f',
  dragonScaleDark: '#1b4332',
  dragonBellyLight: '#fffae0',
  dragonBellyMid: '#e0d8a8',
  baramosSkinLight: '#588157',
  baramosSkinMid: '#3a5a40',
  baramosCloakLight: '#9e2a2b',
  baramosCloakDark: '#540b0e',
  zomaSkinLight: '#48cae4',
  zomaSkinMid: '#0096c7',
  zomaSkinDark: '#0077b6',
  zomaCloakLight: '#3a0ca3',
  zomaCloakDark: '#10002b',
  iceGlint: '#caf0f8',
};

const _ = null;
const K = PAL.outline;
const W = PAL.pureWhite;

// ==========================================
// 1. DETAILED MONSTER SPRITES (16x16 to 20x20)
// ==========================================

export function getMonsterMatrix(spriteKey: string): PixelMatrix {
  // --- SLIME / SHE_SLIME / METAL_SLIME ---
  if (spriteKey === 'slime' || spriteKey === 'she_slime' || spriteKey === 'metal_slime') {
    const isBes = spriteKey === 'she_slime';
    const isMetal = spriteKey === 'metal_slime';

    const L = isBes ? PAL.slimeBesLight : isMetal ? PAL.metalLight : PAL.slimeLight;
    const M = isBes ? PAL.slimeBesMid : isMetal ? PAL.metalMid : PAL.slimeMid;
    const D = isBes ? PAL.slimeBesDark : isMetal ? PAL.metalDark : PAL.slimeDark;
    const G = isBes ? PAL.goldGlint : isMetal ? PAL.white : PAL.waterGlint;

    return [
      [_, _, _, _, _, _, _, K, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, L, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, K, L, G, M, K, _, _, _, _, _, _],
      [_, _, _, _, K, L, G, G, M, M, K, _, _, _, _, _],
      [_, _, _, K, L, G, L, M, M, M, M, K, _, _, _, _],
      [_, _, K, L, L, M, M, M, M, M, M, M, K, _, _, _],
      [_, K, L, M, W, K, M, M, M, W, K, M, M, K, _, _],
      [_, K, L, M, W, K, M, M, M, W, K, M, M, K, _, _],
      [K, L, M, M, K, K, M, M, M, K, K, M, M, M, K, _],
      [K, L, M, M, M, M, M, M, M, M, M, M, M, M, K, _],
      [K, L, M, K, M, M, M, M, M, M, M, K, M, M, K, _],
      [K, L, M, M, K, K, K, K, K, K, K, M, M, M, K, _],
      [K, D, M, M, M, M, M, M, M, M, M, M, M, D, K, _],
      [_, K, D, D, D, D, D, D, D, D, D, D, D, K, _, _],
      [_, _, K, K, K, K, K, K, K, K, K, K, K, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- DRACKY (ドラキー) ---
  if (spriteKey === 'dracky') {
    const B = PAL.drackyFurMid;
    const BL = PAL.drackyFurLight;
    const BD = PAL.drackyFurDark;
    const R = PAL.drackyWingDark;
    const RL = PAL.drackyWingLight;
    const Y = PAL.goldLight;
    const YD = PAL.goldDark;

    return [
      [_, K, _, _, _, _, _, _, _, _, _, _, _, K, _, _],
      [K, RL, K, _, _, _, _, _, _, _, _, _, K, RL, K, _],
      [K, RL, R, K, _, K, K, _, _, K, K, _, K, R, RL, K],
      [K, RL, R, R, K, BL, B, K, K, B, BL, K, R, R, RL, K],
      [K, R, R, R, BL, B, B, B, B, B, B, BL, R, R, R, K],
      [_, K, R, BL, B, Y, K, B, B, Y, K, B, BL, R, K, _],
      [_, _, K, BL, B, Y, YD, B, B, Y, YD, B, BL, K, _, _],
      [_, K, RL, B, B, B, B, W, W, B, B, B, B, RL, K, _],
      [K, RL, R, B, B, B, K, W, W, K, B, B, B, R, RL, K],
      [K, R, R, B, B, B, B, K, K, B, B, B, B, R, R, K],
      [_, K, R, K, BD, B, B, B, B, B, B, BD, K, R, K, _],
      [_, _, K, _, K, BD, BD, BD, BD, BD, BD, K, _, K, _, _],
      [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, _, _, K, RL, K, _, K, RL, K, _, _, _, _],
      [_, _, _, _, _, _, K, _, _, _, K, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- RAVEN (おおがらす) ---
  if (spriteKey === 'raven') {
    const P1 = PAL.ravenPlumageLight;
    const P2 = PAL.ravenPlumageMid;
    const P3 = PAL.ravenPlumageDark;
    const Y = PAL.goldMid;
    const YL = PAL.goldLight;
    const R = PAL.rubyLight;

    return [
      [_, _, _, _, _, _, _, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, P1, P1, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, P1, P2, R, W, K, _, _, _, _, _],
      [_, _, _, _, K, YL, YL, K, K, P2, K, _, _, _, _, _],
      [_, _, _, K, Y, Y, Y, P1, P1, K, _, _, _, _, _, _],
      [_, _, K, P3, P2, P2, P1, P1, P2, K, _, _, _, _, _],
      [_, K, P3, P3, P2, P2, P2, P2, P2, P2, K, _, _, _, _],
      [K, P3, P3, P3, P3, P2, P2, P2, P2, P2, P2, K, _, _, _],
      [K, P1, P3, P3, P3, P2, P2, P2, P2, P2, P2, P2, K, _, _],
      [_, K, P1, P3, P3, P3, P2, P2, P2, P2, P2, K, _, _, _],
      [_, _, K, K, P3, P3, P3, P3, P3, P2, K, K, _, _, _],
      [_, _, _, _, K, P3, P3, P3, P3, K, _, _, _, _, _, _],
      [_, _, _, _, K, Y, K, _, K, Y, K, _, _, _, _, _, _],
      [_, _, _, _, K, Y, K, _, K, Y, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, _, _, _, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- ANTEATER (おおありくい) ---
  if (spriteKey === 'anteater') {
    const Br = PAL.anteaterBody;
    const St = PAL.anteaterStripe;
    const D = PAL.anteaterDark;

    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, K, K, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, K, Br, Br, K, _, _, _, _, _, _, _],
      [_, _, _, K, Br, St, Br, K, _, _, _, _, _, _, _],
      [_, _, K, Br, St, W, K, K, _, _, _, _, _, _, _],
      [K, K, Br, Br, St, K, K, Br, K, K, _, _, _, _, _],
      [K, Br, Br, Br, Br, Br, Br, St, St, Br, K, _, _, _, _, _],
      [_, K, Br, Br, Br, Br, St, St, Br, Br, Br, K, _, _, _, _],
      [_, _, K, Br, Br, St, St, Br, Br, Br, Br, Br, K, _, _, _],
      [_, _, K, Br, St, St, Br, Br, Br, Br, Br, Br, K, _, _, _],
      [_, _, K, D, Br, Br, Br, Br, Br, Br, Br, D, K, _, _, _],
      [_, _, _, K, D, K, K, Br, K, K, Br, D, K, _, _, _],
      [_, _, _, K, D, K, _, K, Br, K, _, K, D, K, _, _],
      [_, _, _, _, K, _, _, _, K, _, _, _, K, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- CRAB (ぐんたいがに) ---
  if (spriteKey === 'crab') {
    const R = PAL.crabShellMid;
    const RL = PAL.crabShellLight;
    const RD = PAL.crabShellDark;
    const O = PAL.fireOrange;

    return [
      [_, K, K, _, _, _, _, _, _, _, _, _, K, K, _, _],
      [K, RL, R, K, _, _, _, _, _, _, _, K, R, RL, K, _],
      [K, RL, O, R, K, _, K, _, K, _, K, R, O, RL, K, _],
      [K, RL, O, R, K, K, W, K, W, K, K, R, O, RL, K, _],
      [_, K, R, K, K, R, K, R, K, R, K, K, R, K, _, _],
      [_, _, K, K, RL, R, R, R, R, R, RL, K, K, _, _, _],
      [_, K, RL, R, R, O, O, O, O, O, R, R, RL, K, _, _],
      [K, RL, R, R, O, O, O, O, O, O, O, R, R, RL, K, _],
      [K, R, R, R, RD, RD, RD, RD, RD, RD, RD, R, R, R, K, _],
      [_, K, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, K, _, _],
      [_, K, R, K, K, K, K, K, K, K, K, K, R, K, _, _],
      [K, R, K, _, K, R, K, _, K, R, K, _, K, R, K, _],
      [K, RD, K, _, K, RD, K, _, K, RD, K, _, K, RD, K, _],
      [K, K, _, _, K, K, _, _, _, K, K, _, _, K, K, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- MAGICIAN (まほうつかい) ---
  if (spriteKey === 'magician') {
    const H = PAL.purpleDark;
    const HL = PAL.purpleLight;
    const M = PAL.purpleMid;
    const Y = PAL.goldLight;
    const S = PAL.leatherMid;
    const Orb = PAL.windCyan;

    return [
      [_, _, _, _, _, _, _, K, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, H, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, K, H, HL, H, K, _, _, _, _, _, _],
      [_, _, _, _, K, H, HL, HL, H, H, K, _, _, _, _, _],
      [_, _, _, K, H, HL, HL, HL, H, H, H, K, _, _, _, _],
      [_, _, K, H, H, H, H, H, H, H, H, H, K, _, _, _],
      [_, K, K, K, K, Y, Y, Y, Y, K, K, K, K, K, _, _],
      [_, _, _, K, K, K, K, K, K, K, K, K, _, _, _, _],
      [_, _, _, K, K, Y, K, K, Y, K, K, K, _, _, _, _],
      [_, _, K, M, K, K, K, K, K, K, M, K, _, _, Orb, K],
      [_, K, M, M, M, M, M, M, M, M, M, M, K, K, S, K],
      [_, K, M, M, M, M, M, M, M, M, M, M, K, _, S, K],
      [_, K, M, M, M, M, M, M, M, M, M, M, K, _, S, K],
      [_, _, K, M, M, M, M, M, M, M, M, K, _, _, S, K],
      [_, _, _, K, H, H, H, H, H, H, K, _, _, _, K, _],
      [_, _, _, _, K, K, K, K, K, K, _, _, _, _, _, _],
    ];
  }

  // --- SKELETON (がいこつ) ---
  if (spriteKey === 'skeleton') {
    const B = PAL.skeletonBoneWhite;
    const G = PAL.skeletonBoneMid;
    const D = PAL.skeletonBoneDark;
    const S = PAL.ironLight;

    return [
      [_, _, _, _, _, K, K, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, B, B, B, B, K, _, _, _, _, _, _],
      [_, _, _, K, B, B, B, B, B, B, K, _, _, _, _, _],
      [_, _, _, K, B, K, B, B, K, B, K, _, _, _, _, _],
      [_, _, _, K, B, K, B, B, K, B, K, _, _, _, _, _],
      [_, _, _, _, K, B, B, B, B, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, B, B, K, _, _, _, _, _, _, _],
      [_, _, _, K, K, B, B, B, B, K, K, _, _, _, _, _],
      [_, _, K, B, K, B, K, K, B, K, B, K, _, S, K, _],
      [_, K, G, B, K, B, B, B, B, K, B, G, K, S, K, _],
      [_, K, G, K, _, K, B, B, K, _, K, G, K, S, K, _],
      [_, _, K, _, _, K, B, B, K, _, _, K, _, S, K, _],
      [_, _, _, _, _, K, B, B, K, _, _, _, _, S, K, _],
      [_, _, _, _, K, B, K, K, B, K, _, _, K, S, K, _],
      [_, _, _, _, K, B, K, K, B, K, _, _, _, K, _, _],
      [_, _, _, K, D, K, _, K, D, K, _, _, _, _, _, _],
    ];
  }

  // --- RESTLESS ARMOR (さまようよろい) ---
  if (spriteKey === 'restless_armor') {
    const A = PAL.armorNavyMid;
    const AL = PAL.armorNavyLight;
    const G = PAL.goldMid;
    const GL = PAL.goldLight;
    const S = PAL.ironLight;
    const R = PAL.rubyLight;

    return [
      [_, _, _, _, _, K, K, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, GL, G, G, GL, K, _, _, _, _, _, _],
      [_, _, _, K, AL, A, A, A, A, AL, K, _, _, _, _, _],
      [_, _, _, K, A, R, R, R, R, A, K, _, _, _, _, _],
      [_, _, _, K, A, K, K, K, K, A, K, _, _, _, _, _],
      [_, _, _, _, K, AL, A, A, AL, K, _, _, _, _, _, _],
      [_, _, K, K, AL, G, G, G, G, AL, K, K, _, _, _, _],
      [_, K, S, AL, A, A, A, A, A, A, AL, S, K, _, _, _],
      [_, K, S, A, A, G, A, A, G, A, A, S, K, _, _, _],
      [_, K, S, A, A, A, A, A, A, A, A, S, K, _, _, _],
      [_, _, K, A, A, A, A, A, A, A, A, K, _, _, _, _],
      [_, _, K, S, S, S, S, S, S, S, S, K, _, _, _, _],
      [_, _, _, K, AL, A, K, K, A, AL, K, _, _, _, _, _],
      [_, _, _, K, AL, A, K, K, A, AL, K, _, _, _, _, _],
      [_, _, _, K, S, S, K, K, S, S, K, _, _, _, _, _],
      [_, _, _, _, K, K, _, _, K, K, _, _, _, _, _, _],
    ];
  }

  // --- CHIMERA (キメラ) ---
  if (spriteKey === 'chimera') {
    const C = PAL.chimeraBeigeLight;
    const CD = PAL.chimeraBeigeMid;
    const W1 = PAL.chimeraWingLight;
    const W2 = PAL.chimeraWingMid;
    const R = PAL.rubyLight;
    const Y = PAL.goldLight;

    return [
      [_, _, _, _, _, _, _, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, R, R, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, C, Y, K, C, K, _, _, _, _, _],
      [_, _, _, _, K, R, R, K, K, C, K, _, _, _, _, _],
      [_, _, _, K, R, R, R, C, CD, K, _, _, _, _, _, _],
      [_, _, K, W1, W1, C, C, CD, W1, W1, K, _, _, _, _],
      [_, K, W1, W1, W1, C, C, CD, W1, W1, W1, K, _, _, _],
      [K, W1, W2, W2, W1, C, C, CD, W1, W2, W2, W1, K, _, _],
      [K, W2, W2, _, _, C, C, CD, _, _, W2, W2, K, _, _],
      [_, K, _, _, K, C, C, CD, K, _, _, K, _, _, _, _],
      [_, _, _, _, K, C, C, CD, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, Y, K, Y, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, Y, K, Y, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, K, _, K, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- GOLDMAN / GOLEM (ゴールドマン) ---
  if (spriteKey === 'goldman') {
    const G = PAL.goldMid;
    const GL = PAL.goldLight;
    const GD = PAL.goldDark;
    const R = PAL.rubyLight;

    return [
      [_, _, _, _, _, K, K, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, GL, GL, G, G, K, _, _, _, _, _, _],
      [_, _, _, K, GL, G, G, G, G, G, K, _, _, _, _, _],
      [_, _, _, K, G, R, G, G, R, G, K, _, _, _, _, _],
      [_, _, _, K, G, G, G, G, G, G, K, _, _, _, _, _],
      [_, _, K, GL, G, G, G, G, G, G, G, K, _, _, _, _],
      [_, K, GL, G, GD, GD, GD, GD, G, G, GL, K, _, _, _],
      [K, GL, G, G, GD, GL, GL, GD, G, G, G, GL, K, _, _],
      [K, G, G, G, GD, GL, GL, GD, G, G, G, G, K, _, _],
      [K, G, GD, GD, G, GD, GD, GD, GD, G, GD, GD, G, K, _, _],
      [_, K, K, K, G, G, G, G, G, G, K, K, K, _, _, _],
      [_, _, _, K, G, G, G, G, G, G, K, _, _, _, _, _],
      [_, _, _, K, GL, G, K, K, G, GL, K, _, _, _, _, _],
      [_, _, _, K, G, G, K, K, G, G, K, _, _, _, _, _],
      [_, _, _, K, GD, GD, K, K, GD, GD, K, _, _, _, _],
      [_, _, _, _, K, K, _, _, K, K, _, _, _, _, _, _],
    ];
  }

  // --- DRAGON (ドラゴン) (18x18 formatted into 18x18 grid) ---
  if (spriteKey === 'dragon') {
    const G = PAL.dragonScaleMid;
    const GL = PAL.dragonScaleLight;
    const GD = PAL.dragonScaleDark;
    const B = PAL.dragonBellyLight;
    const BD = PAL.dragonBellyMid;
    const Y = PAL.goldLight;
    const R = PAL.rubyLight;

    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, Y, Y, K, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, K, GL, G, G, K, _, _, _],
      [_, _, _, _, _, _, _, _, _, K, GL, G, G, G, G, K, _, _],
      [_, _, _, _, _, _, _, _, K, GL, G, W, R, K, G, K, _, _],
      [_, _, _, _, _, _, _, K, GL, G, G, G, G, K, G, K, _, _],
      [_, _, _, _, _, _, K, GL, G, G, G, K, K, K, K, _, _, _],
      [_, _, _, _, _, K, GL, G, G, B, B, B, K, _, _, _, _, _],
      [_, _, _, _, K, GL, G, G, B, B, B, BD, K, _, _, _, _, _],
      [_, _, _, K, GL, G, G, G, B, B, B, BD, K, _, _, _, _, _],
      [_, _, K, GL, G, G, G, G, B, B, B, BD, K, _, _, _, _, _],
      [_, K, GL, G, K, G, G, G, B, B, B, BD, K, _, _, _, _, _],
      [K, GL, G, K, _, K, G, G, B, B, BD, K, _, _, _, _, _, _],
      [K, G, K, _, _, _, K, G, K, K, K, _, _, _, _, _, _, _],
      [_, K, _, _, _, _, K, G, K, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, G, K, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, K, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- BARAMOS (魔王バラモス) (18x18) ---
  if (spriteKey === 'baramos') {
    const G = PAL.baramosSkinMid;
    const GL = PAL.baramosSkinLight;
    const C = PAL.baramosCloakLight;
    const CD = PAL.baramosCloakDark;
    const Cr = PAL.goldMid;
    const Y = PAL.goldLight;
    const R = PAL.rubyLight;

    return [
      [_, _, _, _, _, _, K, Cr, Cr, Cr, Cr, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, Cr, R, Cr, Cr, R, Cr, K, _, _, _, _, _],
      [_, _, _, _, K, GL, G, G, G, G, G, G, GL, K, _, _, _, _],
      [_, _, _, K, GL, G, Y, K, G, G, Y, K, G, GL, K, _, _, _],
      [_, _, _, K, G, G, Y, K, G, G, Y, K, G, G, K, _, _, _],
      [_, _, _, K, G, G, G, G, W, W, G, G, G, G, K, _, _, _],
      [_, _, K, C, G, G, G, W, W, W, W, G, G, G, C, K, _, _],
      [_, K, CD, C, G, G, G, G, G, G, G, G, G, C, CD, K, _, _],
      [K, CD, C, C, C, C, C, C, C, C, C, C, C, C, C, CD, K, _],
      [K, CD, C, C, C, C, C, C, C, C, C, C, C, C, C, CD, K, _],
      [K, CD, C, G, C, C, C, C, C, C, C, C, C, G, C, CD, K, _],
      [K, CD, C, G, K, C, C, C, C, C, C, C, K, G, C, CD, K, _],
      [_, K, CD, K, K, C, C, C, C, C, C, C, K, K, CD, K, _, _],
      [_, _, K, _, K, G, G, K, _, K, G, G, K, _, K, _, _, _],
      [_, _, _, _, K, G, G, K, _, K, G, G, K, _, _, _, _, _],
      [_, _, _, _, _, K, K, _, _, _, K, K, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- ZOMA (大魔王ゾーマ) (20x20) ---
  if (spriteKey === 'zoma') {
    const Z = PAL.zomaSkinMid;
    const ZL = PAL.zomaSkinLight;
    const ZD = PAL.zomaSkinDark;
    const C = PAL.zomaCloakLight;
    const CD = PAL.zomaCloakDark;
    const Cr = PAL.goldLight;
    const R = PAL.rubyLight;
    const Ice = PAL.iceGlint;

    return [
      [_, _, _, _, _, _, _, K, Cr, Cr, Cr, Cr, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, Cr, R, Cr, Cr, R, Cr, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, Cr, Cr, Cr, Cr, Cr, Cr, Cr, Cr, K, _, _, _, _, _],
      [_, _, _, _, K, ZL, Z, Z, Z, Z, Z, Z, Z, Z, ZL, K, _, _, _, _],
      [_, _, _, K, ZL, Z, R, K, Z, Z, Z, Z, R, K, Z, ZL, K, _, _, _],
      [_, _, _, K, Z, Z, R, K, Z, Z, Z, Z, R, K, Z, Z, K, _, _, _],
      [_, _, _, K, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, K, _, _, _],
      [_, _, K, C, ZL, Z, Z, Z, Z, Z, Z, Z, Z, Z, ZL, C, K, _, _],
      [_, K, CD, C, C, Z, Z, Z, Z, Z, Z, Z, Z, Z, C, C, CD, K, _, _],
      [K, CD, C, C, C, Cr, Cr, Cr, Cr, Cr, Cr, Cr, Cr, C, C, C, CD, K, _],
      [K, CD, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, CD, K, _],
      [K, CD, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, CD, K, _],
      [K, CD, C, Z, C, C, C, C, C, C, C, C, C, C, Z, C, CD, K, _],
      [K, CD, C, Z, K, C, C, C, C, C, C, C, C, K, Z, C, CD, K, _],
      [_, K, CD, K, K, C, C, C, C, C, C, C, C, K, K, CD, K, _, _],
      [_, _, K, _, K, C, C, C, C, C, C, C, C, K, _, K, _, _, _],
      [_, _, _, _, K, C, C, C, C, C, C, C, C, K, _, _, _, _, _],
      [_, _, Ice, _, K, C, C, C, C, C, C, C, C, K, _, Ice, _, _, _],
      [_, _, _, _, _, K, K, K, K, K, K, K, K, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // Fallback generic monster
  return [
    [_, _, _, K, K, K, K, _, _, _],
    [_, _, K, PAL.white, PAL.white, PAL.white, PAL.white, K, _, _],
    [_, K, PAL.white, K, PAL.white, PAL.white, K, PAL.white, K, _],
    [_, K, PAL.white, PAL.white, PAL.white, PAL.white, PAL.white, PAL.white, K, _],
    [_, _, K, PAL.white, PAL.white, PAL.white, PAL.white, K, _, _],
    [_, _, _, K, K, K, K, _, _, _],
  ];
}

// ==========================================
// 2. DETAILED ITEM SPRITES (16x16 Matrices)
// ==========================================

export function getItemMatrix(itemOrKey: Item | string): PixelMatrix {
  let key: string = '';
  let itemType: string | undefined = undefined;

  if (typeof itemOrKey === 'string') {
    key = itemOrKey;
  } else if (itemOrKey && typeof itemOrKey === 'object') {
    key = itemOrKey.spriteKey || itemOrKey.defId || itemOrKey.id || '';
    itemType = itemOrKey.type;
  }

  // --- WEAPONS (剣の形 / Iconic Sword Silhouettes) ---
  if (key === 'stick') {
    // ひのきのぼう (木刀 / Carved wooden practice sword with distinct guard & grip)
    const B1 = PAL.leatherTan;
    const B2 = PAL.leatherMid;
    const B3 = PAL.leatherDark;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, K, B1, K, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, B1, B2, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, B1, B1, B2, K, _],
      [_, _, _, _, _, _, _, _, _, K, B1, B1, B2, K, _, _],
      [_, _, _, _, _, _, _, _, K, B1, B1, B2, K, _, _, _],
      [_, _, _, _, _, _, _, K, B1, B1, B2, K, _, _, _, _],
      [_, _, _, _, _, _, K, B1, B1, B2, K, _, _, _, _, _],
      [_, _, _, _, _, K, B1, B1, B2, K, _, _, _, _, _, _],
      [_, _, _, _, K, B2, B2, B2, K, _, _, _, _, _, _, _],
      [_, _, _, K, B2, B3, B3, B3, B2, K, _, _, _, _, _, _],
      [_, _, K, B3, K, B3, B3, K, B3, K, _, _, _, _, _, _],
      [_, K, _, _, _, K, B3, B3, K, _, _, _, _, _, _, _],
      [K, B2, K, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'copper_sword') {
    // どうのつるぎ (Bronze shortsword with gold crossguard)
    const M0 = PAL.pureWhite;
    const M1 = PAL.bronzeLight;
    const M2 = PAL.bronzeMid;
    const M3 = PAL.bronzeDark;
    const G = PAL.goldLight;
    const H = PAL.leatherDark;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, K, M0, K, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, M0, M1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, M0, M1, M2, K, _],
      [_, _, _, _, _, _, _, _, _, K, M0, M1, M2, K, _, _],
      [_, _, _, _, _, _, _, _, K, M0, M1, M2, K, _, _, _],
      [_, _, _, _, _, _, _, K, M0, M1, M2, K, _, _, _, _],
      [_, _, _, _, _, _, K, M0, M1, M2, K, _, _, _, _, _],
      [_, _, _, _, _, K, M0, M1, M2, K, _, _, _, _, _, _],
      [_, _, _, _, K, G, G, M2, M3, K, _, _, _, _, _, _],
      [_, _, _, K, G, G, G, G, G, K, _, _, _, _, _, _],
      [_, _, K, G, K, H, H, K, G, K, _, _, _, _, _, _],
      [_, K, _, _, _, K, H, H, K, _, _, _, _, _, _, _],
      [K, G, K, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'iron_sword') {
    // はがねのつるぎ (Steel broadsword with gleaming fuller & ruby pommel)
    const S0 = PAL.pureWhite;
    const S1 = PAL.ironHighlight;
    const S2 = PAL.ironLight;
    const S3 = PAL.ironMid;
    const S4 = PAL.ironDark;
    const G = PAL.goldLight;
    const R = PAL.rubyLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, K, S0, K, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, S0, S1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, S0, S1, S2, K, _],
      [_, _, _, _, _, _, _, _, _, K, S0, S1, S3, K, _, _],
      [_, _, _, _, _, _, _, _, K, S0, S1, S3, K, _, _, _],
      [_, _, _, _, _, _, _, K, S0, S1, S3, K, _, _, _, _],
      [_, _, _, _, _, _, K, S0, S1, S3, K, _, _, _, _, _],
      [_, _, _, _, _, K, S0, S1, S3, K, _, _, _, _, _, _],
      [_, _, _, _, K, S2, S4, S4, K, _, _, _, _, _, _, _],
      [_, _, _, K, G, G, G, G, G, K, _, _, _, _, _, _],
      [_, _, K, G, K, S4, S4, K, G, K, _, _, _, _, _, _],
      [_, K, _, _, _, K, S4, S4, K, _, _, _, _, _, _, _],
      [K, R, K, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'dragon_killer') {
    // ドラゴンキラー (Jagged Dragon Slayer broadsword with glowing ruby eye)
    const S0 = PAL.pureWhite;
    const S1 = PAL.ironHighlight;
    const S2 = PAL.ironMid;
    const S3 = PAL.ironDark;
    const R = PAL.rubyLight;
    const G = PAL.goldMid;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, K, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, S0, S1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, S0, S1, S2, K, _],
      [_, _, _, _, _, _, _, _, _, K, S0, S1, S2, S3, K, _],
      [_, _, _, _, _, _, _, _, K, S0, S1, K, S2, S3, K, _],
      [_, _, _, _, _, _, _, K, S0, S1, S2, S3, K, _, _],
      [_, _, _, _, _, _, K, S0, S1, K, S2, S3, K, _, _],
      [_, _, _, _, _, K, S0, S1, S2, S3, K, _, _, _, _],
      [_, _, _, _, K, S0, S1, K, S2, S3, K, _, _, _, _],
      [_, _, _, K, G, S2, S3, K, _, _, _, _, _, _, _, _],
      [_, _, K, G, G, R, G, G, K, _, _, _, _, _, _, _],
      [_, K, G, K, K, S3, K, K, G, K, _, _, _, _, _, _],
      [_, K, _, _, K, S3, K, _, _, _, _, _, _, _, _, _],
      [K, R, K, _, _, K, _, _, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'falcon_sword') {
    // はやぶさのけん (Falcon sword with green speed gleam & wing guard)
    const S0 = PAL.pureWhite;
    const S1 = PAL.windCyan;
    const S2 = PAL.emeraldGreen;
    const G = PAL.goldLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, K, S0, K, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, S0, S1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, S0, S1, S2, K, _],
      [_, _, _, _, _, _, _, _, _, K, S0, S1, S2, K, _, _],
      [_, _, _, _, _, _, _, _, K, S0, S1, S2, K, _, _, _],
      [_, _, _, _, _, _, _, K, S0, S1, S2, K, _, _, _, _],
      [_, _, _, _, _, _, K, S0, S1, S2, K, _, _, _, _, _],
      [_, _, _, _, _, K, S0, S1, S2, K, _, _, _, _, _, _],
      [_, _, _, _, K, G, G, S2, K, _, _, _, _, _, _, _],
      [_, _, _, K, G, G, G, G, K, _, _, _, _, _, _, _],
      [_, _, K, G, K, G, G, K, G, K, _, _, _, _, _, _],
      [_, K, _, _, _, K, G, G, K, _, _, _, _, _, _, _],
      [K, S1, K, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'flame_sword') {
    // ほのおのつるぎ (Flaming sword enveloped in roaring fire)
    const F0 = PAL.pureWhite;
    const F1 = PAL.lightningYellow;
    const F2 = PAL.fireOrange;
    const F3 = PAL.rubyLight;
    const G = PAL.goldLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, K, F1, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, F0, F1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, F0, F1, F2, K, _],
      [_, _, _, _, _, _, _, _, _, K, F0, F1, F2, F3, K, _],
      [_, _, _, _, _, _, _, _, K, F0, F1, F2, F3, K, _, _],
      [_, _, _, _, _, _, _, K, F0, F1, F2, F3, K, _, _, _],
      [_, _, _, _, _, _, K, F0, F1, F2, F3, K, _, _, _, _],
      [_, _, _, _, _, K, F0, F1, F2, F3, K, _, _, _, _, _],
      [_, _, _, _, K, F1, F2, F3, F3, K, _, _, _, _, _, _],
      [_, _, _, K, G, G, F3, K, K, _, _, _, _, _, _, _],
      [_, _, K, G, G, G, G, G, K, _, _, _, _, _, _, _],
      [_, K, G, K, K, F3, K, K, G, K, _, _, _, _, _, _],
      [_, K, _, _, K, F3, K, _, _, _, _, _, _, _, _, _],
      [K, F1, K, _, _, K, _, _, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'loto_sword') {
    // ロトのつるぎ (Legendary Sword of Roto: azure fuller, phoenix wing guard, crown pommel)
    const B0 = PAL.pureWhite;
    const B1 = PAL.lotoBlueGleam;
    const B2 = PAL.lotoBlueLight;
    const B3 = PAL.lotoBlueMid;
    const G1 = PAL.goldLight;
    const G2 = PAL.goldMid;
    const R = PAL.rubyLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, K, B0, K, _],
      [_, _, _, _, _, _, _, _, _, _, _, K, B0, B1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, B0, B1, B2, K, _],
      [_, _, _, _, _, _, _, _, _, K, B0, B1, B2, B3, K, _],
      [_, _, _, _, _, _, _, _, K, B0, B1, B2, B3, K, _, _],
      [_, _, _, _, _, _, _, K, B0, B1, B2, B3, K, _, _, _],
      [_, _, _, _, _, _, K, B0, B1, B2, B3, K, _, _, _, _],
      [_, _, _, _, _, K, B0, B1, B2, B3, K, _, _, _, _, _],
      [_, _, _, K, G1, B0, B2, G1, K, _, _, _, _, _, _, _],
      [_, _, K, G1, G2, R, G2, G1, K, _, _, _, _, _, _, _],
      [_, K, G1, K, K, G2, G2, K, K, G1, K, _, _, _, _, _],
      [_, K, _, _, _, K, B3, B3, K, _, _, _, _, _, _, _],
      [K, R, K, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [K, K, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- SHIELDS (盾の形 / Iconic Fantasy Shields: Round Buckler, Scale Kite, Bronze Sun, Knight's Cross, and Loto Crest) ---
  if (key === 'leather_shield' || key === 'shield_leather') {
    // かわのたて (Round leather & wood buckler with iron rim and central steel boss)
    const L1 = PAL.leatherTan;
    const L2 = PAL.leatherMid;
    const L3 = PAL.leatherDark;
    const I1 = PAL.ironHighlight;
    const I2 = PAL.ironLight;
    const I3 = PAL.ironMid;
    const I4 = PAL.ironDark;
    return [
      [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, K, K, I1, I1, I1, I1, I2, K, K, _, _, _, _],
      [_, _, K, I1, I2, L1, L1, L1, L1, L2, I3, I4, K, _, _, _],
      [_, K, I1, L1, L1, L2, L2, L2, L2, L2, L2, L3, I4, K, _, _],
      [_, K, I1, L1, L2, I1, I2, I2, I3, L2, L2, L3, I4, K, _, _],
      [K, I1, L1, L2, I1, I1, I2, I2, I3, I4, L2, L3, I4, K, _, _],
      [K, I1, L1, L2, I1, I2, I1, I2, I3, I4, L2, L3, I4, K, _, _],
      [K, I1, L1, L2, I2, I2, I2, I3, I3, I4, L2, L3, I4, K, _, _],
      [K, I2, L1, L2, I2, I3, I3, I3, I4, I4, L2, L3, I4, K, _, _],
      [K, I2, L1, L2, I3, I4, I4, I4, I4, I4, L2, L3, I4, K, _, _],
      [_, K, I2, L1, L2, L3, L3, L3, L3, L3, L3, L3, I4, K, _, _],
      [_, K, I3, L2, L2, L3, L3, L3, L3, L3, L3, L3, I4, K, _, _],
      [_, _, K, I3, I4, L3, L3, L3, L3, L3, I4, I4, K, _, _, _],
      [_, _, _, K, K, I3, I4, I4, I4, I4, K, K, _, _, _, _],
      [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'scale_shield' || key === 'shield_scale') {
    // うろこのたて (Emerald Dragon Scale Kite Shield with Bronze Trim)
    const B1 = PAL.bronzeLight;
    const B2 = PAL.bronzeMid;
    const B3 = PAL.bronzeDark;
    const G1 = PAL.herbGreenGlow;
    const G2 = PAL.herbGreenLight;
    const G3 = PAL.herbGreenMid;
    return [
      [_, _, _, K, K, K, K, K, K, K, K, K, K, _, _, _],
      [_, _, K, B1, B1, B1, B1, B1, B1, B1, B2, B3, K, _, _],
      [_, K, B1, B1, G1, G2, B2, B2, G1, G2, B2, B3, K, _],
      [_, K, B1, G1, G2, G3, B2, B2, G2, G3, B3, B3, K, _],
      [_, K, B1, G2, B2, G1, G2, G1, G2, B3, G3, B3, K, _],
      [_, K, B1, B2, G1, G2, G3, G2, G3, G1, B3, B3, K, _],
      [_, K, B1, G1, G2, G3, G1, G2, G3, G2, G3, B3, K, _],
      [_, K, B1, G2, G3, G1, G2, G3, G1, G2, G3, B3, K, _],
      [_, K, B1, B2, G2, G3, B2, B2, G3, G3, B3, B3, K, _],
      [_, _, K, B1, G1, G2, G2, G3, G3, B2, B3, K, _, _],
      [_, _, K, B1, G2, G3, G3, G3, G3, B2, B3, K, _, _],
      [_, _, _, K, B1, B2, G3, G3, B3, B3, K, _, _, _],
      [_, _, _, _, K, B1, B2, B3, B3, K, _, _, _, _],
      [_, _, _, _, _, K, B2, B3, K, _, _, _, _, _],
      [_, _, _, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'bronze_shield' || key === 'shield_bronze') {
    // せいどうのたて (Round Bronze Hoplon Shield with Radiant Sun Boss)
    const B1 = PAL.bronzeLight;
    const B2 = PAL.bronzeMid;
    const B3 = PAL.bronzeDark;
    const G0 = PAL.pureWhite;
    const G1 = PAL.goldLight;
    const G2 = PAL.goldMid;
    const G3 = PAL.goldDark;
    return [
      [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, K, K, B1, B1, B1, B1, B2, K, K, _, _, _, _],
      [_, _, K, B1, B1, B2, B2, B2, B2, B2, B2, B3, K, _, _, _],
      [_, K, B1, B1, B2, B2, G1, G1, B2, B2, B3, B3, K, _, _],
      [_, K, B1, B2, G1, B2, G1, G1, B2, G1, B3, B3, K, _, _],
      [_, K, B1, B2, B2, G1, G1, G1, G1, B2, B3, B3, K, _, _],
      [_, K, B1, G1, G1, G1, G0, G1, G1, G1, G2, B3, K, _, _],
      [_, K, B1, G1, G1, G1, G1, G2, G2, G2, G3, B3, K, _, _],
      [_, K, B1, B2, B2, G1, G2, G2, G2, B2, B3, B3, K, _, _],
      [_, K, B1, B2, G1, B2, G2, G2, B2, G2, B3, B3, K, _, _],
      [_, K, B1, B2, B2, B2, G2, G2, B2, B3, B3, B3, K, _, _],
      [_, _, K, B1, B2, B2, B3, B3, B3, B3, B3, B3, K, _, _, _],
      [_, _, _, K, K, B2, B3, B3, B3, B3, K, K, _, _, _, _],
      [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'iron_shield' || key === 'shield_iron' || key === 'shield') {
    // はがねのたて (Knight's Steel Heater Shield with Heraldic Red Cross)
    const S0 = PAL.pureWhite;
    const S1 = PAL.ironHighlight;
    const S2 = PAL.ironLight;
    const S3 = PAL.ironMid;
    const S4 = PAL.ironDark;
    const R1 = PAL.rubyLight;
    const R2 = PAL.rubyMid;
    const R3 = PAL.rubyDark;
    const G = PAL.goldLight;
    return [
      [_, _, _, K, K, K, K, K, K, K, K, K, K, _, _, _],
      [_, _, K, S0, S1, S1, S1, S1, S1, S1, S2, S3, K, _, _],
      [_, K, S0, S1, S2, S2, R1, R1, S2, S2, S3, S4, K, _],
      [_, K, S1, S2, S2, S2, R1, R1, S2, S2, S3, S4, K, _],
      [_, K, S1, S2, R1, R1, G,  G,  R1, R1, S3, S4, K, _],
      [_, K, S1, S2, R2, R2, G,  G,  R2, R2, S3, S4, K, _],
      [_, K, S1, S2, S2, S2, R2, R2, S2, S3, S3, S4, K, _],
      [_, K, S1, S2, S2, S2, R2, R2, S2, S3, S4, S4, K, _],
      [_, K, S1, S2, S2, S2, R2, R2, S3, S3, S4, S4, K, _],
      [_, _, K, S1, S2, S2, R2, R3, S3, S4, S4, K, _, _],
      [_, _, K, S1, S2, S2, R2, R3, S3, S4, S4, K, _, _],
      [_, _, _, K, S1, S2, R3, R3, S4, S4, K, _, _, _],
      [_, _, _, _, K, S1, S2, S4, S4, K, _, _, _, _],
      [_, _, _, _, _, K, S2, S4, K, _, _, _, _, _],
      [_, _, _, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'loto_shield' || key === 'shield_loto') {
    // ロトのたて (Legendary Shield of Roto with Golden Phoenix Crest & Ruby)
    const G0 = PAL.pureWhite;
    const G1 = PAL.goldLight;
    const G2 = PAL.goldMid;
    const G3 = PAL.goldDark;
    const L0 = PAL.lotoBlueGleam;
    const L1 = PAL.lotoBlueLight;
    const L2 = PAL.lotoBlueMid;
    const L3 = PAL.lotoBlueDark;
    const R1 = PAL.rubyLight;
    const R2 = PAL.rubyDark;
    return [
      [_, _, _, K, K, K, K, K, K, K, K, K, K, _, _, _],
      [_, _, K, G0, G1, G1, G1, G1, G1, G1, G2, G3, K, _, _],
      [_, K, G0, G1, L0, L1, G1, G1, L1, L2, G2, G3, K, _],
      [_, K, G1, L0, G1, L1, G1, G1, L2, G2, L2, G3, K, _],
      [_, K, G1, L1, G1, G1, R1, R1, G1, G1, L3, G3, K, _],
      [_, K, G1, G1, G1, G2, R1, R2, G2, G1, G2, G3, K, _],
      [_, K, G1, L1, G1, G1, G1, G1, G1, G1, L3, G3, K, _],
      [_, K, G1, L1, L2, G1, G2, G2, G1, L2, L3, G3, K, _],
      [_, K, G1, L2, L2, L2, G1, G2, L3, L3, L3, G3, K, _],
      [_, _, K, G1, L2, L2, G2, G2, L3, L3, G2, K, _, _],
      [_, _, K, G1, L2, L3, G2, G3, L3, L3, G3, K, _, _],
      [_, _, _, K, G1, L3, L3, L3, L3, G2, K, _, _, _],
      [_, _, _, _, K, G1, L3, L3, G2, K, _, _, _, _],
      [_, _, _, _, _, K, G1, G2, K, _, _, _, _, _],
      [_, _, _, _, _, _, K, K, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- ARMOR (鎧の形 / Iconic Armor & Cuirass Silhouettes) ---
  if (key === 'cloth_armor') {
    // たびびとのふく (Traveler's Padded Armor: studded pauldrons, laced chest, belt, faulds)
    const T0 = PAL.pureWhite;
    const T1 = PAL.tunicLight;
    const T2 = PAL.tunicBlue;
    const T3 = PAL.tunicDark;
    const B1 = PAL.leatherTan;
    const B2 = PAL.leatherMid;
    const B3 = PAL.leatherDark;
    const G = PAL.goldLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, K, K, _, _, _, _, _, K, K, _, _, _, _],
      [_, _, K, B1, B2, K, _, _, _, K, B2, B3, K, _, _, _],
      [_, K, B1, B1, B2, K, K, K, K, K, B2, B3, B3, K, _, _],
      [K, B1, B1, B2, K, T1, T2, T2, T2, K, B2, B3, B3, K, _],
      [K, B1, B2, K, T1, T0, T2, T0, T2, T3, K, B3, B3, K, _],
      [_, K, K, T1, T1, T2, T0, T2, T2, T3, T3, K, K, _, _, _],
      [_, _, K, T1, T1, T2, T2, T2, T3, T3, T3, K, _, _, _, _],
      [_, _, K, T1, T2, T2, T2, T2, T3, T3, T3, K, _, _, _, _],
      [_, _, K, B2, B2, G, G, G, B2, B3, B3, K, _, _, _, _],
      [_, K, K, B2, B2, G, G, G, B3, B3, K, K, _, _, _, _],
      [_, K, T1, T2, T2, K, K, K, T2, T3, T3, K, _, _, _, _],
      [_, K, T1, T2, T2, K, _, K, T2, T3, T3, K, _, _, _, _],
      [_, _, K, K, K, _, _, _, _, K, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'leather_armor') {
    // かわのよろい (Hardened Leather Cuirass: broad studded pauldrons, riveted chest, split tassets)
    const L1 = PAL.leatherTan;
    const L2 = PAL.leatherMid;
    const L3 = PAL.leatherDark;
    const I = PAL.ironLight;
    const G = PAL.goldLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, K, K, _, _, _, _, _, K, K, _, _, _, _],
      [_, _, K, L1, L2, K, _, _, _, K, L2, L3, K, _, _, _],
      [_, K, L1, I, L1, K, K, K, K, K, L2, I, L3, K, _, _],
      [K, L1, L1, L2, K, L1, L2, L2, L3, K, L2, L3, L3, K, _],
      [K, L1, L2, K, L1, L1, L2, L2, L3, L3, K, L3, L3, K, _],
      [_, K, K, L1, I, L1, L2, L3, I, L3, L3, K, K, _, _, _],
      [_, _, K, L1, L1, L2, L2, L3, L3, L3, L3, K, _, _, _, _],
      [_, _, K, L1, L2, L2, L2, L3, L3, L3, L3, K, _, _, _, _],
      [_, _, K, L3, L3, G, G, G, L3, L3, L3, K, _, _, _, _],
      [_, K, K, L3, L3, G, G, G, L3, L3, K, K, _, _, _, _],
      [_, K, L1, L2, L2, K, K, K, L2, L3, L3, K, _, _, _, _],
      [_, K, L1, I, L2, K, _, K, L2, I, L3, K, _, _, _, _],
      [_, _, K, K, K, _, _, _, _, K, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'iron_armor') {
    // はがねのよろい (Full Steel Plate Armor: heavy curved pauldrons, sculpted breastplate, gold buckle, flared faulds)
    const S0 = PAL.pureWhite;
    const S1 = PAL.ironHighlight;
    const S2 = PAL.ironLight;
    const S3 = PAL.ironMid;
    const S4 = PAL.ironDark;
    const G = PAL.goldLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, K, K, _, _, _, _, _, K, K, _, _, _, _],
      [_, _, K, S1, S2, K, _, _, _, K, S2, S3, K, _, _, _],
      [_, K, S0, S1, S2, K, K, K, K, K, S2, S3, S4, K, _, _],
      [K, S0, S1, S2, K, S1, S2, S2, S3, K, S2, S3, S4, K, _],
      [K, S1, S2, K, S0, S1, S2, S2, S3, S4, K, S3, S4, K, _],
      [_, K, K, S1, S0, S1, S2, S3, S3, S4, S4, K, K, _, _, _],
      [_, _, K, S1, S0, S1, S2, S3, S3, S4, S4, K, _, _, _, _],
      [_, _, K, S1, S1, S2, S2, S3, S4, S4, S4, K, _, _, _, _],
      [_, _, K, S4, S4, G, G, G, S4, S4, S4, K, _, _, _, _],
      [_, K, K, S4, S4, G, G, G, S4, S4, K, K, _, _, _, _],
      [_, K, S1, S2, S2, K, K, K, S2, S3, S4, K, _, _, _, _],
      [_, K, S1, S2, S3, K, _, K, S3, S4, S4, K, _, _, _, _],
      [_, _, K, K, K, _, _, _, _, K, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'loto_armor') {
    // ロトのよろい (Divine Armor of Roto: winged golden pauldrons, azure breastplate, Sun Crest with ruby, holy faulds)
    const L0 = PAL.pureWhite;
    const L1 = PAL.lotoBlueGleam;
    const L2 = PAL.lotoBlueLight;
    const L3 = PAL.lotoBlueMid;
    const L4 = PAL.lotoBlueDark;
    const G1 = PAL.goldLight;
    const G2 = PAL.goldMid;
    const R = PAL.rubyLight;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, K, K, _, _, _, _, _, K, K, _, _, _, _],
      [_, _, K, G1, G2, K, _, _, _, K, G2, G1, K, _, _, _],
      [_, K, G1, G1, G2, K, K, K, K, K, G2, G1, G1, K, _, _],
      [K, G1, G1, G2, K, L1, L2, L2, L3, K, G2, G2, G1, K, _],
      [K, G1, G2, K, L0, L1, G1, G1, L2, L3, K, G2, G1, K, _],
      [_, K, K, L1, L0, G1, R, R, G1, L3, L4, K, K, _, _, _],
      [_, _, K, L1, L0, L1, G1, G1, L2, L3, L4, K, _, _, _, _],
      [_, _, K, L1, L1, L2, L2, L3, L4, L4, L4, K, _, _, _, _],
      [_, _, K, G2, G2, G1, G1, G1, G2, G2, G2, K, _, _, _, _],
      [_, K, K, G2, G2, G1, G1, G1, G2, G2, K, K, _, _, _, _],
      [_, K, G1, L1, L2, K, K, K, L2, L3, G2, K, _, _, _, _],
      [_, K, G1, L1, L2, K, _, K, L2, L4, G2, K, _, _, _, _],
      [_, _, K, K, K, _, _, _, _, K, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- HELMETS ---
  if (key === 'iron_helm') {
    // てつのかぶと (Steel Helmet with nasal bar & visor)
    const S1 = PAL.ironHighlight;
    const S2 = PAL.ironLight;
    const S3 = PAL.ironMid;
    const S4 = PAL.ironDark;
    const R = PAL.rubyLight;
    return [
      [_, _, _, _, _, K, K, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, S1, S2, S2, S3, K, _, _, _, _, _, _],
      [_, _, _, K, S1, S1, S2, S2, S3, S4, K, _, _, _, _, _],
      [_, _, K, S1, S1, S2, R, R, S2, S3, S4, K, _, _, _, _],
      [_, K, S1, S1, S2, S2, S2, S2, S3, S3, S4, K, _, _, _, _],
      [K, S1, S2, S2, S2, S2, S2, S3, S3, S3, S4, S4, K, _, _, _],
      [K, S1, S2, S2, S2, S2, S2, S3, S3, S3, S4, S4, K, _, _, _],
      [K, S2, S3, K, K, K, K, K, K, K, K, S4, K, _, _, _],
      [K, S2, S3, K, _, _, S2, S3, _, _, K, S4, K, _, _, _],
      [K, S2, S3, K, _, _, S2, S3, _, _, K, S4, K, _, _, _],
      [_, K, S3, S4, K, K, S3, S4, K, K, S4, K, _, _, _, _],
      [_, _, K, K, _, _, K, K, _, _, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'loto_helm') {
    // ロトのかぶと (Sacred Winged Crown Helm of Roto)
    const G1 = PAL.goldLight;
    const G2 = PAL.goldMid;
    const G3 = PAL.goldDark;
    const R = PAL.rubyLight;
    return [
      [_, _, K, G1, _, _, _, _, _, _, _, G1, K, _, _, _],
      [_, K, G1, G1, K, _, _, _, _, _, K, G1, G1, K, _, _],
      [_, K, G1, G2, K, _, K, K, K, K, _, K, G2, G1, K, _],
      [_, _, K, G1, G2, K, G1, G1, G1, G2, K, G2, G1, K, _],
      [_, _, K, G1, G2, K, G1, R, R, G2, K, G2, G1, K, _],
      [_, _, _, K, G2, K, G1, R, R, G2, K, G2, K, _, _],
      [_, _, _, K, G1, G1, G1, G1, G2, G2, G2, G3, K, _, _],
      [_, _, K, G1, G1, G1, G1, G1, G2, G2, G2, G3, K, _, _],
      [_, K, G1, G2, K, K, K, K, K, K, K, K, G3, K, _, _],
      [_, K, G1, G2, K, _, _, G1, G2, _, _, K, G3, K, _, _],
      [_, K, G2, G3, K, _, _, G2, G3, _, _, K, G3, K, _, _],
      [_, _, K, K, _, _, _, K, K, _, _, _, K, K, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- CONSUMABLES: HERBS (薬草の形 / Medicinal Plant Sprigs) ---
  if (key === 'yakusou' || key === 'jou_yakusou' || key === 'toku_yakusou' || key === 'herb' || key.includes('herb')) {
    const isJou = key === 'jou_yakusou';
    const isToku = key === 'toku_yakusou';
    const W0 = PAL.pureWhite;
    const H1 = isToku ? PAL.goldLight : isJou ? PAL.herbGreenGlow : PAL.herbGreenGlow;
    const H2 = isToku ? PAL.goldMid : isJou ? PAL.emeraldGreen : PAL.herbGreenLight;
    const H3 = isToku ? PAL.herbGreenLight : PAL.herbGreenMid;
    const H4 = PAL.herbGreenDark;
    const T1 = isToku ? PAL.rubyLight : PAL.leatherTan;
    const T2 = isToku ? PAL.rubyDark : PAL.leatherDark;

    return [
      [_, _, _, _, _, _, _, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, H1, H1, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, H1, W0, H2, H3, K, _, _, _, _, _],
      [_, _, _, _, _, K, H1, H2, H3, H4, K, _, _, _, _, _],
      [_, _, K, K, _, K, H1, H2, H3, H4, K, _, K, K, _, _],
      [_, K, H1, H1, K, K, H2, H3, H4, K, K, H1, H1, K, _],
      [K, H1, W0, H2, H3, K, H3, H4, K, K, H1, W0, H2, K, _],
      [K, H1, H2, H3, H4, K, K, H4, K, H1, H2, H3, H4, K, _],
      [_, K, H2, H3, H4, K, H2, H3, K, K, H2, H3, H4, K, _],
      [_, _, K, K, H4, K, H3, H4, K, K, H4, K, K, _, _, _],
      [_, _, _, K, H4, K, H3, H4, K, K, H4, K, _, _, _, _],
      [_, _, _, _, K, K, H4, H4, K, K, K, _, _, _, _, _],
      [_, _, _, _, _, K, T1, T1, T2, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, H4, H4, H4, K, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, K, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'sekaiju_leaf') {
    // せかいじゅの葉 (Golden World Tree Leaf: radiant branching veins & divine stem)
    const G0 = PAL.pureWhite;
    const G1 = PAL.goldGlint;
    const G2 = PAL.goldLight;
    const G3 = PAL.goldMid;
    const G4 = PAL.goldDark;
    return [
      [_, _, _, _, _, _, _, _, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, K, G0, K, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, G1, G0, G1, K, _, _, _, _, _],
      [_, _, _, _, _, K, G1, G2, G0, G2, G2, K, _, _, _, _],
      [_, _, _, _, K, G1, G2, G2, G0, G2, G3, G3, K, _, _, _],
      [_, _, _, K, G1, G2, G0, G2, G0, G2, G0, G3, K, _, _, _],
      [_, _, K, G1, G2, G2, G0, G2, G0, G2, G3, G3, G4, K, _, _],
      [_, K, G1, G2, G2, G2, G2, G0, G0, G3, G3, G3, G4, K, _, _],
      [_, K, G2, G2, G0, G2, G2, G0, G3, G3, G0, G3, G4, K, _, _],
      [_, _, K, G2, G2, G0, G2, G0, G3, G3, G3, G4, K, _, _, _],
      [_, _, _, K, G3, G2, G2, G0, G3, G3, G4, K, _, _, _, _],
      [_, _, _, _, K, G3, G3, G0, G3, G4, K, _, _, _, _, _],
      [_, _, _, _, _, K, G4, G0, G4, K, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, G4, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, G4, K, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, K, _, _, _, _, _, _, _, _],
    ];
  }

  if (key === 'seisui' || key === 'potion') {
    // まほうのせいすい / 聖水 (Glass potion bottle with cork & azure magic liquid)
    const C = PAL.leatherMid;
    const G = PAL.white;
    const B1 = PAL.waterGlint;
    const B2 = PAL.waterLight;
    const B3 = PAL.waterMid;
    const B4 = PAL.waterDark;
    return [
      [_, _, _, _, _, _, K, C, C, K, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, C, C, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, G, G, G, G, K, _, _, _, _, _],
      [_, _, _, _, _, K, G, G, G, G, K, _, _, _, _, _],
      [_, _, _, _, K, G, G, G, G, G, G, K, _, _, _, _],
      [_, _, _, K, G, B1, B2, B2, B2, B3, G, K, _, _, _],
      [_, _, K, G, B1, B1, B2, B2, B3, B3, B4, G, K, _, _],
      [_, _, K, G, B1, B1, B2, B2, B3, B3, B4, G, K, _, _],
      [_, _, K, G, B1, B2, B1, B2, B3, B4, B4, G, K, _, _],
      [_, _, K, G, B1, B2, B2, B3, B3, B4, B4, G, K, _, _],
      [_, _, K, G, B2, B2, B3, B3, B4, B4, B4, G, K, _, _],
      [_, _, K, G, B2, B3, B3, B4, B4, B4, B4, G, K, _, _],
      [_, _, _, K, G, B3, B4, B4, B4, B4, G, K, _, _, _],
      [_, _, _, _, K, G, G, G, G, G, G, K, _, _, _, _],
      [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- FOOD (パンの形 / Fresh Baked Artisan Bread Loaf & Croissant) ---
  if (key === 'bread' || key === 'magic_bread' || key === 'food' || key.includes('bread')) {
    const isMagic = key === 'magic_bread';
    const W0 = PAL.pureWhite;
    const C1 = isMagic ? PAL.goldGlint : PAL.breadLight;
    const C2 = isMagic ? PAL.goldLight : PAL.breadGolden;
    const C3 = isMagic ? PAL.goldMid : PAL.breadCrust;
    const C4 = isMagic ? PAL.goldDark : PAL.breadShadow;
    const S = PAL.lightningYellow;

    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, K, K, K, K, K, _, _, _, _, _, _],
      [_, _, _, K, K, C2, C1, C1, C2, C3, K, K, _, _, _, _],
      [_, _, K, C2, C1, W0, C1, C2, W0, C2, C3, C4, K, _, _, _],
      [_, K, C2, C1, W0, C1, C2, W0, C2, C3, C3, C4, C4, K, _, _],
      [K, C2, C1, C1, W0, C1, C2, W0, C2, C3, C3, C4, C4, C4, K, _],
      [K, C2, C1, C1, C1, W0, C2, C2, W0, C3, C3, C4, C4, C4, K, _],
      [K, C3, C2, C2, C2, C2, C2, C2, C2, C3, C3, C4, C4, C4, K, _],
      [K, C3, C3, C2, isMagic ? W0 : C2, C2, isMagic ? S : C2, C3, C3, C4, C4, C4, C4, C4, K, _],
      [_, K, C4, C3, C3, C3, C3, C3, C4, C4, C4, C4, C4, K, _, _],
      [_, _, K, K, C4, C4, C4, C4, C4, C4, C4, K, K, _, _, _],
      [_, _, _, _, K, K, K, K, K, K, K, K, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- SCROLLS (巻物の形 / Rolled Parchment Scroll with Golden Wax Seal & Crimson Ribbon) ---
  if (key === 'scroll' || key.includes('scroll')) {
    const P0 = PAL.pureWhite;
    const P1 = PAL.scrollPaper;
    const P2 = PAL.scrollMid;
    const P3 = PAL.scrollDark;
    const R1 = PAL.rubyLight;
    const R2 = PAL.rubyDark;
    const G1 = PAL.goldLight;
    const G2 = PAL.goldMid;
    const Ink = PAL.outline;

    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, K, K, K, K, K, K, K, K, _, _, _, _],
      [_, _, _, K, P0, P1, P1, P1, P1, P2, P2, P3, K, _, _, _],
      [_, _, K, P0, P1, P1, P1, P1, P1, P2, P2, P3, P3, K, _, _],
      [_, _, K, P1, P1, Ink, Ink, P1, P2, P2, Ink, P3, P3, K, _, _],
      [_, _, K, P1, P1, P1, P1, P2, P2, P2, P2, P3, P3, K, _, _],
      [_, _, K, R1, R1, R1, G1, G1, R2, R2, R2, R2, K, K, _, _],
      [_, _, K, R1, R1, R1, G1, G2, R2, R2, R2, R2, K, K, _, _],
      [_, _, K, P1, P1, P1, P2, P2, P2, P2, P3, P3, P3, K, _, _],
      [_, _, K, P1, Ink, Ink, P2, P2, Ink, Ink, P3, P3, P3, K, _, _],
      [_, _, K, P1, P2, P2, P2, P2, P2, P3, P3, P3, P3, K, _, _],
      [_, _, K, P2, P2, P2, P3, P3, P3, P3, P3, P3, P3, K, _, _],
      [_, _, _, K, P2, P2, P3, P3, P3, P3, P3, P3, K, _, _, _],
      [_, _, _, _, K, K, K, K, K, K, K, K, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- WANDS ---
  if (key.includes('wand')) {
    const isLightning = key.includes('lightning');
    const isSleep = key.includes('sleep');
    const isWarp = key.includes('warp');

    const Orb1 = isLightning ? PAL.pureWhite : isSleep ? PAL.purpleGlow : isWarp ? PAL.warpPink : PAL.windCyan;
    const Orb2 = isLightning ? PAL.lightningYellow : isSleep ? PAL.purpleLight : isWarp ? PAL.warpPink : PAL.windCyan;
    const Orb3 = isLightning ? PAL.goldMid : isSleep ? PAL.purpleMid : isWarp ? PAL.purpleDark : PAL.waterDark;

    const S1 = isLightning ? PAL.goldLight : PAL.ironLight;
    const W1 = PAL.leatherTan;
    const W2 = PAL.leatherMid;
    const W3 = PAL.leatherDark;

    return [
      [_, _, _, _, _, _, _, _, _, _, _, K, Orb1, Orb1, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, Orb1, Orb1, Orb2, Orb2, K],
      [_, _, _, _, _, _, _, _, _, _, K, Orb1, Orb2, Orb3, Orb3, K],
      [_, _, _, _, _, _, _, _, _, _, _, K, Orb3, Orb3, K, _],
      [_, _, _, _, _, _, _, _, _, _, K, S1, S1, K, _, _],
      [_, _, _, _, _, _, _, _, _, K, W1, W2, K, _, _, _],
      [_, _, _, _, _, _, _, _, K, W1, W2, K, _, _, _, _],
      [_, _, _, _, _, _, _, K, W1, W2, K, _, _, _, _, _],
      [_, _, _, _, _, _, K, W1, W2, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, W1, W2, K, _, _, _, _, _, _, _],
      [_, _, _, _, K, W1, W2, K, _, _, _, _, _, _, _, _],
      [_, _, _, K, W2, W3, K, _, _, _, _, _, _, _, _, _],
      [_, _, K, W2, W3, K, _, _, _, _, _, _, _, _, _, _],
      [_, K, S1, S1, K, _, _, _, _, _, _, _, _, _, _, _],
      [_, K, K, K, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // --- GOLD COINS ---
  if (key === 'gold' || key === 'gold_coins') {
    const G1 = PAL.pureWhite;
    const G2 = PAL.goldLight;
    const G3 = PAL.goldMid;
    const G4 = PAL.goldDark;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
      [_, _, _, _, _, K, G1, G2, G2, G3, K, _, _, _, _, _],
      [_, _, _, _, K, G1, G2, G3, G3, G3, G4, K, _, _, _, _],
      [_, _, _, K, G1, G2, G4, K, K, G4, G4, K, _, _, _, _],
      [_, _, K, G1, G2, G4, K, G2, G2, K, G4, K, _, _, _, _],
      [_, K, G1, G2, G4, K, G1, G2, G3, G4, K, G4, K, _, _, _],
      [K, G1, G2, G4, K, G1, G2, G3, G3, G4, K, G4, K, _, _],
      [K, G1, G2, G3, G3, G3, G3, G4, G4, G4, G4, G4, K, _, _],
      [K, G2, G3, G4, G4, G4, G4, G4, G4, G4, G4, G4, K, _, _],
      [_, K, G4, G4, G4, G4, G4, G4, G4, G4, G4, K, _, _, _],
      [_, _, K, K, K, K, K, K, K, K, K, K, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  // Category-based intelligent fallbacks (ensure typed items never fall back to generic blob)
  const resolvedType = itemType || (typeof itemOrKey === 'object' && itemOrKey ? itemOrKey.type : undefined);
  if (resolvedType) {
    if (resolvedType === 'weapon') return getItemMatrix('copper_sword');
    if (resolvedType === 'armor') return getItemMatrix('leather_armor');
    if (resolvedType === 'shield') return getItemMatrix('leather_shield');
    if (resolvedType === 'helmet') return getItemMatrix('iron_helm');
    if (resolvedType === 'food') return getItemMatrix('bread');
    if (resolvedType === 'herb') return getItemMatrix('yakusou');
    if (resolvedType === 'scroll') return getItemMatrix('scroll');
    if (resolvedType === 'wand') return getItemMatrix('wand_lightning');
  }

  // Fallback item matrix (Treasure chest / gold pouch)
  return [
    [_, _, _, _, K, K, K, K, K, K, _, _, _, _, _, _],
    [_, _, _, K, PAL.goldLight, PAL.goldLight, PAL.goldLight, PAL.goldLight, PAL.goldMid, PAL.goldMid, K, _, _, _, _, _],
    [_, _, K, PAL.goldLight, PAL.goldLight, PAL.goldMid, PAL.goldMid, PAL.goldMid, PAL.goldDark, PAL.goldDark, K, _, _, _, _],
    [_, K, PAL.goldLight, PAL.goldMid, PAL.goldMid, PAL.goldMid, PAL.goldDark, PAL.goldDark, PAL.goldDark, PAL.goldDark, K, _, _, _],
    [_, K, PAL.goldLight, PAL.goldMid, PAL.goldMid, PAL.goldMid, PAL.goldDark, PAL.goldDark, PAL.goldDark, PAL.goldDark, K, _, _, _],
    [_, _, K, PAL.goldLight, PAL.goldMid, PAL.goldMid, PAL.goldDark, PAL.goldDark, PAL.goldDark, PAL.goldDark, K, _, _, _, _],
    [_, _, _, K, PAL.goldMid, PAL.goldDark, PAL.goldDark, PAL.goldDark, PAL.goldDark, PAL.goldDark, K, _, _, _, _, _],
    [_, _, _, _, K, K, K, K, K, K, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ];
}

// ==========================================
// 3. CANVAS DRAWING PROCEDURES
// ==========================================

/**
 * Draws Monster sprite by key onto canvas
 */
export function drawMonster(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tileSize: number,
  spriteKey: string,
  isBoss: boolean = false,
  isSleeping: boolean = false
) {
  const cacheKey = `${spriteKey}_${tileSize}`;
  let spriteCanvas = spriteCanvasCache.get(cacheKey);

  if (!spriteCanvas) {
    const matrix = getMonsterMatrix(spriteKey);
    const matrixSize = Math.max(matrix.length, matrix[0]?.length || 16);
    const scale = Math.max(1, Math.floor(tileSize / matrixSize));
    spriteCanvas = createPixelCanvas(matrix, scale);
    spriteCanvasCache.set(cacheKey, spriteCanvas);
  }

  ctx.save();

  // Subtle breathing animation for all living creatures, stronger pulse for bosses
  const breath = Math.sin(Date.now() / (isBoss ? 200 : 350)) * (isBoss ? 0.06 : 0.025);
  const cx = px + tileSize / 2;
  const cy = py + tileSize / 2;
  ctx.translate(cx, cy);
  ctx.scale(1 + breath, 1 - breath * 0.5);
  ctx.translate(-cx, -cy);

  // Shadow underneath
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(
    px + tileSize / 2,
    py + tileSize - 3,
    tileSize * (isBoss ? 0.44 : 0.36),
    tileSize * 0.14,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw sprite centered in tile
  const sw = spriteCanvas.width;
  const sh = spriteCanvas.height;
  const dx = px + (tileSize - sw) / 2;
  const dy = py + (tileSize - sh) / 2 - 1;

  ctx.drawImage(spriteCanvas, dx, dy);

  // Boss magical aura glimmers
  if (isBoss) {
    const auraColor = spriteKey === 'zoma' ? 'rgba(72, 202, 228, 0.25)' : 'rgba(230, 57, 70, 0.22)';
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, tileSize * 0.46, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Sleeping Zzz overlay
  if (isSleeping) {
    ctx.font = 'bold 12px DotGothic16, monospace';
    ctx.fillStyle = '#64b5f6';
    const zOffset = (Date.now() / 140) % 12;
    ctx.fillText('Zzz', px + tileSize - 10, py + 12 - zOffset);
  }

  ctx.restore();
}

/**
 * Draws Hero with equipment layers and facing directions
 */
export function drawHero(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tileSize: number,
  equipment: PlayerEquipment,
  direction: Direction,
  isMoving: boolean = false,
  isAttacking: boolean = false
) {
  const pScale = tileSize / 16;
  ctx.save();
  ctx.translate(px, py);

  const bobOffset = isMoving ? Math.sin(Date.now() / 80) * 1.5 : 0;
  const attackOffset = isAttacking ? 3 : 0;

  // Equipment IDs
  const armorId = equipment.armor?.id || 'cloth';
  const weaponId = equipment.weapon?.id || 'fist';
  const shieldId = equipment.shield?.id || 'none';
  const helmetId = equipment.helmet?.id || 'band';

  // Armor Tier Colors
  let armorBase = PAL.tunicBlue;
  let armorLight = PAL.tunicLight;
  let armorDark = PAL.tunicDark;
  let capeColor = PAL.rubyLight;
  let hasLotoWings = false;

  if (armorId.includes('leather')) {
    armorBase = PAL.leatherMid;
    armorLight = PAL.leatherTan;
    armorDark = PAL.leatherDark;
  } else if (armorId.includes('iron') || armorId.includes('steel')) {
    armorBase = PAL.ironMid;
    armorLight = PAL.ironHighlight;
    armorDark = PAL.ironDark;
    capeColor = PAL.rubyMid;
  } else if (armorId.includes('loto')) {
    armorBase = PAL.lotoBlueMid;
    armorLight = PAL.lotoBlueGleam;
    armorDark = PAL.lotoBlueDark;
    capeColor = PAL.lotoBlueMid;
  }

  // Helmet Colors
  let helmColor = PAL.rubyLight; // iconic red hero headband
  if (helmetId.includes('iron')) {
    helmColor = PAL.ironLight;
  } else if (helmetId.includes('loto')) {
    helmColor = PAL.goldLight;
    hasLotoWings = true;
  }

  // Pixel drawing helpers
  const drawP = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(x * pScale),
      Math.floor((y + bobOffset) * pScale),
      Math.ceil(pScale),
      Math.ceil(pScale)
    );
  };

  const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(x * pScale),
      Math.floor((y + bobOffset) * pScale),
      Math.ceil(w * pScale),
      Math.ceil(h * pScale)
    );
  };

  // Flip if facing West, NW, or SW
  const flip = direction === 'W' || direction === 'NW' || direction === 'SW';
  if (flip) {
    ctx.translate(tileSize, 0);
    ctx.scale(-1, 1);
  }

  // 1. Soft Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(8 * pScale, 15 * pScale, 5.5 * pScale, 2.2 * pScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const isBack = direction === 'N';
  const isSide = direction === 'E' || direction === 'NE' || flip;

  // 2. Legs / Boots (with stride animation)
  const legShift = isMoving ? Math.sin(Date.now() / 70) * 1.8 : 0;
  if (!isSide) {
    drawRect(5, 12 - legShift, 2, 3 + legShift, PAL.leatherDark);
    drawRect(9, 12 + legShift, 2, 3 - legShift, PAL.leatherDark);
    drawRect(5, 14 - legShift, 2, 2 + legShift, PAL.outline);
    drawRect(9, 14 + legShift, 2, 2 - legShift, PAL.outline);
  } else {
    drawRect(6, 12 - legShift, 3, 3 + legShift, PAL.leatherDark);
    drawRect(8, 12 + legShift, 3, 3 - legShift, PAL.leatherDark);
    drawRect(6, 14 - legShift, 3, 2 + legShift, PAL.outline);
    drawRect(8, 14 + legShift, 3, 2 - legShift, PAL.outline);
  }

  // 3. Back Cape (if facing North or moving)
  if (isBack) {
    drawRect(4, 6, 8, 8, capeColor);
    drawRect(5, 7, 6, 6, armorId.includes('loto') ? PAL.lotoBlueLight : PAL.rubyDark);
  }

  // 4. Body / Armor
  if (!isBack) {
    drawRect(5, 6, 6, 6, armorBase);
    drawRect(6, 7, 4, 4, armorLight);
    // Belt & buckle
    drawRect(5, 11, 6, 1, PAL.outline);
    drawRect(7, 11, 2, 1, PAL.goldLight);

    if (armorId.includes('loto')) {
      // Golden Phoenix solar crest on chest
      drawP(7, 8, PAL.goldLight);
      drawP(8, 8, PAL.goldLight);
      drawP(7, 9, PAL.rubyLight);
      drawP(8, 9, PAL.goldMid);
    }
  }

  // 5. Head & Spiky Hair
  if (!isBack) {
    // Face skin
    drawRect(5, 3, 6, 4, PAL.skin);
    // Hair framing
    drawRect(4, 2, 8, 2, PAL.hairMid);
    drawRect(4, 3, 2, 3, PAL.hairMid);
    drawRect(10, 3, 2, 3, PAL.hairDark);

    // Eyes
    if (!isSide) {
      drawP(6, 5, PAL.outline);
      drawP(9, 5, PAL.outline);
      drawP(6, 4, PAL.pureWhite);
      drawP(9, 4, PAL.pureWhite);
    } else {
      drawP(9, 5, PAL.outline);
      drawP(9, 4, PAL.pureWhite);
    }
  } else {
    // Back of head (all hair)
    drawRect(4, 2, 8, 5, PAL.hairMid);
    drawRect(5, 3, 6, 4, PAL.hairDark);
  }

  // Spiky hair tufts on top
  drawP(5, 1, PAL.hairMid);
  drawP(7, 0, PAL.hairLight);
  drawP(8, 0, PAL.hairMid);
  drawP(9, 1, PAL.hairDark);

  // 6. Headband / Helmet
  drawRect(4, 3, 8, 1, helmColor);
  if (hasLotoWings) {
    drawP(3, 1, PAL.goldLight);
    drawP(3, 2, PAL.goldMid);
    drawP(12, 1, PAL.goldLight);
    drawP(12, 2, PAL.goldMid);
    if (!isBack) drawP(7, 3, PAL.rubyLight);
  }

  // 7. Shield (Left Arm)
  if (shieldId !== 'none' && !isBack) {
    let sBase = PAL.leatherMid;
    let sTrim = PAL.leatherTan;
    if (shieldId.includes('bronze') || shieldId.includes('scale')) {
      sBase = PAL.bronzeMid;
      sTrim = PAL.bronzeLight;
    } else if (shieldId.includes('iron') || shieldId.includes('steel')) {
      sBase = PAL.ironMid;
      sTrim = PAL.ironHighlight;
    } else if (shieldId.includes('loto')) {
      sBase = PAL.lotoBlueMid;
      sTrim = PAL.goldLight;
    }

    drawRect(1, 6, 4, 7, sBase);
    drawRect(2, 7, 2, 5, sTrim);

    if (shieldId.includes('loto')) {
      drawP(2, 8, PAL.goldLight);
      drawP(3, 8, PAL.rubyLight);
      drawP(2, 9, PAL.goldLight);
    }
  }

  // 8. Weapon (Right Arm)
  if (weaponId !== 'fist') {
    const wX = 11 + attackOffset;
    const wY = 5 - (isAttacking ? 2 : 0);

    let bladeBase = PAL.ironLight;
    let bladeLight = PAL.ironHighlight;
    let guardColor = PAL.goldMid;

    if (weaponId.includes('stick')) {
      bladeBase = PAL.leatherMid;
      bladeLight = PAL.leatherTan;
      guardColor = PAL.leatherDark;
    } else if (weaponId.includes('flame')) {
      bladeBase = PAL.rubyLight;
      bladeLight = PAL.fireOrange;
      guardColor = PAL.goldLight;
    } else if (weaponId.includes('falcon')) {
      bladeBase = PAL.emeraldGreen;
      bladeLight = PAL.pureWhite;
      guardColor = PAL.goldLight;
    } else if (weaponId.includes('loto')) {
      bladeBase = PAL.lotoBlueLight;
      bladeLight = PAL.pureWhite;
      guardColor = PAL.goldLight;
    }

    // Blade
    drawRect(wX, wY - 4, 2, 7, bladeBase);
    drawP(wX, wY - 5, bladeLight);
    drawP(wX, wY - 3, bladeLight);
    // Guard & Pommel
    drawRect(wX - 1, wY + 3, 4, 1, guardColor);
    drawRect(wX, wY + 4, 2, 2, guardColor);

    // Dynamic Attack Slash Arc
    if (isAttacking) {
      ctx.strokeStyle = weaponId.includes('flame')
        ? PAL.fireOrange
        : weaponId.includes('loto')
        ? PAL.lotoBlueGleam
        : PAL.pureWhite;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc((wX + 3) * pScale, wY * pScale, 10 * pScale, -Math.PI / 3, Math.PI / 4);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draws Item on dungeon floor with floating bob and floor shadow
 */
export function drawItem(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tileSize: number,
  item: Item
) {
  const pScale = tileSize / 16;
  ctx.save();
  ctx.translate(px, py);

  // Smooth floating bob animation
  const bob = Math.sin((Date.now() + px * 12 + py * 15) / 220) * (2 * pScale);

  // Soft floor shadow (scales inversely with height)
  const shadowScale = 1 - bob * 0.05;
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(8 * pScale, 14 * pScale, 5 * pScale * shadowScale, 2 * pScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bob);

  // Golden shimmer aura for rare / legendary items
  const isLegendary = item.id.includes('loto') || item.id === 'sekaiju_leaf';
  if (isLegendary) {
    const auraPulse = Math.sin(Date.now() / 180) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.15 + auraPulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(8 * pScale, 8 * pScale, 7 * pScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw cached offscreen sprite
  const itemKey = item.spriteKey || item.defId || item.id;
  const cacheKey = `${itemKey}_${tileSize}`;
  let spriteCanvas = itemCanvasCache.get(cacheKey);

  if (!spriteCanvas) {
    const matrix = getItemMatrix(item);
    const scale = Math.max(1, Math.floor(tileSize / 16));
    spriteCanvas = createPixelCanvas(matrix, scale);
    itemCanvasCache.set(cacheKey, spriteCanvas);
  }

  const sw = spriteCanvas.width;
  const sh = spriteCanvas.height;
  const dx = (tileSize - sw) / 2;
  const dy = (tileSize - sh) / 2;

  ctx.drawImage(spriteCanvas, dx, dy);

  ctx.restore();
}

/**
 * Renders an Item's detailed pixel sprite directly onto an arbitrary HTMLCanvasElement
 */
export function renderItemToCanvas(canvas: HTMLCanvasElement, item: Item | string, size: number = 24) {
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;

  const key = typeof item === 'string' ? item : item.spriteKey || item.defId || item.id;
  const cacheKey = `${key}_${size}`;
  let spriteCanvas = itemCanvasCache.get(cacheKey);

  if (!spriteCanvas) {
    const matrix = getItemMatrix(item);
    const scale = Math.max(1, Math.floor(size / 16));
    spriteCanvas = createPixelCanvas(matrix, scale);
    itemCanvasCache.set(cacheKey, spriteCanvas);
  }

  const sw = spriteCanvas.width;
  const sh = spriteCanvas.height;
  const dx = Math.floor((size - sw) / 2);
  const dy = Math.floor((size - sh) / 2);

  ctx.drawImage(spriteCanvas, dx, dy);
}
