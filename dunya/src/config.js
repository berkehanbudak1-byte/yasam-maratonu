/**
 * Yaşam Maratonu: Büyük Dünya v2 — Config, 5 Biomes, Weather, Car, Home Decor & Quests
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  YD.WORLD_W = 4600;
  YD.WORLD_H = 3600;

  // Biome Boundaries
  YD.MOUNTAIN_Y = 740;  // North Snowy Mountain Peak & Hot Springs!
  YD.BEACH_Y    = 2560; // Golden Sand Beach
  YD.SEA_Y      = 2920; // Swimmable Turquoise Sea
  YD.CITY_X1    = 1760; // West = Forest, Center = City
  YD.CITY_X2    = 3260; // East = Green Park

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

  YD.SHOP_ITEMS = [
    { id: 'bike',      name: 'Şehir Bisikleti',     icon: '🚲', price: 160, desc: '[B] ile bin — 2x hızlı ulaşım!' },
    { id: 'car',       name: 'Elektrikli Araba',    icon: '🚗', price: 340, desc: '[V] ile sür — Drift, farlar, korna & 3x hız!' },
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

  YD.QUESTS = [
    { id: 'q_forest',   title: 'Ormanda 3 Böğürtlen/Mantar Topla', target: 3, rewardMoney: 120, rewardXp: 40 },
    { id: 'q_fish',     title: 'İskelede Balık Mini-Oyunuyla 2 Balık Tut', target: 2, rewardMoney: 180, rewardXp: 55 },
    { id: 'q_mountain', title: 'Karlı Zirveye Çık & Kaplıcada Dinlen', target: 1, rewardMoney: 170, rewardXp: 60 },
    { id: 'q_park',     title: 'Yeşil Parkta Spor Yap veya Dinlen', target: 1, rewardMoney: 95,  rewardXp: 35 },
    { id: 'q_work',     title: 'Şehirde 1 Vardiya Çalış',          target: 1, rewardMoney: 150, rewardXp: 45 },
    { id: 'q_swim',     title: 'Turkuaz Denizde Yüz',              target: 1, rewardMoney: 110, rewardXp: 35 }
  ];

  YD.NPC_TEMPLATES = [
    { name: 'Barista Ela',     zone: 'city',     x: 2310, y: 1940, color: '#f472b6', lines: ['Yağmurlu havada sıcak kahve gibisi yok!', 'Evini dekore edersen sabahları çok dinç uyanırsın!'] },
    { name: 'Balıkçı Hasan',   zone: 'beach',    x: 2290, y: 2860, color: '#0284c7', lines: ['İskelede oltayı at, ibre ALTIN bölgeye gelince [E] bas!', 'Yağmurda nadir 4D Zaman Balığı çıkma şansı artar!'] },
    { name: 'Ormancı Kerim',   zone: 'forest',   x: 1020, y: 1280, color: '#15803d', lines: ['Kuzeye doğru çıkarsan Karlı Zirve ve Sıcak Kaplıca var!', 'Ormanda böğürtlen ve mantarlar her gün tazelenir.'] },
    { name: 'Dağcı Alp',       zone: 'mountain', x: 2260, y: 420,  color: '#06b6d4', lines: ['Karlı Zirveye hoş geldin! Sıcak Kaplıca bütün yorgunluğunu alır!', 'Zirve kristalleri çok değerli!'] },
    { name: 'Koşucu Deniz',    zone: 'park',     x: 3780, y: 1460, color: '#f97316', lines: ['Elektrikli araba ile sahil yolunda gezmek harika!', 'Park göletindeki ördekler yağmuru çok seviyor!'] },
    { name: 'Antikacı Bilge',  zone: 'city',     x: 2780, y: 1650, color: '#9333ea', lines: ['4D Kum Saati mevsimleri, [Y] tuşu havayı değiştirir...', 'Dünkü rotanda yürüyen altın yankına dokunmayı unutma!'] }
  ];
})(window.YasamDunya);
