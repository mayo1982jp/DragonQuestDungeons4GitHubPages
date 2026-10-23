/**
 * Virtual Controller & Action Touchpad
 * Four-direction movement plus attack, inventory, spells, save, and stairs actions.
 */

import React from 'react';
import { Direction } from '../types/game';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Swords,
  Backpack,
  Sparkles,
  Save,
  Download,
} from 'lucide-react';

interface Props {
  onMove: (dir: Direction) => void;
  onAttack: () => void;
  onOpenInventory: () => void;
  onOpenSpells: () => void;
  onOpenSaveModal: () => void;
  onDescendStairs: () => void;
  isPlayerOnStairs: boolean;
}

export const VirtualPad: React.FC<Props> = ({
  onMove,
  onAttack,
  onOpenInventory,
  onOpenSpells,
  onOpenSaveModal,
  onDescendStairs,
  isPlayerOnStairs,
}) => {
  return (
    <div className="flex flex-col bg-black/85 border-t-2 border-white/60 select-none font-['DotGothic16'] text-white">
      <div className="pad-root flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-2">
        {/* 4-Directional D-Pad */}
        <div className="pad-dpad grid grid-cols-3 grid-rows-3 gap-1 w-28 h-28 sm:w-36 sm:h-36 shrink-0">
          {/* N */}
          <button
            onClick={() => onMove('N')}
            title="上"
            aria-label="上に移動"
            className="col-start-2 row-start-1 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 rounded flex items-center justify-center border border-white/40 text-amber-300 font-bold transition active:scale-90"
          >
            <ArrowUp size={20} />
          </button>

          {/* W */}
          <button
            onClick={() => onMove('W')}
            title="左"
            aria-label="左に移動"
            className="col-start-1 row-start-2 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 rounded flex items-center justify-center border border-white/40 text-amber-300 font-bold transition active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Center (no wait button) */}
          <div
            aria-hidden="true"
            className="col-start-2 row-start-2 rounded bg-neutral-900/60 border border-white/10 flex items-center justify-center"
          >
            <span className="text-[9px] text-white/30 font-bold">4方向</span>
          </div>

          {/* E */}
          <button
            onClick={() => onMove('E')}
            title="右"
            aria-label="右に移動"
            className="col-start-3 row-start-2 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 rounded flex items-center justify-center border border-white/40 text-amber-300 font-bold transition active:scale-90"
          >
            <ArrowRight size={20} />
          </button>

          {/* S */}
          <button
            onClick={() => onMove('S')}
            title="下"
            aria-label="下に移動"
            className="col-start-2 row-start-3 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 rounded flex items-center justify-center border border-white/40 text-amber-300 font-bold transition active:scale-90"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Actions: attack on top, menu shortcuts along the bottom */}
        <div className="pad-actions flex-1 min-w-0 max-w-md self-stretch flex flex-col justify-center gap-1.5">
          <div className="flex gap-1.5 flex-1 min-h-0">
            {/* Attack */}
            <button
              onClick={onAttack}
              className="flex-1 min-w-0 bg-red-800 hover:bg-red-700 active:bg-red-600 border-2 border-white/80 rounded p-1 flex flex-col items-center justify-center text-xs font-bold transition active:scale-95 shadow-md"
            >
              <Swords size={18} className="mb-0.5 text-amber-300" />
              <span>こうげき</span>
            </button>

            {/* Contextual stairs action (only while standing on stairs) */}
            {isPlayerOnStairs && (
              <button
                onClick={onDescendStairs}
                className="w-20 sm:w-24 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 border-2 border-white text-black rounded p-1 flex flex-col items-center justify-center text-[11px] font-bold transition active:scale-95 shadow-md animate-pulse"
              >
                <Download size={18} className="mb-0.5" />
                <span>かいだん</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 h-11 shrink-0">
            <button
              onClick={onOpenInventory}
              title="どうぐ [I]"
              className="bg-neutral-800 hover:bg-neutral-700 active:bg-amber-700 border-2 border-white/60 rounded flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold transition active:scale-95 shadow-md"
            >
              <Backpack size={14} className="text-amber-400" />
              <span>どうぐ</span>
            </button>

            <button
              onClick={onOpenSpells}
              title="じゅもん [M]"
              className="bg-sky-900 hover:bg-sky-800 active:bg-sky-700 border-2 border-white/60 rounded flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold transition active:scale-95 shadow-md"
            >
              <Sparkles size={14} className="text-sky-300" />
              <span>じゅもん</span>
            </button>

            <button
              onClick={onOpenSaveModal}
              title="冒険の書（セーブ）"
              className="bg-neutral-800 hover:bg-neutral-700 active:bg-amber-700 border-2 border-amber-400/70 rounded flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold text-amber-300 transition active:scale-95 shadow-md"
            >
              <Save size={14} />
              <span>セーブ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
