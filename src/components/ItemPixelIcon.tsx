/**
 * ItemPixelIcon Component
 * Renders a crisp retro pixel art canvas icon for any item or item key.
 */

import React, { useEffect, useRef } from 'react';
import { Item } from '../types/game';
import { renderItemToCanvas } from '../graphics/pixelSprites';

interface Props {
  item: Item | string;
  size?: number;
  className?: string;
  fallbackIcon?: string;
}

export const ItemPixelIcon: React.FC<Props> = ({ item, size = 22, className = '', fallbackIcon }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderItemToCanvas(canvasRef.current, item, size);
    }
  }, [item, size]);

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
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
    </span>
  );
};
