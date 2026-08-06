import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  originVx: number;
  originVy: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
}

@Component({
  selector: 'app-interactive-bg',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="interactive-bg-wrapper">
      <canvas #bgCanvas class="interactive-canvas"></canvas>
      <div
        class="cursor-glow-spotlight"
        [style.transform]="'translate3d(' + glowX + 'px, ' + glowY + 'px, 0)'"
        [style.opacity]="isMouseInside ? 1 : 0"
      ></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .interactive-bg-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .interactive-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .cursor-glow-spotlight {
      position: absolute;
      top: -200px;
      left: -200px;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(245, 158, 11, 0.20) 0%,
        rgba(251, 191, 36, 0.12) 35%,
        rgba(217, 119, 6, 0.05) 65%,
        transparent 75%
      );
      filter: blur(42px);
      transition: opacity 0.4s ease;
      will-change: transform;
      pointer-events: none;
    }
  `]
})
export class InteractiveBgComponent implements OnInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private particles: Particle[] = [];
  private particleCount = 150;
  private attractionRadius = 160;
  private maxDistance = 95;
  private isDestroyed = false;

  // Mouse coordinates with smooth easing
  private mouseX = -1000;
  private mouseY = -1000;
  private targetMouseX = -1000;
  private targetMouseY = -1000;

  glowX = -1000;
  glowY = -1000;
  isMouseInside = false;

  // Rich Gold & Amber Star Palette
  private colors = [
    'rgba(245, 158, 11, ',  // Amber Gold
    'rgba(251, 191, 36, ',  // Warm Light Gold
    'rgba(217, 119, 6, ',   // Deep Rich Gold
    'rgba(234, 179, 8, ',   // Sun Yellow Gold
    'rgba(253, 224, 71, '   // Bright Champagne Sparkle
  ];

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.initCanvas();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.removeEventListeners();
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    this.ctx = context;

    this.resizeCanvas();
    this.createParticles();

    // Run animation outside Angular zone for optimal 60/120 FPS performance
    this.ngZone.runOutsideAngular(() => {
      this.addEventListeners();
      this.animate();
    });
  }

  private resizeCanvas = () => {
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    // Dynamic particle count: plenty of golden stars across the whole viewport
    this.particleCount = Math.floor(Math.min(180, Math.max(90, (width * height) / 9000)));
    this.createParticles();
  };

  private createParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      const vx = (Math.random() - 0.5) * 0.7;
      const vy = (Math.random() - 0.5) * 0.7;
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originVx: vx === 0 ? 0.3 : vx,
        originVy: vy === 0 ? 0.3 : vy,
        vx: vx,
        vy: vy,
        radius: Math.random() * 2 + 1.2,
        baseAlpha: Math.random() * 0.45 + 0.45,
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      });
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    this.targetMouseX = e.clientX;
    this.targetMouseY = e.clientY;
    this.isMouseInside = true;
  };

  private onMouseLeave = () => {
    this.isMouseInside = false;
  };

  private onMouseEnter = () => {
    this.isMouseInside = true;
  };

  private addEventListeners() {
    window.addEventListener('resize', this.resizeCanvas, { passive: true });
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    document.addEventListener('mouseleave', this.onMouseLeave, { passive: true });
    document.addEventListener('mouseenter', this.onMouseEnter, { passive: true });
  }

  private removeEventListeners() {
    window.removeEventListener('resize', this.resizeCanvas);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseleave', this.onMouseLeave);
    document.removeEventListener('mouseenter', this.onMouseEnter);
  }

  private animate = () => {
    if (this.isDestroyed) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Smooth mouse position interpolation (lerp)
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;
    this.glowX = this.mouseX;
    this.glowY = this.mouseY;

    this.ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Localized subtle magnetic curve (only affects nearby particles without trapping them)
      if (this.isMouseInside) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.attractionRadius && dist > 1) {
          const angle = Math.atan2(dy, dx);
          // Gentle pull + orbital slingshot curve so particles glide around mouse and continue their journey
          const pull = ((this.attractionRadius - dist) / this.attractionRadius) * 0.18;
          
          p.vx += Math.cos(angle) * pull + (-Math.sin(angle) * 0.06);
          p.vy += Math.sin(angle) * pull + (Math.cos(angle) * 0.06);

          // Velocity capping to keep motion elegant & gentle
          const speed = Math.hypot(p.vx, p.vy);
          if (speed > 2.2) {
            p.vx = (p.vx / speed) * 2.2;
            p.vy = (p.vy / speed) * 2.2;
          }

          // Golden beam to mouse when nearby
          if (dist < 120) {
            const beamAlpha = (1 - dist / 120) * 0.35;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.strokeStyle = `rgba(245, 158, 11, ${beamAlpha})`;
            this.ctx.lineWidth = 1.0;
            this.ctx.stroke();
          }
        } else {
          // Smooth return to natural cruise velocity
          p.vx += (p.originVx - p.vx) * 0.03;
          p.vy += (p.originVy - p.vy) * 0.03;
        }
      } else {
        p.vx += (p.originVx - p.vx) * 0.03;
        p.vy += (p.originVy - p.vy) * 0.03;
      }

      // Move particle
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen boundaries seamlessly
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      // Draw golden star dot with radiant glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${p.baseAlpha})`;
      this.ctx.shadowBlur = 9;
      this.ctx.shadowColor = 'rgba(245, 158, 11, 0.85)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset

      // Draw subtle golden constellation lines between nearby stars
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

        if (dist < this.maxDistance) {
          const alpha = (1 - dist / this.maxDistance) * 0.24;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
          this.ctx.lineWidth = 0.75;
          this.ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
