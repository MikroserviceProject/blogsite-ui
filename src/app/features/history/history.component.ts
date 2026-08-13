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
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
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
