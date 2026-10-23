/**
 * Master Turn-Based Roguelike Game Engine
 * Coordinates player actions, monster AI turns, combat calculations,
 * status effects, hunger, and level progression.
 */

import { Direction, DungeonFloor, GameStats, Item, LogMessage, Monster, Player, Position, Spell, Trap } from '../types/game';
import { generateDungeonFloor, updateFOV } from './dungeonGenerator';
import { createItemInstance } from './itemData';
import { getSpellsForLevel } from './spellData';
import { recordMonsterEncounter } from './storage';
import { soundEngine } from '../audio/soundEngine';

export const DIR_OFFSETS: Record<Direction, Position> = {
  N: { x: 0, y: -1 },
  NE: { x: 1, y: -1 },
  E: { x: 1, y: 0 },
  SE: { x: 1, y: 1 },
  S: { x: 0, y: 1 },
  SW: { x: -1, y: 1 },
  W: { x: -1, y: 0 },
  NW: { x: -1, y: -1 },
};

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  duration: number;
}

export interface VisualEffect {
  id: string;
  type: 'slash' | 'fire' | 'heal' | 'lightning' | 'explosion' | 'spark';
  x: number;
  y: number;
  createdAt: number;
  duration: number;
}

export class GameEngine {
  public player: Player;
  public floor: DungeonFloor;
  public stats: GameStats;
  public logs: LogMessage[] = [];
  public floatingTexts: FloatingText[] = [];
  public visualEffects: VisualEffect[] = [];
  public isGameOver: boolean = false;
  public isGameClear: boolean = false;
  public activeSlotId: number = 1;
  public monsterHouseAlertTriggered: boolean = false;

  constructor(slotId: number = 1) {
    this.activeSlotId = slotId;
    this.stats = {
      deepestFloor: 1,
      monstersDefeated: 0,
      totalGoldEarned: 0,
      totalTurns: 0,
      itemsFound: 0,
      adventuresCount: 1,
      clearedCount: 0,
    };

    // Starting Hero setup (Weakest initial equipment: stick, leather shield, cloth armor)
    const starterWeapon = createItemInstance('stick');
    starterWeapon.equipped = true;
    const starterShield = createItemInstance('leather_shield');
    starterShield.equipped = true;
    const starterArmor = createItemInstance('cloth_armor');
    starterArmor.equipped = true;

    this.player = {
      x: 0,
      y: 0,
      direction: 'S',
      level: 1,
      hp: 35,
      maxHp: 35,
      mp: 12,
      maxMp: 12,
      fullness: 100,
      maxFullness: 100,
      baseAttack: 6,
      baseDefense: 3,
      exp: 0,
      nextExp: 35, // 1F gives ~36 EXP from 3 slimes/ravens -> triggers Level 2
      gold: 50,
      inventory: [
        starterWeapon,
        starterShield,
        starterArmor,
        createItemInstance('yakusou'),
        createItemInstance('yakusou'),
        createItemInstance('bread'),
      ],
      maxInventory: 20,
      equipment: {
        weapon: starterWeapon,
        shield: starterShield,
        armor: starterArmor,
        helmet: null,
        accessory: null,
      },
      spells: [],
      turns: 0,
    };

    this.autoSortInventory();

    const { floor, playerStart } = generateDungeonFloor(1);
    this.floor = floor;
    this.player.x = playerStart.x;
    this.player.y = playerStart.y;

    updateFOV(this.floor.tiles, this.floor.rooms, playerStart);

    this.addLog('地下迷宮へ足を踏み入れた！', 'info');
    this.addLog('最深部を目指し、大魔王を討伐せよ！', 'info');
  }

