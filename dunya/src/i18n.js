/**
 * Yaşam Maratonu / Life Marathon v10.1 — 100% XSS-Safe Bilingual Engine (TR / EN)
 * Zero innerHTML / eval / Function sinks — passes strict CSP & security.test.js.
 * Auto-detects browser language (TR for Turkish locales, EN for global/Reddit players)
 * with instant lossless TR <-> EN switching via WeakMap-backed DOM TreeWalker.
 */
window.YasamDunya = window.YasamDunya || {};

(function (YD) {
  'use strict';

  const LANG_KEY = 'yasam_maratonu_lang_v10';
  const origTextMap = new WeakMap();
  const origAttrMap = new WeakMap();

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'tr' || saved === 'en') return saved;
    } catch (_) {}
    const nav = String((typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en').toLowerCase();
    return nav.startsWith('tr') ? 'tr' : 'en';
  }

  let curLang = detectLang();

  // Exact TR -> EN Dictionary (v1 through v10 complete!)
  const TR_TO_EN = {
    // Title & Static Modals
    '60 FPS AÇIK DÜNYA YAŞAM SİMÜLATÖRÜ': '60 FPS OPEN-WORLD COZY LIFE SIMULATOR',
    'YAŞAM MARATONU': 'LIFE MARATHON',
    '🏔️ Karlı Zirve · 🌲 Kuzey Ormanı · 🏙️ Şehir · 🌳 Yeşil Park · 🌊 Turkuaz Deniz': '🏔️ Snowy Peak · 🌲 Forest · 🏙️ City · 🌳 Park · 🌊 Ocean & Treasure Island',
    'KARAKTER ADIN': 'CHARACTER NAME',
    'CEKET RENGİ': 'JACKET COLOR',
    '▶ DEVAM ET': '▶ CONTINUE',
    '✨ OYUNA BAŞLA': '✨ START NEW LIFE',
    '↺ YENİ HAYAT': '↺ NEW LIFE',
    'WASD Gez/Sür · [E] Etkileşim · [O] 🤖 Oto-Pilot Swarm · [C] Çanta · [G] Görevler · [I] Market · [K] Tuşlar': 'WASD Move/Drive · [E] Interact · [O] 🤖 Auto-Pilot Swarm · [C] Bag · [G] Quests · [I] Market · [N] Music',
    'HARİTA [M]': 'MAP [M]',
    '🏔️Dağ': '🏔️Peak', '🌲Orman': '🌲Wood', '🏙️Şehir': '🏙️City', '🌳Park': '🌳Park', '🌊Deniz': '🌊Sea',
    'KAPAT [ESC]': 'CLOSE [ESC]',
    'ODAYA DÖN [ESC]': 'BACK TO ROOM [ESC]',
    'DURDUR [O]': 'STOP [O]',
    'İPTAL': 'CANCEL',
    'Otonom karar hesaplanıyor...': 'Calculating autonomous decision...',
    '🎣 BALIK YAKALA! İbre ALTIN bölgeye gelince [E] / [SPACE] bas!': '🎣 CATCH THE FISH! Press [E] / [SPACE] in the GOLD zone!',
    '🎣 ÇEK! [E / SPACE]': '🎣 REEL IN! [E / SPACE]',
    '☕ BARİSTA VARDİYASI': '☕ BARISTA RUSH',
    'MÜŞTERİ SİPARİŞİ': 'CUSTOMER ORDER',
    'VARDİYAYI BİTİR [ESC]': 'END SHIFT [ESC]',
    '🏢 İŞ MERKEZİ & KURYE': '🏢 BUSINESS CENTER & COURIER',
    '🚏 HIZLI OTOBÜS SEYAHATİ': '🚏 FAST-TRAVEL BUS',
    '🚕 ŞEHİR TAKSİSİ': '🚕 CITY TAXI',
    '🏦 ŞEHİR BANKASI & ATM': '🏦 CITY BANK & ATM',
    '🌱 TOHUM SEÇ & EK': '🌱 PICK SEED & PLANT',
    'Tohumu ektikten sonra sulayarak 2 kat hızlı büyütebilirsin! Yağmur otomatik sular.': 'Water after planting for 2x growth! Rain auto-waters crops.',
    '☕ KAFE & FIRIN': '☕ CAFE & BAKERY',
    '🎒 ÇANTA & KAMP ATEŞİ IZGARA': '🎒 BACKPACK & CAMPFIRE GRILL',
    '📋 GÖREVLER, KARİYER & BAŞARIMLAR': '📋 QUESTS, CAREER & ACHIEVEMENTS',
    '🏆 YAŞAM BAŞARIMLARI': '🏆 LIFE ACHIEVEMENTS',
    '🛍️ MARKET, GALERİ, PET & 4D EŞYALAR': '🛍️ MARKET, AUTO GALLERY & PETS',
    '🛋️ EV DEKORASYON KATALOĞU': '🛋️ HOME DECOR CATALOG',
    '🛏️ HEMEN UYU & YENİ GÜNE BAŞLA (+%100 Enerji)': '🛏️ SLEEP NOW & START NEXT DAY (+100% Energy)',
    '✨ ODANA YENİ EŞYA YERLEŞTİR': '✨ FURNISH YOUR ROOM',
    '🎵 MÜZİK & RADYO STÜDYOSU': '🎵 MUSIC & RADIO STUDIO',
    'ŞİMDİ ÇALIYOR': 'NOW PLAYING',
    '🎵 Müzik Sesi': '🎵 Music',
    '🌿 Doğa & Ortam': '🌿 Nature & Ambience',
    '✨ Efektler (SFX)': '✨ Sound FX',
    '📻 RADYO & MÜZİK KANALLARI': '📻 RADIO & SOUNDTRACK CHANNELS',
    '⏸ Duraklat': '⏸ Pause', '▶ Çal': '▶ Play',
    'Otomatik Dinamik Müzik (Önerilen)': 'Dynamic Auto Soundtrack (Recommended)',
    'Şehir, Orman, Sahil, Dağ, Ev İçi, Gece ve Barista/Kurye\'ye göre otomatik geçiş yapar': 'Seamlessly adapts to City, Forest, Beach, Peak, Home Lo-Fi, Night & Races',
    '⌨️ KONTROLLER & AYARLAR': '⌨️ CONTROLS & SETTINGS',
    '🌍 Oyun Dili:': '🌍 Language:',
    '↺ Kaydı Sıfırla': '↺ Reset Save',
    '🧊 Klasik 3D Godot Sürümü': '🧊 Classic 3D Godot Edition',
    '🍳 EV MUTFAĞI & GURME TARİFLER': '🍳 HOME KITCHEN & GOURMET RECIPES',
    '🎓 ÜNİVERSİTE AKADEMİSİ & BURS SINAVI': '🎓 UNIVERSITY ACADEMY & SCHOLARSHIP QUIZ',
    '📸 MANZARA FOTOĞRAF ALBÜMÜ': '📸 SCENIC PHOTO ALBUM',

    // Help Modal Controls
    'WASD / Oklar': 'WASD / Arrows',
    'Yürü / Ev İçi / Yüz / Araba Sür': 'Walk / Home / Swim / Drive',
    'Koş (Sprint)': 'Sprint (Walk calmly near Deer!)',
    'Etkileşim (Ev, Bahçe, Kafe, Balık)': 'Interact (Animals, Taxi, Home, Fish)',
    'Barista Sipariş Servis Tuşları': 'Barista Rush Service Keys',
    'Çanta (Ye / Sat / Izgara)': 'Backpack (Eat / Sell / Grill)',
    'Görevler, Kariyer & Başarımlar': 'Quests, Career & Achievements',
    'Market, Galeri & Evcil Hayvan': 'Market, Gallery & Pets',
    'Evcil Hayvanı Sev (+Mutluluk)': 'Pet Companion (+Mood)',
    'Haritayı Göster / Gizle': 'Toggle Minimap',
    'Araba / Bisiklet / Sürat Teknesi': 'Electric Car / Bike / Speedboat',
    'Araba Kornası': 'Car Horn (Traffic replies!)',
    'Hava / 4D Mevsim / Müzik Stüdyosu': 'Weather / Seasons / Music Studio',
    '🤖 Otonom Yaşam Swarm (Tam Oto-Pilot)': '🤖 Autonomous Life Swarm (Full Auto-Pilot)',
    'Kamera (Manzara Fotoğrafı Çek!)': 'Camera (Snap Scenic Photos!)',

    // Biomes
    '🏔️ KARLI ZİRVE & KAPLICA': '🏔️ SNOWY PEAK & HOT SPRING',
    '🌲 KUZEY ORMANI': '🌲 NORTHERN FOREST',
    '🏙️ ŞEHİR MERKEZİ': '🏙️ CITY CENTER',
    '🌳 YEŞİL PARK & GÖLET': '🌳 GREEN PARK & POND',
    '🏖️ ALTIN SAHİL': '🏖️ GOLDEN BEACH',
    '🌊 TURKUAZ DENİZ': '🌊 TURQUOISE SEA',
    '🏝️ TROPİK HAZİNE ADASI': '🏝️ TROPICAL TREASURE ISLAND',
    '🏠 EVİNİN İÇİ': '🏠 INSIDE YOUR HOME',
    'BÜYÜK DÜNYA': 'OPEN WORLD',

    // Seasons & Weather
    'İlkbahar': 'Spring', 'Yaz': 'Summer', 'Sonbahar': 'Autumn', 'Kış': 'Winter',
    'Güneşli': 'Sunny', 'Yağmurlu': 'Rainy', 'Fırtınalı': 'Stormy', 'Karlı': 'Snowy',

    // Careers & Daily Events
    'Stajyer': 'Intern', 'Uzman': 'Specialist', 'Müdür': 'Manager', 'Direktör': 'Director', 'Efsane CEO': 'Legend CEO',
    'Sakin Şehir Günü': 'Peaceful City Day',
    'Her şey yolunda, dünyayı özgürce keşfet.': 'All is calm — explore the open world freely.',
    'Sahil Festivali! (2x)': 'Beach Festival! (2x)',
    'Denizde yüzme ve balık tutma 2 kat ödül verir!': 'Swimming & fishing give 2x rewards today!',
    'Kariyer Bonus Günü!': 'Career Bonus Day!',
    'İş Merkezinde maaşlar +%50 yüksek!': 'Office shifts pay +50% more today!',
    'Zirve Kristal Bolluğu!': 'Peak Crystal Rush!',
    'Karlı Zirvedeki kristaller +%60 daha değerli!': 'Mountain crystals sell for +60% more today!',

    // Buildings, Interactables & Canvas Signs
    '🏔️ DAĞ KULÜBESİ': '🏔️ MOUNTAIN LODGE',
    '🏥 ŞEHİR HASTANESİ': '🏥 CITY HOSPITAL',
    '🛍️ MARKET & GALERİ': '🛍️ MARKET & GALLERY',
    '🏠 EVİN': '🏠 YOUR HOME',
    '🏢 İŞ MERKEZİ': '🏢 BUSINESS CENTER',
    '🎓 ÜNİVERSİTE': '🎓 UNIVERSITY',
    '🪵 ORMAN KULÜBESİ': '🪵 FOREST CABIN',
    '♨️ SICAK KAPLICA (+Sağlık & Enerji)': '♨️ HOT SPRING (+Health & Energy)',
    '🪨 SİSYPHOS ZİRVE KAYASI (+50 XP)': '🪨 SISYPHUS SUMMIT ROCK (+50 XP)',
    '🔥 KAMP ATEŞİ (Dinlen)': '🔥 CAMPFIRE (Rest & Grill)',
    '⏳ ANTİK 4D SUNAK (İlham Al)': '⏳ ANCIENT 4D ALTAR (Inspire)',
    '🏃 PARK SPOR ALANI (+Sağlık)': '🏃 PARK WORKOUT (+Health)',
    '🪑 GÖLET BANKI — Ördekleri Besle': '🪑 POND BENCH — Feed Ducks',
    '🎣 İSKELE — BALIK TUT': '🎣 FISHING PIER — Cast Line',
    '🗼 DENİZ FENERİ (Manzara)': '🗼 LIGHTHOUSE (Scenic View)',
    '🪙 ANTİK HAZİNE SANDIĞI': '🪙 ANCIENT TREASURE CHEST',
    '🏦 BANKA / ATM (Yatır, Çek & %8 Faiz)': '🏦 BANK / ATM (Save & 8% Interest)',
    '⚡ EV ŞARJ İSTASYONU (₺20 — %100 Batarya)': '⚡ EV CHARGER ($20 — 100%)',
    '⛲ DİLEK ÇEŞMESİ (₺15 Dilek Tut!)': '⛲ WISHING FOUNTAIN ($15 Make a Wish!)',
    '🍦 SAHİL DONDURMA & LİMONATA (₺20)': '🍦 BEACH ICE CREAM & LEMONADE ($20)',
    '🌱 ORGANİK BAHÇEN': '🌱 ORGANIC GARDEN',
    '✨ GEÇMİŞ YANKIN': '✨ PAST ECHO',
    '🚏 DURAK': '🚏 BUS',
    '⚡ EV ŞARJ': '⚡ EV CHARGE',
    '🏃 PARK SPOR ALANI': '🏃 PARK WORKOUT',
    '♨️ SICAK KAPLICA': '♨️ HOT SPRING',
    '🪨 SİSYPHOS ZİRVESİ': '🪨 SISYPHUS PEAK',
    '🎣 BALIK İSKELESİ': '🎣 FISHING PIER',
    '🐶 Paşa': '🐶 Pasha', '🐱 Pamuk': '🐱 Cotton',
    '+ EK': '+ PLANT',
    '🏝️ SANDIK AÇILDI ✓': '🏝️ CHEST LOOTED ✓',
    '🪙 HAZİNE ADASI': '🪙 TREASURE ISLAND',
    '📦 TESLİMAT NOKTASI': '📦 DROP-OFF ZONE',
    '[I] DEKOR · [ESC] ÇIK': '[I] DECOR · [ESC] EXIT',

    // Bus stops & Delivery targets
    '🏙️ Şehir Merkezi': '🏙️ City Center', '🏔️ Karlı Zirve': '🏔️ Snowy Peak',
    '🌲 Kuzey Ormanı': '🌲 Northern Forest', '🏖️ Altın Sahil': '🏖️ Golden Beach',
    '🏔️ Dağ Kulübesi': '🏔️ Mountain Lodge', '🪵 Orman Kulübesi': '🪵 Forest Cabin',
    '🗼 Deniz Feneri': '🗼 Lighthouse', '🎓 Üniversite': '🎓 University',
    '🏥 Şehir Hastanesi': '🏥 City Hospital', '🪑 Gölet Bankı': '🪑 Pond Bench',
    '☕ Kafe & Fırın': '☕ Cafe & Bakery',

    // Shop items
    'Şehir Bisikleti': 'City Bicycle', '[B] ile bin — 2x hızlı ulaşım!': 'Press [B] to ride — 2x speed!',
    'Elektrikli Araba': 'Electric Car', '[V] ile sür — Drift, farlar, korna & 3x hız!': 'Press [V] to drive — Drift, lights, horn & 3x speed!',
    'Sürat Teknesi': 'Speedboat', 'Denizde [U] ile bin — Hazine Adasına hızla yelken aç!': 'Press [U] at sea — Sail to Treasure Island!',
    'Renkli Şemsiye': 'Rainbow Umbrella', 'Yağmur & fırtınada otomatik açılır, üşümeni engeller!': 'Auto-opens in rain & storms to keep you warm!',
    'Hayvan Maması (5x)': 'Pet Food Pack (5x)', 'Sokak kedi/köpekleri, ördekler & orman hayvanlarını besle!': 'Feed street cats/dogs, ducks & forest wildlife!',
    'Altın Köpek "Paşa"': 'Golden Dog "Pasha"', 'Peşinden gelir, [P] ile sev (+Mutluluk), eşya koklar!': 'Follows you everywhere, press [P] to pet (+Mood)!',
    'Tekir Kedi "Pamuk"': 'Tabby Cat "Cotton"', 'Tatlı yol arkadaşın! [P] ile sev, şans verir!': 'Your cozy companion! Press [P] to pet for good vibes!',
    'Pro Olta Takımı': 'Pro Fishing Rod', 'Balık mini-oyununda dev Altın bölge & nadir balık!': 'Huge golden zone & rare fish at the Pier!',
    '4D Kum Saati': '4D Hourglass', '[T] ile mevsimi & zamanı bük!': 'Press [T] to shift seasons on demand!',
    'Antik Fener': 'Ancient Lantern', 'Gece ve fırtınada dev altın ışık halkası!': 'Warm golden light halo at night & in storms!',
    'Sisyphos Taşı': 'Sisyphus Stone', 'Çalışma, spor ve madenden +%40 kazanç!': '+40% rewards from work, workouts & summits!',
    'Anka Tüyü': 'Phoenix Feather', 'Enerji bittiğinde bayılmanı engeller!': 'Prevents fainting when Energy hits 0!',

    // Home decor, recipes, diplomas, quiz, photo spots
    'Espresso Makinesi': 'Espresso Machine', 'Her sabah +15 Mutluluk ve dinç uyanış!': '+15 Mood every morning & fresh espresso!',
    'Oyun & İş PC\'si': 'Work & Gaming PC', 'Evden Remote Çalışma (+₺95 & +22 XP) açılır!': 'Unlocks Remote Work from home (+$95 & +22 XP)!',
    'Lüks Koltuk & TV': 'Cozy Sofa & TV', 'Evde film molası (+35 Mutluluk) açılır!': 'Unlocks Movie Night at home (+35 Mood)!',
    'Botanik Köşe': 'Botanical Corner', 'Her sabah +15 Sağlık yeniler!': '+15 Health every morning & eco bill discount!',
    'Gitar & Plakçalar': 'Acoustic Guitar', 'Evde müzik çal (+25 Mutluluk & +10 XP)!': 'Play guitar at home (+25 Mood & +10 XP)!',
    'YATAK — Uyu & Yeni Gün': 'BED — Sleep & Next Day',
    'ESPRESSO (+25 Enerji)': 'ESPRESSO (+25 Energy)',
    'BOTANİK KÖŞE (+10 Sağlık)': 'PLANTS (+10 Health)',
    'İŞ PC — Evden Çalış (+₺95)': 'WORK PC — Remote Job (+$95)',
    'KOLTUK & TV — Film Molası': 'SOFA & TV — Movie Break',
    'GİTAR — Müzik Çal': 'GUITAR — Play Music',
    'DEKORASYON KATALOĞU': 'DECOR CATALOG',
    'DIŞARI ÇIK (Şehir)': 'EXIT TO CITY',
    'MUTFAK — Gurme Yemek Pişir': 'KITCHEN — Gourmet Cooking',
    'Domates': 'Tomato', 'Organik Çilek': 'Organic Strawberry', 'Altın Ayçiçeği': 'Golden Sunflower',
    'Kruvasan': 'Croissant', 'Pasta': 'Cake',
    'Orman Böğürtleni': 'Wild Berry', 'Yabani Mantar': 'Wild Mushroom',
    'Taze Levrek': 'Fresh Sea Bass', '4D Altın Balık': '4D Golden Fish',
    'Izgara Balık': 'Grilled Fish', 'Izgara Levrek': 'Grilled Sea Bass',
    'Orman Mantar Çorbası': 'Forest Mushroom Soup', 'Orman Meyveli Turta': 'Wild Berry Pie',
    '4D Şefin Altın Menüsü': '4D Chef Golden Feast',
    'Zirve Kristali': 'Summit Crystal', 'Organik Domates': 'Organic Tomato',
    'Bahçe Çileği': 'Garden Strawberry', 'Hayvan Maması': 'Pet Food',
    'Ziraat & Botanik Diploması': 'Agriculture & Botany Diploma',
    'Bahçe ürünleri +%40 hızlı büyür, hasat ve toplayıcılık +%35 değerli satılır!': 'Crops grow +40% faster, harvests & foraging sell for +35% more!',
    'Ekonomi & Finans Diploması': 'Economics & Finance Diploma',
    'Banka günlük faizi %12\'ye çıkar, Ofis ve Kurye gelirleri +%25 artar!': 'Bank interest rises to 12%/day, Office & Courier pay +25% more!',
    'Gastronomi & Şeflik Akademisi': 'Culinary & Chef Academy',
    'Pişirilen yemekler +%35 değerli satılır, Barista müşteri sabrı +%25 uzar!': 'Cooked dishes sell +35% higher, Barista patience +25% longer!',
    '🪨 Sisyphos Zirve Manzarası': '🪨 Sisyphus Peak View',
    '♨️ Buharlı Dağ Kaplıcası': '♨️ Steaming Mountain Hot Spring',
    '🗼 Deniz Feneri & Ufuk': '🗼 Lighthouse & Horizon',
    '🏝️ Tropik Hazine Adası': '🏝️ Tropical Treasure Island',
    '🦆 Yeşil Park Göleti': '🦆 Green Park Duck Pond',
    '⏳ Antik 4D Orman Sunağı': '⏳ Ancient 4D Forest Altar',
    '⛲ Şehir Dilek Çeşmesi': '⛲ City Wishing Fountain',
    '🎣 Altın Sahil İskelesi': '🎣 Golden Beach Pier',

    // Quests & Achievements
    '3 Hayvanı Sev veya Besle (Kedi/Köpek/Geyik/Ördek)': 'Pet or Feed 3 Animals (Cat/Dog/Deer/Duck)',
    'Mutfakta veya Kamp Ateşinde 2 Gurme Yemek Pişir': 'Cook 2 Gourmet Dishes in Kitchen or Campfire',
    'Kamera [F] ile 3 Farklı Manzara Fotoğrafı Çek': 'Snap 3 Scenic Photos with Camera [F]',
    'Üniversitede Burs Sınavını Geç veya Diploma Al': 'Pass University Quiz or Earn a Diploma',
    'Ormanda 3 Böğürtlen/Mantar Topla': 'Forage 3 Berries or Mushrooms in the Forest',
    'İskelede Balık Mini-Oyunuyla 2 Balık Tut': 'Catch 2 Fish at the Pier Mini-Game',
    'Bahçende 2 Organik Ürün Hasat Et': 'Harvest 2 Organic Crops in Your Garden',
    'Kendi Kafeni Aç & Barista Vardiyası Yap': 'Buy the Cafe & Finish a Barista Shift',
    'Şehirde 1 Ekspres Kurye Teslimatı Yap': 'Complete 1 Express Courier Delivery',
    'Tropik Hazine Adasına Çık & Sandığı Aç': 'Sail to Treasure Island & Open the Chest',
    'Karlı Zirveye Çık & Kaplıcada Dinlen': 'Visit Snowy Peak & Relax at Hot Spring',
    'Yeşil Parkta Spor Yap veya Dinlen': 'Work Out or Feed Ducks in Green Park',
    'Şehirde 1 Vardiya Çalış': 'Complete 1 Shift at Business Center',
    'Turkuaz Denizde Yüz': 'Go Swimming in the Turquoise Sea',
    'Hayvan Dostu': 'Animal Friend', '3 farklı hayvanla dost ol veya besle': 'Befriend or feed 3 different animals',
    'Usta Şef': 'Master Chef', 'Mutfakta gurme bir yemek pişir': 'Cook a gourmet dish in the kitchen',
    'Doğa Fotoğrafçısı': 'Nature Photographer', 'Kamera [F] ile 3 manzara fotoğrafı çek': 'Take 3 scenic photos with Camera [F]',
    'Akademi Mezunu': 'Academy Graduate', 'Üniversiteden bir uzmanlık diploması al': 'Earn a University diploma',
    'Zirve Fatihi': 'Summit Conqueror', 'Sisyphos Zirvesine ulaş': 'Reach Sisyphus Summit Rock',
    'Ada Kaşifi': 'Island Explorer', 'Tropik Hazine Sandığını aç': 'Open the Tropical Treasure Chest',
    'Hızlı Kurye': 'Express Ace', 'İlk Ekspres Teslimatı tamamla': 'Finish your first Express Delivery',
    'Usta Bahçıvan': 'Master Gardener', 'Bahçenden ilk ürününü hasat et': 'Harvest your first garden crop',
    'Kafe Patronu': 'Cafe Owner', 'Kendi kafeni satın al ve işlet': 'Buy and run your own Cafe',
    'Yolların Kralı': 'Road King', 'Elektrikli Araba satın al': 'Buy the Electric Car',
    'Sadık Dost': 'Loyal Companion', 'Bir evcil hayvan sahiplen': 'Adopt a loyal pet',
    'Hayalindeki Ev': 'Dream Home', 'Evine en az 3 dekor al': 'Own at least 3 home decorations',
    '4D Efsanesi': '4D Legend', 'Geçmiş benlik yankına dokun': 'Touch your golden Past Echo',
    'Zengin Yaşam': 'Wealthy Life', '₺1.000 birikime ulaş': 'Reach $1,000 total wealth',

    // NPCs, Animals & Music
    'Barista Ela': 'Barista Ella', 'Balıkçı Hasan': 'Fisher Sam', 'Ormancı Kerim': 'Ranger Owen',
    'Dağcı Alp': 'Climber Leo', 'Koşucu Deniz': 'Runner Maya', 'Antikacı Bilge': 'Sage Nora',
    'Orman Geyiği': 'Forest Deer', 'Kızıl Geyik': 'Red Deer', 'Genç Karaca': 'Young Fawn', 'Geyik': 'Deer',
    'Pamuk Tavşan': 'Cotton Bunny', 'Beyaz Tavşan': 'Snow Rabbit', 'Minik Tavşan': 'Little Bunny',
    'Tavşan': 'Rabbit', 'Kır Tavşanı': 'Meadow Hare', 'Hızlı Tavşan': 'Swift Rabbit',
    'Tekir': 'Tabby', 'Boncuk': 'Mittens', 'Tarçın': 'Cinnamon',
    'Karabaş': 'Buddy', 'Badem': 'Almond', 'Zeytin': 'Olive',
    'Güneşli Şehir': 'Sunny City', 'Ghibli tarzı sıcak piyano ve flüt yürüyüşü': 'Warm Ghibli-style piano & flute stroll',
    'Kuzey Ormanı': 'Northern Forest', 'Huzurlu arp, ney/flüt ve orman esintisi': 'Peaceful harp, airy flute & woodland breeze',
    'Tropik Sahil': 'Tropical Beach', 'Güneşli marimba, bossa gitar ve dalga ritmi': 'Sunny marimba, bossa guitar & ocean groove',
    'Karlı Zirve': 'Snowy Peak', 'Kristal çanlar, gökyüzü yaylıları ve derin huzur': 'Crystal bells, sky strings & serene calm',
    'Yeşil Park': 'Green Park', 'Akustik gitar, neşeli piyano ve bahçe tınısı': 'Acoustic guitar, bright piano & garden vibes',
    'Ev Lo-Fi Piyano': 'Home Lo-Fi Piano', 'Sıcacık Rhodes piyano ve yumuşak lo-fi ritim': 'Cozy Rhodes piano & mellow lo-fi beat',
    'Gece Yıldızları': 'Starry Night', 'Rüya gibi müzik kutusu, yumuşak pad ve yıldızlar': 'Dreamy music-box lullaby & warm pads',
    'Kurye & Barista Rush': 'Courier & Barista Rush', 'Enerjik tempo! Teslimat ve kafe vardiyası ritmi': 'Upbeat groove for delivery races & coffee shifts!',

    // Short action labels
    'ALINDI ✓': 'OWNED ✓', 'ODADA ✓': 'OWNED ✓', 'BURADA': 'HERE', 'UYGULA': 'GO',
    'YE': 'EAT', '🔥 PİŞİR': '🔥 GRILL', 'AKTİF': 'ACTIVE', 'BAŞLAT ▶': 'START ▶',
    'ÇALIŞ': 'WORK', 'ÜCRETSİZ': 'FREE', 'Yetersiz Bakiye!': 'Not enough cash!',
    '🛏️ Yatak': '🛏️ Bed',
    'Ofis Vardiyası Çalış': 'Work Office Shift',
    'Ekspres Kurye Teslimatı (45sn Yarış!)': 'Express Courier Delivery (45s Race!)',
    'Bisiklet veya Arabanla hedefe yetiş — +₺140–₺320 + Hız Bonusu!': 'Race by bike or car — +$140–$320 + Speed Bonus!',
    'Barista Vardiyası (25sn Mini-Oyun)': 'Barista Rush Shift (25s Mini-Game)',
    '[1-4] tuşlarıyla siparişleri yetiştir, kombo yap, dev bahşiş topla!': 'Serve orders with [1-4], build combos & earn huge tips!',
    'Patronun Özel Lattesi': 'Owner\'s Signature Latte',
    'Latte & Sıcak Simit': 'Latte & Warm Croissant',
    'Kafeyi Satın Al & Patron Ol!': 'Buy the Cafe & Become the Owner!',
    'Adın tabelaya yazılır, her gün pasif gelir + Barista Mini-Oyunu açılır!': 'Your name goes on the sign, daily passive profit + Barista Rush!',
    'Şu an bu bölgedesin': 'You are here', 'Konforlu taksi yolculuğu': 'Comfy taxi ride', 'Anında hızlı seyahat': 'Instant fast-travel',
    '₺50 Yatır': 'Deposit $50', 'Birikimine günlük %8 faiz işler': 'Earns daily compound interest',
    '₺200 Yatır': 'Deposit $200', 'Hızlı tasarruf + yüksek günlük faiz': 'Fast savings + high daily interest',
    'Tüm Nakti Yatır': 'Deposit All Cash', '₺50 Çek': 'Withdraw $50', 'Cüzdanına anında nakit al': 'Instant cash to your wallet',
    'Hepsini Çek': 'Withdraw All',
    'Çantan boş! Ormandan böğürtlen, dağdan kristal veya iskeleden balık topla!': 'Your backpack is empty! Forage berries, mine crystals, or catch fish!',
    'Çantan boş! Ormandan böğürtlen, dağdan kristal, bahçenden ürün veya iskeleden balık topla!': 'Your backpack is empty! Forage berries, mine crystals, harvest crops, or catch fish!',
    'Sokak & orman hayvanlarını [E] ile besle!': 'Feed street & forest animals with [E]!',
    'Birikimine günlük %12 faiz işler': 'Earns 12% daily compound interest (Finance Diploma)',
    'Kendi kafenden ücretsiz taze kahve & kruvasan! (+35 Enerji, +35 Tokluk)': 'Free fresh coffee & croissant from your own cafe! (+35 Energy, +35 Hunger)',
    'Kafe Sahibi Sensin!': 'You Own This Cafe!',
    'Tamamlandı ✓': 'Completed ✓',
    'Hazır (+₺150 Burs!)': 'Ready (+$150 Scholarship!)',
    'YE 🍽️': 'EAT 🍽️',
    'PİŞİR 🍳': 'COOK 🍳',
    // Canvas signs
    '⛲ DİLEK ÇEŞMESİ': '⛲ WISHING FOUNTAIN',
    '🍦 DONDURMA': '🍦 ICE CREAM',
    '⚡ EV ŞARJ': '⚡ EV CHARGER',
    '🚏 DURAK': '🚏 BUS STOP',
    '🏝️ SANDIK AÇILDI ✓': '🏝️ CHEST OPENED ✓',
    '🪙 HAZİNE ADASI': '🪙 TREASURE ISLAND',
    // Swarm AI Roles & Tasks
    '⌨️ MANUEL': '⌨️ MANUAL',
    '🩺 İHTİYAÇ AJANI': '🩺 NEEDS AGENT',
    '🩺 SAĞLIK AJANI': '🩺 HEALTH AGENT',
    '🌱 ÇİFTLİK AJANI': '🌱 FARM AGENT',
    '📦 KURYE AJANI': '📦 COURIER AGENT',
    '🎓 AKADEMİ AJANI': '🎓 ACADEMY AGENT',
    '⛲ ŞANS AJANI': '⛲ FORTUNE AGENT',
    '🏦 FİNANS AJANI': '🏦 FINANCE AGENT',
    '📸 KEŞİF AJANI': '📸 EXPLORE AGENT',
    '☕ BARİSTA AJANI': '☕ BARISTA AGENT',
    '💼 KARİYER AJANI': '💼 CAREER AGENT',
    '🎣 KEŞİF AJANI': '🎣 FISHING AGENT',
    '🌳 KEŞİF AJANI': '🌳 PARK AGENT',
    '4 Ajan otonom kontrolü devraldı...': '4 autonomous agents taking control...',
    'Evde yatağa gidip uyuyor...': 'Heading home to sleep...',
    'Dinlendi, şehre çıkıyor...': 'Well rested, heading back outside...',
    'Şehir Hastanesine muayeneye gidiyor...': 'Heading to City Hospital for a checkup...',
    'Sıcak Kaplıcada şifa arıyor...': 'Relaxing at the Mountain Hot Spring...',
    'Kafede sıcak Latte & Simit molasına gidiyor...': 'Stopping by the Cafe for a hot latte...',
    'Eve dinlenmeye ve yeni güne hazırlanmaya gidiyor...': 'Heading home to rest for a new day...',
    'Organik bahçeye yeni tohum ekiliyor...': 'Planting fresh seeds in the garden...',
    'Üniversite Günlük Burs Sınavına (+₺150) gidiyor...': 'Heading to University for the Daily Quiz (+$150)...',
    'Şehir Dilek Çeşmesinde günlük 4D dilek tutuyor...': 'Making a daily 4D wish at the Wishing Fountain...',
    'Fazla nakti Banka ATM\'ye (%8–%12 günlük faiz) yatırıyor...': 'Depositing spare cash at Bank ATM (8–12% daily interest)...',
    'Kendi kafesinde Barista Vardiyası başlatıyor...': 'Starting a Barista Shift at your Cafe...',
    'İş Merkezinde vardiya & Ekspres Kurye görevine gidiyor...': 'Heading to Business Center for work & courier gigs...',
    'Balık İskelesinde altın balık avına gidiyor...': 'Heading to the Fishing Pier for golden fish...',
    'Yeşil Park Göletinde ördekleri besleyip enerji topluyor...': 'Feeding ducks at Green Park Pond...',
    'Klavye kontrolü algılandı (Bırakınca Swarm devam eder)': 'Manual input detected (Swarm resumes when released)',
    '🤖 OTONOM YAŞAM SWARM AKTİF! (İhtiyaç · Çiftlik/Şef · Kariyer/Finans · Keşif/Fotoğraf)': '🤖 AUTONOMOUS LIFE SWARM ACTIVE! (Needs · Farm/Chef · Career · Explore)',
    '🤖 Oto-Pilot kapatıldı — Manuel kontrol sende.': '🤖 Auto-Pilot paused — Manual control restored.',
    // Starter Discovery Guide (v10.2)
    '🧭 KEŞİF REHBERİ': '🧭 DISCOVERY GUIDE',
    'Dil Değiştir (TR / EN)': 'Switch Language (EN / TR)',
    'Yön Okunu Aç/Kapat': 'Toggle Waypoint Arrow',
    'Rehberi Küçült': 'Collapse Guide',
    'Rehberi Göster': 'Show Discovery Guide',
    'ATLA ›': 'SKIP ›',
    '🎯 HEDEF': '🎯 GOAL',
    'Evine Gir & Odanı Keşfet': 'Visit Your Cozy Home',
    'Ev kapısına yaklaş ve [E] ile içeri gir': 'Walk to your Home door & press [E] to enter',
    'Bir Hayvan Dostu Edin': 'Make an Animal Friend',
    'Sokak kedisi/köpeği veya ördekleri [E] ile sev/besle': 'Pet or feed any street cat, dog, or park duck with [E]',
    'Bahçene İlk Tohumunu Ek': 'Plant Your First Garden Seed',
    'Ev arkası toprakta [E] ile organik tohum ek': 'Plant a seed in the garden behind your home with [E]',
    'İlk Maaşını Kazan': 'Earn Your First Paycheck',
    'İş Merkezinde [E] ile vardiya veya Kurye yap': 'Visit Business Center ([E]) for a shift or Courier gig',
    'Sahil İskelesinde Balık Tut': 'Go Fishing at the Beach Pier',
    'Güneydeki Altın Sahil İskelesine in ve [E] bas': 'Head south to Golden Beach Pier & cast with [E]',
    'Marketten İlk Eşyanı Al': 'Gear Up at the Market',
    '[I] tuşuna basıp Bisiklet, Mama veya Evcil Hayvan al': 'Press [I] to open Market & buy any item or pet',
    'Üniversite veya Kafeye Uğra': 'Visit University or the Cafe',
    'Üniversitede [E] Burs Sınavı çöz ya da Kafede mola ver': 'Try the University Quiz (+$150) or grab a Cafe Latte ([E])',
    'Müzik Stüdyosu veya Oto-Pilotu Dene': 'Try Music Studio or Auto-Pilot',
    '[N] Radyo Stüdyosunu aç veya [O] Swarm AI başlat': 'Open Music Studio ([N]) or try Swarm Auto-Pilot ([O])',
    '🏆 KEŞİF REHBERİ TAMAMLANDI! Artık Hazine Adası [U], Gurme Mutfak ve Kafe Sahipliği seni bekliyor!': '🏆 DISCOVERY GUIDE COMPLETE! Now explore Treasure Island [U], Gourmet Cooking & owning the Cafe!'
  };

  // Safe ordered phrase replacements for dynamic strings when lang === 'en'
  const PHRASE_REPS = [
    ['EVİNİN İÇİNE GİR', 'ENTER YOUR HOME'],
    ['Taksiyi Durdur', 'Hail Passing Taxi'],
    ['OTOBÜS DURAĞI', 'BUS STOP'],
    ['Tohum Ek (Bahçen)', 'Plant Seed (Garden)'],
    ['Hasat Et!', 'Harvest!'],
    ['Sula (2x Hız — %', 'Water (2x Speed — '],
    ['Büyüyor (%', 'Growing ('],
    ['Zirve Kristali Topla', 'Collect Summit Crystal'],
    ['Böğürtlen Topla', 'Pick Wild Berry'],
    ['Mantar Topla', 'Pick Mushroom'],
    ['Katalogdan Satın Al', 'Buy in Catalog'],
    ['(🥫 Mama Ver)', '(🥫 Feed)'],
    ['(🐟 Balık Ver)', '(🐟 Give Fish)'],
    ['(🍓 Böğürtlen Ver)', '(🍓 Give Berry)'],
    ['(🥫 Besle)', '(🥫 Feed)'],
    ['(Sev)', '(Pet)'],
    ['(Tanış)', '(Say Hi)'],
    ['KAFE & FIRIN (İç / Satın Al)', 'CAFE & BAKERY (Drink / Buy)'],
    ['KAFE (Barista & İkram)', 'CAFE (Barista & Coffee)'],
    ['Otomatik (Biyom / Gece / Görev)', 'Auto (Biome / Night / Action)'],
    ['Sabit Radyo Kanalı', 'Locked Radio Channel'],
    ['Şu an bu duraktasın', 'You are at this stop'],
    ['Taksi ücreti', 'Taxi fare is'],
    ['Bilet sadece', 'Ticket is only'],
    ['Haritanın dört bir yanına anında git.', 'Travel anywhere across the map instantly.'],
    ['Seçtiğin bölgeye kapıdan kapıya hızlıca bırakır.', 'Door-to-door ride to any district.'],
    ['Büyüme: ~', 'Grow: ~'],
    ['sn · Satış:', 's · Sells:'],
    ['Tohumu', 'Seed'],
    ['GÜN ', 'DAY '],
    ['YAŞ ', 'AGE '],
    ['GİT ₺', 'GO $'],
    ['SAT ₺', 'SELL $'],
    ['EK ₺', 'PLANT $'],
    ['Cüzdan:', 'Wallet:'],
    ['Banka:', 'Bank:'],
    ['hesaba aktar', 'to savings'],
    ['cüzdana aktar', 'to wallet'],
    ['/gün %', '/day '],
    [' faiz)', '% interest)'],
    ['Unvan:', 'Title:'],
    ['Maaş x', 'Pay x'],
    ['Bonus Günü!', 'Bonus Day!'],
    ['Finans Diploması (+%25)', 'Finance Diploma (+25%)'],
    ['Malzemelerin:', 'Ingredients:'],
    ['Şef Bonusu', 'Chef Bonus'],
    ['Gereken:', 'Needs:'],
    ['Satış:', 'Sells:'],
    ['Böğürtlen', 'Berries'],
    ['Çilek', 'Strawberries'],
    ['Akademik Diplomalar:', 'Academic Diplomas:'],
    ['Günlük Burs Sınavı:', 'Daily Scholarship Quiz:'],
    ['Her sabah pasif gelir:', 'Daily passive income:'],
    ['Toplam Kazanç:', 'Total Earned:'],
    ['Sıcak kahve iç veya', 'Grab a hot coffee or save'],
    ['biriktirip bu kafeyi satın al!', 'to buy and own this cafe!'],
    ['Enerji', 'Energy'],
    ['Tokluk', 'Hunger'],
    ['Sağlık', 'Health'],
    ['Mutluluk', 'Mood'],
    ['Hedef:', 'Target:'],
    ['Çantada:', 'In Bag:'],
    ['SEVİYE ', 'LEVEL '],
    ['GÖREV TAMAM:', 'QUEST DONE:'],
    ['BAŞARIM AÇILDI:', 'ACHIEVEMENT UNLOCKED:'],
    ['BİP BİP! YOLDAN ÇEKİL!', 'BEEP BEEP! WATCH OUT!'],
    ['DÜÜÜT! DİKKAT!', 'HONK! WATCH OUT!'],
    ['DÜÜT!', 'HONK!'],
    ['BİP BİP!', 'BEEP BEEP!'],
    ['DÜT!', 'HONK!'],
    ['MİYAV!', 'MEOW!'],
    ['HAV HAV!', 'WOOF!'],
    ['VAK VAK!', 'QUACK!'],
    ['Ördekleri Besledin', 'Fed the Pond Ducks'],
    ['Ördekler Mamaya Bayıldı!', 'The ducks loved the treat!'],
    ['karnını doyurdu', 'loved the meal'],
    ['çok sevindi', 'loved the pets'],
    ['elinden yedi!', 'ate from your hand!'],
    ['sana güvendi!', 'trusts you now!'],
    ['Evine Hoş Geldin! Odada gez, [E] ile eşyaları kullan veya [ESC] ile çık.', 'Welcome Home! Walk around, press [E] on furniture, or [ESC] to exit.'],
    ['Merhaba ', 'Welcome '],
    ['! Büyük Dünya seni bekliyor!', '! The open world awaits!'],
    ['HAVA:', 'WEATHER:'],
    ['BİSİKLET AÇIK', 'BICYCLE ON'],
    ['YÜRÜYÜŞ', 'WALKING'],
    ['ARABA MODU! ([H]/[Space] Korna)', 'DRIVING! ([H]/[Space] Horn)'],
    ['ARABADAN İNDİN', 'EXITED CAR'],
    ['SÜRAT TEKNESİ AÇIK! (Güneybatıda Hazine Adası!)', 'SPEEDBOAT ON! (Treasure Island lies southwest!)'],
    ['HAZİNE ADASINA ÇIKTIN!', 'LANDED ON TREASURE ISLAND!'],
    ['SAHİLE ÇIKTIN', 'BACK ON THE BEACH'],
    ['DENİZE ATLADIN', 'JUMPED INTO THE SEA'],
    ['ARABA ÇARPTI!!', 'HIT BY CAR!!'],
    ['ÇARPIŞMA!', 'CRASH!'],
    ['AHH!! Trafiğe dikkat etmeliyim!', 'OUCH!! Gotta watch traffic!'],
    ['Şehir Hastanesinden taburcu oldun!', 'Discharged from City Hospital!'],
    ['EKSPRES KURYE:', 'EXPRESS COURIER:'],
    ['noktasına 45 saniyede yetiş!', '— reach within 45 seconds!'],
    ['TESLİMAT TAMAM!', 'DELIVERY COMPLETE!'],
    ['Hız Bonusu', 'Speed Bonus'],
    ['Süre doldu! Tekrar dene.', 'Time\'s up! Try again.'],
    ['Teslimat iptal edildi.', 'Delivery cancelled.'],
    ['Yağmurda ıslandın! (Market: ☂️ Şemsiye)', 'Getting wet! Grab ☂️ Umbrella at Market.'],
    ['Araba şarjı azaldı! Market yanındaki EV Şarj İstasyonuna uğra.', 'EV battery low! Visit the EV Charger beside the Market.'],
    ['Batarya bitti! Yavaş mod — EV Şarj İstasyonunda (₺20) veya evde şarj et.', 'Battery empty! Limp mode — recharge at EV Station ($20) or home.'],
    ['Batarya zaten %100 dolu!', 'Battery is already 100% charged!'],
    ['%100 HIZLI ŞARJ TAMAM!', '100% FAST CHARGED!'],
    ['Her şey yolunda, dünyayı özgürce keşfet.', 'All clear — explore the open world freely!'],
    ['Denizde yüzme ve balık tutma 2 kat ödül verir!', 'Swimming & fishing give 2x rewards today!'],
    ['İş Merkezinde maaşlar +%50 yüksek!', 'Business Center pays +50% bonus salaries today!'],
    ['Karlı Zirvedeki kristaller +%60 daha değerli!', 'Snowy Peak crystals sell for +60% more today!'],
    ['Olgunlaşan ', 'Harvesting ripe '],
    [' hasat ediliyor...', '...'],
    ['Bahçedeki ', 'Watering '],
    [' sulanıyor (2x hız)...', ' (2x speed)...'],
    [' noktasına teslimat yapılıyor (', ' — delivering ('],
    ['sn)...', 's)...'],
    [' topluyor...', ' foraging...'],
    ['Gün ', 'Day '],
    ['☕ Kafe +', '☕ Cafe +'],
    ['🏦 Faiz +', '🏦 Interest +'],
    ['💡 Fatura -', '💡 Bill -'],
    [' EVİ', '\'S HOME'],
    [' KAFE', ' CAFE'],
    ['₺', '$']
  ];

  // Replace known TR entity/item names inside longer dynamic strings
  const SUB_NAMES = [
    ['Orman Geyiği', 'Forest Deer'], ['Kızıl Geyik', 'Red Deer'], ['Genç Karaca', 'Young Fawn'],
    ['Pamuk Tavşan', 'Cotton Bunny'], ['Beyaz Tavşan', 'Snow Rabbit'], ['Minik Tavşan', 'Little Bunny'],
    ['Kır Tavşanı', 'Meadow Hare'], ['Hızlı Tavşan', 'Swift Rabbit'],
    ['Tekir', 'Tabby'], ['Boncuk', 'Mittens'], ['Tarçın', 'Cinnamon'],
    ['Karabaş', 'Buddy'], ['Badem', 'Almond'], ['Zeytin', 'Olive'],
    ['Barista Ela', 'Barista Ella'], ['Balıkçı Hasan', 'Fisher Sam'], ['Ormancı Kerim', 'Ranger Owen'],
    ['Dağcı Alp', 'Climber Leo'], ['Koşucu Deniz', 'Runner Maya'], ['Antikacı Bilge', 'Sage Nora'],
    ['Güneşli Şehir', 'Sunny City'], ['Kuzey Ormanı', 'Northern Forest'], ['Tropik Sahil', 'Tropical Beach'],
    ['Karlı Zirve', 'Snowy Peak'], ['Yeşil Park', 'Green Park'], ['Ev Lo-Fi Piyano', 'Home Lo-Fi Piano'],
    ['Gece Yıldızları', 'Starry Night'], ['Kurye & Barista Rush', 'Courier & Barista Rush'],
    ['Altın Sahil', 'Golden Beach'], ['Şehir Merkezi', 'City Center'], ['Dağ Kulübesi', 'Mountain Lodge'],
    ['Orman Kulübesi', 'Forest Cabin'], ['Deniz Feneri', 'Lighthouse'], ['Şehir Hastanesi', 'City Hospital'],
    ['Gölet Bankı', 'Pond Bench'], ['Kafe & Fırın', 'Cafe & Bakery'], ['Üniversite', 'University'],
    ['İlkbahar', 'Spring'], ['Sonbahar', 'Autumn'], ['Yaz', 'Summer'], ['Kış', 'Winter'],
    ['Sakin Şehir Günü', 'Peaceful City Day'], ['Sahil Festivali! (2x)', 'Beach Festival! (2x)'],
    ['Kariyer Bonus Günü!', 'Career Bonus Day!'], ['Zirve Kristal Bolluğu!', 'Peak Crystal Rush!'],
    ['Domates', 'Tomato'], ['Organik Çilek', 'Organic Strawberry'], ['Altın Ayçiçeği', 'Golden Sunflower'],
    ['Taze Levrek', 'Fresh Sea Bass'], ['4D Altın Balık', '4D Golden Fish'], ['Izgara Balık', 'Grilled Fish'],
    ['Orman Böğürtleni', 'Wild Berry'], ['Yabani Mantar', 'Wild Mushroom'], ['Zirve Kristali', 'Summit Crystal'],
    ['Hayvan Maması', 'Pet Food'], ['Kruvasan', 'Croissant'], ['Pasta', 'Cake'],
    ['Güneşli', 'Sunny'], ['Yağmurlu', 'Rainy'], ['Fırtınalı', 'Stormy'], ['Karlı', 'Snowy']
  ];

  function tr(text) {
    if (text === null || text === undefined) return '';
    const raw = String(text);
    if (curLang === 'tr') return raw;
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    if (Object.prototype.hasOwnProperty.call(TR_TO_EN, trimmed)) {
      return raw.replace(trimmed, TR_TO_EN[trimmed]);
    }
    let out = raw;
    for (let i = 0; i < SUB_NAMES.length; i++) {
      if (out.includes(SUB_NAMES[i][0])) out = out.split(SUB_NAMES[i][0]).join(SUB_NAMES[i][1]);
    }
    for (let i = 0; i < PHRASE_REPS.length; i++) {
      if (out.includes(PHRASE_REPS[i][0])) out = out.split(PHRASE_REPS[i][0]).join(PHRASE_REPS[i][1]);
    }
    return out;
  }

  function translateSubtree(root) {
    if (!root || typeof document === 'undefined') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const parentTag = node.parentNode && node.parentNode.tagName;
      if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'INPUT') continue;
      if (!origTextMap.has(node)) {
        origTextMap.set(node, node.nodeValue);
      }
      const base = origTextMap.get(node);
      const next = curLang === 'tr' ? base : tr(base);
      if (node.nodeValue !== next) node.nodeValue = next;
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('[title]').forEach((el) => {
        if (!origAttrMap.has(el)) origAttrMap.set(el, el.getAttribute('title') || '');
        const base = origAttrMap.get(el);
        const next = curLang === 'tr' ? base : tr(base);
        if (el.getAttribute('title') !== next) el.setAttribute('title', next);
      });
    }
  }

  function applyDom() {
    if (typeof document === 'undefined') return;
    const en = curLang === 'en';
    document.documentElement.lang = curLang;
    document.title = en
      ? 'Life Marathon: Open World — 60 FPS Cozy Life Simulator'
      : 'Yaşam Maratonu: Büyük Dünya — 60 FPS Açık Dünya Yaşam Simülatörü';

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const active = btn.dataset.langBtn === curLang;
      btn.classList.toggle('gold', active);
      btn.style.opacity = active ? '1' : '0.68';
    });

    const hudCode = document.getElementById('langHudCode');
    if (hudCode) hudCode.textContent = en ? 'EN' : 'TR';

    const nameInput = document.getElementById('inputPlayerName');
    if (nameInput && (nameInput.value === 'Gezgin' || nameInput.value === 'Traveler')) {
      nameInput.value = en ? 'Traveler' : 'Gezgin';
    }

    translateSubtree(document.body);
  }

  function getLang() { return curLang; }

  function setLang(lang) {
    if (lang !== 'tr' && lang !== 'en') return;
    curLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    applyDom();
  }

  function fmtMoney(n) {
    return `${curLang === 'en' ? '$' : '₺'}${Math.floor(n).toLocaleString()}`;
  }

  YD.I18N = { getLang, setLang, tr, fmtMoney, applyDom, translateSubtree };
  YD.tr = tr;
  YD.fmtMoney = fmtMoney;
})(window.YasamDunya);
