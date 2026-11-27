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
    berry:      { name: 'Orman Böğürtleni', icon: '🍓', hunger: 18, health: 8,  energy: 6,  sell: 22 },
    mushroom:   { name: 'Yabani Mantar',    icon: '🍄', hunger: 22, health: 10, energy: 10, sell: 28 },
    fish:       { name: 'Taze Levrek',      icon: '🐟', hunger: 28, health: 12, energy: 12, sell: 65 },
    goldfish:   { name: '4D Altın Balık',   icon: '🌟', hunger: 40, health: 25, energy: 30, sell: 165 },
    grilled:    { name: 'Izgara Balık',     icon: '🍢', hunger: 65, health: 25, energy: 35, sell: 110 },
    crystal:    { name: 'Zirve Kristali',   icon: '💎', hunger: 0,  health: 0,  energy: 15, sell: 85 },
    tomato:     { name: 'Organik Domates',  icon: '🍅', hunger: 30, health: 12, energy: 10, sell: 55 },
    strawberry: { name: 'Bahçe Çileği',     icon: '🍓', hunger: 25, health: 10, energy: 14, sell: 95 },
    sunflower:  { name: 'Altın Ayçiçeği',   icon: '🌻', hunger: 0,  health: 0,  energy: 20, sell: 175 }
  };

  YD.QUESTS = [
    { id: 'q_forest',   title: 'Ormanda 3 Böğürtlen/Mantar Topla',        target: 3, rewardMoney: 120, rewardXp: 40 },
    { id: 'q_fish',     title: 'İskelede Balık Mini-Oyunuyla 2 Balık Tut', target: 2, rewardMoney: 180, rewardXp: 55 },
    { id: 'q_garden',   title: 'Bahçende 2 Organik Ürün Hasat Et',        target: 2, rewardMoney: 160, rewardXp: 50 },
    { id: 'q_cafe',     title: 'Kendi Kafeni Aç & Barista Vardiyası Yap', target: 1, rewardMoney: 220, rewardXp: 70 },
    { id: 'q_mountain', title: 'Karlı Zirveye Çık & Kaplıcada Dinlen',     target: 1, rewardMoney: 170, rewardXp: 60 },
    { id: 'q_park',     title: 'Yeşil Parkta Spor Yap veya Dinlen',        target: 1, rewardMoney: 95,  rewardXp: 35 },
    { id: 'q_work',     title: 'Şehirde 1 Vardiya Çalış',                  target: 1, rewardMoney: 150, rewardXp: 45 },
    { id: 'q_swim',     title: 'Turkuaz Denizde Yüz',                      target: 1, rewardMoney: 110, rewardXp: 35 }
  ];

  YD.ACHIEVEMENTS = [
    { id: 'ach_summit',  icon: '🏔️', name: 'Zirve Fatihi',    desc: 'Sisyphos Zirvesine ulaş' },
    { id: 'ach_farmer',  icon: '🌱', name: 'Usta Bahçıvan',   desc: 'Bahçenden ilk ürününü hasat et' },
    { id: 'ach_barista', icon: '☕', name: 'Kafe Patronu',    desc: 'Kendi kafeni satın al ve işlet' },
    { id: 'ach_car',     icon: '🚗', name: 'Yolların Kralı',  desc: 'Elektrikli Araba satın al' },
    { id: 'ach_pet',     icon: '🐾', name: 'Sadık Dost',      desc: 'Bir evcil hayvan sahiplen' },
    { id: 'ach_decor',   icon: '🏡', name: 'Hayalindeki Ev',  desc: 'Evine en az 3 dekor al' },
    { id: 'ach_echo',    icon: '✨', name: '4D Efsanesi',     desc: 'Geçmiş benlik yankına dokun' },
    { id: 'ach_rich',    icon: '💰', name: 'Zengin Yaşam',    desc: '₺1.000 birikime ulaş' }
  ];

  YD.NPC_TEMPLATES = [
    { name: 'Barista Ela',     zone: 'city',     x: 2205, y: 2035, color: '#f472b6', lines: ['Taze espresso kokusu şehri uyandırır! Bir gün kafeyi devralmak ister misin?', 'Evini dekore edip içine girerek yaşayabilirsin!', 'Seninle sohbet etmek harika, al benden ufak bir hediye!'] },
    { name: 'Balıkçı Hasan',   zone: 'beach',    x: 2290, y: 2860, color: '#0284c7', lines: ['İskelede oltayı at, ibre ALTIN bölgeye gelince [E] bas!', 'Tuttuğun balıkları [C] çantandan kamp ateşinde pişirebilirsin!', 'Sen artık usta bir denizcisin dostum!'] },
    { name: 'Ormancı Kerim',   zone: 'forest',   x: 1020, y: 1280, color: '#15803d', lines: ['Kuzeyde Karlı Zirve ve Sıcak Kaplıca seni bekliyor!', 'Evinin yanındaki bahçeye tohum ekip sulamayı denedin mi?', 'Ormanın gerçek dostu sensin!'] },
    { name: 'Dağcı Alp',       zone: 'mountain', x: 2260, y: 420,  color: '#06b6d4', lines: ['Karlı Zirveye hoş geldin! Kaplıca tüm yorgunluğunu alır!', 'Zirve kristallerini [C] çantandan satarak zengin olabilirsin!', 'Zirvenin efsanesi oldun!'] },
    { name: 'Koşucu Deniz',    zone: 'park',     x: 3780, y: 1460, color: '#f97316', lines: ['Trafiğe dikkat et! Şehir Hastanesi kuzeybatı köşede.', 'Park göletinde ördekleri izlemek mutluluğu uçuruyor!', 'Harika bir kondisyonun var!'] },
    { name: 'Antikacı Bilge',  zone: 'city',     x: 2740, y: 1050, color: '#9333ea', lines: ['4D Kum Saati mevsimleri, [Y] tuşu havayı değiştirir...', 'Dünkü rotanda yürüyen altın yankına dokunmayı unutma!', 'Zamanın sırrını çözdün gezgin!'] }
  ];
})(window.YasamDunya);
