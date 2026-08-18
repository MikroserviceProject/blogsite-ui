import { Component, signal, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MapCategory = 'language' | 'markup' | 'framework' | 'library' | 'database' | 'tool';

export interface MapPoint {
  id: string;
  name: string;
  /** Sağ üst köşede rozet olarak gösterilen kısa yıl etiketi. */
  yearLabel: string;
  year: number;
  /** Tek cümlelik özet açıklama. */
  summary: string;
  color: string;
  category: MapCategory;
  /** 0-100 arası, harita genişliğine göre yatay konum yüzdesi. */
  left: number;
  /** 0-100 arası, harita yüksekliğine göre dikey konum yüzdesi. */
  top: number;
}

export const CATEGORY_LABELS: Record<MapCategory, string> = {
  language: 'Yazılım Dilleri',
  markup: 'İşaretleme/Stil Dilleri',
  framework: 'Framework\'ler',
  library: 'Kütüphaneler',
  database: 'Veritabanları',
  tool: 'Araçlar & Platformlar'
};

// Konumlar, world-map.svg'nin kendi ülke path'lerinden (Iceland, Czech, Mongolia, Tasmania,
// Madagascar vb.) çıkarılan gerçek SVG koordinatlarına göre kalibre edilmiş bir enlem/boylam
// dönüşümüyle hesaplandı: x = 6.752*boylam + 1308.0, y = -8.693*enlem + 803.9 (viewBox 2752.766x1537.631).
// Aynı bölgede (ör. Silikon Vadisi, Redmond) yığılan noktalar, tıklanabilir kalsınlar diye
// gerçek konumun etrafında küçük bir düzen içinde görsel olarak ayrıştırıldı.
const MAP_POINTS: MapPoint[] = [
  { id: 'c', category: 'language', name: 'C', yearLabel: '1972', year: 1972, color: '#3b82f6', left: 24.0, top: 25.0,
    summary: 'Sistem programlamanın temeli; hız ve donanıma yakınlık sayesinde işletim sistemleri ve gömülü sistemlerde kullanılır.' },
  { id: 'sql', category: 'database', name: 'SQL', yearLabel: '1974', year: 1974, color: '#f29111', left: 16.5, top: 25.5,
    summary: 'İlişkisel veritabanlarını sorgulamak için standart dil; hemen her yazılımın veri katmanında kullanılır.' },
  { id: 'cpp', category: 'language', name: 'C++', yearLabel: '1985', year: 1985, color: '#00599C', left: 27.6, top: 25.0,
    summary: 'C\'ye nesne yönelimli programlama ekler; oyun motorları ve yüksek performanslı sistemlerde kullanılır.' },
  { id: 'bash', category: 'language', name: 'Bash', yearLabel: '1989', year: 1989, color: '#4EAA25', left: 31.2, top: 25.0,
    summary: 'UNIX/Linux kabuk (shell) betik dili; sistem yönetimi ve otomasyon için vazgeçilmezdir.' },
  { id: 'python', category: 'language', name: 'Python', yearLabel: '1991', year: 1991, color: '#eab308', left: 48.7, top: 22.7,
    summary: 'Sade sözdizimi sayesinde veri bilimi, yapay zeka ve web geliştirmede en popüler dillerden biri.' },
  { id: 'r', category: 'language', name: 'R', yearLabel: '1993', year: 1993, color: '#276DC3', left: 91.5, top: 75.3,
    summary: 'İstatistiksel hesaplama ve veri analizi için özel olarak tasarlanmış dil.' },
  { id: 'html', category: 'markup', name: 'HTML', yearLabel: '1993', year: 1993, color: '#E34F26', left: 49.0, top: 26.2,
    summary: 'Web sayfalarının iskeletini oluşturan işaretleme dili; internetin temel yapı taşı.' },
  { id: 'java', category: 'language', name: 'Java', yearLabel: '1995', year: 1995, color: '#ef4444', left: 17.5, top: 28.8,
    summary: '"Bir kere yaz, her yerde çalıştır" felsefesiyle kurumsal sistemler ve Android\'in temelidir.' },
  { id: 'javascript', category: 'language', name: 'JavaScript', yearLabel: '1995', year: 1995, color: '#fbbf24', left: 20.7, top: 28.8,
    summary: '10 günde tasarlandı; bugün web\'in ve Node.js sayesinde sunucu tarafının evrensel dili.' },
  { id: 'php', category: 'language', name: 'PHP', yearLabel: '1995', year: 1995, color: '#777BB4', left: 29.0, top: 26.6,
    summary: 'Dinamik web sayfaları için tasarlandı; WordPress dahil web\'in büyük bir kısmı PHP ile çalışır.' },
  { id: 'mysql', category: 'database', name: 'MySQL', yearLabel: '1995', year: 1995, color: '#4479A1', left: 51.8, top: 18.4,
    summary: 'Açık kaynaklı, dünyanın en yaygın kullanılan ilişkisel veritabanı yönetim sistemlerinden biri.' },
  { id: 'css', category: 'markup', name: 'CSS', yearLabel: '1996', year: 1996, color: '#1572B6', left: 49.6, top: 26.7,
    summary: 'Web sayfalarına stil ve görsel tasarım katan dil; HTML ile birlikte web\'in vazgeçilmez ikilisi.' },
  { id: 'xml', category: 'markup', name: 'XML', yearLabel: '1996', year: 1996, color: '#FF6600', left: 34.8, top: 25.0,
    summary: 'Yapılandırılmış veri taşımak için insan ve makine tarafından okunabilir işaretleme formatı.' },
  { id: 'asp', category: 'framework', name: 'ASP', yearLabel: '1996', year: 1996, color: '#512BD4', left: 15.9, top: 23.7,
    summary: 'Windows sunucularında dinamik web sayfası geliştirmenin ilk yolu; ASP.NET\'in atası.' },
  { id: 'csharp', category: 'language', name: 'C#', yearLabel: '2000', year: 2000, color: '#8b5cf6', left: 19.1, top: 23.7,
    summary: '.NET ekosisteminin kalbi; kurumsal web, masaüstü ve Unity ile oyun geliştirmede kullanılır.' },
  { id: 'scipy', category: 'library', name: 'SciPy', yearLabel: '2001', year: 2001, color: '#8CAAE6', left: 20.0, top: 28.5,
    summary: 'Bilimsel hesaplama için Python kütüphanesi; mühendislik ve istatistikte yaygın kullanılır.' },
  { id: 'django', category: 'framework', name: 'Django', yearLabel: '2005', year: 2005, color: '#092E20', left: 26.0, top: 28.5,
    summary: 'Python\'ın en popüler web framework\'ü; "pillere dahil" felsefesiyle hızlı geliştirme sağlar.' },
  { id: 'git', category: 'tool', name: 'Git', yearLabel: '2005', year: 2005, color: '#F05032', left: 53.0, top: 19.5,
    summary: 'Dağıtık versiyon kontrol sistemi; bugün neredeyse tüm yazılım ekiplerinin standart aracı.' },
  { id: 'sass', category: 'markup', name: 'Sass', yearLabel: '2006', year: 2006, color: '#CC6699', left: 28.0, top: 27.6,
    summary: 'CSS\'e değişken, döngü gibi programlama özellikleri katan bir "CSS ön işlemcisi".' },
  { id: 'jquery', category: 'library', name: 'jQuery', yearLabel: '2006', year: 2006, color: '#0769AD', left: 31.2, top: 28.8,
    summary: 'Tarayıcılar arası uyumsuzlukları çözen JavaScript kütüphanesi; modern framework\'lerden önceki dönemin standardı.' },
  { id: 'numpy', category: 'library', name: 'NumPy', yearLabel: '2006', year: 2006, color: '#4D77CF', left: 23.0, top: 32.0,
    summary: 'Python\'da sayısal hesaplama ve dizi işlemlerinin temeli; veri biliminin altyapısı.' },
  { id: 'aws', category: 'tool', name: 'AWS', yearLabel: '2006', year: 2006, color: '#FF9900', left: 15.9, top: 26.9,
    summary: 'Bulut bilişimin öncüsü; sunucu, depolama ve altyapı hizmetlerini internet üzerinden sağlar.' },
  { id: 'pandas', category: 'library', name: 'Pandas', yearLabel: '2008', year: 2008, color: '#150458', left: 34.8, top: 28.8,
    summary: 'Python\'da veri analizi ve tablo (DataFrame) işlemleri için en popüler kütüphane.' },
  { id: 'go', category: 'language', name: 'Go', yearLabel: '2009', year: 2009, color: '#06b6d4', left: 14.3, top: 32.0,
    summary: 'Basitlik ve eşzamanlılık (concurrency) odaklı; Docker ve Kubernetes\'in temel taşı.' },
  { id: 'nodejs', category: 'tool', name: 'Node.js', yearLabel: '2009', year: 2009, color: '#339933', left: 24.0, top: 29.0,
    summary: 'JavaScript\'i sunucu tarafına taşıdı; "tek dille full-stack" geliştirme fikrini başlattı.' },
  { id: 'mongodb', category: 'database', name: 'MongoDB', yearLabel: '2009', year: 2009, color: '#47A248', left: 27.6, top: 29.0,
    summary: 'Doküman tabanlı NoSQL veritabanı; esnek şemalı, hızlı büyüyen uygulamalarda tercih edilir.' },
  { id: 'angularjs', category: 'framework', name: 'AngularJS', yearLabel: '2010', year: 2010, color: '#B52E31', left: 17.5, top: 32.0,
    summary: 'İlk büyük tek sayfa uygulama (SPA) framework\'ü; sayfa yenilenmeden çalışan web uygulamaları.' },
  { id: 'rust', category: 'language', name: 'Rust', yearLabel: '2010', year: 2010, color: '#CE422B', left: 12.0, top: 21.0,
    summary: 'Bellek güvenliğini derleme aşamasında garanti eder; sistem programlamada C/C++\'a modern alternatif.' },
  { id: 'bootstrap', category: 'framework', name: 'Bootstrap', yearLabel: '2011', year: 2011, color: '#7952B3', left: 14.3, top: 35.2,
    summary: 'Hazır bileşenleriyle hızlı ve duyarlı (responsive) web tasarımını popülerleştirdi.' },
  { id: 'kotlin', category: 'language', name: 'Kotlin', yearLabel: '2011', year: 2011, color: '#7F52FF', left: 51.3, top: 24.4,
    summary: 'Java ile tam uyumlu, daha sade sözdizimli dil; resmi Android geliştirme dili oldu.' },
  { id: 'typescript', category: 'language', name: 'TypeScript', yearLabel: '2012', year: 2012, color: '#3b82f6', left: 19.1, top: 26.9,
    summary: 'JavaScript\'e statik tip güvenliği ekler; Angular gibi framework\'lerin endüstri standardı.' },
  { id: 'w3css', category: 'framework', name: 'W3.CSS', yearLabel: '2013', year: 2013, color: '#04AA6D', left: 49.0, top: 19.5,
    summary: 'Bootstrap\'a hafif bir alternatif olarak w3schools tarafından geliştirilen CSS framework\'ü.' },
  { id: 'react', category: 'framework', name: 'React', yearLabel: '2013', year: 2013, color: '#61DAFB', left: 20.7, top: 32.0,
    summary: 'Component tabanlı, "declarative UI" fikrini popülerleştirdi; en yaygın frontend kütüphanesi.' },
  { id: 'swift', category: 'language', name: 'Swift', yearLabel: '2014', year: 2014, color: '#FA7343', left: 17.5, top: 35.2,
    summary: 'Objective-C\'nin yerini alan, güvenli ve hızlı; iOS/macOS uygulama geliştirmenin standardı.' },
  { id: 'vue', category: 'framework', name: 'Vue', yearLabel: '2014', year: 2014, color: '#4FC08D', left: 75.0, top: 33.5,
    summary: 'React ve Angular\'a hafif, öğrenmesi kolay bir alternatif olarak tasarlandı.' },
  { id: 'angular', category: 'framework', name: 'Angular', yearLabel: '2016', year: 2016, color: '#DD0031', left: 20.7, top: 35.2,
    summary: 'AngularJS\'in TypeScript ile sıfırdan yeniden yazılmış hali — bu projenin de kullandığı framework.' }
];

export interface PointLayout {
  point: MapPoint;
  /** Kartın, noktaya göre px cinsinden kayma miktarı. */
  dx: number;
  dy: number;
  /** Noktadan karta uzanan ince çizginin uzunluğu ve açısı (derece). */
  lineLength: number;
  lineAngleDeg: number;
}

// Tüm kart konumları kullanıcının sürükle-bırak ile elle yerleştirip "Pozisyonları Kopyala"
// ile gönderdiği kesin, onaylanmış konumlardır (0°=sağ, 90°=aşağı, -90°=yukarı, 180°=sol).
const MANUAL_OFFSETS: Partial<Record<string, { angleDeg: number; radius: number }>> = {
  // Yazılım Dilleri
  swift: { angleDeg: 92, radius: 293 },
  go: { angleDeg: 109, radius: 168 },
  java: { angleDeg: -130, radius: 180 },
  javascript: { angleDeg: 51, radius: 346 },
  typescript: { angleDeg: 75, radius: 234 },
  rust: { angleDeg: 132, radius: 107 },
  csharp: { angleDeg: -72, radius: 113 },
  c: { angleDeg: 39, radius: 231 },
  php: { angleDeg: 32, radius: 369 },
  cpp: { angleDeg: -46, radius: 150 },
  bash: { angleDeg: 8, radius: 124 },
  python: { angleDeg: -51, radius: 114 },
  kotlin: { angleDeg: -8, radius: 218 },
  r: { angleDeg: -118, radius: 117 },
  // İşaretleme/Stil Dilleri
  sass: { angleDeg: 136, radius: 117 },
  xml: { angleDeg: -142, radius: 133 },
  html: { angleDeg: 113, radius: 102 },
  css: { angleDeg: -40, radius: 144 },
  // Framework'ler
  bootstrap: { angleDeg: 130, radius: 105 },
  angular: { angleDeg: 75, radius: 156 },
  angularjs: { angleDeg: -158, radius: 146 },
  react: { angleDeg: 15, radius: 150 },
  asp: { angleDeg: -72, radius: 105 },
  django: { angleDeg: -52, radius: 168 },
  w3css: { angleDeg: 55, radius: 135 },
  vue: { angleDeg: -117, radius: 117 },
  // Kütüphaneler
  numpy: { angleDeg: -42, radius: 156 },
  scipy: { angleDeg: -135, radius: 98 },
  jquery: { angleDeg: 136, radius: 182 },
  pandas: { angleDeg: 65, radius: 93 },
  // Veritabanları
  sql: { angleDeg: 129, radius: 132 },
  mongodb: { angleDeg: -55, radius: 107 },
  mysql: { angleDeg: 17, radius: 117 },
  // Araçlar & Platformlar
  aws: { angleDeg: 91, radius: 118 },
  nodejs: { angleDeg: -32, radius: 168 },
  git: { angleDeg: 25, radius: 179 }
};

@Component({
  selector: 'app-world-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './world-map.component.html',
  styleUrl: './world-map.component.css'
})
export class WorldMapComponent implements AfterViewInit, OnDestroy {
  points = MAP_POINTS;
  selectedCategory = signal<MapCategory>('language');

  readonly categories: MapCategory[] = ['language', 'markup', 'framework', 'library', 'database', 'tool'];
  readonly categoryLabels = CATEGORY_LABELS;

  // Noktalar/kartlar sayfa açılır açılmaz değil, kullanıcı harita bölümüne
  // kaydırıp gelince (görünüme girince) belirsin diye IntersectionObserver
  // ile tetiklenir — aksi halde animasyon kullanıcı henüz görmeden bitiyordu.
  @ViewChild('mapEl') mapEl?: ElementRef<HTMLElement>;
  hasEnteredView = signal(false);
  private observer?: IntersectionObserver;

  ngAfterViewInit() {
    const el = this.mapEl?.nativeElement;
    if (!el) return;
    this.observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          this.hasEnteredView.set(true);
          this.observer?.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    this.observer.observe(el);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  get visiblePoints(): MapPoint[] {
    return this.points.filter(p => p.category === this.selectedCategory());
  }

  selectCategory(cat: MapCategory) {
    this.selectedCategory.set(cat);
  }

  // Haritanın gerçek en-boy oranı (viewBox 2752.766x1537.631) — yüzdesel koordinatlardan
  // ekran-uzayında doğru bir yön (açı) hesaplamak için gerekli.
  private readonly mapAspectRatio = 2752.766 / 1537.631;

  private angleFor(point: MapPoint): number {
    const dx = (point.left - 50) * this.mapAspectRatio;
    const dy = point.top - 50;
    return Math.atan2(dy, dx);
  }

  // Çizgiler ve kartlar sadece dört ana yönde (sağ/yukarı/sol/aşağı) yerleşir — hiçbir zaman
  // çapraz değil, her zaman dümdüz yatay ya da dikey. Aynı bölgede kümelenen noktalar
  // (açıları birbirine çok yakın olanlar) art arda bu dört yöne sırayla dağıtılır (round-robin)
  // ki komşu noktalar aynı sütun/satıra denk gelip üst üste binmesin; yarıçap her tam turda
  // (4 noktada bir) biraz büyür.
  private static readonly CARDINAL_ANGLES_DEG = [0, -90, 180, 90];

  get pointLayouts(): PointLayout[] {
    return this.computeLayoutsFor(this.visiblePoints);
  }

  // visiblePoints (tek kategori) veya tüm noktalar gibi herhangi bir alt küme için aynı
  // yerleşim mantığını üretir — hem canlı görüntüleme hem de "Pozisyonları Kopyala" dışa
  // aktarımı bu tek metodu kullanır ki ikisi arasında fark olmasın.
  private computeLayoutsFor(points: MapPoint[]): PointLayout[] {
    const baseRadius = 50;
    const radiusStep = 37;
    const angleThreshold = (34 * Math.PI) / 180;

    const sorted = [...points].sort((a, b) => this.angleFor(a) - this.angleFor(b));
    let ring = 0;
    let prevAngle: number | null = null;

    return sorted.map(point => {
      const baseAngle = this.angleFor(point);
      if (prevAngle !== null) {
        let diff = Math.abs(baseAngle - prevAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        ring = diff < angleThreshold ? ring + 1 : 0;
      }
      prevAngle = baseAngle;

      const manual = MANUAL_OFFSETS[point.id];
      let angleDeg: number;
      let radius: number;
      if (manual) {
        angleDeg = manual.angleDeg;
        radius = manual.radius;
      } else {
        angleDeg = WorldMapComponent.CARDINAL_ANGLES_DEG[ring % 4];
        radius = baseRadius + ring * radiusStep;
      }

      const angle = (angleDeg * Math.PI) / 180;
      return {
        point,
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius,
        lineLength: radius,
        lineAngleDeg: angleDeg
      };
    })
    // Kümelenme/ring hesabı için diziyi açıya göre sıralı işledik, ama şablondaki
    // @for'un index'i (animasyon gecikmesini belirliyor) buradan geliyor — o yüzden
    // dönmeden önce kronolojik (yıl) sıraya çeviriyoruz ki noktalar oluşma tarihine
    // göre sırayla belirsin.
    .sort((a, b) => a.point.year - b.point.year);
  }
}
