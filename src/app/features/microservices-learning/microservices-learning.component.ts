import { Component, OnDestroy, AfterViewChecked, HostListener, signal, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NODE_DETAILS, NodeDetail } from '../architecture-schema/node-details.data';
import { MICROSERVICES_LAYERS, MICROSERVICES_FLOWS } from './data/microservices.data';

export interface ChildNode {
  id: string;
  name: string;
  type: string;
  desc?: string;
  subName?: string;
  actionName?: string;
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
  selector: 'app-microservices-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './microservices-learning.component.html',
  styleUrl: './microservices-learning.component.css'
})
export class MicroservicesLearningComponent implements OnDestroy, AfterViewChecked {
  
  showInactiveNodes = signal(false);
  consoleInput = '';
  consoleHistory = signal<{ type: 'system' | 'user', text: string }[]>([
    { type: 'system', text: 'Sistem hazır.\n\nKullanabileceğiniz İşlemler (Komutlar):\n- genel mimari\n- giriş yap\n- profil düzenle\n- fotoğraf yükle\n\nLütfen bir komut giriniz (örn: "genel mimari")' }
  ]);
  activePrompt = signal<{ step: string, prefix: string, placeholder: string } | null>({ step: 'main', prefix: '>', placeholder: 'Komut yazın...' });
  pendingFlow: string | null = null;

  showWelcome = signal(true);
  welcomeMessage = 'Mikroservis Öğrenme Merkezine Hoşgeldiniz!';
  
  activeFlowId = signal<string | null>(null);

  layers = computed(() => MICROSERVICES_LAYERS);
  flows = computed(() => MICROSERVICES_FLOWS);
  activeFlowData = computed(() => this.flows().find(f => f.id === this.activeFlowId()) || null);

  @ViewChild('boardWrapper') boardWrapper!: ElementRef;
  
  selectedNode = signal<NodeDetail | null>(null);

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

  startLearning() {
    this.showWelcome.set(false);
  }

