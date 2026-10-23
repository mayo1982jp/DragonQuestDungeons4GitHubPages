/**
 * Adventure Book & Save Data Storage Management
 * Supports 3 save slots, mid-dungeon suspend save/resume, bestiary and high scores.
 */

import { BestiaryEntry, GameStats, SaveSlot, SuspendSaveData } from '../types/game';
import { MONSTER_DEFINITIONS } from './monsterData';

const STORAGE_PREFIX = 'dq_rogue_';
const SLOTS_KEY = `${STORAGE_PREFIX}slots`;
const STATS_KEY = `${STORAGE_PREFIX}stats`;
const BESTIARY_KEY = `${STORAGE_PREFIX}bestiary`;

export function getDefaultStats(): GameStats {
  return {
    deepestFloor: 1,
    monstersDefeated: 0,
    totalGoldEarned: 0,
    totalTurns: 0,
    itemsFound: 0,
    adventuresCount: 0,
    clearedCount: 0,
  };
}

export function getDefaultBestiary(): Record<string, BestiaryEntry> {
  const result: Record<string, BestiaryEntry> = {};
  for (const def of Object.values(MONSTER_DEFINITIONS)) {
    result[def.defId] = {
      defId: def.defId,
      name: def.name,
      encountered: false,
      defeatedCount: 0,
      spriteKey: def.spriteKey,
      description: def.description,
      hp: def.hp,
      attack: def.attack,
      defense: def.defense,
      exp: def.exp,
      gold: def.gold,
      floors: def.isBoss ? `${def.minFloor}F` : `${def.minFloor}F〜${def.maxFloor}F`,
    };
  }
  return result;
}

export function loadSaveSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) {
      return [
        { slotId: 1, timestamp: 0, playerName: 'ぼうけんのしょ 1', floor: 1, level: 1, hp: 30, maxHp: 30, hasSuspendData: false },
        { slotId: 2, timestamp: 0, playerName: 'ぼうけんのしょ 2', floor: 1, level: 1, hp: 30, maxHp: 30, hasSuspendData: false },
        { slotId: 3, timestamp: 0, playerName: 'ぼうけんのしょ 3', floor: 1, level: 1, hp: 30, maxHp: 30, hasSuspendData: false },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [
      { slotId: 1, timestamp: 0, playerName: 'ぼうけんのしょ 1', floor: 1, level: 1, hp: 30, maxHp: 30, hasSuspendData: false },
      { slotId: 2, timestamp: 0, playerName: 'ぼうけんのしょ 2', floor: 1, level: 1, hp: 30, maxHp: 30, hasSuspendData: false },
      { slotId: 3, timestamp: 0, playerName: 'ぼうけんのしょ 3', floor: 1, level: 1, hp: 30, maxHp: 30, hasSuspendData: false },
    ];
  }
}

export function saveSlotsMetadata(slots: SaveSlot[]): void {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function saveSuspendData(slotId: number, data: SuspendSaveData): void {
  try {
    const key = `${STORAGE_PREFIX}suspend_${slotId}`;
    localStorage.setItem(key, JSON.stringify(data));

    // Update slots header
    const slots = loadSaveSlots();
    const idx = slots.findIndex((s) => s.slotId === slotId);
    if (idx !== -1) {
      slots[idx].hasSuspendData = true;
      slots[idx].timestamp = Date.now();
      slots[idx].floor = data.floor.floorNumber;
      slots[idx].level = data.player.level;
      slots[idx].hp = data.player.hp;
      slots[idx].maxHp = data.player.maxHp;
      saveSlotsMetadata(slots);
    }
  } catch (err) {
    console.error('Failed to save suspend data:', err);
  }
}

export function loadSuspendData(slotId: number): SuspendSaveData | null {
  try {
    const key = `${STORAGE_PREFIX}suspend_${slotId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteSuspendData(slotId: number): void {
  localStorage.removeItem(`${STORAGE_PREFIX}suspend_${slotId}`);
  const slots = loadSaveSlots();
  const idx = slots.findIndex((s) => s.slotId === slotId);
  if (idx !== -1) {
    slots[idx].hasSuspendData = false;
    saveSlotsMetadata(slots);
  }
}

export function loadGameStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

export function saveGameStats(stats: GameStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function loadBestiary(): Record<string, BestiaryEntry> {
  try {
    const raw = localStorage.getItem(BESTIARY_KEY);
    const defaults = getDefaultBestiary();
    if (!raw) return defaults;
    const stored = JSON.parse(raw);
    return { ...defaults, ...stored };
  } catch {
    return getDefaultBestiary();
  }
}

export function recordMonsterEncounter(defId: string, defeated: boolean = false): void {
  const bestiary = loadBestiary();
  if (bestiary[defId]) {
    bestiary[defId].encountered = true;
    if (defeated) {
      bestiary[defId].defeatedCount = (bestiary[defId].defeatedCount || 0) + 1;
    }
    localStorage.setItem(BESTIARY_KEY, JSON.stringify(bestiary));
  }
}
