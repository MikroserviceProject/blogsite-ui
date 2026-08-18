import { Component, signal } from '@angular/core';
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
  expandedItemId = signal<string | null>(null);

  toggleExpand(id: string) {
    if (this.expandedItemId() === id) {
      this.expandedItemId.set(null);
    } else {
      this.expandedItemId.set(id);
    }
  }

  historyItems: HistoryItem[] = [
    {
      id: 'ada',
      year: 1843,
      name: 'İlk Algoritma & Yazılımın Doğuşu',
      creator: 'Ada Lovelace',
      reason: 'Charles Babbage\'ın "Analitik Motor" adı verilen genel amaçlı mekanik bilgisayarı için Bernoulli sayılarını hesaplamak.',
      description: 'Makinenin sadece sayıları değil, sembolleri de işleyebileceğini fark eden Lovelace, tarihteki ilk bilgisayar programcısı olarak kabul edilir. Bu, yazılım kavramının donanımdan bağımsız ilk düşünsel tohumuydu.',
      tag: 'Tarihçe',
      color: '#eab308', // Yellow
      family: 'Yazılımın Kökenleri'
    },
    {
      id: 'eniac',
      year: 1945,
      name: 'ENIAC & Turing Makinesi',
      creator: 'Alan Turing & John Mauchly',
      reason: '2. Dünya Savaşı sırasında şifre kırmak (Enigma) ve karmaşık topçu atış hesaplamalarını hızlıca yapabilmek.',
      description: 'Alan Turing, "Turing Makinesi" konseptiyle teorik bilgisayar biliminin ve yapay zekanın temellerini atarken, ENIAC dünyanın ilk elektronik ve genel amaçlı dijital bilgisayarı olarak tarihe geçti.',
      tag: 'Donanım',
      color: '#64748b', // Slate
      family: 'Donanım ve İlk Bilgisayarlar'
    },
    {
      id: 'transistor',
      year: 1947,
      name: 'Transistörün İcadı',
      creator: 'John Bardeen, Walter Brattain, William Shockley (Bell Labs)',
      reason: 'Kırılgan, çok yer kaplayan ve fazla ısınan elektron tüplerinin yerini alacak, daha küçük ve güvenilir bir anahtarlama/yükseltme elemanı bulmak.',
      description: 'Transistör, modern elektroniğin ve bilgisayarların temel yapı taşıdır. Elektron tüplerine göre çok daha küçük, dayanıklı ve enerji verimli olması sayesinde entegre devrelerin ve mikroişlemcilerin önünü açtı — donanımdaki bu devrim olmadan yazılımın bugünkü hâli mümkün olmazdı.',
      tag: 'Donanım',
      color: '#78716c', // Stone
      family: 'Donanım ve İlk Bilgisayarlar'
    },
    {
      id: 'compiler',
      year: 1952,
      name: 'İlk Derleyici (Compiler)',
      creator: 'Grace Hopper',
      reason: 'Sadece 0 ve 1\'lerden oluşan makine dilinden kurtulup, insanların daha rahat anlayabileceği kodlar yazılmasını sağlamak.',
      description: 'Grace Hopper\'ın A-0 Sistemi, kaynak kodunu makine koduna çeviren ilk yazılımdı. Bu gelişme, yazılımı donanımın tekelinden çıkararak modern programlama dillerinin (COBOL vb.) doğmasını sağladı.',
      tag: 'Tarihçe',
      color: '#f97316', // Orange
      family: 'Yazılımın Kökenleri'
    },
    {
      id: 'unix',
      year: 1969,
      name: 'UNIX İşletim Sistemi',
      creator: 'Ken Thompson & Dennis Ritchie (Bell Labs)',
      reason: 'Büyük, karmaşık ve pahalı işletim sistemlerine alternatif olarak küçük, modüler ve çok kullanıcılı bir sistem tasarlamak.',
      description: 'Sadece bir işletim sistemi değil, aynı zamanda modern bilişimin kalbidir. macOS, Linux, Android ve iOS\'un genlerinde UNIX felsefesi (her şey bir dosyadır, küçük programlar tek bir işi iyi yapar) yatar.',
      tag: 'İşletim Sistemi',
      color: '#14b8a6', // Teal
      family: 'Sistem Yazılımları'
    },
    {
      id: 'c',
      year: 1972,
      name: 'C Programlama Dili',
      creator: 'Dennis Ritchie',
      reason: 'UNIX işletim sistemini farklı donanımlara (makinelere) kolayca taşıyabilmek için assembly dili yerine daha yüksek seviyeli bir dile ihtiyaç duyulması.',
      description: 'Sistem programlamanın babasıdır. Kendinden sonraki C++, Java, C#, JavaScript gibi hemen hemen tüm modern dillerin söz dizimini (syntax) doğrudan etkilemiştir. Bilişim dünyasının yapı taşıdır.',
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
      id: 'www',
      year: 1989,
      name: 'World Wide Web (WWW)',
      creator: 'Tim Berners-Lee (CERN)',
      reason: 'Bilim insanları ve üniversiteler arasında bilgi paylaşımını ve döküman takibini kolaylaştıracak evrensel bir ağ kurmak.',
      description: 'HTML, HTTP ve ilk web tarayıcısının icadı... İnterneti sadece askeri/akademik bir altyapı olmaktan çıkarıp herkesin erişebildiği global bir bilgi ağına (Web) dönüştüren en devrimsel yazılım adımı.',
      tag: 'Web',
      color: '#8b5cf6', // Violet
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
      family: 'Betik ve Veri Bilimi Dilleri'
    },
    {
      id: 'java',
      year: 1995,
      name: 'Java',
      creator: 'James Gosling (Sun Microsystems)',
      reason: '"Bir kere yaz, her yerde çalıştır" felsefesiyle, farklı donanım ve işletim sistemlerinde sorunsuz çalışabilen sanal makine (JVM) tabanlı bir dil oluşturmak.',
      description: 'Kurumsal sistemlerin, bankacılık altyapılarının ve uzun yıllar Android mobil geliştirmesinin belkemiği olmuştur.',
      tag: 'Java',
      color: '#ef4444', // Red
      family: 'JVM ve Kurumsal Diller'
    },
    {
      id: 'javascript',
      year: 1995,
      name: 'JavaScript',
      creator: 'Brendan Eich',
      reason: 'Sadece statik olan web sayfalarına tarayıcı üzerinde hareket (etkileşim) katabilmek için 10 günde tasarlandı.',
      description: 'Bugün web dünyasının evrensel dilidir. Sadece ön yüzde değil, Node.js sayesinde sunucu tarafında da devasa bir ekosisteme sahiptir.',
      tag: 'JavaScript',
      color: '#fbbf24', // Amber
      family: 'Web Teknolojileri'
    },
    {
      id: 'csharp',
      year: 2000,
      name: 'C#',
      creator: 'Anders Hejlsberg (Microsoft)',
      reason: 'Microsoft\'un .NET ekosistemi için, Java\'nın "Nesne Yönelimli" yaklaşımına rakip olarak kurumsal dünya için tasarlandı.',
      description: 'Günümüzde ASP.NET Core ile sunucu tarafında, Unity ile oyun geliştirmede en popüler, en güçlü ve modern dillerden biridir.',
      tag: 'C#',
      color: '#8b5cf6', // Purple
      family: 'C Ailesi'
    },
    {
      id: 'go',
      year: 2009,
      name: 'Go',
      creator: 'Robert Griesemer, Rob Pike, Ken Thompson (Google)',
      reason: 'C++\'ın karmaşıklığını ve derlenme süresini çözmek; çok çekirdekli işlemcilerde ve ağ tabanlı sistemlerde daha performanslı, basit bir dil oluşturmak.',
      description: 'Harika "Concurrency (eşzamanlılık)" modeli ile günümüzde Docker, Kubernetes gibi devasa bulut ve mikroservis altyapılarının temel taşıdır.',
      tag: 'Go',
      color: '#06b6d4', // Cyan
      family: 'Modern Sistem Dilleri'
    },
    {
      id: 'typescript',
      year: 2012,
      name: 'TypeScript',
      creator: 'Anders Hejlsberg (Microsoft)',
      reason: 'Büyüyen JavaScript projelerinde statik tip kontrolü eksikliğinden kaynaklanan hataları derleme aşamasında yakalayabilmek.',
      description: 'JavaScript\'in süper kümesidir. Angular gibi modern frontend çerçevelerinin endüstri standardı haline gelmiştir ve hata yapma riskini çok azaltır.',
      tag: 'TypeScript',
      color: '#3b82f6', // Blue
      family: 'Web Teknolojileri'
    }
  ];
}
