/**
 * Spells and skills learned by the Hero through leveling up
 */

import { Spell } from '../types/game';

export const ALL_SPELLS: Spell[] = [
  {
    id: 'hoimi',
    name: 'ホイミ',
    mpCost: 3,
    learnedLevel: 2,
    description: '傷を癒し、HPを35回復する初級回復呪文。',
    targetType: 'self',
    power: 35,
    effectType: 'heal',
    animation: 'heal',
  },
  {
    id: 'gira',
    name: 'ギラ',
    mpCost: 4,
    learnedLevel: 4,
    description: '正面一直線（最大4マス）に閃光と炎を放ち、25のダメージ。',
    targetType: 'front_line',
    range: 4,
    power: 25,
    effectType: 'fire',
    animation: 'fire',
  },
  {
    id: 'rariho',
    name: 'ラリホー',
    mpCost: 5,
    learnedLevel: 7,
    description: '周囲8マスの敵に甘い息を吹きかけ、3〜5ターン眠らせる。',
    targetType: 'surrounding',
    effectType: 'sleep',
    animation: 'spark',
  },
  {
    id: 'behoimi',
    name: 'ベホイミ',
    mpCost: 7,
    learnedLevel: 10,
    description: '慈愛の光でHPを90大幅に回復する中級回復呪文。',
    targetType: 'self',
    power: 90,
    effectType: 'heal',
    animation: 'heal',
  },
  {
    id: 'ruula',
    name: 'ルーラ',
    mpCost: 6,
    learnedLevel: 13,
    description: '光となってこのフロアの別の部屋へ一瞬でワープする。危機脱出に便利。',
    targetType: 'self',
    effectType: 'teleport',
    animation: 'spark',
  },
  {
    id: 'hayabusa_slash',
    name: 'はやぶさ斬り',
    mpCost: 8,
    learnedLevel: 16,
    description: '目にも留まらぬ速さで正面の敵に2連続の強力な斬撃を浴びせる！',
    targetType: 'target',
    power: 2, // 2 strikes
    effectType: 'double_slash',
    animation: 'slash',
  },
  {
    id: 'begirama',
    name: 'ベギラマ',
    mpCost: 10,
    learnedLevel: 20,
    description: '正面一直線上のすべての敵を激しい閃熱で焼き払う（55ダメージ）。',
    targetType: 'front_line',
    range: 6,
    power: 55,
    effectType: 'fire',
    animation: 'fire',
  },
  {
    id: 'gigaslash',
    name: 'ギガスラッシュ',
    mpCost: 16,
    learnedLevel: 25,
    description: '刀身に雷光を宿し、正面を含む3x3範囲の敵に110の大ダメージ！',
    targetType: 'surrounding',
    power: 110,
    effectType: 'lightning',
    animation: 'lightning',
  },
  {
    id: 'ionazun',
    name: 'イオナズン',
    mpCost: 22,
    learnedLevel: 30,
    description: '部屋全体を包む超爆発を引き起こし、視界内のすべての敵に160の致命傷！',
    targetType: 'room',
    power: 160,
    effectType: 'explosion',
    animation: 'explosion',
  },
];

/**
 * Checks for newly learned spells upon leveling up
 */
export function getSpellsForLevel(level: number): Spell[] {
  return ALL_SPELLS.filter((spell) => spell.learnedLevel <= level);
}
