/**
 * Yaşam Maratonu: Büyük Dünya v4 — Config, Careers, Pets, Achievements, Daily Events & Customization
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  YD.WORLD_W = 4600;
  YD.WORLD_H = 3600;

  YD.MOUNTAIN_Y = 740;
  YD.BEACH_Y    = 2560;
  YD.SEA_Y      = 2920;
  YD.CITY_X1    = 1740;
  YD.CITY_X2    = 3260;

  YD.SEASONS = [
    { id: 'spring', name: 'İlkbahar', icon: '🌸', grass: '#7ccf6c', forest: '#4ba856', park: '#86dc72', particle: '#fbcfe8' },
    { id: 'summer', name: 'Yaz',      icon: '☀️', grass: '#6bc45c', forest: '#3d9948', park: '#7bd666', particle: null },
    { id: 'autumn', name: 'Sonbahar', icon: '🍂', grass: '#b6a84c', forest: '#9a6b32', park: '#c99b44', particle: '#fb923c' },
    { id: 'winter', name: 'Kış',      icon: '❄️', grass: '#cbd5e1', forest: '#94a3b8', park: '#e2e8f0', particle: '#ffffff' }
  ];

  YD.WEATHERS = [
    { id: 'clear', name: 'Güneşli',  icon: '☀️' },
    { id: 'rain',  name: 'Yağmurlu', icon: '🌧️' },
    { id: 'storm', name: 'Fırtına',  icon: '⛈️' },
    { id: 'snow',  name: 'Karlı',    icon: '❄️' }
  ];

  YD.JACKET_COLORS = [
    { name: 'Okyanus', hex: '#38bdf8' },
    { name: 'Mercan',  hex: '#f43f5e' },
    { name: 'Zümrüt',  hex: '#10b981' },
    { name: 'Amber',   hex: '#f59e0b' },
    { name: 'Mor',     hex: '#a855f7' }
  ];

  YD.CAREERS = [
    { minLv: 1,  title: 'Stajyer',           bonus: 1.0 },
    { minLv: 3,  title: 'Uzman',             bonus: 1.35 },
    { minLv: 5,  title: 'Kıdemli Mühendis',  bonus: 1.75 },
    { minLv: 8,  title: 'Direktör',          bonus: 2.25 },
    { minLv: 12, title: '4D Vizyoner CEO',   bonus: 3.0 }
  ];

  YD.getCareer = (lv) => {
    let cur = YD.CAREERS[0];
    for (const c of YD.CAREERS) if (lv >= c.minLv) cur = c;
    return cur;
  };

  YD.DAILY_EVENTS = [
    { id: 'normal',   name: 'Sakin Şehir Günü',       icon: '🌤️', desc: 'Her şey yolunda, dünyayı özgürce keşfet.' },
    { id: 'beach',    name: 'Sahil Festivali! (2x)',   icon: '🎉', desc: 'Denizde yüzme ve balık tutma 2 kat ödül verir!' },
    { id: 'work',     name: 'Kariyer Bonus Günü!',    icon: '💼', desc: 'İş Merkezinde maaşlar +%50 yüksek!' },
    { id: 'crystal',  name: 'Zirve Kristal Bolluğu!', icon: '💎', desc: 'Karlı Zirvedeki kristaller +%60 daha değerli!' }
  ];

  YD.SHOP_ITEMS = [
    { id: 'bike',      name: 'Şehir Bisikleti',     icon: '🚲', price: 160, desc: '[B] ile bin — 2x hızlı ulaşım!' },
    { id: 'car',       name: 'Elektrikli Araba',    icon: '🚗', price: 340, desc: '[V] ile sür — Drift, farlar, korna & 3x hız!' },
    { id: 'boat',      name: 'Sürat Teknesi',       icon: '🚤', price: 280, desc: 'Denizde [U] ile bin — Hazine Adasına hızla yelken aç!' },
    { id: 'umbrella',  name: 'Renkli Şemsiye',      icon: '☂️', price: 65,  desc: 'Yağmur & fırtınada otomatik açılır, üşümeni engeller!' },
    { id: 'petfood',   name: 'Hayvan Maması (5x)',  icon: '🥫', price: 40,  consumable: true, desc: 'Sokak kedi/köpekleri, ördekler & orman hayvanlarını besle!' },
    { id: 'pet_dog',   name: 'Altın Köpek "Paşa"',  icon: '🐶', price: 180, desc: 'Peşinden gelir, [P] ile sev (+Mutluluk), eşya koklar!' },
    { id: 'pet_cat',   name: 'Tekir Kedi "Pamuk"',  icon: '🐱', price: 150, desc: 'Tatlı yol arkadaşın! [P] ile sev, şans verir!' },
    { id: 'rod',       name: 'Pro Olta Takımı',     icon: '🎣', price: 140, desc: 'Balık mini-oyununda dev Altın bölge & nadir balık!' },
    { id: 'hourglass', name: '4D Kum Saati',        icon: '⏳', price: 300, desc: '[T] ile mevsimi & zamanı bük!' },
    { id: 'lantern',   name: 'Antik Fener',         icon: '🏮', price: 170, desc: 'Gece ve fırtınada dev altın ışık halkası!' },
    { id: 'sisyphus',  name: 'Sisyphos Taşı',       icon: '🪨', price: 260, desc: 'Çalışma, spor ve madenden +%40 kazanç!' },
    { id: 'phoenix',   name: 'Anka Tüyü',           icon: '🪶', price: 420, desc: 'Enerji bittiğinde bayılmanı engeller!' }
  ];

  YD.HOME_DECOR = [
    { id: 'espresso_m', name: 'Espresso Makinesi', icon: '☕', price: 110, desc: 'Her sabah +15 Mutluluk ve dinç uyanış!' },
    { id: 'pc_desk',    name: 'Oyun & İş PC\'si',  icon: '🖥️', price: 190, desc: 'Evden Remote Çalışma (+₺95 & +22 XP) açılır!' },
    { id: 'sofa_tv',    name: 'Lüks Koltuk & TV',  icon: '🛋️', price: 160, desc: 'Evde film molası (+35 Mutluluk) açılır!' },
    { id: 'plants',     name: 'Botanik Köşe',      icon: '🪴', price: 95,  desc: 'Her sabah +15 Sağlık yeniler!' },
    { id: 'guitar',     name: 'Gitar & Plakçalar', icon: '🎸', price: 140, desc: 'Evde müzik çal (+25 Mutluluk & +10 XP)!' }
  ];

  YD.CROPS = {
    tomato:     { id: 'tomato',     name: 'Domates',         icon: '🍅', seedPrice: 15, growSec: 36, sell: 55,  hunger: 30, health: 12, energy: 10, happy: 8  },
    strawberry: { id: 'strawberry', name: 'Organik Çilek',   icon: '🍓', seedPrice: 25, growSec: 46, sell: 95,  hunger: 25, health: 10, energy: 14, happy: 22 },
    sunflower:  { id: 'sunflower',  name: 'Altın Ayçiçeği',  icon: '🌻', seedPrice: 45, growSec: 58, sell: 175, hunger: 0,  health: 0,  energy: 20, happy: 15, xp: 40 }
  };

  YD.CAFE_PRICE = 450;
  YD.CAFE_ORDERS = [
    { key: '1', code: 'Digit1', id: 'espresso',  icon: '☕', name: 'Espresso' },
    { key: '2', code: 'Digit2', id: 'croissant', icon: '🥐', name: 'Kruvasan' },
    { key: '3', code: 'Digit3', id: 'cake',      icon: '🍰', name: 'Pasta' },
    { key: '4', code: 'Digit4', id: 'matcha',    icon: '🍵', name: 'Matcha' }
  ];

  YD.HOME_ROOM = {
    w: 680,
    h: 440,
    spots: [
      { id: 'bed',      kind: 'bed',      decor: null,         x: 110, y: 110, w: 115, h: 78, icon: '🛏️', label: 'YATAK — Uyu & Yeni Gün' },
      { id: 'kitchen',  kind: 'kitchen',  decor: null,         x: 78,  y: 212, w: 68,  h: 64, icon: '🍳', label: 'MUTFAK — Şef Yemekleri Pişir' },
      { id: 'espresso', kind: 'espresso', decor: 'espresso_m', x: 285, y: 82,  w: 84,  h: 48, icon: '☕', label: 'ESPRESSO (+25 Enerji)' },
      { id: 'plants',   kind: 'plants',   decor: 'plants',     x: 410, y: 82,  w: 76,  h: 52, icon: '🪴', label: 'BOTANİK KÖŞE (+10 Sağlık)' },
      { id: 'pc',       kind: 'pc',       decor: 'pc_desk',    x: 560, y: 112, w: 108, h: 66, icon: '🖥️', label: 'İŞ PC — Evden Çalış (+₺95)' },
      { id: 'sofa',     kind: 'sofa',     decor: 'sofa_tv',    x: 135, y: 315, w: 145, h: 76, icon: '🛋️', label: 'KOLTUK & TV — Film Molası' },
      { id: 'guitar',   kind: 'guitar',   decor: 'guitar',     x: 565, y: 325, w: 86,  h: 66, icon: '🎸', label: 'GİTAR — Müzik Çal' },
      { id: 'catalog',  kind: 'catalog',  decor: null,         x: 622, y: 220, w: 54,  h: 64, icon: '📋', label: 'DEKORASYON KATALOĞU' },
      { id: 'exit',     kind: 'exit',     decor: null,         x: 340, y: 405, w: 110, h: 36, icon: '🚪', label: 'DIŞARI ÇIK (Şehir)' }
    ]
  };

  YD.BAG_ITEMS = {
    berry:      { name: 'Orman Böğürtleni',     icon: '🍓', hunger: 18,  health: 8,  energy: 6,  sell: 22  },
    mushroom:   { name: 'Yabani Mantar',        icon: '🍄', hunger: 22,  health: 10, energy: 10, sell: 28  },
    fish:       { name: 'Taze Levrek',          icon: '🐟', hunger: 28,  health: 12, energy: 12, sell: 65  },
    goldfish:   { name: '4D Altın Balık',       icon: '🌟', hunger: 40,  health: 25, energy: 30, sell: 165 },
    grilled:    { name: 'Izgara Balık',         icon: '🍢', hunger: 65,  health: 25, energy: 35, sell: 115 },
    soup:       { name: 'Orman Mantar Çorbası', icon: '🥣', hunger: 75,  health: 35, energy: 45, sell: 155 },
    pie:        { name: 'Orman Meyveli Turta',  icon: '🥧', hunger: 60,  health: 20, energy: 40, sell: 195 },
    feast:      { name: '4D Şefin Altın Menüsü', icon: '🍱', hunger: 100, health: 60, energy: 80, sell: 290 },
    crystal:    { name: 'Zirve Kristali',       icon: '💎', hunger: 0,   health: 0,  energy: 15, sell: 85  },
    tomato:     { name: 'Organik Domates',      icon: '🍅', hunger: 30,  health: 12, energy: 10, sell: 55  },
    strawberry: { name: 'Bahçe Çileği',         icon: '🍓', hunger: 25,  health: 10, energy: 14, sell: 95  },
    sunflower:  { name: 'Altın Ayçiçeği',       icon: '🌻', hunger: 0,   health: 0,  energy: 20, sell: 175 },
    petfood:    { name: 'Hayvan Maması',        icon: '🥫', hunger: 0,   health: 0,  energy: 0,  sell: 6   }
  };

  YD.RECIPES = [
    {
      id: 'grilled',
      name: 'Izgara Levrek',
      icon: '🍢',
      ingredients: { fish: 1 },
      ingText: '1x 🐟 Taze Levrek',
      hunger: 65, energy: 35, health: 25, happy: 15,
      sell: 115, xp: 22
    },
    {
      id: 'soup',
      name: 'Orman Mantar Çorbası',
      icon: '🥣',
      ingredients: { mushroom: 1, tomato: 1 },
      ingText: '1x 🍄 Yabani Mantar + 1x 🍅 Organik Domates',
      hunger: 75, energy: 45, health: 35, happy: 22,
      sell: 155, xp: 30
    },
    {
      id: 'pie',
      name: 'Orman Meyveli Turta',
      icon: '🥧',
      ingredients: { berry: 1, strawberry: 1 },
      ingText: '1x 🍓 Orman Böğürtleni + 1x 🍓 Bahçe Çileği',
      hunger: 60, energy: 40, health: 20, happy: 45,
      sell: 195, xp: 34
    },
    {
      id: 'feast',
      name: '4D Şefin Altın Menüsü',
      icon: '🍱',
      ingredients: { fish: 1, tomato: 1, mushroom: 1 },
      ingText: '1x 🐟 Levrek + 1x 🍅 Domates + 1x 🍄 Mantar',
      hunger: 100, energy: 80, health: 60, happy: 45,
      sell: 290, xp: 50
    }
  ];

  YD.UNI_CERTS = [
    { id: 'cert_agri',     name: 'Ziraat & Botanik Diploması',   icon: '🌿', price: 180, desc: 'Bahçe ürünleri +%40 hızlı büyür, hasat ve toplayıcılık +%35 değerli satılır!' },
    { id: 'cert_fin',      name: 'Ekonomi & Finans Diploması',   icon: '📈', price: 240, desc: 'Banka günlük faizi %12\'ye çıkar, Ofis ve Kurye gelirleri +%25 artar!' },
    { id: 'cert_culinary', name: 'Gastronomi & Şeflik Akademisi', icon: '👨‍🍳', price: 210, desc: 'Pişirilen yemekler +%35 değerli satılır, Barista müşteri sabrı +%25 uzar!' }
  ];

  YD.UNI_QUIZ = [
    { q: 'Sisyphos efsanesinde zirveye çıkarılan kaya neyi simgeler?', opts: ['Azim ve yaşam mücadelesini', 'Sadece yorgunluğu', 'Deniz fenerini'], ans: 0 },
    { q: 'Organik bahçedeki ekinlerin 2 kat hızlı büyümesi için ne gerekir?', opts: ['Gece beklemek', 'Sulamak veya yağmur yağması', 'Korna çalmak'], ans: 1 },
    { q: '4D uzay-zamanda dördüncü boyut aşağıdakilerden hangisidir?', opts: ['Derinlik', 'Zaman', 'Kütle'], ans: 1 },
    { q: 'Yağmurlu ve fırtınalı havada üşüyüp enerji kaybetmemek için ne kullanılır?', opts: ['Renkli Şemsiye veya Araba', 'Pro Olta Takımı', 'Gitar'], ans: 0 },
    { q: 'Büyük Dünya\'da Tropik Hazine Adası hangi yönde yer alır?', opts: ['Kuzeydoğu Dağlarında', 'Güneybatı Açık Denizinde', 'Doğu Parkı Göletinde'], ans: 1 },
    { q: 'Şehir Bankasına yatırılan birikimler her sabah nasıl değer kazanır?', opts: ['Günlük bileşik faizle (%8–%12)', 'Hiç değişmez', 'Sadece kışın artar'], ans: 0 },
    { q: 'Ormandaki geyik ve tavşanların kaçmaması için nasıl yaklaşmalısın?', opts: ['Koşarak (Shift ile)', 'Sakin yürüyerek (Shift basmadan)', 'Arabayla korna çalarak'], ans: 1 },
    { q: 'Güneş enerjisi ve iç mekan bitkileri ev ekonomisine nasıl katkı sağlar?', opts: ['Ev faturasını düşürür ve sağlık verir', 'Arabayı boyar', 'Mevsimi kış yapar'], ans: 0 }
  ];

  YD.PHOTO_SPOTS = [
    { id: 'ph_summit',     name: '🪨 Sisyphos Zirve Manzarası', x: 2040, y: 240,  r: 175, reward: 65, xp: 35 },
    { id: 'ph_hotspring',  name: '♨️ Buharlı Dağ Kaplıcası',    x: 2560, y: 390,  r: 190, reward: 60, xp: 30 },
    { id: 'ph_lighthouse', name: '🗼 Deniz Feneri & Ufuk',      x: 4220, y: 2830, r: 195, reward: 65, xp: 35 },
    { id: 'ph_island',     name: '🏝️ Tropik Hazine Adası',      x: 920,  y: 3395, r: 215, reward: 75, xp: 40 },
    { id: 'ph_pond',       name: '🦆 Yeşil Park Göleti',        x: 3880, y: 1420, r: 255, reward: 50, xp: 28 },
    { id: 'ph_altar',      name: '⏳ Antik 4D Orman Sunağı',    x: 520,  y: 920,  r: 175, reward: 60, xp: 32 },
    { id: 'ph_fountain',   name: '⛲ Şehir Dilek Çeşmesi',      x: 2490, y: 1955, r: 155, reward: 45, xp: 25 },
    { id: 'ph_pier',       name: '🎣 Altın Sahil İskelesi',     x: 2330, y: 3020, r: 225, reward: 50, xp: 28 }
  ];

  YD.BUS_STOPS = [
    { id: 'bus_city',     name: '🏙️ Şehir Merkezi',  x: 1945, y: 1632, spawnX: 1945, spawnY: 1600 },
    { id: 'bus_mountain', name: '🏔️ Karlı Zirve',    x: 2215, y: 515,  spawnX: 2215, spawnY: 550  },
    { id: 'bus_forest',   name: '🌲 Kuzey Ormanı',   x: 1055, y: 1365, spawnX: 1055, spawnY: 1330 },
    { id: 'bus_beach',    name: '🏖️ Altın Sahil',    x: 2455, y: 2490, spawnX: 2455, spawnY: 2455 }
  ];

  YD.DELIVERY_TARGETS = [
    { id: 'dt_lodge',      name: '🏔️ Dağ Kulübesi',    x: 1625, y: 445,  reward: 230 },
    { id: 'dt_cabin',      name: '🪵 Orman Kulübesi',  x: 1190, y: 1270, reward: 190 },
    { id: 'dt_lighthouse', name: '🗼 Deniz Feneri',    x: 4220, y: 2874, reward: 250 },
    { id: 'dt_uni',        name: '🎓 Üniversite',      x: 2762, y: 2060, reward: 140 },
    { id: 'dt_hospital',   name: '🏥 Şehir Hastanesi', x: 2082, y: 1050, reward: 145 },
    { id: 'dt_park',       name: '🪑 Gölet Bankı',     x: 3880, y: 1605, reward: 185 },
    { id: 'dt_cafe',       name: '☕ Kafe & Fırın',    x: 2062, y: 2045, reward: 145 }
  ];

  YD.QUESTS = [
    { id: 'q_animals',  title: '3 Hayvanı Sev veya Besle (Kedi/Köpek/Geyik/Ördek)', target: 3, rewardMoney: 140, rewardXp: 50 },
    { id: 'q_cook',     title: 'Mutfakta veya Kamp Ateşinde 2 Gurme Yemek Pişir',   target: 2, rewardMoney: 165, rewardXp: 55 },
    { id: 'q_photo',    title: 'Kamera [F] ile 3 Farklı Manzara Fotoğrafı Çek',     target: 3, rewardMoney: 150, rewardXp: 50 },
    { id: 'q_uni',      title: 'Üniversitede Burs Sınavını Geç veya Diploma Al',    target: 1, rewardMoney: 170, rewardXp: 60 },
    { id: 'q_forest',   title: 'Ormanda 3 Böğürtlen/Mantar Topla',                  target: 3, rewardMoney: 120, rewardXp: 40 },
    { id: 'q_fish',     title: 'İskelede Balık Mini-Oyunuyla 2 Balık Tut',          target: 2, rewardMoney: 180, rewardXp: 55 },
    { id: 'q_garden',   title: 'Bahçende 2 Organik Ürün Hasat Et',                  target: 2, rewardMoney: 160, rewardXp: 50 },
    { id: 'q_cafe',     title: 'Kendi Kafeni Aç & Barista Vardiyası Yap',           target: 1, rewardMoney: 220, rewardXp: 70 },
    { id: 'q_delivery', title: 'Şehirde 1 Ekspres Kurye Teslimatı Yap',             target: 1, rewardMoney: 175, rewardXp: 55 },
    { id: 'q_island',   title: 'Tropik Hazine Adasına Çık & Sandığı Aç',            target: 1, rewardMoney: 210, rewardXp: 65 },
    { id: 'q_mountain', title: 'Karlı Zirveye Çık & Kaplıcada Dinlen',              target: 1, rewardMoney: 170, rewardXp: 60 },
    { id: 'q_park',     title: 'Yeşil Parkta Spor Yap veya Dinlen',                 target: 1, rewardMoney: 95,  rewardXp: 35 },
    { id: 'q_work',     title: 'Şehirde 1 Vardiya Çalış',                           target: 1, rewardMoney: 150, rewardXp: 45 },
    { id: 'q_swim',     title: 'Turkuaz Denizde Yüz',                               target: 1, rewardMoney: 110, rewardXp: 35 }
  ];

  YD.ACHIEVEMENTS = [
    { id: 'ach_animals', icon: '🐾', name: 'Hayvan Dostu',      desc: '3 farklı hayvanla dost ol veya besle' },
    { id: 'ach_chef',    icon: '👨‍🍳', name: 'Usta Şef',          desc: 'Mutfakta gurme bir yemek pişir' },
    { id: 'ach_photo',   icon: '📸', name: 'Doğa Fotoğrafçısı', desc: 'Kamera [F] ile 3 manzara fotoğrafı çek' },
    { id: 'ach_grad',    icon: '🎓', name: 'Akademi Mezunu',    desc: 'Üniversiteden bir uzmanlık diploması al' },
    { id: 'ach_summit',  icon: '🏔️', name: 'Zirve Fatihi',      desc: 'Sisyphos Zirvesine ulaş' },
    { id: 'ach_island',  icon: '🏝️', name: 'Ada Kaşifi',        desc: 'Tropik Hazine Sandığını aç' },
    { id: 'ach_courier', icon: '📦', name: 'Hızlı Kurye',       desc: 'İlk Ekspres Teslimatı tamamla' },
    { id: 'ach_farmer',  icon: '🌱', name: 'Usta Bahçıvan',     desc: 'Bahçenden ilk ürününü hasat et' },
    { id: 'ach_barista', icon: '☕', name: 'Kafe Patronu',      desc: 'Kendi kafeni satın al ve işlet' },
    { id: 'ach_car',     icon: '🚗', name: 'Yolların Kralı',    desc: 'Elektrikli Araba satın al' },
    { id: 'ach_pet',     icon: '🐶', name: 'Sadık Dost',        desc: 'Bir evcil hayvan sahiplen' },
    { id: 'ach_decor',   icon: '🏡', name: 'Hayalindeki Ev',    desc: 'Evine en az 3 dekor al' },
    { id: 'ach_echo',    icon: '✨', name: '4D Efsanesi',       desc: 'Geçmiş benlik yankına dokun' },
    { id: 'ach_rich',    icon: '💰', name: 'Zengin Yaşam',      desc: '₺1.000 birikime ulaş' }
  ];

  YD.NPC_TEMPLATES = [
    { name: 'Barista Ela',     zone: 'city',     x: 2205, y: 2035, color: '#f472b6', lines: ['Taze espresso kokusu şehri uyandırır! Bir gün kafeyi devralmak ister misin?', 'Evindeki mutfak tezgahında bahçe ürünleriyle harika yemekler pişirebilirsin!', 'Seninle sohbet etmek harika, al benden ufak bir hediye!'] },
    { name: 'Balıkçı Hasan',   zone: 'beach',    x: 2330, y: 2860, color: '#0284c7', lines: ['İskelede oltayı at, ibre ALTIN bölgeye gelince [E] bas!', 'Sahildeki dondurma arabasından soğuk limonata ve dondurma denedin mi?', 'Sen artık usta bir denizcisin dostum!'] },
    { name: 'Ormancı Kerim',   zone: 'forest',   x: 1020, y: 1280, color: '#15803d', lines: ['Kuzeyde Karlı Zirve ve Sıcak Kaplıca seni bekliyor!', 'Ormandaki mantar ve böğürtlenleri evinde pişirip ziyafet çekebilirsin!', 'Ormanın gerçek dostu sensin!'] },
    { name: 'Dağcı Alp',       zone: 'mountain', x: 2155, y: 420,  color: '#06b6d4', lines: ['Karlı Zirveye hoş geldin! [F] tuşuyla zirve manzarasının fotoğrafını çek!', 'Duraklardan otobüse veya yoldan geçen taksilere binebilirsin!', 'Zirvenin efsanesi oldun!'] },
    { name: 'Koşucu Deniz',    zone: 'park',     x: 3720, y: 1730, color: '#f97316', lines: ['Üniversitede burs sınavına girip uzmanlık diplomaları alabilirsin!', 'Park göletinde ördekleri beslemek ve fotoğraf çekmek mutluluğu uçuruyor!', 'Harika bir kondisyonun var!'] },
    { name: 'Antikacı Bilge',  zone: 'city',     x: 2740, y: 1050, color: '#9333ea', lines: ['Şehir meydanındaki Dilek Çeşmesinde dilek tutmayı unutma...', 'Dünkü rotanda yürüyen altın yankına dokunmayı unutma!', 'Zamanın sırrını çözdün gezgin!'] }
  ];
})(window.YasamDunya);
