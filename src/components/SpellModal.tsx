/**
 * Spell and Skill Selection Modal
 * Displays learned spells, MP costs, upcoming skills, and lets player cast them.
 */

import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { ALL_SPELLS } from '../game/spellData';
import { Spell } from '../types/game';
import { X, Zap, Lock } from 'lucide-react';

interface Props {
  engine: GameEngine;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export const SpellModal: React.FC<Props> = ({ engine, isOpen, onClose, onActionComplete }) => {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const playerSpells = engine.player.spells;
  const currentMp = engine.player.mp;

  const handleCast = (spell: Spell) => {
    const success = engine.castSpell(spell);
    if (success) {
      onActionComplete();
      onClose();
    }
  };

  // Keyboard navigation for PC
  useEffect(() => {
    if (!isOpen) return;

    if (!selectedSpell && playerSpells.length > 0) {
      setSelectedSpell(playerSpells[0]);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (playerSpells.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const currentIdx = playerSpells.findIndex((s) => s.id === selectedSpell?.id);
        const nextIdx = (currentIdx + 1) % playerSpells.length;
        setSelectedSpell(playerSpells[nextIdx]);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        const currentIdx = playerSpells.findIndex((s) => s.id === selectedSpell?.id);
        const nextIdx = (currentIdx - 1 + playerSpells.length) % playerSpells.length;
        setSelectedSpell(playerSpells[nextIdx]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSpell && currentMp >= selectedSpell.mpCost) {
          handleCast(selectedSpell);
        }
      } else if (/^[1-9]$/.test(e.key)) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= playerSpells.length) {
          const target = playerSpells[num - 1];
          if (currentMp >= target.mpCost) {
            handleCast(target);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, playerSpells, selectedSpell, currentMp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 select-none font-['DotGothic16'] animate-fade-in">
      <div className="relative w-full max-w-lg bg-black border-4 border-white/90 rounded-lg p-4 text-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white/40 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sky-300 text-lg font-bold">【 じゅもん・とくぎ 】</span>
            <span className="text-xs text-white/60">
              MP: <strong className="text-sky-400">{currentMp}</strong> / {engine.player.maxMp}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded border border-white/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of spells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* Spells selection list */}
          <div className="border-2 border-white/30 rounded p-2 overflow-y-auto max-h-64 sm:max-h-80 bg-neutral-950 space-y-1">
            {playerSpells.length === 0 ? (
              <p className="text-white/50 text-center py-6 text-sm">
                まだ呪文を習得していません（Lv.2でホイミを習得）
              </p>
            ) : (
              playerSpells.map((spell) => {
                const canAfford = currentMp >= spell.mpCost;
                const isSelected = selectedSpell?.id === spell.id;
                return (
                  <div
                    key={spell.id}
                    onClick={() => setSelectedSpell(spell)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-sky-500 text-black font-bold'
                        : canAfford
                        ? 'hover:bg-neutral-800 text-white'
                        : 'opacity-50 text-neutral-400 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className={isSelected ? 'text-black' : 'text-sky-400'} />
                      <span>{spell.name}</span>
                    </div>
                    <span className="text-xs font-mono">消費MP {spell.mpCost}</span>
                  </div>
                );
              })
            )}

            {/* Locked spells preview */}
            <div className="pt-2 mt-2 border-t border-white/10">
              <span className="text-[10px] text-white/40 px-1">未修得の呪文・特技:</span>
              {ALL_SPELLS.filter((s) => s.learnedLevel > engine.player.level).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-1 text-[11px] text-neutral-500"
                >
                  <div className="flex items-center gap-1">
                    <Lock size={10} />
                    <span>{s.name}</span>
                  </div>
                  <span>Lv.{s.learnedLevel}で習得</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spell detail & Cast button */}
          <div className="border-2 border-white/30 rounded p-3 bg-neutral-950 flex flex-col justify-between">
            {selectedSpell ? (
              <>
                <div className="space-y-3">
                  <div className="border-b border-white/20 pb-2">
                    <h4 className="font-bold text-sky-300 text-base flex items-center gap-1">
                      <Zap size={16} />
                      {selectedSpell.name}
                    </h4>
                    <p className="text-xs text-white/60">必要MP: {selectedSpell.mpCost}</p>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed bg-black/40 p-2.5 rounded border border-white/10">
                    {selectedSpell.description}
                  </p>

                  <div className="text-[11px] text-white/70 space-y-1">
                    <div>効果対象: {getTargetTypeLabel(selectedSpell.targetType)}</div>
                    {selectedSpell.power && <div>基本威力: {selectedSpell.power}</div>}
                  </div>
                </div>

                <button
                  disabled={currentMp < selectedSpell.mpCost}
                  onClick={() => handleCast(selectedSpell)}
                  className={`mt-4 py-2 px-3 rounded text-sm font-bold border-2 transition active:scale-95 ${
                    currentMp >= selectedSpell.mpCost
                      ? 'bg-sky-600 hover:bg-sky-500 border-white text-white'
                      : 'bg-neutral-800 border-neutral-600 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {currentMp >= selectedSpell.mpCost ? 'となえる' : 'MPが足りません'}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-xs text-center p-4">
                唱えたい呪文や特技を選択してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getTargetTypeLabel(type: string): string {
  switch (type) {
    case 'self':
      return '自分自身';
    case 'target':
      return '正面の敵1体';
    case 'front_line':
      return '正面一直線上の敵';
    case 'surrounding':
      return '周囲8マスの範囲';
    case 'room':
      return '部屋全体のすべての敵';
    default:
      return '敵';
  }
}
