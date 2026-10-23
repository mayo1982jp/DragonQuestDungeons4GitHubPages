/**
 * Item definitions and generation catalog
 * Includes weapons, shields, armor, helmets, consumables, scrolls, and staves
 */

import { Item, ItemType } from '../types/game';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  power?: number;
  healAmount?: number;
  fullnessAmount?: number;
  charges?: number;
  value: number;
  spriteKey: string;
  minFloor: number;
}

export const ITEM_CATALOG: ItemDef[] = [
  // Weapons
  {
    id: 'stick',
    name: 'ひのきのぼう',
    type: 'weapon',
    description: 'ヒノキで作られた素朴な棒。素手よりは少し強い。',
    icon: '🦯',
    power: 2,
    value: 20,
    spriteKey: 'stick',
    minFloor: 1,
  },
  {
    id: 'copper_sword',
    name: 'どうのつるぎ',
    type: 'weapon',
    description: '青銅で鍛えられた初心者向けの剣。扱いやすい。',
    icon: '🗡️',
    power: 5,
    value: 80,
    spriteKey: 'copper_sword',
    minFloor: 1,
  },
  {
    id: 'iron_sword',
    name: 'はがねのつるぎ',
    type: 'weapon',
    description: '良質の鋼で鍛造された頑丈な剣。安定した威力を誇る。',
    icon: '⚔️',
    power: 12,
    value: 250,
    spriteKey: 'iron_sword',
    minFloor: 5,
  },
  {
    id: 'dragon_killer',
    name: 'ドラゴンキラー',
    type: 'weapon',
    description: '竜の鱗をも切り裂く巨剣。竜系モンスターに大ダメージ。',
    icon: '🗡️',
    power: 20,
    value: 600,
    spriteKey: 'dragon_killer',
    minFloor: 12,
  },
  {
    id: 'falcon_sword',
    name: 'はやぶさのけん',
    type: 'weapon',
    description: '神速の斬撃を放つ伝説の名剣。2回連続攻撃が可能！',
    icon: '⚡',
    power: 16,
    value: 1200,
    spriteKey: 'falcon_sword',
    minFloor: 16,
  },
  {
    id: 'flame_sword',
    name: 'ほのおのつるぎ',
    type: 'weapon',
    description: '刀身に紅蓮の炎を宿す聖剣。アンデッドや冷気に強い。',
    icon: '🔥',
    power: 28,
    value: 1800,
    spriteKey: 'flame_sword',
    minFloor: 20,
  },
  {
    id: 'loto_sword',
    name: 'ロトのつるぎ',
    type: 'weapon',
    description: '太古の勇者が振るった伝説の神剣。魔を切り裂く圧倒的威力を誇る。見た目も神々しく変化する！',
    icon: '🌟',
    power: 45,
    value: 5000,
    spriteKey: 'loto_sword',
    minFloor: 22,
  },

  // Shields
  {
    id: 'leather_shield',
    name: 'かわのたて',
    type: 'shield',
    description: 'なめした革で作られた軽い盾。持ち運びしやすい。',
    icon: '🛡️',
    power: 2,
    value: 30,
    spriteKey: 'leather_shield',
    minFloor: 1,
  },
  {
    id: 'scale_shield',
    name: 'うろこのたて',
    type: 'shield',
    description: '硬いウロコをつなぎ合わせた盾。',
    icon: '🛡️',
    power: 4,
    value: 90,
    spriteKey: 'scale_shield',
    minFloor: 3,
  },
  {
    id: 'bronze_shield',
    name: 'せいどうのたて',
    type: 'shield',
    description: '青銅製の丸盾。敵の攻撃をしっかりと防ぐ。',
    icon: '🛡️',
    power: 8,
    value: 200,
    spriteKey: 'bronze_shield',
    minFloor: 7,
  },
  {
    id: 'iron_shield',
    name: 'はがねのたて',
    type: 'shield',
    description: '鋼鉄で作られた強固な盾。',
    icon: '🛡️',
    power: 14,
    value: 500,
    spriteKey: 'iron_shield',
    minFloor: 13,
  },
  {
    id: 'loto_shield',
    name: 'ロトのたて',
    type: 'shield',
    description: '不死鳥の紋章が刻まれた伝説の盾。あらゆる災厄を弾き返す。',
    icon: '🔰',
    power: 28,
    value: 3500,
    spriteKey: 'loto_shield',
    minFloor: 23,
  },

  // Armor
  {
    id: 'cloth_armor',
    name: 'たびびとのふく',
    type: 'armor',
    description: '動きやすい布の服。旅立ちの標準装備。',
    icon: '🥋',
    power: 1,
    value: 20,
    spriteKey: 'cloth_armor',
    minFloor: 1,
  },
  {
    id: 'leather_armor',
    name: 'かわのよろい',
    type: 'armor',
    description: '動物の皮で作られた鎧。防御力が少し上がる。',
    icon: '🦺',
    power: 4,
    value: 80,
    spriteKey: 'leather_armor',
    minFloor: 2,
  },
  {
    id: 'iron_armor',
    name: 'はがねのよろい',
    type: 'armor',
    description: '頑丈な鉄の板で作られた鎧。見た目も銀色に輝く。',
    icon: '🛡️',
    power: 12,
    value: 400,
    spriteKey: 'iron_armor',
    minFloor: 8,
  },
  {
    id: 'loto_armor',
    name: 'ロトのよろい',
    type: 'armor',
    description: '青き光を放つ伝説の鎧。溶岩や毒のダメージを無効化し、歩くたびに微回復する。見た目も真の勇者へと変貌！',
    icon: '✨',
    power: 32,
    value: 6000,
    spriteKey: 'loto_armor',
    minFloor: 24,
  },

  // Helmets
  {
    id: 'iron_helm',
    name: 'てつのかぶと',
    type: 'helmet',
    description: '鉄で作られた頭部防具。痛恨の一撃のダメージを和らげる。',
    icon: '🪖',
    power: 6,
    value: 350,
    spriteKey: 'iron_helm',
    minFloor: 10,
  },
  {
    id: 'loto_helm',
    name: 'ロトのかぶと',
    type: 'helmet',
    description: '黄金の翼を模した神聖な兜。状態異常にかかりにくくなる。',
    icon: '👑',
    power: 18,
    value: 4000,
    spriteKey: 'loto_helm',
    minFloor: 25,
  },

  // Consumables (Herbs & Potions)
  {
    id: 'yakusou',
    name: 'やくそう',
    type: 'herb',
    description: '傷を癒す緑の薬草。HPを35回復する。',
    icon: '🌿',
    healAmount: 35,
    value: 15,
    spriteKey: 'herb',
    minFloor: 1,
  },
  {
    id: 'jou_yakusou',
    name: '上やくそう',
    type: 'herb',
    description: '良質な薬草。HPを80回復する。',
    icon: '🌱',
    healAmount: 80,
    value: 40,
    spriteKey: 'herb',
    minFloor: 6,
  },
  {
    id: 'toku_yakusou',
    name: '特やくそう',
    type: 'herb',
    description: '秘伝の調合で作られた薬草。HPを150回復する。',
    icon: '🪴',
    healAmount: 150,
    value: 120,
    spriteKey: 'herb',
    minFloor: 14,
  },
  {
    id: 'sekaiju_leaf',
    name: 'せかいじゅの葉',
    type: 'herb',
    description: '所持していると倒れた時にその場で奇跡の全快復活を果たす神木の一葉！',
    icon: '🍃',
    healAmount: 999,
    value: 1500,
    spriteKey: 'herb',
    minFloor: 10,
  },
  {
    id: 'seisui',
    name: 'まほうのせいすい',
    type: 'herb',
    description: '魔力を潤す聖水。MPを25回復する。',
    icon: '💧',
    healAmount: 0,
    value: 60,
    spriteKey: 'potion',
    minFloor: 3,
  },

  // Food (Fullness recovery)
  {
    id: 'bread',
    name: '大きなパン',
    type: 'food',
    description: 'こんがり香ばしいパン。満腹度を50%回復する。',
    icon: '🍞',
    fullnessAmount: 50,
    value: 30,
    spriteKey: 'food',
    minFloor: 1,
  },
  {
    id: 'magic_bread',
    name: '魔法のパン',
    type: 'food',
    description: '満腹度を100%回復し、さらに最大満腹度も5%アップさせる特製パン！',
    icon: '🥐',
    fullnessAmount: 100,
    value: 100,
    spriteKey: 'food',
    minFloor: 5,
  },

  // Scrolls
  {
    id: 'scroll_gira',
    name: 'ギラの巻物',
    type: 'scroll',
    description: '読むと部屋中の敵に炎の熱波を放ち、25ダメージを与える。',
    icon: '📜',
    value: 80,
    spriteKey: 'scroll',
    minFloor: 2,
  },
  {
    id: 'scroll_rariho',
    name: 'ラリホーの巻物',
    type: 'scroll',
    description: '部屋中の敵を心地よい眠りに誘い、数ターン行動不能にする。',
    icon: '📜',
    value: 90,
    spriteKey: 'scroll',
    minFloor: 3,
  },
  {
    id: 'scroll_upgrade_weapon',
    name: '武器強化の巻物',
    type: 'scroll',
    description: '装備中の武器を鍛冶屋の魔力で+1強化し攻撃力を高める！',
    icon: '📜',
    value: 300,
    spriteKey: 'scroll',
    minFloor: 4,
  },
  {
    id: 'scroll_upgrade_shield',
    name: '盾強化の巻物',
    type: 'scroll',
    description: '装備中の盾を+1強化し防御力を高める！',
    icon: '📜',
    value: 300,
    spriteKey: 'scroll',
    minFloor: 4,
  },
  {
    id: 'scroll_ruula',
    name: 'ルーラの巻物',
    type: 'scroll',
    description: 'このフロアの別の部屋へ瞬時にワープする。',
    icon: '📜',
    value: 60,
    spriteKey: 'scroll',
    minFloor: 3,
  },
  {
    id: 'scroll_trap_clear',
    name: 'ワナ消しの巻物',
    type: 'scroll',
    description: 'このフロアに仕掛けられた全てのワナを消滅させる。',
    icon: '📜',
    value: 120,
    spriteKey: 'scroll',
    minFloor: 6,
  },

  // Wands
  {
    id: 'wand_blow',
    name: 'ふきとばしの杖',
    type: 'wand',
    description: '振ると正面の敵を10マス後方へ吹き飛ばし、壁に激突させてダメージ！',
    icon: '🪄',
    charges: 5,
    value: 180,
    spriteKey: 'wand',
    minFloor: 4,
  },
  {
    id: 'wand_sleep',
    name: 'まどろみの杖',
    type: 'wand',
    description: '魔法の光線で当たった敵を深く眠らせる。',
    icon: '🪄',
    charges: 4,
    value: 200,
    spriteKey: 'wand',
    minFloor: 5,
  },
  {
    id: 'wand_lightning',
    name: 'いかずちの杖',
    type: 'wand',
    description: '激しい雷撃を一直線に放ち、射線上の敵に35のダメージ！',
    icon: '🪄',
    charges: 5,
    value: 280,
    spriteKey: 'wand',
    minFloor: 7,
  },
  {
    id: 'wand_warp',
    name: '場所替えの杖',
    type: 'wand',
    description: '当たった敵と自分の位置を一瞬で入れ替える奇策の杖。',
    icon: '🪄',
    charges: 5,
    value: 150,
    spriteKey: 'wand',
    minFloor: 3,
  },
];

