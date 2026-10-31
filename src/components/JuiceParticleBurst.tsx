import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ParticleBurstRef {
  triggerBurst: (x: number, y: number, colorPreset?: 'gold' | 'emerald' | 'amber' | 'rainbow') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape: 'star' | 'circle' | 'ring' | 'diamond';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  life: number;
  maxLife: number;
  scale: number;
  color: string;
}

export const JuiceParticleBurst = forwardRef<ParticleBurstRef, { className?: string }>(
  ({ className = 'fixed inset-0 pointer-events-none z-[100]' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    const animFrameRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      triggerBurst: (x: number, y: number, colorPreset = 'gold') => {
        spawnBurst(x, y, colorPreset);
      },
    }));

    const spawnBurst = (
      originX: number,
      originY: number,
      preset: 'gold' | 'emerald' | 'amber' | 'rainbow' = 'gold'
    ) => {
      const particleCount = 45;
      const newParticles: Particle[] = [];

      const palettes = {
        gold: {
          colors: ['#fef08a', '#facc15', '#f59e0b', '#fbbf24', '#ffffff'],
          glow: 'rgba(251, 191, 36, 0.8)',
        },
        emerald: {
          colors: ['#a7f3d0', '#34d399', '#10b981', '#059669', '#ffffff'],
          glow: 'rgba(16, 185, 129, 0.8)',
        },
        amber: {
          colors: ['#fed7aa', '#fb923c', '#f97316', '#ea580c', '#ffffff'],
          glow: 'rgba(249, 115, 22, 0.8)',
        },
        rainbow: {
          colors: ['#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#34d399', '#ffffff'],
          glow: 'rgba(250, 204, 21, 0.9)',
        },
      }[preset];

      const shapes: ('star' | 'circle' | 'ring' | 'diamond')[] = ['star', 'circle', 'ring', 'diamond'];

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 12;
        const color = palettes.colors[Math.floor(Math.random() * palettes.colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const maxLife = 40 + Math.random() * 35;

        newParticles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (2 + Math.random() * 4), // Initial upward pop
          size: 4 + Math.random() * 8,
          color,
          glowColor: palettes.glow,
          alpha: 1,
          life: maxLife,
          maxLife,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          shape,
        });
      }

      particlesRef.current.push(...newParticles);

      // Add juicy floating text at origin
      floatingTextsRef.current.push({
        x: originX,
        y: originY - 10,
        text: preset === 'emerald' ? '✓ SKOR BONUS!' : '★ BONUS CLEARED!',
        alpha: 1,
        life: 50,
        maxLife: 50,
        scale: 1,
        color: preset === 'emerald' ? '#34d399' : '#facc15',
      });
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
      };

      const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update & Render Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.life--;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          p.vx *= 0.96; // Air drag
          p.vy *= 0.96;
          p.vy += 0.28; // Gravity
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.vRot;
          p.alpha = Math.max(0, p.life / p.maxLife);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;

          ctx.shadowBlur = 10;
          ctx.shadowColor = p.glowColor;
          ctx.fillStyle = p.color;
          ctx.strokeStyle = p.color;

          if (p.shape === 'star') {
            drawStar(0, 0, 5, p.size, p.size * 0.45);
            ctx.fill();
          } else if (p.shape === 'ring') {
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
            ctx.stroke();
          } else if (p.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.7, 0);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size * 0.7, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // Update & Render Floating Score Texts
        for (let j = floatingTextsRef.current.length - 1; j >= 0; j--) {
          const ft = floatingTextsRef.current[j];
          ft.life--;

          if (ft.life <= 0) {
            floatingTextsRef.current.splice(j, 1);
            continue;
          }

          ft.y -= 1.2; // Float upward
          ft.alpha = Math.max(0, ft.life / ft.maxLife);
          ft.scale = 1 + (1 - ft.life / ft.maxLife) * 0.35;

          ctx.save();
          ctx.translate(ft.x, ft.y);
          ctx.scale(ft.scale, ft.scale);
          ctx.globalAlpha = ft.alpha;
          ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = ft.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = ft.color;
          ctx.fillText(ft.text, 0, 0);
          ctx.restore();
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      loop();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, []);

    return <canvas ref={canvasRef} className={className} />;
  }
);
