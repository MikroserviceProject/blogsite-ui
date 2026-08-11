import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface HistoryItem {
  id: string;
  year: number;
  name: string;
  creator: string;
  reason: string;
  description: string;
  tag: string;
  color: string;
  family: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="history-page container">
      <div class="history-header">
        <h1 class="page-title">Bilgisayar ve Yazılım Tarihçesi</h1>
        <p class="page-subtitle">Programlama dillerinin ve donanım teknolojilerinin evrimi</p>
      </div>

      <div class="timeline-container">
        <!-- We can group by family or just list them chronologically and show the family badge -->
        <div class="timeline">
          @for (item of historyItems; track item.id; let i = $index) {
              <div class="timeline-item" [style.animation-delay]="(i * 0.15) + 's'">
                <div class="timeline-content" 
                     [style.border-top-color]="item.color"
                     [style.box-shadow]="hoveredItemId === item.id ? '0 15px 35px ' + item.color + '40' : ''"
                     (mouseenter)="hoveredItemId = item.id"
                     (mouseleave)="hoveredItemId = null">
                  
                  <div class="family-badge" [style.background-color]="item.color + '20'" [style.color]="item.color">
                    {{ item.family }}
                  </div>

                  <div class="item-header">
                    <span class="item-year" [style.color]="item.color">{{ item.year }}</span>
                    <h3 class="item-name">{{ item.name }}</h3>
                  </div>
                  
                  <div class="item-details">
                    <p class="item-creator"><strong>Geliştirici / Kurucu:</strong> {{ item.creator }}</p>
                    <p class="item-reason"><strong>Kuruluş Sebebi:</strong> {{ item.reason }}</p>
                  </div>

                  <p class="item-desc">{{ item.description }}</p>
                  
                  <div class="item-actions">
                    <a [routerLink]="['/etiket', item.tag]" class="btn btn-outline" 
                       [style.border-color]="item.color" 
                       [style.color]="item.color"
                       [class.btn-hovered]="hoveredItemId === item.id"
                       [style.background]="hoveredItemId === item.id ? item.color + '15' : 'transparent'">
                      {{ item.name }} ile ilgili blogları gör 
                      <span class="arrow-icon" [class.arrow-move]="hoveredItemId === item.id">→</span>
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
    </div>
  `,
  styles: [`
    .history-page {
      padding-top: 40px;
      padding-bottom: 80px;
    }

    .history-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 36px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .page-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    .timeline-container {
      animation: fadeInDown 0.6s ease-out;
    }

    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .timeline {
      display: flex;
      overflow-x: auto;
      gap: 24px;
      padding: 20px 10px 40px 10px;
      scroll-behavior: smooth;
    }
    
    .timeline::-webkit-scrollbar {
      height: 8px;
    }
    .timeline::-webkit-scrollbar-track {
      background: var(--bg-surface); 
      border-radius: 4px;
    }
    .timeline::-webkit-scrollbar-thumb {
      background: var(--primary); 
      border-radius: 4px;
    }

    .timeline-item {
      flex: 0 0 350px;
      padding: 10px;
      position: relative;
      background-color: inherit;
      box-sizing: border-box;
      opacity: 0;
      animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }



    .timeline-content {
      padding: 28px;
      border-radius: var(--radius-lg);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-top: 4px solid var(--primary);
      box-shadow: var(--shadow-md);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    :host-context(.light-theme) .timeline-content {
      background: rgba(255, 255, 255, 0.75);
    }
    
    :host-context(.dark-theme) .timeline-content {
      background: rgba(13, 23, 50, 0.65);
    }

    :host-context(.true-dark-theme) .timeline-content {
      background: rgba(10, 10, 10, 0.85);
    }

    .timeline-item:hover .timeline-content {
      transform: scale(1.02) translateY(-6px);
      z-index: 10;
    }

    .family-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .item-year {
      font-size: 28px;
      font-weight: 900;
      opacity: 0.9;
    }

    .item-name {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .item-details {
      background: var(--bg-subtle);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      margin-bottom: 16px;
    }

    .item-creator, .item-reason {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .item-reason {
      margin-bottom: 0;
    }

    .item-details strong {
      color: var(--text-primary);
    }

    .item-desc {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.7;
      margin-bottom: 24px;
    }

    .item-actions {
      display: flex;
      justify-content: flex-start;
    }

    .btn-outline {
      background: transparent;
      border: 1.5px solid;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 700;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .arrow-icon {
      display: inline-block;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .arrow-move {
      transform: translateX(6px);
    }

    @media screen and (max-width: 768px) {
      .timeline::after {
        left: 31px;
      }
      .timeline-item {
        width: 100%;
        padding-left: 70px;
        padding-right: 20px;
      }
      .timeline-item.right {
        left: 0%;
      }
      .timeline-item .timeline-dot, .timeline-item.right .timeline-dot {
        left: 19px;
      }
    }
  `]
})
export class HistoryComponent {
  hoveredItemId: string | null = null;

  historyItems: HistoryItem[] = [
    {
      id: 'eniac',
      year: 1945,
      name: 'ENIAC & Turing Makinesi',
      creator: 'Alan Turing & John Mauchly',
      reason: '2. Dünya Savaşı sırasında şifre kırmak ve karmaşık topçu atış hesaplamalarını çok hızlı bir şekilde yapmak amacıyla üretildiler.',
      description: 'Modern bilgisayarların ataları. Turing makinesi teorik hesaplamanın temelini atarken, ENIAC dünyanın ilk genel amaçlı elektronik dijital bilgisayarı olmuştur.',
      tag: 'Bilgisayar',
      color: '#64748b', // Slate
      family: 'Donanım ve İlk Bilgisayarlar'
    },
    {
      id: 'c',
      year: 1972,
      name: 'C',
      creator: 'Dennis Ritchie',
      reason: 'Unix işletim sistemini geliştirmek ve donanıma daha yakın, hızlı ancak taşınabilir bir programlama ortamı sağlamak için yaratıldı.',
      description: 'C programlama dili modern sistem programlamanın temelini oluşturur. İşletim sistemleri, gömülü sistemler ve çekirdek (kernel) geliştirmesinde altın standarttır.',
      tag: 'C',
      color: '#3b82f6', // Blue
      family: 'C Ailesi'
    },
    {
      id: 'cpp',
      year: 1985,
      name: 'C++',
      creator: 'Bjarne Stroustrup',
      reason: 'C dilinin hızı korunurken, büyük yazılım projelerini yönetebilmek için nesne yönelimli programlama (OOP) özelliklerine ihtiyaç duyulması.',
      description: 'C diline sınıflar (classes) eklenerek oluşturulmuştur. Günümüzde oyun motorları, tarayıcılar ve yüksek performans gerektiren kompleks sistemlerde sıkça kullanılır.',
      tag: 'C++',
      color: '#00599C', // Dark Blue
      family: 'C Ailesi'
    },
    {
      id: 'html',
      year: 1990,
      name: 'HTML & CSS',
      creator: 'Tim Berners-Lee',
      reason: 'CERN laboratuvarındaki bilim insanlarının dökümanları ve akademik araştırmaları bir ağ (Web) üzerinden birbirleriyle kolayca paylaşabilmesi.',
      description: 'HTML internetin iskeleti, CSS ise makyajıdır. Bilgiyi yapılandırarak tarayıcılarda görünür kılan temel web teknolojileridir.',
      tag: 'Web',
      color: '#f97316', // Orange
      family: 'Web Teknolojileri'
    },
    {
      id: 'python',
      year: 1991,
      name: 'Python',
      creator: 'Guido van Rossum',
      reason: 'Okunması zor ve karmaşık olan dillere tepki olarak; "kodun yazılmasından çok okunmasına zaman harcanır" felsefesiyle, kolay öğrenilebilir ve okunaklı bir dil yaratma isteği.',
      description: 'Sade sözdizimi ile öne çıkan Python, günümüzde veri bilimi, yapay zeka, makine öğrenmesi ve web geliştirme alanlarında dünyanın en popüler dillerinden biridir.',
      tag: 'Python',
      color: '#eab308', // Yellow
      family: 'Modern Betik Dilleri'
    },
    {
      id: 'java',
      year: 1995,
      name: 'Java',
      creator: 'James Gosling (Sun Microsystems)',
      reason: 'Televizyon ve ev aletleri gibi cihazlar için donanımdan bağımsız bir dil yapma projesi (Oak) olarak başladı. Daha sonra "Bir kere yaz, her yerde çalıştır" vizyonuyla internete adapte edildi.',
      description: 'Kurumsal yazılımların ve Android ekosisteminin can damarıdır. Platform bağımsızlığı (JVM) sayesinde günümüzde devasa ölçekli sistemlerde kullanılır.',
      tag: 'Java',
      color: '#ef4444', // Red
      family: 'C Ailesi'
    },
    {
      id: 'javascript',
      year: 1995,
      name: 'JavaScript',
      creator: 'Brendan Eich',
      reason: 'Netscape tarayıcısında, statik HTML sayfalarına 10 gün gibi kısa bir sürede dinamik özellikler (animasyonlar, form kontrolleri) katabilmek için aceleyle yaratıldı.',
      description: 'Sadece 10 günde yazılan bu dil, bugün frontend dünyasının tek hakimidir. Node.js ile birlikte hem tarayıcıda hem de sunucuda çalışabilen devasa bir ekosisteme dönüştü.',
      tag: 'Web',
      color: '#facc15', // JS Yellow
      family: 'Web Teknolojileri'
    },
    {
      id: 'ruby',
      year: 1995,
      name: 'Ruby',
      creator: 'Yukihiro Matsumoto',
      reason: 'Programcıların makine gibi değil, insan gibi kod yazmasını sağlamak. Performanstan ziyade geliştirici mutluluğunu ve üretkenliğini maksimize etmek.',
      description: "Zarif sözdizimine sahip nesne yönelimli bir dil. \"Ruby on Rails\" framework'ü sayesinde web geliştirmede devrim yaratmış, GitHub ve Shopify gibi devlerin ilk tercihi olmuştur.",
      tag: 'Ruby',
      color: '#cc342d', // Ruby Red
      family: 'Modern Betik Dilleri'
    },
    {
      id: 'postgres',
      year: 1996,
      name: 'PostgreSQL',
      creator: 'Michael Stonebraker',
      reason: 'Karmaşık veri türlerini, tam ACID uyumluluğunu ve genişletilebilirliği (nesne-ilişkisel) destekleyen güçlü, açık kaynaklı bir veritabanı ihtiyacı.',
      description: 'Dünyanın en gelişmiş açık kaynaklı ilişkisel veritabanı yönetim sistemidir. Coğrafi verilerden (PostGIS), JSON dokümanlarına kadar her şeyi güvenle saklar.',
      tag: 'Veritabanı',
      color: '#336791', // Postgres Blue
      family: 'Veritabanı ve Altyapı'
    },
    {
      id: 'csharp',
      year: 2000,
      name: 'C#',
      creator: 'Anders Hejlsberg (Microsoft)',
      reason: "Microsoft'un Java ekosistemine rakip olarak ve kendi .NET platformunun gücünü göstermek amacıyla modern ve nesne yönelimli bir dil yaratması.",
      description: 'Microsoft ekosisteminin ana dili. Oyun geliştirmeden (Unity), masaüstü uygulamalarına ve yüksek performanslı backend web servislerine (.NET Core) kadar son derece güçlüdür.',
      tag: 'C#',
      color: '#8b5cf6', // Purple
      family: 'C Ailesi'
    }
  ];
}
