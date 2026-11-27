/**
 * Yaşam Maratonu: Büyük Dünya — Configuration, Biomes, Seasons, Shop & Quests
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  YD.WORLD_W = 4200;
  YD.WORLD_H = 3200;

  // Biome Boundaries
  YD.BEACH_Y = 2160;   // Golden sand begins
  YD.SEA_Y   = 2520;   // Turquoise sea water begins
  YD.CITY_X1 = 1660;   // West = Forest, Middle = City
  YD.CITY_X2 = 3060;   // East = Green Park

  YD.SEASONS = [
    { id: 'spring', name: 'İlkbahar', icon: '🌸', grass: '#7ccf6c', forest: '#4ba856', park: '#86dc72', particle: '#fbcfe8' },
    { id: 'summer', name: 'Yaz',      icon: '☀️', grass: '#6bc45c', forest: '#3d9948', park: '#7bd666', particle: null },
    { id: 'autumn', name: 'Sonbahar', icon: '🍂', grass: '#b6a84c', forest: '#9a6b32', park: '#c99b44', particle: '#fb923c' },
    { id: 'winter', name: 'Kış',      icon: '❄️', grass: '#cbd5e1', forest: '#94a3b8', park: '#e2e8f0', particle: '#ffffff' }
  ];

  YD.SHOP_ITEMS = [
    { id: 'bike',      name: 'Şehir Bisikleti', icon: '🚲', price: 220, desc: '[B] ile bin — 2x hızlı ulaşım!' },
    { id: 'rod',       name: 'Pro Olta Takımı', icon: '🎣', price: 140, desc: 'İskelede nadir balıklar tut & sat!' },
    { id: 'hourglass', name: '4D Kum Saati',    icon: '⏳', price: 320, desc: '[T] ile mevsimi & zamanı bük!' },
    { id: 'lantern',   name: 'Antik Fener',     icon: '🏮', price: 180, desc: 'Gece orman & sahilde dev ışık + mutluluk!' },
    { id: 'sisyphus',  name: 'Sisyphos Taşı',   icon: '🪨', price: 280, desc: 'Çalışma ve spordan +%40 ekstra kazanç!' },
    { id: 'phoenix',   name: 'Anka Tüyü',       icon: '🪶', price: 450, desc: 'Enerji bittiğinde bayılmanı engeller!' }
  ];

  YD.QUESTS = [
    { id: 'q_forest', title: 'Ormanda 3 Böğürtlen/Mantar Topla', target: 3, rewardMoney: 120, rewardXp: 40 },
    { id: 'q_fish',   title: 'Sahil İskelesinde 2 Balık Tut',     target: 2, rewardMoney: 160, rewardXp: 50 },
    { id: 'q_park',   title: 'Yeşil Parkta Spor Yap veya Dinlen', target: 1, rewardMoney: 90,  rewardXp: 35 },
    { id: 'q_work',   title: 'Şehir Merkezinde 1 Vardiya Çalış',  target: 1, rewardMoney: 150, rewardXp: 45 },
    { id: 'q_swim',   title: 'Güney Denizinde Yüz & Ferahla',     target: 1, rewardMoney: 100, rewardXp: 35 }
  ];

  YD.NPC_TEMPLATES = [
    { name: 'Barista Ela',     zone: 'city',   x: 2210, y: 1560, color: '#f472b6', lines: ['Taze espresso kokusu şehri uyandırır!', 'Parktaki gölette ördekler çok tatlı bugün.'] },
    { name: 'Balıkçı Hasan',   zone: 'beach',  x: 2180, y: 2470, color: '#0284c7', lines: ['İskeleden olta at, bugün levrek bol!', 'Deniz Feneri geceleri muhteşem yanıyor.'] },
    { name: 'Ormancı Kerim',   zone: 'forest', x: 960,  y: 920,  color: '#15803d', lines: ['Kuzey Ormanında yabani böğürtlenler olgunlaştı!', 'Kamp ateşinin başında enerjin hızla dolar.'] },
    { name: 'Koşucu Deniz',    zone: 'park',   x: 3580, y: 1080, color: '#f97316', lines: ['Parkta sabah koşusu ömrü uzatır!', 'Göletin etrafında 2 tur at, sağlığın tavan yapar!'] },
    { name: 'Antikacı Bilge',  zone: 'city',   x: 2680, y: 1290, color: '#9333ea', lines: ['4D Kum Saati ile mevsimleri değiştirebilirsin...', 'Geçmiş benliğinin yankısına dokunmayı unutma!'] },
    { name: 'Müzisyen Cem',    zone: 'beach',  x: 1320, y: 2340, color: '#eab308', lines: ['Dalga sesi + gitar = saf huzur.', 'Denize girip yüzmek mutluluğu uçuruyor!'] }
  ];
})(window.YasamDunya);
