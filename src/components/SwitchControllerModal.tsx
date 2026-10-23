/**
 * Nintendo Switch Controller Guide & Live Input Tester Modal
 * Shows button mapping diagram, action assignments, and live button press indicator.
 */

import React, { useEffect, useState } from 'react';
import { X, Gamepad2, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  controllerName: string;
  isConnected: boolean;
}

export const SwitchControllerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  controllerName,
  isConnected,
}) => {
  const [pressedButtons, setPressedButtons] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const pollButtons = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find((g) => g && g.connected);
      if (gp) {
        const active: number[] = [];
        gp.buttons.forEach((b, idx) => {
          if (b.pressed) active.push(idx);
        });
        setPressedButtons(active);
      } else {
        setPressedButtons([]);
      }
      animId = requestAnimationFrame(pollButtons);
    };

    animId = requestAnimationFrame(pollButtons);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 select-none font-['DotGothic16'] animate-fade-in">
      <div className="relative w-full max-w-lg bg-black border-4 border-red-500 rounded-lg p-4 text-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-red-500/50 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-red-400" size={20} />
            <span className="text-red-400 text-lg font-bold">
              【 Nintendo Switch コントローラー対応 】
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded border border-white/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Connection status banner */}
        <div
          className={`p-2.5 rounded border mb-3 flex items-center justify-between text-xs ${
            isConnected
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <span className="font-bold">
              {isConnected ? `${controllerName || 'Switchコントローラー'} 接続中` : 'コントローラー未検出'}
            </span>
          </div>
          {isConnected && (
            <div className="text-[10px] text-white/60">ボタンを押すと画面に反映されます</div>
          )}
        </div>

        {/* Button Mappings Table */}
        <div className="space-y-2 flex-1 overflow-y-auto text-xs pr-1">
          <div className="bg-neutral-950 border border-white/20 p-2.5 rounded space-y-1.5">
            <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <span>🎮 ボタン操作割り当て一覧</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1">
              {/* Movement */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(12) ||
                  pressedButtons.includes(13) ||
                  pressedButtons.includes(14) ||
                  pressedButtons.includes(15)
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-white flex items-center gap-1">
                  <span>🕹️ 十字キー / Lスティック</span>
                </div>
                <div className="text-white/70 text-[10px]">8方向移動（斜め対応）</div>
              </div>

              {/* A Button */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(1)
                    ? 'bg-red-500/30 border-red-400 text-red-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-red-400 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">
                    A
                  </span>
                  <span>A ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">階段降り / 足元装備・使用 / 攻撃 / 決定</div>
              </div>

              {/* B Button */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(0)
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">
                    B
                  </span>
                  <span>B ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">
                  待機（足踏み） / <strong>B長押し+移動でダッシュ！</strong>
                </div>
              </div>

              {/* X Button */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(3)
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-sky-400 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    X
                  </span>
                  <span>X ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">どうぐ・所持品メニュー開閉</div>
              </div>

              {/* Y Button */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(2)
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    Y
                  </span>
                  <span>Y ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">じゅもん・特技メニュー開閉</div>
              </div>

              {/* Plus Button */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(9)
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <span>➕ ＋（プラス）ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">冒険の書（セーブ画面の開閉）</div>
              </div>

              {/* Minus Button */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(8)
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-sky-300 flex items-center gap-1">
                  <span>➖ －（マイナス）ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">ヘルプ・操作説明</div>
              </div>

              {/* L / R Buttons */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(4) || pressedButtons.includes(5)
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-purple-300 flex items-center gap-1">
                  <span>🔘 L / R ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">L: 薬草クイック回復 / R: 食事</div>
              </div>

              {/* ZL / ZR Buttons */}
              <div
                className={`p-1.5 rounded border transition ${
                  pressedButtons.includes(6) || pressedButtons.includes(7)
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-neutral-900/60 border-white/10'
                }`}
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <span>🔘 ZL / ZR ボタン</span>
                </div>
                <div className="text-white/70 text-[10px]">ZL: マップ切替 / ZR: 待機</div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 border border-white/20 p-2.5 rounded text-[11px] text-white/80 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>接続のヒント:</span>
            </div>
            <p>
              BluetoothまたはUSBケーブルでNintendo Switch ProコントローラーやJoy-ConをPCに接続するだけで、自動的に認識されます。ドライバーのインストールは不要です。
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full bg-red-700 hover:bg-red-600 border-2 border-white py-1.5 rounded text-white font-bold transition active:scale-95 text-xs sm:text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
