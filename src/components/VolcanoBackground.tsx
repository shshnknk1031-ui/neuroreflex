/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { GameState } from '../types/game';

interface VolcanoBackgroundProps {
  gameState: GameState;
  combo?: number;
}

interface Ember {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  flickerSpeed: number;
  swaySpeed: number;
  swayOffset: number;
  swayAmplitude: number;
  heat: number; // 0 (cool red) to 1 (white hot)
}

interface SmokePuff {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  growth: number;
}

interface LavaFissure {
  points: { x: number; y: number }[];
  width: number;
  pulsePhase: number;
}

export const VolcanoBackground: React.FC<VolcanoBackgroundProps> = ({ gameState, combo = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Embers
    const emberCount = 140;
    const embers: Ember[] = [];

    // Smoke plumes
    const smokePuffs: SmokePuff[] = [];
    const maxSmoke = 25;

    // Lava fissures (generated on resize)
    let fissures: LavaFissure[] = [];

    // Volcanic Lightning / Flash state
    let lightningIntensity = 0;
    let nextLightningTime = performance.now() + 8000 + Math.random() * 12000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);

      // Generate volcanic fissures along bottom and lower sides
      fissures = [];
      const fissureCount = 7;
      for (let i = 0; i < fissureCount; i++) {
        const startX = (width * (i + 0.5)) / fissureCount + (Math.random() - 0.5) * (width * 0.1);
        const startY = height + 10;
        const pts = [{ x: startX, y: startY }];

        let curX = startX;
        let curY = startY;
        const segments = 5 + Math.floor(Math.random() * 4);

        for (let s = 0; s < segments; s++) {
          curX += (Math.random() - 0.5) * 60;
          curY -= 20 + Math.random() * 35;
          pts.push({ x: curX, y: curY });
        }

        fissures.push({
          points: pts,
          width: 3 + Math.random() * 4,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Color palette for embers: white hot, orange, crimson, dark red
    const emberColors = [
      '#ffffff', // White hot
      '#ffe082', // Incandescent gold
      '#ff9100', // Fiery orange
      '#ff3d00', // Molten lava red
      '#d50000', // Deep crimson
      '#b71c1c', // Burning ember core
    ];

    const createEmber = (initialSpawn: boolean = false): Ember => {
      const heat = Math.random();
      const color =
        heat > 0.85
          ? emberColors[0]
          : heat > 0.65
            ? emberColors[1]
            : heat > 0.4
              ? emberColors[2]
              : heat > 0.15
                ? emberColors[3]
                : emberColors[4];

      const size = 1.2 + Math.random() * 3.2 * (heat > 0.7 ? 1.4 : 1);
      return {
        x: Math.random() * (width || 1200),
        y: initialSpawn ? Math.random() * (height || 800) : height + 10 + Math.random() * 30,
        size,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.8 + Math.random() * 2.2 + heat * 1.2),
        alpha: 0.3 + Math.random() * 0.7,
        baseAlpha: 0.4 + Math.random() * 0.6,
        color,
        flickerSpeed: 0.03 + Math.random() * 0.08,
        swaySpeed: 0.002 + Math.random() * 0.004,
        swayOffset: Math.random() * Math.PI * 2,
        swayAmplitude: 0.8 + Math.random() * 1.8,
        heat,
      };
    };

    // Pre-populate embers
    for (let i = 0; i < emberCount; i++) {
      embers.push(createEmber(true));
    }

    // Mountain silhouettes points
    const drawVolcanoSilhouette = (now: number) => {
      // Deep mountain silhouettes
      ctx.save();

      // Back mountain range (highest, distant, smoking calderas)
      ctx.beginPath();
      ctx.moveTo(0, height * 0.78);
      ctx.lineTo(width * 0.12, height * 0.62);
      ctx.lineTo(width * 0.22, height * 0.67);
      // Volcano crater peak 1 (left)
      ctx.lineTo(width * 0.34, height * 0.50); // Crater rim left
      ctx.lineTo(width * 0.38, height * 0.52); // Crater dip
      ctx.lineTo(width * 0.42, height * 0.49); // Crater rim right
      ctx.lineTo(width * 0.58, height * 0.68);
      // Main central colossal volcano crater
      ctx.lineTo(width * 0.68, height * 0.44); // Rim left
      ctx.lineTo(width * 0.74, height * 0.47); // Inner caldera
      ctx.lineTo(width * 0.80, height * 0.43); // Rim right
      ctx.lineTo(width * 0.92, height * 0.60);
      ctx.lineTo(width, height * 0.56);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      ctx.fillStyle = '#140505';
      ctx.fill();

      // Glowing molten crest on crater rims
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Inner caldera lava glow (left peak)
      const craterLeftGlow = ctx.createRadialGradient(
        width * 0.38,
        height * 0.51,
        2,
        width * 0.38,
        height * 0.51,
        80
      );
      const pulse1 = (Math.sin(now * 0.003) + 1) * 0.5;
      craterLeftGlow.addColorStop(0, `rgba(255, 140, 0, ${0.45 + pulse1 * 0.35})`);
      craterLeftGlow.addColorStop(0.4, `rgba(255, 50, 0, ${0.25 + pulse1 * 0.2})`);
      craterLeftGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = craterLeftGlow;
      ctx.fillRect(width * 0.25, height * 0.40, width * 0.25, height * 0.25);

      // Inner caldera lava glow (main colossal crater)
      const pulse2 = (Math.sin(now * 0.0022 + 1.5) + 1) * 0.5;
      const craterMainGlow = ctx.createRadialGradient(
        width * 0.74,
        height * 0.46,
        4,
        width * 0.74,
        height * 0.46,
        140
      );
      craterMainGlow.addColorStop(0, `rgba(255, 200, 100, ${0.6 + pulse2 * 0.35})`);
      craterMainGlow.addColorStop(0.3, `rgba(255, 80, 0, ${0.45 + pulse2 * 0.3})`);
      craterMainGlow.addColorStop(0.7, `rgba(180, 20, 0, ${0.2 + pulse2 * 0.2})`);
      craterMainGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = craterMainGlow;
      ctx.fillRect(width * 0.58, height * 0.30, width * 0.35, height * 0.35);

      // Lava fall trickling down main volcano face
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width * 0.73, height * 0.47);
      ctx.quadraticCurveTo(width * 0.72, height * 0.58, width * 0.74, height * 0.70);
      ctx.quadraticCurveTo(width * 0.76, height * 0.78, width * 0.73, height * 0.88);
      ctx.strokeStyle = `rgba(255, 110, 0, ${0.6 + pulse2 * 0.3})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Branching trickle
      ctx.beginPath();
      ctx.moveTo(width * 0.73, height * 0.58);
      ctx.quadraticCurveTo(width * 0.70, height * 0.65, width * 0.68, height * 0.74);
      ctx.strokeStyle = `rgba(255, 60, 0, ${0.45 + pulse2 * 0.25})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Forefront jagged basalt cliffs (darker, sharp silhouette)
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.lineTo(width * 0.15, height * 0.81);
      ctx.lineTo(width * 0.26, height * 0.85);
      ctx.lineTo(width * 0.42, height * 0.80);
      ctx.lineTo(width * 0.55, height * 0.87);
      ctx.lineTo(width * 0.72, height * 0.83);
      ctx.lineTo(width * 0.88, height * 0.88);
      ctx.lineTo(width, height * 0.82);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      ctx.fillStyle = '#0a0303';
      ctx.fill();

      // Basalt edges rim light
      ctx.strokeStyle = 'rgba(255, 50, 0, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    };

    // Smoke plume generator from craters
    const updateAndDrawSmoke = (now: number) => {
      // Periodically spawn smoke puff from the two main craters
      if (smokePuffs.length < maxSmoke && Math.random() < 0.25) {
        const isMain = Math.random() > 0.4;
        const originX = isMain ? width * 0.74 + (Math.random() - 0.5) * 20 : width * 0.38 + (Math.random() - 0.5) * 15;
        const originY = isMain ? height * 0.46 : height * 0.51;

        smokePuffs.push({
          x: originX,
          y: originY,
          radius: 12 + Math.random() * 16,
          alpha: 0.35 + Math.random() * 0.25,
          vx: (Math.random() - 0.3) * 0.7,
          vy: -(0.5 + Math.random() * 1.0),
          growth: 0.18 + Math.random() * 0.25,
        });
      }

      ctx.save();
      for (let i = smokePuffs.length - 1; i >= 0; i--) {
        const p = smokePuffs[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        p.alpha -= 0.0018;

        if (p.alpha <= 0 || p.y < -p.radius) {
          smokePuffs.splice(i, 1);
          continue;
        }

        const smokeGrad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
        // Smoke illuminated by hot magma below
        const heatTint = Math.max(0, 1 - (height * 0.5 - p.y) / (height * 0.5));
        smokeGrad.addColorStop(
          0,
          `rgba(${Math.round(60 + heatTint * 100)}, ${Math.round(20 + heatTint * 40)}, ${Math.round(15 + heatTint * 10)}, ${p.alpha * 0.7})`
        );
        smokeGrad.addColorStop(1, 'rgba(15, 5, 5, 0)');

        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // Draw Molten Lava Fissures at the bottom
    const drawLavaFissures = (now: number, tensionMultiplier: number) => {
      ctx.save();
      for (const fissure of fissures) {
        const pulse = (Math.sin(now * 0.004 * tensionMultiplier + fissure.pulsePhase) + 1) * 0.5;
        const baseWidth = fissure.width * (1 + pulse * 0.4);

        // Deep glowing bed
        ctx.beginPath();
        ctx.moveTo(fissure.points[0].x, fissure.points[0].y);
        for (let i = 1; i < fissure.points.length; i++) {
          ctx.lineTo(fissure.points[i].x, fissure.points[i].y);
        }
        ctx.strokeStyle = `rgba(255, 40, 0, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = baseWidth * 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Molten orange core
        ctx.strokeStyle = `rgba(255, 140, 0, ${0.7 + pulse * 0.3})`;
        ctx.lineWidth = baseWidth * 1.8;
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Incandescent white-hot center vein
        ctx.strokeStyle = `rgba(255, 245, 200, ${0.6 + pulse * 0.4})`;
        ctx.lineWidth = Math.max(1, baseWidth * 0.6);
        ctx.shadowBlur = 4;
        ctx.stroke();
      }
      ctx.restore();
    };

    // Main animation loop
    const render = (now: number) => {
      // Tension pulse calculation (heartbeat of the volcano)
      // Base heartbeat at ~75 BPM (frequency ~1.25 Hz = 0.0078 rad/ms)
      const comboBoost = Math.min(combo * 0.06, 0.8);
      const isHighTension = gameState === 'PLAYING' || gameState === 'COUNTDOWN';
      const tensionRate = isHighTension ? 0.007 + comboBoost * 0.005 : 0.0045;
      const tensionMultiplier = isHighTension ? 1.3 + comboBoost : 1.0;

      // Double-thump heartbeat curve
      const phase = (now * tensionRate) % (Math.PI * 2);
      const beat1 = Math.pow(Math.max(0, Math.sin(phase)), 8);
      const beat2 = Math.pow(Math.max(0, Math.sin(phase - 0.45)), 8) * 0.7;
      const heartbeat = Math.min(1, beat1 + beat2);

      // Random Volcanic Lightning / Flash
      if (now > nextLightningTime) {
        lightningIntensity = 0.85 + Math.random() * 0.15;
        nextLightningTime = now + 9000 + Math.random() * 16000;
      }
      if (lightningIntensity > 0) {
        lightningIntensity -= 0.035;
        if (lightningIntensity < 0) lightningIntensity = 0;
      }

      // 1. Volcanic Night Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      // Top: deep smoky ash black with ominous crimson tint
      skyGrad.addColorStop(0, '#060202');
      skyGrad.addColorStop(0.35, '#180404');
      // Mid: dense volcanic ember atmosphere
      skyGrad.addColorStop(0.65, '#3b0a06');
      // Horizon: violent glowing magma sea
      skyGrad.addColorStop(0.9, '#801406');
      skyGrad.addColorStop(1, '#ff3700');

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Volcanic Flash / Lightning across the ash clouds
      if (lightningIntensity > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 120, 80, ${lightningIntensity * 0.35})`;
        ctx.fillRect(0, 0, width, height);

        // Bright volcanic lightning fork silhouette in background
        ctx.beginPath();
        let lx = width * 0.74 + (Math.random() - 0.5) * 40;
        let ly = height * 0.45;
        ctx.moveTo(lx, ly);
        for (let s = 0; s < 6; s++) {
          lx += (Math.random() - 0.5) * 70;
          ly -= 25 + Math.random() * 35;
          ctx.lineTo(lx, ly);
        }
        ctx.strokeStyle = `rgba(255, 230, 200, ${lightningIntensity * 0.8})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Ambient Volcanic Smoke / Atmospheric Plumes
      updateAndDrawSmoke(now);

      // 4. Volcanic Mountain Silhouettes & Cascading Lava Falls
      drawVolcanoSilhouette(now);

      // 5. Pulsing Magma Sea at the bottom
      const magmaSurgeGrad = ctx.createLinearGradient(0, height * 0.88, 0, height);
      const magmaPulseAlpha = 0.65 + heartbeat * 0.35 * tensionMultiplier;
      magmaSurgeGrad.addColorStop(0, `rgba(255, 40, 0, ${magmaPulseAlpha * 0.3})`);
      magmaSurgeGrad.addColorStop(0.5, `rgba(255, 100, 0, ${magmaPulseAlpha * 0.6})`);
      magmaSurgeGrad.addColorStop(0.85, `rgba(255, 180, 20, ${magmaPulseAlpha * 0.85})`);
      magmaSurgeGrad.addColorStop(1, `rgba(255, 235, 120, ${magmaPulseAlpha * 0.95})`);

      ctx.fillStyle = magmaSurgeGrad;
      ctx.fillRect(0, height * 0.88, width, height * 0.12);

      // 6. Glowing Lava Fissures
      drawLavaFissures(now, tensionMultiplier);

      // 7. Dynamic Ash, Embers & Fire Sparks System
      ctx.save();
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];

        // Horizontal turbulence & swaying
        const sway = Math.sin(now * e.swaySpeed + e.swayOffset) * e.swayAmplitude;
        e.x += e.vx + sway;
        // Vertical speed increases with heat & tension
        const currentVy = e.vy * (1 + heartbeat * 0.35 * tensionMultiplier);
        e.y += currentVy;

        // Flicker effect
        const flicker = Math.sin(now * e.flickerSpeed + e.swayOffset);
        const currentAlpha = Math.max(0.1, Math.min(1, e.baseAlpha + flicker * 0.3));

        // Draw Ember
        ctx.fillStyle = e.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (1 + (heartbeat * 0.3) * (e.heat > 0.6 ? 1 : 0)), 0, Math.PI * 2);
        ctx.fill();

        // Extra hot aura for incandescent embers
        if (e.heat > 0.7) {
          ctx.globalAlpha = currentAlpha * 0.4;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Respawn when off screen
        if (e.y < -15 || e.x < -20 || e.x > width + 20) {
          embers[i] = createEmber(false);
        }
      }
      ctx.restore();

      // 8. Tense Vignette & Edge Thermal Pulse (既緊張又刺激)
      ctx.save();
      // Outer border thermal glow
      const edgeGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.45,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.78
      );
      const borderHeat = 0.35 + heartbeat * 0.3 * tensionMultiplier;
      edgeGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      edgeGlow.addColorStop(0.75, `rgba(45, 8, 4, ${borderHeat * 0.5})`);
      edgeGlow.addColorStop(1, `rgba(255, 30, 0, ${borderHeat * 0.45})`);
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(0, 0, width, height);

      // Bottom hot glow bloom
      const bottomBloom = ctx.createRadialGradient(
        width / 2,
        height + 40,
        10,
        width / 2,
        height + 40,
        height * 0.65
      );
      bottomBloom.addColorStop(0, `rgba(255, 100, 0, ${0.4 + heartbeat * 0.3})`);
      bottomBloom.addColorStop(0.5, `rgba(200, 20, 0, ${0.2 + heartbeat * 0.2})`);
      bottomBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bottomBloom;
      ctx.fillRect(0, height * 0.35, width, height * 0.65);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [gameState, combo]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 block"
      style={{ willChange: 'transform' }}
    />
  );
};

