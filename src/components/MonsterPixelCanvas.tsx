/**
 * MonsterPixelCanvas Component
 * Renders an animated retro pixel art display for monster sprites with breathing motion and shadows.
 */

import React, { useEffect, useRef } from 'react';
import { drawMonster } from '../graphics/pixelSprites';

interface Props {
  spriteKey: string;
  size?: number;
  isBoss?: boolean;
  className?: string;
}

export const MonsterPixelCanvas: React.FC<Props> = ({
  spriteKey,
  size = 64,
  isBoss = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      drawMonster(ctx, 0, 0, size, spriteKey, isBoss, false);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [spriteKey, size, isBoss]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
        }}
        className="shrink-0"
      />
    </div>
  );
};
