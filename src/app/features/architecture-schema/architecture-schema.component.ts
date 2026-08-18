import { Component, OnDestroy, AfterViewChecked, HostListener, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NODE_DETAILS, NodeDetail } from './node-details.data';
export interface ChildNode {
  id: string;
  name: string;
  type: string;
  desc?: string;
  subName?: string;
  isGroup?: boolean;
  expanded?: boolean;
  children?: ChildNode[];
}

export interface Layer {
  id: string;
  title: string;
  direction?: 'vertical' | 'horizontal';
  isTwoColumn?: boolean; 
  leftNodes?: ChildNode[]; 
  rightNodes?: ChildNode[]; 
  nodes?: ChildNode[]; 
}

export interface FlowStep {
  fromNodeId: string;
  toNodeId: string;
  label: string;
  subLabel?: string;
  isReturn?: boolean; 
  isDefaultBackground?: boolean; 
}

export interface FlowPath {
  id: string;
  name: string;
  steps: FlowStep[];
}

export interface SvgLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number; 
  labelX: number;
  labelY: number;
  pathD?: string;
  label: string;
  subLabel?: string;
  active: boolean; 
  isReturn: boolean; 
  isDefaultBackground: boolean; 
  stepIndex: number;
  lineColor?: string;
  markerEnd?: string;
}

@Component({
  selector: 'app-architecture-schema',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './architecture-schema.component.html',
  styleUrl: './architecture-schema.component.css'
})
export class ArchitectureSchemaComponent implements OnDestroy, AfterViewChecked {
  
  showInactiveNodes = signal(false);
  activeFlowData = signal<FlowPath | null>(null);

  @ViewChild('boardWrapper') boardWrapper!: ElementRef;
  
  // YENİ: Seçilen (tıklanan) kutunun (sınıfın) detaylarını tutar
  selectedNode = signal<NodeDetail | null>(null);

  // DRAG & DROP (Panel) STATE
  isPanelMinimized = signal(true); // YENİ: Varsayılan olarak kapalı başlasın
  isDragging = false;
  panelLeft = 20;
  panelTop = 100;
  hasMoved = false;
  dragStartX = 0;
  dragStartY = 0;

  // Kutuların hareketini (drag & drop vb.) algılamak için
  positionTrackerInterval: any;
  private lastElementPositions = new Map<string, string>();

  // YENİ: Node Sürükle-Bırak State'leri
  draggingNodeId: string | null = null;
  hasNodeMoved = false;
  nodeOffsets = new Map<string, { x: number; y: number }>();

  constructor() {}

  ngOnInit() {
    this.startPositionTracker();
  }

  ngOnDestroy() {
    if (this.positionTrackerInterval) {
      clearInterval(this.positionTrackerInterval);
    }
    this.stopAnimation();
  }

  // Kutu koordinatları değişirse (Sürükle & Bırak vb.) çizgileri canlı günceller
  startPositionTracker() {
    if (!this.positionTrackerInterval) {
      this.positionTrackerInterval = setInterval(() => {
         if (this.activeFlowData()) {
            this.checkAndRecalculateIfMoved();
         }
      }, 50); // Saniyede 20 kare (gerçek zamanlıya yakın, düşük CPU)
    }
  }

