/**
 * Monster Bestiary (モンスター図鑑) Modal
 * Displays discovered monsters, pixel sprites, stats, encounter count, and lore.
 */

import React, { useState, useEffect } from 'react';
import { loadBestiary } from '../game/storage';
import { BestiaryEntry } from '../types/game';
import { X, Shield, Sword, Sparkles, Award } from 'lucide-react';

import { MonsterPixelCanvas } from './MonsterPixelCanvas';
import { MONSTER_DEFINITIONS } from '../game/monsterData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BestiaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [bestiary, setBestiary] = useState<Record<string, BestiaryEntry>>({});
  const [selectedKey, setSelectedKey] = useState<string>('slime');

  useEffect(() => {
    if (isOpen) {
      const data = loadBestiary();
      setBestiary(data);
      const keys = Object.keys(data);
      if (keys.length > 0 && !data[selectedKey]) {
        setSelectedKey(keys[0]);
      }
    }
  }, [isOpen, selectedKey]);

  if (!isOpen) return null;

  const entries = Object.values(bestiary);
  const selectedEntry = bestiary[selectedKey] || entries[0];
  const discoveredCount = entries.filter((e) => e.encountered).length;
  const selectedDef = MONSTER_DEFINITIONS[selectedEntry?.defId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 select-none font-['DotGothic16'] animate-fade-in">
      <div className="relative w-full max-w-2xl bg-black border-4 border-emerald-500 rounded-lg p-4 text-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-500/50 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-300 text-lg font-bold">【 モンスター図鑑 】</span>
            <span className="text-xs text-white/60">
              発見数: {discoveredCount} / {entries.length} 種類
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded border border-white/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* Monster list */}
          <div className="border-2 border-white/30 rounded p-2 overflow-y-auto max-h-64 sm:max-h-80 bg-neutral-950 space-y-1">
            {entries.map((entry) => {
              const isSelected = selectedKey === entry.defId;
              const def = MONSTER_DEFINITIONS[entry.defId];
              return (
                <div
                  key={entry.defId}
                  onClick={() => setSelectedKey(entry.defId)}
                  className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition text-xs sm:text-sm ${
                    isSelected
                      ? 'bg-emerald-600 text-black font-bold'
                      : entry.encountered
                      ? 'hover:bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entry.encountered ? (
                      <MonsterPixelCanvas
                        spriteKey={def?.spriteKey || entry.defId}
                        size={24}
                        isBoss={def?.isBoss}
                      />
                    ) : (
                      <span className="w-6 text-center text-sm">❓</span>
                    )}
                    <span>{entry.encountered ? entry.name : '？？？？？？'}</span>
                  </div>
                  {entry.encountered && (
                    <span className="text-[11px] font-mono opacity-80">
                      討伐: {entry.defeatedCount || 0}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Details pane */}
          <div className="border-2 border-white/30 rounded p-3 bg-neutral-950 flex flex-col justify-between">
            {selectedEntry && selectedEntry.encountered ? (
              <div className="space-y-3">
                <div className="border-b border-white/20 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-emerald-300 text-lg">{selectedEntry.name}</h4>
                    {selectedDef?.isBoss && (
                      <span className="text-[10px] bg-red-950 text-red-300 border border-red-500/50 px-1.5 py-0.5 rounded font-bold">
                        BOSS
                      </span>
                    )}
                  </div>
                  <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-amber-300">
                    生息: {selectedEntry.floors}
                  </span>
                </div>

                {/* Animated Monster Pixel Art Showcase */}
                <div className="flex justify-center items-center py-2 bg-black/60 rounded border border-white/10 shadow-inner">
                  <MonsterPixelCanvas
                    spriteKey={selectedDef?.spriteKey || selectedEntry.defId}
                    size={72}
                    isBoss={selectedDef?.isBoss}
                  />
                </div>

                <p className="text-xs text-white/90 leading-relaxed bg-black/40 p-2.5 rounded border border-white/10">
                  {selectedEntry.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-white/80 bg-black/30 p-2 rounded">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-red-400" />
                    <span>HP: {selectedEntry.hp}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sword size={13} className="text-amber-400" />
                    <span>攻撃力: {selectedEntry.attack}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-sky-400" />
                    <span>防御力: {selectedEntry.defense}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award size={13} className="text-purple-400" />
                    <span>経験値: {selectedEntry.exp}</span>
                  </div>
                </div>

                <div className="text-xs text-amber-200 border-t border-white/10 pt-2">
                  通算討伐数: <strong className="text-white">{selectedEntry.defeatedCount || 0}</strong> 体
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/40 text-center p-6 space-y-2">
                <span className="text-3xl">❓</span>
                <p className="text-xs">ダンジョンを探索して出会うと、詳細が記録されます。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
