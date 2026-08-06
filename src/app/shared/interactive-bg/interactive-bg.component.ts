import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Star {
  x: number;
  y: number;
  originVx: number;
  originVy: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  isGlitter: boolean;
  color: string;
}

@Component({
  selector: 'app-interactive-bg',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="starry-sky-wrapper">
      <!-- Deep Midnight Navy Night Sky Base -->
      <div class="sky-cosmic-glow"></div>
      
      <!-- Dynamic Starfield & Constellations Canvas -->
      <canvas #bgCanvas class="star-canvas"></canvas>
      
      <!-- Starlight Spotlight behind Cursor -->
      <div
        class="starlight-cursor-glow"
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

    .starry-sky-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: #060b18;
    }

    /* Derin Lacivert Gece Gökyüzü Katmanı (Sıfır Morluk, Asil Lacivert) */
    .sky-cosmic-glow {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(ellipse at 50% 0%, #0d1b3e 0%, transparent 65%),
        radial-gradient(circle at 85% 25%, rgba(30, 58, 138, 0.45) 0%, transparent 55%),
        radial-gradient(circle at 15% 80%, rgba(15, 30, 75, 0.5) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, #081126 0%, #040813 100%);
    }

    .star-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .starlight-cursor-glow {
      position: absolute;
      top: -240px;
      left: -240px;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(245, 158, 11, 0.22) 0%,
        rgba(30, 58, 138, 0.35) 40%,
        rgba(15, 23, 42, 0.1) 65%,
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
  private stars: Star[] = [];
  private starCount = 175;
  private attractionRadius = 180;
  private maxDistance = 140;
  private isDestroyed = false;
  private tick = 0;

  // Mouse coordinates with easing
  private mouseX = -1000;
  private mouseY = -1000;
  private targetMouseX = -1000;
  private targetMouseY = -1000;

  glowX = -1000;
  glowY = -1000;
  isMouseInside = false;

  // Parlak Altın Sarısı ve Elmas Beyaz Yıldız Renkleri (Morluk yok)
  private starColors = [
    '245, 158, 11',   // Sıcak Altın
    '251, 191, 36',   // Parlak Altın Sarısı
    '253, 224, 71',   // Şampanya Işıltısı
    '255, 255, 255',   // Saf Elmas Beyazı
    '224, 242, 254'    // Buzul Yıldız Işığı
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
    this.createStars();

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

    this.starCount = Math.floor(Math.min(220, Math.max(110, (width * height) / 7500)));
    this.createStars();
  };

  private createStars() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.stars = [];

    for (let i = 0; i < this.starCount; i++) {
      const vx = (Math.random() - 0.5) * 0.45;
      const vy = (Math.random() - 0.5) * 0.45;
      const isGlitter = Math.random() > 0.85;

      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originVx: vx === 0 ? 0.25 : vx,
        originVy: vy === 0 ? 0.25 : vy,
        vx: vx,
        vy: vy,
        radius: isGlitter ? Math.random() * 1.6 + 1.8 : Math.random() * 1.5 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.4,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
        phase: Math.random() * Math.PI * 2,
        isGlitter: isGlitter,
        color: this.starColors[Math.floor(Math.random() * this.starColors.length)]
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

    this.tick += 0.02;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Smooth mouse position interpolation (lerp)
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;
    this.glowX = this.mouseX;
    this.glowY = this.mouseY;

    this.ctx.clearRect(0, 0, width, height);

    // Update positions and velocities
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];

      // Mouse attraction with gentle sling around cursor
      if (this.isMouseInside) {
        const dx = this.mouseX - s.x;
        const dy = this.mouseY - s.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.attractionRadius && dist > 1) {
          const angle = Math.atan2(dy, dx);
          const pull = ((this.attractionRadius - dist) / this.attractionRadius) * 0.18;
          
          s.vx += Math.cos(angle) * pull + (-Math.sin(angle) * 0.05);
          s.vy += Math.sin(angle) * pull + (Math.cos(angle) * 0.05);

          const speed = Math.hypot(s.vx, s.vy);
          if (speed > 2.0) {
            s.vx = (s.vx / speed) * 2.0;
            s.vy = (s.vy / speed) * 2.0;
          }

          // Golden beam from mouse to star
          if (dist < 150) {
            const beamAlpha = (1 - dist / 150) * 0.4;
            this.ctx.beginPath();
            this.ctx.moveTo(s.x, s.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.strokeStyle = `rgba(245, 158, 11, ${beamAlpha})`;
            this.ctx.lineWidth = 1.1;
            this.ctx.stroke();
          }
        } else {
          s.vx += (s.originVx - s.vx) * 0.02;
          s.vy += (s.originVy - s.vy) * 0.02;
        }
      } else {
        s.vx += (s.originVx - s.vx) * 0.02;
        s.vy += (s.originVy - s.vy) * 0.02;
      }

      // Move star
      s.x += s.vx;
      s.y += s.vy;

      // Wrap around edges
      if (s.x < -10) s.x = width + 10;
      if (s.x > width + 10) s.x = -10;
      if (s.y < -10) s.y = height + 10;
      if (s.y > height + 10) s.y = -10;
    }

    // Draw Constellation Lines (Gold & Starlight)
    for (let i = 0; i < this.stars.length; i++) {
      const s1 = this.stars[i];
      for (let j = i + 1; j < this.stars.length; j++) {
        const s2 = this.stars[j];
        const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);

        if (dist < this.maxDistance) {
          const alpha = (1 - dist / this.maxDistance) * 0.38;
          this.ctx.beginPath();
          this.ctx.moveTo(s1.x, s1.y);
          this.ctx.lineTo(s2.x, s2.y);
          this.ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
          this.ctx.lineWidth = dist < 65 ? 1.1 : 0.75;
          this.ctx.stroke();

          // Subtle constellation triangle mesh facets
          if (dist < 55 && j + 1 < this.stars.length) {
            const s3 = this.stars[j + 1];
            const dist3 = Math.hypot(s1.x - s3.x, s1.y - s3.y);
            if (dist3 < 55) {
              this.ctx.beginPath();
              this.ctx.moveTo(s1.x, s1.y);
              this.ctx.lineTo(s2.x, s2.y);
              this.ctx.lineTo(s3.x, s3.y);
              this.ctx.closePath();
              this.ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
              this.ctx.fill();
            }
          }
        }
      }
    }

    // Draw Shining Stars with Twinkle & Cross Sparkles
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const twinkle = Math.sin(this.tick * s.twinkleSpeed * 50 + s.phase);
      const alpha = Math.min(1, Math.max(0.2, s.baseAlpha + twinkle * 0.25));

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${s.color}, ${alpha})`;
      this.ctx.shadowBlur = s.isGlitter ? 12 : 7;
      this.ctx.shadowColor = `rgba(${s.color}, 0.9)`;
      this.ctx.fill();

      // For bright glitter stars, draw a 4-point starlight cross
      if (s.isGlitter && alpha > 0.6) {
        const spikeLen = s.radius * 2.8;
        this.ctx.strokeStyle = `rgba(${s.color}, ${alpha * 0.65})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(s.x - spikeLen, s.y);
        this.ctx.lineTo(s.x + spikeLen, s.y);
        this.ctx.moveTo(s.x, s.y - spikeLen);
        this.ctx.lineTo(s.x, s.y + spikeLen);
        this.ctx.stroke();
      }

      this.ctx.shadowBlur = 0; // reset shadow
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
