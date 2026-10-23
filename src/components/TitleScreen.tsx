/**
 * Retro Dragon Quest Style Title Screen
 * Title banner, pixel art hero showcase, sound initiation, and mode selection.
 */

import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { Play, BookOpen, HelpCircle, Save, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onStartGame: (slotId?: number) => void;
  onOpenSaveModal: () => void;
  onOpenBestiary: () => void;
  onOpenHelp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<Props> = ({
  onStartGame,
  onOpenSaveModal,
  onOpenBestiary,
  onOpenHelp,
  isMuted,
  onToggleMute,
}) => {
  const [hoveredBtn, setHoveredBtn] = useState<number>(0);

  const handleStart = () => {
    soundEngine.playLevelUp();
    onStartGame();
  };

  return (
    <div className="title-screen relative w-full h-full flex flex-col items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 bg-black select-none font-['DotGothic16'] text-white overflow-y-auto">
      {/* Background Starry / Pixel Atmosphere */}
      <div className="fixed inset-0 bg-radial from-slate-900 via-black to-black opacity-90 pointer-events-none" />

      {/* Top Bar with Audio Toggle */}
      <div className="w-full flex justify-end z-10 shrink-0">
        <button
          onClick={onToggleMute}
          className="p-2 border border-white/40 rounded bg-black/60 hover:bg-neutral-800 transition text-white/80"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Title Logo */}
      <div className="z-10 shrink-0 flex flex-col items-center text-center space-y-2 mt-2 sm:mt-8">
        <div className="text-xs sm:text-sm tracking-widest text-amber-400 font-bold">
          DRAGON QUEST DUNGEONS
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
          ドラゴンクエスト・ダンジョンズ
        </h1>

        <p className="text-base sm:text-xl text-sky-300 font-bold tracking-wider">
          〜 勇者と不思議な洞穴 〜
        </p>
      </div>

      {/* Hero Showcase Center Illustration */}
      <div className="title-hero z-10 shrink-0 flex flex-col items-center my-2 sm:my-4">
        <div className="relative p-4 sm:p-6 border-4 border-amber-400/80 rounded-xl bg-black/80 shadow-[0_0_30px_rgba(255,185,0,0.25)] flex flex-col items-center">
          {/* Animated Pixel Sprite Showcase */}
          <div className="flex items-center gap-2 sm:gap-6">
            <span className="text-2xl sm:text-4xl animate-bounce">🗡️</span>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-amber-300 whitespace-nowrap">伝説の勇者</div>
              <div className="text-xs text-white/60 mt-1">ロトの血を引く者</div>
            </div>
            <span className="text-2xl sm:text-4xl animate-bounce delay-100">🛡️</span>
          </div>

          <p className="text-[11px] sm:text-xs text-neutral-300 text-center max-w-xs mt-2 sm:mt-3 leading-relaxed">
            毎回姿を変える洞穴を探索し、手に入れた武器や呪文を駆使して大魔王ゾーマを討伐せよ！
            <br />
            <span className="text-amber-300 font-bold inline-block mt-1">※ 画面タッチ・クリックで直接移動可！</span>
          </p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="title-menu z-10 shrink-0 w-full max-w-xs space-y-2 sm:space-y-2.5 mb-2 sm:mb-6">
        <button
          onMouseEnter={() => setHoveredBtn(0)}
          onClick={handleStart}
          className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 border-2 border-white text-black font-bold py-2.5 px-4 rounded text-base flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
        >
          <Play size={18} fill="currentColor" />
          <span>冒険をはじめる</span>
        </button>

        <button
          onMouseEnter={() => setHoveredBtn(1)}
          onClick={onOpenSaveModal}
          className="w-full bg-neutral-900 hover:bg-neutral-800 active:bg-amber-900 border-2 border-white/60 text-white font-bold py-2 px-4 rounded text-sm flex items-center justify-center gap-2 transition active:scale-95"
        >
          <Save size={16} className="text-amber-400" />
          <span>冒険の書（セーブ・再開）</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onMouseEnter={() => setHoveredBtn(2)}
            onClick={onOpenBestiary}
            className="bg-neutral-900 hover:bg-neutral-800 border border-white/50 text-white py-2 px-2 rounded text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <BookOpen size={14} className="text-emerald-400" />
            <span>モンスター図鑑</span>
          </button>

          <button
            onMouseEnter={() => setHoveredBtn(3)}
            onClick={onOpenHelp}
            className="bg-neutral-900 hover:bg-neutral-800 border border-white/50 text-white py-2 px-2 rounded text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <HelpCircle size={14} className="text-sky-400" />
            <span>遊び方・操作</span>
          </button>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="title-footer z-10 shrink-0 text-[10px] text-white/40 text-center">
        Inspired by Dragon Quest III & Mystery Dungeon Series.
      </div>
    </div>
  );
};
