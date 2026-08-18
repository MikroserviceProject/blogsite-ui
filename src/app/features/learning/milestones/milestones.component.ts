import { Component, ElementRef, QueryList, ViewChild, ViewChildren, AfterViewChecked, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Milestone {
  year: string;
  label: string;
  description: string;
  color: string;
}

type TimelineItem = Milestone & { index: number };

// Yazılımın kökeninden bugüne kısa bir kronolojik özet — HistoryComponent'in aksine
// tıklanıp genişleyen detay kartı yok, sadece hızlıca göz atmak için.
const MILESTONES: Milestone[] = [
  { year: '1642', label: 'Mekanik Hesaplama', description: 'Pascaline ile mekanik hesaplama başladı.', color: '#64748b' },
  { year: '1837', label: 'Analitik Makine', description: 'Babbage, programlanabilir bilgisayar fikrini ortaya koydu.', color: '#78716c' },
  { year: '1843', label: 'Ada Lovelace', description: 'İlk bilgisayar algoritmalarından birini geliştirdi.', color: '#eab308' },
  { year: '1936', label: 'Turing Makinesi', description: 'Hesaplama ve algoritmanın teorik temeli oluşturuldu.', color: '#475569' },
  { year: '1946', label: 'Elektronik Bilgisayar', description: 'ENIAC gibi ilk elektronik bilgisayarlar geliştirildi.', color: '#f97316' },
  { year: '1947', label: 'Transistör', description: 'Daha küçük ve hızlı elektronik bilgisayarların önü açıldı.', color: '#78716c' },
  { year: '1951', label: 'Makine Dili / Assembly', description: 'İnsan ile bilgisayar arasındaki programlama iletişimi gelişti.', color: '#14b8a6' },
  { year: '1957', label: 'FORTRAN', description: 'İlk önemli yüksek seviyeli dillerden biri ortaya çıktı.', color: '#3b82f6' },
  { year: '1958', label: 'LISP / ALGOL', description: 'Yapay zekâ ve algoritmik programlamanın temelleri gelişti.', color: '#8b5cf6' },
  { year: '1959', label: 'COBOL', description: 'Ticari ve finansal yazılımlar için geliştirildi.', color: '#ef4444' },
  { year: '1964', label: 'BASIC', description: 'Programlamanın öğrenilmesi kolaylaştı.', color: '#06b6d4' },
  { year: '1969', label: 'UNIX', description: 'Modern işletim sistemlerinin ve birçok programlama dilinin temelini etkiledi.', color: '#0f766e' },
  { year: '1970', label: 'SQL', description: 'Veritabanı programlamasının temellerinden biri.', color: '#6366f1' },
  { year: '1971', label: 'Mikroişlemci', description: 'İşlemci tek bir çipe taşındı; kişisel bilgisayarların yolu açıldı.', color: '#ec4899' },
  { year: '1972', label: 'C', description: 'Sistem ve işletim sistemi yazılımlarında önemli bir dil haline geldi.', color: '#3b82f6' },
  { year: '1983', label: 'C++ / NYP', description: 'Nesne yönelimli programlama yaygınlaştı.', color: '#00599C' },
  { year: '1989', label: 'World Wide Web', description: 'İnternetin kullanıcı tarafında büyük dönüşümü.', color: '#1d4ed8' },
  { year: '1991', label: 'Python', description: 'Kolay öğrenilen söz dizimiyle programlamayı yaygınlaştırdı.', color: '#3776AB' },
  { year: '1991', label: 'HTML / Linux', description: 'Web\'in ve açık kaynak yazılımın temelleri atıldı.', color: '#eab308' },
  { year: '1995', label: 'Java / JavaScript', description: 'Platform bağımsız yazılım ve etkileşimli web gelişti.', color: '#fbbf24' },
  { year: '2000', label: 'C# / .NET', description: 'Modern kurumsal ve web yazılımları gelişti.', color: '#8b5cf6' },
  { year: '2007–2008', label: 'Akıllı Telefon / Android', description: 'Mobil uygulama dönemi başladı.', color: '#10b981' },
  { year: '2012', label: 'Bulut + Mobil + YZ', description: 'Bulut, mobil ve yapay zekâ teknolojileri hızla gelişti.', color: '#0ea5e9' },
  { year: '2022', label: 'Üretken YZ / YZ Ajanları', description: 'Yapay zekâ kod üretmeye ve yazılım geliştirme süreçlerine dahil oldu.', color: '#a855f7' }
];

/**
 * Diziyi, hedef satır boyutuna en yakın ve mümkünse tam eşit sayıda satıra böler
 * (örn. 26 öğe + hedef 10 → 3 değil, tam bölünen 2 satır x 13 seçilir; aksi halde
 * kalan ilk satırlara dağıtılır ki satırlar birbirinden en fazla 1 öğe farklı olsun).
 * Böylece "S" zikzağı her zaman orantılı/simetrik kalır.
 */
function chunkIntoRows<T>(items: T[], targetRowSize: number): T[][] {
  const approxRowCount = Math.max(1, Math.round(items.length / targetRowSize));
  let rowCount = approxRowCount;
  for (let delta = 0; delta <= 3; delta++) {
    const candidates = delta === 0 ? [approxRowCount] : [approxRowCount - delta, approxRowCount + delta];
    const evenCandidate = candidates.find(c => c >= 1 && items.length % c === 0);
    if (evenCandidate) {
      rowCount = evenCandidate;
      break;
    }
  }

  const base = Math.floor(items.length / rowCount);
  const remainder = items.length % rowCount;
  const rows: T[][] = [];
  let idx = 0;
  for (let r = 0; r < rowCount; r++) {
    const size = base + (r < remainder ? 1 : 0);
    rows.push(items.slice(idx, idx + size));
    idx += size;
  }
  return rows;
}

@Component({
  selector: 'app-milestones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './milestones.component.html',
  styleUrl: './milestones.component.css'
})
export class MilestonesComponent implements AfterViewInit, AfterViewChecked {
  // 2 satır halinde, "S" gibi zikzak akması için satırlar sırayla ters yönde dizilir
  // (bkz. şablon/CSS'teki .reverse) — dil seçim şeridindeki aynı teknik.
  readonly rowSize = 10;
  rows = chunkIntoRows(
    MILESTONES.map((m, i) => ({ ...m, index: i })),
    this.rowSize
  ) as TimelineItem[][];

  // Satırlar artık her zaman eşit boyutlu olmayabilir (bkz. chunkIntoRows), o yüzden
  // "hangi öğe hangi satırda" hesabı sabit rowSize varsayımı yerine gerçek satır
  // uzunluklarının kümülatif toplamına bakarak yapılır.
  private readonly rowStartIndex = this.rows.reduce<number[]>((acc, row, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + this.rows[i - 1].length);
    return acc;
  }, []);

  private rowIndexOf(globalIndex: number): number {
    for (let r = this.rowStartIndex.length - 1; r >= 0; r--) {
      if (globalIndex >= this.rowStartIndex[r]) return r;
    }
    return 0;
  }

  @ViewChild('timeline') timelineRef?: ElementRef<HTMLDivElement>;
  @ViewChild('spark') sparkRef?: ElementRef<HTMLElement>;
  @ViewChildren('dotEl') dotEls?: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('litLineEl') litLineEls?: QueryList<ElementRef<SVGPathElement>>;
  @ViewChildren('litPathEl') litPathEls?: QueryList<ElementRef<SVGPathElement>>;

  // Düz satır çizgileri (linePaths, satır başına bir tane) ve satırlar arası
  // yarım daireler (connectorPaths) — ikisi de aynı tek SVG koordinat sisteminde.
  linePaths: string[] = [];
  connectorPaths: string[] = [];
  private lastComputeKey = '';

  // Açılış animasyonu: ilk öğeden başlayarak sırayla gri->renkli açılır, aralarında
  // çizginin üzerinde bir "ışık" gezinir. `revealedCount` kadar öğe zaten renkli;
  // `growingIndex` ışığın o an ulaştığı öğe (kısa bir büyüme/pulse için).
  revealedCount = 0;
  growingIndex = -1;
  sparkVisible = false;
  private introStarted = false;

  ngAfterViewInit() {
    // İlk çizimde layout (özellikle yazı tipi yüklenmesi) henüz oturmamış olabilir,
    // bu yüzden tek bir rAF yetmiyor: bir sonraki paint'te tekrar ölçüp çiziyoruz.
    // Aksi halde bağlantı eğrisi ilk yüklemede boş/kayık çıkabiliyordu.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        this.recomputeConnectors();
        this.startIntroAnimation();
      })
    );
    document.fonts?.ready?.then(() => this.recomputeConnectors());
  }

  ngAfterViewChecked() {
    const key = String(this.rows.length);
    if (key !== this.lastComputeKey) {
      this.lastComputeKey = key;
      requestAnimationFrame(() => this.recomputeConnectors());
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.recomputeConnectors();
  }

  private recomputeConnectors() {
    if (!this.timelineRef || !this.dotEls) return;
    const containerRect = this.timelineRef.nativeElement.getBoundingClientRect();
    const dots = this.dotEls.toArray();

    // Düz satır çizgileri: container kenarından kenarına değil, satırın ilk ve son
    // noktasının GERÇEK merkezinden merkezine çizilir. Kenardan kenara çizilseydi
    // (0 → genişlik) son nokta container kenarına tam yapışık olmadığı için çizgi
    // noktadan sonra biraz daha uzayıp görünür bir "çıkıntı" bırakıyordu.
    const lines: string[] = [];
    let dotOffset = 0;
    for (let r = 0; r < this.rows.length; r++) {
      const rowLen = this.rows[r].length;
      const firstDot = dots[dotOffset];
      const lastDot = dots[dotOffset + rowLen - 1];
      dotOffset += rowLen;
      if (!firstDot || !lastDot) continue;
      const firstRect = firstDot.nativeElement.getBoundingClientRect();
      const lastRect = lastDot.nativeElement.getBoundingClientRect();
      const y = firstRect.top + firstRect.height / 2 - containerRect.top;
      const xStart = firstRect.left + firstRect.width / 2 - containerRect.left;
      const xEnd = lastRect.left + lastRect.width / 2 - containerRect.left;
      // xStart/xEnd zaten satırın gerçek (ters ise sağdan sola) yönünü yansıtıyor,
      // ayrıca bir "reversed" kontrolüne gerek yok.
      lines.push(`M ${xStart} ${y} L ${xEnd} ${y}`);
    }
    this.linePaths = lines;

    const paths: string[] = [];
    let offset = 0;

    for (let r = 0; r < this.rows.length - 1; r++) {
      const rowLen = this.rows[r].length;
      const lastDotOfRow = dots[offset + rowLen - 1];
      const firstDotOfNextRow = dots[offset + rowLen];
      offset += rowLen;
      if (!lastDotOfRow || !firstDotOfNextRow) continue;

      const r1 = lastDotOfRow.nativeElement.getBoundingClientRect();
      const r2 = firstDotOfNextRow.nativeElement.getBoundingClientRect();
      const x1 = r1.left + r1.width / 2 - containerRect.left;
      const y1 = r1.top + r1.height / 2 - containerRect.top;
      const x2 = r2.left + r2.width / 2 - containerRect.left;
      const y2 = r2.top + r2.height / 2 - containerRect.top;

      // Gerçek bir SVG yayı (arc) kullanılır — matematiksel olarak tam bir yarım daire
      // çizer (yarıçap = iki nokta arası mesafenin yarısı). Çift indeksli satır sağa
      // doğru yarım daire çizer, tek indeksli satır sola.
      const radius = Math.hypot(x2 - x1, y2 - y1) / 2;
      const sweepFlag = r % 2 === 0 ? 1 : 0;

      paths.push(`M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`);
    }

    this.connectorPaths = paths;
  }

  private async startIntroAnimation() {
    if (this.introStarted || !this.timelineRef || !this.dotEls) return;
    this.introStarted = true;

    const dots = this.dotEls.toArray();
    if (dots.length < 1) return;
    const containerRect = this.timelineRef.nativeElement.getBoundingClientRect();
    const centerOf = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - containerRect.left, y: r.top + r.height / 2 - containerRect.top };
    };

    const litLines = this.litLineEls?.toArray().map(e => e.nativeElement) ?? [];
    const litArcs = this.litPathEls?.toArray().map(e => e.nativeElement) ?? [];
    // Işık geçmeden önce izler tamamen gizli: dasharray = uzunluk, dashoffset = uzunluk.
    const litLineLengths = litLines.map(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      return len;
    });
    const litArcLengths = litArcs.map(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      return len;
    });
    let arcTransitionIndex = 0;

    // Işık ilk noktada belirir, ilk öğe hemen açılır ve büyür.
    const first = centerOf(dots[0].nativeElement);
    this.placeSpark(first.x, first.y);
    this.sparkVisible = true;
    this.revealedCount = 1;
    this.pulse(0);
    await this.wait(1000);

    for (let i = 0; i < dots.length - 1; i++) {
      const from = centerOf(dots[i].nativeElement);
      const to = centerOf(dots[i + 1].nativeElement);
      const rowIndex = this.rowIndexOf(i);
      const sameRow = rowIndex === this.rowIndexOf(i + 1);

      if (sameRow) {
        const litLine = litLines[rowIndex];
        const lineLen = litLineLengths[rowIndex];
        // Satır düz bir çizgi olduğundan, path üzerindeki mesafe doğrudan satırın
        // gerçek başlangıç noktasından (ilk nokta) 'to' noktasına olan uzaklıkla orantılı.
        const rowFirstDot = dots[this.rowStartIndex[rowIndex]];
        const rowFirstX = rowFirstDot ? centerOf(rowFirstDot.nativeElement).x : to.x;
        const traveled = Math.abs(to.x - rowFirstX);
        const targetOffset = lineLen ? lineLen - traveled : 0;
        await Promise.all([
          this.animateSpark(
            [
              { left: `${from.x}px`, top: `${from.y}px` },
              { left: `${to.x}px`, top: `${to.y}px` }
            ],
            650
          ),
          litLine ? this.animateDashOffsetTo(litLine, targetOffset, 650) : Promise.resolve()
        ]);
      } else {
        // Satırlar arası geçişte ışık, bağlantı eğrisiyle (bkz. recomputeConnectors)
        // aynı yarım daireyi izlesin diye gerçek SVG path'inden noktalar örnekleniyor;
        // aynı eğrinin sarı "izi" de aynı anda, aynı süre boyunca çizilir.
        const radius = Math.hypot(to.x - from.x, to.y - from.y) / 2;
        const sweepFlag = rowIndex % 2 === 0 ? 1 : 0;
        const litArc = litArcs[arcTransitionIndex];
        arcTransitionIndex++;
        await Promise.all([
          this.animateSpark(this.sampleArcKeyframes(from, to, radius, sweepFlag, 12), 950),
          litArc ? this.animateDashOffsetTo(litArc, 0, 950) : Promise.resolve()
        ]);
      }

      this.revealedCount = i + 2;
      this.pulse(i + 1);
      await this.wait(500);
    }

    await this.wait(700);
    this.sparkVisible = false;
  }

  private pulse(index: number) {
    this.growingIndex = index;
    setTimeout(() => {
      if (this.growingIndex === index) this.growingIndex = -1;
    }, 650);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private placeSpark(x: number, y: number) {
    const el = this.sparkRef?.nativeElement;
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  /** Işığın arkasında kalan sarı izi, path'in mevcut dashoffset'inden hedef değere kadar çizer. */
  private animateDashOffsetTo(path: SVGPathElement, toOffset: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const fromOffset = parseFloat(path.style.strokeDashoffset || '0');
      const anim = path.animate(
        [{ strokeDashoffset: `${fromOffset}` }, { strokeDashoffset: `${toOffset}` }],
        { duration, easing: 'ease-in-out', fill: 'forwards' }
      );
      anim.onfinish = () => {
        path.style.strokeDashoffset = `${toOffset}`;
        resolve();
      };
    });
  }

  private animateSpark(keyframes: Keyframe[], duration: number): Promise<void> {
    return new Promise(resolve => {
      const el = this.sparkRef?.nativeElement;
      if (!el) { resolve(); return; }
      const anim = el.animate(keyframes, { duration, easing: 'ease-in-out', fill: 'forwards' });
      anim.onfinish = () => {
        const last = keyframes[keyframes.length - 1] as Record<string, string>;
        this.placeSpark(parseFloat(last['left']), parseFloat(last['top']));
        resolve();
      };
    });
  }

  /** Gerçek SVG yay uzunluğu boyunca örnek noktalar çıkarır (recomputeConnectors ile aynı formül). */
  private sampleArcKeyframes(
    from: { x: number; y: number },
    to: { x: number; y: number },
    radius: number,
    sweepFlag: number,
    steps: number
  ): Keyframe[] {
    const svgNS = 'http://www.w3.org/2000/svg';
    const tempPath = document.createElementNS(svgNS, 'path');
    tempPath.setAttribute('d', `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${to.x} ${to.y}`);
    const len = tempPath.getTotalLength();
    const frames: Keyframe[] = [];
    for (let s = 0; s <= steps; s++) {
      const pt = tempPath.getPointAtLength((len * s) / steps);
      frames.push({ left: `${pt.x}px`, top: `${pt.y}px` });
    }
    return frames;
  }
}
