/**
 * Game Over & Dungeon Clear Victory Modal
 * Shows adventure statistics, defeat/clear fanfare, and restart options.
 */

import React from 'react';
import { GameEngine } from '../game/gameEngine';
import { Trophy, Skull, RotateCcw, Home } from 'lucide-react';

interface Props {
  engine: GameEngine;
  isOpen: boolean;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<Props> = ({ engine, isOpen, onRestart, onReturnTitle }) => {
  if (!isOpen) return null;

  const isClear = engine.isGameClear;
  const { player, floor, stats } = engine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none font-['DotGothic16'] animate-fade-in">
      <div
        className={`relative w-full max-w-md bg-black border-4 rounded-lg p-5 text-white shadow-2xl flex flex-col items-center text-center space-y-4 ${
          isClear ? 'border-amber-400' : 'border-red-600'
        }`}
      >
        {/* Banner Icon */}
        <div className="text-4xl">
          {isClear ? (
            <div className="p-3 bg-amber-500/20 rounded-full border-2 border-amber-400 inline-block text-amber-300">
              <Trophy size={48} />
            </div>
          ) : (
            <div className="p-3 bg-red-950/40 rounded-full border-2 border-red-600 inline-block text-red-500">
              <Skull size={48} />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h2 className={`text-2xl font-bold ${isClear ? 'text-amber-300' : 'text-red-500'}`}>
            {isClear ? '洞穴完全踏破！世界に光を！' : '勇者は力尽きてしまった…'}
          </h2>
          <p className="text-xs text-white/70 mt-1">
            {isClear
              ? '大魔王ゾーマを討ち倒し、不思議な洞穴に平和をもたらした！'
              : `地下 ${floor.floorNumber} 階にて冒険の幕を閉じた……`}
          </p>
        </div>

        {/* Stats summary board */}
        <div className="w-full bg-neutral-950 border border-white/20 rounded p-3 text-xs space-y-2 text-left">
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/60">到達階層:</span>
            <strong className="text-amber-300">地下 {floor.floorNumber} 階</strong>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/60">最終レベル:</span>
            <span>Lv. {player.level}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/60">討伐モンスター数:</span>
            <span>{stats.monstersDefeated} 体</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/60">獲得ゴールド:</span>
            <span className="text-amber-400">{player.gold} G</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span className="text-white/60">総ターン数:</span>
            <span>{player.turns} ターン</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">最終装備:</span>
            <span className="text-right truncate max-w-[180px]">
              {player.equipment.weapon?.name || '素手'} / {player.equipment.shield?.name || 'なし'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full pt-2">
          <button
            onClick={onRestart}
            className="flex-1 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 border-2 border-white text-black font-bold py-2.5 px-3 rounded text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <RotateCcw size={16} />
            <span>再挑戦する</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 border-2 border-white/40 text-white py-2.5 px-3 rounded text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Home size={16} />
            <span>タイトルへ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
