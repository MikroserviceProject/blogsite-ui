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
        rgba(99, 102, 241, 0.22) 0%,
        rgba(139, 92, 246, 0.16) 35%,
        rgba(56, 189, 248, 0.08) 65%,
        transparent 75%
      );
      filter: blur(40px);
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
  private particleCount = 75;
  private attractionRadius = 260;
  private maxDistance = 110;
  private isDestroyed = false;

  // Mouse coordinates with easing
  private mouseX = -1000;
  private mouseY = -1000;
  private targetMouseX = -1000;
  private targetMouseY = -1000;

  glowX = -1000;
  glowY = -1000;
  isMouseInside = false;

  private colors = [
    'rgba(99, 102, 241, ',  // Indigo
    'rgba(139, 92, 246, ', // Purple
    'rgba(56, 189, 248, ',  // Sky Blue
    'rgba(236, 72, 153, '   // Pink
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

    // Dynamic particle count based on screen width
    this.particleCount = Math.floor(Math.min(90, Math.max(40, (width * height) / 16000)));
    this.createParticles();
  };

  private createParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      const vx = (Math.random() - 0.5) * 0.8;
      const vy = (Math.random() - 0.5) * 0.8;
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originVx: vx,
        originVy: vy,
        vx: vx,
        vy: vy,
        radius: Math.random() * 2 + 1.5,
        baseAlpha: Math.random() * 0.4 + 0.4,
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

      // Mouse Attraction (Magnetic pull towards mouse)
      if (this.isMouseInside) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.attractionRadius && dist > 1) {
          // Stronger pull when further out, cushioning when close
          const force = ((this.attractionRadius - dist) / this.attractionRadius) * 0.6;
          const angle = Math.atan2(dy, dx);
          
          if (dist > 35) {
            // Pull towards mouse
            p.vx += Math.cos(angle) * force * 0.4;
            p.vy += Math.sin(angle) * force * 0.4;
          } else {
            // Gentle swirl/orbit around cursor when very close
            p.vx += -Math.sin(angle) * 0.3;
            p.vy += Math.cos(angle) * 0.3;
          }

          // Damping to prevent chaos
          p.vx *= 0.94;
          p.vy *= 0.94;

          // Connect attracted particle to mouse with glowing beam
          const lineAlpha = (1 - dist / this.attractionRadius) * 0.35;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(this.mouseX, this.mouseY);
          this.ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
          this.ctx.lineWidth = 1.2;
          this.ctx.stroke();
        } else {
          // Return smoothly to natural drift velocity
          p.vx += (p.originVx - p.vx) * 0.02;
          p.vy += (p.originVy - p.vy) * 0.02;
        }
      } else {
        p.vx += (p.originVx - p.vx) * 0.02;
        p.vy += (p.originVy - p.vy) * 0.02;
      }

      // Move particle
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges gracefully
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      // Draw particle dot with soft outer glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${p.baseAlpha})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color + '0.8)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset

      // Draw connection lines between nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

        if (dist < this.maxDistance) {
          const alpha = (1 - dist / this.maxDistance) * 0.22;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
