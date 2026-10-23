/**
 * Classic Mystery Dungeon Radar Minimap Component
 * Displays explored floor layouts, room boundaries, player location,
 * visible monsters (red), items (cyan), and discovered stairs (yellow).
 */

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { GameEngine } from '../game/gameEngine';

interface Props {
  engine: GameEngine;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const Minimap: React.FC<Props> = ({ engine, expanded = false, onToggleExpand }) => {
  const { floor, player } = engine;
  const scale = expanded ? 7 : 3.8;

  const mapW = floor.width * scale;
  const mapH = floor.height * scale;

  return (
    <div
      onClick={onToggleExpand}
      title="タップで地図を拡大/縮小"
      className={`cursor-pointer transition-all border-2 border-white/60 bg-black/85 p-1 rounded shadow-lg backdrop-blur select-none ${
        expanded
          ? 'fixed inset-0 m-auto z-40 max-w-fit max-h-fit p-4 bg-black/95 border-amber-400'
          : 'relative'
      }`}
    >
      {expanded && (
        <div className="text-xs text-amber-300 font-bold mb-2 flex justify-between items-center">
          <span>地下迷宮 全体マップ（第 {floor.floorNumber} 階）</span>
          <span className="text-white/60 text-[10px]">タップで閉じる</span>
        </div>
      )}

      <svg
        width={mapW}
        height={mapH}
        className={`block overflow-hidden h-auto ${expanded ? '' : 'max-w-[32vw] sm:max-w-[11rem] max-h-[28vh]'}`}
      >
        {/* Render explored floor / corridors */}
        {floor.tiles.map((row, y) =>
          row.map((tile, x) => {
            if (!tile.seen) return null;
            if (tile.type === 'floor' || tile.type === 'corridor') {
              return (
                <rect
                  key={`${x}_${y}`}
                  x={x * scale}
                  y={y * scale}
                  width={scale}
                  height={scale}
                  fill={tile.roomIndex !== undefined ? '#3a415a' : '#2b3042'}
                />
              );
            }
            if (tile.type === 'stairs') {
              return (
                <rect
                  key={`${x}_${y}`}
                  x={x * scale}
                  y={y * scale}
                  width={scale}
                  height={scale}
                  fill="#ffd166"
                />
              );
            }
            return null;
          })
        )}

        {/* Render Items (Cyan dots) */}
        {floor.items.map((item, idx) => {
          const tile = floor.tiles[item.y]?.[item.x];
          if (!tile?.seen) return null;
          return (
            <circle
              key={`item_${idx}`}
              cx={item.x * scale + scale / 2}
              cy={item.y * scale + scale / 2}
              r={scale * 0.45}
              fill="#06d6a0"
            />
          );
        })}

        {/* Render Monsters (Red dots, only visible monsters) */}
        {floor.monsters.map((monster) => {
          const tile = floor.tiles[monster.y]?.[monster.x];
          if (!tile?.visible) return null;
          return (
            <circle
              key={monster.id}
              cx={monster.x * scale + scale / 2}
              cy={monster.y * scale + scale / 2}
              r={scale * 0.55}
              fill="#ef476f"
            />
          );
        })}

        {/* Render Player (Pulsing White dot) */}
        <circle
          cx={player.x * scale + scale / 2}
          cy={player.y * scale + scale / 2}
          r={scale * 0.65}
          fill="#ffffff"
          stroke="#118ab2"
          strokeWidth="1"
          className="animate-pulse"
        />
      </svg>

      {/* Compact view: make the tap-to-enlarge action explicit */}
      {!expanded && (
        <div className="mt-1 flex flex-col items-center text-center leading-tight pointer-events-none">
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-300">
            <Maximize2 size={10} />
            <span>地図拡大</span>
          </span>
          <span className="text-[9px] text-white/70">タップで拡大</span>
        </div>
      )}

      {/* Legend on expanded view */}
      {expanded && (
        <div className="flex items-center justify-around text-[10px] text-white/80 mt-2 gap-2 border-t border-white/20 pt-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            <span>勇者</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef476f] inline-block"></span>
            <span>敵</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#06d6a0] inline-block"></span>
            <span>道具</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#ffd166] inline-block"></span>
            <span>階段</span>
          </div>
        </div>
      )}
    </div>
  );
};
