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
      { id: 'microservices', name: 'Mikroservis Ağı', type: 'service-be', desc: 'Auth, Blog, Profil gibi tüm iç servisler' }
    ]
  },
  {
    id: 'layer-data',
    title: '4. VERİTABANI',
    nodes: [
      { id: 'db-main', name: 'Ana Veritabanı', type: 'db', desc: 'Örn: PostgreSQL (Genel Mimari)' },
      { id: 'db-auth', name: 'Kimlik Veritabanı', type: 'db', desc: 'Örn: PostgreSQL (AuthenticationDb)' },
      { id: 'db-profile', name: 'Profil Veritabanı', type: 'db', desc: 'Örn: PostgreSQL (Profil Bilgileri)' }
    ]
  }
];

export const MICROSERVICES_FLOWS: FlowPath[] = [
  {
    id: 'genel-mimari',
    name: 'Genel Mimari',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. İstemciden İstek Gelir' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Gateway İsteği İlgili Servise Yönlendirir' },
      { fromNodeId: 'microservices', toNodeId: 'db-main', label: '3. Servis Veritabanına (PostgreSQL) Gider' },
      { fromNodeId: 'db-main', toNodeId: 'microservices', label: '4. Veri Döndürülür', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '5. Servis Yanıtı Gateway\'e İletilir', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '6. İstemciye Sonuç Dönülür', isReturn: true }
    ]
  },
  {
    id: 'giris-yap',
    name: 'Giriş Yapma Akışı',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. Giriş İsteği (POST /login)' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Auth Servisine Yönlendir' },
      { fromNodeId: 'microservices', toNodeId: 'db-auth', label: '3. PostgreSQL\'den Kullanıcıyı Doğrula' },
      { fromNodeId: 'db-auth', toNodeId: 'microservices', label: '4. Kullanıcı Bulundu', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '5. 200 OK (Token ile dön)', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '6. Giriş Başarılı', isReturn: true }
    ]
  },
  {
    id: 'profil-duzenle',
    name: 'Profil Düzenleme Akışı',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. Profil Güncelleme İsteği' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Profil İşlemine Yönlendir' },
      { fromNodeId: 'microservices', toNodeId: 'db-profile', label: '3. Yeni Profili PostgreSQL\'e Kaydet' },
      { fromNodeId: 'db-profile', toNodeId: 'microservices', label: '4. Veri Kaydedildi', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '5. 200 OK', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '6. Profil Başarıyla Güncellendi', isReturn: true }
    ]
  }
];
