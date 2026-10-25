/**
 * Retro Dragon Quest Status HUD Header
 * Shows Floor, Lv, HP, MP, Fullness, Gold, Equipment preview, and Quick Actions.
 */

import React, { useEffect, useState } from 'react';
import { GameEngine } from '../game/gameEngine';
import { getThemeName } from '../game/dungeonGenerator';
import { soundEngine } from '../audio/soundEngine';
import { Volume2, VolumeX, BookOpen, Save, Map as MapIcon, HelpCircle, Menu, Gamepad2 } from 'lucide-react';

interface Props {
  engine: GameEngine;
  onOpenSaveModal: () => void;
  onOpenBestiary: () => void;
  onOpenHelp: () => void;
  onToggleMinimap: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showPad: boolean;
  onTogglePad: () => void;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  controllerStatus?: { connected: boolean; name: string; isSwitch: boolean };
  onOpenControllerGuide?: () => void;
}

export const StatusHeader: React.FC<Props> = ({
  engine,
  onOpenSaveModal,
  onOpenBestiary,
  onOpenHelp,
  onToggleMinimap,
  isMuted,
  onToggleMute,
  showPad,
  onTogglePad,
  zoom,
  onSetZoom,
  controllerStatus,
  onOpenControllerGuide,
}) => {
  const { player, floor } = engine;
  const themeName = getThemeName(floor.theme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
  const mpRatio = Math.max(0, Math.min(1, player.mp / player.maxMp));
  const fullnessRatio = Math.max(0, Math.min(1, player.fullness / player.maxFullness));
  const expRatio = player.nextExp > 0 ? Math.max(0, Math.min(1, player.exp / player.nextExp)) : 1;

  return (
    <header className="game-header bg-neutral-950/95 border-b-2 border-white/80 text-white font-['DotGothic16'] px-2 py-1 sm:px-3 sm:py-1.5 shadow-xl select-none text-xs sm:text-sm shrink-0 z-30">
      {/* Main Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 sm:gap-y-2 sm:gap-x-3">
        {/* Left: Hero identity, level, dungeon floor, and gold */}
        <div className="order-1 flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Hero Tag */}
          <div className="flex items-center gap-1.5 bg-black/70 border border-amber-400/80 px-2 py-0.5 rounded shadow-sm">
            <span className="text-base sm:text-lg">👑</span>
            <span className="font-bold text-amber-300 text-xs sm:text-sm">
              勇者
            </span>
            <span className="bg-amber-500 text-black px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold">
              Lv.{player.level}
            </span>
          </div>

          {/* Floor & Theme */}
          <div className="flex items-center gap-1.5 bg-black/70 border border-white/30 px-2 py-0.5 rounded text-[11px] sm:text-xs">
            <span className="bg-amber-600 text-black px-1.5 py-0.2 font-bold rounded text-[10px]">
              B{floor.floorNumber}F
            </span>
            <span className="text-amber-200 font-bold hidden md:inline">{themeName}</span>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-1 text-amber-400 font-mono font-bold bg-neutral-900 border border-amber-400/40 px-2 py-0.5 rounded text-[11px] sm:text-xs">
            <span>🪙</span>
            <span>{player.gold} G</span>
          </div>
        </div>

        {/* Center: HP + MP on the first line (both fill the phone width), 胃 + XP on the next line */}
        <div className="order-3 lg:order-2 w-full lg:w-auto flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
          {/* Phone row 1: HP + MP */}
          <div className="flex items-start gap-2 w-full lg:contents">
          {/* --- ENLARGED HP BAR with ATK & DEF underneath --- */}
          <div className="flex-1 min-w-0 lg:flex-none flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white bg-red-600 px-1.5 py-0.5 rounded text-[10px] sm:text-xs shadow">
                HP
              </span>
              <div
                title={`HP: ${player.hp} / ${player.maxHp}`}
                className="hp-gauge w-full lg:w-56 xl:w-60 h-5 sm:h-6 bg-neutral-950 border-2 border-white/80 rounded shadow-inner relative overflow-hidden flex items-center justify-center"
              >
                {/* Animated / Colored gauge fill */}
                <div
                  className={`h-full absolute left-0 top-0 transition-all duration-300 ${
                    hpRatio > 0.5
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400'
                      : hpRatio > 0.25
                      ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-400 animate-pulse'
                  }`}
                  style={{ width: `${hpRatio * 100}%` }}
                />
                {/* Bold numeric overlay centered */}
                <span className="relative z-10 font-mono font-bold text-white text-[11px] sm:text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {player.hp} / {player.maxHp}
                </span>
              </div>
            </div>

            {/* ATK & DEF directly under the HP bar */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] px-1 text-white/90 font-mono pl-6 sm:pl-7">
              <span title="攻撃力">⚔️ 攻撃:<strong className="text-amber-300 font-bold ml-0.5">{engine.getTotalAttack()}</strong></span>
              <span title="守備力">🛡️ 守備:<strong className="text-sky-300 font-bold ml-0.5">{engine.getTotalDefense()}</strong></span>
            </div>
          </div>

          {/* MP Gauge */}
          <div className="w-[34%] shrink-0 lg:w-auto lg:flex-none flex items-center gap-1.5">
            <span className="font-bold text-white bg-sky-600 px-1.5 py-0.5 rounded text-[10px] sm:text-xs shadow">
              MP
            </span>
            <div
              title={`MP: ${player.mp} / ${player.maxMp}`}
              className="mp-gauge w-full lg:w-20 md:w-24 h-5 bg-neutral-950 border border-white/60 rounded shadow-inner relative overflow-hidden flex items-center justify-center"
            >
              <div
                className="h-full absolute left-0 top-0 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${mpRatio * 100}%` }}
              />
              <span className="relative z-10 font-mono font-bold text-white text-[10px] sm:text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {player.mp} / {player.maxMp}
              </span>
            </div>
          </div>

          </div>

          {/* Phone row 2: 胃 + XP */}
          <div className="flex items-center gap-2 w-full lg:contents">
          {/* Fullness (満腹度) */}
          <div className="flex-1 min-w-0 lg:flex-none flex items-center gap-1.5" title="満腹度：0になると毎ターンHPが減少します">
            <span className="font-bold text-black bg-amber-400 px-1.5 py-0.5 rounded text-[10px] sm:text-xs shadow">
              胃
            </span>
            <div className="food-gauge w-full lg:w-20 h-5 bg-neutral-950 border border-white/60 rounded shadow-inner relative overflow-hidden flex items-center justify-center">
              <div
                className={`h-full absolute left-0 top-0 transition-all duration-300 ${
                  fullnessRatio > 0.2
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400'
                    : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${fullnessRatio * 100}%` }}
              />
              <span className="relative z-10 font-mono font-bold text-white text-[10px] sm:text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {player.fullness}%
              </span>
            </div>
          </div>

          {/* XP Gauge (ステータスバーのHP、MP、胃、の右側にXPバーを表示) */}
          <div className="flex-1 min-w-0 lg:flex-none flex items-center gap-1.5" title={`経験値: ${player.exp} / 次レベルまで残り: ${Math.max(0, player.nextExp - player.exp)} EXP`}>
            <span className="font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded text-[10px] sm:text-xs shadow">
              XP
            </span>
            <div className="xp-gauge w-full lg:w-20 h-5 bg-neutral-950 border border-white/60 rounded shadow-inner relative overflow-hidden flex items-center justify-center">
              <div
                className="h-full absolute left-0 top-0 bg-gradient-to-r from-purple-700 via-indigo-500 to-violet-400 transition-all duration-300"
                style={{ width: `${expRatio * 100}%` }}
              />
              <span className="relative z-10 font-mono font-bold text-white text-[10px] sm:text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {player.exp}/{player.nextExp}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* Right: Action Controls & Buttons */}
        <div className="order-2 lg:order-3 flex items-center gap-1 sm:gap-1.5">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-0.5 bg-neutral-900 border border-white/30 rounded px-1 py-0.5 shadow">
            <button
              onClick={() => onSetZoom(Math.max(28, zoom - 6))}
              className="text-[10px] text-white/70 hover:text-white px-1 cursor-pointer"
              title="ズームアウト"
            >
              -
            </button>
            <span className="text-[10px] text-white/50">{zoom}px</span>
            <button
              onClick={() => onSetZoom(Math.min(52, zoom + 6))}
              className="text-[10px] text-white/70 hover:text-white px-1 cursor-pointer"
              title="ズームイン"
            >
              +
            </button>
          </div>

          {/* Virtual Pad Toggle */}
          <button
            onClick={onTogglePad}
            title={showPad ? '操作ボタンを隠す (PCキーボード推奨)' : '操作ボタンを表示する'}
            className={`hidden lg:flex px-1.5 py-0.5 border rounded text-[11px] font-bold transition items-center gap-1 cursor-pointer ${
              showPad
                ? 'bg-amber-600 text-black border-amber-400'
                : 'bg-neutral-800 text-white/70 border-white/30 hover:text-white'
            }`}
          >
            <span>ボタン</span>
            <span className="text-[9px]">{showPad ? 'ON' : 'OFF'}</span>
          </button>

          {/* Switch Controller Status & Guide Button */}
          <button
            onClick={onOpenControllerGuide}
            title={
              controllerStatus?.connected
                ? `${controllerStatus.name} 接続中 (クリックで操作説明)`
                : 'Switchコントローラー対応 (クリックで操作説明)'
            }
            className={`hidden lg:flex px-1.5 py-0.5 border rounded text-[11px] font-bold transition items-center gap-1 cursor-pointer ${
              controllerStatus?.connected
                ? 'bg-red-900/80 border-red-400 text-white animate-pulse'
                : 'bg-neutral-900 border-white/30 text-white/60 hover:text-white'
            }`}
          >
            <span>🎮</span>
            <span className="hidden sm:inline">
              {controllerStatus?.connected ? 'Switch接続' : 'Switch対応'}
            </span>
            {controllerStatus?.connected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            )}
          </button>

          <button
            onClick={onToggleMinimap}
            title="マップ切替 [Tab]"
            className="hidden lg:flex p-1 hover:bg-neutral-800 border border-white/40 rounded text-sky-300 transition cursor-pointer"
          >
            <MapIcon size={16} />
          </button>

          <button
            onClick={onOpenBestiary}
            title="モンスター図鑑"
            className="hidden lg:flex p-1 hover:bg-neutral-800 border border-white/40 rounded text-emerald-300 transition cursor-pointer"
          >
            <BookOpen size={16} />
          </button>

          <button
            onClick={onOpenSaveModal}
            title="冒険の書（セーブ）"
            className="hidden lg:flex p-1 hover:bg-neutral-800 border border-white/40 rounded text-amber-300 transition cursor-pointer"
          >
            <Save size={16} />
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'ミュート解除' : 'ミュート'}
            className="hidden lg:flex p-1 hover:bg-neutral-800 border border-white/40 rounded text-neutral-300 transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={onOpenHelp}
            title="操作方法・ヘルプ [?]"
            className="hidden lg:flex p-1 hover:bg-neutral-800 border border-white/40 rounded text-neutral-300 transition cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>

          {/* Mobile menu: map, bestiary, help, and the controls moved off the header */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              title="メニュー"
              aria-label="メニュー"
              aria-haspopup="menu"
              aria-expanded={isMobileMenuOpen}
              className={`p-1.5 border-2 rounded transition cursor-pointer ${
                isMobileMenuOpen
                  ? 'bg-neutral-800 border-white text-white'
                  : 'border-white/60 text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <Menu size={18} />
            </button>

            {isMobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/30"
                  onClick={closeMobileMenu}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 w-52 max-h-[70vh] overflow-y-auto z-50 bg-neutral-950 border-2 border-white/70 rounded-lg shadow-2xl p-1.5"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onToggleMinimap();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-sky-300 hover:bg-neutral-800 active:bg-neutral-700 transition text-left"
                  >
                    <MapIcon size={16} />
                    <span>マップ</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenBestiary();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-emerald-300 hover:bg-neutral-800 active:bg-neutral-700 transition text-left"
                  >
                    <BookOpen size={16} />
                    <span>モンスター図鑑</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenHelp();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700 transition text-left"
                  >
                    <HelpCircle size={16} />
                    <span>遊び方・ヘルプ</span>
                  </button>

                  <div className="my-1 border-t border-white/20" />

                  {/* Controls that used to live on the header */}
                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onTogglePad();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-amber-200 hover:bg-neutral-800 active:bg-neutral-700 transition text-left"
                  >
                    <Menu size={16} />
                    <span>操作ボタン</span>
                    <span className={`ml-auto text-[11px] font-mono font-bold ${showPad ? 'text-amber-300' : 'text-white/40'}`}>
                      {showPad ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenControllerGuide?.();
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm hover:bg-neutral-800 active:bg-neutral-700 transition text-left ${
                      controllerStatus?.connected ? 'text-red-300' : 'text-white/70'
                    }`}
                  >
                    <Gamepad2 size={16} />
                    <span>{controllerStatus?.connected ? 'Switch接続中' : 'Switch対応'}</span>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenSaveModal();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-amber-300 hover:bg-neutral-800 active:bg-neutral-700 transition text-left"
                  >
                    <Save size={16} />
                    <span>冒険の書（セーブ）</span>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMobileMenu();
                      onToggleMute();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700 transition text-left"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    <span>{isMuted ? '音を出す' : '音を消す'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
