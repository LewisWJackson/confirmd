
import React, { useEffect, useRef } from 'react';

export const GridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const spacing = 32;
    const dotRadius = 1;
    const proximity = 300;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          
          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const intensity = Math.max(0, 1 - dist / proximity);
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius + (intensity * 2), 0, Math.PI * 2);
          
          // Light mode optimized colors
          const alpha = 0.08 + (intensity * 0.6);
          const r = Math.floor(220 - (intensity * 180));
          const g = Math.floor(220 - (intensity * 40));
          const b = Math.floor(220 + (intensity * 35));
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();

          if (intensity > 0.3) {
            ctx.shadowBlur = intensity * 10;
            ctx.shadowColor = `rgba(6, 182, 212, ${intensity * 0.3})`;
          } else {
            ctx.shadowBlur = 0;
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
    />
  );
};
