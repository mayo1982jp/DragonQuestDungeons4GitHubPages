/**
 * Dungeon Viewport Canvas
 * Camera-tracked 2D retro canvas with themed tilesets, Fog of War,
 * dynamic hero equipment rendering, monsters, floating damage, and spell VFX.
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/gameEngine';
import { drawHero, drawItem, drawMonster } from '../graphics/pixelSprites';
import { FloorTheme, Tile } from '../types/game';

interface Props {
  engine: GameEngine;
  onTileClick?: (x: number, y: number, isRightClick?: boolean) => void;
  tileSize?: number;
}

export const DungeonCanvas: React.FC<Props> = ({ engine, onTileClick, tileSize = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverTile, setHoverTile] = React.useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = React.useState<number>(tileSize);

  // Sync zoom with prop
  useEffect(() => {
    setZoom(tileSize);
  }, [tileSize]);

  const currentTileSize = zoom;

  useEffect(() => {
    let animId: number;

    const render = () => {
      engine.cleanOldEffects();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle high DPI
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.imageSmoothingEnabled = false;

      // Fill background pitch black
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, width, height);

      // Camera calculation centered on player
      const activeTileSize = currentTileSize;
      const now = Date.now();

      // Screen shake & flash driven by the strongest active spell effect
      let shakeStrength = 0;
      let flashStrength = 0;
      let flashColor = '#ffffff';
      for (const effect of engine.visualEffects) {
        const progress = (now - effect.createdAt) / effect.duration;
        if (progress < 0 || progress > 1) continue;
        const fade = 1 - progress;
        if (effect.type === 'explosion') {
          shakeStrength = Math.max(shakeStrength, 7 * fade);
          flashStrength = Math.max(flashStrength, 0.2 * fade);
          flashColor = '#ffd166';
        } else if (effect.type === 'lightning') {
          shakeStrength = Math.max(shakeStrength, 4.5 * fade);
          flashStrength = Math.max(flashStrength, 0.14 * fade);
          flashColor = '#aefaff';
        } else if (effect.type === 'fire') {
          flashStrength = Math.max(flashStrength, 0.05 * fade);
          flashColor = flashColor === '#ffffff' ? '#ffb703' : flashColor;
        } else if (effect.type === 'heal') {
          flashStrength = Math.max(flashStrength, 0.05 * fade);
          flashColor = flashColor === '#ffffff' ? '#b7efc5' : flashColor;
        }
      }

      const shakeX = shakeStrength > 0 ? Math.sin(now * 0.09) * shakeStrength : 0;
      const shakeY = shakeStrength > 0 ? Math.cos(now * 0.13) * shakeStrength * 0.7 : 0;
      const cameraX = Math.round(width / 2 - (engine.player.x + 0.5) * activeTileSize + shakeX);
      const cameraY = Math.round(height / 2 - (engine.player.y + 0.5) * activeTileSize + shakeY);

      ctx.save();
      ctx.translate(cameraX, cameraY);

      const theme = engine.floor.theme;

      // 1. Render Tiles (Visible & Seen memory)
      const minTileX = Math.max(0, Math.floor(-cameraX / activeTileSize) - 1);
      const maxTileX = Math.min(engine.floor.width - 1, Math.ceil((-cameraX + width) / activeTileSize) + 1);
      const minTileY = Math.max(0, Math.floor(-cameraY / activeTileSize) - 1);
      const maxTileY = Math.min(engine.floor.height - 1, Math.ceil((-cameraY + height) / activeTileSize) + 1);

      for (let y = minTileY; y <= maxTileY; y++) {
        for (let x = minTileX; x <= maxTileX; x++) {
          const tile = engine.floor.tiles[y][x];
          if (!tile.seen) continue; // Unseen tiles are black

          const px = x * activeTileSize;
          const py = y * activeTileSize;

          drawTile(ctx, px, py, activeTileSize, tile, theme, tile.visible);

          // Draw revealed Trap
          if (tile.trap && tile.trap.revealed && tile.visible) {
            drawTrap(ctx, px, py, activeTileSize, tile.trap.type);
          }
        }
      }

      // 2. Render Items (visible tiles bright, remembered tiles slightly dimmed)
      for (const itemObj of engine.floor.items) {
        const tile = engine.floor.tiles[itemObj.y]?.[itemObj.x];
        if (tile && (tile.visible || tile.seen)) {
          const px = itemObj.x * activeTileSize;
          const py = itemObj.y * activeTileSize;
          ctx.save();
          ctx.globalAlpha = tile.visible ? 1 : 0.85;
          drawItem(ctx, px, py, activeTileSize, itemObj.item);
          ctx.restore();
        }
      }

      // 3. Render Monsters (bright inside FOV, ghostly where already explored)
      for (const monster of engine.floor.monsters) {
        const tile = engine.floor.tiles[monster.y]?.[monster.x];
        if (!tile || (!tile.visible && !tile.seen)) continue;

        const px = monster.x * activeTileSize;
        const py = monster.y * activeTileSize;

        ctx.save();
        // Enemies previously seen stay visible as a dim memory instead of vanishing.
        if (!tile.visible) ctx.globalAlpha = 0.45;
        drawMonster(
          ctx,
          px,
          py,
          activeTileSize,
          monster.spriteKey,
          monster.isBoss,
          (monster.sleeping || 0) > 0
        );
        ctx.restore();

        // Monster HP Bar (thin retro health line, only for enemies in sight)
        if (tile.visible && monster.hp < monster.maxHp) {
          const hpRatio = Math.max(0, monster.hp / monster.maxHp);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 4, py - 4, activeTileSize - 8, 4);
          ctx.fillStyle = hpRatio > 0.5 ? '#52b788' : hpRatio > 0.25 ? '#ffd166' : '#e63946';
          ctx.fillRect(px + 4, py - 4, (activeTileSize - 8) * hpRatio, 4);
        }
      }

      // 4. Render Hero with equipment
      const heroPx = engine.player.x * activeTileSize;
      const heroPy = engine.player.y * activeTileSize;
      const isAttacking = engine.visualEffects.some(
        (e) => e.type === 'slash' && now - e.createdAt < 220
      );
      drawHero(
        ctx,
        heroPx,
        heroPy,
        activeTileSize,
        engine.player.equipment,
        engine.player.direction,
        false,
        isAttacking
      );

      // 4.5 Render Hover / Target Reticle (PC Cursor)
      if (hoverTile && hoverTile.x >= 0 && hoverTile.x < engine.floor.width && hoverTile.y >= 0 && hoverTile.y < engine.floor.height) {
        const hTile = engine.floor.tiles[hoverTile.y][hoverTile.x];
        if (hTile?.seen) {
          const hpx = hoverTile.x * activeTileSize;
          const hpy = hoverTile.y * activeTileSize;
          const isEnemy = engine.floor.monsters.some((m) => m.x === hoverTile.x && m.y === hoverTile.y && hTile.visible);
          const isAdjacent = Math.abs(hoverTile.x - engine.player.x) <= 1 && Math.abs(hoverTile.y - engine.player.y) <= 1;

          ctx.strokeStyle = isEnemy ? '#ff3366' : isAdjacent ? '#ffe66d' : '#00b4d8';
          ctx.lineWidth = 2;
          ctx.strokeRect(hpx + 1, hpy + 1, activeTileSize - 2, activeTileSize - 2);

          // Subtle corner brackets
          const bracketLen = 6;
          ctx.fillStyle = isEnemy ? '#ff3366' : '#ffe66d';
          ctx.fillRect(hpx, hpy, bracketLen, 2);
          ctx.fillRect(hpx, hpy, 2, bracketLen);
          ctx.fillRect(hpx + activeTileSize - bracketLen, hpy, bracketLen, 2);
          ctx.fillRect(hpx + activeTileSize - 2, hpy, 2, bracketLen);
          ctx.fillRect(hpx, hpy + activeTileSize - 2, bracketLen, 2);
          ctx.fillRect(hpx, hpy + activeTileSize - bracketLen, 2, bracketLen);
          ctx.fillRect(hpx + activeTileSize - bracketLen, hpy + activeTileSize - 2, bracketLen, 2);
          ctx.fillRect(hpx + activeTileSize - 2, hpy + activeTileSize - bracketLen, 2, bracketLen);
        }
      }

      // 5. Render Visual Effects (Spell explosions, slashes, heal stars)
      for (const effect of engine.visualEffects) {
        const progress = (now - effect.createdAt) / effect.duration;
        if (progress > 1) continue;

        const ex = effect.x * activeTileSize + activeTileSize / 2;
        const ey = effect.y * activeTileSize + activeTileSize / 2;
        drawVisualEffect(ctx, ex, ey, effect.type, progress, effect.createdAt);
      }

      // 6. Render Floating Texts (Damage numbers, EXP)
      for (const ft of engine.floatingTexts) {
        const progress = (now - ft.createdAt) / ft.duration;
        if (progress > 1) continue;

        const tx = ft.x * activeTileSize + activeTileSize / 2;
        const ty = ft.y * activeTileSize - progress * 24;

        ctx.save();
        ctx.globalAlpha = 1 - progress * 0.7;
        ctx.font = 'bold 15px DotGothic16, monospace';
        ctx.textAlign = 'center';
        // Dark outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, tx, ty);
        // Text
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, tx, ty);
        ctx.restore();
      }

      ctx.restore();

      // Full-screen magic flash overlay (drawn outside the camera transform)
      if (flashStrength > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.32, flashStrength);
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, currentTileSize]);

  const lastTouchTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const getTileFromCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const activeTileSize = currentTileSize;
    const cameraX = Math.round(width / 2 - (engine.player.x + 0.5) * activeTileSize);
    const cameraY = Math.round(height / 2 - (engine.player.y + 0.5) * activeTileSize);

    const worldX = Math.floor((clickX - cameraX) / activeTileSize);
    const worldY = Math.floor((clickY - cameraY) / activeTileSize);

    if (worldX >= 0 && worldX < engine.floor.width && worldY >= 0 && worldY < engine.floor.height) {
      return { x: worldX, y: worldY };
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const tile = getTileFromCoords(e.clientX, e.clientY);
    if (tile) {
      if (!hoverTile || hoverTile.x !== tile.x || hoverTile.y !== tile.y) {
        setHoverTile(tile);
      }
    } else {
      setHoverTile(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverTile(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    // If movement was small (< 18px), treat as clean tap to move
    if (dist < 18 && onTileClick) {
      const tile = getTileFromCoords(touch.clientX, touch.clientY);
      if (tile) {
        lastTouchTimeRef.current = Date.now();
        onTileClick(tile.x, tile.y, false);
      }
    }
    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 450) return; // Prevent duplicate touch clicks
    if (!onTileClick) return;
    const tile = getTileFromCoords(e.clientX, e.clientY);
    if (tile) {
      onTileClick(tile.x, tile.y, false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!onTileClick) return;
    const tile = getTileFromCoords(e.clientX, e.clientY);
    if (tile) {
      onTileClick(tile.x, tile.y, true);
    }
  };

  // Inspect target if hovered
  const hoveredMonster =
    hoverTile &&
    engine.floor.tiles[hoverTile.y]?.[hoverTile.x]?.visible
      ? engine.floor.monsters.find((m) => m.x === hoverTile.x && m.y === hoverTile.y)
      : null;

  const hoveredItem =
    hoverTile &&
    engine.floor.tiles[hoverTile.y]?.[hoverTile.x]?.seen
      ? engine.floor.items.find((i) => i.x === hoverTile.x && i.y === hoverTile.y)
      : null;

  const hoveredTrap =
    hoverTile &&
    engine.floor.tiles[hoverTile.y]?.[hoverTile.x]?.visible
      ? engine.floor.tiles[hoverTile.y][hoverTile.x].trap?.revealed
        ? engine.floor.tiles[hoverTile.y][hoverTile.x].trap
        : null
      : null;

  const isHoveredStairs =
    hoverTile &&
    hoverTile.x === engine.floor.stairsPos.x &&
    hoverTile.y === engine.floor.stairsPos.y &&
    engine.floor.tiles[hoverTile.y]?.[hoverTile.x]?.seen;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none font-['DotGothic16']">
      {/* Touch to Move Notification Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none bg-black/80 border border-amber-400/80 rounded px-2.5 py-1 text-[11px] text-amber-300 font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
        <span>👆 タッチで移動可</span>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-crosshair touch-none block"
      />

      {/* PC Mouse Inspection Tooltip (Floating Pill) */}
      {(hoveredMonster || hoveredItem || hoveredTrap || isHoveredStairs) && (
        <div className="absolute top-11 left-2.5 z-30 pointer-events-none bg-black/90 border-2 border-amber-400 p-2.5 rounded shadow-2xl text-white text-xs max-w-xs animate-fade-in backdrop-blur-sm">
          {hoveredMonster && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-1">
                <span className="font-bold text-red-400 text-sm">{hoveredMonster.name}</span>
                <span className="text-[10px] bg-red-950 px-1.5 py-0.5 rounded text-red-200">
                  {hoveredMonster.isBoss ? 'BOSS' : '敵'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span>HP: {hoveredMonster.hp} / {hoveredMonster.maxHp}</span>
                <span>攻撃: {hoveredMonster.attack}</span>
                <span>守備: {hoveredMonster.defense}</span>
              </div>
              <div className="text-[10px] text-amber-200">
                距離: {Math.max(Math.abs(hoveredMonster.x - engine.player.x), Math.abs(hoveredMonster.y - engine.player.y))} マス
                {(hoveredMonster.sleeping || 0) > 0 && ' (熟睡中)'}
              </div>
            </div>
          )}

          {hoveredItem && !hoveredMonster && (
            <div className="space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1 text-sm">
                <span>{hoveredItem.item.icon}</span>
                <span>{hoveredItem.item.name}</span>
              </div>
              <p className="text-[11px] text-white/80">{hoveredItem.item.description}</p>
              <div className="text-[10px] text-sky-300">左クリックまたは移動で足元から拾う</div>
            </div>
          )}

          {hoveredTrap && !hoveredMonster && !hoveredItem && (
            <div className="space-y-1">
              <div className="font-bold text-rose-400 text-sm">⚠️ {hoveredTrap.name}</div>
              <p className="text-[11px] text-white/80">踏むと罠が作動します！迂回推奨。</p>
            </div>
          )}

          {isHoveredStairs && !hoveredMonster && !hoveredItem && !hoveredTrap && (
            <div className="space-y-1">
              <div className="font-bold text-amber-300 text-sm">🪜 下り階段</div>
              <p className="text-[11px] text-white/80">次の階層（B{engine.floor.floorNumber + 1}F）へ進みます。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Tile Theme Colors & Drawing ---
function drawTile(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  tile: Tile,
  theme: FloorTheme,
  visible: boolean
) {
  ctx.save();
  if (!visible) {
    ctx.globalAlpha = 0.35; // Dim fog of war for seen tiles
  }

  // Theme palettes
  let floorColor = '#242124';
  let floorTileBorder = '#1c191c';
  let wallTop = '#4a464a';
  let wallSide = '#2e2b2e';

  if (theme === 'cave') {
    floorColor = '#2b2118';
    floorTileBorder = '#1f1610';
    wallTop = '#523a2a';
    wallSide = '#382519';
  } else if (theme === 'ruins') {
    floorColor = '#1d2a33';
    floorTileBorder = '#141d24';
    wallTop = '#3a5061';
    wallSide = '#233440';
  } else if (theme === 'ice') {
    floorColor = '#15293d';
    floorTileBorder = '#0d1b2a';
    wallTop = '#48cae4';
    wallSide = '#0077b6';
  } else if (theme === 'volcano') {
    floorColor = '#261214';
    floorTileBorder = '#1a0b0d';
    wallTop = '#77181c';
    wallSide = '#420d10';
  } else if (theme === 'crypt') {
    floorColor = '#21182c';
    floorTileBorder = '#160e20';
    wallTop = '#5e3a79';
    wallSide = '#3a2050';
  } else if (theme === 'citadel') {
    floorColor = '#0f142b';
    floorTileBorder = '#070a18';
    wallTop = '#ffd166';
    wallSide = '#2b1e4a';
  }

  if (tile.type === 'floor' || tile.type === 'corridor') {
    ctx.fillStyle = floorColor;
    ctx.fillRect(px, py, size, size);

    ctx.strokeStyle = floorTileBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

    // Subtle stone pebble accents
    if ((tile.x + tile.y) % 5 === 0) {
      ctx.fillStyle = floorTileBorder;
      ctx.fillRect(px + 6, py + 8, 3, 2);
    }
  } else if (tile.type === 'stairs') {
    // Stairs with golden glow
    ctx.fillStyle = floorColor;
    ctx.fillRect(px, py, size, size);

    // Stone stair steps
    ctx.fillStyle = '#0f0f15';
    ctx.fillRect(px + 4, py + 4, size - 8, size - 8);

    const stepColors = ['#f4a261', '#e76f51', '#264653'];
    for (let s = 0; s < 3; s++) {
      ctx.fillStyle = stepColors[s];
      ctx.fillRect(px + 6 + s * 4, py + 8 + s * 7, size - 12 - s * 8, 4);
    }

    // Glowing stairs icon
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, size - 8, size - 8);
  } else if (tile.type === 'wall') {
    // 3D wall block
    ctx.fillStyle = wallSide;
    ctx.fillRect(px, py, size, size);

    ctx.fillStyle = wallTop;
    ctx.fillRect(px, py, size, Math.floor(size * 0.45));

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, size, size);
  }

  ctx.restore();
}

function drawTrap(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, type: string) {
  ctx.save();
  ctx.strokeStyle = '#ff0055';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + size / 2, py + size / 2, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ff0055';
  ctx.font = '10px DotGothic16, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('×', px + size / 2, py + size / 2 + 3);
  ctx.restore();
}

// Small deterministic PRNG so effects keep the same shape while they animate
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawVisualEffect(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  type: string,
  progress: number,
  seed: number = 1
) {
  const p = Math.max(0, Math.min(1, progress));
  const fade = 1 - p;
  const rand = seededRandom(Math.floor(seed) + 9973);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  if (type === 'slash') {
    // Layered crescent sword slash with a bright blade streak and impact sparks
    ctx.translate(cx, cy);
    ctx.rotate(-1.15 + p * 1.9);

    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 0 ? '#ffffff' : i === 1 ? '#ffe66d' : '#7bf1ff';
      ctx.lineWidth = Math.max(0.5, (5 - i * 1.5) * fade);
      ctx.beginPath();
      ctx.arc(0, 0, 15 + p * 17 + i * 4, -1.15, 0.65);
      ctx.stroke();
    }

    // Blade flare streak
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * fade})`;
    ctx.fillRect(-2, -28 - p * 10, 4, 56 + p * 20);

    // Sparks flying out of the impact point
    for (let i = 0; i < 10; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (6 + rand() * 24) * (0.35 + p * 1.2);
      const size = 1.5 + rand() * 2.5;
      ctx.fillStyle = `rgba(255, ${210 + Math.floor(rand() * 45)}, 120, ${fade})`;
      ctx.fillRect(Math.cos(angle) * dist - size / 2, Math.sin(angle) * dist - size / 2, size, size);
    }
  } else if (type === 'fire') {
    // Roaring fireball: hot core, flame tongues, shockwave ring, and rising embers
    const radius = 13 + 30 * p;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(255, 255, 245, ${0.95 * fade})`);
    glow.addColorStop(0.25, `rgba(255, 240, 150, ${0.85 * fade})`);
    glow.addColorStop(0.55, `rgba(255, 130, 35, ${0.6 * fade})`);
    glow.addColorStop(1, 'rgba(180, 20, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Licking flame tongues
    for (let i = 0; i < 7; i++) {
      const angle = rand() * Math.PI * 2;
      const baseDist = 5 + rand() * 9;
      const height = (18 + rand() * 20) * (0.5 + p * 0.9);
      const width = 4 + rand() * 5;
      const bx = cx + Math.cos(angle) * baseDist;
      const by = cy + Math.sin(angle) * baseDist;
      ctx.fillStyle = i % 2 === 0 ? `rgba(255, 120, 25, ${0.75 * fade})` : `rgba(255, 205, 70, ${0.7 * fade})`;
      ctx.beginPath();
      ctx.moveTo(bx - width / 2, by);
      ctx.quadraticCurveTo(bx + width * 0.2, by - height, bx + width / 2, by);
      ctx.closePath();
      ctx.fill();
    }

    // Expanding shockwave ring
    ctx.strokeStyle = `rgba(255, 180, 60, ${0.8 * fade})`;
    ctx.lineWidth = Math.max(1, 3 * fade);
    ctx.beginPath();
    ctx.arc(cx, cy, 8 + 36 * p, 0, Math.PI * 2);
    ctx.stroke();

    // Embers
    for (let i = 0; i < 12; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (5 + rand() * 34) * (0.3 + p * 1.2);
      const size = 1.5 + rand() * 2.5;
      ctx.fillStyle = `rgba(255, ${150 + Math.floor(rand() * 90)}, 60, ${fade})`;
      ctx.fillRect(cx + Math.cos(angle) * dist - size / 2, cy + Math.sin(angle) * dist - p * 8 - size / 2, size, size);
    }
  } else if (type === 'heal') {
    // Holy light pillar, rotating rune ring, and rising plus-shaped sparkles
    const radius = 24 + 18 * p;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(230, 255, 235, ${0.8 * fade})`);
    glow.addColorStop(0.45, `rgba(110, 240, 170, ${0.45 * fade})`);
    glow.addColorStop(1, 'rgba(40, 180, 120, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Light column rising from the hero
    const beam = ctx.createLinearGradient(cx, cy - 76, cx, cy + 12);
    beam.addColorStop(0, 'rgba(190, 255, 210, 0)');
    beam.addColorStop(0.4, `rgba(200, 255, 220, ${0.35 * fade})`);
    beam.addColorStop(1, `rgba(255, 255, 255, ${0.55 * fade})`);
    ctx.fillStyle = beam;
    ctx.fillRect(cx - 11, cy - 76, 22, 88);

    // Rotating ring of runes
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p * Math.PI * 1.6);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const dist = 20 + p * 10;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      ctx.fillStyle = i % 2 === 0 ? `rgba(255, 245, 170, ${fade})` : `rgba(140, 255, 200, ${fade})`;
      ctx.fillRect(sx - 1.5, sy - 6, 3, 12);
      ctx.fillRect(sx - 6, sy - 1.5, 12, 3);
    }
    ctx.restore();

    // Ring pulse
    ctx.strokeStyle = `rgba(140, 255, 200, ${0.8 * fade})`;
    ctx.lineWidth = Math.max(1, 2.5 * fade);
    ctx.beginPath();
    ctx.arc(cx, cy, 14 + 30 * p, 0, Math.PI * 2);
    ctx.stroke();

    // Rising sparkles
    for (let i = 0; i < 10; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (4 + rand() * 22) * p;
      const rise = p * (26 + rand() * 26);
      const size = 2 + rand() * 2.5;
      ctx.fillStyle = i % 2 === 0 ? `rgba(190, 255, 220, ${fade})` : `rgba(255, 240, 160, ${fade})`;
      ctx.fillRect(cx + Math.cos(angle) * dist - size / 2, cy + Math.sin(angle) * dist - rise - size / 2, size, size);
    }
  } else if (type === 'lightning') {
    // Electric storm: core glow, branching bolts, crackling ring, and stray sparks
    const radius = 22 + 24 * p;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.85 * fade})`);
    glow.addColorStop(0.35, `rgba(110, 250, 255, ${0.55 * fade})`);
    glow.addColorStop(1, 'rgba(0, 120, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Jagged main bolts
    for (let bolt = 0; bolt < 3; bolt++) {
      const offset = bolt * 2 - 2;
      ctx.strokeStyle = bolt === 0 ? `rgba(255, 255, 255, ${fade})` : `rgba(90, 240, 255, ${0.9 * fade})`;
      ctx.lineWidth = bolt === 0 ? 2.5 : 5 * fade;
      ctx.beginPath();
      ctx.moveTo(cx + offset * 3, cy - 36 - bolt * 4);
      for (let s = 1; s <= 6; s++) {
        const jitter = (rand() * 2 - 1) * (10 + bolt * 4);
        ctx.lineTo(cx + offset * 3 + jitter, cy - 36 + s * 12);
      }
      ctx.stroke();

      // Side branches
      ctx.lineWidth = 1.5;
      for (let b = 0; b < 2; b++) {
        const branchY = cy - 18 + b * 18;
        ctx.beginPath();
        ctx.moveTo(cx + offset * 3, branchY);
        ctx.lineTo(cx + offset * 3 + (rand() * 2 - 1) * 24, branchY - 8 - rand() * 8);
        ctx.stroke();
      }
    }

    // Electric ring
    ctx.strokeStyle = `rgba(150, 250, 255, ${0.75 * fade})`;
    ctx.lineWidth = Math.max(1, 2.5 * fade);
    ctx.beginPath();
    ctx.arc(cx, cy, 12 + 30 * p, 0, Math.PI * 2);
    ctx.stroke();

    // Sparks
    for (let i = 0; i < 10; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (8 + rand() * 28) * (0.3 + p);
      const size = 1.5 + rand() * 2.5;
      ctx.fillStyle = `rgba(190, 255, 255, ${fade})`;
      ctx.fillRect(cx + Math.cos(angle) * dist - size / 2, cy + Math.sin(angle) * dist - size / 2, size, size);
    }
  } else if (type === 'explosion') {
    // Massive detonation: blinding core, layered fireball, double shockwave, and debris
    const radius = 14 + 46 * p;
    const blast = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    blast.addColorStop(0, `rgba(255, 255, 255, ${fade})`);
    blast.addColorStop(0.18, `rgba(255, 245, 170, ${0.95 * fade})`);
    blast.addColorStop(0.45, `rgba(255, 150, 40, ${0.8 * fade})`);
    blast.addColorStop(0.72, `rgba(220, 40, 15, ${0.55 * fade})`);
    blast.addColorStop(1, 'rgba(90, 0, 0, 0)');
    ctx.fillStyle = blast;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // White-hot inner core
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * fade})`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, 16 * fade), 0, Math.PI * 2);
    ctx.fill();

    // Double shockwave rings
    for (let ring = 0; ring < 2; ring++) {
      ctx.strokeStyle = ring === 0 ? `rgba(255, 230, 140, ${0.9 * fade})` : `rgba(255, 120, 50, ${0.6 * fade})`;
      ctx.lineWidth = Math.max(1, (4 - ring * 1.5) * fade);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * (0.75 + ring * 0.35), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Flying debris / sparks
    for (let i = 0; i < 16; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (8 + rand() * 46) * (0.25 + p * 1.25);
      const size = 2 + rand() * 3.5;
      ctx.fillStyle = i % 3 === 0 ? `rgba(255, 255, 210, ${fade})` : `rgba(255, ${100 + Math.floor(rand() * 120)}, 40, ${fade})`;
      ctx.fillRect(cx + Math.cos(angle) * dist - size / 2, cy + Math.sin(angle) * dist - size / 2, size, size);
    }
  } else if (type === 'spark') {
    // Radiant eight-point star burst
    const radius = 10 + 26 * p;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.8 * fade})`);
    glow.addColorStop(0.5, `rgba(120, 220, 255, ${0.45 * fade})`);
    glow.addColorStop(1, 'rgba(80, 120, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(220, 245, 255, ${0.85 * fade})`;
    ctx.lineWidth = Math.max(1, 2 * fade);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + p * 0.5;
      const inner = 4 + p * 6;
      const outer = 12 + p * 26;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.stroke();
    }

    for (let i = 0; i < 8; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (4 + rand() * 20) * p;
      const size = 1.5 + rand() * 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
      ctx.fillRect(cx + Math.cos(angle) * dist - size / 2, cy + Math.sin(angle) * dist - size / 2, size, size);
    }
  }

  ctx.restore();
}
