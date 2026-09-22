'use client';
// components/ParticleBackground.tsx
// Lightweight canvas-based floating particle system.
// Renders subtle, low-opacity particles drifting upward in cyberpunk colors.
// Performance-optimized with requestAnimationFrame and responsive to window resize.

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const COLORS = [
  'rgba(123,111,247,',  // violet
  'rgba(0,212,255,',    // cyan
  'rgba(67,233,123,',   // mint
  'rgba(167,139,250,',  // violet2
  'rgba(249,199,79,',   // gold
];

const PARTICLE_COUNT = 45;

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticle(): Particle {
      const maxLife = 300 + Math.random() * 400;
      return {
        x: Math.random() * (canvas?.width ?? window.innerWidth),
        y: Math.random() * (canvas?.height ?? window.innerHeight),
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.3,
        r: 1 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0,
        life: 0,
        maxLife,
      };
    }

    function initParticles() {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
        const p = createParticle();
        p.life = Math.random() * p.maxLife; // spread lifecycle
        return p;
      });
    }

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Fade in and out over life
        const progress = p.life / p.maxLife;
        if (progress < 0.15) {
          p.alpha = progress / 0.15;
        } else if (progress > 0.75) {
          p.alpha = (1 - progress) / 0.25;
        } else {
          p.alpha = 1;
        }

        const drawAlpha = Math.max(0, Math.min(0.35, p.alpha * 0.35));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${drawAlpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${drawAlpha * 0.3})`;
        ctx.fill();

        // Reset dead particles
        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particlesRef.current[i] = createParticle();
          particlesRef.current[i].y = canvas.height + 10;
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}
