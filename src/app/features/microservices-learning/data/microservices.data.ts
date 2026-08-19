import { ChildNode, Layer, FlowPath } from '../microservices-learning.component';

export const MICROSERVICES_LAYERS: Layer[] = [
  {
    id: 'layer-client',
    title: '1. İSTEMCİ',
    nodes: [
      { id: 'client', name: 'Kullanıcı İstemcisi', type: 'component', desc: 'Web Tarayıcı, Mobil Uygulama vb.' }
    ]
  },
  {
    id: 'layer-gateway',
    title: '2. API AĞ GEÇİDİ',
    nodes: [
      { id: 'gateway', name: 'API Gateway', type: 'gateway', desc: 'Gelen tüm istekleri karşılar ve ilgili servise yönlendirir' }
    ]
  },
  {
    id: 'layer-services',
    title: '3. MİKROSERVİSLER (İş Mantığı)',
    nodes: [
      { id: 'microservices', name: 'Mikroservis Ağı', type: 'service-be', desc: 'Auth, Profil, Medya, Ödeme gibi tüm iç servisler' }
    ]
  },
  {
    id: 'layer-broker',
    title: '4. MESAJ KUYRUĞU',
    nodes: [
      { id: 'broker', name: 'Olay/Mesaj Yöneticisi', type: 'helper-be', desc: 'Servisler arası asenkron iletişim (RabbitMQ/Kafka)' }
    ]
  },
  {
    id: 'layer-data',
    title: '5. VERİTABANLARI & ÖNBELLEK',
    nodes: [
      { id: 'db-sql', name: 'İlişkisel Veritabanı', type: 'db', desc: 'Örn: PostgreSQL, SQL Server' },
      { id: 'db-nosql', name: 'Döküman Veritabanı', type: 'db', desc: 'Örn: MongoDB' },
      { id: 'cache-redis', name: 'Önbellek (Cache)', type: 'db', desc: 'Örn: Redis (Hızlı okuma/yazma)' }
    ]
  }
];

export const MICROSERVICES_FLOWS: FlowPath[] = [
  {
    id: 'giris-yap',
    name: 'Giriş Yap',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. Giriş İsteği (POST /login)' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Auth Servisine Yönlendir' },
      { fromNodeId: 'microservices', toNodeId: 'db-sql', label: '3. SQL\'den Kullanıcıyı Doğrula' },
      { fromNodeId: 'db-sql', toNodeId: 'microservices', label: '4. Kullanıcı Bulundu', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'cache-redis', label: '5. Oturumu/Token\'ı Önbelleğe Al' },
      { fromNodeId: 'cache-redis', toNodeId: 'microservices', label: '6. Önbelleğe Alındı', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'broker', label: '7. (Asenkron) "KullaniciGirisYapti" Olayı Fırlat' },
      { fromNodeId: 'broker', toNodeId: 'microservices', label: '8. Güvenlik/Log Servisi Kaydetti', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '9. 200 OK (Token ile dön)', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '10. Giriş Başarılı', isReturn: true }
    ]
  },
  {
    id: 'profil-duzenle',
    name: 'Profil Düzenle',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. Profil Güncelleme İsteği' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Profil Servisine Yönlendir' },
      { fromNodeId: 'microservices', toNodeId: 'cache-redis', label: '3. Redis\'teki Eski Profil Verisini Sil' },
      { fromNodeId: 'cache-redis', toNodeId: 'microservices', label: '4. Veri Silindi', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'db-nosql', label: '5. Yeni Profili MongoDB\'ye Kaydet' },
      { fromNodeId: 'db-nosql', toNodeId: 'microservices', label: '6. Veri Kaydedildi', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'broker', label: '7. "ProfilGuncellendi" Olayı Fırlat' },
      { fromNodeId: 'broker', toNodeId: 'microservices', label: '8. Diğer Servisler Haberdar Edildi', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '9. 200 OK', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '10. Profil Başarıyla Güncellendi', isReturn: true }
    ]
  },
  {
    id: 'fotograf-yukle',
    name: 'Fotoğraf Yükle',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. Fotoğraf Yükleme İsteği' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Medya Servisine Yönlendir' },
      { fromNodeId: 'microservices', toNodeId: 'db-nosql', label: '3. Fotoğraf Metadatasını Kaydet' },
      { fromNodeId: 'db-nosql', toNodeId: 'microservices', label: '4. Metadata Kaydedildi', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'broker', label: '5. "FotografYuklendi" Olayı Fırlat (Boyutlandırma için)' },
      { fromNodeId: 'broker', toNodeId: 'microservices', label: '6. Medya İşleyici Arka Planda Başladı', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '7. 202 Accepted (İşlem Sürüyor)', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '8. Fotoğraf İşleniyor...', isReturn: true }
    ]
  },
  {
    id: 'genel-mimari',
    name: 'Genel Mikroservis Mimarisi',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. İstemciden İstek Gelir' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Gateway İsteği Yönlendirir' },
      { fromNodeId: 'microservices', toNodeId: 'db-sql', label: '3. Mikroservis SQL\'den Veri Çeker' },
      { fromNodeId: 'db-sql', toNodeId: 'microservices', label: '4. Veri Döndürülür', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'cache-redis', label: '5. Veri Önbelleğe (Redis) Yazılır' },
      { fromNodeId: 'cache-redis', toNodeId: 'microservices', label: '6. Önbellek Kaydı Tamam', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'broker', label: '7. Diğer Servisler İçin Olay Fırlatılır' },
      { fromNodeId: 'broker', toNodeId: 'microservices', label: '8. Olay Kuyruğa Alındı', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '9. Servis Yanıtı Gateway\'e İletilir', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '10. İstemciye Sonuç Dönülür', isReturn: true }
    ]
  }
];
