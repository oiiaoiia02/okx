import { useEffect, useRef } from "react";

/**
 * Cyber-Neural Particle Background v2
 * - Softer, more organic floating nodes
 * - Neural-network connections with "thinking chain" data pulses
 * - Gentle breathing gradient orbs for depth
 * - Chain-of-thought path animation (highlighted route between nodes)
 * - Very low opacity to stay behind content — Apple-level subtlety
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
  layer: number; // 0 = far, 1 = mid, 2 = near (parallax depth)
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

interface ThinkingPulse {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
  color: string;
}

const NODE_COUNT = 28;
const CONNECTION_DIST = 150;
const ORB_COUNT = 3;
const MAX_PULSES = 5;

const NODE_COLORS = [
  [0, 230, 138],   // primary green
  [79, 143, 255],   // blue
  [167, 139, 250],  // purple
];

const ORB_COLORS = [
  "rgba(0, 230, 138, 0.025)",
  "rgba(79, 143, 255, 0.018)",
  "rgba(167, 139, 250, 0.015)",
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
    const pulses: ThinkingPulse[] = [];
    let thinkingPhase = 0;
    let pulseTimer = 0;

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      resize();
      nodes.length = 0;
      orbs.length = 0;
      pulses.length = 0;

      for (let i = 0; i < NODE_COUNT; i++) {
        const colorIdx = Math.floor(Math.random() * NODE_COLORS.length);
        const layer = Math.floor(Math.random() * 3);
        const speedMul = 0.08 + layer * 0.06; // far=slow, near=faster
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speedMul,
          vy: (Math.random() - 0.5) * speedMul,
          r: 0.8 + layer * 0.5 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          color: `${NODE_COLORS[colorIdx][0]}, ${NODE_COLORS[colorIdx][1]}, ${NODE_COLORS[colorIdx][2]}`,
          alpha: 0.06 + layer * 0.04 + Math.random() * 0.06,
          layer,
        });
      }

      for (let i = 0; i < ORB_COUNT; i++) {
        orbs.push({
          x: w * (0.2 + Math.random() * 0.6),
          y: h * (0.15 + Math.random() * 0.5),
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          r: 220 + Math.random() * 280,
          color: ORB_COLORS[i],
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Spawn a thinking pulse between two connected nodes
    const spawnPulse = () => {
      if (pulses.length >= MAX_PULSES) return;
      // Find a connected pair
      for (let attempt = 0; attempt < 10; attempt++) {
        const i = Math.floor(Math.random() * nodes.length);
        const j = Math.floor(Math.random() * nodes.length);
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST * 1.2) {
          pulses.push({
            fromIdx: i,
            toIdx: j,
            progress: 0,
            speed: 0.008 + Math.random() * 0.012,
            color: nodes[i].color,
          });
          return;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      thinkingPhase += 0.006;
      pulseTimer += 1;

      // Spawn new thinking pulses periodically
      if (pulseTimer % 90 === 0) spawnPulse();

      // === Gradient Orbs (deepest layer) ===
      for (const orb of orbs) {
        orb.phase += 0.0015;
        const breathe = 1 + Math.sin(orb.phase) * 0.06;
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
            const pulse = Math.sin(thinkingPhase + i * 0.4 + j * 0.25) * 0.5 + 0.5;
            const lineAlpha = fade * 0.04 * (0.4 + pulse * 0.6);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${nodes[i].color}, ${lineAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // === Thinking Chain Pulses (data packets traveling along connections) ===
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const from = nodes[pulse.fromIdx];
        const to = nodes[pulse.toIdx];
        if (!from || !to) { pulses.splice(p, 1); continue; }

        const px = from.x + (to.x - from.x) * pulse.progress;
        const py = from.y + (to.y - from.y) * pulse.progress;
        const alpha = Math.sin(pulse.progress * Math.PI) * 0.3;

        // Glow trail
        const trailGrad = ctx.createRadialGradient(px, py, 0, px, py, 8);
        trailGrad.addColorStop(0, `rgba(${pulse.color}, ${alpha})`);
        trailGrad.addColorStop(1, "transparent");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(${pulse.color}, ${alpha * 2})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // === Nodes ===
      for (const node of nodes) {
        node.phase += 0.012;
        const breathe = 0.7 + Math.sin(node.phase) * 0.3;
        const currentAlpha = node.alpha * breathe;

        // Soft glow
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 5);
        glow.addColorStop(0, `rgba(${node.color}, ${currentAlpha * 0.25})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 5, 0, Math.PI * 2);
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
      const dotSpacing = 52;
      const cx = w / 2;
      const cy = h * 0.35;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let x = 0; x < w; x += dotSpacing) {
        for (let y = 0; y < h; y += dotSpacing) {
          const ddx = x - cx;
          const ddy = y - cy;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const fade = Math.max(0, 1 - dist / (maxDist * 0.55));
          const alpha = fade * 0.018;

          if (alpha > 0.003) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 0.5, 0, Math.PI * 2);
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
      style={{ opacity: 0.65 }}
    />
  );
}
