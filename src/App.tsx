/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { Direction } from './types/game';
import { soundEngine } from './audio/soundEngine';
import { loadSuspendData, saveSuspendData, saveGameStats } from './game/storage';

import { getItemMinimalStat } from './game/itemData';
import { ItemPixelIcon } from './components/ItemPixelIcon';

// Components
import { TitleScreen } from './components/TitleScreen';
import { StatusHeader } from './components/StatusHeader';
import { DungeonCanvas } from './components/DungeonCanvas';
import { Minimap } from './components/Minimap';
import { LogBox } from './components/LogBox';
import { VirtualPad } from './components/VirtualPad';
import { PCSidebar } from './components/PCSidebar';
import { PCLeftColumn } from './components/PCLeftColumn';
import { InventoryModal } from './components/InventoryModal';
import { SpellModal } from './components/SpellModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { BestiaryModal } from './components/BestiaryModal';
import { GameOverModal } from './components/GameOverModal';
import { HelpModal } from './components/HelpModal';
import { SwitchControllerModal } from './components/SwitchControllerModal';
import { useSwitchController } from './hooks/useSwitchController';

export default function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [engine, setEngine] = useState<GameEngine>(() => new GameEngine(1));
  const [renderTick, setRenderTick] = useState<number>(0);

  // PC UI state
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  const [showPad, setShowPad] = useState<boolean>(!isDesktop); // Default off on PC, on on mobile
  const [zoom, setZoom] = useState<number>(40); // 40px default for clear pixel view

  // Modals
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isSpellOpen, setIsSpellOpen] = useState<boolean>(false);
  const [isSaveOpen, setIsSaveOpen] = useState<boolean>(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isControllerGuideOpen, setIsControllerGuideOpen] = useState<boolean>(false);
  const [isMinimapExpanded, setIsMinimapExpanded] = useState<boolean>(false);
  const [isLogExpanded, setIsLogExpanded] = useState<boolean>(false);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMute());

  const forceUpdate = useCallback(() => {
    setRenderTick((t) => t + 1);
  }, []);

  const autoWalkTimerRef = React.useRef<number | null>(null);

  const stopAutoWalk = useCallback(() => {
    if (autoWalkTimerRef.current) {
      clearInterval(autoWalkTimerRef.current);
      autoWalkTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autoWalkTimerRef.current) {
        clearInterval(autoWalkTimerRef.current);
      }
    };
  }, []);

  const isAnyModalOpen =
    isInventoryOpen ||
    isSpellOpen ||
    isSaveOpen ||
    isBestiaryOpen ||
    isHelpOpen ||
    isControllerGuideOpen ||
    engine.isGameOver ||
    engine.isGameClear;

  // Handle Mute toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMute(next);
  };

  // Start a fresh game or continue
  const handleStartGame = (slotId: number = 1) => {
    const newEngine = new GameEngine(slotId);
    setEngine(newEngine);
    setScreen('game');
    soundEngine.playBgm('dungeon');
    forceUpdate();
  };

  // Resume from suspend data
  const handleLoadRun = (slotId: number) => {
    const suspend = loadSuspendData(slotId);
    if (suspend) {
      const resumed = new GameEngine(slotId);
      resumed.player = suspend.player;
      resumed.floor = suspend.floor;
      resumed.stats = suspend.stats;
      resumed.syncEquipment();
      setEngine(resumed);
      setScreen('game');
      soundEngine.playBgm(resumed.floor.floorNumber >= 25 ? 'boss' : 'dungeon');
      forceUpdate();
    } else {
      handleStartGame(slotId);
    }
  };

  // Auto-save on major state updates or window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (screen === 'game' && !engine.isGameOver && !engine.isGameClear) {
        saveSuspendData(engine.activeSlotId, {
          player: engine.player,
          floor: engine.floor,
          stats: engine.stats,
          turnCount: engine.player.turns,
          bestiary: {},
        });
        saveGameStats(engine.stats);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [screen, engine]);

  // Player action wrappers
  const handleMove = useCallback(
    (dir: Direction, isDash: boolean = false) => {
      stopAutoWalk();
      if (isInventoryOpen || isSpellOpen || isSaveOpen || isBestiaryOpen || isHelpOpen) return;
      if (isDash) {
        engine.dashPlayer(dir);
      } else {
        engine.movePlayer(dir);
      }
      forceUpdate();
    },
    [engine, isInventoryOpen, isSpellOpen, isSaveOpen, isBestiaryOpen, isHelpOpen, forceUpdate, stopAutoWalk]
  );

  const handleAttack = useCallback(() => {
    stopAutoWalk();
    if (isInventoryOpen || isSpellOpen || isSaveOpen || isBestiaryOpen || isHelpOpen) return;
    engine.attackInPlace();
    forceUpdate();
  }, [engine, isInventoryOpen, isSpellOpen, isSaveOpen, isBestiaryOpen, isHelpOpen, forceUpdate, stopAutoWalk]);

  const handleWait = useCallback(() => {
    stopAutoWalk();
    if (isInventoryOpen || isSpellOpen || isSaveOpen || isBestiaryOpen || isHelpOpen) return;
    engine.waitTurn();
    forceUpdate();
  }, [engine, isInventoryOpen, isSpellOpen, isSaveOpen, isBestiaryOpen, isHelpOpen, forceUpdate, stopAutoWalk]);

  const handleDescendStairs = useCallback(() => {
    stopAutoWalk();
    if (isInventoryOpen || isSpellOpen || isSaveOpen || isBestiaryOpen || isHelpOpen) return;
    const ok = engine.descendStairs();
    if (ok) {
      // 階段を下りた時に書1に自動セーブする
      saveSuspendData(1, {
        player: engine.player,
        floor: engine.floor,
        stats: engine.stats,
        turnCount: engine.player.turns,
        bestiary: {},
      });
      saveGameStats(engine.stats);
      engine.addLog('【冒険の書 1】に自動記録された。', 'info');
    }
    forceUpdate();
  }, [engine, isInventoryOpen, isSpellOpen, isSaveOpen, isBestiaryOpen, isHelpOpen, forceUpdate, stopAutoWalk]);

  const handleQuickHeal = useCallback(() => {
    engine.quickHeal();
    forceUpdate();
  }, [engine, forceUpdate]);

  const handleQuickEat = useCallback(() => {
    engine.quickEat();
    forceUpdate();
  }, [engine, forceUpdate]);

  const handleCastSpellById = useCallback(
    (spellId: string) => {
      const spell = engine.player.spells.find((s) => s.id === spellId);
      if (spell) {
        engine.castSpell(spell);
        forceUpdate();
      }
    },
    [engine, forceUpdate]
  );

  const handleUseFloorItem = useCallback(() => {
    engine.useFloorItem();
    forceUpdate();
  }, [engine, forceUpdate]);

  // Switch Controller & Gamepad Integration
  const controllerStatus = useSwitchController({
    enabled: screen === 'game',
    isPlayerOnStairs: engine.isPlayerOnStairs(),
    isPlayerOnItem: !!engine.getFloorItemAtPlayer(),
    onMove: (dir, isDash) => handleMove(dir, isDash),
    onAttack: handleAttack,
    onWait: handleWait,
    onDescendStairs: handleDescendStairs,
    onUseFloorItem: handleUseFloorItem,
    onOpenInventory: () => setIsInventoryOpen((prev) => !prev),
    onOpenSpells: () => setIsSpellOpen((prev) => !prev),
    onOpenSaveModal: () => {
      if (isSaveOpen) {
        setIsSaveOpen(false);
      } else {
        setIsInventoryOpen(false);
        setIsSpellOpen(false);
        setIsBestiaryOpen(false);
        setIsHelpOpen(false);
        setIsControllerGuideOpen(false);
        setIsSaveOpen(true);
      }
    },
    onOpenHelp: () => setIsHelpOpen((prev) => !prev),
    onToggleMinimap: () => setIsMinimapExpanded((prev) => !prev),
    onQuickHeal: handleQuickHeal,
    onQuickEat: handleQuickEat,
    isModalOpen: isAnyModalOpen,
    onModalCancel: () => {
      setIsInventoryOpen(false);
      setIsSpellOpen(false);
      setIsSaveOpen(false);
      setIsBestiaryOpen(false);
      setIsHelpOpen(false);
      setIsControllerGuideOpen(false);
    },
  });

  // Click or Touch on dungeon tile directly (Move to touched location / Attack / Wait)
  const handleTileClick = useCallback(
    (tx: number, ty: number, isRightClick?: boolean) => {
      stopAutoWalk();
      if (isInventoryOpen || isSpellOpen || isSaveOpen || isBestiaryOpen || isHelpOpen) return;
      if (engine.isGameOver || engine.isGameClear) return;

      if (isRightClick) {
        // Right click: if self, wait; else attack
        if (tx === engine.player.x && ty === engine.player.y) {
          handleWait();
        } else {
          handleAttack();
        }
        return;
      }

      // 1. Touched self position -> Descend stairs if on stairs, use item if on item, else wait/rest
      if (tx === engine.player.x && ty === engine.player.y) {
        if (engine.isPlayerOnStairs()) {
          handleDescendStairs();
        } else if (engine.getFloorItemAtPlayer()) {
          handleUseFloorItem();
        } else {
          handleWait();
        }
        return;
      }

      // 2. Touched adjacent monster -> Attack monster immediately
      const adjacentMonster = engine.floor.monsters.find(
        (m) =>
          m.x === tx &&
          m.y === ty &&
          Math.abs(m.x - engine.player.x) <= 1 &&
          Math.abs(m.y - engine.player.y) <= 1
      );
      if (adjacentMonster) {
        engine.playerAttackMonster(adjacentMonster);
        engine.endTurn();
        forceUpdate();
        return;
      }

      // 3. Touched direct adjacent tile -> Immediate single step
      const dx = tx - engine.player.x;
      const dy = ty - engine.player.y;
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        let dir: Direction = 'S';
        if (dx === 0 && dy === -1) dir = 'N';
        else if (dx === 1 && dy === -1) dir = 'NE';
        else if (dx === 1 && dy === 0) dir = 'E';
        else if (dx === 1 && dy === 1) dir = 'SE';
        else if (dx === 0 && dy === 1) dir = 'S';
        else if (dx === -1 && dy === 1) dir = 'SW';
        else if (dx === -1 && dy === 0) dir = 'W';
        else if (dx === -1 && dy === -1) dir = 'NW';
        handleMove(dir, false);
        return;
      }

      // 4. Touched distant tile -> Pathfinding & Auto-Move to touched location!
      engine.addVisualEffect('spark', tx, ty);
      const path = engine.findPath(tx, ty);

      if (path.length === 0) {
        // Fallback: step in primary direction towards clicked tile if no clear path
        const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
        const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
        let dir: Direction = 'S';
        if (stepX === 0 && stepY === -1) dir = 'N';
        else if (stepX === 1 && stepY === -1) dir = 'NE';
        else if (stepX === 1 && stepY === 0) dir = 'E';
        else if (stepX === 1 && stepY === 1) dir = 'SE';
        else if (stepX === 0 && stepY === 1) dir = 'S';
        else if (stepX === -1 && stepY === 1) dir = 'SW';
        else if (stepX === -1 && stepY === 0) dir = 'W';
        else if (stepX === -1 && stepY === -1) dir = 'NW';
        handleMove(dir, false);
        return;
      }

      // Walk step-by-step along the path to the touched destination
      const pathQueue = [...path];
      const firstDir = pathQueue.shift();
      if (firstDir) {
        const moved = engine.movePlayer(firstDir);
        forceUpdate();
        if (!moved || pathQueue.length === 0 || engine.isGameOver || engine.isGameClear) {
          return;
        }

        const monsterNear = engine.floor.monsters.some(
          (m) =>
            Math.abs(m.x - engine.player.x) <= 1 &&
            Math.abs(m.y - engine.player.y) <= 1
        );
        if (monsterNear) return;
      }

      autoWalkTimerRef.current = window.setInterval(() => {
        if (
          pathQueue.length === 0 ||
          engine.isGameOver ||
          engine.isGameClear
        ) {
          stopAutoWalk();
          return;
        }

        // Stop if reached stairs or item
        if (engine.isPlayerOnStairs() || engine.getFloorItemAtPlayer()) {
          stopAutoWalk();
          return;
        }

        // Stop if hostile monster approaches adjacent tile
        const monsterNear = engine.floor.monsters.some(
          (m) =>
            Math.abs(m.x - engine.player.x) <= 1 &&
            Math.abs(m.y - engine.player.y) <= 1
        );
        if (monsterNear) {
          stopAutoWalk();
          return;
        }

        const nextDir = pathQueue.shift()!;
        const ok = engine.movePlayer(nextDir);
        forceUpdate();

        if (!ok || pathQueue.length === 0) {
          stopAutoWalk();
        }
      }, 75);
    },
    [
      engine,
      handleMove,
      handleWait,
      handleAttack,
      handleDescendStairs,
      handleUseFloorItem,
      forceUpdate,
      isInventoryOpen,
      isSpellOpen,
      isSaveOpen,
      isBestiaryOpen,
      isHelpOpen,
      stopAutoWalk,
    ]
  );

  // Global PC Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stopAutoWalk();
      if (screen !== 'game') return;

      // Close modal with Escape
      if (e.key === 'Escape') {
        setIsInventoryOpen(false);
        setIsSpellOpen(false);
        setIsSaveOpen(false);
        setIsBestiaryOpen(false);
        setIsHelpOpen(false);
        setIsControllerGuideOpen(false);
        setIsMinimapExpanded(false);
        return;
      }

      // If a modal is open, let modal keyboard listener handle it
      if (isAnyModalOpen) {
        return;
      }

      const isShift = e.shiftKey;

      // 1. Numpad Keys: Dedicated 8-way movement, Numpad 5 for Floor Item / Wait
      if (e.code.startsWith('Numpad')) {
        e.preventDefault();
        switch (e.code) {
          case 'Numpad8':
            handleMove('N', isShift);
            return;
          case 'Numpad2':
            handleMove('S', isShift);
            return;
          case 'Numpad4':
            handleMove('W', isShift);
            return;
          case 'Numpad6':
            handleMove('E', isShift);
            return;
          case 'Numpad7':
            handleMove('NW', isShift);
            return;
          case 'Numpad9':
            handleMove('NE', isShift);
            return;
          case 'Numpad1':
            handleMove('SW', isShift);
            return;
          case 'Numpad3':
            handleMove('SE', isShift);
            return;
          case 'Numpad5':
            if (engine.getFloorItemAtPlayer()) {
              handleUseFloorItem();
            } else {
              handleWait();
            }
            return;
          case 'NumpadDecimal':
            handleWait();
            return;
          case 'NumpadEnter':
            if (
              engine.player.x === engine.floor.stairsPos.x &&
              engine.player.y === engine.floor.stairsPos.y
            ) {
              handleDescendStairs();
            } else {
              handleAttack();
            }
            return;
        }
      }

      // 2. Top-Row Digit Keys: Quick Spell Cast for ALL learned spells (1~9)
      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          const spellIdx = num - 1;
          if (engine.player.spells[spellIdx]) {
            e.preventDefault();
            handleCastSpellById(engine.player.spells[spellIdx].id);
            return;
          }
        }
      }

      // 3. Arrow Keys / WASD / Navigation keys / Other hotkeys
      switch (e.key) {
        // Orthogonal
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('N', isShift);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('S', isShift);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('W', isShift);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('E', isShift);
          break;

        // Diagonals (Home/End/PgUp/PgDn)
        case 'Home':
          e.preventDefault();
          handleMove('NW', isShift);
          break;
        case 'PageUp':
          e.preventDefault();
          handleMove('NE', isShift);
          break;
        case 'End':
          e.preventDefault();
          handleMove('SW', isShift);
          break;
        case 'PageDown':
          e.preventDefault();
          handleMove('SE', isShift);
          break;

        // Attack or Descend Stairs
        case ' ':
          e.preventDefault();
          if (isShift) {
            handleWait();
          } else if (engine.isPlayerOnStairs()) {
            handleDescendStairs();
          } else {
            handleAttack();
          }
          break;

        // Wait / Pass turn
        case '.':
          e.preventDefault();
          handleWait();
          break;

        case 'Enter':
          e.preventDefault();
          if (
            engine.player.x === engine.floor.stairsPos.x &&
            engine.player.y === engine.floor.stairsPos.y
          ) {
            handleDescendStairs();
          } else {
            handleAttack();
          }
          break;

        // Hotkeys for Inventory & Spells
        case 'i':
        case 'I':
          e.preventDefault();
          setIsInventoryOpen((prev) => !prev);
          break;

        case 'm':
        case 'M':
        case 'c':
        case 'C':
          e.preventDefault();
          setIsSpellOpen((prev) => !prev);
          break;

        // Quick recovery shortcuts
        case 'h':
        case 'H':
          e.preventDefault();
          handleQuickHeal();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          handleQuickEat();
          break;

        // Map radar toggle
        case 'Tab':
          e.preventDefault();
          setIsMinimapExpanded((prev) => !prev);
          break;

        // Help modal
        case '?':
        case '/':
          e.preventDefault();
          setIsHelpOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    screen,
    engine,
    isInventoryOpen,
    isSpellOpen,
    isSaveOpen,
    isBestiaryOpen,
    isHelpOpen,
    isControllerGuideOpen,
    isMinimapExpanded,
    handleMove,
    handleAttack,
    handleWait,
    handleDescendStairs,
    handleQuickHeal,
    handleQuickEat,
    handleCastSpellById,
    handleUseFloorItem,
  ]);

  const isPlayerOnStairs =
    engine.player.x === engine.floor.stairsPos.x &&
    engine.player.y === engine.floor.stairsPos.y;

  const floorItemAtFeet = engine.getFloorItemAtPlayer();

  return (
    <div className="w-screen h-screen overflow-hidden bg-black flex flex-col font-['DotGothic16'] text-white">
      {screen === 'title' ? (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenSaveModal={() => setIsSaveOpen(true)}
          onOpenBestiary={() => setIsBestiaryOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      ) : (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
          {/* Top Status Header */}
          <StatusHeader
            engine={engine}
            onOpenSaveModal={() => setIsSaveOpen(true)}
            onOpenBestiary={() => setIsBestiaryOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onToggleMinimap={() => setIsMinimapExpanded((v) => !v)}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            showPad={showPad}
            onTogglePad={() => setShowPad((prev) => !prev)}
            zoom={zoom}
            onSetZoom={setZoom}
            controllerStatus={controllerStatus}
            onOpenControllerGuide={() => setIsControllerGuideOpen(true)}
          />

          {/* Main Layout Area: Left Column (Inventory + Logs) + Center Canvas Viewport + Right Column (Status & Minimap) */}
          <div className="relative flex-1 flex w-full h-full overflow-hidden">
            {/* Permanent Left Column (Desktop / PC Only): 所持品どうぐ & 冒険の記録 */}
            <div className="hidden lg:block h-full shrink-0">
              <PCLeftColumn
                engine={engine}
                onActionComplete={forceUpdate}
              />
            </div>

            {/* Viewport Canvas container (Center) */}
            <main className="relative flex-1 h-full overflow-hidden bg-neutral-950 flex flex-col justify-between">
              <div className="relative w-full flex-1 overflow-hidden">
                <DungeonCanvas
                  engine={engine}
                  onTileClick={handleTileClick}
                  tileSize={zoom}
                />

                {/* Floor Item Popup Prompt (Usable via Numpad 5 or Click) */}
                {floorItemAtFeet && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-neutral-950/95 border-2 border-amber-400 p-2 sm:px-3 sm:py-2 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md animate-pulse border-dashed">
                    <div className="flex items-center gap-2">
                      <ItemPixelIcon item={floorItemAtFeet.item} size={28} />
                      <div className="text-left">
                        <div className="text-[10px] text-amber-300 font-bold leading-none mb-0.5">
                          足元のアイテム
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{floorItemAtFeet.item.name}</span>
                          {getItemMinimalStat(floorItemAtFeet.item) && (
                            <span className="text-[10px] bg-neutral-800 text-amber-300 border border-amber-400/50 px-1 py-0.2 rounded font-mono font-bold">
                              {getItemMinimalStat(floorItemAtFeet.item)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleUseFloorItem}
                      className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold px-2.5 py-1 sm:py-1.5 rounded border border-white text-xs flex items-center gap-1 transition active:scale-95 shadow-md cursor-pointer shrink-0"
                    >
                      <span>[テンキー5] で直接使用</span>
                    </button>
                  </div>
                )}

                {/* Compact Minimap on mobile or if sidebar is collapsed */}
                <div className="lg:hidden absolute top-3 right-3 z-20 pointer-events-auto">
                  <Minimap
                    engine={engine}
                    expanded={isMinimapExpanded}
                    onToggleExpand={() => setIsMinimapExpanded((v) => !v)}
                  />
                </div>

                {/* Log Box bottom-left (Displayed only on mobile/tablet when Left Column is hidden) */}
                <div className="lg:hidden absolute bottom-2 left-2 right-2 sm:right-auto sm:w-[420px] z-20 pointer-events-auto">
                  <LogBox
                    logs={engine.logs}
                    expanded={isLogExpanded}
                    onToggleExpand={() => setIsLogExpanded((v) => !v)}
                  />
                </div>
              </div>

              {/* Optional Virtual Pad (toggled via header or on mobile) */}
              {showPad && (
                <div className="w-full shrink-0 border-t border-white/40">
                  <VirtualPad
                    onMove={(dir) => handleMove(dir, false)}
                    onAttack={handleAttack}
                    onOpenInventory={() => setIsInventoryOpen(true)}
                    onOpenSpells={() => setIsSpellOpen(true)}
                    onOpenSaveModal={() => setIsSaveOpen(true)}
                    onDescendStairs={handleDescendStairs}
                    isPlayerOnStairs={isPlayerOnStairs}
                  />
                </div>
              )}
            </main>

            {/* Desktop / PC Optimized Sidebar (Right Column) */}
            <div className="hidden lg:block h-full shrink-0">
              <PCSidebar
                engine={engine}
                onOpenInventory={() => setIsInventoryOpen(true)}
                onOpenSpells={() => setIsSpellOpen(true)}
                onOpenSaveModal={() => setIsSaveOpen(true)}
                onOpenBestiary={() => setIsBestiaryOpen(true)}
                onOpenHelp={() => setIsHelpOpen(true)}
                onAttack={handleAttack}
                onWait={handleWait}
                onDescendStairs={handleDescendStairs}
                onQuickHeal={handleQuickHeal}
                onQuickEat={handleQuickEat}
                onCastSpell={handleCastSpellById}
                zoom={zoom}
                onSetZoom={setZoom}
                isMinimapExpanded={isMinimapExpanded}
                onToggleMinimap={() => setIsMinimapExpanded((v) => !v)}
                controllerStatus={controllerStatus}
                onOpenControllerGuide={() => setIsControllerGuideOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <InventoryModal
        engine={engine}
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onActionComplete={forceUpdate}
      />

      <SpellModal
        engine={engine}
        isOpen={isSpellOpen}
        onClose={() => setIsSpellOpen(false)}
        onActionComplete={forceUpdate}
      />

      <SaveLoadModal
        engine={engine}
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        onLoadRun={handleLoadRun}
      />

      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <SwitchControllerModal
        isOpen={isControllerGuideOpen}
        onClose={() => setIsControllerGuideOpen(false)}
        controllerName={controllerStatus.name}
        isConnected={controllerStatus.connected}
      />

      <GameOverModal
        engine={engine}
        isOpen={engine.isGameOver || engine.isGameClear}
        onRestart={() => handleStartGame(engine.activeSlotId)}
        onReturnTitle={() => {
          soundEngine.stopBgm();
          setScreen('title');
        }}
      />
    </div>
  );
}
