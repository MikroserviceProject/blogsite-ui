import { Component, ElementRef, QueryList, ViewChild, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SolidPrinciple {
  letter: string;
  color: string;
  titleEn: string;
  titleTr: string;
  bullets: string[];
  codeBad: string;
  codeGood: string;
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
    ],
    codeBad: `// Rapor'un iki sorumluluğu var: hesaplama ve yazdırma.
// Bir sınıfta birden fazla sorumluluk olması ileride sorun çıkarır.
class Rapor
{
    public double Topla(double a, double b) => a + b;
    public void Yazdir(double sonuc) => Console.WriteLine(sonuc);
}`,
    codeGood: `// Her sınıfın tek bir görevi, tek bir değişim sebebi var
class Hesaplayici
{
    public double Topla(double a, double b) => a + b;
}

class Yazdirici
{
    public void Yazdir(double sonuc) => Console.WriteLine(sonuc);
}`
  },
  {
    letter: 'O',
    color: '#a855f7',
    titleEn: 'Open/Closed Principle',
    titleTr: 'Açık/Kapalı Prensibi',
    bullets: [
      'Yazılım varlıkları (sınıflar, modüller, fonksiyonlar) gelişime açık, ancak değişikliğe kapalı olmalıdır.',
      'Mevcut çalışan kodu bozmadan yeni özellikler ekleyebilmelisiniz.'
    ],
    codeBad: `// Yeni bir şekil eklendikçe bu metodu tekrar tekrar değiştirmek gerekir
class AlanHesaplayici
{
    public double Alan(string tip, double deger)
    {
        if (tip == "kare") return deger * deger;
        else if (tip == "daire") return 3.14 * deger * deger;
        return 0;
    }
}`,
    codeGood: `// Yeni şekil için mevcut kodu değiştirmeye gerek yok, sadece yeni sınıf eklenir
abstract class Sekil
{
    public abstract double Alan();
}

class Kare : Sekil
{
    public double Kenar;
    public override double Alan() => Kenar * Kenar;
}

class Daire : Sekil
{
    public double Yaricap;
    public override double Alan() => 3.14 * Yaricap * Yaricap;
}`
  },
  {
    letter: 'L',
    color: '#3b82f6',
    titleEn: 'Liskov Substitution Principle',
    titleTr: 'Liskov Yerine Geçme Prensibi',
    bullets: [
      'Türetilen sınıflar (alt sınıflar), ana sınıfların (üst sınıfların) yerini tamamen alabilmelidir.',
      'Alt sınıflar, ana sınıfın tüm özelliklerini ve kurallarını eksiksiz uygulamalıdır.'
    ],
    codeBad: `// Penguen, Kuş'un yerine geçemiyor: Ucar() çağrılınca hata fırlatıyor
class Kus
{
    public virtual void Ucar() => Console.WriteLine("Uçuyor");
}

class Penguen : Kus
{
    public override void Ucar() => throw new Exception("Uçamam!");
}`,
    codeGood: `// Uçabilen türler ayrı bir arayüzle ifade edilir
class Kus { }

interface IUcabilir { void Ucar(); }

class Serce : Kus, IUcabilir
{
    public void Ucar() => Console.WriteLine("Serçe uçuyor");
}

class Penguen : Kus { }`
  },
  {
    letter: 'I',
    color: '#eab308',
    titleEn: 'Interface Segregation Principle',
    titleTr: 'Arayüz Ayırma Prensibi',
    bullets: [
      'Kullanılmayan metotları içeren büyük arayüzler yerine, daha özelleştirilmiş küçük arayüzler tercih edilmelidir.',
      'Sınıflar ihtiyaç duymadıkları metotları uygulamaya zorlanmamalıdır.'
    ],
    codeBad: `// Tek büyük arayüz, Robot'u ihtiyacı olmayan Yemek()'e de zorluyor
interface ICalisan
{
    void Calis();
    void Yemek();
}

class Robot : ICalisan
{
    public void Calis() => Console.WriteLine("Çalışıyor");
    public void Yemek() => throw new Exception("Yemek yiyemem!");
}`,
    codeGood: `// Küçük, özelleşmiş arayüzler: Robot sadece ihtiyacı olanı uygular
interface ICalisabilir { void Calis(); }
interface IYemekYiyebilir { void Yemek(); }

class Robot : ICalisabilir
{
    public void Calis() => Console.WriteLine("Çalışıyor");
}`
  },
  {
    letter: 'D',
    color: '#84cc16',
    titleEn: 'Dependency Inversion Principle',
    titleTr: 'Bağımlılığın Ters Çevrilmesi Prensibi',
    bullets: [
      'Üst seviye modüller, alt seviye modüllere bağımlı olmamalıdır. Her ikisi de soyutlamalara (arayüzlere) bağımlı olmalıdır.',
      'Detaylar soyutlamalara bağlı kalmalıdır, soyutlamalar detaylara değil.'
    ],
    codeBad: `// SiparisServisi somut EPostaGonderici sınıfına doğrudan bağımlı
class EPostaGonderici
{
    public void Gonder(string mesaj) => Console.WriteLine("E-posta: " + mesaj);
}

class SiparisServisi
{
    private EPostaGonderici gonderici = new EPostaGonderici();
    public void Bildir(string mesaj) => gonderici.Gonder(mesaj);
}`,
    codeGood: `// SiparisServisi somut sınıfa değil, arayüze (interface) bağımlı
interface IBildirimGonderici
{
    void Gonder(string mesaj);
}

class EPostaGonderici : IBildirimGonderici
{
    public void Gonder(string mesaj) => Console.WriteLine("E-posta: " + mesaj);
}

class SiparisServisi
{
    private IBildirimGonderici gonderici;
    public SiparisServisi(IBildirimGonderici g) => gonderici = g;
}`
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
      this.lettersObserver = this.observeReveal(this.lettersRow.nativeElement, 0.35);
    }

    if (this.cardsGrid?.nativeElement) {
      this.cardsObserver = this.observeReveal(this.cardsGrid.nativeElement, 0.15);
    }
  }

  private observeReveal(el: HTMLElement, threshold: number): IntersectionObserver {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('revealed');
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    observer.observe(el);
    return observer;
  }

  ngOnDestroy() {
    this.lettersObserver?.disconnect();
    this.cardsObserver?.disconnect();
  }

  /** Kod bloğunda yalnızca yorum satırlarını (//) renklendirir. */
  highlightCode(code: string): string {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/^(\s*\/\/.*)$/gm, '<span class="code-comment">$1</span>');
  }
}
