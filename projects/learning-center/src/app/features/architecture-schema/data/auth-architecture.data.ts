import { Layer, FlowPath } from '../architecture-schema.component';

export const AUTH_LAYERS: Layer[] = [
  {
    id: 'frontend-comps',
    title: '1. FRONTEND: Ekranlar (Components)',
    nodes: [
      { id: 'forgot-password-comp', name: 'forgot-password.component.ts', type: 'component', actionName: 'Şifremi Unuttum' },
      { id: 'login-comp', name: 'login.component.ts', type: 'component', actionName: 'Giriş Yap' },
      { id: 'profile-comp', name: 'profile.component.ts', type: 'component', actionName: 'Profil Güncelle' },
      { id: 'users-management-comp', name: 'users-management.component.ts', type: 'component', actionName: 'Kullanıcı Ban' },
      { id: 'register-comp', name: 'register.component.ts', type: 'component', actionName: 'Kayıt Ol' },
      { id: 'author-approvals-comp', name: 'author-approvals.component.ts', type: 'component', actionName: 'Yazar Onayı' },
      { id: 'reset-password-comp', name: 'reset-password.component.ts', type: 'component', actionName: 'Şifre Sıfırlama' },
      { id: 'confirm-email-comp', name: 'confirm-email.component.ts', type: 'component', actionName: 'Email Doğrula' }
    ]
  },
  {
    id: 'frontend-services',
    title: '2. FRONTEND: Servisler (HTTP İstekleri)',
    nodes: [
      { id: 'toast-service', name: 'toast.service.ts', subName: '(Yardımcı)', type: 'service-helper' },
      { id: 'auth-service-fe', name: 'auth.service.ts', type: 'service-main' }
    ]
  },
  {
    id: 'backend-gateway-api',
    title: '3. BACKEND: Gateway & API',
    nodes: [
      { 
        id: 'gateway-group', name: 'API Gateway', type: 'gateway', isGroup: true, expanded: false,
        children: [
          { id: 'gw-program', name: 'Program.cs', type: 'controller', desc: 'Ocelot/Yönlendirme' }
        ]
      },
      { id: 'api-program', name: 'Program.cs (API)', subName: '(App Config)', type: 'controller' },
      { id: 'auth-ctrl', name: 'AuthController.cs', type: 'controller' },
      { id: 'admin-ctrl', name: 'AdminController.cs', type: 'controller' },
      { id: 'user-ctrl', name: 'UserProfileController.cs', type: 'controller' },
      { 
        id: 'api-middlewares', name: 'Middlewares', type: 'controller', isGroup: true, expanded: false,
        children: [
          { id: 'mw-ban', name: 'BanCheckMiddleware.cs', type: 'controller', desc: 'Yasaklı kullanıcı kontrolü' },
          { id: 'mw-log', name: 'RequestLoggingMiddleware.cs', type: 'controller', desc: 'Loglama' }
        ]
      },
      { 
        id: 'api-extensions', name: 'Extensions', type: 'controller', isGroup: true, expanded: false,
        children: [
          { id: 'ext-db', name: 'DatabaseExtensions.cs', type: 'controller' },
          { id: 'ext-svc', name: 'ServiceCollectionExtensions.cs', type: 'controller' }
        ]
      }
    ]
  },
  {
    id: 'backend-core',
    title: '4. BACKEND: İş Mantığı (CORE)',
    isTwoColumn: true,
    leftNodes: [
      { id: 'auth-svc-be', name: 'AuthService.cs', type: 'service-be' },
      { id: 'admin-svc-be', name: 'AdminService.cs', type: 'service-be' },
      { id: 'user-svc-be', name: 'UserProfileService.cs', type: 'service-be' },
      { 
        id: 'entities-group', name: 'Entities (Tablolar)', type: 'service-be', isGroup: true, expanded: false,
        children: [
          { id: 'ent-user', name: 'User.cs', type: 'service-be', desc: 'Kullanıcılar' },
          { id: 'ent-notif', name: 'UserNotification.cs', type: 'service-be', desc: 'Bildirimler' }
        ]
      },
      { 
        id: 'dtos-group', name: 'DTOs (Veri Transfer)', type: 'service-be', isGroup: true, expanded: false,
        children: [
          { id: 'dto-admin', name: 'AdminModerationDtos.cs', type: 'service-be', desc: 'Admin onayı' },
          { id: 'dto-api', name: 'ApiResponseDto.cs', type: 'service-be', desc: 'Standart dönüş' },
          { id: 'dto-author', name: 'AuthorApplicationDto.cs', type: 'service-be', desc: 'Yazar başvuru' },
          { id: 'dto-confirm', name: 'ConfirmEmailDto.cs', type: 'service-be', desc: 'Mail doğrulama' },
          { id: 'dto-cadmin', name: 'CreateAdminRequestDto.cs', type: 'service-be', desc: 'Admin yaratma' },
          { id: 'dto-login', name: 'LoginRequestDto.cs', type: 'service-be', desc: 'Giriş verisi' },
          { id: 'dto-loginr', name: 'LoginResponseDto.cs', type: 'service-be', desc: 'Token' },
          { id: 'dto-page', name: 'PaginatedResultDto.cs', type: 'service-be', desc: 'Sayfalama' },
          { id: 'dto-pass', name: 'PasswordDtos.cs', type: 'service-be', desc: 'Şifre işlemleri' },
          { id: 'dto-pub', name: 'PublicUserDto.cs', type: 'service-be', desc: 'Açık kullanıcı' },
          { id: 'dto-pubp', name: 'PublicUserProfileDto.cs', type: 'service-be', desc: 'Açık profil' },
          { id: 'dto-reg', name: 'RegisterRequestDto.cs', type: 'service-be', desc: 'Kayıt verisi' },
          { id: 'dto-resend', name: 'ResendEmailRequestDto.cs', type: 'service-be', desc: 'Tekrar onay' },
          { id: 'dto-supp', name: 'SupportRequestDto.cs', type: 'service-be', desc: 'Destek' },
          { id: 'dto-upd', name: 'UpdateProfileRequestDto.cs', type: 'service-be', desc: 'Profil gncl' },
          { id: 'dto-user', name: 'UserDto.cs', type: 'service-be', desc: 'Kullanıcı' }
        ]
      },
      { id: 'uow-repo', name: 'UnitOfWork.cs\nGenericRepository.cs', type: 'service-be' },
      { id: 'db-context', name: 'AppDbContext.cs', subName: '(Entity Framework)', type: 'service-be' }
    ],
    rightNodes: [
      { id: 'pw-hasher', name: 'PasswordHasher.cs', subName: '(Şifre)', type: 'helper-be' },
      { id: 'jwt-svc', name: 'JwtService.cs', subName: '(Token)', type: 'helper-be' },
      { id: 'email-svc', name: 'SmtpEmailService.cs', subName: '(Email)', type: 'helper-be' },
      { id: 'mapping-prof', name: 'MappingProfile.cs', type: 'helper-be' }
    ]
  },
  {
    id: 'backend-data',
    title: '5. VERİTABANI: Hafıza (Data)',
    direction: 'horizontal',
    nodes: [
      { id: 'db', name: 'PostgreSQL', type: 'db' }
    ]
  }
];

