import { Layer, FlowPath } from '../architecture-schema.component';

export const FOLLOWER_LAYERS: Layer[] = [
  {
    id: 'frontend-comps',
    title: '1. FRONTEND: Ekranlar (Components)',
    nodes: [
      { id: 'followers-comp', name: 'followers.component.ts', type: 'component', actionName: 'Takipçiler' },
      { id: 'following-comp', name: 'following.component.ts', type: 'component', actionName: 'Takip Edilenler' },
      { id: 'follow-btn-comp', name: 'follow-button.component.ts', type: 'component', actionName: 'Takip Et Butonu' }
    ]
  },
  {
    id: 'frontend-services',
    title: '2. FRONTEND: Servisler (HTTP İstekleri)',
    nodes: [
      { id: 'follow-service-fe', name: 'follow.service.ts', type: 'service-main' },
      { id: 'toast-service', name: 'toast.service.ts', subName: '(Yardımcı)', type: 'service-helper' }
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
      { id: 'follow-ctrl', name: 'FollowController.cs', type: 'controller' },
      { 
        id: 'api-middlewares', name: 'Middlewares', type: 'controller', isGroup: true, expanded: false,
        children: [
          { id: 'mw-auth', name: 'AuthMiddleware.cs', type: 'controller', desc: 'Kimlik kontrolü' },
          { id: 'mw-log', name: 'RequestLoggingMiddleware.cs', type: 'controller', desc: 'Loglama' }
        ]
      }
    ]
  },
  {
    id: 'backend-core',
    title: '4. BACKEND: İş Mantığı (CORE)',
    isTwoColumn: true,
    leftNodes: [
      { id: 'follow-svc-be', name: 'FollowService.cs', type: 'service-be' },
      { 
        id: 'entities-group', name: 'Entities (Tablolar)', type: 'service-be', isGroup: true, expanded: false,
        children: [
          { id: 'ent-follow', name: 'UserFollow.cs', type: 'service-be', desc: 'Takip İlişkisi' }
        ]
      },
      { 
        id: 'dtos-group', name: 'DTOs (Veri Transfer)', type: 'service-be', isGroup: true, expanded: false,
        children: [
          { id: 'dto-follow-req', name: 'FollowRequestDto.cs', type: 'service-be', desc: 'Takip Etme' },
          { id: 'dto-follow-res', name: 'FollowResultDto.cs', type: 'service-be', desc: 'Sonuç' },
          { id: 'dto-follower-list', name: 'FollowerListDto.cs', type: 'service-be', desc: 'Takipçi Listesi' }
        ]
      },
      { id: 'uow-repo', name: 'UnitOfWork.cs\nGenericRepository.cs', type: 'service-be' },
      { id: 'db-context', name: 'FollowDbContext.cs', subName: '(Entity Framework)', type: 'service-be' }
    ],
    rightNodes: [
      { id: 'cache-svc', name: 'CacheService.cs', subName: '(Redis)', type: 'helper-be' },
      { id: 'notif-svc', name: 'NotificationEventPublisher.cs', subName: '(RabbitMQ)', type: 'helper-be' }
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

export const FOLLOWER_FLOWS: FlowPath[] = [
  {
    id: 'follow-user',
    name: 'Birini Takip Et (Follow)',
    steps: [
      { fromNodeId: 'follow-btn-comp', toNodeId: 'follow-service-fe', label: 'followUser()' },
      { fromNodeId: 'follow-service-fe', toNodeId: 'gateway-group', label: 'POST /api/Follow (Takip Et İsteği)', subLabel: 'HTTP Request' },
      { fromNodeId: 'gateway-group', toNodeId: 'mw-auth', label: 'Ocelot Gateway\'de Token Doğrulanır' },
      { fromNodeId: 'mw-auth', toNodeId: 'follow-ctrl', label: 'Token Doğrulaması Başarılı Olursa İstek FollowController\'a Yönlendirilir' },
      { fromNodeId: 'follow-ctrl', toNodeId: 'dto-follow-req', label: 'Gelen JSON Verisi DTO\'ya Çevrilir' },
      { fromNodeId: 'dto-follow-req', toNodeId: 'follow-svc-be', label: 'İşlem İlgili Service\'e Devredilir' },
      { fromNodeId: 'follow-svc-be', toNodeId: 'uow-repo', label: 'Daha Önce Takip Edilmiş mi Kontrol Edilir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SELECT (Check Exists)' },
      
      { fromNodeId: 'db', toNodeId: 'follow-svc-be', label: 'Kayıt Bulunamadı, İşleme Devam Edilir', isReturn: true },
      { fromNodeId: 'follow-svc-be', toNodeId: 'ent-follow', label: 'Yeni Entity Nesnesi Oluşturulur' },
      { fromNodeId: 'ent-follow', toNodeId: 'uow-repo', label: 'Entity Repository Üzerinden Context\'e Eklenir' },
      { fromNodeId: 'uow-repo', toNodeId: 'db-context', label: 'Değişiklikler Veritabanına Kaydedilir (Commit)' },
      { fromNodeId: 'db-context', toNodeId: 'db', label: 'SQL Server\'a INSERT Komutu Gönderilir' },
      
      { fromNodeId: 'db', toNodeId: 'follow-svc-be', label: 'Veritabanı İşlemi Başarıyla Tamamlandı', isReturn: true },
      { fromNodeId: 'follow-svc-be', toNodeId: 'notif-svc', label: 'RabbitMQ / EventBus ile Bildirim Fırlatılır', subLabel: 'Event fırlat' },
      { fromNodeId: 'follow-svc-be', toNodeId: 'cache-svc', label: 'Redis Üzerindeki İlgili Cache Temizlenir' },
      
      { fromNodeId: 'follow-svc-be', toNodeId: 'follow-ctrl', label: 'Controller HTTP 200 OK Yanıtı Döner', isReturn: true },
      { fromNodeId: 'follow-ctrl', toNodeId: 'gateway-group', label: 'Gateway Yanıtı İstemciye İletir', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'follow-service-fe', label: 'Frontend HTTP 200 Başarılı Yanıtını Alır', isReturn: true },
      { fromNodeId: 'follow-service-fe', toNodeId: 'follow-btn-comp', label: 'Kullanıcı Arayüzü (UI) Güncellenir', isReturn: true }
    ]
  },
  {
    id: 'get-followers',
    name: 'Takipçileri Listele',
    steps: [
      { fromNodeId: 'followers-comp', toNodeId: 'follow-service-fe', label: 'getFollowers()' },
      { fromNodeId: 'follow-service-fe', toNodeId: 'gateway-group', label: 'GET /api/Follow/Followers (Takipçileri Getir)' },
      { fromNodeId: 'gateway-group', toNodeId: 'follow-ctrl', label: 'API Gateway İsteği Takipçi Listesi İçin FollowController\'a Yönlendirir' },
      { fromNodeId: 'follow-ctrl', toNodeId: 'follow-svc-be', label: 'Service Üzerinden Liste Talep Edilir' },
      { fromNodeId: 'follow-svc-be', toNodeId: 'cache-svc', label: 'Cache\'de var mı?' },
      { fromNodeId: 'cache-svc', toNodeId: 'follow-svc-be', label: 'Yok (Miss)', isReturn: true },
      { fromNodeId: 'follow-svc-be', toNodeId: 'uow-repo', label: 'Repository Üzerinden Sorgu Atılır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'İlişkili Tablolarla JOIN Yapılarak Çekilir' },
      
      { fromNodeId: 'db', toNodeId: 'follow-svc-be', label: 'Veritabanından İstenen Liste Döndü', isReturn: true },
      { fromNodeId: 'follow-svc-be', toNodeId: 'cache-svc', label: 'Cache\'e Yaz (Set)' },
      { fromNodeId: 'follow-svc-be', toNodeId: 'dto-follower-list', label: 'AutoMapper ile Entity\'ler DTO\'ya Çevrilir' },
      { fromNodeId: 'dto-follower-list', toNodeId: 'follow-ctrl', label: 'Controller HTTP 200 ile Listeyi Döner', isReturn: true },
      { fromNodeId: 'follow-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'follow-service-fe', label: 'Frontend HTTP 200 Yanıtını Alır', isReturn: true },
      { fromNodeId: 'follow-service-fe', toNodeId: 'followers-comp', label: 'Veriler Ekranda Listelenir', isReturn: true }
    ]
  },
  {
    id: 'get-following',
    name: 'Takip Edilenleri Listele',
    steps: [
      { fromNodeId: 'following-comp', toNodeId: 'follow-service-fe', label: 'getFollowing()' },
      { fromNodeId: 'follow-service-fe', toNodeId: 'gateway-group', label: 'GET /api/Follow/Following (Takip Edilenleri Getir)' },
      { fromNodeId: 'gateway-group', toNodeId: 'follow-ctrl', label: 'API Gateway İsteği Takip Edilenler Listesi İçin FollowController\'a Yönlendirir' },
      { fromNodeId: 'follow-ctrl', toNodeId: 'follow-svc-be', label: 'Service Üzerinden Liste Talep Edilir' },
      { fromNodeId: 'follow-svc-be', toNodeId: 'cache-svc', label: 'Cache\'de var mı?' },
      { fromNodeId: 'cache-svc', toNodeId: 'follow-svc-be', label: 'Yok (Miss)', isReturn: true },
      { fromNodeId: 'follow-svc-be', toNodeId: 'uow-repo', label: 'Repository Üzerinden Sorgu Atılır' },
      { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'İlişkili Tablolarla JOIN Yapılarak Çekilir' },
      
      { fromNodeId: 'db', toNodeId: 'follow-svc-be', label: 'Veritabanından İstenen Liste Döndü', isReturn: true },
      { fromNodeId: 'follow-svc-be', toNodeId: 'cache-svc', label: 'Cache\'e Yaz (Set)' },
      { fromNodeId: 'follow-svc-be', toNodeId: 'dto-follower-list', label: 'AutoMapper ile Entity\'ler DTO\'ya Çevrilir' },
      { fromNodeId: 'dto-follower-list', toNodeId: 'follow-ctrl', label: 'Controller HTTP 200 ile Listeyi Döner', isReturn: true },
      { fromNodeId: 'follow-ctrl', toNodeId: 'gateway-group', label: 'Controller 200 OK Yanıtını Gateway Üzerinden Geri Döndürür', isReturn: true },
      { fromNodeId: 'gateway-group', toNodeId: 'follow-service-fe', label: 'Frontend HTTP 200 Yanıtını Alır', isReturn: true },
      { fromNodeId: 'follow-service-fe', toNodeId: 'following-comp', label: 'Veriler Ekranda Listelenir', isReturn: true }
    ]
  }
];
