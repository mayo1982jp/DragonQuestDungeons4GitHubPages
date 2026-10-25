/**
 * Adventure Book (冒険の書) & Save Management Modal
 * Handles saving mid-game suspend state, loading runs, slot switching, and JSON backup.
 */

import React, { useState, useEffect } from 'react';
import type { GameEngine } from '../game/gameEngine';
import {
  loadSaveSlots,
  loadSuspendData,
  saveSuspendData,
  deleteSuspendData,
  loadGameStats,
} from '../game/storage';
import { SaveSlot } from '../types/game';
import { X, Save, Play, Trash2, Download, Upload } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  engine?: GameEngine | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadRun: (slotId: number) => void;
}

export const SaveLoadModal: React.FC<Props> = ({ engine, isOpen, onClose, onLoadRun }) => {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSlots(loadSaveSlots());
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = (slotId: number) => {
    if (!engine) return;
    saveSuspendData(slotId, {
      player: engine.player,
      floor: engine.floor,
      stats: engine.stats,
      turnCount: engine.player.turns,
      bestiary: {},
    });
    setSlots(loadSaveSlots());
    soundEngine.playItemGet();
    setMessage(`【冒険の書 ${slotId}】に現在の中断データを記録しました！`);
  };

  const handleResume = (slotId: number) => {
    const data = loadSuspendData(slotId);
    if (!data) return;
    onLoadRun(slotId);
    onClose();
  };

  const handleDelete = (slotId: number) => {
    if (window.confirm(`冒険の書 ${slotId} の中断データを消去しますか？`)) {
      deleteSuspendData(slotId);
      setSlots(loadSaveSlots());
      soundEngine.playTrap();
      setMessage(`冒険の書 ${slotId} を消去しました。`);
    }
  };

  const handleExport = () => {
    const backup = {
      slots: loadSaveSlots(),
      stats: loadGameStats(),
      suspend1: loadSuspendData(1),
      suspend2: loadSuspendData(2),
      suspend3: loadSuspendData(3),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dq_rogue_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('セーブデータをファイルに出力しました。');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.slots) localStorage.setItem('dq_rogue_slots', JSON.stringify(data.slots));
        if (data.stats) localStorage.setItem('dq_rogue_stats', JSON.stringify(data.stats));
        if (data.suspend1) localStorage.setItem('dq_rogue_suspend_1', JSON.stringify(data.suspend1));
        if (data.suspend2) localStorage.setItem('dq_rogue_suspend_2', JSON.stringify(data.suspend2));
        if (data.suspend3) localStorage.setItem('dq_rogue_suspend_3', JSON.stringify(data.suspend3));

        setSlots(loadSaveSlots());
        soundEngine.playLevelUp();
        setMessage('セーブデータをファイルから復元しました！');
      } catch {
        alert('セーブデータの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 select-none font-['DotGothic16'] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-black border-4 border-amber-500 rounded-lg p-4 text-white shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-500/50 pb-2 mb-3">
          <span className="text-amber-300 text-base sm:text-lg font-bold">【 冒険の書（セーブ管理） 】</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded border border-white/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {message && (
          <div className="mb-3 p-2 bg-amber-950/80 border border-amber-400 text-amber-200 text-xs rounded text-center">
            {message}
          </div>
        )}

        {/* Slots List */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          {slots.map((slot) => (
            <div
              key={slot.slotId}
              className="border-2 border-white/40 rounded p-3 bg-neutral-950 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-600 text-black px-1.5 py-0.5 rounded font-bold text-xs">
                    書 {slot.slotId}
                  </span>
                  <span className="font-bold text-sm text-amber-100">
                    {slot.hasSuspendData ? `B${slot.floor}F 探索中` : '新しい冒険'}
                  </span>
                </div>
                {slot.hasSuspendData && slot.timestamp && (
                  <span className="text-[10px] text-white/50">
                    {new Date(slot.timestamp).toLocaleString('ja-JP', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {slot.hasSuspendData ? (
                <div className="text-xs text-white/80 grid grid-cols-3 gap-1 bg-black/40 p-1.5 rounded">
                  <span>Lv.{slot.level}</span>
                  <span>HP: {slot.hp}/{slot.maxHp}</span>
                  <span>階層: B{slot.floor}F</span>
                </div>
              ) : (
                <p className="text-xs text-white/40">中断セーブデータはありません</p>
              )}

              {/* Action Buttons for this slot */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {engine && (
                  <button
                    onClick={() => handleSaveCurrent(slot.slotId)}
                    className="bg-amber-700 hover:bg-amber-600 border border-white/40 px-2.5 py-1 rounded text-xs text-white flex items-center gap-1 whitespace-nowrap transition active:scale-95 cursor-pointer"
                  >
                    <Save size={13} />
                    <span>ここにセーブ</span>
                  </button>
                )}

                {slot.hasSuspendData && (
                  <>
                    <button
                      onClick={() => handleResume(slot.slotId)}
                      className="bg-emerald-700 hover:bg-emerald-600 border border-white/40 px-2.5 py-1 rounded text-xs text-white flex items-center gap-1 whitespace-nowrap transition active:scale-95"
                    >
                      <Play size={13} />
                      <span>再開する</span>
                    </button>

                    <button
                      onClick={() => handleDelete(slot.slotId)}
                      className="bg-neutral-800 hover:bg-red-900 border border-white/30 px-2 py-1 rounded text-xs text-neutral-400 hover:text-white transition active:scale-95"
                      title="データ消去"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Backup export/import */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/70">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 hover:text-amber-300 transition"
          >
            <Download size={13} />
            <span>データ出力（保存）</span>
          </button>

          <label className="flex items-center gap-1 hover:text-amber-300 transition cursor-pointer">
            <Upload size={13} />
            <span>データ読込（復元）</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
