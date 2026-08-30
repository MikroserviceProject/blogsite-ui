import { Component, OnDestroy, AfterViewChecked, HostListener, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POST_NODE_DETAILS, NodeDetail } from './post-node-details.data';
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
  selector: 'app-post-architecture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-architecture.component.html',
  styleUrl: './post-architecture.component.css'
})
export class PostArchitectureComponent implements OnDestroy, AfterViewChecked {

  showInactiveNodes = signal(false);
  activeFlowData = signal<FlowPath | null>(null);

  @ViewChild('boardWrapper') boardWrapper!: ElementRef;

  selectedNode = signal<NodeDetail | null>(null);

  // DRAG & DROP (Panel) STATE
  isPanelMinimized = signal(true);
  isDragging = false;
  panelLeft = 20;
  panelTop = 100;
  hasMoved = false;
  dragStartX = 0;
  dragStartY = 0;

  positionTrackerInterval: any;
  private lastElementPositions = new Map<string, string>();

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

  startPositionTracker() {
    if (!this.positionTrackerInterval) {
      this.positionTrackerInterval = setInterval(() => {
         if (this.activeFlowData()) {
            this.checkAndRecalculateIfMoved();
         }
      }, 50);
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
        { id: 'blog-home-comp', name: 'blog-home.component.ts', type: 'component' },
        { id: 'blog-detail-comp', name: 'blog-detail.component.ts', type: 'component' },
        { id: 'post-create-comp', name: 'post-create.component.ts', type: 'component' },
        { id: 'tag-detail-comp', name: 'tag-detail.component.ts', type: 'component' }
      ]
    },
    {
      id: 'frontend-services',
      title: '2. FRONTEND: Servisler (HTTP İstekleri)',
      nodes: [
        { id: 'toast-service', name: 'toast.service.ts', subName: '(Yardımcı)', type: 'service-helper' },
        { id: 'blog-service-fe', name: 'blog.service.ts', type: 'service-main' }
      ]
    },
    {
      id: 'backend-api',
      title: '3. BACKEND: API (Controller)',
      nodes: [
        { id: 'posts-ctrl', name: 'PostsController.cs', type: 'controller' },
        {
          id: 'helper-methods-group', name: 'Yardımcı Metodlar', type: 'controller', isGroup: true, expanded: false,
          children: [
            { id: 'get-current-user-id', name: 'GetCurrentUserId()', type: 'controller', desc: 'JWT claim\'inden kullanıcı id\'si okur' },
            { id: 'try-save-photo', name: 'TrySavePhotoAsync()', type: 'controller', desc: 'Kapak fotoğrafını doğrular ve kaydeder' }
          ]
        }
      ]
    },
    {
      id: 'backend-core',
      title: '4. BACKEND: İş Mantığı (CORE)',
      isTwoColumn: true,
      leftNodes: [
        { id: 'post-svc-be', name: 'PostService.cs', type: 'service-be' },
        {
          id: 'dtos-group', name: 'DTOs (Veri Transfer)', type: 'service-be', isGroup: true, expanded: false,
          children: [
            { id: 'dto-create', name: 'CreatePostDto.cs', type: 'service-be', desc: 'Yeni yazı verisi' },
            { id: 'dto-update', name: 'UpdatePostDto.cs', type: 'service-be', desc: 'Güncelleme verisi' },
            { id: 'dto-response', name: 'PostResponseDto.cs', type: 'service-be', desc: 'Standart dönüş' },
            { id: 'dto-admindelete', name: 'AdminDeletePostDto.cs', type: 'service-be', desc: 'Admin silme gerekçesi' }
          ]
        },
        { id: 'ent-post', name: 'Post.cs', subName: '(Entity)', type: 'service-be' }
      ],
      rightNodes: [
        { id: 'mapping-prof', name: 'MappingProfile.cs', subName: '(AutoMapper)', type: 'helper-be' }
      ]
    },
    {
      id: 'backend-data',
      title: '5. BACKEND: Veri Erişimi (Repository) → VERİTABANI',
      direction: 'horizontal',
      nodes: [
        { id: 'post-repo', name: 'PostRepository.cs', subName: '(GenericRepository<Post>)', type: 'data-ef' },
        { id: 'db-context', name: 'BlogDbContext.cs', subName: '(Entity Framework / Npgsql)', type: 'data-ef' },
        { id: 'db', name: 'PostgreSQL', type: 'db' }
      ]
    }
  ];

  flows: FlowPath[] = [
    {
      id: 'list-posts',
      name: '1. Blog Listesini Görüntüleme',
      steps: [
        { fromNodeId: 'blog-home-comp', toNodeId: 'blog-service-fe', label: 'loadPosts()' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'GET /api/posts/paged', subLabel: 'HTTP Request' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'post-svc-be', label: 'GetPagedPostsAsync()' },
        { fromNodeId: 'post-svc-be', toNodeId: 'post-repo', label: 'Sayfalanmış Liste İste' },
        { fromNodeId: 'post-repo', toNodeId: 'db', label: 'SELECT ... LIMIT/OFFSET', subLabel: 'Npgsql / EF Core' },

        { fromNodeId: 'db', toNodeId: 'post-repo', label: 'Post Satırları', isReturn: true },
        { fromNodeId: 'post-repo', toNodeId: 'post-svc-be', label: '(Items, TotalCount)', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'mapping-prof', label: 'AutoMapper', isReturn: true },
        { fromNodeId: 'mapping-prof', toNodeId: 'post-svc-be', label: 'PostResponseDto[]', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'PagedResultDto', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: '200 OK JSON', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'blog-home-comp', label: 'Yazılar Listelendi!', isReturn: true }
      ]
    },
    {
      id: 'view-post',
      name: '2. Yazı Detayını Görüntüleme',
      steps: [
        { fromNodeId: 'blog-detail-comp', toNodeId: 'blog-service-fe', label: 'getById(id)' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'GET /api/posts/{id}' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'post-svc-be', label: 'GetPostAsync(id)' },
        { fromNodeId: 'post-svc-be', toNodeId: 'post-repo', label: 'GetByIdAsync(id)' },
        { fromNodeId: 'post-repo', toNodeId: 'db', label: 'SELECT WHERE Id = @id' },

        { fromNodeId: 'db', toNodeId: 'post-repo', label: 'Post Satırı', isReturn: true },
        { fromNodeId: 'post-repo', toNodeId: 'post-svc-be', label: 'Post Entity', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'mapping-prof', label: 'AutoMapper', isReturn: true },
        { fromNodeId: 'mapping-prof', toNodeId: 'post-svc-be', label: 'PostResponseDto', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'Return DTO', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: '200 OK', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'blog-detail-comp', label: 'Yazı Yüklendi!', isReturn: true }
      ]
    },
    {
      id: 'filter-by-tag',
      name: '3. Etikete Göre Filtreleme',
      steps: [
        { fromNodeId: 'tag-detail-comp', toNodeId: 'blog-service-fe', label: 'getAll(\'Published\', tag)' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'GET /api/posts?tag=...' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'post-svc-be', label: 'GetPostsAsync(tag)' },
        { fromNodeId: 'post-svc-be', toNodeId: 'post-repo', label: 'GetAllAsync(tag: ...)' },
        { fromNodeId: 'post-repo', toNodeId: 'db', label: 'Tags Eşleşme', subLabel: 'EF.Functions.ILike' },

        { fromNodeId: 'db', toNodeId: 'post-repo', label: 'Eşleşen Yazılar', isReturn: true },
        { fromNodeId: 'post-repo', toNodeId: 'post-svc-be', label: 'List<Post>', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'List<PostResponseDto>', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: '200 OK', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'tag-detail-comp', label: 'Etiket Sonuçları!', isReturn: true }
      ]
    },
    {
      id: 'create-post',
      name: '4. Yeni Yazı Oluşturma',
      steps: [
        { fromNodeId: 'post-create-comp', toNodeId: 'blog-service-fe', label: 'onSubmit() → performSave()' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'POST /api/posts', subLabel: 'multipart/form-data' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'try-save-photo', label: 'TrySavePhotoAsync(photo)' },
        { fromNodeId: 'try-save-photo', toNodeId: 'get-current-user-id', label: 'GetCurrentUserId()' },
        { fromNodeId: 'get-current-user-id', toNodeId: 'post-svc-be', label: 'CreatePostAsync(dto, authorId, photoUrl)' },
        { fromNodeId: 'post-svc-be', toNodeId: 'dto-create', label: 'Model Binding', subLabel: 'CreatePostDto' },
        { fromNodeId: 'dto-create', toNodeId: 'ent-post', label: 'Yeni Post Entity' },
        { fromNodeId: 'ent-post', toNodeId: 'post-repo', label: 'AddAsync(entity)' },
        { fromNodeId: 'post-repo', toNodeId: 'db-context', label: 'SaveChangesAsync()' },
        { fromNodeId: 'db-context', toNodeId: 'db', label: 'INSERT' },

        { fromNodeId: 'db', toNodeId: 'db-context', label: '1 Row Affected', isReturn: true },
        { fromNodeId: 'db-context', toNodeId: 'post-svc-be', label: 'Kayıt Başarılı', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'Return 201 Created', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: 'JSON İlet', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'post-create-comp', label: 'Yazı Yayınlandı!', isReturn: true }
      ]
    },
    {
      id: 'update-post',
      name: '5. Yazı Güncelleme',
      steps: [
        { fromNodeId: 'post-create-comp', toNodeId: 'blog-service-fe', label: 'performSave() → update()' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'PUT /api/posts/{id}' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'post-svc-be', label: 'UpdatePostAsync(id, dto, photoUrl)' },
        { fromNodeId: 'post-svc-be', toNodeId: 'dto-update', label: 'Model Binding', subLabel: 'UpdatePostDto' },
        { fromNodeId: 'dto-update', toNodeId: 'ent-post', label: 'Title/Content/Tags Güncelle' },
        { fromNodeId: 'ent-post', toNodeId: 'post-repo', label: 'Update + UpdatedAt' },
        { fromNodeId: 'post-repo', toNodeId: 'db-context', label: 'SaveChangesAsync()' },
        { fromNodeId: 'db-context', toNodeId: 'db', label: 'UPDATE' },

        { fromNodeId: 'db', toNodeId: 'db-context', label: 'Değişiklik Kaydedildi', isReturn: true },
        { fromNodeId: 'db-context', toNodeId: 'post-svc-be', label: 'OK', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'Return 200 OK', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: 'İlet', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'post-create-comp', label: 'Yazı Güncellendi!', isReturn: true }
      ]
    },
    {
      id: 'delete-post',
      name: '6. Yazı Silme',
      steps: [
        { fromNodeId: 'blog-detail-comp', toNodeId: 'blog-service-fe', label: 'deletePost(id)' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'DELETE /api/posts/{id}' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'post-svc-be', label: 'DeletePostAsync(id)' },
        { fromNodeId: 'post-svc-be', toNodeId: 'post-repo', label: 'GetByIdAsync + Remove(entity)' },
        { fromNodeId: 'post-repo', toNodeId: 'db-context', label: 'SaveChangesAsync()' },
        { fromNodeId: 'db-context', toNodeId: 'db', label: 'DELETE' },

        { fromNodeId: 'db', toNodeId: 'db-context', label: 'Silindi', isReturn: true },
        { fromNodeId: 'db-context', toNodeId: 'post-svc-be', label: 'true', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'Return 204 No Content', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: 'İlet', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'blog-detail-comp', label: 'Yazı Silindi!', isReturn: true }
      ]
    },
    {
      id: 'admin-delete-post',
      name: '7. Admin Tarafından Yazı Silme',
      steps: [
        { fromNodeId: 'blog-detail-comp', toNodeId: 'blog-service-fe', label: 'adminDelete(id, reason)' },
        { fromNodeId: 'blog-service-fe', toNodeId: 'posts-ctrl', label: 'POST /api/posts/{id}/admin-delete', subLabel: '[Authorize(Roles="Admin")]' },
        { fromNodeId: 'posts-ctrl', toNodeId: 'dto-admindelete', label: 'Model Binding', subLabel: 'AdminDeletePostDto (Reason)' },
        { fromNodeId: 'dto-admindelete', toNodeId: 'post-svc-be', label: 'AdminDeletePostAsync(id)' },
        { fromNodeId: 'post-svc-be', toNodeId: 'post-repo', label: 'GetByIdAsync + Remove(entity)' },
        { fromNodeId: 'post-repo', toNodeId: 'db-context', label: 'SaveChangesAsync()' },
        { fromNodeId: 'db-context', toNodeId: 'db', label: 'DELETE' },

        { fromNodeId: 'db', toNodeId: 'db-context', label: 'Silindi', isReturn: true },
        { fromNodeId: 'db-context', toNodeId: 'post-svc-be', label: 'Silinen Başlık', isReturn: true },
        { fromNodeId: 'post-svc-be', toNodeId: 'posts-ctrl', label: 'Return Title', isReturn: true },
        { fromNodeId: 'posts-ctrl', toNodeId: 'blog-service-fe', label: 'İlet', isReturn: true },
        { fromNodeId: 'blog-service-fe', toNodeId: 'blog-detail-comp', label: 'Admin Tarafından Silindi!', isReturn: true }
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
    if (this.hasNodeMoved) return;

    let targetFlowId: string | null = null;
    switch (node.id) {
      case 'blog-home-comp': targetFlowId = 'list-posts'; break;
      case 'blog-detail-comp': targetFlowId = 'view-post'; break;
      case 'tag-detail-comp': targetFlowId = 'filter-by-tag'; break;
      case 'post-create-comp': targetFlowId = 'create-post'; break;
    }

    if (targetFlowId) {
      this.selectFlow(targetFlowId);
    }
  }

  onBoardClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.schema-box') &&
        !target.closest('.flow-legend-panel') &&
        !target.closest('.schema-toolbar') &&
        !target.closest('.header-section')) {

      if (this.activeFlowId()) {
        if (this.showInactiveNodes()) {
          this.showInactiveNodes.set(false);
        } else {
          this.selectFlow(null);
        }
      }
    }
  }

  onFlowChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectFlow(target.value || null);
  }

  selectFlow(flowId: string | null) {
    this.stopAnimation();
    this.isAnimationFinished.set(false);

    if (this.activeFlowId() === flowId || flowId === null) {
      this.activeFlowId.set(null);
      this.activeFlowData.set(null);
      this.currentStepIndex.set(-1);
      this.collapseAllGroups();
      this.resetNodePositions();
    } else if (flowId) {
      this.activeFlowId.set(flowId);
      this.activeFlowData.set(this.flows.find(f => f.id === flowId) || null);
      this.showInactiveNodes.set(false);
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
    this.scrollToCurrentStep();
  }

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
    const detail = POST_NODE_DETAILS[nodeId];
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
  }

  onNodeDragStart(event: MouseEvent, nodeId: string) {
    this.hasNodeMoved = false;

    if ((event.target as HTMLElement).tagName === 'BUTTON') return;
    if ((event.target as HTMLElement).classList.contains('group-icon')) return;

    if (event.button !== 0) return;

    if (!this.activeFlowId()) return;

    if (!this.isNodeInFlow(nodeId)) return;

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

    const edgeTotal = new Map<string, number>();
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

    allBoxEls.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.id;
      if (id) {
        const leftTotal = edgeTotal.get(`${id}-left`) || 0;
        const rightTotal = edgeTotal.get(`${id}-right`) || 0;
        const maxConns = Math.max(leftTotal, rightTotal);
        const reqHeight = Math.max(60, maxConns * 36 + 20);
        htmlEl.style.minHeight = `${reqHeight}px`;
      }
    });

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

      const jitter = pairIdx * 20;

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

      const sameBox = Math.abs(dx) < 10 && Math.abs(dy) < 10;
      if (sameBox) return;

      const isSameColumn = Math.abs(dx) < 200;
      const isAdjacent = Math.abs(dx) >= 200 && Math.abs(dx) < 500;
      const isReturn = step.isReturn || false;

      if (isSameColumn) {
        if (isReturn) {
          x1 = from.left;
          y1 = fixedY1;
          x2 = to.left;
          y2 = fixedY2;

          const gutterX = Math.min(from.left, to.left) - 40 - (fromIdx * 20);

          pathD = `M ${x1} ${y1} L ${gutterX} ${y1} L ${gutterX} ${y2} L ${x2} ${y2}`;
          labelX = gutterX;
          labelY = (y1 + y2) / 2;
        } else {
          x1 = from.right;
          y1 = fixedY1;
          x2 = to.right;
          y2 = fixedY2;

          const gutterX = Math.max(from.right, to.right) + 40 + (fromIdx * 20);

          pathD = `M ${x1} ${y1} L ${gutterX} ${y1} L ${gutterX} ${y2} L ${x2} ${y2}`;
          labelX = gutterX;
          labelY = (y1 + y2) / 2;
        }

      } else if (isAdjacent && Math.abs(dy) < 150) {
        x1 = goingRight ? from.right : from.left;
        y1 = fixedY1;
        x2 = goingRight ? to.left : to.right;
        y2 = fixedY2;

        const midX = x1 + (x2 - x1) / 2 + (fromIdx * 6 * (goingRight ? 1 : -1));
        pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        labelX = midX;
        labelY = (y1 + y2) / 2;

      } else {
        x1 = goingRight ? from.right : from.left;
        y1 = fixedY1;
        const gutter1X = goingRight ? x1 + 30 + (fromIdx * 20) : x1 - 30 - (fromIdx * 20);

        x2 = goingRight ? to.left : to.right;
        y2 = fixedY2;
        const gutter2X = goingRight ? x2 - 30 - (toIdx * 20) : x2 + 30 + (toIdx * 20);

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

    const newGroupLines: {path: string}[] = [];
    const groupEls = wrapper.querySelectorAll('.schema-box.is-group:not(.hidden-node)');

    groupEls.forEach((groupEl: Element) => {
      const container = groupEl.nextElementSibling;
      if (container && container.classList.contains('group-children-container')) {
        const pOffset = getOffset(groupEl as HTMLElement);
        const startX = pOffset.left + 12;
        const startY = pOffset.bottom;

        const children = container.querySelectorAll('.child-box:not(.hidden-node)');
        children.forEach((childEl: Element) => {
          const cOffset = getOffset(childEl as HTMLElement);

          const path = `M ${startX} ${startY} L ${startX} ${cOffset.centerY} L ${cOffset.left} ${cOffset.centerY}`;
          newGroupLines.push({ path });
        });
      }
    });

    this.groupSvgLines.set(newGroupLines);
  }
}
