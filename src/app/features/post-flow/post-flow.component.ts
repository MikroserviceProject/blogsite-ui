import { Component, OnDestroy, AfterViewInit, HostListener, signal, computed, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FlowNode {
  id: string;
  label: string;
  role: string;
  explain: string;
  technical?: string;
}

interface ListItem {
  title: string;
  subtitle: string;
}

interface DemoFlow {
  id: string;
  name: string;
  screenType: 'list' | 'form' | 'detail' | 'delete';
  screenLabel: string;
  opLabel: string;
  introExplain: string;
  nodes: FlowNode[];
  successExplain: string;
  tagChip?: string;
  prefilled?: boolean;
  showReason?: boolean;
  navItem?: string;
  listItems?: ListItem[];
  screenTitle?: string;
  screenSubtitle?: string;
  screenBody?: string;
  screenExtra?: string;
}

@Component({
  selector: 'app-post-flow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-flow.component.html',
  styleUrl: './post-flow.component.css'
})
export class PostFlowComponent implements OnDestroy, AfterViewInit {

  navItems = ['Ana Sayfa', 'Bloglar', 'Köşe Yazıları', 'Öğrenme Merkezi'];

  flows: DemoFlow[] = [
    {
      id: 'list-posts',
      name: '1. Blog Listesini Görüntüleme',
      screenType: 'list',
      screenLabel: '/bloglar',
      opLabel: 'Blog Listeleme',
      navItem: 'Bloglar',
      introExplain: "Kullanıcı navbardaki 'Bloglar' linkine tıkladı.",
      listItems: [
        { title: 'Temiz Kod İlkeleriyle Daha Okunabilir Yazılım', subtitle: '12 Mart 2026 · 4 dk okuma' },
        { title: 'PostgreSQL Sorgu Performansını Artırma', subtitle: '8 Mart 2026 · 6 dk okuma' },
        { title: 'Angular Signals ile Reaktif Programlama', subtitle: '2 Mart 2026 · 5 dk okuma' }
      ],
      nodes: [
        { id: 'comp', label: 'BlogHomeComponent.ts', role: 'Anasayfada blog yazılarını kart kart listeleyen ekran bileşeni', explain: "Frontend'den HTTP GET isteği geldi.", technical: 'loadPosts() → GET /api/posts/paged' },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: 'Servis isteği backend adresine yönlendirdi.', technical: 'getAllPaged()' },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı, Controller karşıladı.", technical: 'GetPagedPosts()' },
        { id: 'svc-be', label: 'PostService.cs', role: "Filtreleme ve sayfalama kurallarını uygulayıp repository'den veri isteyen katman", explain: 'Hangi yazıların isteneceğine burada karar verilir.', technical: 'GetPagedPostsAsync()' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Veritabanından yazı listesi sorgulanır.', technical: 'GetAllAsync() → SELECT … LIMIT/OFFSET' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Veritabanı, eşleşen yazı satırlarını döner.', technical: 'Posts tablosu' }
      ],
      successExplain: "Yazı listesi frontend'e geri gönderildi ve ekranda gösterildi."
    },
    {
      id: 'view-post',
      name: '2. Yazı Detayını Görüntüleme',
      screenType: 'detail',
      screenLabel: '/bloglar/42',
      opLabel: 'Yazı Detayı',
      introExplain: 'Kullanıcı bir yazının başlığına tıklayıp detayına girmek istedi.',
      screenTitle: 'Angular Signals ile Reaktif Programlama',
      screenSubtitle: 'Ahmet Yılmaz · 2 Mart 2026',
      screenBody: 'Angular 17 ile gelen Signals API, component içindeki durum yönetimini basitleştiriyor. Bu yazıda signal(), computed() ve effect() fonksiyonlarını gerçek örneklerle inceliyoruz…',
      nodes: [
        { id: 'comp', label: 'BlogDetailComponent.ts', role: 'Tek bir yazının başlığını, içeriğini ve yazarını gösteren detay ekranı', explain: "Frontend'den, tek bir yazı için HTTP GET isteği geldi.", technical: 'getById(id) → GET /api/posts/{id}' },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: "Servis, yazının id'siyle isteği backend'e gönderdi.", technical: 'getById(id)' },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "Controller, istenen id'yi karşıladı.", technical: 'GetPost(int id)' },
        { id: 'svc-be', label: 'PostService.cs', role: "Belirtilen id'ye ait yazıyı bulup DTO'ya dönüştüren iş mantığı katmanı", explain: "Servis, o id'ye sahip yazıyı arar.", technical: 'GetPostAsync(id)' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Veritabanından tek bir kayıt sorgulanır.', technical: 'GetByIdAsync(id) → SELECT WHERE Id=@id' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Veritabanı, eşleşen tek satırı döner.', technical: 'Posts tablosu' }
      ],
      successExplain: 'Yazının tam içeriği ekrana geldi.'
    },
    {
      id: 'filter-by-tag',
      name: '3. Etikete Göre Filtreleme',
      screenType: 'list',
      screenLabel: '/tag/CSharp',
      opLabel: 'Etiket Filtreleme',
      tagChip: '#CSharp',
      introExplain: "Kullanıcı bir etikete (#CSharp) tıkladı.",
      listItems: [
        { title: 'C# ile Generic Repository Deseni', subtitle: '#CSharp · 5 Mart 2026' },
        { title: 'Entity Framework Core Migration Rehberi', subtitle: '#CSharp · 1 Mart 2026' },
        { title: 'C# 12: Yeni Gelen Özellikler', subtitle: '#CSharp · 20 Şubat 2026' }
      ],
      nodes: [
        { id: 'comp', label: 'TagDetailComponent.ts', role: 'Belirli bir etikete sahip yazıları listeleyen filtre ekranı', explain: "Frontend'den, etiketi içeren bir GET isteği geldi.", technical: "loadPosts() → GET /api/posts?tag=..." },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: "Servis, tag parametresini backend'e ekleyerek gönderdi.", technical: "getAll('Published', tag)" },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: 'Controller, filtre parametresiyle isteği karşıladı.', technical: 'GetPosts(tag)' },
        { id: 'svc-be', label: 'PostService.cs', role: "Filtreleme ve sayfalama kurallarını uygulayıp repository'den veri isteyen katman", explain: "Servis, filtreleme mantığını repository'e iletir.", technical: 'GetPostsAsync(tag)' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Etikete sahip yazılar veritabanında aranır.', technical: 'GetAllAsync(tag) → Tags içinde eşleşme' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Veritabanı, sadece o etikete sahip satırları döner.', technical: 'EF.Functions.ILike' }
      ],
      successExplain: 'Sadece seçilen etikete sahip yazılar listelendi.'
    },
    {
      id: 'create-post',
      name: '4. Yeni Yazı Oluşturma',
      screenType: 'form',
      screenLabel: '/create-post',
      opLabel: 'Yazı Oluşturma',
      introExplain: 'Kullanıcı başlık ve içeriği doldurup "Yayınla" dedi.',
      screenTitle: "Docker ile .NET Uygulamasını Konteynerleştirme",
      screenBody: "Bu yazıda bir .NET Web API projesini Docker image'ı haline getirip, docker-compose ile PostgreSQL container'ına bağlayacağız…",
      nodes: [
        { id: 'comp', label: 'PostCreateComponent.ts', role: 'Başlık, içerik ve fotoğraf girilen yeni yazı formunu yönetir', explain: "Component, formu backend'e göndermeye hazırladı.", technical: 'onSubmit() → performSave()' },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP POST isteği geldi.", technical: 'create() → POST /api/posts' },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı: Controller POST isteğini karşıladı.", technical: 'CreatePost()' },
        { id: 'svc-be', label: 'PostService.cs', role: 'Formdan gelen veriyi doğrulayıp yeni bir Post kaydı oluşturan katman', explain: 'Veriler kontrol edilir (başlık boş mu, yetkisi var mı vb.).', technical: 'CreatePostAsync(dto, authorId, photoUrl)' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Yeni kaydı yazmak için repository çağrılır.', technical: 'AddAsync(entity)' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Yazı, veritabanına kalıcı olarak kaydedilir.', technical: 'INSERT' }
      ],
      successExplain: 'Kayıt tamamlandı, sonuç arayüze geri döndü.'
    },
    {
      id: 'update-post',
      name: '5. Yazı Güncelleme',
      screenType: 'form',
      screenLabel: '/create-post?id=42',
      opLabel: 'Yazı Güncelleme',
      prefilled: true,
      introExplain: "Kullanıcı var olan bir yazıyı düzenleyip 'Kaydet' dedi.",
      screenTitle: 'React Hooks Kullanımı (Güncellendi)',
      screenBody: 'useEffect bağımlılık dizisiyle ilgili örnekleri güncelledim ve useMemo/useCallback karşılaştırmasını ekledim…',
      nodes: [
        { id: 'comp', label: 'PostCreateComponent.ts', role: 'Aynı formu mevcut yazının verileriyle önceden doldurup düzenleme moduna alır', explain: '(Düzenleme modunda) Component, güncellenmiş formu hazırladı.', technical: 'performSave() → update()' },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP PUT isteği geldi.", technical: 'update(id, dto) → PUT /api/posts/{id}' },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "Controller, hangi yazının güncelleneceğini id'den anladı.", technical: 'UpdatePost(id)' },
        { id: 'svc-be', label: 'PostService.cs', role: 'Hangi alanların değiştiğini kontrol edip mevcut kaydı güncelleyen katman', explain: 'Değişen alanlar (başlık, içerik, foto) güncellenir.', technical: 'UpdatePostAsync(id, dto)' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Güncellenmiş kayıt veritabanına yazılır.', technical: 'SaveChangesAsync()' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'İlgili satır güncellenir.', technical: 'UPDATE' }
      ],
      successExplain: 'Yazı güncellendi, değişiklikler kaydedildi.'
    },
    {
      id: 'delete-post',
      name: '6. Yazı Silme',
      screenType: 'delete',
      screenLabel: '/bloglar/42',
      opLabel: 'Yazı Silme',
      introExplain: "Kullanıcı kendi yazısında 'Sil' butonuna bastı.",
      screenTitle: 'Eski ve Güncelliğini Yitirmiş Bir Yazı',
      screenSubtitle: 'Mehmet Kaya · 14 Ocak 2025',
      nodes: [
        { id: 'comp', label: 'BlogDetailComponent.ts', role: "Yazı sahibinin kendi yazısını silebildiği 'Sil' butonunu barındırır", explain: "Component, silme isteğini backend'e gönderdi.", technical: 'deletePost(id)' },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP DELETE isteği geldi.", technical: 'delete(id) → DELETE /api/posts/{id}' },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "Controller, silinecek yazının id'sini aldı.", technical: 'DeletePost(id)' },
        { id: 'svc-be', label: 'PostService.cs', role: "Yetki kontrolünü yapıp Post kaydını veritabanından kaldıran katman", explain: 'Yazı bulunur ve silinmek üzere işaretlenir.', technical: 'DeletePostAsync(id)' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Kayıt veritabanından kaldırılır.', technical: 'Remove(entity) + SaveChangesAsync()' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'İlgili satır veritabanından silinir.', technical: 'DELETE' }
      ],
      successExplain: 'Yazı kalıcı olarak silindi.'
    },
    {
      id: 'admin-delete-post',
      name: '7. Admin Tarafından Yazı Silme',
      screenType: 'delete',
      screenLabel: '/bloglar/42',
      opLabel: 'Admin Silme',
      showReason: true,
      introExplain: 'Admin, kural ihlali yapan bir yazıyı gerekçesiyle sildi.',
      screenTitle: 'Kurallara Aykırı İçerik İçeren Yazı',
      screenSubtitle: 'anonim_kullanici · 3 gün önce',
      screenExtra: 'Gerekçe: Telif hakkı ihlali içeriyor.',
      nodes: [
        { id: 'comp', label: 'BlogDetailComponent.ts', role: 'Admin rolündeki kullanıcının gerekçe belirterek yazı silebildiği ekran', explain: 'Admin, gerekçesini yazıp silme isteğini gönderdi.', technical: 'adminDelete(id, reason)' },
        { id: 'svc-fe', label: 'BlogService.ts', role: "Angular tarafında /api/posts adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den, sadece Admin'in yapabileceği bir istek geldi.", technical: 'adminDelete() → POST /api/posts/{id}/admin-delete' },
        { id: 'ctrl', label: 'PostsController.cs', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "Controller, isteği atan kullanıcının gerçekten Admin olduğunu doğrular.", technical: '[Authorize(Roles="Admin")]' },
        { id: 'svc-be', label: 'PostService.cs', role: '[Authorize(Roles="Admin")] kontrolünden geçen isteği işleyip kaydı siler', explain: 'Gerekçe kaydedilir, yazı silinmek üzere işaretlenir.', technical: 'AdminDeletePostAsync(id)' },
        { id: 'repo', label: 'PostRepository.cs', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Kayıt veritabanından kaldırılır.', technical: 'Remove(entity) + SaveChangesAsync()' },
        { id: 'db', label: 'PostgreSQL', role: 'Tüm yazıların kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'İlgili satır veritabanından silinir.', technical: 'DELETE' }
      ],
      successExplain: 'Yazı, admin tarafından gerekçesiyle silindi.'
    }
  ];

  activeFlowId = signal(this.flows[0].id);
  activeFlow = computed(() => this.flows.find(f => f.id === this.activeFlowId())!);

  // Ekran önizlemesindeki başlığa tıklayınca açılan, senaryo seçmeye yarayan küçük menü
  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.menuOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.op-picker')) {
      this.menuOpen.set(false);
    }
  }

  // Her satırı bir katman olarak renkli zeminle gruplamak için: Frontend / Backend / Veritabanı
  groupLabels = ['Frontend', 'Backend', 'Veritabanı'];

  // Yılan (zigzag) düzeni: 2 sütun, kutu sırasına göre satır/sütun konumu.
  // 0:(r1,c1) 1:(r1,c2) 2:(r2,c2) 3:(r2,c1) 4:(r3,c1) 5:(r3,c2)
  snakeGridPos = [
    { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 2 }, { row: 2, col: 1 },
    { row: 3, col: 1 }, { row: 3, col: 2 }
  ];
  gridPos(i: number) {
    return this.snakeGridPos[i] ?? { row: 1, col: 1 };
  }

  @ViewChild('snakeGrid') snakeGrid?: ElementRef<HTMLElement>;
  @ViewChildren('snakeBox') snakeBoxEls?: QueryList<ElementRef<HTMLElement>>;

  arrows = signal<{ d: string; fromIndex: number }[]>([]);

  connections = [
    { from: 0, to: 1, dir: 'right' as const },
    { from: 1, to: 2, dir: 'down' as const },
    { from: 2, to: 3, dir: 'left' as const },
    { from: 3, to: 4, dir: 'down' as const },
    { from: 4, to: 5, dir: 'right' as const }
  ];

  ngAfterViewInit() {
    setTimeout(() => this.calculateArrows(), 0);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => this.calculateArrows());
    }
    // Akış değişince kutu boyları da değişebiliyor (farklı rol/açıklama metinleri) — ViewChildren
    // güncellenince hemen yeniden hesapla, aksi halde bir önceki akışın ölçüleriyle çizilmiş
    // hafifçe kaymış oklar kısa süreliğine görünebiliyordu.
    this.snakeBoxEls?.changes.subscribe(() => this.calculateArrows());
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateArrows();
  }

  calculateArrows() {
    if (!this.snakeGrid || !this.snakeBoxEls) return;
    const boxes = this.snakeBoxEls.toArray();
    if (boxes.length < 6) return;

    const wrapperRect = this.snakeGrid.nativeElement.getBoundingClientRect();
    const rel = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - wrapperRect.left,
        right: r.right - wrapperRect.left,
        top: r.top - wrapperRect.top,
        bottom: r.bottom - wrapperRect.top,
        centerX: r.left - wrapperRect.left + r.width / 2,
        centerY: r.top - wrapperRect.top + r.height / 2
      };
    };

    const b = boxes.map(box => rel(box.nativeElement));

    const paths = this.connections.map(c => {
      const from = b[c.from];
      const to = b[c.to];
      let x1: number, y1: number, x2: number, y2: number;
      if (c.dir === 'right') {
        x1 = from.right; y1 = from.centerY;
        x2 = to.left; y2 = to.centerY;
      } else if (c.dir === 'left') {
        x1 = from.left; y1 = from.centerY;
        x2 = to.right; y2 = to.centerY;
      } else {
        x1 = from.centerX; y1 = from.bottom;
        x2 = to.centerX; y2 = to.top;
      }
      return {
        d: `M ${x1} ${y1} L ${x2} ${y2}`,
        fromIndex: c.from
      };
    });

    this.arrows.set(paths);
  }

  // O an aktif katmanın düz Türkçe açıklaması (tek, canlı güncellenen başlık)
  currentNodeExplain = computed(() => {
    const s = this.step();
    const nodes = this.activeFlow().nodes;
    const idx = s - this.firstNodeStep;
    if (idx >= 0 && idx < nodes.length) {
      return nodes[idx];
    }
    return null;
  });

  // 0 = boşta, 1 = kullanıcı arayüzde eylemi yaptı, 2..(1+n) = sırasıyla her katman aktif, son = başarı
  step = signal(0);
  playing = signal(false);
  paused = signal(false);
  introStarted = signal(false);

  readonly firstNodeStep = 2;
  totalSteps = computed(() => this.firstNodeStep + this.activeFlow().nodes.length);

  private timer: any;
  private tickFn: (() => void) | null = null;

  flowShortName(name: string): string {
    return name.replace(/^\d+\.\s*/, '');
  }

  selectFlow(id: string) {
    if (this.playing()) return;
    this.activeFlowId.set(id);
    this.menuOpen.set(false);
    this.reset();
    // Düğüm id'leri akışlar arasında aynı kalıyor (sadece metin değişiyor), bu yüzden
    // snakeBoxEls.changes tetiklenmez — boyu güncel metne göre yeniden ölçmek için doğrudan çağır.
    setTimeout(() => this.calculateArrows(), 50);
  }

  // Kullanıcı ekrandaki gerçek hedefe (nav öğesi, buton, etiket…) tıklayınca akışı başlatır.
  // Sonrasındaki arka plan adımları (backend işlem süresi) otomatik ilerler. Adımlar arası süre
  // bilinçli olarak yavaş tutuldu ki her katman tane tane takip edilebilsin.
  readonly stepDelayMs = 1800;

  triggerStart() {
    if (this.step() !== 0 || this.playing()) return;
    this.playing.set(true);
    this.paused.set(false);
    this.step.set(1);

    const total = this.totalSteps();
    let current = 1;
    this.tickFn = () => {
      current++;
      this.step.set(current);
      if (current < total) {
        this.timer = setTimeout(this.tickFn!, this.stepDelayMs);
      } else {
        this.playing.set(false);
        this.tickFn = null;
      }
    };
    this.timer = setTimeout(this.tickFn, this.stepDelayMs);
  }

  togglePause() {
    if (!this.playing()) return;
    if (this.paused()) {
      this.paused.set(false);
      if (this.tickFn) this.timer = setTimeout(this.tickFn, this.stepDelayMs);
    } else {
      this.paused.set(true);
      if (this.timer) clearTimeout(this.timer);
    }
  }

  onNavItemClick(item: string) {
    if (item === this.activeFlow().navItem) {
      this.triggerStart();
    }
  }

  startIntro() {
    this.introStarted.set(true);
  }

  reset() {
    if (this.timer) clearTimeout(this.timer);
    this.tickFn = null;
    this.playing.set(false);
    this.paused.set(false);
    this.introStarted.set(false);
    this.step.set(0);
  }

  isNodeActive(i: number): boolean {
    return this.step() === this.firstNodeStep + i;
  }

  isNodeDone(i: number): boolean {
    return this.step() > this.firstNodeStep + i;
  }

  isConnectorActive(i: number): boolean {
    const s = this.step();
    return s === this.firstNodeStep + i || s === this.firstNodeStep + i + 1;
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}