export const AUTH_FLOWS: FlowPath[] = [
  {
    id: 'login',
    name: 'Giriş Yap (Login)',
    steps: [
      { fromNodeId: 'login-comp', toNodeId: 'auth-service-fe', label: 'login()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Auth/Login (Giriş İsteği)', subLabel: 'HTTP Request (LoginRequestDto)' },
      { fromNodeId: 'gateway-group', toNodeId: 'mw-log', label: 'Yönlendir' },
      { fromNodeId: 'mw-log', toNodeId: 'auth-ctrl', label: 'Request Loglanır ve Giriş İşlemi İçin AuthController\'a İletilir' },
      { fromNodeId: 'auth-ctrl', toNodeId: 'dto-login', label: 'Model Binding', subLabel: 'JSON -> LoginRequestDto' },
      { fromNodeId: 'dto-login', toNodeId: 'auth-svc-be', label: 'Devret' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'pw-hasher', label: 'Şifre Hash\'i Karşılaştırılarak Doğrulanır' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'uow-repo', label: 'Email Adresine Göre Kullanıcı Aranır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'dan SELECT Sorgusu Atılır', subLabel: 'EF Core / LINQ' },
      
      { fromNodeId: 'db', toNodeId: 'uow-repo', label: 'Veritabanından Kullanıcı Kaydı Döndü', isReturn: true },
      { fromNodeId: 'uow-repo', toNodeId: 'auth-svc-be', label: 'Entity Nesnesi Service\'e İletilir', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'jwt-svc', label: 'JWT (JSON Web Token) Üretilir', isReturn: true },
      { fromNodeId: 'jwt-svc', toNodeId: 'auth-svc-be', label: 'Geçerli Bir JWT Token Hazırlandı', isReturn: true, subLabel: 'Bearer Token' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'dto-loginr', label: 'Yanıt DTO\'su (LoginResponseDto) Hazırlanır', isReturn: true, subLabel: 'LoginResponseDto' },
      { fromNodeId: 'dto-loginr', toNodeId: 'auth-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'Controller JSON Yanıtını API Gateway\'e İletir', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'auth-service-fe', label: 'HTTP Cevabı', isReturn: true },
      { fromNodeId: 'auth-service-fe', toNodeId: 'login-comp', label: 'Kullanıcı Oturum Açtı ve Yönlendirildi', isReturn: true }
    ]
  },
  {
    id: 'register',
    name: 'Kayıt Ol (Register)',
    steps: [
      { fromNodeId: 'register-comp', toNodeId: 'auth-service-fe', label: 'register()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Auth/Register (Kayıt İsteği)' },
      { fromNodeId: 'gateway-group', toNodeId: 'mw-log', label: 'Yönlendir' },
      { fromNodeId: 'mw-log', toNodeId: 'auth-ctrl', label: 'Request Loglanır ve Kayıt İşlemi İçin AuthController\'a Yönlendirilir' },
      { fromNodeId: 'auth-ctrl', toNodeId: 'dto-reg', label: 'Gelen İstek DTO\'ya Çevrilir (Model Binding)' },
      { fromNodeId: 'dto-reg', toNodeId: 'auth-svc-be', label: 'Devret' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'pw-hasher', label: 'Kullanıcı Şifresi PBKDF2 / BCrypt ile Hash\'lenir' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'ent-user', label: 'Entity Oluştur' },
      { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Kaydet' },
      { fromNodeId: 'uow-repo', toNodeId: 'db-context', label: 'SaveChanges' },
      { fromNodeId: 'db-context', toNodeId: 'db', label: 'INSERT' },
      
      { fromNodeId: 'db', toNodeId: 'db-context', label: 'Veritabanında 1 Satır Etkilendi (Kayıt Başarılı)', isReturn: true },
      { fromNodeId: 'db-context', toNodeId: 'auth-svc-be', label: 'Kullanıcı Kaydı Başarıyla Tamamlandı', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'email-svc', label: 'RabbitMQ ile Email Gönderim Event\'i Fırlatılır', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Controller HTTP 201 Created Yanıtı Döner', isReturn: true },
      { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'Controller HTTP 201 Yanıtını Gateway Üzerine İletir', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'auth-service-fe', label: 'HTTP Cevabı', isReturn: true },
      { fromNodeId: 'auth-service-fe', toNodeId: 'register-comp', label: 'Kullanıcı Kayıt İşlemi Tamamlandı', isReturn: true }
    ]
  },
  {
    id: 'forgot-password',
    name: 'Şifremi Unuttum',
    steps: [
      { fromNodeId: 'forgot-password-comp', toNodeId: 'auth-service-fe', label: 'forgotPassword()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Auth/ForgotPassword (Şifremi Unuttum İsteği)' },
      { fromNodeId: 'gateway-group', toNodeId: 'auth-ctrl', label: 'API Gateway İsteği Şifre Unuttum İşlemi İçin AuthController\'a Yönlendirir' },
      { fromNodeId: 'auth-ctrl', toNodeId: 'auth-svc-be', label: 'Controller, Email Kontrolü ve Token Üretimi İçin AuthService\'i Çağırır' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'uow-repo', label: 'Kullanıcı Email\'i Veritabanında Aranır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'dan SELECT Sorgusu Atılır' },
      
      { fromNodeId: 'db', toNodeId: 'uow-repo', label: 'Veritabanında Kullanıcı Bulundu', isReturn: true },
      { fromNodeId: 'uow-repo', toNodeId: 'auth-svc-be', label: 'Repository User Nesnesini Döndürdü', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'jwt-svc', label: 'JWT (JSON Web Token) Üretilir', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'email-svc', label: 'Şifre Sıfırlama Linki Email Olarak Gönderilir', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'forgot-password-comp', label: 'Şifre Sıfırlama Maili Başarıyla Gönderildi', isReturn: true }
    ]
  },
  {
    id: 'reset-password',
    name: 'Şifre Sıfırlama (Reset)',
    steps: [
      { fromNodeId: 'reset-password-comp', toNodeId: 'auth-service-fe', label: 'resetPassword()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Auth/ResetPassword (Şifre Sıfırlama İsteği)', subLabel: 'HTTP (PasswordResetDto)' },
      { fromNodeId: 'gateway-group', toNodeId: 'auth-ctrl', label: 'API Gateway İsteği Şifre Sıfırlama İşlemi İçin AuthController\'a Yönlendirir' },
      { fromNodeId: 'auth-ctrl', toNodeId: 'dto-pass', label: 'Gelen İstek DTO\'ya Çevrilir (Model Binding)', subLabel: 'Token & NewPassword' },
      { fromNodeId: 'dto-pass', toNodeId: 'auth-svc-be', label: 'Kullanıcının Şifresi Güncellenmek Üzere Devredilir' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'jwt-svc', label: 'Gönderilen Sıfırlama Token\'ı Doğrulanır' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'pw-hasher', label: 'Yeni Şifre Güvenli Bir Şekilde Hash\'lenir' },
      { fromNodeId: 'pw-hasher', toNodeId: 'ent-user', label: 'Kullanıcı Entity\'sindeki Şifre Hash\'i Güncellenir' },
      { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Değişiklikler Repository\'ye İletilir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'da UPDATE Komutu Çalıştırılır', subLabel: 'SQL Server' },
      
      { fromNodeId: 'db', toNodeId: 'auth-svc-be', label: 'Veritabanı Güncellemesi Başarıyla Tamamlandı', isReturn: true, subLabel: 'Success (true)' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'reset-password-comp', label: 'Kullanıcı Şifresi Başarıyla Değiştirildi', isReturn: true, subLabel: '200 OK' }
    ]
  },
  {
    id: 'confirm-email',
    name: 'Email Doğrulama',
    steps: [
      { fromNodeId: 'confirm-email-comp', toNodeId: 'auth-service-fe', label: 'confirm()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Auth/ConfirmEmail (Email Doğrulama İsteği)' },
      { fromNodeId: 'gateway-group', toNodeId: 'auth-ctrl', label: 'API Gateway İsteği Email Onay İşlemi İçin AuthController\'a Yönlendirir' },
      { fromNodeId: 'auth-ctrl', toNodeId: 'dto-confirm', label: 'Gelen İstek DTO\'ya Çevrilir (Model Binding)' },
      { fromNodeId: 'dto-confirm', toNodeId: 'auth-svc-be', label: 'Email Doğrulama Token\'ı Kontrol Edilir' },
      { fromNodeId: 'auth-svc-be', toNodeId: 'uow-repo', label: 'Veritabanından İlgili Kullanıcı Aranır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'dan SELECT Sorgusu Atılır' },
      { fromNodeId: 'db', toNodeId: 'uow-repo', label: 'Kullanıcı Bulundu', isReturn: true },
      { fromNodeId: 'uow-repo', toNodeId: 'auth-svc-be', label: 'User Nesnesi Service\'e İletilir', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'ent-user', label: 'Kullanıcının EmailOnaylı Durumu True Yapılır' },
      { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Değişiklikler Repository\'ye İletilir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'da UPDATE Komutu Çalıştırılır' },
      
      { fromNodeId: 'db', toNodeId: 'auth-svc-be', label: 'Email Doğrulama Durumu Veritabanına Kaydedildi', isReturn: true },
      { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'confirm-email-comp', label: 'Kullanıcının Email Adresi Başarıyla Onaylandı', isReturn: true }
    ]
  },
  {
    id: 'update-profile',
    name: 'Hesap (Profil) Düzenleme',
    steps: [
      { fromNodeId: 'profile-comp', toNodeId: 'auth-service-fe', label: 'updateProfile()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'PUT /api/User/Profile (Profil Güncelleme İsteği)' },
      { fromNodeId: 'gateway-group', toNodeId: 'mw-log', label: 'Kullanıcının Oturumu (JWT) Kontrol Edilir' },
      { fromNodeId: 'mw-log', toNodeId: 'user-ctrl', label: 'Yetki Doğrulaması Başarılı Olursa İstek UserProfileController\'a Yönlendirilir' },
      { fromNodeId: 'user-ctrl', toNodeId: 'dto-upd', label: 'Gelen İstek DTO\'ya Çevrilir (Model Binding)' },
      { fromNodeId: 'dto-upd', toNodeId: 'user-svc-be', label: 'Profil Bilgileri Güncellenmek Üzere Service\'e İletilir' },
      { fromNodeId: 'user-svc-be', toNodeId: 'mapping-prof', label: 'DTO ile Entity Alanları Eşleştirilir (Mapping)' },
      { fromNodeId: 'mapping-prof', toNodeId: 'ent-user', label: 'Entity Üzerindeki Bilgiler Yeni Verilerle Değiştirilir' },
      { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Değişiklikler Repository\'ye İletilir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'da UPDATE Komutu Çalıştırılır' },
      
      { fromNodeId: 'db', toNodeId: 'user-svc-be', label: 'Profil Güncellemesi Veritabanına Kaydedildi', isReturn: true },
      { fromNodeId: 'user-svc-be', toNodeId: 'user-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'user-ctrl', toNodeId: 'gateway-group', label: 'Controller Güncel Profil Yanıtını Gateway Üzerinden İletir', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'profile-comp', label: 'Profil Bilgileri Başarıyla Güncellendi', isReturn: true }
    ]
  },
  {
    id: 'ban-user',
    name: 'Kullanıcı Banlama (Admin)',
    steps: [
      { fromNodeId: 'users-management-comp', toNodeId: 'auth-service-fe', label: 'banUser()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Admin/BanUser (Kullanıcı Banlama İsteği)' },
      { fromNodeId: 'gateway-group', toNodeId: 'mw-ban', label: 'Yetki Kontrol (Role)' },
      { fromNodeId: 'mw-ban', toNodeId: 'admin-ctrl', label: 'Admin Yetkisi Doğrulanırsa İstek AdminController\'a Yönlendirilir' },
      { fromNodeId: 'admin-ctrl', toNodeId: 'admin-svc-be', label: 'Kullanıcıyı Yasaklama İşlemi Service\'e İletilir' },
      { fromNodeId: 'admin-svc-be', toNodeId: 'uow-repo', label: 'Veritabanından İlgili Kullanıcı Aranır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'dan SELECT Sorgusu Atılır' },
      { fromNodeId: 'db', toNodeId: 'uow-repo', label: 'Kullanıcı Bulundu', isReturn: true },
      { fromNodeId: 'uow-repo', toNodeId: 'admin-svc-be', label: 'User Nesnesi Service\'e İletilir', isReturn: true },
      { fromNodeId: 'admin-svc-be', toNodeId: 'ent-user', label: 'Kullanıcının Yasaklı Durumu True Yapılır' },
      { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Değişiklikler Repository\'ye İletilir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'da UPDATE Komutu Çalıştırılır' },
      
      { fromNodeId: 'db', toNodeId: 'admin-svc-be', label: 'Kullanıcı Banlama İşlemi Veritabanına Kaydedildi', isReturn: true },
      { fromNodeId: 'admin-svc-be', toNodeId: 'admin-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'admin-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'users-management-comp', label: 'Kullanıcı Başarıyla Sistemden Uzaklaştırıldı (Banlandı)', isReturn: true }
    ]
  },
  {
    id: 'approve-author',
    name: 'Yazar Onaylama (Admin)',
    steps: [
      { fromNodeId: 'author-approvals-comp', toNodeId: 'auth-service-fe', label: 'approveAuthor()' },
      { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Admin/ApproveAuthor (Yazar Onay İsteği)' },
      { fromNodeId: 'gateway-group', toNodeId: 'mw-ban', label: 'İsteği Yapanın Yetkisi Kontrol Edilir' },
      { fromNodeId: 'mw-ban', toNodeId: 'admin-ctrl', label: 'Admin Yetkisi Doğrulanırsa İstek AdminController\'a Yönlendirilir' },
      { fromNodeId: 'admin-ctrl', toNodeId: 'admin-svc-be', label: 'Kullanıcının Yazar Olma Talebi Service\'e İletilir' },
      { fromNodeId: 'admin-svc-be', toNodeId: 'uow-repo', label: 'Veritabanından İlgili Kullanıcı Aranır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'dan SELECT Sorgusu Atılır' },
      { fromNodeId: 'db', toNodeId: 'uow-repo', label: 'Kullanıcı Bulundu', isReturn: true },
      { fromNodeId: 'uow-repo', toNodeId: 'admin-svc-be', label: 'User Nesnesi Service\'e İletilir', isReturn: true },
      { fromNodeId: 'admin-svc-be', toNodeId: 'ent-user', label: 'Kullanıcının Rolü Normalden Yazar (Author) Rolüne Çevrilir' },
      { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Değişiklikler Repository\'ye İletilir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SQL Server\'da UPDATE Komutu Çalıştırılır' },
      
      { fromNodeId: 'db', toNodeId: 'admin-svc-be', label: 'Yazar Onayı Veritabanına Kaydedildi', isReturn: true },
      { fromNodeId: 'admin-svc-be', toNodeId: 'admin-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'admin-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'author-approvals-comp', label: 'Kullanıcı Başarıyla Yazar Olarak Onaylandı', isReturn: true }
    ]
  }
];
