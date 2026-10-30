import React, { useEffect, useRef } from 'react';
import { LevelBlueprint } from '../game/types';

interface LevelThumbnailCanvasProps {
  blueprint: LevelBlueprint;
  isUnlocked: boolean;
  biomeTheme?: 'amber' | 'emerald';
  className?: string;
}

export const LevelThumbnailCanvas: React.FC<LevelThumbnailCanvasProps> = ({
  blueprint,
  isUnlocked,
  biomeTheme = 'amber',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = isUnlocked ? '#020617' : '#090d16';
    ctx.fillRect(0, 0, width, height);

    if (!isUnlocked) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const maxW = blueprint.lengthUnits || 180;
    const maxH = 14;

    // Draw grid center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();

    // Draw blocks using canvas drawing logic
    blueprint.blocks.forEach((b) => {
      const bx = (b.x / maxW) * width;
      const by = height - ((b.y + b.h + 1) / maxH) * height;
      const bw = Math.max(2, (b.w / maxW) * width);
      const bh = Math.max(2, (b.h / maxH) * (height * 0.82));

      ctx.fillStyle = b.isBouncy
        ? '#38bdf8'
        : biomeTheme === 'emerald'
        ? '#22c55e'
        : '#ef4444';
      ctx.fillRect(bx, by, bw, bh);
    });

    // Draw rings as golden dots
    blueprint.rings.forEach((r) => {
      const rx = (r.x / maxW) * width;
      const ry = height - ((r.y + 1) / maxH) * height;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [blueprint, isUnlocked, biomeTheme]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={36}
      className={`rounded-xl ${className}`}
    />
  );
};
