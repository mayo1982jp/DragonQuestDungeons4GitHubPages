/**
 * Mystery Dungeon Generator
 * Procedurally generates rooms, corridors, stairs, items, traps, and monsters.
 */

import { DungeonFloor, FloorTheme, Item, Monster, Position, Room, Tile, Trap, TrapType } from '../types/game';
import { createMonsterInstance, getSpawnMonsterDefId } from './monsterData';
import { getRandomFloorItem } from './itemData';

const DUNGEON_WIDTH = 48;
const DUNGEON_HEIGHT = 36;

export function getThemeForFloor(floor: number): FloorTheme {
  if (floor <= 5) return 'cave';
  if (floor <= 10) return 'ruins';
  if (floor <= 15) return 'ice';
  if (floor <= 20) return 'volcano';
  if (floor <= 25) return 'crypt';
  return 'citadel';
}

export function getThemeName(theme: FloorTheme): string {
  switch (theme) {
    case 'cave':
      return '始まりの洞窟';
    case 'ruins':
      return '魔導の古代遺跡';
    case 'ice':
      return '氷結の迷宮';
    case 'volcano':
      return '灼熱の溶岩洞';
    case 'crypt':
      return '死霊の地下宮殿';
    case 'citadel':
      return '大魔王の祭壇';
  }
}

const TRAP_TYPES: { type: TrapType; name: string }[] = [
  { type: 'poison', name: '毒の矢のワナ' },
  { type: 'sleep', name: '睡眠ガスのワナ' },
  { type: 'spinning', name: '回転盤のワナ' },
  { type: 'bomb', name: '地雷のワナ' },
  { type: 'rust', name: 'サビのワナ' },
  { type: 'warp', name: '落とし穴のワナ' },
];

