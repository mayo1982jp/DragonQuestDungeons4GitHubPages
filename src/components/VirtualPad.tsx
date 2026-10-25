/**
 * Mobile Action Bar
 * Three large touch shortcuts: inventory, spells, and save.
 * Movement is handled by tapping the dungeon, so the D-pad and attack button are gone.
 */

import React from 'react';
import { Backpack, Sparkles, Save } from 'lucide-react';

interface Props {
  onOpenInventory: () => void;
  onOpenSpells: () => void;
  onOpenSaveModal: () => void;
}

export const VirtualPad: React.FC<Props> = ({
  onOpenInventory,
  onOpenSpells,
  onOpenSaveModal,
}) => {
  return (
    <div className="flex flex-col bg-black/85 border-t-2 border-white/60 select-none font-['DotGothic16'] text-white">
      <div className="pad-root grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 sm:p-2 w-full">
        <button
          onClick={onOpenInventory}
          title="どうぐ [I]"
          className="h-14 sm:h-16 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-700 border-2 border-white/60 rounded flex flex-col items-center justify-center gap-0.5 text-sm sm:text-base font-bold transition active:scale-95 shadow-md"
        >
          <Backpack size={20} className="text-amber-400" />
          <span>どうぐ</span>
        </button>

        <button
          onClick={onOpenSpells}
          title="じゅもん [M]"
          className="h-14 sm:h-16 bg-sky-900 hover:bg-sky-800 active:bg-sky-700 border-2 border-white/60 rounded flex flex-col items-center justify-center gap-0.5 text-sm sm:text-base font-bold transition active:scale-95 shadow-md"
        >
          <Sparkles size={20} className="text-sky-300" />
          <span>じゅもん</span>
        </button>

        <button
          onClick={onOpenSaveModal}
          title="冒険の書（セーブ）"
          className="h-14 sm:h-16 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-700 border-2 border-amber-400/70 rounded flex flex-col items-center justify-center gap-0.5 text-sm sm:text-base font-bold text-amber-300 transition active:scale-95 shadow-md"
        >
          <Save size={20} />
          <span>セーブ</span>
        </button>
      </div>
    </div>
  );
};
