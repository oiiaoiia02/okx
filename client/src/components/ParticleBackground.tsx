import { useEffect, useRef } from "react";

/**
 * Quantum-style background: soft dot matrix + floating gradient orbs.
 * Much calmer and more elegant than the previous particle system.
 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    // Floating orbs (soft gradient blobs)
    const orbs: { x: number; y: number; vx: number; vy: number; r: number; color: string; phase: number }[] = [];
    const ORB_COUNT = 5;
    const orbColors = [
      "rgba(0, 230, 138, 0.04)",
      "rgba(79, 143, 255, 0.03)",
      "rgba(167, 139, 250, 0.025)",
      "rgba(0, 230, 138, 0.03)",
      "rgba(79, 143, 255, 0.025)",
    ];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
    };

    const init = () => {
      resize();
      orbs.length = 0;
      for (let i = 0; i < ORB_COUNT; i++) {
        orbs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: 200 + Math.random() * 200,
          color: orbColors[i],
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw subtle dot matrix
      const dotSpacing = 32;
      const centerX = w / 2;
      const centerY = h * 0.35;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let x = 0; x < w; x += dotSpacing) {
        for (let y = 0; y < h; y += dotSpacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const fade = Math.max(0, 1 - dist / (maxDist * 0.7));
          const alpha = fade * 0.035;

          if (alpha > 0.003) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw floating gradient orbs
      for (const orb of orbs) {
        orb.phase += 0.003;
        const breathe = 1 + Math.sin(orb.phase) * 0.1;
        const currentR = orb.r * breathe;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, currentR);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentR, 0, Math.PI * 2);
        ctx.fill();

        // Slow drift
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