  public addLog(text: string, type: LogMessage['type'] = 'info') {
    this.logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      text,
      type,
      turn: this.player.turns,
    });
    if (this.logs.length > 50) this.logs.pop();
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#ffffff') {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      createdAt: Date.now(),
      duration: 1000,
    });
  }

  public addVisualEffect(type: VisualEffect['type'], x: number, y: number) {
    this.visualEffects.push({
      id: `ve_${Date.now()}_${Math.random()}`,
      type,
      x,
      y,
      createdAt: Date.now(),
      duration: 350,
    });
  }

  public cleanOldEffects() {
    const now = Date.now();
    this.floatingTexts = this.floatingTexts.filter((f) => now - f.createdAt < f.duration);
    this.visualEffects = this.visualEffects.filter((v) => now - v.createdAt < v.duration);
  }

  public getTotalAttack(): number {
    let atk = this.player.baseAttack;
    if (this.player.equipment.weapon?.power) atk += this.player.equipment.weapon.power;
    return atk;
  }

  public getTotalDefense(): number {
    let def = this.player.baseDefense;
    if (this.player.equipment.shield?.power) def += this.player.equipment.shield.power;
    if (this.player.equipment.armor?.power) def += this.player.equipment.armor.power;
    if (this.player.equipment.helmet?.power) def += this.player.equipment.helmet.power;
    return def;
  }

  // --- Player Actions ---

  public movePlayer(dir: Direction): boolean {
    if (this.isGameOver || this.isGameClear) return false;

    // Confused status alters direction
    let actualDir = dir;
    if (this.player.confused && this.player.confused > 0) {
      const allDirs: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      actualDir = allDirs[Math.floor(Math.random() * allDirs.length)];
      this.player.confused--;
      this.addLog('足元がふらついて別の方向に進んだ！', 'danger');
    }

    this.player.direction = actualDir;
    const offset = DIR_OFFSETS[actualDir];
    const isDiagonal = offset.x !== 0 && offset.y !== 0;
    const targetX = this.player.x + offset.x;
    const targetY = this.player.y + offset.y;

    if (targetX < 0 || targetX >= this.floor.width || targetY < 0 || targetY >= this.floor.height) {
      return false;
    }

    const currentTile = this.floor.tiles[this.player.y][this.player.x];
    const targetTile = this.floor.tiles[targetY][targetX];

    // Corridors strictly prohibit diagonal movement and diagonal attacks
    const inCorridor = currentTile.type === 'corridor' || targetTile.type === 'corridor';
    if (isDiagonal && inCorridor) {
      return false;
    }

    // Prohibit cutting corners through diagonal walls
    if (isDiagonal) {
      const wall1 = this.floor.tiles[this.player.y]?.[targetX]?.type === 'wall';
      const wall2 = this.floor.tiles[targetY]?.[this.player.x]?.type === 'wall';
      if (wall1 || wall2) {
        return false;
      }
    }

    // Check for monster in target tile -> Melee Attack
    const targetMonster = this.floor.monsters.find((m) => m.x === targetX && m.y === targetY);
    if (targetMonster) {
      this.playerAttackMonster(targetMonster);
      this.endTurn();
      return true;
    }

    // Check wall
    if (targetTile.type === 'wall') {
      return false;
    }

    // Step into tile
    this.player.x = targetX;
    this.player.y = targetY;
    soundEngine.playStep();

    // Check for Monster House trigger
    if (targetTile.roomIndex !== undefined) {
      const room = this.floor.rooms[targetTile.roomIndex];
      if (room && room.isMonsterHouse && !this.monsterHouseAlertTriggered) {
        this.monsterHouseAlertTriggered = true;
        soundEngine.playMonsterHouseJingle();
        soundEngine.playBgm('monster_house');
        this.addLog('！！ モンスターハウス だ！！', 'danger');
        // Wake up sleeping monsters in this room
        for (const m of this.floor.monsters) {
          if (m.x >= room.x && m.x < room.x + room.width && m.y >= room.y && m.y < room.y + room.height) {
            m.sleeping = 0;
          }
        }
      }
    }

    // Check for items on floor
    const itemIndex = this.floor.items.findIndex((i) => i.x === targetX && i.y === targetY);
    if (itemIndex !== -1) {
      const floorItem = this.floor.items[itemIndex];
      // Pick up item if inventory not full
      if (this.player.inventory.length < this.player.maxInventory) {
        this.floor.items.splice(itemIndex, 1);
        this.player.inventory.push(floorItem.item);
        this.autoSortInventory();
        soundEngine.playItemGet();
        this.addLog(`${floorItem.item.name} を足元から拾った！`, 'item');
        this.stats.itemsFound++;
      } else {
        this.addLog(`足元に ${floorItem.item.name} があるが、持ち物がいっぱいだ。`, 'info');
      }
    }

    // Check for Traps
    if (targetTile.trap) {
      this.triggerTrap(targetTile.trap);
    }

    updateFOV(this.floor.tiles, this.floor.rooms, { x: this.player.x, y: this.player.y });
    this.endTurn();
    return true;
  }

  /**
   * Fast Dash in corridors/rooms until intersection, item, trap, or enemy is encountered
   */
  public dashPlayer(dir: Direction): void {
    if (this.isGameOver || this.isGameClear) return;
    const maxSteps = 30;
    let steps = 0;

    while (steps < maxSteps) {
      const offset = DIR_OFFSETS[dir];
      const nextX = this.player.x + offset.x;
      const nextY = this.player.y + offset.y;

      if (nextX < 0 || nextX >= this.floor.width || nextY < 0 || nextY >= this.floor.height) break;
      const nextTile = this.floor.tiles[nextY][nextX];
      if (nextTile.type === 'wall') break;

      // Stop if enemy is in next tile or in view
      const monsterNext = this.floor.monsters.find((m) => m.x === nextX && m.y === nextY);
      if (monsterNext) break;

      // Stop if item or stairs on next tile
      const itemNext = this.floor.items.some((i) => i.x === nextX && i.y === nextY);
      const isStairs = nextX === this.floor.stairsPos.x && nextY === this.floor.stairsPos.y;

      const moved = this.movePlayer(dir);
      if (!moved) break;
      steps++;

      if (itemNext || isStairs || this.isGameOver || this.isGameClear) break;

      // In corridor: stop if branches available
      if (nextTile.type === 'corridor') {
        let openNeighbors = 0;
        const orthos: Direction[] = ['N', 'S', 'E', 'W'];
        for (const o of orthos) {
          const ox = this.player.x + DIR_OFFSETS[o].x;
          const oy = this.player.y + DIR_OFFSETS[o].y;
          if (this.floor.tiles[oy]?.[ox]?.type !== 'wall') openNeighbors++;
        }
        if (openNeighbors > 2) break; // Intersection!
      }

      // Check if any hostile visible monster in room
      const visibleHostile = this.floor.monsters.some((m) => {
        const t = this.floor.tiles[m.y]?.[m.x];
        return t?.visible && Math.hypot(m.x - this.player.x, m.y - this.player.y) <= 4;
      });
      if (visibleHostile) break;
    }
  }

  /**
   * Breadth-First Search (BFS) pathfinding to target coordinate
   * Strictly adheres to corridor diagonal movement prohibition and wall corner obstruction.
   */
  public findPath(targetX: number, targetY: number): Direction[] {
    if (this.isGameOver || this.isGameClear) return [];
    if (targetX === this.player.x && targetY === this.player.y) return [];
    if (targetX < 0 || targetX >= this.floor.width || targetY < 0 || targetY >= this.floor.height) return [];

    const targetTile = this.floor.tiles[targetY]?.[targetX];
    if (!targetTile || targetTile.type === 'wall') return [];

    const monsterAtTarget = this.floor.monsters.find((m) => m.x === targetX && m.y === targetY);

    const queue: { x: number; y: number; path: Direction[] }[] = [
      { x: this.player.x, y: this.player.y, path: [] },
    ];
    const visited = new Set<string>();
    visited.add(`${this.player.x},${this.player.y}`);

    const DIRS: { dir: Direction; dx: number; dy: number; isDiag: boolean }[] = [
      { dir: 'N', dx: 0, dy: -1, isDiag: false },
      { dir: 'S', dx: 0, dy: 1, isDiag: false },
      { dir: 'W', dx: -1, dy: 0, isDiag: false },
      { dir: 'E', dx: 1, dy: 0, isDiag: false },
      { dir: 'NW', dx: -1, dy: -1, isDiag: true },
      { dir: 'NE', dx: 1, dy: -1, isDiag: true },
      { dir: 'SW', dx: -1, dy: 1, isDiag: true },
      { dir: 'SE', dx: 1, dy: 1, isDiag: true },
    ];

    while (queue.length > 0) {
      const curr = queue.shift()!;

      // Destination reached
      if (curr.x === targetX && curr.y === targetY) {
        return curr.path;
      }

      // If target is monster and we reached adjacent position
      if (monsterAtTarget && Math.abs(curr.x - targetX) <= 1 && Math.abs(curr.y - targetY) <= 1) {
        return curr.path;
      }

      if (curr.path.length >= 60) continue; // max search depth

      const currTile = this.floor.tiles[curr.y]?.[curr.x];
      if (!currTile) continue;

      for (const d of DIRS) {
        const nx = curr.x + d.dx;
        const ny = curr.y + d.dy;

        if (nx < 0 || nx >= this.floor.width || ny < 0 || ny >= this.floor.height) continue;
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;

        const nTile = this.floor.tiles[ny][nx];
        if (nTile.type === 'wall') continue;

        // Don't step onto other monsters (unless it's the target tile)
        if (nx !== targetX || ny !== targetY) {
          const hasMonster = this.floor.monsters.some((m) => m.x === nx && m.y === ny);
          if (hasMonster) continue;
        }

        // Corridor diagonal restriction: both current and target must NOT be corridor
        if (d.isDiag) {
          if (currTile.type === 'corridor' || nTile.type === 'corridor') continue;
          // Wall corner cutting restriction
          if (
            this.floor.tiles[curr.y]?.[nx]?.type === 'wall' ||
            this.floor.tiles[ny]?.[curr.x]?.type === 'wall'
          ) {
            continue;
          }
        }

        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          path: [...curr.path, d.dir],
        });
      }
    }

    return [];
  }

  public getMonsterAt(x: number, y: number): Monster | undefined {
    return this.floor.monsters.find((m) => m.x === x && m.y === y);
  }

  public quickHeal(): boolean {
    const herb = this.player.inventory.find(
      (i) =>
        i.type === 'herb' &&
        !i.id.includes('seisui') &&
        !(i.defId || i.id || '').includes('sekaiju') &&
        !i.name.includes('せかいじゅ')
    );
    if (herb) {
      return this.useItem(herb);
    }
    const hoimi = this.player.spells.find((s) => s.id === 'hoimi' || s.id === 'behoimi');
    if (hoimi && this.player.mp >= hoimi.mpCost) {
      return this.castSpell(hoimi);
    }
    this.addLog('回復アイテムまたは回復呪文がありません！', 'info');
    return false;
  }

  public quickEat(): boolean {
    const food = this.player.inventory.find((i) => i.type === 'food');
    if (food) {
      return this.useItem(food);
    }
    this.addLog('食料を持っていません！', 'info');
    return false;
  }

  public attackInPlace(): void {
    if (this.isGameOver || this.isGameClear) return;
    const offset = DIR_OFFSETS[this.player.direction];
    const isDiagonal = offset.x !== 0 && offset.y !== 0;
    const targetX = this.player.x + offset.x;
    const targetY = this.player.y + offset.y;

    const currentTile = this.floor.tiles[this.player.y]?.[this.player.x];
    const targetTile = this.floor.tiles[targetY]?.[targetX];
    const inCorridor = currentTile?.type === 'corridor' || targetTile?.type === 'corridor';

    if (isDiagonal && inCorridor) {
      soundEngine.playMiss();
      this.addLog('通路では斜め攻撃はできない！', 'info');
      this.endTurn();
      return;
    }

    const targetMonster = this.floor.monsters.find((m) => m.x === targetX && m.y === targetY);
    if (targetMonster) {
      this.playerAttackMonster(targetMonster);
    } else {
      soundEngine.playMiss();
      this.addLog('勇者は空振りを放った！', 'combat');
    }
    this.endTurn();
  }

  public waitTurn(): void {
    if (this.isGameOver || this.isGameClear) return;
    // Natural HP recovery when resting
    if (this.player.fullness > 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }
    this.endTurn();
  }

  public playerAttackMonster(monster: Monster): void {
    recordMonsterEncounter(monster.defId, false);

    const weapon = this.player.equipment.weapon;
    const isFalcon = !!weapon && ((weapon.defId || weapon.id).includes('falcon') || weapon.name.includes('はやぶさ'));
    const strikes = isFalcon ? 2 : 1;

    for (let s = 0; s < strikes; s++) {
      if (monster.hp <= 0) break;

      const isCritical = Math.random() < 0.08;
      const atk = this.getTotalAttack();
      let damage = Math.max(1, Math.round(atk - monster.defense * 0.5 + (Math.random() * 4 - 2)));

      if (isCritical) {
        damage = Math.round(atk * 1.6);
        soundEngine.playCriticalHit();
        this.addVisualEffect('slash', monster.x, monster.y);
        this.addFloatingText(`会心！ ${damage}`, monster.x, monster.y, '#ffd166');
        this.addLog(`会心の一撃！！ ${monster.name} に ${damage} の大ダメージ！`, 'combat');
      } else {
        soundEngine.playHit();
        this.addVisualEffect('slash', monster.x, monster.y);
        this.addFloatingText(`-${damage}`, monster.x, monster.y, '#ffffff');
        this.addLog(`勇者の攻撃！ ${monster.name} に ${damage} のダメージ！`, 'combat');
      }

      monster.hp -= damage;
      monster.sleeping = 0; // Wake up if asleep

      if (monster.hp <= 0) {
        this.defeatMonster(monster);
        break;
      }
    }
  }

  public defeatMonster(monster: Monster): void {
    this.addLog(`${monster.name} を倒した！`, 'combat');
    recordMonsterEncounter(monster.defId, true);
    this.stats.monstersDefeated++;
    this.player.exp += monster.exp;
    this.player.gold += monster.gold;
    this.stats.totalGoldEarned += monster.gold;

    this.addFloatingText(`+${monster.exp} EXP`, monster.x, monster.y - 0.5, '#64dfdf');

    // Remove monster from floor
    this.floor.monsters = this.floor.monsters.filter((m) => m.id !== monster.id);

    // Boss clear checks
    if (monster.defId === 'zoma') {
      this.isGameClear = true;
      this.stats.clearedCount++;
      soundEngine.playLevelUp();
      soundEngine.stopBgm();
      this.addLog('大魔王ゾーマを討ち倒した！ 世界に平和が戻った！！', 'level');
    }

    // Check Level Up
    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    while (this.player.exp >= this.player.nextExp) {
      this.player.level++;
      soundEngine.playLevelUp();

      const hpGain = 5 + Math.floor(Math.random() * 4);
      const mpGain = 2 + Math.floor(Math.random() * 3);
      const atkGain = 2 + (this.player.level % 2 === 0 ? 1 : 0);
      const defGain = 1 + (this.player.level % 3 === 0 ? 1 : 0);

      this.player.maxHp += hpGain;
      this.player.hp = this.player.maxHp;
      this.player.maxMp += mpGain;
      this.player.mp = this.player.maxMp;
      this.player.baseAttack += atkGain;
      this.player.baseDefense += defGain;

      // Each level requires Level * 40 additional EXP, matched by ~3-4 floor monsters
      this.player.nextExp = this.player.exp + this.player.level * 40;

      this.addLog(`テレレレッテッテッテー！ レベルが ${this.player.level} に上がった！`, 'level');
      this.addLog(`最大HP+${hpGain}、最大MP+${mpGain}、ちから+${atkGain}、まもり+${defGain}！`, 'level');

      // Check for newly learned spells
      const currentSpells = this.player.spells.map((s) => s.id);
      const available = getSpellsForLevel(this.player.level);
      for (const spell of available) {
        if (!currentSpells.includes(spell.id)) {
          this.player.spells.push(spell);
          this.addLog(`新たな呪文・特技「${spell.name}」を習得した！`, 'magic');
        }
      }
    }
  }

  public triggerTrap(trap: Trap): void {
    trap.revealed = true;
    soundEngine.playTrap();

    switch (trap.type) {
      case 'poison':
        const pDmg = Math.max(5, Math.floor(this.player.maxHp * 0.15));
        this.player.hp = Math.max(1, this.player.hp - pDmg);
        this.addFloatingText(`-${pDmg}`, this.player.x, this.player.y, '#9d4edd');
        this.addLog(`毒の矢の罠を踏んだ！ ${pDmg} のダメージ！`, 'danger');
        break;
      case 'sleep':
        this.player.sleeping = 3;
        this.addLog('睡眠ガスの罠が作動した！ 数ターン眠ってしまった！', 'danger');
        break;
      case 'bomb':
        const bDmg = 25;
        this.player.hp = Math.max(1, this.player.hp - bDmg);
        this.addVisualEffect('explosion', this.player.x, this.player.y);
        this.addFloatingText(`-${bDmg}`, this.player.x, this.player.y, '#e63946');
        this.addLog(`地雷を踏んで大爆発！ ${bDmg} のダメージ！`, 'danger');
        break;
      case 'spinning':
        this.player.confused = 5;
        this.addLog('回転盤で目が回ってしまった！ しばらく混乱する！', 'danger');
        break;
      case 'rust':
        if (this.player.equipment.weapon && (this.player.equipment.weapon.upgradeLevel || 0) > 0) {
          this.player.equipment.weapon.upgradeLevel!--;
          this.player.equipment.weapon.power!--;
          this.addLog(`サビの罠！ ${this.player.equipment.weapon.name} の強さが下がった！`, 'danger');
        } else {
          this.addLog('サビの罠を踏んだが、装備に影響はなかった。', 'info');
        }
        break;
      case 'warp':
        const room = this.floor.rooms[Math.floor(Math.random() * this.floor.rooms.length)];
        this.player.x = room.x + 1;
        this.player.y = room.y + 1;
        this.addVisualEffect('spark', this.player.x, this.player.y);
        this.addLog('落とし穴に落ちて、別の場所にワープした！', 'danger');
        break;
    }
  }

  // --- Item Usage ---

  public getFloorItemAtPlayer(): { item: Item; x: number; y: number } | undefined {
    return this.floor.items.find((i) => i.x === this.player.x && i.y === this.player.y);
  }

  public useFloorItem(): boolean {
    if (this.isGameOver || this.isGameClear) return false;
    const floorItemIndex = this.floor.items.findIndex(
      (i) => i.x === this.player.x && i.y === this.player.y
    );
    if (floorItemIndex === -1) {
      this.addLog('足元には何もありません。', 'info');
      return false;
    }

    const floorItem = this.floor.items[floorItemIndex];
    const item = floorItem.item;
    const def = item.defId || item.id || '';

    if (item.type === 'herb') {
      if (def.includes('seisui') || item.name.includes('せいすい')) {
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 25);
        soundEngine.playHeal();
        this.addVisualEffect('heal', this.player.x, this.player.y);
        this.addLog(`足元の ${item.name} を使ってMPが 25 回復した！`, 'item');
      } else {
        const heal = item.healAmount || 35;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        soundEngine.playHeal();
        this.addVisualEffect('heal', this.player.x, this.player.y);
        this.addFloatingText(`+${heal}`, this.player.x, this.player.y, '#52b788');
        this.addLog(`足元の ${item.name} を使ってHPが ${heal} 回復した！`, 'item');
      }
      this.floor.items.splice(floorItemIndex, 1);
      this.endTurn();
      return true;
    }

    if (item.type === 'food') {
      const rec = item.fullnessAmount || 50;
      this.player.fullness = Math.min(this.player.maxFullness, this.player.fullness + rec);
      soundEngine.playHeal();
      this.addLog(`足元の ${item.name} を食べた！ お腹がいっぱいになった。（満腹度+${rec}%）`, 'item');
      this.floor.items.splice(floorItemIndex, 1);
      this.endTurn();
      return true;
    }

    if (item.type === 'scroll') {
      this.readScroll(item);
      this.floor.items.splice(floorItemIndex, 1);
      this.endTurn();
      return true;
    }

    if (item.type === 'wand') {
      this.waveWand(item);
      this.endTurn();
      return true;
    }

    if (['weapon', 'shield', 'armor', 'helmet'].includes(item.type)) {
      // Direct equip from floor
      const eq = this.player.equipment;
      let prevEquipped: Item | null = null;
      if (item.type === 'weapon') {
        prevEquipped = eq.weapon;
        if (eq.weapon) eq.weapon.equipped = false;
        item.equipped = true;
        eq.weapon = item;
      } else if (item.type === 'shield') {
        prevEquipped = eq.shield;
        if (eq.shield) eq.shield.equipped = false;
        item.equipped = true;
        eq.shield = item;
      } else if (item.type === 'armor') {
        prevEquipped = eq.armor;
        if (eq.armor) eq.armor.equipped = false;
        item.equipped = true;
        eq.armor = item;
      } else if (item.type === 'helmet') {
        prevEquipped = eq.helmet;
        if (eq.helmet) eq.helmet.equipped = false;
        item.equipped = true;
        eq.helmet = item;
      }

      this.floor.items.splice(floorItemIndex, 1);
      if (prevEquipped) {
        this.floor.items.push({ item: prevEquipped, x: this.player.x, y: this.player.y });
        this.removeItemFromInventory(prevEquipped.id);
      }
      this.player.inventory.push(item);
      soundEngine.playEquip();
      this.addLog(`足元の ${item.name} を直接そうびした！`, 'item');
      this.endTurn();
      return true;
    }

    return false;
  }

  public useItem(item: Item): boolean {
    if (this.isGameOver) return false;
    const def = item.defId || item.id || '';

    if (item.type === 'herb') {
      if (def.includes('seisui') || item.name.includes('せいすい')) {
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 25);
        soundEngine.playHeal();
        this.addVisualEffect('heal', this.player.x, this.player.y);
        this.addLog(`${item.name} を使ってMPが 25 回復した！`, 'item');
      } else {
        const heal = item.healAmount || 35;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        soundEngine.playHeal();
        this.addVisualEffect('heal', this.player.x, this.player.y);
        this.addFloatingText(`+${heal}`, this.player.x, this.player.y, '#52b788');
        this.addLog(`${item.name} を使ってHPが ${heal} 回復した！`, 'item');
      }
      this.removeItemFromInventory(item.id);
      this.endTurn();
      return true;
    }

    if (item.type === 'food') {
      const rec = item.fullnessAmount || 50;
      this.player.fullness = Math.min(this.player.maxFullness, this.player.fullness + rec);
      soundEngine.playHeal();
      this.addLog(`${item.name} を食べた！ お腹がいっぱいになった。（満腹度+${rec}%）`, 'item');
      this.removeItemFromInventory(item.id);
      this.endTurn();
      return true;
    }

    if (item.type === 'scroll') {
      this.readScroll(item);
      this.removeItemFromInventory(item.id);
      this.endTurn();
      return true;
    }

    if (item.type === 'wand') {
      this.waveWand(item);
      this.endTurn();
      return true;
    }

    if (['weapon', 'shield', 'armor', 'helmet'].includes(item.type)) {
      this.toggleEquipItem(item);
      soundEngine.playEquip();
      this.endTurn();
      return true;
    }

    return false;
  }

  public toggleEquipItem(item: Item): void {
    const eq = this.player.equipment;
    if (item.type === 'weapon') {
      if (eq.weapon?.id === item.id) {
        eq.weapon.equipped = false;
        item.equipped = false;
        eq.weapon = null;
        this.addLog(`${item.name} を外した。`, 'info');
      } else {
        this.player.inventory.forEach((i) => {
          if (i.type === 'weapon') i.equipped = false;
        });
        if (eq.weapon) eq.weapon.equipped = false;
        item.equipped = true;
        eq.weapon = item;
        this.addLog(`${item.name} を装備した！`, 'item');
      }
    } else if (item.type === 'shield') {
      if (eq.shield?.id === item.id) {
        eq.shield.equipped = false;
        item.equipped = false;
        eq.shield = null;
        this.addLog(`${item.name} を外した。`, 'info');
      } else {
        this.player.inventory.forEach((i) => {
          if (i.type === 'shield') i.equipped = false;
        });
        if (eq.shield) eq.shield.equipped = false;
        item.equipped = true;
        eq.shield = item;
        this.addLog(`${item.name} を装備した！`, 'item');
      }
    } else if (item.type === 'armor') {
      if (eq.armor?.id === item.id) {
        eq.armor.equipped = false;
        item.equipped = false;
        eq.armor = null;
        this.addLog(`${item.name} を外した。`, 'info');
      } else {
        this.player.inventory.forEach((i) => {
          if (i.type === 'armor') i.equipped = false;
        });
        if (eq.armor) eq.armor.equipped = false;
        item.equipped = true;
        eq.armor = item;
        this.addLog(`${item.name} を装備した！`, 'item');
      }
    } else if (item.type === 'helmet') {
      if (eq.helmet?.id === item.id) {
        eq.helmet.equipped = false;
        item.equipped = false;
        eq.helmet = null;
        this.addLog(`${item.name} を外した。`, 'info');
      } else {
        // Unequip all other helmets in inventory and slot to guarantee no dual-helmets
        this.player.inventory.forEach((i) => {
          if (i.type === 'helmet') i.equipped = false;
        });
        if (eq.helmet) eq.helmet.equipped = false;
        item.equipped = true;
        eq.helmet = item;
        this.addLog(`${item.name} を装備した！`, 'item');
      }
    }
  }

  public syncEquipment(): void {
    const eq = this.player.equipment;
    const types = ['weapon', 'shield', 'armor', 'helmet'] as const;
    for (const t of types) {
      const activeSlotItem = eq[t as 'weapon' | 'shield' | 'armor' | 'helmet'];
      if (activeSlotItem) {
        let matched = false;
        for (const invItem of this.player.inventory) {
          if (invItem.id === activeSlotItem.id) {
            invItem.equipped = true;
            eq[t as 'weapon' | 'shield' | 'armor' | 'helmet'] = invItem;
            matched = true;
          } else if (invItem.type === t) {
            invItem.equipped = false;
          }
        }
        if (!matched) {
          eq[t as 'weapon' | 'shield' | 'armor' | 'helmet'] = null;
        }
      } else {
        for (const invItem of this.player.inventory) {
          if (invItem.type === t && invItem.equipped) {
            invItem.equipped = false;
          }
        }
      }
    }
  }

  public readScroll(scroll: Item): void {
    soundEngine.playMagic();
    this.addLog(`「${scroll.name}」を唱えた！`, 'magic');
    const def = scroll.defId || scroll.id || '';

    if (def.includes('gira') || scroll.name.includes('ギラ')) {
      // Hit all visible monsters
      for (const m of this.floor.monsters) {
        const tile = this.floor.tiles[m.y]?.[m.x];
        if (tile?.visible) {
          m.hp -= 30;
          this.addVisualEffect('fire', m.x, m.y);
          this.addFloatingText('-30', m.x, m.y, '#e63946');
          if (m.hp <= 0) this.defeatMonster(m);
        }
      }
    } else if (def.includes('rariho') || scroll.name.includes('ラリホー')) {
      for (const m of this.floor.monsters) {
        const tile = this.floor.tiles[m.y]?.[m.x];
        if (tile?.visible) {
          m.sleeping = 5;
          this.addVisualEffect('spark', m.x, m.y);
          this.addFloatingText('ねむり', m.x, m.y, '#64b5f6');
        }
      }
    } else if (def.includes('upgrade_weapon') || scroll.name.includes('武器強化') || scroll.name.includes('武器')) {
      if (this.player.equipment.weapon) {
        const w = this.player.equipment.weapon;
        w.upgradeLevel = (w.upgradeLevel || 0) + 1;
        w.power = (w.power || 0) + 1;
        w.name = `${w.name.split(' +')[0]} +${w.upgradeLevel}`;
        soundEngine.playLevelUp();
        this.addLog(`${w.name} に強化された！ 切れ味が増した！`, 'item');
      } else {
        this.addLog('武器を装備していなかったので効果がなかった。', 'info');
      }
    } else if (def.includes('upgrade_shield') || scroll.name.includes('盾強化') || scroll.name.includes('盾')) {
      if (this.player.equipment.shield) {
        const s = this.player.equipment.shield;
        s.upgradeLevel = (s.upgradeLevel || 0) + 1;
        s.power = (s.power || 0) + 1;
        s.name = `${s.name.split(' +')[0]} +${s.upgradeLevel}`;
        soundEngine.playLevelUp();
        this.addLog(`${s.name} に強化された！ 頑丈になった！`, 'item');
      } else {
        this.addLog('盾を装備していなかったので効果がなかった。', 'info');
      }
    } else if (def.includes('ruula') || scroll.name.includes('ルーラ')) {
      const room = this.floor.rooms[Math.floor(Math.random() * this.floor.rooms.length)];
      this.player.x = room.x + Math.floor(room.width / 2);
      this.player.y = room.y + Math.floor(room.height / 2);
      this.addVisualEffect('spark', this.player.x, this.player.y);
      updateFOV(this.floor.tiles, this.floor.rooms, { x: this.player.x, y: this.player.y });
      this.addLog('天空高く舞い上がり、別の部屋に着地した！', 'magic');
    } else if (def.includes('trap_clear') || scroll.name.includes('ワナ消し') || scroll.name.includes('罠')) {
      this.floor.traps = [];
      for (let y = 0; y < this.floor.height; y++) {
        for (let x = 0; x < this.floor.width; x++) {
          this.floor.tiles[y][x].trap = undefined;
        }
      }
      this.addLog('神聖な風が吹き抜け、フロアのワナが全て消滅した！', 'item');
    }
  }

  public waveWand(wand: Item): void {
    if (!wand.charges || wand.charges <= 0) {
      this.addLog(`${wand.name} は魔力を失っている。`, 'info');
      return;
    }
    wand.charges--;
    soundEngine.playMagic();
    this.addLog(`${wand.name} を振った！（残り${wand.charges}回）`, 'magic');

    // Raycast in front of player
    const offset = DIR_OFFSETS[this.player.direction];
    let rx = this.player.x;
    let ry = this.player.y;
    const def = wand.defId || wand.id || '';

    for (let step = 1; step <= 8; step++) {
      rx += offset.x;
      ry += offset.y;
      if (rx < 0 || rx >= this.floor.width || ry < 0 || ry >= this.floor.height) break;
      if (this.floor.tiles[ry][rx].type === 'wall') break;

      const monster = this.floor.monsters.find((m) => m.x === rx && m.y === ry);
      if (monster) {
        if (def.includes('blow') || wand.name.includes('ふきとばし')) {
          // Knockback
          let kx = monster.x + offset.x * 5;
          let ky = monster.y + offset.y * 5;
          kx = Math.max(1, Math.min(this.floor.width - 2, kx));
          ky = Math.max(1, Math.min(this.floor.height - 2, ky));
          monster.x = kx;
          monster.y = ky;
          monster.hp -= 15;
          this.addVisualEffect('slash', kx, ky);
          this.addFloatingText('-15', kx, ky, '#ffd166');
          this.addLog(`${monster.name} を後方へ吹き飛ばした！ 15ダメージ！`, 'combat');
        } else if (def.includes('sleep') || wand.name.includes('まどろみ') || wand.name.includes('眠り')) {
          monster.sleeping = 6;
          this.addFloatingText('ねむり', monster.x, monster.y, '#64b5f6');
          this.addLog(`${monster.name} は深い眠りに落ちた！`, 'magic');
        } else if (def.includes('lightning') || wand.name.includes('いかずち')) {
          monster.hp -= 35;
          soundEngine.playHit();
          this.addVisualEffect('lightning', monster.x, monster.y);
          this.addFloatingText('-35', monster.x, monster.y, '#ffd166');
          this.addLog(`⚡雷撃が ${monster.name} を貫いた！ 35ダメージ！`, 'combat');
        } else if (def.includes('warp') || wand.name.includes('場所替え')) {
          const tempX = monster.x;
          const tempY = monster.y;
          monster.x = this.player.x;
          monster.y = this.player.y;
          this.player.x = tempX;
          this.player.y = tempY;
          this.addVisualEffect('spark', this.player.x, this.player.y);
          this.addLog(`${monster.name} と位置が入れ替わった！`, 'magic');
        }
        if (monster.hp <= 0) this.defeatMonster(monster);
        break;
      }
    }
  }

  public getFloorItemAtFeet(): { item: Item; x: number; y: number } | undefined {
    return this.floor.items.find((i) => i.x === this.player.x && i.y === this.player.y);
  }

  public dropItem(item: Item): void {
    if (this.isGameOver) return;

    const feetItemIndex = this.floor.items.findIndex(
      (i) => i.x === this.player.x && i.y === this.player.y
    );

    if (feetItemIndex !== -1) {
      // 足元にアイテムがある時は所持品を置く（交換）にする
      const groundItem = this.floor.items[feetItemIndex].item;

      // 装備中なら外す
      if (item.equipped) {
        this.toggleEquipItem(item);
      }

      // 手持ちから item を取り除き、足元の groundItem をインベントリへ追加
      this.player.inventory = this.player.inventory.filter((i) => i.id !== item.id);
      this.player.inventory.push(groundItem);

      // 床の該当タイルを item に置き換える
      this.floor.items[feetItemIndex].item = item;

      // 自動整頓
      this.autoSortInventory();
      soundEngine.playItemGet();
      this.addLog(`${item.name} を足元に置き、足元の ${groundItem.name} と交換した！`, 'item');
    } else {
      // 足元にアイテムがない時は通常の置く
      if (item.equipped) {
        this.toggleEquipItem(item);
      }
      this.player.inventory = this.player.inventory.filter((i) => i.id !== item.id);
      this.floor.items.push({ item, x: this.player.x, y: this.player.y });
      this.autoSortInventory();
      this.addLog(`${item.name} を足元に置いた。`, 'info');
    }

    this.endTurn();
  }

  public autoSortInventory(): void {
    const TYPE_PRIORITY: Record<string, number> = {
      weapon: 1,
      shield: 2,
      armor: 3,
      helmet: 4,
      accessory: 5,
      herb: 6,
      food: 7,
      scroll: 8,
      wand: 9,
    };

    this.player.inventory.sort((a, b) => {
      // 1. 装備中のアイテムを最優先
      if (a.equipped && !b.equipped) return -1;
      if (!a.equipped && b.equipped) return 1;

      // 2. 種別優先順位（武器→盾→鎧→兜→装飾品→薬草→食料→巻物→杖）
      const pA = TYPE_PRIORITY[a.type] || 99;
      const pB = TYPE_PRIORITY[b.type] || 99;
      if (pA !== pB) return pA - pB;

      // 3. 性能・効果値（攻撃力・回復力・満腹回復量など）の高い順
      const valA = a.power ?? a.healAmount ?? a.fullnessAmount ?? 0;
      const valB = b.power ?? b.healAmount ?? b.fullnessAmount ?? 0;
      if (valA !== valB) return valB - valA;

      // 4. 名前順（安定ソート）
      return a.name.localeCompare(b.name, 'ja');
    });
  }

  public removeItemFromInventory(itemId: string): void {
    const item = this.player.inventory.find((i) => i.id === itemId);
    if (item?.equipped) {
      this.toggleEquipItem(item);
    }
    this.player.inventory = this.player.inventory.filter((i) => i.id !== itemId);
    this.autoSortInventory();
  }

  // --- Spells / Skills Execution ---

  public castSpell(spell: Spell): boolean {
    if (this.isGameOver || this.player.mp < spell.mpCost) {
      this.addLog('MPが足りない！', 'info');
      return false;
    }

    this.player.mp -= spell.mpCost;
    soundEngine.playMagic();
    this.addLog(`勇者は「${spell.name}」を唱えた！`, 'magic');

    if (spell.effectType === 'heal') {
      const heal = spell.power || 35;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      soundEngine.playHeal();
      this.addVisualEffect('heal', this.player.x, this.player.y);
      this.addFloatingText(`+${heal}`, this.player.x, this.player.y, '#52b788');
      this.addLog(`HPが ${heal} 回復した！`, 'magic');
    } else if (spell.effectType === 'fire') {
      const offset = DIR_OFFSETS[this.player.direction];
      let fx = this.player.x;
      let fy = this.player.y;
      for (let i = 0; i < (spell.range || 4); i++) {
        fx += offset.x;
        fy += offset.y;
        if (fx < 0 || fx >= this.floor.width || fy < 0 || fy >= this.floor.height) break;
        if (this.floor.tiles[fy][fx].type === 'wall') break;

        this.addVisualEffect('fire', fx, fy);
        const monster = this.floor.monsters.find((m) => m.x === fx && m.y === fy);
        if (monster) {
          const dmg = spell.power || 25;
          monster.hp -= dmg;
          this.addFloatingText(`-${dmg}`, monster.x, monster.y, '#e63946');
          this.addLog(`${monster.name} に炎が直撃！ ${dmg} のダメージ！`, 'combat');
          if (monster.hp <= 0) this.defeatMonster(monster);
        }
      }
    } else if (spell.effectType === 'sleep') {
      for (const m of this.floor.monsters) {
        const dist = Math.hypot(m.x - this.player.x, m.y - this.player.y);
        if (dist <= 2.2) {
          m.sleeping = 4;
          this.addVisualEffect('spark', m.x, m.y);
          this.addFloatingText('ねむり', m.x, m.y, '#64b5f6');
          this.addLog(`${monsterNameWithHonor(m.name)} は眠りに落ちた！`, 'magic');
        }
      }
    } else if (spell.effectType === 'teleport') {
      const room = this.floor.rooms[Math.floor(Math.random() * this.floor.rooms.length)];
      this.player.x = room.x + Math.floor(room.width / 2);
      this.player.y = room.y + Math.floor(room.height / 2);
      this.addVisualEffect('spark', this.player.x, this.player.y);
      updateFOV(this.floor.tiles, this.floor.rooms, { x: this.player.x, y: this.player.y });
    } else if (spell.effectType === 'double_slash') {
      const offset = DIR_OFFSETS[this.player.direction];
      const target = this.floor.monsters.find((m) => m.x === this.player.x + offset.x && m.y === this.player.y + offset.y);
      if (target) {
        this.playerAttackMonster(target);
        if (target.hp > 0) this.playerAttackMonster(target);
      }
    } else if (spell.effectType === 'lightning') {
      // 3x3 surrounding
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = this.player.x + dx;
          const ty = this.player.y + dy;
          this.addVisualEffect('lightning', tx, ty);
          const m = this.floor.monsters.find((mon) => mon.x === tx && mon.y === ty);
          if (m) {
            const dmg = spell.power || 110;
            m.hp -= dmg;
            this.addFloatingText(`-${dmg}`, m.x, m.y, '#ffd166');
            this.addLog(`聖なる雷撃が ${m.name} を撃ち砕いた！ ${dmg} ダメージ！`, 'combat');
            if (m.hp <= 0) this.defeatMonster(m);
          }
        }
      }
    } else if (spell.effectType === 'explosion') {
      // All monsters in room
      for (const m of this.floor.monsters) {
        const tile = this.floor.tiles[m.y]?.[m.x];
        if (tile?.visible) {
          const dmg = spell.power || 160;
          m.hp -= dmg;
          this.addVisualEffect('explosion', m.x, m.y);
          this.addFloatingText(`-${dmg}`, m.x, m.y, '#e63946');
          this.addLog(`大爆発が ${m.name} を吹き飛ばした！ ${dmg} ダメージ！`, 'combat');
          if (m.hp <= 0) this.defeatMonster(m);
        }
      }
    }

    this.endTurn();
    return true;
  }

  // --- Stairs Descend ---

  public isPlayerOnStairs(): boolean {
    return this.player.x === this.floor.stairsPos.x && this.player.y === this.floor.stairsPos.y;
  }

  public descendStairs(): boolean {
    if (this.isGameOver || this.isGameClear) return false;

    if (this.player.x !== this.floor.stairsPos.x || this.player.y !== this.floor.stairsPos.y) {
      this.addLog('ここには階段がない。', 'info');
      return false;
    }

    soundEngine.playStairs();
    const nextFloor = this.floor.floorNumber + 1;
    this.stats.deepestFloor = Math.max(this.stats.deepestFloor, nextFloor);

    // Minor MP recovery between floors
    this.player.mp = Math.min(this.player.maxMp, this.player.mp + 5);

    const { floor, playerStart } = generateDungeonFloor(nextFloor);
    this.floor = floor;
    this.player.x = playerStart.x;
    this.player.y = playerStart.y;
    this.monsterHouseAlertTriggered = false;

    updateFOV(this.floor.tiles, this.floor.rooms, playerStart);

    // Change BGM based on boss/floor
    if (nextFloor === 30) {
      soundEngine.playBgm('boss');
      this.addLog(`【第 30 階・大魔王の祭壇】ついに最深部へと到達した！！`, 'danger');
      this.addLog(`玉座に君臨する 大魔王ゾーマ が立ちはだかる！`, 'danger');
      this.addLog(`ゾーマ「よくぞここまで来たな、勇者よ… 我が闇にひれ伏すがよい！」`, 'danger');
    } else if (nextFloor === 25) {
      soundEngine.playBgm('boss');
      this.addLog(`【第 25 階】魔王バラモスの気配がする…！`, 'danger');
    } else {
      soundEngine.playBgm('dungeon');
      this.addLog(`【第 ${nextFloor} 階】階段を下りた。`, 'info');
    }

    return true;
  }

  // --- Turn End & Monster AI ---

  public endTurn(): void {
    this.player.turns++;
    this.stats.totalTurns++;

    // Hunger check: Every 10 turns, decrease fullness by 1
    if (this.player.turns % 10 === 0) {
      this.player.fullness = Math.max(0, this.player.fullness - 1);
      if (this.player.fullness === 0) {
        this.player.hp = Math.max(1, this.player.hp - 1);
        this.addLog('空腹で力が出ない…！ HPが減少し始めた！', 'danger');
      }
    }

    // Natural regeneration if not starving
    if (this.player.fullness > 0 && this.player.turns % 3 === 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }

    // Process Monster Turns
    this.processMonsterTurns();

    // Check player death
    if (this.player.hp <= 0) {
      this.handlePlayerDeath();
    }
  }

  private processMonsterTurns(): void {
    for (const monster of this.floor.monsters) {
      if (monster.hp <= 0) continue;

      // Handle sleep
      if (monster.sleeping && monster.sleeping > 0) {
        monster.sleeping--;
        continue;
      }

      // Speed handling: 1 action per turn for standard, 2 for fast
      const actions = monster.speed;
      for (let a = 0; a < actions; a++) {
        this.stepMonsterAI(monster);
      }
    }
  }

  private stepMonsterAI(monster: Monster): void {
    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    const dist = Math.hypot(dx, dy);

    // Only active if player is somewhat close or visible
    const monsterTile = this.floor.tiles[monster.y]?.[monster.x];
    if (!monsterTile?.visible && dist > 8) return;

    const isAdjacent = Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0);
    const isDiagAttack = dx !== 0 && dy !== 0;
    const playerTile = this.floor.tiles[this.player.y]?.[this.player.x];
    const inCorridorCombat = monsterTile?.type === 'corridor' || playerTile?.type === 'corridor';

    // 1. Adjacent -> Melee Attack (Prohibit diagonal attack in corridor)
    if (isAdjacent) {
      if (isDiagAttack && inCorridorCombat) {
        // Cannot attack diagonally in corridor
      } else {
        this.monsterAttackPlayer(monster);
        return;
      }
    }

    // 2. Boss Special Attacks: Great Demon Lord Zoma (30F Boss)
    if (monster.defId === 'zoma' && dist <= 6) {
      const roll = Math.random();
      if (roll < 0.35) {
        // こごえるふぶき (Freezing blizzard breath)
        soundEngine.playTrap();
        const dmg = Math.max(18, Math.round(48 - this.getTotalDefense() * 0.25));
        this.addVisualEffect('spark', this.player.x, this.player.y);
        this.addFloatingText(`-${dmg}`, this.player.x, this.player.y, '#64dfdf');
        this.addLog(`大魔王ゾーマ は 凍える吹雪 を吹き付けた！ 勇者に ${dmg} の大ダメージ！`, 'danger');
        this.applyDamageToPlayer(dmg);
        return;
      } else if (roll < 0.65) {
        // マヒャド (Glacial explosion)
        soundEngine.playMagic();
        const dmg = Math.max(20, Math.round(55 - this.getTotalDefense() * 0.25));
        this.addVisualEffect('explosion', this.player.x, this.player.y);
        this.addFloatingText(`-${dmg}`, this.player.x, this.player.y, '#00b4d8');
        this.addLog(`大魔王ゾーマ は マヒャド を唱えた！ 氷の刃が炸裂し ${dmg} のダメージ！`, 'danger');
        this.applyDamageToPlayer(dmg);
        return;
      } else if (roll < 0.8) {
        // いてつくはどう (Dispel & chill wave)
        soundEngine.playMagic();
        const dmg = 15;
        this.addVisualEffect('spark', this.player.x, this.player.y);
        this.addFloatingText(`-${dmg}`, this.player.x, this.player.y, '#9d4edd');
        this.addLog(`大魔王ゾーマ の 凍てつく波動 が押し寄せた！ 勇者に ${dmg} のダメージ！`, 'danger');
        this.applyDamageToPlayer(dmg);
        return;
      }
    }

    // 3. Special Ranged Spells / Breath for other monsters
    if (monster.ai === 'ranged_magic' && (dx === 0 || dy === 0) && dist <= 4) {
      // Magician Gira
      soundEngine.playMagic();
      const dmg = Math.max(4, Math.round(14 - this.getTotalDefense() * 0.3));
      this.addVisualEffect('fire', this.player.x, this.player.y);
      this.addFloatingText(`-${dmg}`, this.player.x, this.player.y, '#e63946');
      this.addLog(`${monster.name} は遠くから ギラ を唱えた！ 勇者に ${dmg} のダメージ！`, 'combat');
      this.applyDamageToPlayer(dmg);
      return;
    }

    if (monster.ai === 'breath' && (dx === 0 || dy === 0) && dist <= 3) {
      // Dragon fire breath
      soundEngine.playTrap();
      const dmg = Math.max(8, Math.round(22 - this.getTotalDefense() * 0.3));
      this.addVisualEffect('fire', this.player.x, this.player.y);
      this.addFloatingText(`-${dmg}`, this.player.x, this.player.y, '#ff5722');
      this.addLog(`${monster.name} は激しい火の息を吐きかけた！ 勇者に ${dmg} のダメージ！`, 'combat');
      this.applyDamageToPlayer(dmg);
      return;
    }

    // 4. Movement towards player (Prohibit diagonal move in corridor)
    const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    // Try straight or diagonal towards player
    const candidates: Position[] = [
      { x: monster.x + stepX, y: monster.y + stepY },
      { x: monster.x + stepX, y: monster.y },
      { x: monster.x, y: monster.y + stepY },
    ];

    for (const cand of candidates) {
      const isCandDiag = cand.x !== monster.x && cand.y !== monster.y;
      const targetTile = this.floor.tiles[cand.y]?.[cand.x];
      const inCorridorMove = monsterTile?.type === 'corridor' || targetTile?.type === 'corridor';
      if (isCandDiag && inCorridorMove) {
        continue;
      }
      if (isCandDiag) {
        const wall1 = this.floor.tiles[monster.y]?.[cand.x]?.type === 'wall';
        const wall2 = this.floor.tiles[cand.y]?.[monster.x]?.type === 'wall';
        if (wall1 || wall2) continue;
      }
      if (this.canMonsterMoveTo(cand.x, cand.y)) {
        monster.x = cand.x;
        monster.y = cand.y;
        break;
      }
    }
  }

  private canMonsterMoveTo(x: number, y: number): boolean {
    if (x < 0 || x >= this.floor.width || y < 0 || y >= this.floor.height) return false;
    if (this.floor.tiles[y][x].type === 'wall') return false;
    if (this.player.x === x && this.player.y === y) return false;
    if (this.floor.monsters.some((m) => m.x === x && m.y === y)) return false;
    return true;
  }

  private monsterAttackPlayer(monster: Monster): void {
    if (this.isGameOver) return;
    const isCritical = monster.ai === 'boss' ? Math.random() < 0.15 : Math.random() < 0.05;
    const def = this.getTotalDefense();
    let damage = Math.max(1, Math.round(monster.attack - def * 0.5 + (Math.random() * 3 - 1)));

    if (isCritical) {
      damage = Math.round(monster.attack * 1.5);
      soundEngine.playCriticalHit();
      this.addVisualEffect('slash', this.player.x, this.player.y);
      this.addFloatingText(`痛恨！ ${damage}`, this.player.x, this.player.y, '#e63946');
      this.addLog(`痛恨の一撃！！ ${monster.name} の強烈な一撃！ 勇者に ${damage} の大ダメージ！`, 'danger');
    } else {
      soundEngine.playHit();
      this.addVisualEffect('slash', this.player.x, this.player.y);
      this.addFloatingText(`-${damage}`, this.player.x, this.player.y, '#e63946');
      this.addLog(`${monster.name} の攻撃！ 勇者に ${damage} のダメージ！`, 'combat');
    }

    this.applyDamageToPlayer(damage);
  }

  public applyDamageToPlayer(damage: number): void {
    if (this.isGameOver) return;
    this.player.hp -= damage;
    if (this.player.hp <= 0) {
      this.handlePlayerDeath();
    }
  }

  private handlePlayerDeath(): void {
    if (this.isGameOver) return;

    // Check if player has Sekaiju Leaf in inventory for revival!
    const leafIndex = this.player.inventory.findIndex(
      (i) => (i.defId || i.id || '').includes('sekaiju') || i.name.includes('せかいじゅ')
    );
    if (leafIndex !== -1) {
      // Consume ONLY EXACTLY ONE leaf
      this.player.inventory.splice(leafIndex, 1);
      this.autoSortInventory();
      this.player.hp = this.player.maxHp;
      soundEngine.playLevelUp();
      this.addVisualEffect('heal', this.player.x, this.player.y);
      this.addFloatingText('復活！！', this.player.x, this.player.y, '#ffd166');
      this.addLog('せかいじゅの葉がまばゆい光を放ち、奇跡の力で全快復活した！！', 'level');
      return;
    }

    this.player.hp = 0;
    this.isGameOver = true;
    soundEngine.playBgm('gameover');
    this.addLog('勇者は力尽きて倒れてしまった……', 'danger');
  }
}

function monsterNameWithHonor(name: string): string {
  return name;
}
