/**
 * Monster catalog and floor spawn logic
 * Accurately tuned for progressive difficulty across 30+ floors
 */

import { Monster, MonsterAI } from '../types/game';

export interface MonsterDef {
  defId: string;
  name: string;
  spriteKey: string;
  minFloor: number;
  maxFloor: number;
  weight: number;
  hp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
  speed: number;
  ai: MonsterAI;
  isBoss?: boolean;
  description: string;
}

export const MONSTER_DEFINITIONS: Record<string, MonsterDef> = {
  // 1F - 4F: Early encounters
  slime: {
    defId: 'slime',
    name: 'スライム',
    spriteKey: 'slime',
    minFloor: 1,
    maxFloor: 4,
    weight: 10,
    hp: 8,
    attack: 4,
    defense: 2,
    exp: 3,
    gold: 5,
    speed: 1,
    ai: 'chase',
    description: 'ぷるぷるしたモンスター。冒険者が最初に出会う相手。',
  },
  raven: {
    defId: 'raven',
    name: 'おおがらす',
    spriteKey: 'raven',
    minFloor: 1,
    maxFloor: 5,
    weight: 8,
    hp: 12,
    attack: 6,
    defense: 3,
    exp: 5,
    gold: 8,
    speed: 1,
    ai: 'chase',
    description: '鋭いくちばしで襲いかかってくる凶暴な黒いカラス。',
  },
  anteater: {
    defId: 'anteater',
    name: 'おおありくい',
    spriteKey: 'anteater',
    minFloor: 2,
    maxFloor: 6,
    weight: 7,
    hp: 16,
    attack: 8,
    defense: 4,
    exp: 8,
    gold: 12,
    speed: 1,
    ai: 'chase',
    description: '長い鼻と硬い毛皮を持つ獣。攻撃力が高め。',
  },
  she_slime: {
    defId: 'she_slime',
    name: 'スライムベス',
    spriteKey: 'she_slime',
    minFloor: 3,
    maxFloor: 8,
    weight: 6,
    hp: 20,
    attack: 11,
    defense: 5,
    exp: 12,
    gold: 15,
    speed: 1,
    ai: 'chase',
    description: '赤い体を持つスライム。通常のスライムより手ごわい。',
  },

  // 5F - 9F: Intermediate beasts and spellcasters
  dracky: {
    defId: 'dracky',
    name: 'ドラキー',
    spriteKey: 'dracky',
    minFloor: 4,
    maxFloor: 11,
    weight: 7,
    hp: 24,
    attack: 13,
    defense: 6,
    exp: 18,
    gold: 18,
    speed: 2, // 2 actions per player turn!
    ai: 'double_speed',
    description: '俊敏なコウモリ。倍速で迫りくるので囲まれると危険！',
  },
  crab: {
    defId: 'crab',
    name: 'ぐんたいがに',
    spriteKey: 'crab',
    minFloor: 6,
    maxFloor: 12,
    weight: 6,
    hp: 30,
    attack: 16,
    defense: 16, // Very high defense
    exp: 26,
    gold: 25,
    speed: 1,
    ai: 'chase',
    description: '甲殻が極めて硬い蟹。物理攻撃が通りにくい。',
  },
  magician: {
    defId: 'magician',
    name: 'まほうつかい',
    spriteKey: 'magician',
    minFloor: 7,
    maxFloor: 13,
    weight: 5,
    hp: 28,
    attack: 12,
    defense: 8,
    exp: 34,
    gold: 32,
    speed: 1,
    ai: 'ranged_magic',
    description: '遠距離からギラを放ってくる魔術師。射程に注意。',
  },

  // 10F - 16F: Tougher warriors
  skeleton: {
    defId: 'skeleton',
    name: 'がいこつ',
    spriteKey: 'skeleton',
    minFloor: 10,
    maxFloor: 18,
    weight: 6,
    hp: 45,
    attack: 26,
    defense: 14,
    exp: 55,
    gold: 45,
    speed: 1,
    ai: 'chase',
    description: 'カタカタと骨を鳴らし、強烈な痛恨の一撃を繰り出す。',
  },
  restless_armor: {
    defId: 'restless_armor',
    name: 'さまようよろい',
    spriteKey: 'restless_armor',
    minFloor: 12,
    maxFloor: 20,
    weight: 5,
    hp: 60,
    attack: 34,
    defense: 22,
    exp: 80,
    gold: 70,
    speed: 1,
    ai: 'summoner',
    description: '命を宿した呪いの甲冑。ホイミスライムを呼ぶことがある。',
  },
  chimera: {
    defId: 'chimera',
    name: 'キメラ',
    spriteKey: 'chimera',
    minFloor: 14,
    maxFloor: 22,
    weight: 5,
    hp: 75,
    attack: 42,
    defense: 24,
    exp: 120,
    gold: 95,
    speed: 1,
    ai: 'breath',
    description: '空中から火の息を吐きつける魔獣。',
  },

  // 17F - 24F: High-danger fiends
  goldman: {
    defId: 'goldman',
    name: 'ゴールドマン',
    spriteKey: 'goldman',
    minFloor: 17,
    maxFloor: 26,
    weight: 3,
    hp: 110,
    attack: 52,
    defense: 35,
    exp: 200,
    gold: 300,
    speed: 1,
    ai: 'chase',
    description: '純金でできたゴーレム。倒すと大金が手に入るが攻撃力は絶大。',
  },
  dragon: {
    defId: 'dragon',
    name: 'ドラゴン',
    spriteKey: 'dragon',
    minFloor: 20,
    maxFloor: 29,
    weight: 4,
    hp: 150,
    attack: 65,
    defense: 38,
    exp: 350,
    gold: 180,
    speed: 1,
    ai: 'breath',
    description: '灼熱の炎を直線状に吹き付ける巨竜。',
  },

  // 25F Boss: Baramos
  baramos: {
    defId: 'baramos',
    name: '魔王バラモス',
    spriteKey: 'baramos',
    minFloor: 25,
    maxFloor: 25,
    weight: 1,
    hp: 450,
    attack: 85,
    defense: 45,
    exp: 1500,
    gold: 1000,
    speed: 1,
    ai: 'boss',
    isBoss: true,
    description: '地下迷宮を支配する大魔王の腹心。メラゾーマと激しい炎を使う。',
  },

  // 30F+ Final Boss: Zoma
  zoma: {
    defId: 'zoma',
    name: '大魔王ゾーマ',
    spriteKey: 'zoma',
    minFloor: 30,
    maxFloor: 99,
    weight: 1,
    hp: 999,
    attack: 120,
    defense: 60,
    exp: 5000,
    gold: 5000,
    speed: 1,
    ai: 'boss',
    isBoss: true,
    description: '全ての闇を司る大魔王。凍える吹雪とマヒャドで万物を葬る。',
  },
};