/**
 * Creates an Item instance
 */
export function createItemInstance(defId: string, upgradeLevel: number = 0): Item {
  const def = ITEM_CATALOG.find((item) => item.id === defId) || ITEM_CATALOG[0];
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    defId: def.id,
    name: upgradeLevel > 0 ? `${def.name} +${upgradeLevel}` : def.name,
    type: def.type,
    description: def.description,
    icon: def.icon,
    power: (def.power || 0) + upgradeLevel,
    upgradeLevel,
    healAmount: def.healAmount,
    fullnessAmount: def.fullnessAmount,
    charges: def.charges,
    maxCharges: def.charges,
    value: def.value + upgradeLevel * 100,
    spriteKey: def.spriteKey,
    equipped: false,
  };
}

/**
 * Random item generator for floors
 */
export function getRandomFloorItem(floorNumber: number): Item {
  const eligible = ITEM_CATALOG.filter((item) => floorNumber >= item.minFloor);
  const def = eligible[Math.floor(Math.random() * eligible.length)] || ITEM_CATALOG[0];

  // Chance for equipment to be pre-upgraded (+1, +2)
  let upgrade = 0;
  if (['weapon', 'shield'].includes(def.type)) {
    const roll = Math.random();
    if (roll < 0.15 && floorNumber >= 10) upgrade = 2;
    else if (roll < 0.35 && floorNumber >= 5) upgrade = 1;
  }

  return createItemInstance(def.id, upgrade);
}

/**
 * Minimal numeric stat string for items (weapons, shields, armor, herbs, food, wands, etc.)
 */
export function getItemMinimalStat(item: Item): string {
  if (item.type === 'weapon') return `⚔️${item.power ?? 0}`;
  if (item.type === 'shield') return `🛡️${item.power ?? 0}`;
  if (item.type === 'armor') return `🥋${item.power ?? 0}`;
  if (item.type === 'helmet') return `🪖${item.power ?? 0}`;
  if (item.type === 'herb') {
    const isSeisui = (item.defId || item.id || '').includes('seisui') || item.name.includes('せいすい');
    return isSeisui ? '💧+25' : `💚+${item.healAmount || 35}`;
  }
  if (item.type === 'food') return `🍞+${item.fullnessAmount || 50}%`;
  if (item.type === 'wand') return `🪄[${item.charges ?? 0}]`;
  if (item.type === 'scroll') return '📜';
  return '';
}

