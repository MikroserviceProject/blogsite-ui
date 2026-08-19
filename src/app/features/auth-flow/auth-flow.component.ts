import { Component, OnDestroy, AfterViewInit, HostListener, signal, computed, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FlowNode {
  id: string;
  label: string;
  role: string;
  explain: string;
  technical?: string;
  layer: string; // Frontend / Backend / Veritabanı — renkli zemin grubunu belirler
}

interface DemoFlow {
  id: string;
  name: string;
  screenType: 'form' | 'detail' | 'social';
  screenLabel: string;
  opLabel: string;
  introExplain: string;
  nodes: FlowNode[];
  successExplain: string;
  navItem?: string;
  field1Label?: string;
  field2Label?: string;
  actionLabel?: string;
  actionDoneLabel?: string;
  screenTitle?: string;
  screenSubtitle?: string;
  screenBody?: string;
}

@Component({
  selector: 'app-auth-flow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-flow.component.html',
  styleUrl: './auth-flow.component.css'
})
export class AuthFlowComponent implements OnDestroy, AfterViewInit {

  navItems = ['Ana Sayfa', 'Giriş Yap', 'Kayıt Ol'];

  flows: DemoFlow[] = [
    {
      id: 'login',
      name: '1. Giriş Yap',
      screenType: 'form',
      screenLabel: '/login',
      opLabel: 'Giriş Yap',
      navItem: 'Giriş Yap',
      field1Label: 'E-posta',
      field2Label: 'Şifre',
      screenTitle: 'zeynep@example.com',
      screenBody: '••••••••',
      introExplain: "Kullanıcı navbardaki 'Giriş Yap' linkine tıkladı.",
      nodes: [
        { id: 'comp', label: 'LoginComponent.ts', layer: 'Frontend', role: 'E-posta ve şifre girilen giriş formunu yönetir', explain: 'Kullanıcı e-posta ve şifre ile giriş isteği gönderdi.', technical: 'login() → performLogin()' },
        { id: 'svc-fe', label: 'AuthService.ts', layer: 'Frontend', role: "Angular tarafında /api/auth adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP POST isteği geldi.", technical: 'login(credentials) → POST /api/auth/login' },
        { id: 'gateway', label: 'API Gateway', layer: 'Backend', role: 'Ocelot/YARP ile gelen isteği ilgili mikroservise yönlendiren geçit', explain: 'İstek önce API Gateway üzerinden geçer.', technical: 'Program.cs → RouteRequest()' },
        { id: 'mw', label: 'RequestLoggingMiddleware.cs', layer: 'Backend', role: "İstek Controller'a ulaşmadan önce çalışan loglama ara katmanı", explain: 'İstek loglanır ve bir sonraki katmana iletilir.', technical: 'InvokeAsync(HttpContext context)' },
        { id: 'ctrl', label: 'AuthController.cs', layer: 'Backend', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı, Controller karşıladı.", technical: 'Login(LoginRequestDto dto)' },
        { id: 'svc-be', label: 'AuthService.cs', layer: 'Backend', role: 'Giriş iş kurallarını yürüten ana servis katmanı', explain: "İstek doğrulama ve token üretim adımlarına devredilir.", technical: 'LoginAsync(dto)' },
        { id: 'pw-hasher', label: 'PasswordHasher.cs', layer: 'Backend', role: 'Şifreleri güvenli şekilde karşılaştıran yardımcı sınıf', explain: 'Girilen şifre, veritabanındaki hash ile karşılaştırılır.', technical: 'VerifyPassword(hash, pass)' },
        { id: 'jwt-svc', label: 'JwtService.cs', layer: 'Backend', role: 'İmzalı JWT erişim token\'ı üreten yardımcı sınıf', explain: 'Şifre doğrulanınca imzalı bir JWT üretilir.', technical: 'GenerateToken(user)' },
        { id: 'repo', label: 'UnitOfWork.cs', layer: 'Veritabanı', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Kullanıcı kaydı e-posta ile veritabanında aranır.', technical: 'GetByIdAsync() → SELECT' },
        { id: 'db', label: 'PostgreSQL', layer: 'Veritabanı', role: 'Kullanıcı hesaplarının kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Veritabanı, eşleşen kullanıcı satırını döner.', technical: 'Users tablosu' }
      ],
      successExplain: 'JWT token üretildi, kullanıcı giriş yaptı.'
    },
    {
      id: 'register',
      name: '2. Kayıt Ol',
      screenType: 'form',
      screenLabel: '/register',
      opLabel: 'Kayıt Ol',
      navItem: 'Kayıt Ol',
      field1Label: 'Kullanıcı Adı',
      field2Label: 'E-posta',
      screenTitle: 'ahmet_yilmaz',
      screenBody: 'ahmet@example.com',
      introExplain: "Kullanıcı navbardaki 'Kayıt Ol' linkine tıkladı.",
      nodes: [
        { id: 'comp', label: 'RegisterComponent.ts', layer: 'Frontend', role: 'Yeni kullanıcı kaydı formunu yönetir', explain: "Kullanıcı bilgilerini doldurup 'Kayıt Ol' dedi.", technical: 'register() → onSubmit()' },
        { id: 'svc-fe', label: 'AuthService.ts', layer: 'Frontend', role: "Angular tarafında /api/auth adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP POST isteği geldi.", technical: 'register(dto) → POST /api/auth/register' },
        { id: 'gateway', label: 'API Gateway', layer: 'Backend', role: 'Ocelot/YARP ile gelen isteği ilgili mikroservise yönlendiren geçit', explain: 'İstek önce API Gateway üzerinden geçer.', technical: 'Program.cs → RouteRequest()' },
        { id: 'mw', label: 'RequestLoggingMiddleware.cs', layer: 'Backend', role: "İstek Controller'a ulaşmadan önce çalışan loglama ara katmanı", explain: 'İstek loglanır ve bir sonraki katmana iletilir.', technical: 'InvokeAsync(HttpContext context)' },
        { id: 'ctrl', label: 'AuthController.cs', layer: 'Backend', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı, Controller karşıladı.", technical: 'Register(RegisterRequestDto dto)' },
        { id: 'svc-be', label: 'AuthService.cs', layer: 'Backend', role: 'Yeni kullanıcı kaydı oluşturan ana servis katmanı', explain: 'Şifre hashlenir, yeni User Entity oluşturulur.', technical: 'RegisterAsync(dto)' },
        { id: 'pw-hasher', label: 'PasswordHasher.cs', layer: 'Backend', role: 'Şifreleri güvenli şekilde hashleyen yardımcı sınıf', explain: 'Girilen şifre BCrypt ile hashlenir.', technical: 'HashPassword(pass)' },
        { id: 'email-svc', label: 'SmtpEmailService.cs', layer: 'Backend', role: 'Hesap onay e-postası gönderen yardımcı sınıf', explain: 'Kayıt sonrası onay e-postası gönderilir.', technical: 'SendConfirmationEmail()' },
        { id: 'repo', label: 'UnitOfWork.cs', layer: 'Veritabanı', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'Yeni kullanıcı kaydı veritabanına eklenir.', technical: 'AddAsync(entity) → INSERT' },
        { id: 'db', label: 'PostgreSQL', layer: 'Veritabanı', role: 'Kullanıcı hesaplarının kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Kayıt veritabanına kalıcı olarak yazılır.', technical: 'Users tablosu' }
      ],
      successExplain: 'Kayıt tamamlandı, kullanıcı sisteme eklendi.'
    },
    {
      id: 'forgot-password',
      name: '3. Şifremi Unuttum',
      screenType: 'form',
      screenLabel: '/forgot-password',
      opLabel: 'Şifremi Unuttum',
      field1Label: 'E-posta',
      screenTitle: 'zeynep@example.com',
      introExplain: "Kullanıcı 'Şifremi Unuttum' linkine tıklayıp e-postasını girdi.",
      nodes: [
        { id: 'comp', label: 'ForgotPasswordComponent.ts', layer: 'Frontend', role: 'Şifre sıfırlama talebi formunu yönetir', explain: 'Kullanıcı kayıtlı e-postasını girip sıfırlama istedi.', technical: 'forgotPassword() → onSubmit()' },
        { id: 'svc-fe', label: 'AuthService.ts', layer: 'Frontend', role: "Angular tarafında /api/auth adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP POST isteği geldi.", technical: 'forgotPassword(email) → POST /api/auth/forgot-password' },
        { id: 'gateway', label: 'API Gateway', layer: 'Backend', role: 'Ocelot/YARP ile gelen isteği ilgili mikroservise yönlendiren geçit', explain: 'İstek önce API Gateway üzerinden geçer.', technical: 'Program.cs → RouteRequest()' },
        { id: 'mw', label: 'RequestLoggingMiddleware.cs', layer: 'Backend', role: "İstek Controller'a ulaşmadan önce çalışan loglama ara katmanı", explain: 'İstek loglanır ve bir sonraki katmana iletilir.', technical: 'InvokeAsync(HttpContext context)' },
        { id: 'ctrl', label: 'AuthController.cs', layer: 'Backend', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı, Controller karşıladı.", technical: 'ForgotPassword(dto)' },
        { id: 'svc-be', label: 'AuthService.cs', layer: 'Backend', role: 'Sıfırlama linki üretim sürecini yöneten ana servis katmanı', explain: 'İstek doğrulanıp sıfırlama sürecine devredilir.', technical: 'ForgotPasswordAsync(email)' },
        { id: 'jwt-svc', label: 'JwtService.cs', layer: 'Backend', role: "Tek kullanımlık sıfırlama token'ı üreten yardımcı sınıf", explain: "Tek kullanımlık bir sıfırlama token'ı üretilir.", technical: 'GenerateToken(user)' },
        { id: 'email-svc', label: 'SmtpEmailService.cs', layer: 'Backend', role: 'Sıfırlama linkini e-posta ile gönderen yardımcı sınıf', explain: 'Sıfırlama linki kullanıcının e-postasına gönderilir.', technical: 'SendEmailAsync(to, subject, body)' },
        { id: 'repo', label: 'UnitOfWork.cs', layer: 'Veritabanı', role: 'Entity Framework üzerinden veritabanına SQL sorguları gönderen katman', explain: 'E-posta adresiyle kullanıcı kaydı aranır.', technical: 'GetByIdAsync() → SELECT' },
        { id: 'db', label: 'PostgreSQL', layer: 'Veritabanı', role: 'Kullanıcı hesaplarının kalıcı olarak saklandığı ilişkisel veritabanı', explain: 'Veritabanı, eşleşen kullanıcıyı döner.', technical: 'Users tablosu' }
      ],
      successExplain: 'Sıfırlama linki e-postayla gönderildi.'
    },
    {
      id: 'follow-user',
      name: '4. Takip Etme',
      screenType: 'social',
      screenLabel: '/profile/zeynep_dev',
      opLabel: 'Takip Etme',
      actionLabel: 'Takip Et',
      actionDoneLabel: 'Takip Edildi',
      screenTitle: 'zeynep_dev',
      screenSubtitle: '128 takipçi · 94 takip',
      introExplain: "Kullanıcı bir profile girip 'Takip Et' butonuna bastı.",
      nodes: [
        { id: 'comp', label: 'PublicProfileComponent.ts', layer: 'Frontend', role: 'Ziyaret edilen kullanıcının profilini ve takip durumunu gösterir', explain: "Kullanıcı 'Takip Et' butonuna bastı.", technical: 'toggleFollow() → followUser()' },
        { id: 'svc-fe', label: 'SocialService.ts', layer: 'Frontend', role: "Angular tarafında /api/social adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP POST isteği geldi.", technical: 'followUser(followingId) → POST /api/social/follow/{followingId}' },
        { id: 'ctrl', label: 'SocialController.cs', layer: 'Backend', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı: [Authorize] kontrolünden geçti.", technical: 'FollowUser(followingId)' },
        { id: 'svc-be', label: 'SocialService.cs', layer: 'Backend', role: 'Takip ilişkisini oluşturan iş mantığı katmanı', explain: 'Kendini takip etme ve zaten takip ediliyor olma durumları kontrol edilir.', technical: 'FollowUserAsync(followerId, followingId)' },
        { id: 'dbctx', label: 'SocialDbContext.cs', layer: 'Veritabanı', role: 'Entity Framework üzerinden veritabanına doğrudan erişen katman', explain: 'Yeni FollowRelation kaydı eklenir.', technical: 'SaveChangesAsync() → INSERT' },
        { id: 'db', label: 'PostgreSQL', layer: 'Veritabanı', role: "Takip ilişkilerinin saklandığı ayrı bir veritabanı (SocialDb)", explain: 'Veritabanı, yeni takip kaydını saklar.', technical: 'FollowRelations tablosu' }
      ],
      successExplain: 'Takip ilişkisi kaydedildi, takipçi sayısı arttı.'
    },
    {
      id: 'unfollow-user',
      name: '5. Takibi Bırakma',
      screenType: 'social',
      screenLabel: '/profile/mehmet_kaya',
      opLabel: 'Takibi Bırakma',
      actionLabel: 'Takibi Bırak',
      actionDoneLabel: 'Takipten Çıkıldı',
      screenTitle: 'mehmet_kaya',
      screenSubtitle: '312 takipçi · 45 takip',
      introExplain: "Kullanıcı zaten takip ettiği birinde 'Takibi Bırak' butonuna bastı.",
      nodes: [
        { id: 'comp', label: 'PublicProfileComponent.ts', layer: 'Frontend', role: 'Ziyaret edilen kullanıcının profilini ve takip durumunu gösterir', explain: "Kullanıcı 'Takibi Bırak' butonuna bastı.", technical: 'toggleFollow() → unfollowUser()' },
        { id: 'svc-fe', label: 'SocialService.ts', layer: 'Frontend', role: "Angular tarafında /api/social adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP POST isteği geldi.", technical: 'unfollowUser(followingId) → POST /api/social/unfollow/{followingId}' },
        { id: 'ctrl', label: 'SocialController.cs', layer: 'Backend', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı: [Authorize] kontrolünden geçti.", technical: 'UnfollowUser(followingId)' },
        { id: 'svc-be', label: 'SocialService.cs', layer: 'Backend', role: 'Takip ilişkisini kaldıran iş mantığı katmanı', explain: 'Var olan takip kaydı bulunur.', technical: 'UnfollowUserAsync(followerId, followingId)' },
        { id: 'dbctx', label: 'SocialDbContext.cs', layer: 'Veritabanı', role: 'Entity Framework üzerinden veritabanına doğrudan erişen katman', explain: 'İlgili FollowRelation kaydı kaldırılır.', technical: 'SaveChangesAsync() → DELETE' },
        { id: 'db', label: 'PostgreSQL', layer: 'Veritabanı', role: "Takip ilişkilerinin saklandığı ayrı bir veritabanı (SocialDb)", explain: 'Veritabanından takip kaydı silinir.', technical: 'FollowRelations tablosu' }
      ],
      successExplain: 'Takip ilişkisi kaldırıldı, takipçi sayısı azaldı.'
    },
    {
      id: 'follow-stats',
      name: '6. Takip İstatistikleri',
      screenType: 'detail',
      screenLabel: '/profile/zeynep_dev',
      opLabel: 'Takip İstatistikleri',
      screenTitle: 'zeynep_dev',
      screenSubtitle: 'Yazılım Geliştirici',
      screenBody: 'Takipçi: 128 · Takip Edilen: 94 · Üye: Mart 2025',
      introExplain: 'Profil sayfası açıldı, takipçi/takip sayıları isteniyor.',
      nodes: [
        { id: 'comp', label: 'PublicProfileComponent.ts', layer: 'Frontend', role: 'Ziyaret edilen kullanıcının profilini ve istatistiklerini gösterir', explain: 'Profil sayfası açılınca takipçi/takip sayıları istendi.', technical: 'loadStats() → ngOnInit()' },
        { id: 'svc-fe', label: 'SocialService.ts', layer: 'Frontend', role: "Angular tarafında /api/social adresine HTTP istekleri atan servis katmanı", explain: "Frontend'den HTTP GET isteği geldi.", technical: 'getUserStats(userId) → GET /api/social/stats/{userId}' },
        { id: 'ctrl', label: 'SocialController.cs', layer: 'Backend', role: ".NET tarafında gelen HTTP isteklerini karşılayıp ilgili işlemi başlatan API controller'ı", explain: "İstek API'ye ulaştı, Controller karşıladı.", technical: 'GetStats(userId)' },
        { id: 'svc-be', label: 'SocialService.cs', layer: 'Backend', role: 'Takipçi ve takip edilen sayısını hesaplayan iş mantığı katmanı', explain: 'Takipçi ve takip edilen sayıları hesaplanır.', technical: 'GetUserStatsAsync(userId)' },
        { id: 'dbctx', label: 'SocialDbContext.cs', layer: 'Veritabanı', role: 'Entity Framework üzerinden veritabanına doğrudan erişen katman', explain: 'FollowRelations tablosunda sayım sorguları çalıştırılır.', technical: 'COUNT() sorguları' },
        { id: 'db', label: 'PostgreSQL', layer: 'Veritabanı', role: "Takip ilişkilerinin saklandığı ayrı bir veritabanı (SocialDb)", explain: 'Veritabanı, takipçi ve takip sayılarını döner.', technical: 'FollowRelations tablosu' }
      ],
      successExplain: 'Takipçi ve takip sayıları ekrana geldi.'
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

  flowShortName(name: string): string {
    return name.replace(/^\d+\.\s*/, '');
  }

  // Yılan (zigzag) düzeni: 2 sütun, kutu sırasına göre satır/sütun konumu (herhangi bir kutu sayısı için).
  gridPos(i: number): { row: number; col: number } {
    const rowIndex = Math.floor(i / 2);
    const isEvenRow = rowIndex % 2 === 0;
    const posInRow = i % 2;
    return { row: rowIndex + 1, col: isEvenRow ? posInRow + 1 : 2 - posInRow };
  }

  // Ardışık aynı katmandaki kutuları tek bir renkli zeminde (satır aralığında) grupla.
  nodeBands = computed(() => {
    const nodes = this.activeFlow().nodes;
    const bands: { layer: string; startRow: number; endRow: number; colorClass: string }[] = [];
    const layerColorIndex = new Map<string, number>();

    for (let i = 0; i < nodes.length; i++) {
      const layer = nodes[i].layer;
      const row = this.gridPos(i).row;
      const last = bands[bands.length - 1];
      if (last && last.layer === layer) {
        last.endRow = row;
      } else {
        if (!layerColorIndex.has(layer)) {
          layerColorIndex.set(layer, (layerColorIndex.size % 3) + 1);
        }
        bands.push({ layer, startRow: row, endRow: row, colorClass: 'snake-band-' + layerColorIndex.get(layer) });
      }
    }
    return bands;
  });

  @ViewChild('snakeGrid') snakeGrid?: ElementRef<HTMLElement>;
  @ViewChildren('snakeBox') snakeBoxEls?: QueryList<ElementRef<HTMLElement>>;

  arrows = signal<{ d: string; fromIndex: number }[]>([]);

  ngAfterViewInit() {
    setTimeout(() => this.calculateArrows(), 0);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => this.calculateArrows());
    }
    // Akış değişince kutu sayısı da değişebiliyor (10 vs 6 düğüm) — ViewChildren güncellenince
    // hemen yeniden hesapla (DOM bu noktada zaten güncel), aksi halde eski kutu sayısıyla
    // hesaplanmış yanlış sayıda ok kısa süreliğine görünebiliyordu.
    this.snakeBoxEls?.changes.subscribe(() => this.calculateArrows());
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateArrows();
  }

  calculateArrows() {
    if (!this.snakeGrid || !this.snakeBoxEls) return;
    const boxes = this.snakeBoxEls.toArray();
    const n = boxes.length;
    if (n < 2) { this.arrows.set([]); return; }

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

    // Yılan düzenindeki her ardışık çift arasındaki bağlantı yönünü satır konumuna göre hesapla.
    const connections: { from: number; to: number; dir: 'right' | 'left' | 'down' }[] = [];
    for (let i = 0; i < n - 1; i++) {
      const rowA = Math.floor(i / 2);
      const rowB = Math.floor((i + 1) / 2);
      if (rowA === rowB) {
        const isEvenRow = rowA % 2 === 0;
        connections.push({ from: i, to: i + 1, dir: isEvenRow ? 'right' : 'left' });
      } else {
        connections.push({ from: i, to: i + 1, dir: 'down' });
      }
    }

    const paths = connections.map(c => {
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

  selectFlow(id: string) {
    if (this.playing()) return;
    this.activeFlowId.set(id);
    this.menuOpen.set(false);
    this.reset();
    // Kutu sayısı değişince snakeBoxEls.changes tetiklenir; aynı id kümesine sahip akışlar arasında
    // (ör. üç Social akışı) değişmeyeceği için burada da doğrudan bir yedek çağrı yapılır.
    setTimeout(() => this.calculateArrows(), 50);
  }

  // Kullanıcı ekrandaki gerçek hedefe (nav öğesi, buton…) tıklayınca akışı başlatır.
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
