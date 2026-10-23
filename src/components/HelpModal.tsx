/**
 * How to Play & Controls Help Modal
 */

import React from 'react';
import { X, Keyboard, Compass, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 select-none font-['DotGothic16'] animate-fade-in">
      <div className="relative w-full max-w-lg bg-black border-4 border-sky-400 rounded-lg p-4 text-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-sky-400/50 pb-2 mb-3">
          <span className="text-sky-300 text-base sm:text-lg font-bold">【 冒険の手引き・操作方法 】</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded border border-white/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 flex-1 overflow-y-auto text-xs leading-relaxed text-white/90 pr-1">
          {/* Controls */}
          <div className="bg-neutral-950 border border-white/20 p-3 rounded space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <Keyboard size={16} />
              <span>操作方法（キーボード / タッチ対応）</span>
            </h4>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-[11px] text-white/80">
              <div>
                <strong className="text-white">移動:</strong> テンキー1~9 / 矢印 / WASD
              </div>
              <div className="text-amber-300 font-bold">
                <strong>タッチ移動:</strong> タッチした場所に移動（タッチで移動可）
              </div>
              <div>
                <strong className="text-white">足元使用 / 待機:</strong> [テンキー5] / [ . ]
              </div>
              <div>
                <strong className="text-white">攻撃:</strong> スペースキー / Enter / 敵をタップ
              </div>
              <div>
                <strong className="text-white">呪文スロット:</strong> 数字キー [ 1 ~ 9 ] で直接発動
              </div>
              <div>
                <strong className="text-white">どうぐ管理:</strong> 左カラム常時表示 / [ I ] キー
              </div>
              <div>
                <strong className="text-white">じゅもん・特技一覧:</strong> [ M ] キー
              </div>
              <div>
                <strong className="text-white">ダッシュ:</strong> [Shift] + 方向キー / テンキー
              </div>
              <div>
                <strong className="text-white">階段を下りる:</strong> 階段上で [Enter]
              </div>
            </div>

          </div>

          {/* Core Roguelike Rules */}
          <div className="bg-neutral-950 border border-white/20 p-3 rounded space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
              <Compass size={16} />
              <span>不思議な洞穴の掟</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-[11px]">
              <li>
                <strong>完全同期ターン制:</strong> 勇者が一歩動くか攻撃すると、すべてのモンスターも一歩行動します。じっくり考えて次の一手を決めましょう。
              </li>
              <li>
                <strong>満腹度（胃）:</strong> 歩くにつれてお腹が減り、0%になると毎ターンHPが減少します。「大きなパン」を見つけたら食べましょう。
              </li>
              <li>
                <strong>未識別のワナ:</strong> ダンジョンの床には毒矢や地雷などのワナが隠されています。「ワナ消しの巻物」で一掃できます。
              </li>
              <li>
                <strong>モンスターハウス:</strong> 大量のモンスターとアイテムが集まる魔の部屋。突入時は呪文や巻物で対処しましょう！
              </li>
            </ul>
          </div>

          {/* Equipment and Spells */}
          <div className="bg-neutral-950 border border-white/20 p-3 rounded space-y-2">
            <h4 className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
              <ShieldCheck size={16} />
              <span>見た目の変化と成長システム</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-white/80 text-[11px]">
              <li>
                <strong>装備で見た目が変化:</strong> 「旅人の服」から「鋼の鎧」、そして伝説の「ロトの鎧」「ロトの剣」「ロトの盾」を身にまとうと、勇者のドット絵が神々しく変化します！
              </li>
              <li>
                <strong>呪文・特技の習得:</strong> モンスターを倒してレベルが上がると、「ホイミ」「ギラ」「ラリホー」「はやぶさ斬り」「ギガスラッシュ」「イオナズン」など強力な呪文を習得します。
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full bg-sky-700 hover:bg-sky-600 border-2 border-white py-1.5 rounded text-white font-bold transition active:scale-95 text-xs sm:text-sm"
        >
          理解した（閉じる）
        </button>
      </div>
    </div>
  );
};
