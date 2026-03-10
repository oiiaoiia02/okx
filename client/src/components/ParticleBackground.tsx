import { useEffect, useRef } from "react";

/**
 * Cyber-Neural Particle Background
 * - Soft floating nodes with neural-network connections
 * - Subtle pulsing "thinking chain" paths
 * - Gentle gradient orbs for depth
 * - Very low opacity to stay behind content
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  color: string;
  alpha: number;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  phase: number;
}

const NODE_COUNT = 40;
const CONNECTION_DIST = 180;
const ORB_COUNT = 4;

const NODE_COLORS = [
  [0, 230, 138],   // primary green
  [79, 143, 255],   // blue
  [167, 139, 250],  // purple
];

const ORB_COLORS = [
  "rgba(0, 230, 138, 0.035)",
  "rgba(79, 143, 255, 0.025)",
  "rgba(167, 139, 250, 0.02)",
  "rgba(0, 230, 138, 0.025)",
];

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const nodes: Node[] = [];
    const orbs: Orb[] = [];
    let thinkingPhase = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    const init = () => {
      resize();
      nodes.length = 0;
      orbs.length = 0;

      for (let i = 0; i < NODE_COUNT; i++) {
        const colorIdx = Math.floor(Math.random() * NODE_COLORS.length);
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.2 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
          color: `${NODE_COLORS[colorIdx][0]}, ${NODE_COLORS[colorIdx][1]}, ${NODE_COLORS[colorIdx][2]}`,
          alpha: 0.15 + Math.random() * 0.2,
        });
      }

      for (let i = 0; i < ORB_COUNT; i++) {
        orbs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: 200 + Math.random() * 250,
          color: ORB_COLORS[i],
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      thinkingPhase += 0.008;

      // === Gradient Orbs (deepest layer) ===
      for (const orb of orbs) {
        orb.phase += 0.002;
        const breathe = 1 + Math.sin(orb.phase) * 0.08;
        const currentR = orb.r * breathe;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, currentR);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentR, 0, Math.PI * 2);
        ctx.fill();

        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;
      }

      // === Neural connections ===
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const fade = 1 - dist / CONNECTION_DIST;
            // Thinking chain pulse along connections
            const pulse = Math.sin(thinkingPhase + i * 0.5 + j * 0.3) * 0.5 + 0.5;
            const lineAlpha = fade * 0.06 * (0.5 + pulse * 0.5);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${nodes[i].color}, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Thinking chain "data packet" traveling along connection
            if (pulse > 0.7 && fade > 0.5) {
              const t = (Math.sin(thinkingPhase * 2 + i) * 0.5 + 0.5);
              const px = nodes[i].x + (nodes[j].x - nodes[i].x) * t;
              const py = nodes[i].y + (nodes[j].y - nodes[i].y) * t;
              ctx.fillStyle = `rgba(${nodes[i].color}, ${lineAlpha * 3})`;
              ctx.beginPath();
              ctx.arc(px, py, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // === Nodes ===
      for (const node of nodes) {
        node.phase += 0.015;
        const breathe = 0.7 + Math.sin(node.phase) * 0.3;
        const currentAlpha = node.alpha * breathe;

        // Glow
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 4);
        glow.addColorStop(0, `rgba(${node.color}, ${currentAlpha * 0.3})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(${node.color}, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();

        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Soft bounce
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));
      }

      // === Subtle dot grid (very faint) ===
      const dotSpacing = 48;
      const cx = w / 2;
      const cy = h * 0.35;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let x = 0; x < w; x += dotSpacing) {
        for (let y = 0; y < h; y += dotSpacing) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const fade = Math.max(0, 1 - dist / (maxDist * 0.6));
          const alpha = fade * 0.025;

          if (alpha > 0.003) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", () => { resize(); });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.85 }}
    />
  );
}