  checkAndRecalculateIfMoved() {
    const flow = this.activeFlowData();
    if (!flow) return;
    
    let moved = false;
    flow.steps.forEach(step => {
      [step.fromNodeId, step.toNodeId].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const pos = `${Math.round(rect.left)},${Math.round(rect.top)}`;
          if (this.lastElementPositions.get(id) !== pos) {
            moved = true;
            this.lastElementPositions.set(id, pos);
          }
        }
      });
    });

    if (moved) {
      this.calculateSvgLines();
    }
  }

  layers: Layer[] = [
    {
      id: 'frontend-comps',
      title: '1. FRONTEND: Ekranlar (Components)',
      nodes: [
        { id: 'forgot-password-comp', name: 'forgot-password.component.ts', type: 'component' },
        { id: 'login-comp', name: 'login.component.ts', type: 'component' },
        { id: 'profile-comp', name: 'profile.component.ts', type: 'component' },
        { id: 'users-management-comp', name: 'users-management.component.ts', type: 'component' },
        { id: 'register-comp', name: 'register.component.ts', type: 'component' },
        { id: 'author-approvals-comp', name: 'author-approvals.component.ts', type: 'component' },
        { id: 'reset-password-comp', name: 'reset-password.component.ts', type: 'component' },
        { id: 'confirm-email-comp', name: 'confirm-email.component.ts', type: 'component' }
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
        }
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
        { id: 'uow-repo', name: 'UnitOfWork.cs\nGenericRepository.cs', type: 'data-ef' },
        { id: 'db-context', name: 'AppDbContext.cs', subName: '(Entity Framework)', type: 'data-ef' },
        { id: 'db', name: 'PostgreSQL', type: 'db' }
      ]
    }
  ];

  flows: FlowPath[] = [
    {
      id: 'login',
      name: '1. Giriş Yap (Login)',
      steps: [
        { fromNodeId: 'login-comp', toNodeId: 'auth-service-fe', label: 'login()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /login', subLabel: 'HTTP Request (LoginRequestDto)' },
        { fromNodeId: 'gateway-group', toNodeId: 'mw-log', label: 'Yönlendir' },
        { fromNodeId: 'mw-log', toNodeId: 'auth-ctrl', label: 'Log & İlet' },
        { fromNodeId: 'auth-ctrl', toNodeId: 'dto-login', label: 'Model Binding', subLabel: 'JSON -> LoginRequestDto' },
        { fromNodeId: 'dto-login', toNodeId: 'auth-svc-be', label: 'Devret' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'pw-hasher', label: 'Doğrula' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'uow-repo', label: 'Kullanıcı Bul' },
        { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SELECT', subLabel: 'EF Core / LINQ' },
        
        { fromNodeId: 'db', toNodeId: 'uow-repo', label: 'Kullanıcı Verisi', isReturn: true },
        { fromNodeId: 'uow-repo', toNodeId: 'auth-svc-be', label: 'User Entity', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'jwt-svc', label: 'Token Üret', isReturn: true },
        { fromNodeId: 'jwt-svc', toNodeId: 'auth-svc-be', label: 'JWT Hazır', isReturn: true, subLabel: 'Bearer Token' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'dto-loginr', label: 'Response DTO', isReturn: true, subLabel: 'LoginResponseDto' },
        { fromNodeId: 'dto-loginr', toNodeId: 'auth-ctrl', label: 'Return 200 OK', isReturn: true },
        { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'JSON İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'auth-service-fe', label: 'HTTP Cevabı', isReturn: true },
        { fromNodeId: 'auth-service-fe', toNodeId: 'login-comp', label: 'Giriş Başarılı!', isReturn: true }
      ]
    },
    {
      id: 'register',
      name: '2. Kayıt Ol (Register)',
      steps: [
        { fromNodeId: 'register-comp', toNodeId: 'auth-service-fe', label: 'register()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /register' },
        { fromNodeId: 'gateway-group', toNodeId: 'mw-log', label: 'Yönlendir' },
        { fromNodeId: 'mw-log', toNodeId: 'auth-ctrl', label: 'İlet' },
        { fromNodeId: 'auth-ctrl', toNodeId: 'dto-reg', label: 'DTO' },
        { fromNodeId: 'dto-reg', toNodeId: 'auth-svc-be', label: 'Devret' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'pw-hasher', label: 'Şifrele' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'ent-user', label: 'Entity Oluştur' },
        { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Kaydet' },
        { fromNodeId: 'uow-repo', toNodeId: 'db-context', label: 'SaveChanges' },
        { fromNodeId: 'db-context', toNodeId: 'db', label: 'INSERT' },
        
        { fromNodeId: 'db', toNodeId: 'db-context', label: '1 Row Affected', isReturn: true },
        { fromNodeId: 'db-context', toNodeId: 'auth-svc-be', label: 'Kayıt Başarılı', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'email-svc', label: 'Onay Maili At', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Return 201', isReturn: true },
        { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'auth-service-fe', label: 'HTTP Cevabı', isReturn: true },
        { fromNodeId: 'auth-service-fe', toNodeId: 'register-comp', label: 'Kayıt Olundu!', isReturn: true }
      ]
    },
    {
      id: 'forgot-password',
      name: '3. Şifremi Unuttum',
      steps: [
        { fromNodeId: 'forgot-password-comp', toNodeId: 'auth-service-fe', label: 'forgotPassword()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /forgot-password' },
        { fromNodeId: 'gateway-group', toNodeId: 'auth-ctrl', label: 'İlet' },
        { fromNodeId: 'auth-ctrl', toNodeId: 'auth-svc-be', label: 'Talebi İlet' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'uow-repo', label: 'Email Ara' },
        { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'SELECT' },
        
        { fromNodeId: 'db', toNodeId: 'auth-svc-be', label: 'Kullanıcı Bulundu', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'jwt-svc', label: 'Token Üret', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'email-svc', label: 'Link Gönder', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Return OK', isReturn: true },
        { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'forgot-password-comp', label: 'Mail Gönderildi', isReturn: true }
      ]
    },
    {
      id: 'reset-password',
      name: '4. Şifre Sıfırlama (Reset)',
      steps: [
        { fromNodeId: 'reset-password-comp', toNodeId: 'auth-service-fe', label: 'resetPassword()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /reset-password', subLabel: 'HTTP (PasswordResetDto)' },
        { fromNodeId: 'gateway-group', toNodeId: 'auth-ctrl', label: 'İlet' },
        { fromNodeId: 'auth-ctrl', toNodeId: 'dto-pass', label: 'DTO', subLabel: 'Token & NewPassword' },
        { fromNodeId: 'dto-pass', toNodeId: 'auth-svc-be', label: 'Şifre Değiştir' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'jwt-svc', label: 'Token Doğrula' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'pw-hasher', label: 'Yeni Şifre Hash' },
        { fromNodeId: 'pw-hasher', toNodeId: 'ent-user', label: 'User Güncelle' },
        { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Update' },
        { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'UPDATE', subLabel: 'SQL Server' },
        
        { fromNodeId: 'db', toNodeId: 'auth-svc-be', label: 'DB Kaydedildi', isReturn: true, subLabel: 'Success (true)' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Return 200 OK', isReturn: true },
        { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'reset-password-comp', label: 'Şifre Değişti!', isReturn: true, subLabel: '200 OK' }
      ]
    },
    {
      id: 'confirm-email',
      name: '5. Email Doğrulama',
      steps: [
        { fromNodeId: 'confirm-email-comp', toNodeId: 'auth-service-fe', label: 'confirm()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /confirm-email' },
        { fromNodeId: 'gateway-group', toNodeId: 'auth-ctrl', label: 'İlet' },
        { fromNodeId: 'auth-ctrl', toNodeId: 'dto-confirm', label: 'DTO' },
        { fromNodeId: 'dto-confirm', toNodeId: 'auth-svc-be', label: 'Hesabı Onayla' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'uow-repo', label: 'User Bul' },
        { fromNodeId: 'auth-svc-be', toNodeId: 'ent-user', label: 'IsConfirmed = true' },
        { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Update' },
        { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'UPDATE' },
        
        { fromNodeId: 'db', toNodeId: 'auth-svc-be', label: 'Değişiklik Kaydedildi', isReturn: true },
        { fromNodeId: 'auth-svc-be', toNodeId: 'auth-ctrl', label: 'Return 200 OK', isReturn: true },
        { fromNodeId: 'auth-ctrl', toNodeId: 'gateway-group', label: 'İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'confirm-email-comp', label: 'Email Onaylandı!', isReturn: true }
      ]
    },
    {
      id: 'update-profile',
      name: '6. Hesap (Profil) Düzenleme',
      steps: [
        { fromNodeId: 'profile-comp', toNodeId: 'auth-service-fe', label: 'updateProfile()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'PUT /update-profile' },
        { fromNodeId: 'gateway-group', toNodeId: 'mw-log', label: 'Auth Kontrol' },
        { fromNodeId: 'mw-log', toNodeId: 'user-ctrl', label: 'İlet' },
        { fromNodeId: 'user-ctrl', toNodeId: 'dto-upd', label: 'DTO' },
        { fromNodeId: 'dto-upd', toNodeId: 'user-svc-be', label: 'Profili Güncelle' },
        { fromNodeId: 'user-svc-be', toNodeId: 'mapping-prof', label: 'AutoMapper' },
        { fromNodeId: 'mapping-prof', toNodeId: 'ent-user', label: 'Entity Match' },
        { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Update' },
        { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'UPDATE' },
        
        { fromNodeId: 'db', toNodeId: 'user-svc-be', label: 'DB Update', isReturn: true },
        { fromNodeId: 'user-svc-be', toNodeId: 'user-ctrl', label: 'Return 200 OK', isReturn: true },
        { fromNodeId: 'user-ctrl', toNodeId: 'gateway-group', label: 'İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'profile-comp', label: 'Profil Kaydedildi!', isReturn: true }
      ]
    },
    {
      id: 'ban-user',
      name: '7. Kullanıcı Banlama (Admin)',
      steps: [
        { fromNodeId: 'users-management-comp', toNodeId: 'auth-service-fe', label: 'banUser()' },
        { fromNodeId: 'auth-service-fe', toNodeId: 'gateway-group', label: 'POST /admin/ban' },
        { fromNodeId: 'gateway-group', toNodeId: 'mw-ban', label: 'Yetki Kontrol (Role)' },
        { fromNodeId: 'mw-ban', toNodeId: 'admin-ctrl', label: 'İlet' },
        { fromNodeId: 'admin-ctrl', toNodeId: 'admin-svc-be', label: 'Kullanıcıyı Yasakla' },
        { fromNodeId: 'admin-svc-be', toNodeId: 'uow-repo', label: 'User Bul' },
        { fromNodeId: 'admin-svc-be', toNodeId: 'ent-user', label: 'IsBanned = true' },
        { fromNodeId: 'ent-user', toNodeId: 'uow-repo', label: 'Update' },
        { fromNodeId: 'uow-repo', toNodeId: 'db', label: 'UPDATE' },
        
        { fromNodeId: 'db', toNodeId: 'admin-svc-be', label: 'Ban Kaydedildi', isReturn: true },
        { fromNodeId: 'admin-svc-be', toNodeId: 'admin-ctrl', label: 'Return 200 OK', isReturn: true },
        { fromNodeId: 'admin-ctrl', toNodeId: 'gateway-group', label: 'İlet', isReturn: true },
        { fromNodeId: 'gateway-group', toNodeId: 'users-management-comp', label: 'Kullanıcı Banlandı!', isReturn: true }
      ]
    }
  ];

  activeFlowId = signal<string | null>(null);
  currentStepIndex = signal<number>(-1);
  isAnimationFinished = signal<boolean>(false); 
  animationTimer: any;
  needsRecalculation = true; 

  svgLines = signal<SvgLine[]>([]);
  groupSvgLines = signal<{path: string}[]>([]); 

  @HostListener('window:resize')
  onResize() {
    this.scheduleRecalculation();
  }

  ngAfterViewChecked() {
    if (this.needsRecalculation) {
      this.calculateSvgLines();
      this.needsRecalculation = false;
    }
  }

  scheduleRecalculation() {
    this.needsRecalculation = true;
  }

  toggleGroup(node: ChildNode, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (node.isGroup) {
      node.expanded = !node.expanded;
      this.scheduleRecalculation();
    }
  }

  onBoxClick(node: any, event?: MouseEvent) {
    if (this.hasNodeMoved) return; // Sürüklediyse tıklama algılanmasın
    
    let targetFlowId: string | null = null;
    switch (node.id) {
      case 'login-comp': targetFlowId = 'login'; break;
      case 'register-comp': targetFlowId = 'register'; break;
      case 'profile-comp': targetFlowId = 'update-profile'; break;
      case 'users-management-comp': targetFlowId = 'ban-user'; break;
      case 'forgot-password-comp': targetFlowId = 'forgot-password'; break;
      case 'reset-password-comp': targetFlowId = 'reset-password'; break;
      case 'confirm-email-comp': targetFlowId = 'confirm-email'; break;
    }

    if (targetFlowId) {
      this.selectFlow(targetFlowId);
    }
    // Bilgi paneli (openNodeDetails) SADECE "Detayları Gör (3 Nokta)" ikonuna basılınca açılacak.
  }

  // YENİ: Boşluğa tıklanınca flow'u temizleme
  onBoardClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Eğer kutuya, yan panele veya üst menüye TIKLANMADIYSA (yani boşluğa tıklandıysa)
    if (!target.closest('.schema-box') && 
        !target.closest('.flow-legend-panel') && 
        !target.closest('.schema-toolbar')) {
      
      if (this.activeFlowId()) {
        if (this.showInactiveNodes()) {
          // Tüm mimari (sönük/karma) modundaysa, sadece aktif akışa (oklu yere) dön
          this.showInactiveNodes.set(false);
        } else {
          // Zaten sadece oklu yerdeyse, akışı sıfırla ve anasayfaya dön
          this.selectFlow(null);
        }
      }
    }
  }

  onFlowChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectFlow(target.value);
  }

  selectFlow(flowId: string | null) {
    this.stopAnimation();
    this.isAnimationFinished.set(false);
    
    if (this.activeFlowId() === flowId || flowId === null) {
      this.activeFlowId.set(null);
      this.activeFlowData.set(null);
      this.currentStepIndex.set(-1);
      this.collapseAllGroups(); // Genel görünüme geçince tüm grupları kapat
      this.resetNodePositions(); // Kutuların kaydırılmış pozisyonlarını da sıfırla
    } else if (flowId) {
      this.activeFlowId.set(flowId);
      this.activeFlowData.set(this.flows.find(f => f.id === flowId) || null);
      this.showInactiveNodes.set(false); // Yeni akış başladığında varsayılan olarak ekranı temizle
      this.expandGroupsInFlow(flowId);
      
      setTimeout(() => {
        this.startAnimation();
      }, 100);
    } else {
      this.activeFlowId.set(null);
      this.activeFlowData.set(null);
      this.currentStepIndex.set(-1);
      this.calculateSvgLines();
    }
  }

  toggleInactiveNodes() {
    this.showInactiveNodes.set(!this.showInactiveNodes());
    setTimeout(() => {
      this.calculateSvgLines();
    }, 50);
  }

  expandGroupsInFlow(flowId: string) {
    const flow = this.flows.find(f => f.id === flowId);
    if (!flow) return;

    const activeNodeIds = new Set<string>();
    flow.steps.forEach(s => {
      activeNodeIds.add(s.fromNodeId);
      activeNodeIds.add(s.toNodeId);
    });

    let changed = false;
    this.layers.forEach(layer => {
      // Normal nodes
      if (layer.nodes) {
        layer.nodes.forEach(node => {
          if (node.isGroup && node.children) {
            if (activeNodeIds.has(node.id) || node.children.some(c => activeNodeIds.has(c.id))) {
              if (!node.expanded) {
                node.expanded = true;
                changed = true;
              }
            }
          }
        });
      }
      
      // Left nodes
      if (layer.leftNodes) {
        layer.leftNodes.forEach(node => {
          if (node.isGroup && node.children) {
            if (activeNodeIds.has(node.id) || node.children.some(c => activeNodeIds.has(c.id))) {
              if (!node.expanded) {
                node.expanded = true;
                changed = true;
              }
            }
          }
        });
      }

      // Right nodes
      if (layer.rightNodes) {
        layer.rightNodes.forEach(node => {
          if (node.isGroup && node.children) {
            if (activeNodeIds.has(node.id) || node.children.some(c => activeNodeIds.has(c.id))) {
              if (!node.expanded) {
                node.expanded = true;
                changed = true;
              }
            }
          }
        });
      }
    });

    if (changed) {
      this.scheduleRecalculation();
    }
  }

  // YENİ: Seçim iptal edildiğinde (tüm mimari gösterildiğinde) ekranın düzenli durması için tüm grupları kapatır.
  collapseAllGroups() {
    let changed = false;
    this.layers.forEach(layer => {
      const lists = [layer.nodes, layer.leftNodes, layer.rightNodes];
      lists.forEach(nodeList => {
        if (nodeList) {
          nodeList.forEach(node => {
            if (node.isGroup && node.expanded) {
              node.expanded = false;
              changed = true;
            }
          });
        }
      });
    });
    
    if (changed) {
      this.scheduleRecalculation();
    }
  }

  startAnimation() {
    this.currentStepIndex.set(0); 
    this.isAnimationFinished.set(false);
    this.calculateSvgLines(); 

    // Artık setInterval yok, tüm oklar anında aktif ve animasyonlu akacak.
    // İlk kutuya focuslanalım.
    this.scrollToCurrentStep();
  }

  // YENİ: Okun kutunun içinden geçmesini engellemek için kesişim (Intersection) noktası hesaplama


  smoothScrollTo(element: HTMLElement, container: HTMLElement, duration: number) {
    const startLeft = container.scrollLeft;
    const startTop = container.scrollTop;
    
    const elRect = element.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    
    const targetLeft = startLeft + (elRect.left - contRect.left) - (contRect.width / 2) + (elRect.width / 2);
    const targetTop = startTop + (elRect.top - contRect.top) - (contRect.height / 2) + (elRect.height / 2);

    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Yumuşak İvmelenme ve Yavaşlama (Ease-in-out Cubic)
      const easeInOutCubic = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      container.scrollLeft = startLeft + (targetLeft - startLeft) * easeInOutCubic;
      container.scrollTop = startTop + (targetTop - startTop) * easeInOutCubic;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  scrollToCurrentStep() {
    const flowId = this.activeFlowId();
    if (!flowId || !this.boardWrapper) return;

    const flow = this.flows.find(f => f.id === flowId);
    if (!flow) return;

    const currentIndex = this.currentStepIndex();
    if (currentIndex >= 0 && currentIndex < flow.steps.length) {
      const step = flow.steps[currentIndex];
      const targetEl = document.getElementById(step.toNodeId);
      
      if (targetEl && this.boardWrapper.nativeElement) {
        // YENİ: Tarayıcının ani zıplaması yerine daha hızlı bir sinematik kaydırma
        this.smoothScrollTo(targetEl, this.boardWrapper.nativeElement, 600);
      }
    }
  }

  stopAnimation() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  isNodeInFlow(nodeId: string): boolean {
    const flowId = this.activeFlowId();
    if (!flowId) return true; 
    const flow = this.flows.find(f => f.id === flowId);
    if (!flow) return true;
    return flow.steps.some(s => s.fromNodeId === nodeId || s.toNodeId === nodeId);
  }

  isNodeHighlighted(nodeId: string): boolean {
    const flowId = this.activeFlowId();
    if (!flowId) return false;
    if (this.isAnimationFinished()) return this.isNodeInFlow(nodeId);
    
    const flow = this.flows.find(f => f.id === flowId);
    if (!flow) return false;
    
    const currentIndex = this.currentStepIndex();
    if (currentIndex === -1) return false;
    
    const step = flow.steps[currentIndex];
    return step.fromNodeId === nodeId || step.toNodeId === nodeId;
  }

  openNodeDetails(nodeId: string) {
    const detail = NODE_DETAILS[nodeId];
    if (detail) {
      this.selectedNode.set(detail);
    } else {
      this.selectedNode.set({
        id: nodeId,
        title: nodeId,
        description: 'Bu sınıf veya modül için henüz detaylı bir dokümantasyon eklenmemiştir.',
      });
    }
  }

  // --- DRAGGABLE PANEL METOTLARI ---
  
  onPanelMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return; 
    
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    const panel = document.querySelector('.flow-legend-panel') as HTMLElement;
    if (!this.hasMoved && panel) {
       const rect = panel.getBoundingClientRect();
       this.panelLeft = rect.left;
       this.panelTop = rect.top;
       this.hasMoved = true;
    }
    event.preventDefault(); 
  }

  @HostListener('document:mousemove', ['$event'])
  onPanelMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;
      
      this.panelLeft += dx;
      this.panelTop += dy;
      
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    } else if (this.draggingNodeId) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.hasNodeMoved = true;
      }

      const currentOffset = this.nodeOffsets.get(this.draggingNodeId) || { x: 0, y: 0 };
      this.nodeOffsets.set(this.draggingNodeId, {
        x: currentOffset.x + dx,
        y: currentOffset.y + dy
      });

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    }
  }

  @HostListener('document:mouseup')
  onPanelMouseUp() {
    this.isDragging = false;
    this.draggingNodeId = null;
    // hasNodeMoved is NOT reset here, it will be checked in the next click event, and reset on the next mousedown
  }

  // YENİ: Kutuları sürüklemek için
  onNodeDragStart(event: MouseEvent, nodeId: string) {
    // Tıklamaların doğru algılanması için her yeni mousedown'da bunu sıfırla
    this.hasNodeMoved = false;

    if ((event.target as HTMLElement).tagName === 'BUTTON') return;
    if ((event.target as HTMLElement).classList.contains('group-icon')) return; // Grup iconunu es geç
    
    // Yalnızca sol tık ile sürükleme
    if (event.button !== 0) return;

    // Akış (flow) seçili değilse (yani genel görünümdeysek) sürüklemeyi engelle
    if (!this.activeFlowId()) return;

    // Pasif (görünür ama akışa dahil olmayan) kutuların sürüklenmesini engelle
    if (!this.isNodeInFlow(nodeId)) return;
    
    // Metin seçimi vb engelleme (istemiyorsan silebilirsin ama sürüklerken faydalı)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    this.draggingNodeId = nodeId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  getNodeTransform(nodeId: string): string {
    const offset = this.nodeOffsets.get(nodeId);
    if (!offset) return 'translate(0px, 0px)';
    return `translate(${offset.x}px, ${offset.y}px)`;
  }

  hasAnyNodeMoved(): boolean {
    return this.nodeOffsets.size > 0;
  }

  resetNodePositions() {
    this.nodeOffsets.clear();
    
    // Kutuların inline olarak atanmış yüksekliklerini (minHeight) temizle
    const wrapper = this.boardWrapper.nativeElement;
    const allBoxes = wrapper.querySelectorAll('.schema-box');
    allBoxes.forEach((box: Element) => {
      (box as HTMLElement).style.minHeight = '';
    });

    this.calculateSvgLines();
  }

  togglePanelMinimize(event: Event) {
    event.stopPropagation();
    this.isPanelMinimized.set(!this.isPanelMinimized());
  }

  closeNodeDetails() {
    this.selectedNode.set(null);
  }

  calculateSvgLines() {
    if (!this.boardWrapper) return;
    const wrapper = this.boardWrapper.nativeElement;
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const getOffset = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top - wrapperRect.top + wrapper.scrollTop,
        bottom: rect.bottom - wrapperRect.top + wrapper.scrollTop,
        left: rect.left - wrapperRect.left + wrapper.scrollLeft,
        right: rect.right - wrapperRect.left + wrapper.scrollLeft,
        centerX: rect.left - wrapperRect.left + wrapper.scrollLeft + rect.width / 2,
        centerY: rect.top - wrapperRect.top + wrapper.scrollTop + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
    };

    const activeFlow = this.activeFlowData();
    if (!activeFlow) { this.svgLines.set([]); return; }
    
    // 1. TÜM görünür kutuların (obstacle) konumlarını topla
    const allBoxes: {id: string, top: number, bottom: number, left: number, right: number}[] = [];
    const allBoxEls = wrapper.querySelectorAll('.schema-box:not(.hidden-node)');
    allBoxEls.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const off = getOffset(htmlEl);
      allBoxes.push({
        id: htmlEl.id || '',
        top: off.top - 5,
        bottom: off.bottom + 5,
        left: off.left - 5,
        right: off.right + 5
      });
    });

    // 2. Global sınırlar
    let globalTop = 99999;
    let globalBottom = 0;
    let globalLeft = 99999;
    let globalRight = 0;
    
    allBoxes.forEach(box => {
      if (box.top < globalTop) globalTop = box.top;
      if (box.bottom > globalBottom) globalBottom = box.bottom;
      if (box.left < globalLeft) globalLeft = box.left;
      if (box.right > globalRight) globalRight = box.right;
    });

    // 3. Kenar Kullanım Sayımlarını Belirle (Okların üst üste binmesini engeller)
    const edgeTotal = new Map<string, number>(); // key: 'nodeId-left' or 'nodeId-right'
    const stepEdges = new Map<number, { fromEdge: 'left'|'right', toEdge: 'left'|'right' }>();

    activeFlow.steps.forEach((step, i) => {
      const elFrom = document.getElementById(step.fromNodeId);
      const elTo = document.getElementById(step.toNodeId);
      if (!elFrom || !elTo) return;

      const from = getOffset(elFrom);
      const to = getOffset(elTo);
      const dx = to.centerX - from.centerX;
      const dy = to.centerY - from.centerY;
      
      const isSameColumn = Math.abs(dx) < 200;
      const isAdjacent = Math.abs(dx) >= 200 && Math.abs(dx) < 500;
      const isReturn = step.isReturn || false;
      const goingRight = dx > 0;

      let fromEdge: 'left' | 'right' = 'right';
      let toEdge: 'left' | 'right' = 'left';

      if (isSameColumn) {
        if (isReturn) {
          fromEdge = 'left';
          toEdge = 'left';
        } else {
          fromEdge = 'right';
          toEdge = 'right';
        }
      } else if (isAdjacent && Math.abs(dy) < 150) {
        fromEdge = goingRight ? 'right' : 'left';
        toEdge = goingRight ? 'left' : 'right';
      } else {
        fromEdge = goingRight ? 'right' : 'left';
        toEdge = goingRight ? 'left' : 'right';
      }

      stepEdges.set(i, { fromEdge, toEdge });

      const fromKey = `${step.fromNodeId}-${fromEdge}`;
      const toKey = `${step.toNodeId}-${toEdge}`;
      
      edgeTotal.set(fromKey, (edgeTotal.get(fromKey) || 0) + 1);
      edgeTotal.set(toKey, (edgeTotal.get(toKey) || 0) + 1);
    });

    // 4. Kutu Boylarını (min-height) Kenardaki Gerçek Ok Sayısına Göre Büyüt
    // Bu sayede oklar hiçbir zaman kutunun dışına (havaya) taşmaz!
    allBoxEls.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.id;
      if (id) {
        const leftTotal = edgeTotal.get(`${id}-left`) || 0;
        const rightTotal = edgeTotal.get(`${id}-right`) || 0;
        const maxConns = Math.max(leftTotal, rightTotal);
        // Her bağlantı 36px mesafe gerektirir
        const reqHeight = Math.max(60, maxConns * 36 + 20); 
        htmlEl.style.minHeight = `${reqHeight}px`;
      }
    });

    // 5. Boylar olası bir şekilde büyüdüğü için koordinatları TAZELİYORUZ
    allBoxes.length = 0;
    allBoxEls.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const off = getOffset(htmlEl);
      allBoxes.push({
        id: htmlEl.id || '',
        top: off.top - 5,
        bottom: off.bottom + 5,
        left: off.left - 5,
        right: off.right + 5
      });
    });

    // Global sınırları tekrar hesapla
    globalTop = 99999;
    globalBottom = 0;
    globalLeft = 99999;
    globalRight = 0;
    
    allBoxes.forEach(box => {
      if (box.top < globalTop) globalTop = box.top;
      if (box.bottom > globalBottom) globalBottom = box.bottom;
      if (box.left < globalLeft) globalLeft = box.left;
      if (box.right > globalRight) globalRight = box.right;
    });

    const edgeCurrent = new Map<string, number>();
    const pairCount = new Map<string, number>();

    const newLines: SvgLine[] = [];
    
    // Global yatay koridor kullanım sayaçları (üst üste binmeyi engeller)
    let topCorridorCount = 0;
    let bottomCorridorCount = 0;

    activeFlow.steps.forEach((step, i) => {
      const edges = stepEdges.get(i);
      if (!edges) return;

      const elFrom = document.getElementById(step.fromNodeId);
      const elTo = document.getElementById(step.toNodeId);

      if (!elFrom || !elTo) return;

      const from = getOffset(elFrom);
      const to = getOffset(elTo);

      const fromKey = `${step.fromNodeId}-${edges.fromEdge}`;
      const toKey = `${step.toNodeId}-${edges.toEdge}`;
      
      const fromTotal = edgeTotal.get(fromKey) || 1;
      const toTotal = edgeTotal.get(toKey) || 1;

      const fromIdx = (edgeCurrent.get(fromKey) || 0) + 1;
      const toIdx = (edgeCurrent.get(toKey) || 0) + 1;
      
      edgeCurrent.set(fromKey, fromIdx);
      edgeCurrent.set(toKey, toIdx);

      const pairKey = `${step.fromNodeId}>${step.toNodeId}`;
      const pairIdx = (pairCount.get(pairKey) || 0);
      pairCount.set(pairKey, pairIdx + 1);

      // Jitter: aynı çiftten giden çoklu okları birbirinden ayır
      const jitter = pairIdx * 20;

      // Kutunun KENARINDAKİ bağlantı noktalarını SABİT aralıklarla dağıt (Yatay çizgilerin ve ok uçlarının üst üste binmesini tamamen engeller!)
      const spacing = 36;
      
      const outTotalHeight = (fromTotal - 1) * spacing;
      const outStartY = from.centerY - (outTotalHeight / 2);
      const fixedY1 = outStartY + (fromIdx - 1) * spacing;

      const inTotalHeight = (toTotal - 1) * spacing;
      const inStartY = to.centerY - (inTotalHeight / 2);
      const fixedY2 = inStartY + (toIdx - 1) * spacing;

      const dx = to.centerX - from.centerX;
      const dy = to.centerY - from.centerY;
      const goingRight = dx > 0;

      let x1: number, y1: number, x2: number, y2: number;
      let pathD: string;
      let labelX: number, labelY: number;

      // Aynı kutu kontrolü
      const sameBox = Math.abs(dx) < 10 && Math.abs(dy) < 10;
      if (sameBox) return;

      // ── ORTOGONAL (GUTTER) ROUTING ALGORİTMASI ──
      // Kutu içinden geçmeleri %100 engellemek için sadece YAN kenarları kullanıyoruz.

      const isSameColumn = Math.abs(dx) < 200;
      const isAdjacent = Math.abs(dx) >= 200 && Math.abs(dx) < 500;
      const isReturn = step.isReturn || false;

      // 1. Aynı Kolon veya Alt Alta (dx küçük)
      if (isSameColumn) {
        if (isReturn) {
          // Sol taraftan bracket ([) çiz
          x1 = from.left;
          y1 = fixedY1;
          x2 = to.left;
          y2 = fixedY2;
          
          const gutterX = Math.min(from.left, to.left) - 40 - (fromIdx * 20);
          
          pathD = `M ${x1} ${y1} L ${gutterX} ${y1} L ${gutterX} ${y2} L ${x2} ${y2}`;
          labelX = gutterX;
          labelY = (y1 + y2) / 2;
        } else {
          // Sağ taraftan bracket (]) çiz
          x1 = from.right;
          y1 = fixedY1;
          x2 = to.right;
          y2 = fixedY2;
          
          const gutterX = Math.max(from.right, to.right) + 40 + (fromIdx * 20);
          
          pathD = `M ${x1} ${y1} L ${gutterX} ${y1} L ${gutterX} ${y2} L ${x2} ${y2}`;
          labelX = gutterX;
          labelY = (y1 + y2) / 2;
        }

      // 2. Yan Yana Kolonlar (Yatay Bağlantı)
      } else if (isAdjacent && Math.abs(dy) < 150) {
        // Basit yatay çizgi
        x1 = goingRight ? from.right : from.left;
        y1 = fixedY1;
        x2 = goingRight ? to.left : to.right;
        y2 = fixedY2;
        
        // midX'i fromIdx'e göre az miktarda kaydır ki çok bitişik kolonlarda ters yöne ok çıkmasın (overshoot engeli)
        const midX = x1 + (x2 - x1) / 2 + (fromIdx * 6 * (goingRight ? 1 : -1));
        pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        labelX = midX;
        labelY = (y1 + y2) / 2;

      // 3. Uzak Kolonlar veya Çapraz/Wrap bağlantılar (Global Koridor)
      } else {
        // from'un çıkış yönü
        x1 = goingRight ? from.right : from.left;
        y1 = fixedY1;
        // Dikey koridorları (gutter) fromIdx'e göre kaydır
        const gutter1X = goingRight ? x1 + 30 + (fromIdx * 20) : x1 - 30 - (fromIdx * 20);

        // to'nun giriş yönü
        x2 = goingRight ? to.left : to.right;
        y2 = fixedY2;
        const gutter2X = goingRight ? x2 - 30 - (toIdx * 20) : x2 + 30 + (toIdx * 20);

        // Üstten mi alttan mı dolaşalım?
        const midY = (y1 + y2) / 2;
        const diagramMidY = (globalTop + globalBottom) / 2;
        
        let corridorY;
        if (midY < diagramMidY) {
           topCorridorCount++;
           corridorY = globalTop - 40 - (topCorridorCount * 24);
        } else {
           bottomCorridorCount++;
           corridorY = globalBottom + 40 + (bottomCorridorCount * 24);
        }

        pathD = `M ${x1} ${y1} L ${gutter1X} ${y1} L ${gutter1X} ${corridorY} L ${gutter2X} ${corridorY} L ${gutter2X} ${y2} L ${x2} ${y2}`;
        
        labelX = (gutter1X + gutter2X) / 2;
        labelY = corridorY;
      }

      let lineColor = step.isReturn ? '#10b981' : '#3b82f6';
      let markerEnd = step.isReturn ? 'arrowhead-return' : 'arrowhead-active';

      newLines.push({
        id: `${step.fromNodeId}-${step.toNodeId}-${i}`, 
        x1, y1, x2, y2, midX: labelX, labelX, labelY,
        pathD,
        label: step.label,
        subLabel: step.subLabel,
        active: true,
        isReturn: step.isReturn || false,
        isDefaultBackground: false,
        stepIndex: i + 1,
        lineColor,
        markerEnd
      });
    });

    this.svgLines.set(newLines);

    // ==========================================
    // YENİ: Grup Hiyerarşisi Çizgilerini Hesapla
    // ==========================================
    const newGroupLines: {path: string}[] = [];
    const groupEls = wrapper.querySelectorAll('.schema-box.is-group:not(.hidden-node)');
    
    groupEls.forEach((groupEl: Element) => {
      const container = groupEl.nextElementSibling;
      if (container && container.classList.contains('group-children-container')) {
        const pOffset = getOffset(groupEl as HTMLElement);
        const startX = pOffset.left + 12; // Parent'ın solundan 12px içeride
        const startY = pOffset.bottom;
        
        const children = container.querySelectorAll('.child-box:not(.hidden-node)');
        children.forEach((childEl: Element) => {
          const cOffset = getOffset(childEl as HTMLElement);
          
          // Düz inip sağa dönen (L şeklinde) path
          // Parent bottom -> Child Center Y -> Child Left Edge
          const path = `M ${startX} ${startY} L ${startX} ${cOffset.centerY} L ${cOffset.left} ${cOffset.centerY}`;
          newGroupLines.push({ path });
        });
      }
    });

    this.groupSvgLines.set(newGroupLines);
  }
}
