/**
 * Inventory Management Modal
 * Retro Dragon Quest style window for using, equipping, unequipping, and dropping items.
 */

import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { Item } from '../types/game';
import { getItemMinimalStat } from '../game/itemData';
import { ItemPixelIcon } from './ItemPixelIcon';
import { X, Shield, Sword, Sparkles, Trash2 } from 'lucide-react';

interface Props {
  engine: GameEngine;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export const InventoryModal: React.FC<Props> = ({ engine, isOpen, onClose, onActionComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const items = engine.player.inventory;
  const selectedItem: Item | undefined = items[selectedIndex] || items[0];
  const floorItemAtFeet = engine.getFloorItemAtFeet();

  // Always present a tidy bag: equipped gear first, then weapons/armour/consumables.
  useEffect(() => {
    if (isOpen) {
      engine.autoSortInventory();
      setSelectedIndex(0);
    }
  }, [isOpen, engine]);

  const handleUse = (item: Item) => {
    engine.useItem(item);
    // Sorting may move the item; keep the same item selected afterwards.
    const nextIndex = engine.player.inventory.findIndex((i) => i.id === item.id);
    if (nextIndex >= 0) setSelectedIndex(nextIndex);
    onActionComplete();
  };

  const handleDrop = (item: Item) => {
    engine.dropItem(item);
    if (selectedIndex >= items.length - 1) {
      setSelectedIndex(Math.max(0, items.length - 2));
    }
    onActionComplete();
  };

  // Keyboard navigation for PC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedItem) handleUse(selectedItem);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (selectedItem) handleDrop(selectedItem);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedItem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 select-none font-['DotGothic16'] animate-fade-in">
      <div className="relative w-full max-w-xl bg-black border-4 border-white/90 rounded-lg p-4 text-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white/40 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 text-lg font-bold">【 どうぐ・そうび 】</span>
            <span className="text-[10px] text-amber-300 bg-neutral-900 border border-amber-400/50 px-1.5 py-0.5 rounded font-bold">
              自動整頓
            </span>
            <span className="text-xs text-white/60">
              ({items.length} / {engine.player.maxInventory})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded border border-white/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* Item List */}
          <div className="border-2 border-white/30 rounded p-2 overflow-y-auto max-h-64 sm:max-h-80 bg-neutral-950">
            {items.length === 0 ? (
              <p className="text-white/50 text-center py-6 text-sm">道具を持っていません</p>
            ) : (
              <div className="space-y-1">
                {items.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-amber-500 text-black font-bold'
                          : 'hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ItemPixelIcon item={item} size={20} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs">
                        {getItemMinimalStat(item) && (
                          <span
                            className={`font-mono text-[10px] px-1 py-0.2 rounded font-bold shrink-0 ${
                              isSelected
                                ? 'bg-black/30 text-neutral-900'
                                : 'bg-neutral-850 text-amber-300 border border-white/20'
                            }`}
                          >
                            {getItemMinimalStat(item)}
                          </span>
                        )}
                        {item.equipped && (
                          <span className={`px-1 py-0.2 rounded text-[10px] font-bold shrink-0 ${isSelected ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'}`}>
                            E
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item Details and Actions */}
          <div className="border-2 border-white/30 rounded p-3 bg-neutral-950 flex flex-col justify-between">
            {selectedItem ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 border-b border-white/20 pb-2">
                    <ItemPixelIcon item={selectedItem} size={28} />
                    <div>
                      <h4 className="font-bold text-amber-300 text-sm sm:text-base">
                        {selectedItem.name}
                      </h4>
                      <p className="text-[11px] text-white/60">
                        種別: {getItemTypeLabel(selectedItem.type)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed bg-black/40 p-2 rounded border border-white/10">
                    {selectedItem.description}
                  </p>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-white/70">
                    {selectedItem.power !== undefined && (
                      <div className="flex items-center gap-1">
                        {selectedItem.type === 'weapon' ? (
                          <>
                            <Sword size={12} className="text-amber-400" />
                            <span>攻撃力: +{selectedItem.power}</span>
                          </>
                        ) : (
                          <>
                            <Shield size={12} className="text-sky-400" />
                            <span>防御力: +{selectedItem.power}</span>
                          </>
                        )}
                      </div>
                    )}
                    {selectedItem.healAmount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-emerald-400" />
                        <span>回復量: HP {selectedItem.healAmount}</span>
                      </div>
                    )}
                    {selectedItem.fullnessAmount !== undefined && (
                      <div>満腹度: +{selectedItem.fullnessAmount}%</div>
                    )}
                    {selectedItem.charges !== undefined && (
                      <div>残使用回数: {selectedItem.charges} 回</div>
                    )}
                    <div>価値: {selectedItem.value} G</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-white/20">
                  <button
                    onClick={() => handleUse(selectedItem)}
                    className="bg-emerald-700 hover:bg-emerald-600 border-2 border-white/60 py-1.5 px-2 rounded text-xs sm:text-sm font-bold text-white transition active:scale-95"
                  >
                    {isEquippable(selectedItem.type)
                      ? selectedItem.equipped
                        ? 'はずす'
                        : 'そうびする'
                      : 'つかう'}
                  </button>

                  <button
                    onClick={() => handleDrop(selectedItem)}
                    title={
                      floorItemAtFeet
                        ? `足元の「${floorItemAtFeet.item.name}」と交換して手に入れます`
                        : '足元に置きます'
                    }
                    className={`border-2 py-1.5 px-2 rounded text-xs sm:text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer truncate ${
                      floorItemAtFeet
                        ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-300 animate-pulse'
                        : 'bg-neutral-800 hover:bg-red-900 border-white/40 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Trash2 size={13} className="shrink-0" />
                    <span className="truncate">
                      {floorItemAtFeet ? '置く（交換）' : '足元に置く'}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-xs">
                アイテムを選択してください
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-3 text-[11px] text-white/50 text-right">
          [Esc] または [×] で閉じる
        </div>
      </div>
    </div>
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
      return '薬草・聖水';
    case 'food':
      return '食料';
    case 'scroll':
      return '巻物';
    case 'wand':
      return '魔法の杖';
    default:
      return 'その他';
  }
}

function isEquippable(type: string): boolean {
  return ['weapon', 'shield', 'armor', 'helmet', 'accessory'].includes(type);
}