export function generateDungeonFloor(floorNumber: number): {
  floor: DungeonFloor;
  playerStart: Position;
} {
  const theme = getThemeForFloor(floorNumber);
  const width = DUNGEON_WIDTH;
  const height = DUNGEON_HEIGHT;

  // Initialize all walls
  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        x,
        y,
        type: 'wall',
        seen: false,
        visible: false,
      };
    }
  }

  // 3x3 room grid partitioning (or single Grand Throne Hall on Floor 30)
  const rooms: Room[] = [];
  const roomCenters: Position[] = [];

  // Determine if this floor has a Monster House (approx 20% chance after 4F, never on boss floors)
  const isMonsterHouseFloor = floorNumber >= 4 && floorNumber !== 25 && floorNumber !== 30 && Math.random() < 0.25;
  const monsterHouseRoomIndex = isMonsterHouseFloor ? Math.floor(Math.random() * 8) : -1;

  // Special Floor 30: Grand Throne Room for Great Demon Lord Zoma
  if (floorNumber === 30) {
    const rw = 22;
    const rh = 16;
    const rx = Math.floor((width - rw) / 2);
    const ry = Math.floor((height - rh) / 2);

    const throneRoom: Room = {
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      isMonsterHouse: false,
    };
    rooms.push(throneRoom);
    roomCenters.push({
      x: Math.floor(rx + rw / 2),
      y: Math.floor(ry + rh / 2),
    });

    // Carve spacious ceremonial floor
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        tiles[y][x].type = 'floor';
        tiles[y][x].roomIndex = 0;
      }
    }
  } else {
    const gridRows = 3;
    const gridCols = 3;
    const cellW = Math.floor(width / gridCols); // 16
    const cellH = Math.floor(height / gridRows); // 12

    // 3x3 grid matrix of rooms
    const roomGrid: (Room | null)[][] = Array(gridRows)
      .fill(null)
      .map(() => Array(gridCols).fill(null));

    let rIdx = 0;
    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        // Chance to skip at most 1 room for layout variety (ensure at least 8 rooms)
        if (rooms.length >= 8 && Math.random() < 0.2 && rIdx !== monsterHouseRoomIndex) {
          rIdx++;
          continue;
        }

        // Room dimensions with generous cell padding to prevent corridor proximity
        const minW = 6;
        const maxW = 9;
        const minH = 4;
        const maxH = 6;

        const rw = Math.floor(Math.random() * (maxW - minW + 1)) + minW;
        const rh = Math.floor(Math.random() * (maxH - minH + 1)) + minH;

        // Ensure at least 3 tiles padding from cell boundaries on all sides
        const maxOffsetX = Math.max(0, cellW - rw - 5);
        const maxOffsetY = Math.max(0, cellH - rh - 5);
        const rx = gx * cellW + 3 + Math.floor(Math.random() * (maxOffsetX + 1));
        const ry = gy * cellH + 3 + Math.floor(Math.random() * (maxOffsetY + 1));

        const isHouse = rIdx === monsterHouseRoomIndex;
        const room: Room = {
          x: rx,
          y: ry,
          width: rw,
          height: rh,
          isMonsterHouse: isHouse,
        };

        rooms.push(room);
        roomGrid[gy][gx] = room;
        roomCenters.push({
          x: Math.floor(rx + rw / 2),
          y: Math.floor(ry + rh / 2),
        });

        // Carve room floor
        const roomNum = rooms.length - 1;
        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            tiles[y][x].type = 'floor';
            tiles[y][x].roomIndex = roomNum;
          }
        }

        rIdx++;
      }
    }

    // Connect adjacent rooms via strictly 1-tile wide orthogonal corridor channels
    connectDungeonRooms(tiles, roomGrid, gridRows, gridCols);

    // Sanity enforcement: guarantee no 2x2 corridor blocks exist anywhere
    enforceSingleTileCorridors(tiles, width, height);
  }

  // Player Start Position
  let playerStart: Position;
  let stairsPos: Position;
  let startRoom: Room;

  if (floorNumber === 30) {
    // Floor 30 Zoma Throne Room:
    // Player enters at the southern entrance
    const mainRoom = rooms[0];
    startRoom = mainRoom;
    playerStart = {
      x: mainRoom.x + Math.floor(mainRoom.width / 2),
      y: mainRoom.y + mainRoom.height - 3,
    };
    // Zoma will stand at mainRoom.x + Math.floor(mainRoom.width / 2), mainRoom.y + 3
    // Place Stairs dummy behind the throne (revealed after victory as portal of light)
    stairsPos = {
      x: mainRoom.x + Math.floor(mainRoom.width / 2),
      y: mainRoom.y + 1,
    };
    tiles[stairsPos.y][stairsPos.x].type = 'floor'; // Hidden until clear
  } else {
    // Place Player Start in Room 0 (guaranteed not monster house)
    startRoom = rooms[0].isMonsterHouse && rooms.length > 1 ? rooms[1] : rooms[0];
    playerStart = {
      x: Math.floor(startRoom.x + startRoom.width / 2),
      y: Math.floor(startRoom.y + startRoom.height / 2),
    };

    // Place Stairs in a distant room
    const endRoom = rooms[rooms.length - 1] === startRoom ? rooms[rooms.length - 2] || rooms[0] : rooms[rooms.length - 1];
    stairsPos = {
      x: Math.floor(endRoom.x + endRoom.width / 2),
      y: Math.floor(endRoom.y + endRoom.height / 2),
    };
    tiles[stairsPos.y][stairsPos.x].type = 'stairs';
  }

  // Place Traps (None on Floor 30)
  const traps: Trap[] = [];
  const trapCount = floorNumber === 30 ? 0 : Math.min(8, Math.floor(floorNumber / 2) + 2);
  for (let i = 0; i < trapCount; i++) {
    const tDef = TRAP_TYPES[Math.floor(Math.random() * TRAP_TYPES.length)];
    const pos = getRandomEmptyTile(tiles, rooms, playerStart, stairsPos);
    if (pos) {
      const trap: Trap = {
        id: `trap_${i}`,
        type: tDef.type,
        name: tDef.name,
        revealed: false,
        x: pos.x,
        y: pos.y,
      };
      tiles[pos.y][pos.x].trap = trap;
      traps.push(trap);
    }
  }

  // Place Items (never stack two items, and keep the 25F boss tile clear)
  const items: { item: Item; x: number; y: number }[] = [];
  const occupiedItemTiles = new Set<string>();
  if (floorNumber === 25) {
    // Baramos spawns directly above the stairs; reserve that tile.
    occupiedItemTiles.add(`${stairsPos.x},${stairsPos.y - 1}`);
  }
  if (floorNumber === 30) {
    // Sacred battle aids placed on the side altars of Zoma's throne room
    const mainRoom = rooms[0];
    const sacredItemIds = ['sekaiju_leaf', 'toku_yakusou', 'magic_bread', 'seisui'];
    sacredItemIds.forEach((id, idx) => {
      const itemX = idx % 2 === 0 ? mainRoom.x + 3 : mainRoom.x + mainRoom.width - 4;
      const itemY = mainRoom.y + 4 + Math.floor(idx / 2) * 5;
      items.push({ item: getRandomFloorItem(floorNumber), x: itemX, y: itemY });
    });
  } else {
    const itemCount = isMonsterHouseFloor ? 10 : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < itemCount; i++) {
      let targetRoom = rooms[Math.floor(Math.random() * rooms.length)];
      if (isMonsterHouseFloor && Math.random() < 0.6) {
        const mh = rooms.find((r) => r.isMonsterHouse);
        if (mh) targetRoom = mh;
      }

      const pos = getRandomEmptyInRoom(tiles, targetRoom, playerStart, stairsPos, occupiedItemTiles);
      if (pos) {
        const item = getRandomFloorItem(floorNumber);
        items.push({ item, x: pos.x, y: pos.y });
        occupiedItemTiles.add(`${pos.x},${pos.y}`);
      }
    }
  }

  // Place Monsters (avoid tiles already holding an item or another monster)
  const monsters: Monster[] = [];
  const occupiedMonsterTiles = new Set<string>(occupiedItemTiles);
  for (const item of items) {
    occupiedMonsterTiles.add(`${item.x},${item.y}`);
  }
  if (floorNumber === 25) {
    // Baramos Boss Room
    const boss = createMonsterInstance('baramos', stairsPos.x, stairsPos.y - 1, floorNumber);
    monsters.push(boss);
  } else if (floorNumber === 30) {
    // Floor 30: Great Demon Lord Zoma (大魔王ゾーマ) sits atop the throne
    const mainRoom = rooms[0];
    const zomaX = mainRoom.x + Math.floor(mainRoom.width / 2);
    const zomaY = mainRoom.y + 3;
    const boss = createMonsterInstance('zoma', zomaX, zomaY, floorNumber);
    monsters.push(boss);
  } else {
    const monsterCount = isMonsterHouseFloor ? 12 : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < monsterCount; i++) {
      let targetRoom = rooms[Math.floor(Math.random() * rooms.length)];
      let isSleeping = false;

      if (isMonsterHouseFloor && Math.random() < 0.7) {
        const mh = rooms.find((r) => r.isMonsterHouse);
        if (mh) {
          targetRoom = mh;
          isSleeping = true; // Monsters in monster house sleep until entered
        }
      }

      // Do not spawn on player room initially unless monster house
      if (targetRoom === startRoom && !isMonsterHouseFloor && rooms.length > 1) {
        targetRoom = rooms[1];
      }

      const pos = getRandomEmptyInRoom(tiles, targetRoom, playerStart, stairsPos, occupiedMonsterTiles);
      if (pos) {
        const defId = getSpawnMonsterDefId(floorNumber);
        const monster = createMonsterInstance(defId, pos.x, pos.y, floorNumber);
        if (isSleeping) monster.sleeping = 999;
        monsters.push(monster);
        occupiedMonsterTiles.add(`${pos.x},${pos.y}`);
      }
    }
  }

  const floor: DungeonFloor = {
    floorNumber,
    width,
    height,
    theme,
    tiles,
    rooms,
    stairsPos,
    monsters,
    items,
    traps,
    isMonsterHouseFloor,
  };

  return { floor, playerStart };
}

