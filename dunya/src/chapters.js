/**
 * Yaşam Maratonu — Hayat Bölümleri / Life Chapters (v11.1)
 *
 * Tekirdağ → İstanbul → Berlin → New York → Tekirdağ (Eve Dönüş) → Cennet / Cehennem
 *
 * - Same open-world engine, re-themed per chapter (district names, building signs,
 *   landmarks, bus stops, colour tint, NPC roster).
 * - NPC friendship (❤️ 0-5) is keyed by NPC name and persists across chapters.
 *   Recurring friends (Ayşe, Kuzen Mert, Ressam Defne, Balıkçı Hasan, Fatma Teyze)
 *   recognise you based on how close you were — dialogue changes with familiarity.
 * - "Vicdan" (conscience) score accumulates over a whole life and decides the ending.
 *
 * Security: no innerHTML / eval. All DOM is built with createElement + textContent.
 */
(function (YD) {
  'use strict';

  const T = (tr, en) => [tr, en];

  // 6 NPC spawn slots spread across the biomes of the shared world map
  YD.CHAPTER_SLOTS = [
    { zone: 'city',     x: 2205, y: 2035 },
    { zone: 'beach',    x: 2330, y: 2860 },
    { zone: 'forest',   x: 1020, y: 1280 },
    { zone: 'mountain', x: 2155, y: 420  },
    { zone: 'park',     x: 3720, y: 1730 },
    { zone: 'city',     x: 2740, y: 1050 }
  ];

  YD.VICDAN_HEAVEN = 30;

  const TEKIRDAG_BIOMES = {
    city:     T('🏙️ SÜLEYMANPAŞA MERKEZ', '🏙️ SÜLEYMANPAŞA DOWNTOWN'),
    beach:    T('🏖️ TEKİRDAĞ SAHİLİ', '🏖️ TEKİRDAĞ SEAFRONT'),
    sea:      T('🌊 MARMARA DENİZİ', '🌊 SEA OF MARMARA'),
    forest:   T('🌲 GANOS ORMANI', '🌲 GANOS FOREST'),
    mountain: T('⛰️ GANOS DAĞI & UÇMAKDERE', '⛰️ MT. GANOS & UÇMAKDERE'),
    park:     T('🌳 NAMIK KEMAL PARKI', '🌳 NAMIK KEMAL PARK'),
    island:   T('🏝️ MARMARA ADASI', '🏝️ MARMARA ISLAND')
  };

  const TEKIRDAG_LANDMARKS = {
    lighthouse: T('🗼 TEKİRDAĞ FENERİ (Manzara)', '🗼 TEKİRDAĞ LIGHTHOUSE (View)'),
    fountain:   T('⛲ CUMHURİYET MEYDANI ÇEŞMESİ (₺10 Dilek)', '⛲ REPUBLIC SQUARE FOUNTAIN ($10 Wish)'),
    icecream:   T('🍒 KİRAZ & DONDURMA (₺15)', '🍒 CHERRIES & ICE CREAM ($15)'),
    pier_fish:  T('🎣 TEKİRDAĞ İSKELESİ — BALIK TUT', '🎣 TEKİRDAĞ PIER — FISH'),
    summit:     T('🪨 GANOS ZİRVE KAYASI (+50 XP)', '🪨 GANOS SUMMIT ROCK (+50 XP)'),
    park_bench: T('🪑 PARK BANKI — Ördekleri Besle', '🪑 PARK BENCH — Feed the Ducks')
  };

  YD.CHAPTERS = [
    // ───────────────────────── 1 · TEKİRDAĞ ─────────────────────────
    {
      id: 'tekirdag', icon: '🍒', age: 18, tint: null,
      name: T('TEKİRDAĞ', 'TEKİRDAĞ'),
      title: T('Bölüm 1 · Tekirdağ: Gençlik Yılları', 'Chapter 1 · Tekirdağ: Young Years'),
      story: T(
        'Tekirdağ\'da, Marmara\'nın kıyısında büyüdün. Köfte kokusu, kiraz bahçeleri, sahilde martılar... Hayat burada başlıyor. Dostlar edin, ilk paranı kazan, sonra büyük şehre açıl!',
        'You grew up in Tekirdağ on the Marmara coast — köfte smoke, cherry orchards, gulls over the shore. Life starts here. Make friends, earn your first money, then head for the big city!'
      ),
      next: T('🚌 İSTANBUL\'A TAŞIN', '🚌 MOVE TO ISTANBUL'),
      biomes: TEKIRDAG_BIOMES,
      labels: {
        cafe: T('🍢 KÖFTECİ & KAHVE', '🍢 KÖFTE HOUSE & CAFE'),
        hospital: T('🏥 DEVLET HASTANESİ', '🏥 STATE HOSPITAL'),
        shop: T('🛍️ ÇARŞI & GALERİ', '🛍️ BAZAAR & GALLERY'),
        home: T('🏠 BABA EVİ', '🏠 FAMILY HOME'),
        office: T('🏢 LİMAN OFİSİ', '🏢 PORT OFFICE'),
        uni: T('🎓 NKÜ KAMPÜSÜ', '🎓 NKU CAMPUS'),
        lodge: T('🏔️ UÇMAKDERE KULÜBESİ', '🏔️ UÇMAKDERE LODGE'),
        cabin: T('🪵 BAĞ EVİ', '🪵 VINEYARD HUT'),
        ...TEKIRDAG_LANDMARKS
      },
      bus: [T('Süleymanpaşa', 'Süleymanpaşa'), T('Uçmakdere', 'Uçmakdere'), T('Ganos Ormanı', 'Ganos Forest'), T('Sahil', 'Seafront')],
      goals: [
        { type: 'friends', n: 3, min: 2 },
        { type: 'quest', key: 'q_fish', n: 2, t: T('Marmara\'da balık tut', 'Catch fish in the Marmara') },
        { type: 'quest', key: 'q_work', n: 1, t: T('İlk işinde vardiya çalış', 'Work a shift at your first job') },
        { type: 'money', n: 500 }
      ],
      npcs: [
        { name: 'Köfteci Rıza Usta', en: 'Rıza, Köfte Master', slot: 0, color: '#b91c1c',
          memory: T('Köftelerimin kokusunu hatırlıyor musun?', 'Remember the smell of my köfte?'),
          lines: {
            s: T('Hoş geldin evlat! Tekirdağ köftesinin sırrı sabırdır. Bir porsiyon ister misin?', 'Welcome, kid! The secret of Tekirdağ köfte is patience. Want a plate?'),
            a: T('Yine mi geldin? Hah! Köftenin tadını alan bir daha bırakamaz.', 'Back again? Ha! Once you taste it, you can\'t quit.'),
            f: T('Sen artık bu dükkânın evladısın. Oğlum Emre de seni çok seviyor!', 'You\'re family here now. My son Emre adores you!'),
            b: T('Bir gün gidersen, Tekirdağ\'ı ve bu ihtiyarı unutma, olur mu?', 'If you ever leave, don\'t forget Tekirdağ — or this old man, okay?')
          } },
        { name: 'Balıkçı Hasan', en: 'Fisher Hasan', slot: 1, color: '#0284c7',
          memory: T('İskelede ilk balığını birlikte tutmuştuk!', 'We caught your first fish together on the pier!'),
          lines: {
            s: T('İskelede oltayı at, ibre ALTIN bölgeye gelince [E] bas!', 'Cast from the pier — press [E] when the needle hits GOLD!'),
            a: T('Marmara cömerttir ama sabır ister. Lüfer mevsimi yaklaşıyor!', 'The Marmara is generous but wants patience. Bluefish season is coming!'),
            f: T('Sen artık usta bir balıkçısın! Kayığımı ödünç alabilirsin.', 'You\'re a real fisher now! You can borrow my boat anytime.'),
            b: T('Denizin tuzu kanına karıştı evlat. Nereye gidersen git, Marmara seni çağırır.', 'The sea is in your blood now. Wherever you go, the Marmara will call you back.')
          } },
        { name: 'Fatma Teyze', en: 'Auntie Fatma', slot: 2, color: '#a16207',
          memory: T('Bağımdaki üzümleri birlikte toplardık.', 'We used to pick grapes in my vineyard together.'),
          lines: {
            s: T('Aa, komşunun çocuğu! Bağdan yeni geldim, al bir salkım üzüm.', 'Oh, the neighbour\'s kid! Just back from the vineyard — have some grapes.'),
            a: T('Annene selam söyle! Kiraz reçeli yaptım, uğra da vereyim.', 'Say hi to your mum! I made cherry jam — drop by for a jar.'),
            f: T('Sen benim torunum gibisin. Gel, sana börek açayım!', 'You\'re like a grandchild to me. Come, I\'ll make you börek!'),
            b: T('Nereye gidersen git, bu kapı sana hep açık yavrum.', 'Wherever you go, my door is always open, dear.')
          } },
        { name: 'Kuzen Mert', en: 'Cousin Mert', slot: 3, color: '#2563eb',
          memory: T('Uçmakdere\'de yamaç paraşütüyle uçmuştuk!', 'We went paragliding together at Uçmakdere!'),
          lines: {
            s: T('Ooo kuzen! Uçmakdere\'den aşağı paraşütle atlamaya var mısın?', 'Hey cousin! Up for paragliding down from Uçmakdere?'),
            a: T('Babam Almanya\'ya gidip çalışmamı istiyor... Sen ne dersin?', 'Dad wants me to go work in Germany... what do you think?'),
            f: T('Sen benim kuzenden öte kardeşimsin. Ne olursa olsun yanındayım!', 'You\'re more than a cousin — you\'re my brother. I\'ve got your back!'),
            b: T('Söz ver: dünyanın neresinde olursak olalım, birbirimizi bulacağız!', 'Promise: wherever we end up in the world, we\'ll find each other!')
          } },
        { name: 'Ayşe', en: 'Ayşe', slot: 4, color: '#db2777',
          memory: T('Namık Kemal Parkı\'ndaki bankımızı hatırlıyor musun?', 'Remember our bench in Namık Kemal Park?'),
          lines: {
            s: T('Selam! Ben Ayşe. Parkta ördekleri beslemeye gelir misin?', 'Hi! I\'m Ayşe. Want to come feed the ducks in the park?'),
            a: T('İstanbul\'da okumak istiyorum. Hayallerim bu şehre sığmıyor!', 'I want to study in Istanbul. My dreams don\'t fit in this town!'),
            f: T('Seninle konuşmak çok iyi geliyor. Sen de büyük şehre gelmelisin!', 'Talking to you feels so good. You should come to the big city too!'),
            b: T('Bu banka adımızı kazıyalım mı? Ne olursa olsun unutmayalım diye...', 'Shall we carve our names on this bench? So we never forget...')
          } },
        { name: 'Nuri Hoca', en: 'Teacher Nuri', slot: 5, color: '#4b5563',
          memory: T('Sana \'hayat bir maratondur\' demiştim, hatırladın mı?', 'I told you \'life is a marathon\', remember?'),
          lines: {
            s: T('Bak evlat, hayat bir maratondur. Önemli olan yolda kimlerle yürüdüğün.', 'Listen, kid: life is a marathon. What matters is who walks beside you.'),
            a: T('Okumayı bırakma. Kitap, insanı dünyaya taşır.', 'Never stop reading. Books carry you across the world.'),
            f: T('Seninle gurur duyuyorum. Gittiğin her yerde iyi bir insan ol.', 'I\'m proud of you. Wherever you go, be a good person.'),
            b: T('Öğrencilerimin en vefalısı sensin. Beni unutma, ben seni unutmam.', 'You\'re my most loyal student. Don\'t forget me — I won\'t forget you.')
          } }
      ]
    },

    // ───────────────────────── 2 · İSTANBUL ─────────────────────────
    {
      id: 'istanbul', icon: '🌉', age: 24, tint: 'rgba(251, 191, 36, 0.05)',
      name: T('İSTANBUL', 'ISTANBUL'),
      title: T('Bölüm 2 · İstanbul: Büyük Şehir', 'Chapter 2 · Istanbul: The Big City'),
      story: T(
        'Valizini toplayıp İstanbul\'a geldin. Vapur düdükleri, simit ve çay, Galata\'nın ışıkları... Kalabalık ama fırsatlarla dolu. Kariyerini kur, yeni dostlar edin — eski dostlarını da unutma!',
        'You packed your bags for Istanbul. Ferry horns, simit and tea, the lights of Galata... Crowded, but full of chances. Build your career, make new friends — and don\'t forget the old ones!'
      ),
      next: T('✈️ BERLİN\'E UÇ', '✈️ FLY TO BERLIN'),
      biomes: {
        city: T('🏙️ BEYOĞLU & GALATA', '🏙️ BEYOĞLU & GALATA'),
        beach: T('🏖️ KARAKÖY RIHTIMI', '🏖️ KARAKÖY QUAY'),
        sea: T('🌊 İSTANBUL BOĞAZI', '🌊 THE BOSPHORUS'),
        forest: T('🌲 BELGRAD ORMANI', '🌲 BELGRAD FOREST'),
        mountain: T('⛰️ ÇAMLICA TEPESİ', '⛰️ ÇAMLICA HILL'),
        park: T('🌳 EMİRGAN KORUSU', '🌳 EMİRGAN GROVE'),
        island: T('🏝️ BÜYÜKADA', '🏝️ BÜYÜKADA ISLAND')
      },
      labels: {
        cafe: T('🥯 SİMİTÇİ & ÇAY OCAĞI', '🥯 SIMIT & TEA HOUSE'),
        hospital: T('🏥 ŞİŞLİ HASTANESİ', '🏥 ŞİŞLİ HOSPITAL'),
        shop: T('🛍️ KAPALIÇARŞI', '🛍️ GRAND BAZAAR'),
        home: T('🏠 KİRALIK DAİRE', '🏠 RENTED FLAT'),
        office: T('🏢 LEVENT PLAZA', '🏢 LEVENT TOWER'),
        uni: T('🎓 BOĞAZİÇİ KAMPÜSÜ', '🎓 BOSPHORUS CAMPUS'),
        lodge: T('🏔️ ÇAMLICA KÖŞKÜ', '🏔️ ÇAMLICA PAVILION'),
        cabin: T('🪵 BELGRAD KÖY EVİ', '🪵 BELGRAD COTTAGE'),
        lighthouse: T('🗼 KIZ KULESİ (Manzara)', '🗼 MAIDEN\'S TOWER (View)'),
        fountain: T('⛲ ALMAN ÇEŞMESİ (₺10 Dilek)', '⛲ GERMAN FOUNTAIN ($10 Wish)'),
        icecream: T('🍦 MARAŞ DONDURMACISI (₺15)', '🍦 MARAŞ ICE CREAM ($15)'),
        pier_fish: T('🎣 GALATA KÖPRÜSÜ — BALIK TUT', '🎣 GALATA BRIDGE — FISH'),
        summit: T('🪨 ÇAMLICA ZİRVE KAYASI (+50 XP)', '🪨 ÇAMLICA SUMMIT ROCK (+50 XP)')
      },
      bus: [T('Taksim', 'Taksim'), T('Çamlıca', 'Çamlıca'), T('Belgrad', 'Belgrad'), T('Karaköy', 'Karaköy')],
      goals: [
        { type: 'friends', n: 3, min: 2 },
        { type: 'quest', key: 'q_delivery', n: 2, t: T('Kurye olarak şehri tanı', 'Learn the city as a courier') },
        { type: 'quest', key: 'q_uni', n: 1, t: T('Üniversitede sınav geç / diploma al', 'Pass a university exam') },
        { type: 'quest', key: 'q_photo', n: 3, t: T('İstanbul manzaraları fotoğrafla', 'Photograph Istanbul views') },
        { type: 'money', n: 1200 }
      ],
      npcs: [
        { name: 'Simitçi Kemal', en: 'Kemal the Simit Seller', slot: 0, color: '#d97706',
          memory: T('Her sabah sana sıcak simit ayırırdım!', 'I saved you a warm simit every morning!'),
          lines: {
            s: T('Taze simit, sıcak çay! İlk günün mü İstanbul\'da? Belli oluyor!', 'Fresh simit, hot tea! First day in Istanbul? It shows!'),
            a: T('Bu şehir insanı yutar, ama simit karnını doyurur. Al, bugün benden.', 'This city swallows people, but simit keeps you going. On the house today.'),
            f: T('Sen artık müdavimsin! Çayını demli koydum, otur biraz.', 'You\'re a regular now! Your tea\'s brewed strong — sit a while.'),
            b: T('İstanbul\'da kardeşin yoksa simitçin vardır. O da benim!', 'If you have no brother in Istanbul, you have your simit guy. That\'s me!')
          } },
        { name: 'Kaptan Yılmaz', en: 'Captain Yılmaz', slot: 1, color: '#0369a1',
          memory: T('Vapurumda kaç kez Boğaz\'ı geçtin!', 'You crossed the Bosphorus on my ferry so many times!'),
          lines: {
            s: T('Vapur kalkıyor! Martılara simit atmayı unutma, şanstır!', 'The ferry\'s leaving! Toss the gulls some simit — it\'s good luck!'),
            a: T('Otuz yıldır bu Boğaz\'dayım. Her gün başka bir mavi.', 'Thirty years on this strait. A different blue every day.'),
            f: T('Gel kaptan köşküne, sana Boğaz\'ı bir de buradan göstereyim.', 'Come up to the bridge — let me show you the Bosphorus from here.'),
            b: T('Sen bu vapurun onursal mürettebatısın artık!', 'You\'re honorary crew on this ferry now!')
          } },
        { name: 'Bisikletçi Can', en: 'Can the Cyclist', slot: 2, color: '#16a34a',
          memory: T('Belgrad Ormanı\'nda birlikte pedal çevirmiştik!', 'We cycled through Belgrad Forest together!'),
          lines: {
            s: T('Belgrad Ormanı İstanbul\'un nefes aldığı yer. Bisiklete biner misin?', 'Belgrad Forest is where Istanbul breathes. Do you ride?'),
            a: T('Trafikten kaçmanın tek yolu pedal! Hafta sonu tur atalım mı?', 'Pedals are the only escape from traffic! Ride this weekend?'),
            f: T('Seninle tur atmak terapiden iyi geliyor dostum.', 'Riding with you beats therapy, buddy.'),
            b: T('Bu şehirdeki en iyi arkadaşım sensin, biliyor musun?', 'You\'re my best friend in this city, you know that?')
          } },
        { name: 'Ressam Defne', en: 'Defne the Painter', slot: 3, color: '#7c3aed',
          memory: T('Çamlıca\'da resmime ilk bakan sendin.', 'You were the first to look at my painting on Çamlıca.'),
          lines: {
            s: T('Şşş... Işık tam şimdi mükemmel. Boğaz\'ı boyuyorum.', 'Shh... the light is perfect right now. I\'m painting the Bosphorus.'),
            a: T('Resimlerimi kimse almıyor ama vazgeçmeyeceğim!', 'Nobody buys my paintings yet, but I won\'t give up!'),
            f: T('Bir gün New York\'ta sergi açacağım. İlk davetiye senin!', 'One day I\'ll exhibit in New York. First invitation is yours!'),
            b: T('Bu tabloyu sana yaptım: Çamlıca\'dan iki dost ve İstanbul.', 'I painted this for you: two friends on Çamlıca, and Istanbul.')
          } },
        { name: 'Ayşe', en: 'Ayşe', slot: 4, color: '#db2777',
          memory: T('İstanbul\'da Emirgan\'da lale zamanı buluşurduk.', 'We used to meet at Emirgan in tulip season.'),
          reunion: {
            known: T('Sen de mi İstanbul\'dasın?! Tekirdağ\'dan beri seni çok özledim, gel bir çay içelim!', 'You\'re in Istanbul too?! I missed you so much since Tekirdağ — let\'s have tea!'),
            vague: T('Yüzün tanıdık... Tekirdağ? Ah, Namık Kemal Parkı! Hatırladım!', 'Your face looks familiar... Tekirdağ? Oh, Namık Kemal Park! I remember!'),
            none: T('Merhaba... Tekirdağlıymışsın, ben de! Ama hiç tanışmamıştık sanırım.', 'Hi... you\'re from Tekirdağ? Me too! I don\'t think we ever met.')
          },
          lines: {
            s: T('Emirgan\'da laleler açtı. İstanbul bazen insanı yalnız hissettiriyor.', 'The tulips are out in Emirgan. Istanbul can feel so lonely sometimes.'),
            a: T('Mimar oldum! İlk projem bir kütüphane. Ya sen?', 'I became an architect! My first project is a library. What about you?'),
            f: T('İyi ki bu koca şehirde yine karşılaştık.', 'I\'m so glad we found each other again in this huge city.'),
            b: T('Nereye gidersen git, kalbimin bir köşesi hep seninle.', 'Wherever you go, a corner of my heart goes with you.')
          } },
        { name: 'Selim Bey', en: 'Mr. Selim', slot: 5, color: '#1e293b',
          memory: T('Sana ilk büyük şansı ben vermiştim, değil mi?', 'I gave you your first big break, didn\'t I?'),
          lines: {
            s: T('Plazada iş arıyorsan çalışkan ol. İstanbul tembeli affetmez.', 'Looking for work at the tower? Work hard. Istanbul doesn\'t forgive the lazy.'),
            a: T('Raporların iyi. Böyle devam edersen terfi kapıda.', 'Your reports are good. Keep it up and a promotion is near.'),
            f: T('Berlin şubesine güvendiğim birini yollamam lazım... Aklımda sen varsın.', 'I need someone I trust at the Berlin branch... I\'m thinking of you.'),
            b: T('Patron-çalışan değil, artık dostuz. Yolun açık olsun!', 'We\'re not boss and employee anymore — we\'re friends. Good luck out there!')
          } }
      ]
    },

    // ───────────────────────── 3 · BERLİN ─────────────────────────
    {
      id: 'berlin', icon: '🥨', age: 32, tint: 'rgba(148, 163, 184, 0.09)',
      name: T('BERLİN', 'BERLIN'),
      title: T('Bölüm 3 · Berlin: Gurbet', 'Chapter 3 · Berlin: Far From Home'),
      story: T(
        'Bir iş teklifiyle Almanya\'ya, Berlin\'e taşındın. Kreuzberg\'de Türkçe tabelalar, döner kokusu ve sıla hasreti... Gurbette tutunmak için çalış, dayanışmayı unutma.',
        'A job offer brought you to Berlin. Turkish signs in Kreuzberg, the smell of döner, and homesickness... Work hard to make it abroad — and stick together with others.'
      ),
      next: T('✈️ NEW YORK\'A UÇ', '✈️ FLY TO NEW YORK'),
      biomes: {
        city: T('🏙️ KREUZBERG', '🏙️ KREUZBERG'),
        beach: T('🏖️ SPREE KIYISI', '🏖️ SPREE RIVERBANK'),
        sea: T('🌊 WANNSEE GÖLÜ', '🌊 LAKE WANNSEE'),
        forest: T('🌲 GRUNEWALD ORMANI', '🌲 GRUNEWALD FOREST'),
        mountain: T('⛰️ TEUFELSBERG TEPESİ', '⛰️ TEUFELSBERG HILL'),
        park: T('🌳 TIERGARTEN', '🌳 TIERGARTEN'),
        island: T('🏝️ TAVUSKUŞU ADASI', '🏝️ PEACOCK ISLAND')
      },
      labels: {
        cafe: T('🥙 DÖNERCİ & KAFE', '🥙 DÖNER & CAFE'),
        hospital: T('🏥 CHARITÉ HASTANESİ', '🏥 CHARITÉ HOSPITAL'),
        shop: T('🛍️ KOTTI PAZARI', '🛍️ KOTTI MARKET'),
        home: T('🏠 KREUZBERG DAİRESİ', '🏠 KREUZBERG FLAT'),
        office: T('🏢 FABRİKA & OFİS', '🏢 FACTORY & OFFICE'),
        uni: T('🎓 HUMBOLDT ÜNİV.', '🎓 HUMBOLDT UNIV.'),
        lodge: T('🏔️ TEUFELSBERG KULESİ', '🏔️ TEUFELSBERG TOWER'),
        cabin: T('🪵 HOBİ BAHÇESİ', '🪵 ALLOTMENT HUT'),
        lighthouse: T('🧱 BERLİN DUVARI KALINTISI (Manzara)', '🧱 BERLIN WALL REMAINS (View)'),
        fountain: T('⛲ NEPTUN ÇEŞMESİ (₺10 Dilek)', '⛲ NEPTUNE FOUNTAIN ($10 Wish)'),
        icecream: T('🍦 SPREE DONDURMACISI (₺15)', '🍦 SPREE ICE CREAM ($15)'),
        pier_fish: T('🎣 SPREE İSKELESİ — BALIK TUT', '🎣 SPREE PIER — FISH'),
        summit: T('🪨 TEUFELSBERG KAYASI (+50 XP)', '🪨 TEUFELSBERG ROCK (+50 XP)')
      },
      bus: [T('Kottbusser Tor', 'Kottbusser Tor'), T('Teufelsberg', 'Teufelsberg'), T('Grunewald', 'Grunewald'), T('Spree', 'Spree')],
      goals: [
        { type: 'friends', n: 3, min: 2 },
        { type: 'quest', key: 'q_work', n: 3, t: T('Gurbette vardiya çalış', 'Work shifts abroad') },
        { type: 'quest', key: 'q_cook', n: 2, t: T('Sıla hasretine ev yemeği pişir', 'Cook a taste of home') },
        { type: 'money', n: 2000 }
      ],
      npcs: [
        { name: 'Dönerci Hüseyin Amca', en: 'Uncle Hüseyin, Döner Chef', slot: 0, color: '#c2410c',
          memory: T('Kreuzberg\'de dükkânımda sana hep fazladan soğan koyardım!', 'In Kreuzberg I always gave you extra onions!'),
          lines: {
            s: T('Hoş geldin hemşehrim! 1975\'te geldim buraya, döneri Berlin\'e biz öğrettik!', 'Welcome, fellow Turk! I came here in 1975 — we taught Berlin döner!'),
            a: T('Gurbet zor evlat. Ama birbirimize tutunursak kolaylaşır.', 'Living abroad is hard, kid. Holding on to each other makes it easier.'),
            f: T('Sen benim burada oğlum gibisin. Bayramda sofraya bekliyorum!', 'You\'re like a son to me here. Join our table for the holiday!'),
            b: T('Memlekete dönersen benim için Marmara\'ya bir selam ver.', 'If you go back home, say hello to the Marmara for me.')
          } },
        { name: 'Anna', en: 'Anna', slot: 1, color: '#e11d48',
          memory: T('Spree kıyısında bana Türkçe öğretmiştin!', 'You taught me Turkish on the banks of the Spree!'),
          lines: {
            s: T('Hallo! Yeni komşu sen misin? Türkçe biraz biliyorum: \'Merhaba!\'', 'Hallo! Are you the new neighbour? I know a little Turkish: \'Merhaba!\''),
            a: T('Bana Türk kahvesi yapmayı öğretir misin? Kreuzberg\'de herkes seviyor.', 'Will you teach me Turkish coffee? Everyone in Kreuzberg loves it.'),
            f: T('\'Teşekkür ederim\' doğru mu? Seninle burası ev gibi.', '\'Teşekkür ederim\' — did I say it right? With you, this place feels like home.'),
            b: T('Sen benim en iyi arkadaşımsın. Freundschaft für immer!', 'You\'re my best friend. Freundschaft für immer — friends forever!')
          } },
        { name: 'Herr Schmidt', en: 'Herr Schmidt', slot: 2, color: '#57534e',
          memory: T('Kirayı hep zamanında öderdin. Saygı duyardım.', 'You always paid rent on time. I respected that.'),
          lines: {
            s: T('Ev sahibinizim. Kurallar basit: sessizlik saat 22\'den sonra. Pünktlich!', 'I\'m your landlord. Rules are simple: quiet after 10pm. Pünktlich!'),
            a: T('Hmm. Çöpleri doğru ayırmışsınız. Gut.', 'Hmm. You separated the recycling correctly. Gut.'),
            f: T('Ormanda yürüyüşe çıkıyorum. İsterseniz... siz de gelin.', 'I\'m going for a walk in the forest. If you like... you may come.'),
            b: T('Yalnız yaşlı bir adamın tek dostu oldunuz. Danke.', 'You became the only friend of a lonely old man. Danke.')
          } },
        { name: 'Kuzen Mert', en: 'Cousin Mert', slot: 3, color: '#2563eb',
          memory: T('Berlin\'de Teufelsberg\'de birlikte sıla hasreti çekmiştik.', 'We were homesick together on Teufelsberg in Berlin.'),
          reunion: {
            known: T('Kuzeeen! Söz vermiştik, dünyanın neresinde olursak bulacaktık! Gel sana Kreuzberg\'i gezdireyim!', 'Cousiiin! We promised we\'d find each other anywhere in the world! Let me show you Kreuzberg!'),
            vague: T('Bir dakika... Tekirdağ? Mert ben, kuzenin! Ne kadar değişmişsin!', 'Wait a second... Tekirdağ? It\'s Mert, your cousin! You\'ve changed so much!'),
            none: T('Merhaba hemşehrim. Akraba mıyız? Annem bahsederdi ama hiç tanışmadık.', 'Hello, fellow Turk. Are we related? My mum mentioned you, but we never met.')
          },
          lines: {
            s: T('Berlin soğuk ama insanlar ısınınca sıcak oluyor. Fabrikada çalışıyorum.', 'Berlin is cold, but people warm up eventually. I work at the factory.'),
            a: T('Uçmakdere\'yi, köfteyi, denizi özlüyorum kuzen...', 'I miss Uçmakdere, köfte, the sea, cousin...'),
            f: T('Gurbette akraba olmak başka. İyi ki buradasın.', 'Family means even more abroad. I\'m glad you\'re here.'),
            b: T('Yaşlanınca ikimiz de Tekirdağ\'a döneceğiz, söz mü?', 'When we\'re old, we\'ll both go back to Tekirdağ — deal?')
          } },
        { name: 'Zeynep Abla', en: 'Sister Zeynep', slot: 4, color: '#9333ea',
          memory: T('Tiergarten\'de piknikte çay demlerdik.', 'We brewed tea at picnics in the Tiergarten.'),
          lines: {
            s: T('Yeni mi geldin? Hafta sonu Tiergarten\'de Türk pikniği var, gel!', 'New here? There\'s a Turkish picnic in the Tiergarten this weekend — come!'),
            a: T('Burada çocuklara Türkçe dersi veriyorum. Dilimizi unutmasınlar.', 'I teach kids Turkish here, so they don\'t forget our language.'),
            f: T('Sen yardım edince dernek çiçek açtı. Allah razı olsun!', 'Since you started helping, our community centre is thriving. Bless you!'),
            b: T('Gurbette ailemiz biziz. Sen de bu ailenin parçasısın.', 'Abroad, we are each other\'s family. You\'re part of ours.')
          } },
        { name: 'Ustabaşı Klaus', en: 'Foreman Klaus', slot: 5, color: '#475569',
          memory: T('Fabrikada en çalışkan işçim sendin!', 'You were the hardest worker at my factory!'),
          lines: {
            s: T('Fabrikada iş var ama ağır. Dayanır mısın?', 'There\'s work at the factory, but it\'s tough. Can you handle it?'),
            a: T('Babam da Türklerle çalıştı. Çok şey öğrendim onlardan.', 'My father worked with Turks too. I learned a lot from them.'),
            f: T('Sana bir fırsat var: New York\'taki ortağımız birini arıyor.', 'There\'s an opportunity: our partner in New York needs someone.'),
            b: T('Sen sadece iyi bir işçi değil, iyi bir insansın.', 'You\'re not just a good worker — you\'re a good person.')
          } }
      ]
    },

    // ───────────────────────── 4 · NEW YORK ─────────────────────────
    {
      id: 'newyork', icon: '🗽', age: 41, tint: 'rgba(59, 130, 246, 0.06)',
      name: T('NEW YORK', 'NEW YORK'),
      title: T('Bölüm 4 · New York: Hayaller Şehri', 'Chapter 4 · New York: City of Dreams'),
      story: T(
        'Kariyerin seni okyanusun öte yanına, New York\'a taşıdı. Gökdelenler, sarı taksiler ve hiç uyumayan sokaklar... Başarının zirvesindesin ama kalbin hâlâ Marmara kıyısında.',
        'Your career carried you across the ocean to New York. Skyscrapers, yellow cabs, streets that never sleep... You\'re at the top, but your heart is still on the Marmara shore.'
      ),
      next: T('✈️ TEKİRDAĞ\'A DÖN', '✈️ RETURN TO TEKİRDAĞ'),
      biomes: {
        city: T('🏙️ MANHATTAN', '🏙️ MANHATTAN'),
        beach: T('🏖️ CONEY ISLAND', '🏖️ CONEY ISLAND'),
        sea: T('🌊 ATLANTİK OKYANUSU', '🌊 ATLANTIC OCEAN'),
        forest: T('🌲 HUDSON VADİSİ', '🌲 HUDSON VALLEY'),
        mountain: T('⛰️ BEAR MOUNTAIN', '⛰️ BEAR MOUNTAIN'),
        park: T('🌳 CENTRAL PARK', '🌳 CENTRAL PARK'),
        island: T('🏝️ LIBERTY ADASI', '🏝️ LIBERTY ISLAND')
      },
      labels: {
        cafe: T('🥯 BAGEL & KAHVE', '🥯 BAGELS & COFFEE'),
        hospital: T('🏥 MOUNT SINAI', '🏥 MOUNT SINAI'),
        shop: T('🛍️ 5. CADDE', '🛍️ FIFTH AVENUE'),
        home: T('🏠 BROOKLYN DAİRESİ', '🏠 BROOKLYN APARTMENT'),
        office: T('🏢 WALL STREET', '🏢 WALL STREET'),
        uni: T('🎓 COLUMBIA ÜNİV.', '🎓 COLUMBIA UNIV.'),
        lodge: T('🏔️ BEAR MT. KULÜBESİ', '🏔️ BEAR MT. LODGE'),
        cabin: T('🪵 HUDSON KULÜBESİ', '🪵 HUDSON CABIN'),
        lighthouse: T('🗽 ÖZGÜRLÜK HEYKELİ MANZARASI', '🗽 STATUE OF LIBERTY VIEW'),
        fountain: T('⛲ BETHESDA ÇEŞMESİ (₺10 Dilek)', '⛲ BETHESDA FOUNTAIN ($10 Wish)'),
        icecream: T('🌭 SOSİSLİ & DONDURMA (₺15)', '🌭 HOT DOGS & ICE CREAM ($15)'),
        pier_fish: T('🎣 BROOKLYN İSKELESİ — BALIK TUT', '🎣 BROOKLYN PIER — FISH'),
        summit: T('🪨 BEAR MOUNTAIN KAYASI (+50 XP)', '🪨 BEAR MOUNTAIN ROCK (+50 XP)')
      },
      bus: [T('Times Square', 'Times Square'), T('Bear Mountain', 'Bear Mountain'), T('Hudson', 'Hudson'), T('Coney Island', 'Coney Island')],
      goals: [
        { type: 'friends', n: 3, min: 2 },
        { type: 'quest', key: 'q_photo', n: 3, t: T('New York\'u fotoğrafla', 'Photograph New York') },
        { type: 'quest', key: 'q_delivery', n: 1, t: T('Şehirde ekspres teslimat yap', 'Make an express delivery') },
        { type: 'money', n: 3000 }
      ],
      npcs: [
        { name: 'Kahveci Jessica', en: 'Jessica the Barista', slot: 0, color: '#f472b6',
          memory: T('Her sabah kahveni adınla yazardım, hem de doğru!', 'I wrote your name on your cup every morning — spelled right!'),
          lines: {
            s: T('Hi! Adın ne? ...Türkçe mi? Vay, nasıl yazılıyor?', 'Hi! What\'s your name? ...Turkish? Wow, how do I spell it?'),
            a: T('Senin usual\'ını hazırladım: büyük, sade. Doğru mu?', 'I made your usual: large, black. Right?'),
            f: T('Bana Türk kahvesi falı bakar mısın? Çok merak ediyorum!', 'Can you read my Turkish coffee fortune? I\'m so curious!'),
            b: T('Sen bu şehirdeki en sevdiğim müşterisin — yok, arkadaşımsın!', 'You\'re my favourite customer in this city — no, my friend!')
          } },
        { name: 'Taksici Ahmet', en: 'Ahmet the Cab Driver', slot: 1, color: '#eab308',
          memory: T('Sarı taksimde Türkçe şarkılar söylerdik!', 'We sang Turkish songs in my yellow cab!'),
          lines: {
            s: T('Hey! Türk müsün? 20 yıldır New York\'ta taksi sürüyorum, Rizeliyim!', 'Hey! You Turkish? Twenty years driving a cab in New York — I\'m from Rize!'),
            a: T('Bu şehir para kazandırır ama çay gibi demlenmez.', 'This city makes you money, but it never brews like tea.'),
            f: T('Bindiğinde taksimetreyi açmıyorum, hemşehrisin sen!', 'I don\'t run the meter for you — you\'re one of us!'),
            b: T('Bir gün ikimiz de memlekete döneriz, Karadeniz\'den Marmara\'ya selam!', 'One day we\'ll both go home — greetings from the Black Sea to the Marmara!')
          } },
        { name: 'Kampçı Jake', en: 'Jake the Camper', slot: 2, color: '#65a30d',
          memory: T('Hudson\'da kamp ateşinde marshmallow yakmıştık!', 'We burned marshmallows at a campfire on the Hudson!'),
          lines: {
            s: T('Şehirden kaçtın mı? Hudson Vadisi en iyi ilaç.', 'Escaping the city? The Hudson Valley is the best medicine.'),
            a: T('Kamp ateşi, yıldızlar ve sessizlik. Wall Street\'ten iyidir, değil mi?', 'Campfire, stars and silence. Beats Wall Street, right?'),
            f: T('Bir dahaki kampa sen de gel, çadırda yer var!', 'Join the next camping trip — there\'s room in the tent!'),
            b: T('Dostum, sen gerçek bir doğa insanısın.', 'Buddy, you\'re a true outdoors person.')
          } },
        { name: 'Ressam Defne', en: 'Defne the Painter', slot: 3, color: '#7c3aed',
          memory: T('New York\'taki ilk sergime gelmiştin!', 'You came to my first exhibition in New York!'),
          reunion: {
            known: T('Sen! Çamlıca\'da resmime ilk bakan kişi! Söz verdiğim gibi: New York sergimin ilk davetiyesi senin!', 'You! The first person who looked at my painting on Çamlıca! As promised: the first invitation to my New York show is yours!'),
            vague: T('Seni... İstanbul\'dan mı tanıyorum? Çamlıca\'da resim yaparken konuşmuştuk galiba!', 'Do I know you... from Istanbul? I think we talked while I painted on Çamlıca!'),
            none: T('Hi! Türk müsün? Ben de İstanbul\'dan geldim. Sergime beklerim.', 'Hi! You\'re Turkish? I came from Istanbul too. Come see my exhibition.')
          },
          lines: {
            s: T('Bear Mountain\'dan Manhattan\'ı çiziyorum. İstanbul\'u andırıyor biraz.', 'I\'m sketching Manhattan from Bear Mountain. It reminds me of Istanbul.'),
            a: T('Galeriler beni sonunda keşfetti! Ama kalbim hâlâ Boğaz\'da.', 'Galleries finally discovered me! But my heart is still on the Bosphorus.'),
            f: T('Sergideki en güzel tablo, İstanbul\'da sana gösterdiğim ilk eskiz.', 'The best piece in the show is the first sketch I showed you in Istanbul.'),
            b: T('Hayatım boyunca dost biriktirdim. En kıymetlisi sensin.', 'I collected friends all my life. You\'re the most precious.')
          } },
        { name: 'Müzisyen Marcus', en: 'Marcus the Musician', slot: 4, color: '#0891b2',
          memory: T('Central Park\'ta saksafonuma bağlama eşlik etmişti!', 'A bağlama joined my sax in Central Park!'),
          lines: {
            s: T('Central Park\'ın en iyi saksafoncusu! Bir istek parçan var mı?', 'Best sax player in Central Park! Got a request?'),
            a: T('Türk müziği mi? \'Üsküdar\'a Gider İken\' çalabilirim!', 'Turkish music? I can play \'Üsküdar\'a Gider İken\'!'),
            f: T('Seninle jam session yapmak harika. Ritmin iyi!', 'Jamming with you is great. You\'ve got rhythm!'),
            b: T('Bu şarkıyı sana yazdım: \'Marmara Blues\'.', 'I wrote this song for you: \'Marmara Blues\'.')
          } },
        { name: 'CEO Linda', en: 'CEO Linda', slot: 5, color: '#be185d',
          memory: T('Şirketin en zor projesini sen kurtarmıştın.', 'You saved the company\'s toughest project.'),
          lines: {
            s: T('Wall Street\'e hoş geldin. Burada zaman paradır, çabuk ol.', 'Welcome to Wall Street. Time is money here — move fast.'),
            a: T('Berlin\'deki performansını duydum. Etkileyici.', 'I heard about your performance in Berlin. Impressive.'),
            f: T('Ortaklık teklif etsem? Ama önce bir kahve, iş konuşmadan.', 'What if I offered you partnership? But first, coffee — no business talk.'),
            b: T('Bu şehirde herkes rakip. Sen gerçek bir dostsun.', 'In this city everyone is a rival. You\'re a true friend.')
          } }
      ]
    },

    // ───────────────────────── 5 · TEKİRDAĞ — EVE DÖNÜŞ ─────────────────────────
    {
      id: 'tekirdag_return', icon: '🏡', age: 67, tint: 'rgba(180, 120, 60, 0.09)',
      name: T('TEKİRDAĞ', 'TEKİRDAĞ'),
      title: T('Bölüm 5 · Tekirdağ: Eve Dönüş', 'Chapter 5 · Tekirdağ: Coming Home'),
      story: T(
        'Yıllar sonra memleketin Tekirdağ\'a döndün. Sokaklar biraz değişmiş ama martılar hâlâ aynı. Eski dostlarını bul, bahçeni ek, huzurla yaşa. Seni tanıyanlar seni hatırlayacak...',
        'Years later, you came home to Tekirdağ. The streets changed a little, but the gulls are the same. Find your old friends, plant your garden, live in peace. Those who knew you will remember...'
      ),
      next: T('🕊️ SON YOLCULUK', '🕊️ THE FINAL JOURNEY'),
      biomes: TEKIRDAG_BIOMES,
      labels: {
        cafe: T('🍢 KÖFTECİ EMRE', '🍢 EMRE\'S KÖFTE'),
        hospital: T('🏥 DEVLET HASTANESİ', '🏥 STATE HOSPITAL'),
        shop: T('🛍️ ÇARŞI & GALERİ', '🛍️ BAZAAR & GALLERY'),
        home: T('🏠 MEMLEKET EVİ', '🏠 HOMETOWN HOUSE'),
        office: T('🏢 LİMAN OFİSİ', '🏢 PORT OFFICE'),
        uni: T('🎓 NKÜ KAMPÜSÜ', '🎓 NKU CAMPUS'),
        lodge: T('🏔️ UÇMAKDERE KULÜBESİ', '🏔️ UÇMAKDERE LODGE'),
        cabin: T('🪵 BAĞ EVİ', '🪵 VINEYARD HUT'),
        ...TEKIRDAG_LANDMARKS
      },
      bus: [T('Süleymanpaşa', 'Süleymanpaşa'), T('Uçmakdere', 'Uçmakdere'), T('Ganos Ormanı', 'Ganos Forest'), T('Sahil', 'Seafront')],
      goals: [
        { type: 'reunions', n: 3 },
        { type: 'quest', key: 'q_garden', n: 2, t: T('Memleket bahçende hasat yap', 'Harvest your hometown garden') },
        { type: 'quest', key: 'q_animals', n: 2, t: T('Sokak hayvanlarını sev / besle', 'Pet or feed the street animals') },
        { type: 'quest', key: 'q_fish', n: 1, t: T('Marmara\'da son bir balık tut', 'Catch one last fish in the Marmara') }
      ],
      npcs: [
        { name: 'Köfteci Emre', en: 'Emre the Köfte Maker', slot: 0, color: '#b91c1c', knowsVia: 'Köfteci Rıza Usta',
          memory: T('Babamın tarifiyle sana köfte yapmıştım.', 'I made you köfte with my father\'s recipe.'),
          reunion: {
            known: T('Siz... babamın en sevdiği müşterisiniz! Rahmetli hep sizi anlatırdı. Buyurun, köfte benden!', 'You... you were my father\'s favourite customer! He always talked about you. Please — köfte\'s on me!'),
            vague: T('Babam Rıza Usta\'yı tanır mıydınız? Yüzünüz bir yerden tanıdık geliyor.', 'Did you know my father, Rıza Usta? Your face seems familiar.'),
            none: T('Hoş geldiniz amca/teyze! Dükkânı babamdan devraldım, tarif aynı.', 'Welcome! I took over the shop from my father — same recipe.')
          },
          lines: {
            s: T('Tekirdağ köftesi, babamın tarifi. Afiyet olsun!', 'Tekirdağ köfte, my father\'s recipe. Enjoy!'),
            a: T('Babam \'sabır\' derdi hep. Ben de öyle pişiriyorum.', 'Dad always said \'patience\'. That\'s how I cook it too.'),
            f: T('Sizi görünce babamı görmüş gibi oluyorum.', 'Seeing you feels like seeing my father again.'),
            b: T('Bu dükkânın kapısı size her zaman açık, babam da öyle isterdi.', 'This shop is always open for you — Dad would want that.')
          } },
        { name: 'Balıkçı Hasan', en: 'Fisher Hasan', slot: 1, color: '#0284c7',
          memory: T('Yaşlı kurtlar gibi iskelede son balıklarımızı tuttuk.', 'Like two old wolves, we caught our last fish on the pier.'),
          reunion: {
            known: T('Vay vay vay! Benim çırağım dönmüş! Demiştim sana, Marmara seni geri çağırır!', 'Well, well! My apprentice is back! I told you the Marmara would call you home!'),
            vague: T('Gözlerim pek görmüyor ama... sen o iskeledeki genç misin?', 'My eyes aren\'t what they were, but... are you that kid from the pier?'),
            none: T('Hoş geldin yabancı. Otur, Marmara\'ya birlikte bakalım.', 'Welcome, stranger. Sit — let\'s look at the Marmara together.')
          },
          lines: {
            s: T('Artık oltayı zor tutuyorum ama denize bakmak bile yetiyor.', 'I can barely hold a rod now, but just looking at the sea is enough.'),
            a: T('Lüfer eskisi gibi değil... ama dostluk hiç değişmez.', 'Bluefish aren\'t what they used to be... but friendship never changes.'),
            f: T('Gel, bir çay daha koy. Eski günleri anlatalım.', 'Come, pour another tea. Let\'s talk about the old days.'),
            b: T('Ömrüm boyunca denizi sevdim. Bir de seni, evlat.', 'All my life I loved the sea. And you too, kid.')
          } },
        { name: 'Fatma Teyze', en: 'Auntie Fatma', slot: 2, color: '#a16207',
          memory: T('Kapım sana hep açıktı, sen de hiç unutmadın.', 'My door was always open — and you never forgot.'),
          reunion: {
            known: T('Yavrum! Gözlerime inanamıyorum! Gel sarılayım, börek açtım, sanki geleceğini biliyordum!', 'My dear! I can\'t believe my eyes! Come here, let me hug you — I made börek, as if I knew you\'d come!'),
            vague: T('Sen... komşunun çocuğu musun? Ne kadar büyümüşsün, saçların ağarmış!', 'Are you... the neighbour\'s kid? Look how you\'ve grown — your hair has turned grey!'),
            none: T('Hoş geldin evladım. Yaşlandım, kimseyi pek hatırlamıyorum artık.', 'Welcome, dear. I\'m old now — I don\'t remember many faces anymore.')
          },
          lines: {
            s: T('Bağ artık torunlarda. Ben de oturup kuşlara bakıyorum.', 'The vineyard belongs to my grandkids now. I just sit and watch the birds.'),
            a: T('Kiraz reçeli yaptım yine, al bir kavanoz.', 'I made cherry jam again — take a jar.'),
            f: T('Sen gelince evin içi ısındı yavrum.', 'The house feels warmer when you visit, dear.'),
            b: T('Ömrümün son baharında seni görmek en büyük hediye.', 'Seeing you in the last spring of my life is the greatest gift.')
          } },
        { name: 'Kuzen Mert', en: 'Cousin Mert', slot: 3, color: '#2563eb',
          memory: T('Söz verdiğimiz gibi ikimiz de Tekirdağ\'a döndük.', 'As we promised, we both came home to Tekirdağ.'),
          reunion: {
            known: T('Kuzen! Söz tuttuk! Berlin\'den sonra yine Uçmakdere! Hadi bir paraşüt daha, yaşlı da olsak!', 'Cousin! We kept our promise! After Berlin, Uçmakdere again! One more paraglide, old as we are!'),
            vague: T('Sen... Mert\'in kuzeni misin? Benim! Ah hafıza işte, kusura bakma!', 'You\'re... my cousin? It\'s me! Ah, memory — forgive me!'),
            none: T('Selam hemşehrim. Ben de gurbetten döndüm. Sen kimlerdensin?', 'Hello, neighbour. I came back from abroad too. Which family are you from?')
          },
          lines: {
            s: T('Uçmakdere\'den gün batımı... Dünyayı gezdim, en güzeli burası.', 'Sunset from Uçmakdere... I\'ve seen the world; this is the most beautiful.'),
            a: T('Torunlarıma Berlin\'i anlatıyorum, gözleri parlıyor.', 'I tell my grandkids about Berlin — their eyes light up.'),
            f: T('İyi ki kuzenimsin. Hayat seninle daha güzeldi.', 'I\'m so glad you\'re my cousin. Life was better with you.'),
            b: T('Bir ömür geçti kardeşim. Ne güzel bir yolculuktu.', 'A lifetime has passed, brother. What a beautiful journey.')
          } },
        { name: 'Ayşe', en: 'Ayşe', slot: 4, color: '#db2777',
          memory: T('Banka kazıdığımız isimler hâlâ duruyor.', 'The names we carved on the bench are still there.'),
          reunion: {
            known: T('Biliyordum döneceğini! Bak, banka kazıdığımız isimler hâlâ burada...', 'I knew you\'d come back! Look — the names we carved on the bench are still here...'),
            vague: T('Sen... Tekirdağ\'dan, İstanbul\'dan... Yıllar ne çabuk geçti!', 'You... from Tekirdağ, from Istanbul... How fast the years went by!'),
            none: T('Merhaba. Parkta ördekleri besliyorum, ister misin?', 'Hello. I\'m feeding the ducks in the park — want to join?')
          },
          lines: {
            s: T('Emekli oldum, memlekete döndüm. Ördekler hâlâ burada.', 'I retired and came home. The ducks are still here.'),
            a: T('Torunuma Namık Kemal Parkı\'nı gösterdim, çok sevdi.', 'I showed my grandchild Namık Kemal Park — she loved it.'),
            f: T('Hayat bizi dünyanın dört bir yanına savurdu, ama yine buradayız.', 'Life scattered us across the world, but here we are again.'),
            b: T('Bir ömür boyu dost kalmak... En büyük servet bu.', 'Staying friends for a lifetime... that\'s the greatest wealth.')
          } },
        { name: 'Torun Elif', en: 'Little Elif', slot: 5, color: '#f59e0b',
          memory: T('Bana dünyayı anlatırdın, ben de dinlerdim.', 'You used to tell me about the world, and I listened.'),
          lines: {
            s: T('Merhaba! Sen gerçekten New York\'ta mı yaşadın? Anlat anlat!', 'Hi! Did you really live in New York? Tell me, tell me!'),
            a: T('Ben de büyüyünce İstanbul\'a gideceğim, sonra Berlin\'e!', 'When I grow up I\'ll go to Istanbul, then Berlin!'),
            f: T('Senin hikâyelerin kitaplardan güzel!', 'Your stories are better than books!'),
            b: T('Büyüyünce senin gibi iyi bir insan olacağım.', 'When I grow up, I\'ll be a good person like you.')
          } }
      ]
    },

    // ───────────────────────── 6 · ÖBÜR DÜNYA (dynamic) ─────────────────────────
    {
      id: 'afterlife', icon: '🕊️', age: 0, final: true,
      name: T('ÖBÜR DÜNYA', 'THE AFTERLIFE'),
      title: T('Son Bölüm · Öbür Dünya', 'Final Chapter · The Afterlife'),
      story: T('Uzun bir yolculuğun sonuna geldin.', 'You reached the end of a long journey.'),
      next: null,
      variants: {
        heaven: {
          name: T('CENNET', 'HEAVEN'),
          title: T('Son Bölüm · Cennet', 'Final Chapter · Heaven'),
          tint: 'rgba(255, 248, 220, 0.30)',
          story: T(
            'Vicdanın rahat. Sevdiklerin seni bekliyordu. Kevser\'in kıyısında, bir ömür boyu biriktirdiğin dostluklarla sonsuz bir bahar...',
            'Your conscience is at peace. Your loved ones were waiting. On the shores of Kawthar, an eternal spring with the friendships you gathered over a lifetime...'
          ),
          biomes: {
            city: T('☁️ NUR ŞEHRİ', '☁️ CITY OF LIGHT'), beach: T('🏖️ KEVSER SAHİLİ', '🏖️ KAWTHAR SHORE'),
            sea: T('🌊 KEVSER IRMAĞI', '🌊 RIVER OF KAWTHAR'), forest: T('🌳 TUBA AĞACI BAHÇESİ', '🌳 GARDEN OF TUBA'),
            mountain: T('⛰️ CENNET YAYLASI', '⛰️ HEAVENLY HIGHLANDS'), park: T('🌸 CENNET BAHÇESİ', '🌸 GARDEN OF EDEN'),
            island: T('🏝️ HUZUR ADASI', '🏝️ ISLE OF PEACE')
          },
          labels: { home: T('🏠 EBEDİ EV', '🏠 ETERNAL HOME'), cafe: T('☕ KEVSER KAHVESİ', '☕ KAWTHAR CAFE'), fountain: T('⛲ KEVSER PINARI (₺10 Dilek)', '⛲ SPRING OF KAWTHAR ($10 Wish)') }
        },
        hell: {
          name: T('CEHENNEM', 'HELL'),
          title: T('Son Bölüm · Cehennem', 'Final Chapter · Hell'),
          tint: 'rgba(160, 20, 20, 0.32)',
          story: T(
            'Vicdanın ağır. Yol boyunca kırdığın kalpler, unuttuğun dostlar... Burada her şey sıcak, ama en çok yakan pişmanlık.',
            'Your conscience is heavy. The hearts you broke, the friends you forgot along the way... Everything burns here, but regret burns the most.'
          ),
          biomes: {
            city: T('🔥 KÜL ŞEHRİ', '🔥 CITY OF ASH'), beach: T('🌋 LAV KIYISI', '🌋 LAVA SHORE'),
            sea: T('🔥 ATEŞ DENİZİ', '🔥 SEA OF FIRE'), forest: T('🥀 ZAKKUM ORMANI', '🥀 ZAQQUM FOREST'),
            mountain: T('🌋 KAVRULMUŞ ZİRVE', '🌋 SCORCHED PEAK'), park: T('🥀 SOLGUN BAHÇE', '🥀 WITHERED GARDEN'),
            island: T('🏝️ PİŞMANLIK ADASI', '🏝️ ISLE OF REGRET')
          },
          labels: { home: T('🏠 KÜL EV', '🏠 HOUSE OF ASH'), cafe: T('☕ ZAKKUM KAHVESİ', '☕ ZAQQUM CAFE'), fountain: T('🔥 ATEŞ ÇEŞMESİ (₺10 Dilek)', '🔥 FOUNTAIN OF FIRE ($10 Wish)') }
        }
      },
      goals: [],
      npcs: []
    }
  ];

  // ───────── Derived metadata ─────────
  const firstSeen = Object.create(null);
  YD.CHAPTERS.forEach((ch, idx) => {
    ch.npcs.forEach((n) => {
      if (!(n.name in firstSeen)) firstSeen[n.name] = idx;
      n.recurring = firstSeen[n.name] < idx || !!n.knowsVia;
    });
  });
  YD.CHAPTER_NPC_NAMES = Object.keys(firstSeen);
  YD.CHAPTER_REUNION_KEYS = [];
  YD.CHAPTERS.forEach((ch, idx) => ch.npcs.forEach((n) => { if (n.recurring) YD.CHAPTER_REUNION_KEYS.push(`${idx}:${n.name}`); }));
  YD.VICDAN_KEYS = ['friend', 'reunion', 'animal', 'help', 'charity', 'rude', 'neglect', 'self'];
  YD.CHAPTER_STAT_KEYS = ['q_fish', 'q_work', 'q_delivery', 'q_uni', 'q_photo', 'q_cook', 'q_cafe', 'q_animals', 'q_garden', 'reunions'];

  const QUEST_WORDS = {
    q_fish: T('Balık tut', 'Catch fish'), q_work: T('Vardiya çalış', 'Work shifts'),
    q_delivery: T('Kurye teslimatı yap', 'Complete deliveries'), q_uni: T('Üniversitede sınav geç', 'Pass a university exam'),
    q_photo: T('Fotoğraf çek', 'Take photos'), q_cook: T('Yemek pişir', 'Cook meals'),
    q_cafe: T('Barista vardiyası yap', 'Do barista shifts'), q_animals: T('Hayvan sev / besle', 'Pet or feed animals'),
    q_garden: T('Bahçede hasat yap', 'Harvest crops')
  };

  const VICDAN_LABELS = {
    friend: T('🤝 Dostluk', '🤝 Friendship'), reunion: T('🫂 Vefa (eski dostlar)', '🫂 Loyalty (old friends)'),
    animal: T('🐾 Hayvan sevgisi', '🐾 Kindness to animals'), help: T('📦 Yardımseverlik', '📦 Helping others'),
    charity: T('🪙 Hayır / Bağış', '🪙 Charity'), rude: T('📣 Kabalık', '📣 Rudeness'),
    neglect: T('💔 Unutulan dostlar', '💔 Forgotten friends'), self: T('😵 Kendini ihmal', '😵 Self-neglect')
  };

  const UI = {
    goalsHdr: T('🎯 BÖLÜM HEDEFLERİ', '🎯 CHAPTER GOALS'),
    friendsHdr: T('🤝 BU BÖLÜMDEKİ İNSANLAR', '🤝 PEOPLE IN THIS CHAPTER'),
    allFriendsHdr: T('🤝 HAYATINDAKİ DOSTLAR', '🤝 FRIENDS OF A LIFETIME'),
    vicdan: T('⚖️ VİCDAN', '⚖️ CONSCIENCE'),
    close: T('KAPAT [ESC]', 'CLOSE [ESC]'),
    locked: T('🔒 Hedefleri tamamla', '🔒 Complete the goals'),
    newLife: T('🔄 YENİ HAYAT', '🔄 NEW LIFE'),
    stay: T('🌍 DOLAŞMAYA DEVAM', '🌍 KEEP EXPLORING'),
    knowsYou: T('👀 Seni tanıyor!', '👀 Knows you!'),
    tiers: [T('Yabancı', 'Stranger'), T('Tanıdık', 'Acquaintance'), T('Arkadaş', 'Friend'), T('Can Dostu', 'Best Friend')],
    friendsGoal: T('Buradan {n} kişiyle dost ol (en az {h})', 'Befriend {n} locals (at least {h})'),
    moneyGoal: T('Toplam {m} birikim yap (cüzdan + banka)', 'Save {m} in total (wallet + bank)'),
    reunionGoal: T('{n} eski dostunla yeniden buluş', 'Reunite with {n} old friends'),
    complete: T('✨ Bölüm tamamlandı! Hayat Bölümleri [L] menüsünden yola çık.', '✨ Chapter complete! Open Life Chapters [L] to move on.'),
    ageLbl: T('Yaş', 'Age'),
    chapterShort: T('Bölüm', 'Ch.'),
    noFriends: T('Henüz kimseyle tanışmadın. NPC\'lere yaklaşıp [E] ile konuş!', 'You haven\'t met anyone yet. Walk up to people and press [E]!'),
    verdictHeaven: T('☁️ CENNET — Vicdanın rahat, dostların seni bekliyor.', '☁️ HEAVEN — Your conscience is at peace; your friends await.'),
    verdictHell: T('🔥 CEHENNEM — Vicdanın ağır, pişmanlık yakıyor.', '🔥 HELL — Your conscience is heavy; regret burns.'),
    threshold: T('Cennet eşiği', 'Heaven threshold'),
    alreadyTalked: T('(bugün zaten sohbet ettiniz)', '(you already talked today)')
  };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  }

  class ChapterSystem {
    constructor(game) {
      this.g = game;
      this.talkedToday = new Set();
      this.lastRudeAt = 0;
      this.completeAnnounced = false;
    }

    lang() { return (YD.I18N && YD.I18N.getLang() === 'en') ? 'en' : 'tr'; }
    L(pair) { return Array.isArray(pair) ? (this.lang() === 'en' ? pair[1] : pair[0]) : (pair || ''); }
    fmt(pair, vars) {
      let s = this.L(pair);
      for (const k of Object.keys(vars || {})) s = s.split(`{${k}}`).join(String(vars[k]));
      return s;
    }

    get idx() { return Math.max(0, Math.min(YD.CHAPTERS.length - 1, this.g.chapterIdx || 0)); }
    get ch() { return YD.CHAPTERS[this.idx]; }

    // Resolved theme (final chapter picks heaven/hell variant)
    theme() {
      const ch = this.ch;
      if (!ch.final) return ch;
      const v = ch.variants[this.g.ending === 'hell' ? 'hell' : 'heaven'];
      return { ...ch, ...v };
    }

    hearts(name) { return this.g.npcHearts[name] || 0; }
    tierIdx(h) { return h >= 5 ? 3 : h >= 3 ? 2 : h >= 1 ? 1 : 0; }
    tierName(h) { return this.L(UI.tiers[this.tierIdx(h)]); }
    displayName(npc) { return this.lang() === 'en' ? (npc.en || npc.name) : npc.name; }

    // ───────── NPC roster ─────────
    buildNpcs() {
      const ch = this.ch;
      let list = ch.npcs;
      if (ch.final) list = this.afterlifeRoster();
      return list.map((n) => {
        const slot = YD.CHAPTER_SLOTS[n.slot % YD.CHAPTER_SLOTS.length];
        return {
          ...n, zone: slot.zone, x: slot.x, y: slot.y, homeX: slot.x, homeY: slot.y,
          angle: 0, walkCycle: 0, timer: 1 + Math.random() * 3, speech: '', speechTimer: 0, lineIdx: 0,
          lines: n.lines
        };
      });
    }

    // Everyone you ever befriended, closest first (Nuri Hoca waits in the afterlife if you knew him)
    afterlifeRoster() {
      const seen = new Map();
      YD.CHAPTERS.forEach((ch) => ch.npcs.forEach((n) => { if (!seen.has(n.name)) seen.set(n.name, n); }));
      const known = [...seen.values()].filter((n) => this.hearts(n.name) >= 1)
        .sort((a, b) => this.hearts(b.name) - this.hearts(a.name)).slice(0, 6);
      return known.map((n, i) => ({ ...n, slot: i, afterlife: true }));
    }

    // ───────── Theme application ─────────
    applyTheme() {
      const g = this.g, w = g.world, th = this.theme();
      const labels = th.labels || {};
      const biomes = th.biomes || {};
      w.biomeLabels = {};
      for (const k of Object.keys(biomes)) w.biomeLabels[k] = this.L(biomes[k]);
      for (const b of w.buildings) {
        if (b.baseLabel === undefined) b.baseLabel = b.label;
        b.label = labels[b.id] ? this.L(labels[b.id]) : b.baseLabel;
      }
      const busIdx = Object.create(null);
      (YD.BUS_STOPS || []).forEach((bs, i) => {
        if (bs.baseName === undefined) bs.baseName = bs.name;
        busIdx[bs.id] = i;
        const icon = (bs.baseName.match(/^\S+/) || [''])[0];
        bs.name = th.bus && th.bus[i] ? `${icon} ${this.L(th.bus[i])}` : bs.baseName;
      });
      for (const it of w.interactables) {
        if (it.baseLabel === undefined) it.baseLabel = it.label;
        if (it.kind === 'bus' && it.id in busIdx) {
          const bs = YD.BUS_STOPS[busIdx[it.id]];
          it.label = this.lang() === 'en' ? `🚏 BUS STOP (${bs.name})` : `🚏 OTOBÜS DURAĞI (${bs.name})`;
        } else {
          it.label = labels[it.id] ? this.L(labels[it.id]) : it.baseLabel;
        }
      }
      g.chapterTint = th.tint || null;
      for (const npc of g.npcs || []) npc.displayName = this.displayName(npc);
    }

    enter() {
      this.g.npcs = this.buildNpcs();
      this.applyTheme();
      this.completeAnnounced = this.isComplete();
      this.updateChip();
    }

    // ───────── Goals ─────────
    stat(key) { return (this.g.chapterStats && this.g.chapterStats[key]) || 0; }

    goalProgress(goal) {
      const g = this.g;
      if (goal.type === 'friends') {
        const cur = this.ch.npcs.filter((n) => this.hearts(n.name) >= goal.min).length;
        return { cur: Math.min(goal.n, cur), n: goal.n };
      }
      if (goal.type === 'money') {
        const cur = Math.floor((g.money || 0) + (g.bankBalance || 0));
        return { cur: Math.min(goal.n, cur), n: goal.n, money: true };
      }
      if (goal.type === 'reunions') return { cur: Math.min(goal.n, this.stat('reunions')), n: goal.n };
      return { cur: Math.min(goal.n, this.stat(goal.key)), n: goal.n };
    }

    goalText(goal) {
      const money = (n) => (YD.fmtMoney ? YD.fmtMoney(n) : `₺${n}`);
      if (goal.type === 'friends') return this.fmt(UI.friendsGoal, { n: goal.n, h: '❤️'.repeat(goal.min) });
      if (goal.type === 'money') return this.fmt(UI.moneyGoal, { m: money(goal.n) });
      if (goal.type === 'reunions') return this.fmt(UI.reunionGoal, { n: goal.n });
      return this.L(goal.t || QUEST_WORDS[goal.key]);
    }

    isComplete() {
      const goals = this.ch.goals || [];
      if (!goals.length) return false;
      return goals.every((gl) => { const p = this.goalProgress(gl); return p.cur >= p.n; });
    }

    doneCount() {
      return (this.ch.goals || []).filter((gl) => { const p = this.goalProgress(gl); return p.cur >= p.n; }).length;
    }

    onEvent(questId) {
      const g = this.g;
      if (!g.chapterStats) g.chapterStats = {};
      if (YD.CHAPTER_STAT_KEYS.includes(questId)) g.chapterStats[questId] = (g.chapterStats[questId] || 0) + 1;
      if (questId === 'q_animals') this.addVicdan(1, 'animal');
      if (questId === 'q_delivery') this.addVicdan(1, 'help');
      this.checkComplete();
    }

    checkComplete() {
      const done = this.isComplete();
      if (done && !this.completeAnnounced) {
        this.completeAnnounced = true;
        const g = this.g;
        if (g.audio && g.audio.levelUp) g.audio.levelUp();
        g.showToast(this.L(UI.complete));
        if (g.burst) g.burst(g.player.x, g.player.y, '#fde047', 26);
      }
      this.updateChip();
    }

    // ───────── Vicdan / conscience ─────────
    addVicdan(amt, key) {
      const g = this.g;
      g.vicdan = (g.vicdan || 0) + amt;
      if (!g.vicdanLog) g.vicdanLog = {};
      if (YD.VICDAN_KEYS.includes(key)) g.vicdanLog[key] = (g.vicdanLog[key] || 0) + amt;
    }

    onRudeHonk() {
      const now = performance.now();
      if (now - this.lastRudeAt < 10000) return;
      this.lastRudeAt = now;
      this.addVicdan(-1, 'rude');
    }

    // ───────── Talking & familiarity ─────────
    isReunited(name) { return (this.g.reunited || new Set()).has(`${this.idx}:${name}`); }

    promptText(npc) {
      const h = this.hearts(npc.name);
      const heartsTxt = h > 0 ? '❤️'.repeat(Math.min(5, h)) : '';
      let txt = `[E] 💬 ${this.displayName(npc)} · ${this.tierName(h)} ${heartsTxt}`.trim();
      const pastH = npc.knowsVia ? this.hearts(npc.knowsVia) : h;
      if (npc.recurring && !this.isReunited(npc.name) && pastH > 0) txt += ` · ${this.L(UI.knowsYou)}`;
      return txt;
    }

    tierLine(npc, h) {
      const L = npc.lines || {};
      const key = ['s', 'a', 'f', 'b'][this.tierIdx(h)];
      return this.L(L[key] || L.s || T('Merhaba!', 'Hello!'));
    }

    afterlifeLine(npc) {
      const h = this.hearts(npc.name);
      const name = this.g.playerName;
      const mem = this.L(npc.memory || T('', ''));
      const heaven = this.g.ending !== 'hell';
      if (heaven && h >= 3) return this.lang() === 'en'
        ? `${name}! Finally you\'re here. ${mem} We have all eternity now.`
        : `${name}! Sonunda geldin. ${mem} Artık sonsuz vaktimiz var.`;
      if (heaven) return this.lang() === 'en'
        ? 'I barely knew you down there... but here we have all the time to become friends.'
        : 'Seni orada pek tanıyamadım... ama burada dost olmak için sonsuz vakit var.';
      if (h >= 3) return this.lang() === 'en'
        ? `You shouldn\'t be here, ${name}... ${mem} If only you had chosen differently.`
        : `Sen burada olmamalıydın ${name}... ${mem} Keşke başka seçimler yapsaydın.`;
      return this.lang() === 'en' ? 'You never really knew me. Now it\'s too late.' : 'Beni hiç tanımadın ki. Artık çok geç.';
    }

    talk(npc) {
      const g = this.g;
      if (npc.afterlife) {
        g.say(npc, this.afterlifeLine(npc), 5.0);
        return;
      }
      const name = npc.name;
      let h = this.hearts(name);
      let line = null, dur = 3.6;

      // First meeting in this chapter with someone from your past → reunion line by familiarity
      if (npc.recurring && !this.isReunited(name)) {
        if (!g.reunited) g.reunited = new Set();
        g.reunited.add(`${this.idx}:${name}`);
        g.chapterStats.reunions = (g.chapterStats.reunions || 0) + 1;
        const pastH = npc.knowsVia ? this.hearts(npc.knowsVia) : h;
        const r = npc.reunion || {};
        if (pastH >= 3) {
          line = this.L(r.known); this.addVicdan(3, 'reunion');
          if (npc.knowsVia && h < 2) { h = 2; g.npcHearts[name] = 2; }
          g.popup(npc.x, npc.y - 40, this.lang() === 'en' ? '🫂 OLD FRIEND! +3 Conscience' : '🫂 ESKİ DOST! +3 Vicdan', '#f9a8d4');
        } else if (pastH >= 1) line = this.L(r.vague);
        else line = this.L(r.none);
        dur = 5.2;
      }

      if (!this.talkedToday.has(name)) {
        this.talkedToday.add(name);
        const nextH = Math.min(5, h + 1);
        if (nextH > h) {
          g.npcHearts[name] = nextH;
          this.addVicdan(1, 'friend');
          g.happiness = Math.min(100, g.happiness + 8);
          g.addXp(10);
          if (g.audio && g.audio.pickup) g.audio.pickup();
          if (nextH === 3 && h < 3) {
            g.money += 50;
            g.popup(npc.x, npc.y - 34, this.lang() === 'en' ? '❤️ Friendship gift: +$50!' : '❤️ Dostluk Hediyesi: +₺50!', '#f472b6');
          }
        }
        if (!line) line = this.tierLine(npc, nextH);
      } else if (!line) {
        line = `${this.tierLine(npc, h)} ${this.L(UI.alreadyTalked)}`;
      }
      g.say(npc, line, dur);
      this.checkComplete();
    }

    onNewDay(fainted) {
      this.talkedToday.clear();
      if (fainted) this.addVicdan(-1, 'self');
    }

    // ───────── Chapter transition ─────────
    advance() {
      const g = this.g;
      const ch = this.ch;
      if (ch.final || !this.isComplete()) return;
      // Neglect: old friends present this chapter that you never greeted
      for (const n of ch.npcs) {
        if (!n.recurring || this.isReunited(n.name)) continue;
        const pastH = n.knowsVia ? this.hearts(n.knowsVia) : this.hearts(n.name);
        if (pastH >= 3) this.addVicdan(-3, 'neglect');
      }
      g.chapterIdx = this.idx + 1;
      g.chapterStats = {};
      this.talkedToday.clear();
      const nextCh = this.ch;
      if (nextCh.final) {
        g.ending = (g.vicdan || 0) >= YD.VICDAN_HEAVEN ? 'heaven' : 'hell';
      } else if (nextCh.age) {
        g.age = Math.max(g.age || 0, nextCh.age);
      }
      if (g.autoPilot && g.autoPilot.active) g.toggleAutoPilot(false);
      if (g.delivery && g.delivery.active && g.cancelDelivery) g.cancelDelivery('');
      if (g.scene === 'home' && g.exitHome) g.exitHome();
      g.player.inCar = false; g.player.onBike = false; g.player.inBoat = false; g.player.swimming = false;
      g.player.x = 2062; g.player.y = 1540; g.player.vx = 0; g.player.vy = 0;
      g.cam.x = g.player.x; g.cam.y = g.player.y; g.interpPrev = null;
      this.enter();
      if (g.audio && g.audio.timeWarp) g.audio.timeWarp();
      g.burst(g.player.x, g.player.y, nextCh.final ? '#fde047' : '#38bdf8', 34);
      const th = this.theme();
      g.showToast(`${th.icon} ${this.L(th.title)}`);
      g.saveGame();
      this.renderModal();
    }

    newLife() {
      const g = this.g;
      const msg = this.lang() === 'en' ? 'Start a brand new life from Tekirdağ? Your current save will be erased.' : 'Tekirdağ\'dan yepyeni bir hayata başlansın mı? Mevcut kayıt silinecek.';
      if (!confirm(msg)) return;
      if (g.resetSaveAndReload) g.resetSaveAndReload();
    }

    // ───────── HUD chip ─────────
    updateChip() {
      const chip = document.getElementById('chapterChip');
      if (!chip) return;
      const th = this.theme();
      const goals = this.ch.goals || [];
      const txt = this.ch.final ? `${th.icon} ${this.L(th.name)}` : `${th.icon} ${this.L(th.name)} ${this.doneCount()}/${goals.length}`;
      if (chip.textContent !== txt) chip.textContent = txt;
      const btn = document.getElementById('btnChapter');
      if (btn) btn.classList.toggle('chapter-ready', this.isComplete());
    }

    // ───────── Modal ─────────
    renderModal() {
      const g = this.g;
      const th = this.theme();
      const ch = this.ch;
      const set = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; return e; };
      set('chapterTitle', `${th.icon} ${this.L(th.title)}`);
      set('btnCloseChapter', this.L(UI.close));
      set('chapterAgeBadge', `${this.L(UI.ageLbl)} ${ch.final ? '∞' : g.age}`);

      const track = document.getElementById('chapterTrack');
      if (track) {
        const frag = document.createDocumentFragment();
        YD.CHAPTERS.forEach((c, i) => {
          const tv = c.final ? (i <= this.idx ? th : c) : c;
          const step = el('div', `chapter-step ${i < this.idx ? 'done' : ''} ${i === this.idx ? 'active' : ''}`);
          step.appendChild(el('span', 'chapter-step-icon', tv.icon));
          step.appendChild(el('span', 'chapter-step-name', this.L(tv.name)));
          frag.appendChild(step);
        });
        track.replaceChildren(frag);
      }

      set('chapterStory', this.L(th.story));

      const goalsHdr = set('chapterGoalsHdr', this.L(UI.goalsHdr));
      const goalBox = document.getElementById('chapterGoals');
      if (goalBox) {
        const frag = document.createDocumentFragment();
        (ch.goals || []).forEach((gl) => {
          const p = this.goalProgress(gl);
          const done = p.cur >= p.n;
          const row = el('div', `quest-row ${done ? 'done' : ''}`);
          row.appendChild(el('span', null, `${done ? '✅' : '⬜'} ${this.goalText(gl)}`));
          const prog = p.money ? `${YD.fmtMoney ? YD.fmtMoney(p.cur) : p.cur}/${YD.fmtMoney ? YD.fmtMoney(p.n) : p.n}` : `${p.cur}/${p.n}`;
          row.appendChild(el('b', null, prog));
          frag.appendChild(row);
        });
        goalBox.replaceChildren(frag);
        goalBox.classList.toggle('hidden', !!ch.final);
        if (goalsHdr) goalsHdr.classList.toggle('hidden', !!ch.final);
      }

      set('chapterFriendsHdr', this.L(ch.final ? UI.allFriendsHdr : UI.friendsHdr));
      const fBox = document.getElementById('chapterFriends');
      if (fBox) {
        const frag = document.createDocumentFragment();
        let people;
        if (ch.final) {
          const seen = new Map();
          YD.CHAPTERS.forEach((c) => c.npcs.forEach((n) => { if (!seen.has(n.name)) seen.set(n.name, n); }));
          people = [...seen.values()].filter((n) => this.hearts(n.name) >= 1).sort((a, b) => this.hearts(b.name) - this.hearts(a.name));
        } else people = ch.npcs;
        if (!people.length) frag.appendChild(el('div', 'chapter-empty', this.L(UI.noFriends)));
        people.forEach((n) => {
          const h = this.hearts(n.name);
          const card = el('div', `chapter-friend tier-${this.tierIdx(h)}`);
          const dot = el('span', 'chapter-friend-dot'); dot.style.background = n.color;
          card.appendChild(dot);
          card.appendChild(el('b', null, this.displayName(n)));
          card.appendChild(el('span', 'chapter-friend-tier', `${this.tierName(h)} ${h > 0 ? '❤️'.repeat(h) : '🤍'}`));
          if (!ch.final && n.recurring) {
            const past = n.knowsVia ? this.hearts(n.knowsVia) : h;
            const tag = this.isReunited(n.name) ? (this.lang() === 'en' ? '🫂 reunited' : '🫂 kavuştunuz')
              : (past > 0 ? this.L(UI.knowsYou) : (this.lang() === 'en' ? '🕰️ from your past' : '🕰️ geçmişinden'));
            card.appendChild(el('span', 'chapter-friend-tag', tag));
          }
          frag.appendChild(card);
        });
        fBox.replaceChildren(frag);
      }

      const vBox = document.getElementById('chapterVicdan');
      if (vBox) {
        const frag = document.createDocumentFragment();
        const v = g.vicdan || 0;
        frag.appendChild(el('div', 'chapter-vicdan-score', `${this.L(UI.vicdan)}: ${v > 0 ? '+' : ''}${v}  ·  ${this.L(UI.threshold)}: ${YD.VICDAN_HEAVEN}`));
        const list = el('div', 'chapter-vicdan-list');
        for (const k of YD.VICDAN_KEYS) {
          const val = (g.vicdanLog && g.vicdanLog[k]) || 0;
          if (!val) continue;
          list.appendChild(el('span', `chapter-vicdan-chip ${val < 0 ? 'neg' : 'pos'}`, `${this.L(VICDAN_LABELS[k])} ${val > 0 ? '+' : ''}${val}`));
        }
        frag.appendChild(list);
        if (ch.final) frag.appendChild(el('div', `chapter-verdict ${g.ending === 'hell' ? 'hell' : 'heaven'}`, this.L(g.ending === 'hell' ? UI.verdictHell : UI.verdictHeaven)));
        vBox.replaceChildren(frag);
      }

      const nextBtn = document.getElementById('btnChapterNext');
      const newBtn = document.getElementById('btnNewLife');
      if (nextBtn) {
        if (ch.final) {
          nextBtn.textContent = this.L(UI.stay);
          nextBtn.disabled = false;
        } else {
          const ok = this.isComplete();
          nextBtn.textContent = ok ? this.L(ch.next) : `${this.L(UI.locked)} (${this.doneCount()}/${(ch.goals || []).length})`;
          nextBtn.disabled = !ok;
        }
      }
      if (newBtn) {
        newBtn.textContent = this.L(UI.newLife);
        newBtn.classList.toggle('hidden', !ch.final);
      }
      this.updateChip();
    }
  }

  YD.ChapterSystem = ChapterSystem;
  YD.CHAPTER_UI = UI;
})(window.YasamDunya);
