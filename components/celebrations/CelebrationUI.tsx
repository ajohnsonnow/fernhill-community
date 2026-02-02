'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
  CelebrationConfig,
  CelebrationType,
  CELEBRATIONS,
  generateConfettiParticles,
  createFirework,
  explodeFirework,
  triggerHaptic,
  getCelebrationForAchievement,
  getCelebrationForLevelUp,
} from '@/lib/celebrations';

// ============================================
// CELEBRATION OVERLAY
// ============================================

interface CelebrationOverlayProps {
  config: CelebrationConfig;
  onComplete: () => void;
}

export function CelebrationOverlay({ config, onComplete }: CelebrationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Trigger haptic
    if (config.haptic) {
      triggerHaptic(config.haptic);
    }

    // Start animation based on type
    let startTime = Date.now();
    
    if (config.type === 'confetti') {
      animateConfetti(ctx, canvas, config, startTime, onComplete);
    } else if (config.type === 'fireworks') {
      animateFireworks(ctx, canvas, config, startTime, onComplete);
    } else if (config.type === 'sparkles') {
      animateSparkles(ctx, canvas, config, startTime, onComplete);
    } else if (config.type === 'emoji_burst') {
      animateEmojiBurst(ctx, canvas, config, startTime, onComplete);
    } else {
      // Default: fade out after duration
      setTimeout(onComplete, config.duration);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Message Overlay */}
      {config.message && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow-lg animate-bounceIn">
            {config.message}
          </h1>
          {config.subMessage && (
            <p className="mt-4 text-xl text-white/90 text-center drop-shadow animate-fadeIn animation-delay-300">
              {config.subMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// CONFETTI ANIMATION
// ============================================

function animateConfetti(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: CelebrationConfig,
  startTime: number,
  onComplete: () => void
) {
  const colors = config.colors || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const particleCount = config.intensity === 'epic' ? 200 : config.intensity === 'normal' ? 100 : 50;
  
  const particles = generateConfettiParticles(particleCount, colors);
  const gravity = 0.3;
  const friction = 0.99;

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > config.duration) {
      onComplete();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const particle of particles) {
      // Update physics
      particle.vy += gravity;
      particle.vx *= friction;
      particle.vy *= friction;
      particle.x += particle.vx / 100;
      particle.y += particle.vy / 100;
      particle.rotation += particle.rotationSpeed;

      // Convert normalized coords to pixels
      const x = particle.x * canvas.width;
      const y = particle.y * canvas.height;

      // Draw particle
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;

      if (particle.shape === 'square') {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      } else if (particle.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ribbon
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      }

      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================
// FIREWORKS ANIMATION
// ============================================

function animateFireworks(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: CelebrationConfig,
  startTime: number,
  onComplete: () => void
) {
  const colors = config.colors || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD700'];
  const fireworks: ReturnType<typeof createFirework>[] = [];
  const allParticles: ReturnType<typeof explodeFirework> = [];
  
  // Launch fireworks at intervals
  let lastLaunch = 0;
  const launchInterval = config.intensity === 'epic' ? 200 : 400;

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > config.duration && fireworks.length === 0 && allParticles.length === 0) {
      onComplete();
      return;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Launch new fireworks
    if (elapsed - lastLaunch > launchInterval && elapsed < config.duration - 500) {
      const x = 0.2 + Math.random() * 0.6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      fireworks.push(createFirework(x, color));
      lastLaunch = elapsed;
    }

    // Update fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      
      if (!fw.exploded) {
        fw.y -= 0.015;
        
        // Draw trail
        ctx.beginPath();
        ctx.arc(fw.x * canvas.width, fw.y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = fw.color;
        ctx.fill();

        // Check if should explode
        if (fw.y <= fw.targetY) {
          fw.exploded = true;
          const particles = explodeFirework(fw, config.intensity === 'epic' ? 80 : 50);
          allParticles.push(...particles);
        }
      } else {
        fireworks.splice(i, 1);
      }
    }

    // Update and draw particles
    for (let i = allParticles.length - 1; i >= 0; i--) {
      const p = allParticles[i];
      
      p.vy += 0.02; // gravity
      p.x += p.vx / 100;
      p.y += p.vy / 100;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        allParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================
// SPARKLES ANIMATION
// ============================================

function animateSparkles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: CelebrationConfig,
  startTime: number,
  onComplete: () => void
) {
  const colors = config.colors || ['#FFD700', '#FFF'];
  const sparkles: Array<{
    x: number;
    y: number;
    size: number;
    alpha: number;
    color: string;
    phase: number;
  }> = [];

  // Create sparkles
  const count = config.intensity === 'epic' ? 50 : config.intensity === 'normal' ? 30 : 15;
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 6 + 2,
      alpha: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    });
  }

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > config.duration) {
      onComplete();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const sparkle of sparkles) {
      sparkle.alpha = Math.sin((elapsed / 200) + sparkle.phase) * 0.5 + 0.5;
      
      ctx.save();
      ctx.translate(sparkle.x, sparkle.y);
      ctx.globalAlpha = sparkle.alpha;
      ctx.fillStyle = sparkle.color;

      // Draw 4-point star
      const s = sparkle.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.3, -s * 0.3);
      ctx.lineTo(s, 0);
      ctx.lineTo(s * 0.3, s * 0.3);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.3, s * 0.3);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-s * 0.3, -s * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================
// EMOJI BURST ANIMATION
// ============================================

function animateEmojiBurst(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: CelebrationConfig,
  startTime: number,
  onComplete: () => void
) {
  const emoji = config.emoji || '🎉';
  const emojis = emoji.split('');
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    emoji: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }> = [];

  const count = config.intensity === 'epic' ? 30 : config.intensity === 'normal' ? 20 : 10;
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 10,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size: 20 + Math.random() * 20,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > config.duration) {
      onComplete();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += 0.3; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================
// CELEBRATION HOOK
// ============================================

export function useCelebration() {
  const [activeCelebration, setActiveCelebration] = React.useState<CelebrationConfig | null>(null);

  const celebrate = useCallback((celebration: CelebrationConfig | string) => {
    const config = typeof celebration === 'string' 
      ? CELEBRATIONS[celebration] 
      : celebration;
    
    if (config) {
      setActiveCelebration(config);
    }
  }, []);

  const stopCelebration = useCallback(() => {
    setActiveCelebration(null);
  }, []);

  const celebrateAchievement = useCallback((rarity: string) => {
    celebrate(getCelebrationForAchievement(rarity));
  }, [celebrate]);

  const celebrateLevelUp = useCallback((level: number) => {
    celebrate(getCelebrationForLevelUp(level));
  }, [celebrate]);

  return {
    activeCelebration,
    celebrate,
    stopCelebration,
    celebrateAchievement,
    celebrateLevelUp,
  };
}

// ============================================
// CELEBRATION PROVIDER
// ============================================

interface CelebrationContextValue {
  celebrate: (celebration: CelebrationConfig | string) => void;
  celebrateAchievement: (rarity: string) => void;
  celebrateLevelUp: (level: number) => void;
}

const CelebrationContext = React.createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const { activeCelebration, celebrate, stopCelebration, celebrateAchievement, celebrateLevelUp } = useCelebration();

  return (
    <CelebrationContext.Provider value={{ celebrate, celebrateAchievement, celebrateLevelUp }}>
      {children}
      {activeCelebration && (
        <CelebrationOverlay config={activeCelebration} onComplete={stopCelebration} />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebrationContext() {
  const context = React.useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebrationContext must be used within CelebrationProvider');
  }
  return context;
}

// ============================================
// EXPORT
// ============================================

export default CelebrationOverlay;