  executeCommand(command: string) {
    if (!command.trim()) return;
    
    this.consoleHistory.update(h => [...h, { type: 'user', text: command }]);
    const cmd = command.trim();
    const prompt = this.activePrompt();

    if (prompt?.step === 'main') {
      const lowerCmd = cmd.toLowerCase();
      if (lowerCmd === 'giriş yap' || lowerCmd === 'giris-yap' || lowerCmd === 'giris yap') {
        this.pendingFlow = 'giris-yap';
        this.activePrompt.set({ step: 'input1', prefix: 'Kullanıcı Adınız (E-posta):', placeholder: 'Örn: ali@example.com' });
      } else if (lowerCmd === 'profil düzenle' || lowerCmd === 'profil-duzenle' || lowerCmd === 'profil duzenle') {
        this.pendingFlow = 'profil-duzenle';
        this.activePrompt.set({ step: 'input1', prefix: 'Yeni Ad Soyad:', placeholder: 'Örn: Ali Yılmaz' });
      } else if (lowerCmd === 'fotoğraf yükle' || lowerCmd === 'fotograf-yukle' || lowerCmd === 'fotograf yukle') {
        this.pendingFlow = 'fotograf-yukle';
        this.activePrompt.set({ step: 'input1', prefix: 'Dosya Adı (.jpg):', placeholder: 'Örn: tatil_fotom.jpg' });
      } else if (lowerCmd === 'genel mimari' || lowerCmd === 'genel-mimari') {
        this.pendingFlow = 'genel-mimari';
        this.activePrompt.set({ step: 'input1', prefix: 'Devam etmek için Enter\'a basın:', placeholder: 'Sadece izleyin...' });
      } else {
        this.consoleHistory.update(h => [...h, { type: 'system', text: 'Geçersiz komut. Kullanabileceğiniz komutlar: "genel mimari", "giriş yap", "profil düzenle", "fotoğraf yükle"' }]);
      }
    } else if (prompt?.step === 'input1') {
      this.consoleHistory.update(h => [...h, { type: 'system', text: 'İsteğiniz sunucuya (API Gateway) iletiliyor...' }]);
      this.activePrompt.set(null); // Input kutusunu gizle
      
      if (this.pendingFlow) {
        this.selectFlow(this.pendingFlow);
        this.pendingFlow = null;
        
        // Komut gönderildiğinde, mimariyi izleyebilmesi için ekranı yumuşakça en başa (yukarı) kaydır
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    this.consoleInput = '';
  }

  // Animasyon bitince veya flow seçimi değişince terminali sıfırlamak için eklendi:
  resetConsole() {
    this.consoleHistory.set([
      { type: 'system', text: 'Sistem hazır.\n\nKullanabileceğiniz İşlemler (Komutlar):\n- genel mimari\n- giriş yap\n- profil düzenle\n- fotoğraf yükle\n\nLütfen bir komut giriniz (örn: "genel mimari")' }
    ]);
    this.activePrompt.set({ step: 'main', prefix: '>', placeholder: 'Komut yazın...' });
    this.pendingFlow = null;
    this.consoleInput = '';
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

  currentStepIndex = signal<number>(-1);
  isAnimationFinished = signal<boolean>(false); 
  animationTimer: any;
  needsRecalculation = true; 

  svgLines = signal<SvgLine[]>([]);
  groupSvgLines = signal<{path: string}[]>([]); 

  // Yeni Panel Boyutlandırma Değişkenleri
  panelHeight = signal<number>(400); // Başlangıçta 400px
  isPanelResizing = false;
  panelDragStartY = 0;
  panelStartHeight = 0;

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
    
    // In learning center, clicks on boxes do nothing for flows, everything is via console
  }

  onBoardClick(event: MouseEvent) {
    // Eğer az önce bir kutu sürüklendiyse, bu tıklamayı yoksay (sürükleme bırakıldığı için tetiklenmiş)
    if (this.hasNodeMoved) {
      return;
    }

    const target = event.target as HTMLElement;
    
    if (!target.closest('.schema-box') && 
        !target.closest('.flow-legend-panel') && 
        !target.closest('.schema-toolbar')) {
      
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
    this.selectFlow(target.value);
  }

  selectFlow(flowId: string | null) {
    this.stopAnimation();
    this.isAnimationFinished.set(false);
    
    if (this.activeFlowId() === flowId || flowId === null) {
      this.activeFlowId.set(null);
      this.currentStepIndex.set(-1);
      this.collapseAllGroups();
      this.resetNodePositions();
    } else if (flowId) {
      this.activeFlowId.set(flowId);
      this.showInactiveNodes.set(false);
      this.expandGroupsInFlow(flowId);
      
      setTimeout(() => {
        this.startAnimation();
      }, 100);
    } else {
      this.activeFlowId.set(null);
      this.currentStepIndex.set(-1);
      this.calculateSvgLines();
    }
  }

  getLayerOrder(layerId: string): number {
    if (this.activeFlowId() !== null) {
      if (layerId === 'backend-core') return 5;
      if (layerId === 'backend-data') return 4;
    }
    return 1;
  }


  toggleInactiveNodes() {
    this.showInactiveNodes.set(!this.showInactiveNodes());
    setTimeout(() => {
      this.calculateSvgLines();
    }, 50);
  }

  expandGroupsInFlow(flowId: string) {
    const flow = this.flows().find(f => f.id === flowId);
    if (!flow) return;

    const activeNodeIds = new Set<string>();
    flow.steps.forEach(s => {
      activeNodeIds.add(s.fromNodeId);
      activeNodeIds.add(s.toNodeId);
    });

    let changed = false;
    this.layers().forEach(layer => {
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
    this.layers().forEach(layer => {
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
    this.stopAnimation();
    this.currentStepIndex.set(0); 
    this.isAnimationFinished.set(false);
    this.calculateSvgLines(); 
    this.scrollToCurrentStep();

    const flow = this.activeFlowData();
    if (!flow) return;

    this.animationTimer = setInterval(() => {
      let nextIndex = this.currentStepIndex() + 1;
      if (nextIndex >= flow.steps.length) {
        this.stopAnimation();
        this.isAnimationFinished.set(true);
        this.consoleHistory.update(h => [...h, { type: 'system', text: 'İşlem başarıyla tamamlandı!' }]);
        setTimeout(() => {
          this.resetConsole();
        }, 3000);
      } else {
        this.currentStepIndex.set(nextIndex);
        this.scrollToCurrentStep();
      }
      this.calculateSvgLines();
    }, 2500); // Her adım 2.5 saniye ekranda kalsın
  }

  onAnimationEnd(stepIndex: number) {
    const flow = this.activeFlowData();
    if (!flow) return;
    
    // stepIndex is 1-based (i + 1)
    if (stepIndex === flow.steps.length) {
      this.isAnimationFinished.set(true);
    } else {
      if (this.currentStepIndex() < stepIndex) {
        this.currentStepIndex.set(stepIndex);
        this.calculateSvgLines();
        this.scrollToCurrentStep();
      }
    }
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

    const flow = this.flows().find(f => f.id === flowId);
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
    const flow = this.flows().find(f => f.id === flowId);
    if (!flow) return true;
    return flow.steps.some(s => s.fromNodeId === nodeId || s.toNodeId === nodeId);
  }

  isNodeHighlighted(nodeId: string): boolean {
    const flowId = this.activeFlowId();
    if (!flowId) return false;
    if (this.isAnimationFinished()) return this.isNodeInFlow(nodeId);
    
    const flow = this.flows().find(f => f.id === flowId);
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
    
    // Tıklama (click) eventi mouseup'tan hemen sonra tetiklenir. 
    // click event'inin hasNodeMoved durumunu doğru okuyabilmesi için sıfırlamayı kısa bir süre geciktiriyoruz.
    setTimeout(() => {
      this.hasNodeMoved = false;
    }, 50);
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
    const isMinimized = this.isPanelMinimized();
    
    if (isMinimized) {
      // Kapalıyken açılıyorsa (üçgene tıklandığında) varsayılan boyuta (yaklaşık 5 öğe) dön
      this.panelHeight.set(380); // 380px yaklaşık 5-6 adım eder
      
      // Eğer panel yukarıdaysa (hasMoved) top'ını da düzeltmemiz gerekebilir ama 
      // toggle yaparken top sabit kalır, aşağı doğru açılır. 
      // Ancak kullanıcı tıklamayla açtığında taşmışsa diye kontrol edilebilir.
    }
    
    this.isPanelMinimized.set(!isMinimized);
  }

  onLegendHeaderMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('close-btn') || target.closest('.close-btn')) return;
    
    event.preventDefault();
    this.isPanelResizing = false;
    this.panelDragStartY = event.clientY;
    
    const panel = document.querySelector('.flow-legend-panel') as HTMLElement;
    if (!panel) return;
    this.panelStartHeight = panel.getBoundingClientRect().height;
    
    // YENİ: Sürükleme başladığındaki top pozisyonunu sakla
    const startTop = this.panelTop;

    const mouseMoveHandler = (e: MouseEvent) => {
      // dy = startY - currentY. Aşağı çekince currentY büyür, dy negatif olur.
      const dy = this.panelDragStartY - e.clientY; 
      
      if (Math.abs(dy) > 3) {
        this.isPanelResizing = true;
        
        // Kullanıcı aşağı çektiğinde (dy negatif) panelin BÜYÜMESİNİ (aşağı doğru genişlemesini) istiyor.
        // O yüzden panelStartHeight - dy yapıyoruz. 
        let newHeight = this.panelStartHeight - dy;
        
        if (newHeight < 60) {
          newHeight = 60;
        }
        if (newHeight > window.innerHeight * 0.9) {
          newHeight = window.innerHeight * 0.9;
        }
        
        this.panelHeight.set(newHeight);
        
        // Eğer panel minimize ise ve boyutu artırılıyorsa, açık duruma getir
        if (this.isPanelMinimized() && newHeight > 100) {
          this.isPanelMinimized.set(false);
        }
      }
    };

    const mouseUpHandler = (e: MouseEvent) => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      
      if (!this.isPanelResizing) {
        // Tıklama olarak algıla ve minimize/maximize yap
        this.togglePanelMinimize(e);
      }
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  closeNodeDetails() {
    this.selectedNode.set(null);
  }

  // YENİ: Oklar için benzersiz renk paleti
  private getLineColor(stepIndex: number): string {
    const colors = [
      '#3b82f6', // Mavi
      '#ef4444', // Kırmızı
      '#10b981', // Yeşil
      '#f97316', // Turuncu
      '#8b5cf6', // Mor
      '#06b6d4', // Camgöbeği
      '#ec4899', // Pembe
      '#eab308', // Sarı
      '#6366f1', // İndigo
      '#14b8a6'  // Turkuaz
    ];
    return colors[stepIndex % colors.length];
  }

  private calculateSvgLines() {
    if (!this.boardWrapper?.nativeElement) return;
    
    // Aktif akışa ait svgLines nesnelerini oluştur (Eskiden hep 10 taneydi, şimdi dinamik)
    const activeFlow = this.activeFlowData();
    const numberOfSteps = activeFlow ? activeFlow.steps.length : 10;
    
    // Eski ok sayısıyla eşleşmiyorsa okları yeniden oluştur (Eğer 8 adımsa 8 ok oluştur vs.)
    if (this.svgLines().length !== numberOfSteps) {
      this.svgLines.set(Array.from({length: numberOfSteps}, (_, i) => ({
        id: String(i + 1),
        x1: 0, y1: 0, x2: 0, y2: 0, midX: 0,
        pathD: '',
        stepIndex: i + 1,
        active: false,
        label: '',
        isReturn: false,
        labelX: 0,
        labelY: 0,
        lineColor: this.getLineColor(i),
        markerEnd: `arrowhead-${this.getLineColor(i).replace('#', '')}`,
        isDefaultBackground: false
      })));
    }
    
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

      // 3. Uzak Kolonlar veya Çapraz/Wrap bağlantılar (Satır atlayanlar)
      } else {
        // Çapraz veya alt satıra geçişlerde doğrudan orta noktadan (basit Z-şekli) bağla
        x1 = goingRight ? from.right : from.left;
        y1 = fixedY1;
        x2 = goingRight ? to.left : to.right;
        y2 = fixedY2;
        
        // Kutuların arasındaki dikey boşluktan inebilmek için:
        let midX = (x1 + x2) / 2;
        
        // Üst üste binmesini önlemek için jitter ekle
        midX += (fromIdx * 10 * (goingRight ? 1 : -1));

        pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        
        // Etiketi dikey çizginin üzerine koy, üst üste binmesin diye adım indeksine (i) göre dikeyde hafif kaydır (jitter)
        labelX = midX;
        labelY = ((y1 + y2) / 2) + ((i % 4) * 25) - 30;
      }

      // 3. Adım: Hangi okun hangi renk olacağını ve dönüş mü gidiş mi olduğunu belirle
      let lineColor = this.getLineColor(i);
      let markerEnd = `arrowhead-${lineColor.replace('#', '')}`;

      // SADECE aktif adıma kadar olanları ekle. Eğitsel olduğu için gelecek adımlar görünmesin.
      if (i <= this.currentStepIndex() || this.isAnimationFinished()) {
        newLines.push({
          id: `${step.fromNodeId}-${step.toNodeId}-${i}`, 
          x1, y1, x2, y2, midX: labelX, labelX, labelY,
          pathD,
          label: step.label,
          subLabel: step.subLabel,
          active: i === this.currentStepIndex() && !this.isAnimationFinished(),
          isReturn: step.isReturn || false,
          isDefaultBackground: false,
          stepIndex: i + 1,
          lineColor,
          markerEnd
        });
      }
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
 
 