/**
 * Connects dungeon rooms strictly along orthogonal grid channels.
 * Guarantees that all corridors are strictly 1 tile wide and never run parallel adjacent to each other.
 */
function connectDungeonRooms(
  tiles: Tile[][],
  roomGrid: (Room | null)[][],
  gridRows: number,
  gridCols: number
) {
  interface GridEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dir: 'H' | 'V';
    weight: number;
  }

  const edges: GridEdge[] = [];

  // Horizontal edges between orthogonal grid neighbors
  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols - 1; gx++) {
      if (roomGrid[gy][gx] && roomGrid[gy][gx + 1]) {
        edges.push({
          x1: gx,
          y1: gy,
          x2: gx + 1,
          y2: gy,
          dir: 'H',
          weight: Math.random(),
        });
      }
    }
  }

  // Vertical edges between orthogonal grid neighbors
  for (let gy = 0; gy < gridRows - 1; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      if (roomGrid[gy][gx] && roomGrid[gy + 1][gx]) {
        edges.push({
          x1: gx,
          y1: gy,
          x2: gx,
          y2: gy + 1,
          dir: 'V',
          weight: Math.random(),
        });
      }
    }
  }

  // Disjoint Set Union for Kruskal's MST
  const parent: number[] = Array(gridRows * gridCols)
    .fill(0)
    .map((_, i) => i);
  const find = (i: number): number => {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (i: number, j: number): boolean => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  };

  edges.sort((a, b) => a.weight - b.weight);

  const selectedEdges: GridEdge[] = [];
  const remainingEdges: GridEdge[] = [];

  for (const edge of edges) {
    const id1 = edge.y1 * gridCols + edge.x1;
    const id2 = edge.y2 * gridCols + edge.x2;
    if (union(id1, id2)) {
      selectedEdges.push(edge);
    } else {
      remainingEdges.push(edge);
    }
  }

  // Add 1-2 extra loops so the dungeon is interesting and non-linear
  const extraLoops = Math.min(remainingEdges.length, 2);
  for (let i = 0; i < extraLoops; i++) {
    selectedEdges.push(remainingEdges[i]);
  }

  // Carve strictly 1-tile wide corridors for all chosen edges
  for (const edge of selectedEdges) {
    const rA = roomGrid[edge.y1][edge.x1]!;
    const rB = roomGrid[edge.y2][edge.x2]!;

    if (edge.dir === 'H') {
      // Horizontal connection: rA is West, rB is East
      const leftDoorX = rA.x + rA.width; // 1 tile east of room A
      const rightDoorX = rB.x - 1; // 1 tile west of room B

      // Choose door Y inside the interior of each room (avoiding corners)
      const doorYA = rA.y + 1 + Math.floor(Math.random() * Math.max(1, rA.height - 2));
      const doorYB = rB.y + 1 + Math.floor(Math.random() * Math.max(1, rB.height - 2));

      // Midpoint in the wall gap between the two cells
      const midX = Math.floor((leftDoorX + rightDoorX) / 2);

      // 1. Horizontal from rA right edge to midX at doorYA
      for (let x = leftDoorX; x <= midX; x++) {
        if (tiles[doorYA][x].type === 'wall') tiles[doorYA][x].type = 'corridor';
      }

      // 2. Vertical along midX column from doorYA to doorYB
      const minY = Math.min(doorYA, doorYB);
      const maxY = Math.max(doorYA, doorYB);
      for (let y = minY; y <= maxY; y++) {
        if (tiles[y][midX].type === 'wall') tiles[y][midX].type = 'corridor';
      }

      // 3. Horizontal from midX to rB left edge at doorYB
      for (let x = midX; x <= rightDoorX; x++) {
        if (tiles[doorYB][x].type === 'wall') tiles[doorYB][x].type = 'corridor';
      }
    } else {
      // Vertical connection: rA is North, rB is South
      const topDoorY = rA.y + rA.height; // 1 tile south of room A
      const bottomDoorY = rB.y - 1; // 1 tile north of room B

      // Choose door X inside the interior of each room (avoiding corners)
      const doorXA = rA.x + 1 + Math.floor(Math.random() * Math.max(1, rA.width - 2));
      const doorXB = rB.x + 1 + Math.floor(Math.random() * Math.max(1, rB.width - 2));

      // Midpoint in the wall gap between the two cells
      const midY = Math.floor((topDoorY + bottomDoorY) / 2);

      // 1. Vertical from rA bottom edge to midY at doorXA
      for (let y = topDoorY; y <= midY; y++) {
        if (tiles[y][doorXA].type === 'wall') tiles[y][doorXA].type = 'corridor';
      }

      // 2. Horizontal along midY row from doorXA to doorXB
      const minX = Math.min(doorXA, doorXB);
      const maxX = Math.max(doorXA, doorXB);
      for (let x = minX; x <= maxX; x++) {
        if (tiles[midY][x].type === 'wall') tiles[midY][x].type = 'corridor';
      }

      // 3. Vertical from midY to rB top edge at doorXB
      for (let y = midY; y <= bottomDoorY; y++) {
        if (tiles[y][doorXB].type === 'wall') tiles[y][doorXB].type = 'corridor';
      }
    }
  }
}

