import { Component, ElementRef, QueryList, ViewChild, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SolidPrinciple {
  letter: string;
  color: string;
  titleEn: string;
  titleTr: string;
  bullets: string[];
}

const SOLID_PRINCIPLES: SolidPrinciple[] = [
  {
    letter: 'S',
    color: '#f43f5e',
    titleEn: 'Single Responsibility Principle',
    titleTr: 'Tek Sorumluluk Prensibi',
    bullets: [
      'Bir sınıfın veya modülün yalnızca bir tane sorumluluğu (değişiklik sebebi) olmalıdır.',
      'Her sınıf, sistemin sadece tek bir işlevini yerine getirmelidir.'
    ]
  },
  {
    letter: 'O',
    color: '#a855f7',
    titleEn: 'Open/Closed Principle',
    titleTr: 'Açık/Kapalı Prensibi',
    bullets: [
      'Yazılım varlıkları (sınıflar, modüller, fonksiyonlar) gelişime açık, ancak değişikliğe kapalı olmalıdır.',
      'Mevcut çalışan kodu bozmadan yeni özellikler ekleyebilmelisiniz.'
    ]
  },
  {
    letter: 'L',
    color: '#3b82f6',
    titleEn: 'Liskov Substitution Principle',
    titleTr: 'Liskov Yerine Geçme Prensibi',
    bullets: [
      'Türetilen sınıflar (alt sınıflar), ana sınıfların (üst sınıfların) yerini tamamen alabilmelidir.',
      'Alt sınıflar, ana sınıfın tüm özelliklerini ve kurallarını eksiksiz uygulamalıdır.'
    ]
  },
  {
    letter: 'I',
    color: '#eab308',
    titleEn: 'Interface Segregation Principle',
    titleTr: 'Arayüz Ayırma Prensibi',
    bullets: [
      'Kullanılmayan metotları içeren büyük arayüzler yerine, daha özelleştirilmiş küçük arayüzler tercih edilmelidir.',
      'Sınıflar ihtiyaç duymadıkları metotları uygulamaya zorlanmamalıdır.'
    ]
  },
  {
    letter: 'D',
    color: '#84cc16',
    titleEn: 'Dependency Inversion Principle',
    titleTr: 'Bağımlılığın Ters Çevrilmesi Prensibi',
    bullets: [
      'Üst seviye modüller, alt seviye modüllere bağımlı olmamalıdır. Her ikisi de soyutlamalara (arayüzlere) bağımlı olmalıdır.',
      'Detaylar soyutlamalara bağlı kalmalıdır, soyutlamalar detaylara değil.'
    ]
  }
];

@Component({
  selector: 'app-solid-principles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solid-principles.component.html',
  styleUrl: './solid-principles.component.css'
})
export class SolidPrinciplesComponent implements AfterViewInit, OnDestroy {
  principles = SOLID_PRINCIPLES;

  @ViewChild('lettersRow') lettersRow?: ElementRef<HTMLElement>;
  @ViewChild('cardsGrid') cardsGrid?: ElementRef<HTMLElement>;
  @ViewChildren('letterCol') letterCols?: QueryList<ElementRef<HTMLElement>>;

  private lettersObserver?: IntersectionObserver;
  private cardsObserver?: IntersectionObserver;

  ngAfterViewInit() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      this.lettersRow?.nativeElement.classList.add('revealed');
      this.cardsGrid?.nativeElement.classList.add('revealed');
      return;
    }

    if (this.lettersRow?.nativeElement) {
      this.lettersObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.lettersRow!.nativeElement.classList.add('revealed');
              this.lettersObserver?.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      this.lettersObserver.observe(this.lettersRow.nativeElement);
    }

    if (this.cardsGrid?.nativeElement) {
      this.cardsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.cardsGrid!.nativeElement.classList.add('revealed');
              this.cardsObserver?.disconnect();
            }
          });
        },
        { threshold: 0.15 }
      );
      this.cardsObserver.observe(this.cardsGrid.nativeElement);
    }
  }

  ngOnDestroy() {
    this.lettersObserver?.disconnect();
    this.cardsObserver?.disconnect();
  }
}
