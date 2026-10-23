/**
 * Nintendo Switch Controller & Gamepad Hook
 * Supports Nintendo Switch Pro Controller, Joy-Cons, and standard gamepads
 * with 8-way movement, Dash (B hold + Move), attacks, inventory, spells, and modal navigation.
 */

import { useEffect, useRef, useState } from 'react';
import { Direction } from '../types/game';

interface SwitchControllerOptions {
  enabled: boolean;
  isPlayerOnStairs?: boolean;
  isPlayerOnItem?: boolean;
  onMove: (dir: Direction, isDash: boolean) => void;
  onAttack: () => void;
  onWait: () => void;
  onDescendStairs: () => void;
  onUseFloorItem?: () => void;
  onOpenInventory: () => void;
  onOpenSpells: () => void;
  onOpenSaveModal: () => void;
  onOpenHelp: () => void;
  onToggleMinimap: () => void;
  onQuickHeal: () => void;
  onQuickEat: () => void;
  isModalOpen: boolean;
  onModalConfirm?: () => void;
  onModalCancel?: () => void;
  onModalNavigate?: (direction: 'up' | 'down') => void;
  onModalSecondary?: () => void; // e.g. Drop item
}

export interface ControllerStatus {
  connected: boolean;
  name: string;
  isSwitch: boolean;
}

