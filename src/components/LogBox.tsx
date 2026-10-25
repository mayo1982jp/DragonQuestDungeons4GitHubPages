/**
 * Dragon Quest Style Action Log Box
 * Displays real-time combat messages, story events, and level-ups with retro styling.
 */

import React, { useRef, useEffect, useState } from 'react';
import { LogMessage } from '../types/game';

interface Props {
  logs: LogMessage[];
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** When set, the box shows briefly after each new log, then fades out (mobile). */
  autoHideMs?: number;
}

export const LogBox: React.FC<Props> = ({
  logs,
  expanded = false,
  onToggleExpand,
  autoHideMs,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const latestLogId = logs[0]?.id;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Mobile ticker: show for a few seconds after a new log, but stay open while expanded.
  useEffect(() => {
    if (!autoHideMs) {
      setIsVisible(true);
      return;
    }
    setIsVisible(true);
    if (expanded) return;
    const timer = window.setTimeout(() => setIsVisible(false), autoHideMs);
    return () => window.clearTimeout(timer);
  }, [latestLogId, autoHideMs, expanded]);

  // Display all logs; in collapsed mode, height is constrained to 2 lines with scrollbar
  const displayLogs = logs;

  return (
    <div
      aria-hidden={autoHideMs ? !isVisible : undefined}
      className={`bg-black/95 border-2 border-white/80 rounded p-2 text-white font-['DotGothic16'] shadow-xl select-none transition-all duration-500 ${
        expanded ? 'fixed inset-x-4 bottom-20 z-40 max-h-60' : 'log-box h-[4.75rem] sm:h-[5.5rem]'
      } ${autoHideMs && !isVisible ? 'opacity-0 pointer-events-none -translate-y-1' : 'opacity-100 pointer-events-auto'}`}
    >
      <div className="log-header flex items-center justify-between border-b border-white/20 pb-1 mb-1 text-[11px] text-white/60 shrink-0">
        <span className="font-bold text-amber-300">【 冒険の記録 】</span>
        <button
          onClick={onToggleExpand}
          className="hover:text-white px-1.5 py-0.5 rounded border border-white/30 text-[10px] cursor-pointer"
        >
          {expanded ? '▲ たたむ' : '▼ 全履歴'}
        </button>
      </div>

      <div
        ref={containerRef}
        className={`overflow-y-auto space-y-0.5 text-xs leading-snug pr-1 select-text scrollbar-thin ${
          expanded ? 'max-h-48' : 'log-list h-[2.5rem] sm:h-[3.25rem]'
        }`}
      >
        {displayLogs.map((log) => (
          <div key={log.id} className={`break-words ${getLogColor(log.type)}`}>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
};

function getLogColor(type: LogMessage['type']): string {
  switch (type) {
    case 'danger':
      return 'text-red-400 font-bold';
    case 'combat':
      return 'text-amber-200';
    case 'level':
      return 'text-emerald-300 font-bold';
    case 'item':
      return 'text-sky-300';
    case 'magic':
      return 'text-purple-300';
    default:
      return 'text-neutral-200';
  }
}
