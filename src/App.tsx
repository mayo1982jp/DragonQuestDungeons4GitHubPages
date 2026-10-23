/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { soundEngine } from './audio/soundEngine';

import { TitleScreen } from './components/TitleScreen';
import { SaveLoadModal } from './components/SaveLoadModal';
import { HelpModal } from './components/HelpModal';

const GameScreen = lazy(() =>
  import('./components/GameScreen').then((module) => ({ default: module.GameScreen }))
);

const BestiaryModal = lazy(() =>
  import('./components/BestiaryModal').then((module) => ({ default: module.BestiaryModal }))
);

interface GameStart {
  slotId: number;
  resume: boolean;
  key: number;
}

export default function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [gameStart, setGameStart] = useState<GameStart>({ slotId: 1, resume: false, key: 0 });

  // Title screen modals
  const [isSaveOpen, setIsSaveOpen] = useState<boolean>(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMute());

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMute(next);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsSaveOpen(false);
      setIsBestiaryOpen(false);
      setIsHelpOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartGame = (slotId: number = 1) => {
    setGameStart((prev) => ({ slotId, resume: false, key: prev.key + 1 }));
    setScreen('game');
  };

  const handleLoadRun = (slotId: number) => {
    setGameStart((prev) => ({ slotId, resume: true, key: prev.key + 1 }));
    setScreen('game');
  };

  const handleReturnTitle = () => {
    soundEngine.stopBgm();
    setScreen('title');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black flex flex-col font-['DotGothic16'] text-white">
      {screen === 'title' ? (
        <>
          <TitleScreen
            onStartGame={handleStartGame}
            onOpenSaveModal={() => setIsSaveOpen(true)}
            onOpenBestiary={() => setIsBestiaryOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />

          <SaveLoadModal
            engine={null}
            isOpen={isSaveOpen}
            onClose={() => setIsSaveOpen(false)}
            onLoadRun={handleLoadRun}
          />

          {isBestiaryOpen && (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-['DotGothic16'] text-sm text-emerald-300">
                  図鑑を読み込み中...
                </div>
              }
            >
              <BestiaryModal
                isOpen={isBestiaryOpen}
                onClose={() => setIsBestiaryOpen(false)}
              />
            </Suspense>
          )}

          <HelpModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
          />
        </>
      ) : (
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black font-['DotGothic16'] text-white">
              <div className="text-lg font-bold text-amber-300">冒険の準備中...</div>
              <div className="text-xs text-white/50">ダンジョンを生成しています</div>
            </div>
          }
        >
          <GameScreen
            key={gameStart.key}
            initialSlotId={gameStart.slotId}
            resumeFromSave={gameStart.resume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onReturnTitle={handleReturnTitle}
          />
        </Suspense>
      )}
    </div>
  );
}