/**
 * Enforces strict 1-tile corridor width across the entire map.
 * Reverts any redundant 2x2 corridor blocks back to wall tiles.
 */
function enforceSingleTileCorridors(tiles: Tile[][], width: number, height: number) {
  for (let y = 1; y < height - 2; y++) {
    for (let x = 1; x < width - 2; x++) {
      const t00 = tiles[y][x];
      const t10 = tiles[y][x + 1];
      const t01 = tiles[y + 1][x];
      const t11 = tiles[y + 1][x + 1];

      // If all 4 are walkable and at least one is a corridor (not purely inside a room)
      const allWalkable =
        t00.type !== 'wall' &&
        t10.type !== 'wall' &&
        t01.type !== 'wall' &&
        t11.type !== 'wall';

      const hasCorridor =
        t00.type === 'corridor' ||
        t10.type === 'corridor' ||
        t01.type === 'corridor' ||
        t11.type === 'corridor';

      if (allWalkable && hasCorridor) {
        // If one of the 4 tiles is a corridor corner, turn it back into wall to preserve 1-tile width
        const corridorTiles = [t00, t10, t01, t11].filter((t) => t.type === 'corridor');
        if (corridorTiles.length > 0) {
          // Revert the first corridor tile to wall
          corridorTiles[0].type = 'wall';
        }
      }
    }
  }
}

