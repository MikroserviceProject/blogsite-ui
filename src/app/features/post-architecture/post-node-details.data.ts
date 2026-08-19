export interface NodeDetail {
  id: string;
  title: string;
  description: string;
  methods?: { name: string; desc: string }[];
  properties?: { name: string; type: string; desc: string }[];
}

export const POST_NODE_DETAILS: Record<string, NodeDetail> = {
  // --- FRONTEND COMPONENTS ---
  'blog-home-comp': {
    id: 'blog-home-comp',
    title: 'BlogHomeComponent',
    description: 'Ana sayfada yazıların (Blog / Köşe Yazısı) sayfalanmış (paged), aranabilir ve etikete göre filtrelenebilir şekilde listelendiği vitrin ekranı.',
    methods: [
      { name: 'loadPosts()', desc: 'Route data (fixedType) ve query param (tag) bilgisine göre BlogService.getAllPaged() çağırır.' },
      { name: 'goToPage(p)', desc: 'Sayfalama kontrolünden gelen sayfa numarasına göre listeyi yeniden yükler.' },
      { name: 'submitSearch() / clearSearch()', desc: 'Arama kutusundaki metne göre filtreler veya temizler.' },
      { name: 'goToTag(event, tag)', desc: 'Bir etikete tıklanınca TagDetailComponent\'e yönlendirir.' }
    ]
  },
  'blog-detail-comp': {
    id: 'blog-detail-comp',
    title: 'BlogDetailComponent',
    description: 'Seçilen bir blog yazısının tam içeriğinin, yazar bilgisinin görüntülendiği; yazı sahibi veya admin ise silme aksiyonunun da bulunduğu detay ekranı.',
    methods: [
      { name: 'ngOnInit()', desc: 'BlogService.getById(id) ile yazıyı, ardından AuthService.getPublicProfile() ile yazarın profilini getirir.' },
      { name: 'deletePost(id)', desc: 'Yazı sahibiyse BlogService.delete(id) çağırır, başarılıysa anasayfaya döner.' },
      { name: 'isOwner()', desc: 'Giriş yapan kullanıcının yazının sahibi olup olmadığını kontrol eder.' }
    ]
  },
  'post-create-comp': {
    id: 'post-create-comp',
    title: 'PostCreateComponent',
    description: 'Yazar (Author) veya Admin yetkisi olan kullanıcıların yeni bir blog yazısı oluşturduğu ya da mevcut bir yazıyı düzenlediği form ekranı. Aynı zamanda düzenlenmemiş değişiklikleri taslak olarak otomatik kaydeder.',
    methods: [
      { name: 'onSubmit(status)', desc: 'Formu doğrular ve performSave(status) metodunu tetikler.' },
      { name: 'performSave(status)', desc: 'id parametresi varsa BlogService.update(), yoksa BlogService.create() çağırır (multipart/form-data, fotoğraf dahil).' },
      { name: 'onFileSelected(event)', desc: 'Seçilen kapak fotoğrafını form state\'ine ekler.' },
      { name: 'ngOnDestroy()', desc: 'Kaydedilmemiş değişiklik varsa performSave(\'Draft\') ile otomatik taslak kaydı yapar.' }
    ]
  },
  'tag-detail-comp': {
    id: 'tag-detail-comp',
    title: 'TagDetailComponent',
    description: 'Belirli bir etikete (tag) sahip tüm yayınlanmış yazıların listelendiği filtre sonucu ekranı. Ayrı bir Tag tablosu/servisi yoktur; aynı BlogService/PostsController üzerinden tag parametresiyle çalışır.',
    methods: [
      { name: 'loadPosts()', desc: 'Route\'daki tag parametresiyle BlogService.getAll(\'Published\', tag) çağırır.' }
    ]
  },

  // --- FRONTEND SERVICES ---
  'blog-service-fe': {
    id: 'blog-service-fe',
    title: 'BlogService (Frontend)',
    description: 'Angular tarafında /api/posts uç noktalarına yapılan tüm HTTP isteklerini (listeleme, sayfalama, detay, oluşturma, güncelleme, silme) yöneten merkezi servis.',
    methods: [
      { name: 'getAll(status?, type?, authorId?, search?, tag?)', desc: 'GET /api/posts — filtrelenmiş, sayfalanmamış liste döner.' },
      { name: 'getAllPaged(status?, type?, search?, page, pageSize, tag?)', desc: 'GET /api/posts/paged — sayfalanmış liste döner.' },
      { name: 'getById(id)', desc: 'GET /api/posts/{id} — tek bir yazının detayını getirir.' },
      { name: 'create(request)', desc: 'POST /api/posts — multipart/form-data ile yeni yazı oluşturur.' },
      { name: 'update(id, request)', desc: 'PUT /api/posts/{id} — mevcut yazıyı günceller (fotoğraf dahil).' },
      { name: 'delete(id)', desc: 'DELETE /api/posts/{id} — yazıyı siler.' },
      { name: 'adminDelete(id, request)', desc: 'POST /api/posts/{id}/admin-delete — sadece Admin rolü, gerekçe (Reason) ile siler.' }
    ]
  },
  'toast-service': {
    id: 'toast-service',
    title: 'ToastService',
    description: 'Yazı oluşturuldu, güncellendi, silindi gibi işlemlerden sonra kısa süreli bildirim (Toast) gösteren yardımcı servis.',
    methods: [
      { name: 'success(title, message)', desc: 'Yeşil renkli başarı bildirimi gösterir.' },
      { name: 'error(title, message)', desc: 'Kırmızı renkli hata bildirimi gösterir.' },
      { name: 'warning(title, message)', desc: 'Sarı renkli uyarı bildirimi gösterir.' }
    ]
  },

  // --- BACKEND API ---
  'posts-ctrl': {
    id: 'posts-ctrl',
    title: 'PostsController',
    description: 'Blog yazılarıyla ilgili tüm CRUD işlemlerinin API uç noktası. Route tabanı: api/posts.',
    methods: [
      { name: '[GET] /api/posts', desc: 'GetPosts — status/type/authorId/search/tag filtreleriyle liste döner.' },
      { name: '[GET] /api/posts/paged', desc: 'GetPagedPosts — page/pageSize ile sayfalanmış liste döner.' },
      { name: '[GET] /api/posts/{id}', desc: 'GetPost — tek yazı detayını döner.' },
      { name: '[POST] /api/posts', desc: 'CreatePost — [Authorize(Roles="Admin,Author")], multipart form.' },
      { name: '[PUT] /api/posts/{id}', desc: 'UpdatePost — [Authorize(Roles="Admin,Author")].' },
      { name: '[DELETE] /api/posts/{id}', desc: 'DeletePost — [Authorize(Roles="Admin,Author")].' },
      { name: '[POST] /api/posts/{id}/admin-delete', desc: 'AdminDeletePost — [Authorize(Roles="Admin")], gerekçe zorunlu.' }
    ]
  },
  'get-current-user-id': {
    id: 'get-current-user-id',
    title: 'GetCurrentUserId()',
    description: 'JWT token içindeki NameIdentifier/nameid/sub claim\'ini okuyarak o an istek atan kullanıcının Guid kimliğini döndüren private yardımcı metod.'
  },
  'try-save-photo': {
    id: 'try-save-photo',
    title: 'TrySavePhotoAsync(IFormFile file)',
    description: 'Yüklenen kapak fotoğrafını doğrulayan (.jpg/.jpeg/.png/.gif/.webp, maksimum 5MB) ve wwwroot/uploads/posts klasörüne kaydeden private yardımcı metod. (PhotoUrl?, Error?) tuple\'ı döner.'
  },

  // --- BACKEND CORE ---
  'post-svc-be': {
    id: 'post-svc-be',
    title: 'PostService',
    description: 'Blog yazılarına dair iş kurallarının (Business Rules) uygulandığı servis katmanı: sayfalama, filtreleme, oluşturma, güncelleme ve silme mantığı burada yaşar.',
    methods: [
      { name: 'GetPostsAsync(status, type, authorId, search, tag)', desc: 'Repository\'den filtrelenmiş listeyi çekip PostResponseDto listesine mapler.' },
      { name: 'GetPagedPostsAsync(...)', desc: 'Aynı filtrelerle sayfalanmış PagedResultDto<PostResponseDto> üretir.' },
      { name: 'GetPostAsync(id)', desc: 'Tek bir yazıyı id ile getirir.' },
      { name: 'CreatePostAsync(dto, authorId, photoUrl)', desc: 'Yeni Post entity\'si oluşturur ve kaydeder.' },
      { name: 'UpdatePostAsync(id, dto, newPhotoUrl)', desc: 'Başlık/içerik/foto günceller; Draft\'a düşürmeyi engeller; Type\'ı foto varlığından otomatik türetir.' },
      { name: 'UpdatePostWithPhotoAsync(id, dto, newPhotoUrl)', desc: 'Alternatif güncelleme yolu — Type/Status doğrudan DTO\'dan alınır (otomatik türetme yok).' },
      { name: 'DeletePostAsync(id)', desc: 'Yazıyı siler, bool döner.' },
      { name: 'AdminDeletePostAsync(id)', desc: 'Admin tarafından siler, silinen yazının başlığını döner.' }
    ]
  },
  'ent-post': {
    id: 'ent-post',
    title: 'Post (Entity)',
    description: 'Veritabanındaki bir blog yazısının C# tarafındaki nesne karşılığı.',
    properties: [
      { name: 'Id', type: 'int', desc: 'Birincil anahtar.' },
      { name: 'Title', type: 'string', desc: 'Başlık (zorunlu, maks. 200 karakter).' },
      { name: 'Content', type: 'string', desc: 'Yazının içeriği.' },
      { name: 'Type', type: 'PostType', desc: 'Blog veya Köşe Yazısı türü (string olarak saklanır).' },
      { name: 'Status', type: 'PostStatus', desc: 'Draft / Published (string olarak saklanır).' },
      { name: 'PhotoUrl', type: 'string?', desc: 'Kapak fotoğrafı yolu (opsiyonel).' },
      { name: 'AuthorId', type: 'Guid', desc: 'Yazarın kullanıcı kimliği.' },
      { name: 'Tags', type: 'string[]', desc: 'Etiketler — ayrı bir Tag tablosu yok, düz dizi olarak tutulur.' },
      { name: 'CreatedAt / UpdatedAt', type: 'DateTime', desc: 'Oluşturma ve güncelleme zaman damgaları.' }
    ]
  },
  'dtos-group': {
    id: 'dtos-group',
    title: 'DTOs (Data Transfer Objects)',
    description: 'API istek/cevaplarında sadece gerekli verileri taşıyan hafifletilmiş objeler.'
  },
  'dto-create': {
    id: 'dto-create',
    title: 'CreatePostDto',
    description: 'Yeni yazı oluştururken gönderilen veri paketi.',
    properties: [
      { name: 'Title', type: 'string', desc: 'Başlık.' },
      { name: 'Content', type: 'string', desc: 'İçerik.' },
      { name: 'Type', type: 'PostType', desc: 'Blog / Köşe Yazısı.' },
      { name: 'Status', type: 'PostStatus', desc: 'Draft veya Published.' },
      { name: 'Tags', type: 'string[]?', desc: 'Opsiyonel etiketler.' }
    ]
  },
  'dto-update': {
    id: 'dto-update',
    title: 'UpdatePostDto',
    description: 'Mevcut bir yazıyı güncellerken gönderilen veri paketi.',
    properties: [
      { name: 'Title / Content', type: 'string', desc: 'Güncellenmiş başlık ve içerik.' },
      { name: 'PhotoUrl', type: 'string?', desc: 'Yeni foto yoksa mevcut foto korunur.' },
      { name: 'RemovePhoto', type: 'bool', desc: 'Fotoğrafı kaldırma bayrağı.' },
      { name: 'Status', type: 'PostStatus', desc: 'Published\'dan Draft\'a düşürülemez.' }
    ]
  },
  'dto-response': {
    id: 'dto-response',
    title: 'PostResponseDto',
    description: 'API\'nin yazı verisini dönerken kullandığı standart cevap modeli. Post entity\'sinden AutoMapper ile birebir eşlenir.',
    properties: [
      { name: 'Id, Title, Content', type: 'mixed', desc: 'Temel yazı bilgileri.' },
      { name: 'Type, Status', type: 'enum', desc: 'Tür ve durum (string).' },
      { name: 'AuthorId, CreatedAt, UpdatedAt, Tags', type: 'mixed', desc: 'Meta veriler.' }
    ]
  },
  'dto-admindelete': {
    id: 'dto-admindelete',
    title: 'AdminDeletePostDto',
    description: 'Admin bir yazıyı silerken gerekçesini bildirmek zorunda olduğu veri paketi.',
    properties: [
      { name: 'Reason', type: 'string', desc: 'Zorunlu, en az 5 karakter.' },
      { name: 'AuthorEmail / AuthorUsername', type: 'string?', desc: 'Bilgilendirme amaçlı opsiyonel alanlar.' }
    ]
  },
  'mapping-prof': {
    id: 'mapping-prof',
    title: 'MappingProfile (AutoMapper)',
    description: 'Entity ile DTO arasında otomatik dönüşüm sağlayan AutoMapper konfigürasyonu.',
    methods: [
      { name: 'CreateMap<Post, PostResponseDto>()', desc: 'Alan adları birebir eşleştiği için özel üye eşlemesi gerekmez.' }
    ]
  },

  // --- DATA ACCESS LAYER ---
  'post-repo': {
    id: 'post-repo',
    title: 'PostRepository : GenericRepository<Post>',
    description: 'Post\'a özel veritabanı erişimini yöneten repository sınıfı. Genel CRUD işlemlerini GenericRepository\'den miras alır, filtreleme/arama mantığını kendisi ekler.',
    methods: [
      { name: 'GetAllAsync(status, type, authorId, search, tag, page, pageSize)', desc: 'EF.Functions.ILike ile başlık/içerik araması, Tags dizisinde etiket eşleşmesi, CreatedAt\'e göre sıralama ve Skip/Take ile sayfalama yapar.' },
      { name: 'GetByIdAsync(id)', desc: 'Miras alınan genel metod — tek kayıt getirir.' },
      { name: 'AddAsync(entity) / Remove(entity)', desc: 'Miras alınan genel metodlar — ekleme ve silme.' },
      { name: 'SaveChangesAsync()', desc: 'Miras alınan genel metod — değişiklikleri veritabanına yazar.' }
    ]
  },
  'db-context': {
    id: 'db-context',
    title: 'BlogDbContext',
    description: 'Entity Framework Core\'un kalbi. Post sınıfını PostgreSQL tablosuna dönüştürür (ORM). Tek DbSet: Posts.',
    methods: [
      { name: 'OnModelCreating()', desc: 'Title zorunlu ve maks. 200 karakter; Content zorunlu; Type/Status enum\'ları string olarak saklanır (HasConversion<string>()).' }
    ]
  },
  'db': {
    id: 'db',
    title: 'Database (PostgreSQL)',
    description: 'Uygulamanın fiziksel veri depolama katmanı. Npgsql sağlayıcısı ile bağlanılır (UseNpgsql).',
    properties: [
      { name: 'Posts Table', type: 'Table', desc: 'Tüm blog/köşe yazısı kayıtları; Tags kolonu düz string dizisi olarak tutulur.' }
    ]
  }
};
