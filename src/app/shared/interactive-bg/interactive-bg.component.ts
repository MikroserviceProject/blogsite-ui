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
      <!-- Textured Grid Layer -->
      <div class="bg-texture-grid"></div>
      
      <!-- Interactive Dynamic Canvas -->
      <canvas #bgCanvas class="interactive-canvas"></canvas>
      
      <!-- Ambient Cursor Golden Halo -->
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
      background: 
        radial-gradient(ellipse at 50% 0%, rgba(254, 243, 199, 0.35) 0%, transparent 60%),
        radial-gradient(ellipse at 100% 100%, rgba(224, 231, 255, 0.4) 0%, transparent 60%),
        #f8fafc;
    }

    /* Dokulu Nokta & Izgara Matrisi */
    .bg-texture-grid {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(rgba(148, 163, 184, 0.28) 1.2px, transparent 1.2px),
        radial-gradient(rgba(245, 158, 11, 0.12) 1.5px, transparent 1.5px);
      background-size: 28px 28px, 84px 84px;
      background-position: 0 0, 14px 14px;
      opacity: 0.85;
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
      top: -240px;
      left: -240px;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(245, 158, 11, 0.24) 0%,
        rgba(251, 191, 36, 0.15) 30%,
        rgba(217, 119, 6, 0.06) 60%,
        transparent 75%
      );
      filter: blur(48px);
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
  private particleCount = 160;
  private attractionRadius = 180;
  private maxDistance = 145; // Geniş bağlantı menzili (daha çok ağ / constellation)
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

    // Dynamic particle count: plenty of golden stars for deep connection mesh
    this.particleCount = Math.floor(Math.min(190, Math.max(100, (width * height) / 8000)));
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
        originVx: vx === 0 ? 0.35 : vx,
        originVy: vy === 0 ? 0.35 : vy,
        vx: vx,
        vy: vy,
        radius: Math.random() * 2.2 + 1.4,
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

    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Localized subtle magnetic curve
      if (this.isMouseInside) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.attractionRadius && dist > 1) {
          const angle = Math.atan2(dy, dx);
          // Gentle pull + orbital slingshot curve so particles glide around mouse without piling up
          const pull = ((this.attractionRadius - dist) / this.attractionRadius) * 0.18;
          
          p.vx += Math.cos(angle) * pull + (-Math.sin(angle) * 0.06);
          p.vy += Math.sin(angle) * pull + (Math.cos(angle) * 0.06);

          // Velocity capping
          const speed = Math.hypot(p.vx, p.vy);
          if (speed > 2.2) {
            p.vx = (p.vx / speed) * 2.2;
            p.vy = (p.vy / speed) * 2.2;
          }

          // Golden laser beam connection to mouse
          if (dist < 150) {
            const beamAlpha = (1 - dist / 150) * 0.45;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.strokeStyle = `rgba(245, 158, 11, ${beamAlpha})`;
            this.ctx.lineWidth = 1.2;
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
    }

    // Draw rich constellation connection network between particles
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (dist < this.maxDistance) {
          const alpha = (1 - dist / this.maxDistance) * 0.35;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
          this.ctx.lineWidth = dist < 70 ? 1.1 : 0.8;
          this.ctx.stroke();

          // Subtle glowing triangular mesh fill for tightly clustered triplets
          if (dist < 60 && j + 1 < this.particles.length) {
            const p3 = this.particles[j + 1];
            const dist3 = Math.hypot(p1.x - p3.x, p1.y - p3.y);
            if (dist3 < 60) {
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x, p1.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.lineTo(p3.x, p3.y);
              this.ctx.closePath();
              this.ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
              this.ctx.fill();
            }
          }
        }
      }
    }

    // Draw glowing golden particles and hubs
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${p.baseAlpha})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
