/**
 * Core type definitions for Dragon Quest Dungeons
 */

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface Position {
  x: number;
  y: number;
}

export type TileType = 'wall' | 'floor' | 'corridor' | 'stairs' | 'water' | 'lava' | 'trap';

export type TrapType = 'poison' | 'sleep' | 'spinning' | 'bomb' | 'rust' | 'warp';

export interface Trap {
  id: string;
  type: TrapType;
  name: string;
  revealed: boolean;
  x: number;
  y: number;
}

export type FloorTheme = 'cave' | 'ruins' | 'ice' | 'volcano' | 'crypt' | 'citadel';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  seen: boolean; // explored by player
  visible: boolean; // currently in field of view
  roomIndex?: number;
  trap?: Trap;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  isMonsterHouse?: boolean;
}

export type ItemType = 'weapon' | 'shield' | 'armor' | 'helmet' | 'accessory' | 'herb' | 'food' | 'scroll' | 'wand';

export interface Item {
  id: string;
  defId?: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  power?: number; // ATK or DEF
  upgradeLevel?: number; // e.g. +1, +2
  healAmount?: number;
  fullnessAmount?: number;
  charges?: number; // For wands
  maxCharges?: number;
  value: number; // Gold value
  spriteKey: string;
  equipped?: boolean;
}

export interface Spell {
  id: string;
  name: string;
  mpCost: number;
  learnedLevel: number;
  description: string;
  targetType: 'self' | 'target' | 'front_line' | 'room' | 'surrounding';
  range?: number;
  power?: number;
  effectType: 'heal' | 'fire' | 'explosion' | 'lightning' | 'sleep' | 'teleport' | 'double_slash';
  animation: 'heal' | 'fire' | 'lightning' | 'explosion' | 'spark' | 'slash';
}

export type MonsterAI = 'chase' | 'erratic' | 'ranged_magic' | 'double_speed' | 'summoner' | 'breath' | 'boss';

export interface Monster {
  id: string;
  defId: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
  speed: number; // 1 = standard, 2 = double speed (e.g. Dracky)
  speedCounter: number;
  ai: MonsterAI;
  spriteKey: string;
  sleeping?: number; // turns asleep
  paralyzed?: number;
  confused?: number;
  isBoss?: boolean;
}

export interface PlayerEquipment {
  weapon: Item | null;
  shield: Item | null;
  armor: Item | null;
  helmet: Item | null;
  accessory: Item | null;
}

export interface Player {
  x: number;
  y: number;
  direction: Direction;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  fullness: number; // 0 - 100
  maxFullness: number;
  baseAttack: number;
  baseDefense: number;
  exp: number;
  nextExp: number;
  gold: number;
  inventory: Item[];
  maxInventory: number;
  equipment: PlayerEquipment;
  spells: Spell[];
  turns: number;
  sleeping?: number;
  confused?: number;
}

export interface LogMessage {
  id: string;
  text: string;
  type: 'info' | 'combat' | 'item' | 'danger' | 'level' | 'magic';
  turn: number;
}

export interface DungeonFloor {
  floorNumber: number;
  width: number;
  height: number;
  theme: FloorTheme;
  tiles: Tile[][];
  rooms: Room[];
  stairsPos: Position;
  monsters: Monster[];
  items: { item: Item; x: number; y: number }[];
  traps: Trap[];
  isMonsterHouseFloor: boolean;
}

export interface BestiaryEntry {
  defId: string;
  name: string;
  encountered: boolean;
  defeatedCount: number;
  spriteKey: string;
  description: string;
  hp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
  floors: string;
}

export interface GameStats {
  deepestFloor: number;
  monstersDefeated: number;
  totalGoldEarned: number;
  totalTurns: number;
  itemsFound: number;
  adventuresCount: number;
  clearedCount: number;
}

export interface SaveSlot {
  slotId: number;
  timestamp: number;
  playerName: string;
  floor: number;
  level: number;
  hp: number;
  maxHp: number;
  hasSuspendData: boolean;
}

export interface SuspendSaveData {
  player: Player;
  floor: DungeonFloor;
  stats: GameStats;
  turnCount: number;
  bestiary: Record<string, BestiaryEntry>;
}
