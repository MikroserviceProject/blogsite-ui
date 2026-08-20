export interface NodeDetail {
  id: string;
  title: string;
  description: string;
  methods?: { name: string; desc: string }[];
  properties?: { name: string; type: string; desc: string }[];
}

export const NODE_DETAILS: Record<string, NodeDetail> = {
  // --- FRONTEND COMPONENTS ---
  'forgot-password-comp': {
    id: 'forgot-password-comp',
    title: 'ForgotPasswordComponent',
    description: 'Kullanıcının şifresini unuttuğu durumlarda kayıtlı e-posta adresini girerek şifre sıfırlama talebinde bulunduğu ekran bileşeni.',
    methods: [
      { name: 'onSubmit()', desc: 'Form geçerli ise AuthService üzerinden şifre sıfırlama maili gönderilmesini talep eder.' },
      { name: 'getErrorMessage()', desc: 'Email input alanındaki validasyon (geçersiz mail vb.) hatalarını döndürür.' }
    ]
  },
  'login-comp': {
    id: 'login-comp',
    title: 'LoginComponent',
    description: 'Kullanıcı giriş işlemlerinin (Authentication) yapıldığı ana ekran. JWT token bu ekran aracılığıyla elde edilir.',
    methods: [
      { name: 'login()', desc: 'Email ve şifre ile giriş isteği atar, başarılıysa tokenı local storage\'a kaydeder.' },
      { name: 'togglePasswordVisibility()', desc: 'Şifre alanının görünürlüğünü (gizli/açık) değiştirir.' }
    ]
  },
  'profile-comp': {
    id: 'profile-comp',
    title: 'ProfileComponent',
    description: 'Kullanıcının kendi profil bilgilerini görüntüleyip güncelleyebildiği kişisel dashboard.',
    methods: [
      { name: 'loadProfile()', desc: 'API\'den kullanıcının mevcut profil verilerini çeker.' },
      { name: 'updateProfile()', desc: 'Formdaki yeni verileri ProfileRequestDto ile backend\'e yollar.' }
    ]
  },
  'users-management-comp': {
    id: 'users-management-comp',
    title: 'UsersManagementComponent',
    description: 'Admin paneli üzerinden sistemdeki tüm kullanıcıların listelendiği, yetkilerinin (Rol) değiştirilebildiği veya banlanabildiği yönetim ekranı.',
    methods: [
      { name: 'loadUsers()', desc: 'Tüm kullanıcıları backend üzerinden sayfalamalı (pagination) olarak getirir.' },
      { name: 'changeRole()', desc: 'Seçili kullanıcının rolünü (Admin/User/Author) günceller.' }
    ]
  },
  'register-comp': {
    id: 'register-comp',
    title: 'RegisterComponent',
    description: 'Sisteme yeni kullanıcı kaydetme (Kayıt Ol) formu.',
    methods: [
      { name: 'register()', desc: 'Form verilerini doğrular ve RegisterRequestDto ile backend\'e POST atar.' }
    ]
  },
  'author-approvals-comp': {
    id: 'author-approvals-comp',
    title: 'AuthorApprovalsComponent',
    description: 'Yazarlık (Author) talebinde bulunan kullanıcıların Admin tarafından onaylanıp reddedildiği ekran.',
    methods: [
      { name: 'approveAuthor()', desc: 'Kullanıcının yazarlık talebini onaylar ve rolünü Author yapar.' },
      { name: 'rejectAuthor()', desc: 'Yazarlık talebini reddeder.' }
    ]
  },
  'reset-password-comp': {
    id: 'reset-password-comp',
    title: 'ResetPasswordComponent',
    description: 'Mail üzerinden gelen linke tıklanarak ulaşılan yeni şifre belirleme ekranı.',
    methods: [
      { name: 'resetPassword()', desc: 'URL\'den gelen Token ile kullanıcının girdiği yeni şifreyi birleştirip API\'ye gönderir.' }
    ]
  },
  'confirm-email-comp': {
    id: 'confirm-email-comp',
    title: 'ConfirmEmailComponent',
    description: 'Kullanıcının mail adresine gelen doğrulama linkine tıkladığında yönlendirildiği sayfa.',
    methods: [
      { name: 'verifyToken()', desc: 'URL\'deki token parametresini alıp backend\'de doğrular.' }
    ]
  },
  'blog-detail-comp': {
    id: 'blog-detail-comp',
    title: 'BlogDetailComponent',
    description: 'Seçilen bir blog yazısının içeriğinin, görsellerinin ve yorumlarının görüntülendiği okuma sayfası.',
    methods: [
      { name: 'loadPost()', desc: 'Blog yazısının detaylarını SEO uyumlu URL (Slug) üzerinden getirir.' }
    ]
  },
  'blog-home-comp': {
    id: 'blog-home-comp',
    title: 'BlogHomeComponent',
    description: 'Ana sayfada son eklenen, en çok okunan blog yazılarının kartlar halinde listelendiği vitrin ekranı.',
    methods: [
      { name: 'getLatestPosts()', desc: 'Son yayınlanan makaleleri çeker.' }
    ]
  },
  'post-create-comp': {
    id: 'post-create-comp',
    title: 'PostCreateComponent',
    description: 'Yazar (Author) yetkisi olan kullanıcıların yeni bir blog yazısı oluşturduğu editör (WYSIWYG) ekranı.',
    methods: [
      { name: 'saveDraft()', desc: 'Yazıyı taslak olarak kaydeder.' },
      { name: 'publishPost()', desc: 'Yazıyı yayınlanmak üzere sisteme kaydeder.' }
    ]
  },
  
  // --- FRONTEND SERVICES ---
  'auth-service-fe': {
    id: 'auth-service-fe',
    title: 'AuthService (Frontend)',
    description: 'Angular tarafındaki kimlik doğrulama, token yönetimi ve oturum işlemlerini yürüten merkezi servis.',
    methods: [
      { name: 'login(credentials)', desc: 'Giriş işlemini API\'ye iletir ve JWT\'yi yakalar.' },
      { name: 'logout()', desc: 'Lokal tokenları temizler ve oturumu kapatır.' },
      { name: 'getToken()', desc: 'Mevcut JWT tokenı döndürür (Interceptor\'lar kullanır).' },
      { name: 'isLoggedIn()', desc: 'Token geçerlilik süresini kontrol edip boolean döner.' }
    ]
  },
  'blog-service-fe': {
    id: 'blog-service-fe',
    title: 'BlogService (Frontend)',
    description: 'Blog içeriklerini getirme, yeni yazı oluşturma, kategori filtreleme gibi veri işlemlerini yapan Angular servisi.',
    methods: [
      { name: 'getAllPosts()', desc: 'Tüm aktif yazıları listeler.' },
      { name: 'getPostBySlug()', desc: 'Detay sayfası için ilgili yazıyı getirir.' }
    ]
  },
  'toast-service': {
    id: 'toast-service',
    title: 'ToastNotificationService',
    description: 'Sistemde başarılı giriş, hatalı şifre, kayıt başarılı gibi kısa süreli uyarı mesajlarını (Toast/Snackbar) gösterir.',
    methods: [
      { name: 'showSuccess(message)', desc: 'Yeşil renkli başarı bildirimi çıkarır.' },
      { name: 'showError(message)', desc: 'Kırmızı renkli hata bildirimi çıkarır.' }
    ]
  },

  // --- BACKEND API & GATEWAY ---
  'gateway-group': {
    id: 'gateway-group',
    title: 'API Gateway (Ocelot/Yarp)',
    description: 'Tüm Frontend isteklerini karşılayan ve ilgili mikro servislere (veya Monolith modüllere) yönlendiren geçit. Rate Limiting ve Load Balancing burada yapılabilir.',
    methods: [
      { name: 'RouteRequest()', desc: 'Gelen URL\'i analiz edip Downstream API\'ye iletir.' }
    ]
  },
  'api-middlewares': {
    id: 'api-middlewares',
    title: 'Global Middlewares',
    description: 'Tüm API istekleri Controller\'a düşmeden önce çalışan ara katmanlar (Exception Handling, Logging, JWT Validation).',
    methods: [
      { name: 'ExceptionMiddleware', desc: 'Uygulama çöktüğünde hatayı yakalayıp düzgün bir ApiResponseDto döner.' },
      { name: 'JwtMiddleware', desc: 'Request Header\'daki Bearer Token\'ı çözümler.' }
    ]
  },
  'auth-ctrl': {
    id: 'auth-ctrl',
    title: 'AuthController',
    description: 'Kimlik doğrulama, kayıt, şifre sıfırlama, mail doğrulama gibi tüm kullanıcı erişim işlemlerinin API uç noktası (Endpoint).',
    methods: [
      { name: '[POST] /login', desc: 'Kullanıcı girişi yapar.' },
      { name: '[POST] /register', desc: 'Yeni kullanıcı kaydeder.' },
      { name: '[POST] /refresh-token', desc: 'Süresi dolan JWT\'yi yeniler.' }
    ]
  },
  'admin-ctrl': {
    id: 'admin-ctrl',
    title: 'AdminController',
    description: 'Sadece Admin rolüne sahip kullanıcıların erişebildiği; rol atama, sistem istatistikleri ve genel ayarlar için endpointler.',
    methods: [
      { name: '[GET] /users', desc: 'Sistemdeki tüm kullanıcıları çeker.' },
      { name: '[POST] /assign-role', desc: 'Kullanıcıya özel yetki atar.' }
    ]
  },
  'user-ctrl': {
    id: 'user-ctrl',
    title: 'UserProfileController',
    description: 'Kullanıcının kendi bilgilerini (isim, bio, avatar) yönetebildiği özel uç noktalar.',
    methods: [
      { name: '[GET] /me', desc: 'O an giriş yapmış (Token sahibi) kullanıcının profil detaylarını döner.' },
      { name: '[PUT] /update', desc: 'Profil güncellemelerini alır.' }
    ]
  },
  'ext-group': {
    id: 'ext-group',
    title: 'External Services',
    description: 'Projenin dış dünya ile bağlantı kurduğu 3. parti entegrasyonların ortak noktası (Cloud Storage, Payment, SMS vb.)'
  },
  'gw-program': {
    id: 'gw-program',
    title: 'Program.cs (API Gateway)',
    description: 'Ocelot veya YARP gibi API Gateway araçlarının yapılandırıldığı ve ayağa kaldırıldığı başlangıç dosyası.',
    methods: [
      { name: 'AddOcelot()', desc: 'Ocelot servislerini IoC container\'a ekler.' },
      { name: 'UseOcelot().Wait()', desc: 'Gelen HTTP isteklerini alıp mikroservislere yönlendiren ara katmanı başlatır.' }
    ]
  },
  'api-program': {
    id: 'api-program',
    title: 'Program.cs (API)',
    description: 'Ana Web API projesinin (Monolith veya Microservice) başladığı yer. Dependency Injection (DI) ayarları ve Middleware sırası burada belirlenir.',
    methods: [
      { name: 'Main(string[] args)', desc: 'Uygulama yaşam döngüsünü (Kestrel Server) başlatır.' }
    ]
  },
  'mw-ban': {
    id: 'mw-ban',
    title: 'BanCheckMiddleware',
    description: 'Sistemden banlanmış bir kullanıcının Token ile işlem yapmaya çalışması durumunda isteği engelleyen (Short-Circuit) ara katman.',
    methods: [
      { name: 'InvokeAsync(HttpContext context)', desc: 'İstek API uç noktasına ulaşmadan araya girerek Session veya Token üzerinden kullanıcının yasaklı olup olmadığını kontrol eder.' }
    ]
  },
  'mw-log': {
    id: 'mw-log',
    title: 'RequestLoggingMiddleware',
    description: 'Sisteme gelen her HTTP isteğini, IP adresini ve cevap sürelerini performans takibi için (Serilog vb. ile) kaydeden ara katman.',
    methods: [
      { name: 'InvokeAsync(HttpContext context)', desc: 'Gelen isteğin gövdesini (Body) okur, Stopwatch ile süreyi tutar ve işlemi veritabanına/log dosyasına yazar.' }
    ]
  },
  'api-extensions': {
    id: 'api-extensions',
    title: 'Extensions (Genişletmeler)',
    description: 'Program.cs dosyasını temiz tutmak için DI (Dependency Injection) işlemlerinin dışarıya (başka dosyalara) taşındığı C# Extension metodları.'
  },
  'ext-db': {
    id: 'ext-db',
    title: 'DatabaseExtensions.cs',
    description: 'Veritabanı bağlantı metinlerini (Connection String) ve Entity Framework servislerini IServiceCollection içerisine ekler.',
    methods: [
      { name: 'AddDatabaseConfiguration()', desc: 'PostgreSQL yapılandırmalarını ve DbContext ayarlarını barındırır.' }
    ]
  },
  'ext-svc': {
    id: 'ext-svc',
    title: 'ServiceCollectionExtensions.cs',
    description: 'Uygulamadaki Business (AuthService vb.) servisleri Program.cs içerisine topluca (AddScoped/AddTransient) ekleyen genişletme.',
    methods: [
      { name: 'AddApplicationServices()', desc: 'Tüm Controller servislerini ve arka plan işlemlerini IoC (Inversion of Control) konteynerine kaydeder.' }
    ]
  },

  // --- BACKEND SERVICES (CORE) ---
  'auth-svc-be': {
    id: 'auth-svc-be',
    title: 'AuthService',
    description: 'Sistemin kalbi. Kimlik doğrulama algoritmaları, şifre kontrolleri ve iş kurallarının (Business Rules) bulunduğu asıl katman.',
    methods: [
      { name: 'LoginAsync(dto)', desc: 'User tablosundan kişiyi bulur, şifresini Hasher ile kıyaslar.' },
      { name: 'RegisterAsync(dto)', desc: 'Yeni User Entity oluşturur ve UnitOfWork ile veritabanına yazar.' },
      { name: 'ConfirmEmailAsync()', desc: 'Mail doğrulama tokenını kontrol eder ve User.IsConfirmed alanını true yapar.' }
    ]
  },
  'admin-svc-be': {
    id: 'admin-svc-be',
    title: 'AdminService',
    description: 'Admin operasyonlarının yürütüldüğü, yetkilendirme algoritmalarının olduğu arka plan servisi.',
    methods: [
      { name: 'ChangeUserRoleAsync()', desc: 'Bir kullanıcının rolünü güvenli bir şekilde değiştirir.' }
    ]
  },
  'user-svc-be': {
    id: 'user-svc-be',
    title: 'UserProfileService',
    description: 'Kullanıcının biyografi, profil fotoğrafı (Storage işlemleri) gibi verilerini yöneten servis.',
    methods: [
      { name: 'UpdateProfilePicture()', desc: 'Kullanıcıdan gelen resmi Cloud Storage\'a (örn: AWS S3) yükleyip linkini DB\'ye yazar.' }
    ]
  },
  'pw-hasher': {
    id: 'pw-hasher',
    title: 'PasswordHasher',
    description: 'Şifre güvenliği için kullanılan yardımcı sınıf (Utility).',
    methods: [
      { name: 'HashPassword(pass)', desc: 'Düz metin şifreyi BCrypt veya PBKDF2 ile kriptolar (Salt ekler).' },
      { name: 'VerifyPassword(hash, pass)', desc: 'Kriptolu şifre ile girilen şifrenin eşleşip eşleşmediğini doğrular.' }
    ]
  },
  'jwt-svc': {
    id: 'jwt-svc',
    title: 'JwtService',
    description: 'Token (Anahtar) üretim merkezidir.',
    methods: [
      { name: 'GenerateToken(user)', desc: 'Kullanıcının Rol ve ID bilgisini içeren imzalı bir JWT stringi döner.' },
      { name: 'ValidateToken(token)', desc: 'Sisteme gelen tokenın sahte olup olmadığını (Secret Key ile) doğrular.' }
    ]
  },
  'email-svc': {
    id: 'email-svc',
    title: 'SmtpEmailService',
    description: 'Kullanıcılara e-posta gönderiminden sorumlu SMTP aracı katman.',
    methods: [
      { name: 'SendEmailAsync(to, subject, body)', desc: 'Asenkron olarak mail yollar.' },
      { name: 'SendConfirmationEmail()', desc: 'Şablon (Template) kullanarak hesap onay maili yollar.' }
    ]
  },
  'mapping-prof': {
    id: 'mapping-prof',
    title: 'AutoMapperProfiles',
    description: 'Entity\'ler (Veritabanı Modelleri) ile DTO\'lar (Veri Taşıma Objeleri) arasında otomatik dönüşüm (Mapping) sağlayan konfigürasyon dosyalarıdır.',
    methods: [
      { name: 'CreateMap<User, UserDto>()', desc: 'Kullanıcı modelinden sadece public verilerin olduğu DTO\'ya dönüşüm kuralını belirler.' }
    ]
  },
  'ent-user': {
    id: 'ent-user',
    title: 'User (Entity)',
    description: 'Sistemde var olan kullanıcının temel özellikleri. .NET Identity yapısındaki IdentityUser sınıfını genişletir.',
    properties: [
      { name: 'Id', type: 'Guid', desc: 'Benzersiz kayıt numarası.' },
      { name: 'Email', type: 'string', desc: 'Kullanıcının e-posta adresi.' },
      { name: 'PasswordHash', type: 'string', desc: 'Kriptolanmış şifre.' },
      { name: 'IsConfirmed', type: 'bool', desc: 'Mail onay durumu.' }
    ]
  },
  'ent-appuser': {
    id: 'ent-appuser',
    title: 'AppUser (Entity)',
    description: 'Projenin özel iş mantıklarını (Biyografi, Sosyal Medya linkleri vb.) tutan genişletilmiş kullanıcı sınıfı.',
    properties: [
      { name: 'FirstName', type: 'string', desc: 'Ad.' },
      { name: 'LastName', type: 'string', desc: 'Soyad.' },
      { name: 'Bio', type: 'string', desc: 'Kısa hakkımda yazısı.' }
    ]
  },
  'ent-notif': {
    id: 'ent-notif',
    title: 'UserNotification (Entity)',
    description: 'Sistem tarafından kullanıcılara gönderilen site içi bildirimlerin tutulduğu veritabanı tablosu.',
    properties: [
      { name: 'Message', type: 'string', desc: 'Bildirim metni.' },
      { name: 'IsRead', type: 'bool', desc: 'Okundu bilgisi.' },
      { name: 'CreatedAt', type: 'DateTime', desc: 'Oluşturulma zamanı.' }
    ]
  },
  'entities-group': {
    id: 'entities-group',
    title: 'Entities (Domain Modelleri)',
    description: 'Veritabanı tablolarının C# tarafındaki nesne (OOP) karşılıkları.',
    properties: [
      { name: 'BaseEntity Özellikleri', type: 'Id, CreatedDate', desc: 'Tüm tablolarda ortak olan alanlar.' }
    ]
  },

  // --- DTOS (DATA TRANSFER OBJECTS) ---
  'dto-login': {
    id: 'dto-login',
    title: 'LoginRequestDto',
    description: 'Kullanıcı giriş yaparken API\'ye gönderilen veri paketi.',
    properties: [
      { name: 'Email', type: 'string', desc: 'Kullanıcının e-posta adresi (Gerekli).' },
      { name: 'Password', type: 'string', desc: 'Kullanıcının şifresi (Gerekli).' }
    ]
  },
  'dto-loginr': {
    id: 'dto-loginr',
    title: 'LoginResponseDto',
    description: 'Kullanıcı başarıyla giriş yaptığında API\'nin döndürdüğü veri.',
    properties: [
      { name: 'Token', type: 'string', desc: 'Erişim için kullanılacak JWT.' },
      { name: 'Expiration', type: 'DateTime', desc: 'Tokenın bitiş süresi.' }
    ]
  },
  'dto-confirm': {
    id: 'dto-confirm',
    title: 'ConfirmEmailDto',
    description: 'E-posta doğrulama işleminde gönderilen tokenları barındırır.',
    properties: [
      { name: 'UserId', type: 'Guid', desc: 'Doğrulanacak kullanıcının eşsiz kimliği.' },
      { name: 'Token', type: 'string', desc: 'Mailden gelen doğrulama anahtarı.' }
    ]
  },
  'dto-reg': {
    id: 'dto-reg',
    title: 'RegisterRequestDto',
    description: 'Yeni kayıt olan kişinin bilgilerini içerir.',
    properties: [
      { name: 'Username', type: 'string', desc: 'Sistemdeki görünen ad (Zorunlu).' },
      { name: 'Email', type: 'string', desc: 'Mail adresi.' },
      { name: 'Password', type: 'string', desc: 'Min 8 karakter, büyük-küçük harf içeren şifre.' },
      { name: 'PasswordConfirm', type: 'string', desc: 'Şifre tekrarı.' }
    ]
  },
  'dto-pass': {
    id: 'dto-pass',
    title: 'PasswordResetDto',
    description: 'Şifre sıfırlama işlemi için kullanılan veri taşıma objesi.',
    properties: [
      { name: 'Token', type: 'string', desc: 'Mail ile gönderilen sıfırlama kodu.' },
      { name: 'NewPassword', type: 'string', desc: 'Belirlenen yeni şifre.' }
    ]
  },
  'dto-admin': {
    id: 'dto-admin',
    title: 'AdminOperationsDto',
    description: 'Adminin kullanıcı veya sistem işlemlerini yaparken yolladığı payload grubu.',
    properties: [
      { name: 'UserId', type: 'int', desc: 'İşlem yapılacak kullanıcının kimliği.' },
      { name: 'Action', type: 'string', desc: 'Ban, Unban, RoleUpdate vb. işlemler.' },
      { name: 'Reason', type: 'string', desc: 'Adminin yaptığı işlemin açıklaması/nedeni.' }
    ]
  },
  'dto-api': {
    id: 'dto-api',
    title: 'ApiResponseDto',
    description: 'Tüm API cevaplarının ortak (Generic) döndüğü standart (Wrapper) obje formu.',
    properties: [
      { name: 'Data', type: 'T', desc: 'Asıl cevap içeriği.' },
      { name: 'IsSuccess', type: 'bool', desc: 'İşlemin başarı durumu.' },
      { name: 'Errors', type: 'List<string>', desc: 'Varsa hata mesajları.' }
    ]
  },
  'dto-author': {
    id: 'dto-author',
    title: 'AuthorRequestDto',
    description: 'Yazar olma talebi yollayan kullanıcının, motivasyonunu (niye yazar olmak istediğini) belirttiği DTO.'
  },
  'dto-cadmin': {
    id: 'dto-cadmin',
    title: 'ChangeAdminRoleDto',
    description: 'Rol değişim işlemi için hedef kullanıcının Id ve Rolünü taşıyan model.'
  },
  'dto-page': {
    id: 'dto-page',
    title: 'PaginationDto',
    description: 'Sonsuz scroll veya sayfalama işlemlerinde, kaçıncı sayfadan kaç adet veri istenildiğini belirtir.',
    properties: [
      { name: 'PageNumber', type: 'int', desc: 'Sayfa numarası (Örn: 1).' },
      { name: 'PageSize', type: 'int', desc: 'Sayfadaki eleman sayısı (Örn: 20).' }
    ]
  },
  'dto-pub': {
    id: 'dto-pub',
    title: 'PublicProfileDto',
    description: 'Herhangi bir kullanıcının başkası tarafından görünen (Private verilerden arındırılmış) profil hali.'
  },
  'dto-pubp': {
    id: 'dto-pubp',
    title: 'PublishPostDto',
    description: 'Yeni blog yazısı yayınlarken gönderilen içerik, başlık, yazar ve kategori verilerini tutar.'
  },
  'dto-resend': {
    id: 'dto-resend',
    title: 'ResendEmailDto',
    description: 'Doğrulama mailini alamamış olan kişilerin e-posta adresini girerek tekrar mail istediği form objesi.'
  },
  'dto-supp': {
    id: 'dto-supp',
    title: 'SupportTicketDto',
    description: 'Sistem hatalarını veya istekleri yönetime bildirmek için açılan destek talebi içeriği.'
  },
  'dto-upd': {
    id: 'dto-upd',
    title: 'UpdateProfileDto',
    description: 'Kullanıcının adını, bio\'sunu vb. güncellerken gönderdiği yapı.'
  },
  'dto-user': {
    id: 'dto-user',
    title: 'UserDetailDto',
    description: 'Giriş yapan kişinin görebildiği kendi hesabının tüm (hassas) detayları.'
  },
  'dtos-group': {
    id: 'dtos-group',
    title: 'DTOs (Data Transfer Objects)',
    description: 'API istekleri ve cevapları sırasında, sadece gerekli verileri taşıyan hafifletilmiş objeler klasörü.'
  },

  // --- DATA ACCESS LAYER ---
  'uow-repo': {
    id: 'uow-repo',
    title: 'UnitOfWork & Repository',
    description: 'Veritabanı işlemlerini soyutlayan (Design Pattern) altyapı. Tüm servisler DB işlemlerini doğrudan değil bu katman (Interface) üzerinden yapar.',
    methods: [
      { name: 'GetByIdAsync(id)', desc: 'Belirtilen ID\'ye sahip Entity\'yi çeker.' },
      { name: 'AddAsync(entity)', desc: 'Yeni Entity\'yi belleğe (Memory) ekler.' },
      { name: 'SaveChangesAsync()', desc: 'Bellekteki tüm değişiklikleri (Transaction içinde) veritabanına yazar (Commit).' }
    ]
  },
  'db-context': {
    id: 'db-context',
    title: 'AppDbContext',
    description: 'Entity Framework Core\'un kalbi. Sınıfları (Entity) SQL tablolarına dönüştürür (ORM).',
    methods: [
      { name: 'OnModelCreating()', desc: 'Tablo ilişkilerini (One-to-Many vb.) ve kuralları (Fluent API) tanımlar.' }
    ]
  },
  'db': {
    id: 'db',
    title: 'Database (SQL Server / PostgreSQL)',
    description: 'Uygulamanın fiziksel veri depolama katmanı. Tüm verilerin şifrelenmiş ve ilişkisel olarak saklandığı sunucu.',
    properties: [
      { name: 'Users Table', type: 'Table', desc: 'Sistemdeki kullanıcılar.' },
      { name: 'Posts Table', type: 'Table', desc: 'Blog yazıları.' }
    ]
  },
  // --- FOLLOWER MICROSERVICE SPECIFIC NODES ---
  'followers-comp': {
    id: 'followers-comp',
    title: 'FollowersComponent',
    description: 'Kullanıcıyı takip eden kişilerin listelendiği arayüz.',
    methods: [
      { name: 'getFollowers()', desc: 'Takipçi listesini getirir.' },
      { name: 'removeFollower()', desc: 'Kullanıcıyı takipçi listesinden çıkarır.' }
    ]
  },
  'following-comp': {
    id: 'following-comp',
    title: 'FollowingComponent',
    description: 'Kullanıcının takip ettiği kişilerin listelendiği arayüz.',
    methods: [
      { name: 'getFollowing()', desc: 'Takip edilenler listesini getirir.' },
      { name: 'unfollow()', desc: 'Kullanıcıyı takipten çıkarır.' }
    ]
  },
  'follow-btn-comp': {
    id: 'follow-btn-comp',
    title: 'FollowButtonComponent',
    description: 'Profil sayfalarında yer alan "Takip Et" veya "Takipten Çık" işlemlerini tetikleyen buton bileşeni.',
    methods: [
      { name: 'followUser()', desc: 'Hedef kullanıcıyı takip etme isteği atar.' },
      { name: 'unfollowUser()', desc: 'Takipten çıkma isteği atar.' }
    ]
  },
  'follow-service-fe': {
    id: 'follow-service-fe',
    title: 'follow.service.ts',
    description: 'Takip işlemleri için Backend ile haberleşen Frontend HTTP servisi.',
    methods: [
      { name: 'follow(userId)', desc: 'POST /follow isteği atar.' },
      { name: 'getFollowers(userId)', desc: 'GET /followers isteği atar.' }
    ]
  },
  'follow-ctrl': {
    id: 'follow-ctrl',
    title: 'FollowController.cs',
    description: 'Takip işlemleri ile ilgili HTTP isteklerini karşılayan Endpoint sınıfı.',
    methods: [
      { name: 'FollowUser()', desc: 'Takip etme isteğini alır ve servise iletir.' },
      { name: 'GetFollowers()', desc: 'Takipçi listesi talebini karşılar.' }
    ]
  },
  'mw-auth': {
    id: 'mw-auth',
    title: 'AuthMiddleware.cs',
    description: 'Gelen istekteki JWT Token\'ı kontrol eden ve isteği atan kişinin kimliğini doğrulayan katman.',
    methods: [
      { name: 'InvokeAsync()', desc: 'Header\'daki tokenı alıp çözer ve yetki kontrolü yapar.' }
    ]
  },
  'follow-svc-be': {
    id: 'follow-svc-be',
    title: 'FollowService.cs',
    description: 'Takip etme, takipten çıkma, takipçi sayma gibi temel iş kurallarının barındığı servis sınıfı.',
    methods: [
      { name: 'FollowUserAsync()', desc: 'Kullanıcının daha önceden takip edip etmediğini kontrol eder ve işlemi gerçekleştirir.' },
      { name: 'GetFollowersAsync()', desc: 'Kullanıcının takipçilerini sayfalama ile getirir.' }
    ]
  },
  'ent-follow': {
    id: 'ent-follow',
    title: 'UserFollow.cs (Entity)',
    description: 'Hangi kullanıcının (FollowerId) hangi kullanıcıyı (FollowingId) takip ettiğini tutan veritabanı tablosu.',
    properties: [
      { name: 'FollowerId', type: 'Guid', desc: 'Takip eden kullanıcının IDsi' },
      { name: 'FollowingId', type: 'Guid', desc: 'Takip edilen kullanıcının IDsi' },
      { name: 'CreatedAt', type: 'DateTime', desc: 'Takip etme zamanı' }
    ]
  },
  'dto-follow-req': {
    id: 'dto-follow-req',
    title: 'FollowRequestDto.cs',
    description: 'Takip etme isteğinde Frontend\'den gelen verileri taşıyan DTO.',
    properties: [
      { name: 'TargetUserId', type: 'Guid', desc: 'Takip edilecek kullanıcının IDsi' }
    ]
  },
  'dto-follow-res': {
    id: 'dto-follow-res',
    title: 'FollowResultDto.cs',
    description: 'Takip işlemi sonucunda dönen DTO.',
    properties: [
      { name: 'Success', type: 'bool', desc: 'İşlem başarılı mı?' },
      { name: 'Message', type: 'string', desc: 'Sonuç mesajı' }
    ]
  },
  'dto-follower-list': {
    id: 'dto-follower-list',
    title: 'FollowerListDto.cs',
    description: 'Takipçi listesi istendiğinde dönen DTO.',
    properties: [
      { name: 'Followers', type: 'List<PublicUserDto>', desc: 'Takipçilerin listesi' },
      { name: 'TotalCount', type: 'int', desc: 'Toplam takipçi sayısı' }
    ]
  },
  'cache-svc': {
    id: 'cache-svc',
    title: 'CacheService.cs (Redis)',
    description: 'Sık erişilen takipçi listelerini ve sayılarını hızlı getirmek için kullanılan Redis önbellekleme servisi.',
    methods: [
      { name: 'GetAsync()', desc: 'Önbellekten veriyi getirir.' },
      { name: 'SetAsync()', desc: 'Veriyi önbelleğe yazar.' },
      { name: 'RemoveAsync()', desc: 'Önbelleği temizler.' }
    ]
  },
  'notif-svc': {
    id: 'notif-svc',
    title: 'NotificationEventPublisher.cs',
    description: 'Bir kullanıcı takip edildiğinde, hedef kullanıcıya bildirim gitmesi için RabbitMQ gibi mesaj kuyruklarına Event fırlatan servis.',
    methods: [
      { name: 'PublishUserFollowedEvent()', desc: 'Kuyruğa UserFollowed integration event\'i gönderir.' }
    ]
  }
};