/**
 * Creates a runtime Monster instance for a given floor
 * Scaled so defeating ~3-4 monsters on floor N grants enough EXP to level up from N to N+1
 */
export function createMonsterInstance(defId: string, x: number, y: number, floorNumber: number): Monster {
  const def = MONSTER_DEFINITIONS[defId] || MONSTER_DEFINITIONS.slime;
  // Floor scaling factor
  const floorDelta = Math.max(0, floorNumber - def.minFloor);
  const statScale = 1 + floorDelta * 0.035;

  const maxHp = Math.round(def.hp * statScale);
  const attack = Math.round(def.attack * statScale);
  const defense = Math.round(def.defense * statScale);
  const gold = Math.round(def.gold * statScale);

  // Exp tuned so ~3-4 monsters per floor guarantees 1 level up per floor
  // Level N -> N+1 requires N * 40 EXP. Thus each monster gives ~floorNumber * 11 to 14 EXP.
  let exp = Math.round(floorNumber * 12 + (def.weight < 5 ? 5 : 0));
  if (def.isBoss) {
    if (defId === 'baramos') exp = 2000;
    else if (defId === 'zoma') exp = 9999;
  }

  return {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    defId: def.defId,
    name: def.name,
    x,
    y,
    direction: 'S',
    hp: maxHp,
    maxHp,
    attack,
    defense,
    exp,
    gold,
    speed: def.speed,
    speedCounter: 0,
    ai: def.ai,
    spriteKey: def.spriteKey,
    isBoss: def.isBoss,
  };
}

/**
 * Selects a monster randomly weighted by floor level
 */
export function getSpawnMonsterDefId(floorNumber: number): string {
  if (floorNumber === 25) return 'baramos';
  if (floorNumber === 30) return 'zoma';

  const candidates: { defId: string; weight: number }[] = [];
  for (const def of Object.values(MONSTER_DEFINITIONS)) {
    if (def.isBoss) continue;
    if (floorNumber >= def.minFloor && floorNumber <= def.maxFloor) {
      candidates.push({ defId: def.defId, weight: def.weight });
    }
  }

  if (candidates.length === 0) return 'slime';

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let r = Math.random() * totalWeight;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.defId;
  }
  return candidates[0].defId;
}
