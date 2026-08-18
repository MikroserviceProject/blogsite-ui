import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'AuthFrontend';
  authService = inject(AuthService);

  // 0: Normal, 1: Peri Tozu (Çapraz Pembe), 2: Peri Dünyası (Orman)
  fairyModeState = 0; // 0: Kapalı, 1: Peri Tozu, 2: Peri Dünyası
  spiderModeState = 0; // 0: Kapalı, 1: Spiderman Modu
  fairyTrailListener: any;
  spiderTrailListener: any;
  fairyIdleInterval: any;
  spiderIdleInterval: any;
  mouseX = 0;
  mouseY = 0;
  
  // 🎶 Arka Plan Şarkısı
  fairyAudio: HTMLAudioElement | null = null;
  isMusicMuted = false;

  logout() {
    this.authService.logout();
  }

  getFairyIcon() {
    if (this.fairyModeState === 0) return '🪄';
    if (this.fairyModeState === 1) return '🌸';
    return '🌲';
  }

  getFairyTitle() {
    if (this.fairyModeState === 0) return 'Sihri Uyandır 🪄';
    if (this.fairyModeState === 1) return 'Peri Tozu Modu 🌸';
    return 'Peri Dünyası Modu 🌲';
  }

  toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.fairyAudio) {
      if (this.isMusicMuted) {
        this.fairyAudio.pause();
      } else {
        this.fairyAudio.play().catch(e => console.log('Müzik başlatılamadı:', e));
      }
    }
  }

  // 🎵 Sihirli Kutlama Sesi (Web Audio API)
  playMagicSound() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const freqs = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02];
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.5);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 1.5);
    });
  }

  // 🧚‍♀️ Peri Modu Döngüsü
  toggleFairyMode() {
    // Önce örümcek modunu kapat
    if (this.spiderModeState !== 0) {
      this.spiderModeState = 0;
      this.cleanUpSpiderMode();
    }
    this.fairyModeState = (this.fairyModeState + 1) % 3;
    
    document.documentElement.classList.remove('fairy-mode', 'fairy-world-mode');
    
    if (this.fairyModeState === 1) {
      document.documentElement.classList.add('fairy-mode');
      this.activateFairyMagic(['#fbcfe8', '#db2777', '#f472b6', '#fef08a']); // Pembe/Sarı konfetiler
    } else if (this.fairyModeState === 2) {
      document.documentElement.classList.add('fairy-world-mode');
      this.activateFairyMagic(['#86efac', '#3b82f6', '#f472b6', '#fef08a']); // Yeşil/Mavi/Pembe doğa konfetileri
    } else {
      this.deactivateFairyMagic();
    }
  }

  activateFairyMagic(confettiColors: string[]) {
    this.playMagicSound();
    
    // 🎶 Şarkıyı Başlat
    if (!this.fairyAudio) {
      // O Beni Prenses Peri Sanıyor
      this.fairyAudio = new Audio('/assets/audio/prenses.mp3');
      this.fairyAudio.loop = true;
      this.fairyAudio.volume = 0.6; // Ne çok kısık ne çok yüksek (Orta seviye)
    }
    
    if (!this.isMusicMuted) {
      this.fairyAudio.play().catch(e => console.log('Müzik otomatik başlatılamadı:', e));
    }

    // 🎉 Konfeti Patlaması
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: confettiColors
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: confettiColors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Sadece bir kere event listener ekleyelim
    if (!this.fairyTrailListener) {
      // ✨ Mouse İzleri (Yıldızlar)
      this.fairyTrailListener = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        
        if (Math.random() > 0.15) return;
        
        const star = document.createElement('div');
        star.className = 'magic-star';
        star.style.left = (e.clientX + 10) + 'px';
        star.style.top = (e.clientY + 10) + 'px';
        
        // Orman modundaysa yeşil tonları da katalım, değilse pembe kalsın
        const colors = this.fairyModeState === 2 ? ['#86efac', '#fbbf24', '#f472b6', '#a7f3d0'] : ['#fbcfe8', '#fbbf24', '#f472b6', '#fef08a'];
        star.style.color = colors[Math.floor(Math.random() * colors.length)];
        star.innerHTML = Math.random() > 0.5 ? '✦' : '✨';
        
        document.body.appendChild(star);
        
        setTimeout(() => {
          star.remove();
        }, 1800);
      };
      document.addEventListener('mousemove', this.fairyTrailListener);

      // ✨ Fare sabitken dökülen minik yıldızlar
      this.fairyIdleInterval = setInterval(() => {
        if (this.mouseX === 0 && this.mouseY === 0) return;

        const star = document.createElement('div');
        star.className = 'magic-star tiny';
        
        const offsetX = 15 + (Math.random() * 10 - 5);
        const offsetY = 15 + (Math.random() * 10 - 5);
        
        star.style.left = (this.mouseX + offsetX) + 'px';
        star.style.top = (this.mouseY + offsetY) + 'px';
        
        const colors = this.fairyModeState === 2 ? ['#86efac', '#fbbf24', '#f472b6', '#a7f3d0'] : ['#fbcfe8', '#fbbf24', '#f472b6', '#fef08a'];
        star.style.color = colors[Math.floor(Math.random() * colors.length)];
        star.innerHTML = Math.random() > 0.5 ? '✦' : '✨';
        
        document.body.appendChild(star);
        
        setTimeout(() => {
          star.remove();
        }, 2500);
      }, 400);
    }
  }

  deactivateFairyMagic() {
    // 🎶 Şarkıyı Durdur
    if (this.fairyAudio) {
      this.fairyAudio.pause();
    }

    if (this.fairyTrailListener) {
      document.removeEventListener('mousemove', this.fairyTrailListener);
      this.fairyTrailListener = null;
    }
    if (this.fairyIdleInterval) {
      clearInterval(this.fairyIdleInterval);
      this.fairyIdleInterval = null;
    }
  }

  // --- 🕷️ SPIDERMAN / 🔥 ANGER MODU KODLARI ---

  getSpiderTitle(): string {
    if (this.spiderModeState === 0) return 'Spiderman Modunu Aç 🕷️';
    if (this.spiderModeState === 1) return 'Anger Moduna Geç 🔥';
    return 'Temayı Kapat';
  }

  toggleSpiderMode() {
    // Önce peri modunu kapat
    if (this.fairyModeState !== 0) {
      this.fairyModeState = 0;
      this.deactivateFairyMagic();
      document.documentElement.classList.remove('fairy-mode', 'fairy-world-mode');
    }

    // 3 aşamalı döngü: 0 → 1 → 2 → 0
    this.spiderModeState = (this.spiderModeState + 1) % 3;
    
    // Önceki modları temizle
    document.documentElement.classList.remove('spider-mode', 'anger-mode');
    this.cleanUpTrails();
    
    if (this.spiderModeState === 1) {
      // 🕷️ Spiderman Modu
      document.documentElement.classList.add('spider-mode');
      this.startSpiderTrail();
    } else if (this.spiderModeState === 2) {
      // 🔥 Anger Modu
      document.documentElement.classList.add('anger-mode');
      this.startAngerTrail();
    }
    // 0 = Kapalı (temizleme zaten yapıldı)
  }

  startSpiderTrail() {
    if (!this.spiderTrailListener) {
      let lastTime = 0;
      
      this.spiderTrailListener = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastTime < 40) return;
        lastTime = now;
        
        this.createSpiderParticle(e.clientX, e.clientY, false);
      };
      
      document.addEventListener('mousemove', this.spiderTrailListener);
      
      this.spiderIdleInterval = setInterval(() => {
        if (this.mouseX === 0 && this.mouseY === 0) return;
        if (Math.random() > 0.6) {
          this.createSpiderParticle(this.mouseX, this.mouseY, true);
        }
      }, 300);
    }
  }

  createSpiderParticle(x: number, y: number, isTiny: boolean) {
    const particle = document.createElement('div');
    particle.className = isTiny ? 'spider-web tiny' : 'spider-web';
    
    const offsetX = isTiny ? (Math.random() * 20 - 10) : 0;
    const offsetY = isTiny ? (Math.random() * 20 - 10) : 0;
    
    particle.style.left = (x + offsetX) + 'px';
    particle.style.top = (y + offsetY) + 'px';
    
    const emojis = ['🕸️', '🕷️', '🕸️'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    particle.innerHTML = randomEmoji;
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, isTiny ? 2500 : 1800);
  }

  // 🔥 Anger Trail
  startAngerTrail() {
    if (!this.spiderTrailListener) {
      let lastTime = 0;
      
      this.spiderTrailListener = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastTime < 50) return;
        lastTime = now;
        
        this.createAngerParticle(e.clientX, e.clientY, false);
      };
      
      document.addEventListener('mousemove', this.spiderTrailListener);
      
      this.spiderIdleInterval = setInterval(() => {
        if (this.mouseX === 0 && this.mouseY === 0) return;
        if (Math.random() > 0.5) {
          this.createAngerParticle(this.mouseX, this.mouseY, true);
        }
      }, 250);
    }
  }

  createAngerParticle(x: number, y: number, isTiny: boolean) {
    const particle = document.createElement('div');
    particle.className = isTiny ? 'anger-particle tiny' : 'anger-particle';
    
    const offsetX = isTiny ? (Math.random() * 20 - 10) : 0;
    const offsetY = isTiny ? (Math.random() * 20 - 10) : 0;
    
    particle.style.left = (x + offsetX) + 'px';
    particle.style.top = (y + offsetY) + 'px';
    
    const emojis = ['🔥', '💢', '🔥', '💥'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    particle.innerHTML = randomEmoji;
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, isTiny ? 2000 : 1400);
  }

  cleanUpTrails() {
    if (this.spiderTrailListener) {
      document.removeEventListener('mousemove', this.spiderTrailListener);
      this.spiderTrailListener = null;
    }
    if (this.spiderIdleInterval) {
      clearInterval(this.spiderIdleInterval);
      this.spiderIdleInterval = null;
    }
  }

  cleanUpSpiderMode() {
    document.documentElement.classList.remove('spider-mode', 'anger-mode');
    this.cleanUpTrails();
  }
}
