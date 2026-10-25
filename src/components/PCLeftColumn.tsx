/**
 * PC Left Column: Permanent Inventory and Adventure Log Column
 * Docked on the left side of the screen on desktop displays.
 */

import React, { useState, useRef, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { Item, LogMessage } from '../types/game';
import { getItemMinimalStat } from '../game/itemData';
import { ItemPixelIcon } from './ItemPixelIcon';
import { Backpack, Trash2, Sword, Shield, Sparkles, ScrollText } from 'lucide-react';

interface Props {
  engine: GameEngine;
  onActionComplete: () => void;
}

export const PCLeftColumn: React.FC<Props> = ({ engine, onActionComplete }) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const items = engine.player.inventory;
  const selectedItem: Item | undefined = items[selectedItemIndex] || items[0];
  const floorItemAtFeet = engine.getFloorItemAtFeet();

  // Auto-scroll logs to bottom so newest 2 lines are always displayed
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [engine.logs]);

  const handleUse = (item: Item) => {
    engine.useItem(item);
    // Auto-sorting may move the item; keep it selected for the next action.
    const nextIndex = engine.player.inventory.findIndex((i) => i.id === item.id);
    if (nextIndex >= 0) setSelectedItemIndex(nextIndex);
    onActionComplete();
  };

  const handleDrop = (item: Item) => {
    engine.dropItem(item);
    if (selectedItemIndex >= items.length - 1) {
      setSelectedItemIndex(Math.max(0, items.length - 2));
    }
    onActionComplete();
  };

  return (
    <aside className="w-80 lg:w-88 h-full bg-neutral-950 border-r-2 border-white/60 flex flex-col font-['DotGothic16'] text-white select-none overflow-hidden z-20 shadow-2xl">
      {/* 1. どうぐ・所持品 常時表示セクション (メイン表示エリア) */}
      <section className="flex-1 flex flex-col min-h-0 p-3 bg-black/70 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/20 pb-1.5 mb-2 shrink-0">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
            <Backpack size={16} />
            <span>【 どうぐ・所持品 】</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-400/80 bg-neutral-900 border border-white/20 px-1.5 py-0.5 rounded">
              自動整頓中
            </span>
            <span className="text-xs text-white/60">
              ({items.length} / {engine.player.maxInventory})
            </span>
          </div>
        </div>

        {/* Item List (Scrollable - expands to fill space) */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 bg-neutral-950/80 p-1.5 rounded border border-white/20">
          {items.length === 0 ? (
            <div className="text-white/40 text-xs text-center py-8">道具を持っていません</div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedItemIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemIndex(idx)}
                  className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-amber-500 text-black font-bold'
                      : 'hover:bg-neutral-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <ItemPixelIcon item={item} size={18} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                    {getItemMinimalStat(item) && (
                      <span
                        className={`font-mono text-[10px] px-1 py-0.2 rounded font-bold shrink-0 ${
                          isSelected
                            ? 'bg-black/30 text-neutral-900'
                            : 'bg-neutral-800 text-amber-300 border border-white/20'
                        }`}
                      >
                        {getItemMinimalStat(item)}
                      </span>
                    )}
                    {item.equipped && (
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          isSelected ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'
                        }`}
                      >
                        E
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Item Detail & Quick Actions */}
        <div className="mt-2 pt-2 border-t border-white/20 shrink-0 bg-neutral-900/60 p-2 rounded border border-white/10 text-xs space-y-1.5">
          {selectedItem ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 truncate">
                  <ItemPixelIcon item={selectedItem} size={22} />
                  <span className="truncate max-w-[160px]">{selectedItem.name}</span>
                </span>
                <span className="text-[10px] text-white/50 shrink-0">{getItemTypeLabel(selectedItem.type)}</span>
              </div>

              <p className="text-[11px] text-white/80 line-clamp-2 leading-tight">
                {selectedItem.description}
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => handleUse(selectedItem)}
                  className="bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 border border-white/60 py-1.5 px-1.5 rounded text-xs font-bold text-white transition active:scale-95 text-center truncate cursor-pointer shadow"
                >
                  {isEquippable(selectedItem.type)
                    ? selectedItem.equipped
                      ? 'はずす'
                      : 'そうび'
                    : 'つかう'}
                </button>

                <button
                  onClick={() => handleDrop(selectedItem)}
                  title={
                    floorItemAtFeet
                      ? `足元の「${floorItemAtFeet.item.name}」と交換して手に入れます`
                      : '足元に置きます'
                  }
                  className={`border py-1.5 px-1.5 rounded text-[11px] font-bold transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer truncate shadow ${
                    floorItemAtFeet
                      ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-300 animate-pulse'
                      : 'bg-neutral-800 hover:bg-red-900 border-white/30 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Trash2 size={12} className="shrink-0" />
                  <span className="truncate">
                    {floorItemAtFeet ? '置く（交換）' : '足元に置く'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-white/40 text-center py-2 text-xs">道具を選択してください</div>
          )}
        </div>
      </section>

      {/* 2. 冒険の記録 (2行まで常時表示・3行目以降はスクロールバー) */}
      <section className="shrink-0 p-3 bg-black/95 border-t-2 border-white/40">
        <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
            <ScrollText size={14} />
            <span>【 冒険の記録 】</span>
          </div>
          <span className="text-[10px] text-white/50">2行表示 / スクロール対応</span>
        </div>

        {/* 2 lines height with scrollbar for 3rd line and beyond */}
        <div
          ref={logContainerRef}
          className="h-[3.25rem] overflow-y-auto space-y-0.5 text-xs leading-snug pr-1.5 bg-neutral-950/90 p-1.5 rounded border border-white/20 select-text scrollbar-thin"
        >
          {engine.logs.map((log) => (
            <div key={log.id} className={`break-words ${getLogColor(log.type)}`}>
              {log.text}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

function getItemTypeLabel(type: string): string {
  switch (type) {
    case 'weapon':
      return '武器';
    case 'shield':
      return '盾';
    case 'armor':
      return '鎧';
    case 'helmet':
      return '兜';
    case 'herb':
      return '薬草';
    case 'food':
      return '食料';
    case 'scroll':
      return '巻物';
    case 'wand':
      return '杖';
    default:
      return '道具';
  }
}

function isEquippable(type: string): boolean {
  return ['weapon', 'shield', 'armor', 'helmet', 'accessory'].includes(type);
}

function getLogColor(type: LogMessage['type']): string {
  switch (type) {
    case 'danger':
      return 'text-red-400 font-bold';
    case 'combat':
      return 'text-amber-200';
    case 'level':
      return 'text-emerald-300 font-bold';
    case 'item':
      return 'text-sky-300';
    case 'magic':
      return 'text-purple-300';
    default:
      return 'text-neutral-200';
  }
}