export function useSwitchController({
  enabled,
  isPlayerOnStairs = false,
  isPlayerOnItem = false,
  onMove,
  onAttack,
  onWait,
  onDescendStairs,
  onUseFloorItem,
  onOpenInventory,
  onOpenSpells,
  onOpenSaveModal,
  onOpenHelp,
  onToggleMinimap,
  onQuickHeal,
  onQuickEat,
  isModalOpen,
  onModalConfirm,
  onModalCancel,
  onModalNavigate,
  onModalSecondary,
}: SwitchControllerOptions) {
  const [controllerStatus, setControllerStatus] = useState<ControllerStatus>({
    connected: false,
    name: '',
    isSwitch: false,
  });

  const prevButtonsRef = useRef<boolean[]>([]);
  const lastMoveTimeRef = useRef<number>(0);
  const moveHeldSinceRef = useRef<number>(0);
  const lastDirRef = useRef<Direction | null>(null);

  // Detect connected gamepad
  useEffect(() => {
    const checkGamepads = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let foundGamepad: Gamepad | null = null;

      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp && gp.connected) {
          foundGamepad = gp;
          break;
        }
      }

      if (foundGamepad) {
        const idLower = foundGamepad.id.toLowerCase();
        const isSwitch =
          idLower.includes('switch') ||
          idLower.includes('pro controller') ||
          idLower.includes('joy-con') ||
          idLower.includes('057e') ||
          idLower.includes('nintendo');

        let cleanName = 'コントローラー';
        if (idLower.includes('pro controller') || idLower.includes('2009')) {
          cleanName = 'Switch Pro コントローラー';
        } else if (idLower.includes('joy-con') || idLower.includes('2006') || idLower.includes('2007')) {
          cleanName = 'Joy-Con';
        } else if (isSwitch) {
          cleanName = 'Nintendo Switch コントローラー';
        } else {
          cleanName = foundGamepad.id.split('(')[0].trim() || 'ゲームパッド';
        }

        setControllerStatus({
          connected: true,
          name: cleanName,
          isSwitch: true, // Treat all supported gamepads with Switch button mapping
        });
      } else {
        setControllerStatus({
          connected: false,
          name: '',
          isSwitch: false,
        });
      }
    };

    window.addEventListener('gamepadconnected', checkGamepads);
    window.addEventListener('gamepaddisconnected', checkGamepads);
    checkGamepads();

    const interval = setInterval(checkGamepads, 1000);
    return () => {
      window.removeEventListener('gamepadconnected', checkGamepads);
      window.removeEventListener('gamepaddisconnected', checkGamepads);
      clearInterval(interval);
    };
  }, []);

  // Gamepad Polling Loop
  useEffect(() => {
    if (!enabled) return;

    let animId: number;

    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find((g) => g && g.connected);

      if (gp) {
        const now = Date.now();
        const b = gp.buttons;
        const prev = prevButtonsRef.current;

        const isPressed = (idx: number) => b[idx]?.pressed || false;
        const wasJustPressed = (idx: number) => isPressed(idx) && !prev[idx];

        // Standard Switch button mapping:
        // 0: B (South)
        // 1: A (East)
        // 2: Y (West)
        // 3: X (North)
        // 4: L, 5: R, 6: ZL, 7: ZR
        // 8: Minus (-), 9: Plus (+)
        // 12: D-Up, 13: D-Down, 14: D-Left, 15: D-Right
        const btnB = isPressed(0);
        const btnA = isPressed(1);
        const btnY = isPressed(2);
        const btnX = isPressed(3);
        const btnL = isPressed(4);
        const btnR = isPressed(5);
        const btnZL = isPressed(6);
        const btnZR = isPressed(7);
        const btnMinus = isPressed(8);
        const btnPlus = isPressed(9);

        const justB = wasJustPressed(0);
        const justA = wasJustPressed(1);
        const justY = wasJustPressed(2);
        const justX = wasJustPressed(3);
        const justL = wasJustPressed(4);
        const justR = wasJustPressed(5);
        const justZL = wasJustPressed(6);
        const justZR = wasJustPressed(7);
        const justMinus = wasJustPressed(8);
        const justPlus = wasJustPressed(9);

        // Direction parsing (D-pad + Left Analog Stick with 0.35 deadzone)
        const dUp = isPressed(12);
        const dDown = isPressed(13);
        const dLeft = isPressed(14);
        const dRight = isPressed(15);

        const stickX = gp.axes[0] || 0;
        const stickY = gp.axes[1] || 0;
        const deadzone = 0.35;

        const sLeft = stickX < -deadzone;
        const sRight = stickX > deadzone;
        const sUp = stickY < -deadzone;
        const sDown = stickY > deadzone;

        const up = dUp || sUp;
        const down = dDown || sDown;
        const left = dLeft || sLeft;
        const right = dRight || sRight;

        let curDir: Direction | null = null;
        if (up && left) curDir = 'NW';
        else if (up && right) curDir = 'NE';
        else if (down && left) curDir = 'SW';
        else if (down && right) curDir = 'SE';
        else if (up) curDir = 'N';
        else if (down) curDir = 'S';
        else if (left) curDir = 'W';
        else if (right) curDir = 'E';

        // 1. If Modal is Open: navigate dialogs
        if (isModalOpen) {
          if (wasJustPressed(12) || (sUp && !prev[12])) {
            onModalNavigate?.('up');
          } else if (wasJustPressed(13) || (sDown && !prev[13])) {
            onModalNavigate?.('down');
          }
          if (justA) onModalConfirm?.();
          if (justB) onModalCancel?.();
          if (justY) onModalSecondary?.();
          // Plus (+) button toggles/closes save modal
          if (justPlus) onOpenSaveModal();
        } else {
          // 2. Normal In-Game Exploration & Combat

          // Movement handling with initial pause (220ms) and smooth repeat (110ms)
          if (curDir) {
            const isDash = btnB || btnR; // Holding B or R triggers Dash!
            if (lastDirRef.current !== curDir) {
              // Direction changed -> immediate step
              onMove(curDir, isDash);
              lastMoveTimeRef.current = now;
              moveHeldSinceRef.current = now;
              lastDirRef.current = curDir;
            } else {
              // Same direction held
              const heldDuration = now - moveHeldSinceRef.current;
              const repeatDelay = isDash ? 80 : 110;
              const initialDelay = 220;

              if (heldDuration > initialDelay && now - lastMoveTimeRef.current >= repeatDelay) {
                onMove(curDir, isDash);
                lastMoveTimeRef.current = now;
              }
            }
          } else {
            lastDirRef.current = null;
            moveHeldSinceRef.current = 0;
          }

          // A button:
          // 1. If standing on stairs, descend the stairs!
          // 2. If standing on item, equip (if gear) or use (if consumable)!
          // 3. Otherwise, attack in facing direction
          if (justA) {
            if (isPlayerOnStairs) {
              onDescendStairs();
            } else if (isPlayerOnItem) {
              onUseFloorItem?.();
            } else {
              onAttack();
            }
          }

          // B button single tap without direction: Wait / Rest 1 turn
          if (justB && !curDir) {
            onWait();
          }

          // X button: Toggle Inventory
          if (justX) {
            onOpenInventory();
          }

          // Y button: Toggle Spells & Skills
          if (justY) {
            onOpenSpells();
          }

          // + button: Save Modal
          if (justPlus) {
            onOpenSaveModal();
          }

          // - button: Help Modal
          if (justMinus) {
            onOpenHelp();
          }

          // L button: Quick Heal
          if (justL) {
            onQuickHeal();
          }

          // R button: Quick Eat
          if (justR && !curDir) {
            onQuickEat();
          }

          // ZL button: Toggle Map
          if (justZL) {
            onToggleMinimap();
          }

          // ZR button: Wait / Pass Turn
          if (justZR) {
            onWait();
          }
        }

        // Cache previous button states
        prevButtonsRef.current = b.map((btn) => btn.pressed);
      }

      animId = requestAnimationFrame(poll);
    };

    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, [
    enabled,
    isPlayerOnStairs,
    isPlayerOnItem,
    isModalOpen,
    onMove,
    onAttack,
    onWait,
    onDescendStairs,
    onUseFloorItem,
    onOpenInventory,
    onOpenSpells,
    onOpenSaveModal,
    onOpenHelp,
    onToggleMinimap,
    onQuickHeal,
    onQuickEat,
    onModalConfirm,
    onModalCancel,
    onModalNavigate,
    onModalSecondary,
  ]);

  return controllerStatus;
}