function getRandomEmptyTile(
  tiles: Tile[][],
  rooms: Room[],
  start: Position,
  stairs: Position
): Position | null {
  for (let attempts = 0; attempts < 100; attempts++) {
    const r = rooms[Math.floor(Math.random() * rooms.length)];
    const pos = getRandomEmptyInRoom(tiles, r, start, stairs);
    if (pos) return pos;
  }
  return null;
}

function getRandomEmptyInRoom(
  tiles: Tile[][],
  room: Room,
  start: Position,
  stairs: Position,
  blocked?: Set<string>
): Position | null {
  for (let attempts = 0; attempts < 80; attempts++) {
    const x = room.x + Math.floor(Math.random() * room.width);
    const y = room.y + Math.floor(Math.random() * room.height);

    if (x === start.x && y === start.y) continue;
    if (x === stairs.x && y === stairs.y) continue;
    if (blocked?.has(`${x},${y}`)) continue;
    if (tiles[y][x].type === 'floor' && !tiles[y][x].trap) {
      return { x, y };
    }
  }
  return null;
}

/**
 * Computes Field of View (FOV) for the player:
 * - If inside a room: reveals all room tiles plus border walls and 1 step into corridors
 * - If inside a corridor: reveals tiles within Manhattan distance / radius 2
 */
export function updateFOV(tiles: Tile[][], rooms: Room[], playerPos: Position): void {
  const currentTile = tiles[playerPos.y]?.[playerPos.x];
  if (!currentTile) return;

  // Reset visibility
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[0].length; x++) {
      tiles[y][x].visible = false;
    }
  }

  // Check if player is in a room
  const inRoomIndex = currentTile.roomIndex;

  if (inRoomIndex !== undefined && rooms[inRoomIndex]) {
    const r = rooms[inRoomIndex];
    // Reveal entire room plus 1 tile border
    const minX = Math.max(0, r.x - 1);
    const maxX = Math.min(tiles[0].length - 1, r.x + r.width);
    const minY = Math.max(0, r.y - 1);
    const maxY = Math.min(tiles.length - 1, r.y + r.height);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        tiles[y][x].visible = true;
        tiles[y][x].seen = true;
      }
    }
  } else {
    // In corridor: radius 2 vision
    const radius = 2;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = playerPos.x + dx;
        const ny = playerPos.y + dy;
        if (nx >= 0 && nx < tiles[0].length && ny >= 0 && ny < tiles.length) {
          const dist = Math.hypot(dx, dy);
          if (dist <= radius + 0.5) {
            tiles[ny][nx].visible = true;
            tiles[ny][nx].seen = true;
          }
        }
      }
    }
  }
}
