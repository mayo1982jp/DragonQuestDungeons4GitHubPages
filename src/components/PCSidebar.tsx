/**
 * PC Roguelike Command & Status Sidebar
 * Tailored for desktop displays: Character sheet, equipped gear, quick spell hotbar,
 * embedded minimap, zoom controls, and quick action buttons.
 */

import React from 'react';
import { GameEngine } from '../game/gameEngine';
import { Minimap } from './Minimap';
import {
  Sword,
  Shield,
  Sparkles,
  Footprints,
  Download,
  Utensils,
  PlusCircle,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Keyboard,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ItemPixelIcon } from './ItemPixelIcon';

interface Props {
  engine: GameEngine;
  onOpenInventory: () => void;
  onOpenSpells: () => void;
  onOpenSaveModal: () => void;
  onOpenBestiary: () => void;
  onOpenHelp: () => void;
  onAttack: () => void;
  onWait: () => void;
  onDescendStairs: () => void;
  onQuickHeal: () => void;
  onQuickEat: () => void;
  onCastSpell: (spellId: string) => void;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  isMinimapExpanded: boolean;
  onToggleMinimap: () => void;
  controllerStatus?: { connected: boolean; name: string; isSwitch: boolean };
  onOpenControllerGuide?: () => void;
}

export const PCSidebar: React.FC<Props> = ({
  engine,
  onOpenInventory,
  onOpenSpells,
  onOpenSaveModal,
  onOpenBestiary,
  onOpenHelp,
  onAttack,
  onWait,
  onDescendStairs,
  onQuickHeal,
  onQuickEat,
  onCastSpell,
  zoom,
  onSetZoom,
  isMinimapExpanded,
  onToggleMinimap,
  controllerStatus,
  onOpenControllerGuide,
}) => {
  const { player, floor } = engine;
  const isPlayerOnStairs = player.x === floor.stairsPos.x && player.y === floor.stairsPos.y;

  return (
    <aside className="w-80 lg:w-96 h-full bg-neutral-950 border-l-2 border-white/60 flex flex-col font-['DotGothic16'] text-white select-none overflow-y-auto p-3 space-y-3 shadow-2xl z-20">
      {/* 1. Embedded Minimap */}
      <section className="bg-black/80 border-2 border-white/40 rounded p-2 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-xs text-white/70 mb-1.5 px-1">
          <span className="font-bold text-amber-300">🗺️ 階層マップ</span>
          <button
            onClick={onToggleMinimap}
            className="text-[10px] text-sky-300 hover:underline hover:text-white cursor-pointer"
          >
            [Tab] 全画面表示
          </button>
        </div>
        <div className="overflow-hidden flex justify-center">
          <Minimap engine={engine} expanded={false} onToggleExpand={onToggleMinimap} />
        </div>
      </section>

      {/* 2. Quick Spell Slots (階層マップの直下に配置) */}
      <section className="bg-black/80 border-2 border-white/40 rounded p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs border-b border-white/20 pb-1">
          <div className="flex items-center gap-1.5 text-sky-300 font-bold">
            <Sparkles size={14} />
            <span>呪文スロット（キー 1~{Math.min(9, player.spells.length || 1)}）</span>
          </div>
          <button onClick={onOpenSpells} className="underline text-[10px] text-white/50 hover:text-white cursor-pointer">
            詳細 [M]
          </button>
        </div>
        {player.spells.length === 0 ? (
          <p className="text-[11px] text-white/40 text-center py-2">習得済みの呪文はありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-1 text-[11px] max-h-40 overflow-y-auto pr-0.5">
            {player.spells.map((spell, idx) => {
              const canAfford = player.mp >= spell.mpCost;
              const slotKey = idx < 9 ? `[${idx + 1}]` : '';
              return (
                <button
                  key={spell.id}
                  onClick={() => onCastSpell(spell.id)}
                  disabled={!canAfford}
                  className={`p-1.5 rounded text-left border truncate transition active:scale-95 flex items-center justify-between ${
                    canAfford
                      ? 'bg-neutral-900 hover:bg-sky-950 border-sky-400 text-white cursor-pointer'
                      : 'bg-neutral-900/50 border-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                  title={`${spell.name} (MP:${spell.mpCost}) ${slotKey ? `キー ${slotKey}` : ''}`}
                >
                  <span className="truncate">
                    {slotKey && <span className="text-amber-300 font-bold mr-0.5">{slotKey}</span>}
                    {spell.name}
                  </span>
                  <span className="text-[9px] text-sky-400 font-mono shrink-0 ml-1">
                    {spell.mpCost}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Quick Action Hotbar */}
      <section className="bg-black/80 border-2 border-white/40 rounded p-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs border-b border-white/20 pb-1">
          <span className="font-bold text-amber-300">⚡ クイック操作</span>
          <span className="text-[10px] text-white/50">クリックまたはキー操作</span>
        </div>

        {/* Primary action row */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            onClick={onAttack}
            className="bg-red-800 hover:bg-red-700 active:bg-red-600 border border-white/60 py-1.5 px-2 rounded font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="正面に攻撃 [Space] または [Enter]"
          >
            <Sword size={14} className="text-amber-300" />
            <span>こうげき [Space]</span>
          </button>

          <button
            onClick={onWait}
            className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-white/40 py-1.5 px-2 rounded font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ターン経過 / HP自然回復 [.] または [5]"
          >
            <Footprints size={14} className="text-sky-300" />
            <span>足踏み [ . ]</span>
          </button>
        </div>

        {/* Quick recovery item buttons */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            onClick={onQuickHeal}
            className="bg-emerald-900 hover:bg-emerald-800 border border-white/40 py-1.5 px-2 rounded text-emerald-200 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
            title="所持している薬草またはホイミで即時回復 [H]"
          >
            <PlusCircle size={13} />
            <span>クイック回復 [H]</span>
          </button>

          <button
            onClick={onQuickEat}
            className="bg-amber-900 hover:bg-amber-800 border border-white/40 py-1.5 px-2 rounded text-amber-200 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
            title="所持しているパンを食べる [F]"
          >
            <Utensils size={13} />
            <span>食事 [F]</span>
          </button>
        </div>

        {/* Stairs button */}
        <button
          onClick={onDescendStairs}
          className={`w-full py-1.5 px-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border cursor-pointer ${
            isPlayerOnStairs
              ? 'bg-amber-500 hover:bg-amber-400 text-black border-white animate-pulse'
              : 'bg-neutral-900 text-white/40 border-white/20'
          }`}
          title="階段を下りる [Enter]"
        >
          <Download size={14} />
          <span>次の階層へ進む [Enter]</span>
        </button>
      </section>

      {/* 5. PC Keybind Cheatsheet & Zoom Control */}
      <section className="bg-black/60 border border-white/20 rounded p-2 text-[10px] text-white/70 space-y-1.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-1">
          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <Keyboard size={12} />
            <span>キーボードショートカット</span>
          </div>
          {/* Zoom Selector */}
          <div className="flex items-center gap-1">
            <span className="text-white/40">ズーム:</span>
            <button
              onClick={() => onSetZoom(Math.max(28, zoom - 6))}
              className="p-0.5 hover:bg-neutral-800 rounded border border-white/20"
              title="ズームアウト"
            >
              <ZoomOut size={11} />
            </button>
            <button
              onClick={() => onSetZoom(Math.min(52, zoom + 6))}
              className="p-0.5 hover:bg-neutral-800 rounded border border-white/20"
              title="ズームイン"
            >
              <ZoomIn size={11} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div>
            <span className="text-white">8方向移動:</span> テンキー1~9 / 矢印
          </div>
          <div>
            <span className="text-white">足元使用/待機:</span> [テンキー5] / [ . ]
          </div>
          <div>
            <span className="text-white">呪文スロット:</span> キー [ 1 ~ 9 ]
          </div>
          <div>
            <span className="text-white">ダッシュ:</span> Shift + 移動
          </div>
          <div>
            <span className="text-white">持ち物:</span> [ I ] / 画面左
          </div>
          <div>
            <span className="text-white">攻撃/階段:</span> [ Space ] / [ Enter ]
          </div>
        </div>


        {/* Switch Controller Quick Reference */}
        <div
          onClick={onOpenControllerGuide}
          className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between cursor-pointer hover:bg-neutral-900/60 p-1 rounded transition text-[10px]"
          title="クリックでSwitchコントローラー詳細表示"
        >
          <div className="flex items-center gap-1 text-red-400 font-bold">
            <span>🎮 Switch対応:</span>
            <span className="text-white/80">A:攻撃 B:ダッシュ X:道具 Y:呪文</span>
          </div>
          <span className="text-sky-300 underline text-[9px]">詳細</span>
        </div>
      </section>

      {/* 6. System Menu buttons */}
      <div className="grid grid-cols-3 gap-1 pt-1 text-xs">
        <button
          onClick={onOpenInventory}
          className="bg-neutral-900 hover:bg-neutral-800 border border-white/40 py-1.5 rounded transition text-center"
        >
          どうぐ
        </button>
        <button
          onClick={onOpenSaveModal}
          className="bg-neutral-900 hover:bg-neutral-800 border border-white/40 py-1.5 rounded transition text-center text-amber-300"
        >
          セーブ
        </button>
        <button
          onClick={onOpenBestiary}
          className="bg-neutral-900 hover:bg-neutral-800 border border-white/40 py-1.5 rounded transition text-center text-emerald-300"
        >
          図鑑
        </button>
      </div>
    </aside>
  );
};
