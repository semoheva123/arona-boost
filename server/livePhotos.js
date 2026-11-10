/**
 * Live Global Resorts, Luxury Hotels & World Tourist Landmarks Rotation Engine
 * Pulls real, diverse landscape photographs dynamically from Wikimedia Commons API,
 * filters out maps/diagrams/construction/portraits, caches results with TTL rotation,
 * and interleaves all 3 sectors:
 *   1. 'resort'   -> منتجعات عالمية
 *   2. 'hotel'    -> فنادق عالمية فاخرة
 *   3. 'landmark' -> أماكن ومعالم سياحية عالمية
 */

const TOURISM_POOL = [
  // ==================== 1. GLOBAL RESORTS (منتجعات عالمية) ====================
  {
    key: 'maldives_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#MLE',
    title: 'منتجعات جزر المالديف الفيروزية العائمة',
    location: 'ماليه، جزر المالديف',
    category: 'منتجعات جزر استوائية فاخرة',
    avgRating: 5.0,
    reviewsCount: '19.4K',
    fallbackImage: '/destinations/dest-7.jpg',
    queries: [
      'Maldives turquoise lagoon resort beach',
      'Maldives island overwater bungalow',
      'Maldives coral atoll aerial'
    ],
    description:
      'فلل وأجنحة خشبية عائمة فوق المياه الفيروزية الصافية والشعاب المرجانية النادرة للاستجمام العالمي الفاخر.'
  },
  {
    key: 'santorini_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#JTR',
    title: 'منتجعات كالديرا أويا المطلة على بحر إيجة',
    location: 'سانتوريني، اليونان',
    category: 'منتجعات ساحلية بانورامية',
    avgRating: 4.9,
    reviewsCount: '15.3K',
    fallbackImage: '/destinations/dest-8.jpg',
    queries: [
      'Oia Santorini sunset caldera',
      'Santorini blue domes Aegean sea',
      'Fira Santorini cliffside view'
    ],
    description:
      'منتجعات صخرية بيضاء بمفروشات متوسطية ومسابح لا متناهية تطل مباشرة على غروب بحر إيجة الساحر.'
  },
  {
    key: 'bali_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#DPS',
    title: 'منتجعات أوبود الاستوائية وشواطئ بالي',
    location: 'بالي، إندونيسيا',
    category: 'منتجعات استجمام وطبيعة استوائية',
    avgRating: 4.9,
    reviewsCount: '16.2K',
    fallbackImage: '/destinations/dest-7.jpg',
    queries: ['Tegallalang rice terraces Bali', 'Uluwatu cliff sunset Bali ocean'],
    description:
      'منتجعات استوائية هادئة تتوسط الغابات الخضراء والمدرجات المائية مع إطلالات محيطية خلابة.'
  },
  {
    key: 'swiss_alps_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#ZRH',
    title: 'منتجع بحيرة إنترلاكن وجبال الألب السويسرية',
    location: 'إنترلاكن وزيورخ، سويسرا',
    category: 'منتجعات جبلية وبحيرات عالمية',
    avgRating: 4.9,
    reviewsCount: '13.4K',
    fallbackImage: '/destinations/dest-10.jpg',
    queries: [
      'Lauterbrunnen valley Swiss Alps',
      'Lake Brienz Interlaken Switzerland',
      'Matterhorn Zermatt Alps landscape'
    ],
    description:
      'منتجعات جبلية سويسرية فاخرة تحيط بها البحيرات الزمردية والمروج الخضراء وقمم الألب الثلجية.'
  },
  {
    key: 'alula_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#ULH',
    title: 'منتجع وادي العُلا الصحراوي ومحمية الحِجر',
    location: 'العُلا، المملكة العربية السعودية',
    category: 'منتجعات صحراوية وتراث عالمي',
    avgRating: 4.9,
    reviewsCount: '11.8K',
    fallbackImage: '/destinations/dest-3.jpg',
    queries: [
      'AlUla Saudi Arabia desert rock',
      'Madain Saleh Hegra tomb',
      'Elephant Rock AlUla Saudi'
    ],
    description:
      'أجنحة ضيافة صحراوية فاخرة مندمجة مع التشكيلات الصخرية الذهبية المهيبة في قلب العُلا.'
  },
  {
    key: 'redsea_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#SSH',
    title: 'منتجعات خليج القرش وشواطئ البحر الأحمر',
    location: 'شرم الشيخ والغردقة، مصر',
    category: 'منتجعات بحرية وغوص عالمية',
    avgRating: 4.8,
    reviewsCount: '14.9K',
    fallbackImage: '/destinations/dest-6.jpg',
    queries: ['Red Sea coral reef beach Egypt', 'Hurghada turquoise coast resort'],
    description:
      'منتجعات شاطئية متكاملة على ضفاف البحر الأحمر تجمع صفاء المياه الدافئة ورياضات الغوص والاستجمام العائلي.'
  },

  // ==================== 2. LUXURY HOTELS (فنادق عالمية فاخرة) ====================
  {
    key: 'dubai_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#DXB',
    title: 'فنادق وأجنحة بوليفارد دبي ونخلة جميرا',
    location: 'دبي، الإمارات العربية المتحدة',
    category: 'فنادق 5 نجوم وأجنحة ملكية',
    avgRating: 4.9,
    reviewsCount: '21.4K',
    fallbackImage: '/destinations/dest-1.jpg',
    queries: [
      'Dubai skyline twilight Marina',
      'Downtown Dubai skyline fountain',
      'Palm Jumeirah Dubai aerial'
    ],
    description:
      'أفخم الفنادق والأجنحة التنفيذية المطلة مباشرة على نافورة دبي الراقصة وأفق الخليج العربي.'
  },
  {
    key: 'istanbul_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#IST',
    title: 'فنادق قصور البوسفور التاريخية — إسطنبول',
    location: 'إسطنبول، تركيا',
    category: 'فنادق قصور وإطلالات بحرية',
    avgRating: 4.9,
    reviewsCount: '15.7K',
    fallbackImage: '/destinations/dest-2.jpg',
    queries: [
      'Bosphorus Istanbul sunset mosque',
      'Ortakoy Mosque Istanbul Bosphorus',
      'Blue Mosque Hagia Sophia Istanbul'
    ],
    description:
      'فنادق عريقة على ضفاف مضيق البوسفور تمزج فخامة القصور التاريخية مع أرقى خدمات الضيافة العصرية.'
  },
  {
    key: 'venice_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#VCE',
    title: 'فنادق القصور المائية على القناة الكبرى — فينيسيا',
    location: 'البندقية، إيطاليا',
    category: 'فنادق تاريخية كلاسيكية',
    avgRating: 4.9,
    reviewsCount: '17.8K',
    fallbackImage: '/destinations/dest-8.jpg',
    queries: ['Grand Canal Venice sunset gondola', 'Rialto Bridge Venice Italy'],
    description:
      'فنادق إيطالية كلاسيكية بأرصفتها الخاصة لقوارب الجوندولا وإطلالات مباشرة على جسر ريالتو والقناة الكبرى.'
  },
  {
    key: 'jounieh_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#BEY',
    title: 'فنادق خليج جونيه والواجهة البحرية المتوسطية',
    location: 'جبل لبنان وبيروت، لبنان',
    category: 'فنادق أعمال وإطلالات ساحلية',
    avgRating: 4.8,
    reviewsCount: '9.6K',
    fallbackImage: '/destinations/dest-6.jpg',
    queries: [
      'Jounieh Bay Lebanon coast',
      'Pigeon Rocks Raouche Beirut sunset',
      'Byblos harbor Lebanon Mediterranean'
    ],
    description:
      'منشآت فندقية راقية تطل على زرقة البحر الأبيض المتوسط وسفوح الجبال الخضراء.'
  },
  {
    key: 'marrakech_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#RAK',
    title: 'فنادق ورياض الضيافة الملكية في مراكش وشفشاون',
    location: 'مراكش وشفشاون، المغرب',
    category: 'فنادق ورياض تراثية فاخرة',
    avgRating: 4.9,
    reviewsCount: '12.3K',
    fallbackImage: '/destinations/dest-9.jpg',
    queries: ['Chefchaouen blue city Morocco', 'Koutoubia Mosque Marrakech sunset'],
    description:
      'فنادق ورياض مغربية فاخرة تتميز بالحدائق الأندلسية الداخلية والأقواس المزخرفة وخدمات الضيافة الأصيلة.'
  },
  {
    key: 'deadsea_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#AMM',
    title: 'فنادق الأعمال والضيافة في عمّان والبحر الميت',
    location: 'عمّان والبحر الميت، الأردن',
    category: 'فنادق استشفاء ومؤتمرات دولية',
    avgRating: 4.8,
    reviewsCount: '10.8K',
    fallbackImage: '/destinations/dest-4.jpg',
    queries: ['Dead Sea Jordan sunset resort', 'Amman citadel skyline Jordan'],
    description:
      'فنادق ومنشآت ضيافة علاجية ومؤتمرات فاخرة على أخفض بقعة في العالم وأبراج العاصمة عمّان.'
  },

  // ==================== 3. TOURIST PLACES & LANDMARKS (أماكن ومعالم سياحية) ====================
  {
    key: 'petra_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#PTR',
    title: 'مدينة البتراء الوردية ومحمية وادي رم',
    location: 'معان والعقبة، الأردن',
    category: 'عجائب العالم والمعالم الأثرية',
    avgRating: 4.9,
    reviewsCount: '24.5K',
    fallbackImage: '/destinations/dest-4.jpg',
    queries: [
      'Petra Jordan Treasury Khazneh',
      'Petra monastery Jordan canyon',
      'Wadi Rum Jordan desert landscape'
    ],
    description:
      'إحدى عجائب الدنيا السبع الجديدة المحفورة في الصخور الوردية عبر ممر السيق التاريخي المهيب.'
  },
  {
    key: 'giza_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#CAI',
    title: 'أهرامات الجيزة وتمثال أبو الهول وضفاف النيل',
    location: 'القاهرة والجيزة، مصر',
    category: 'معالم الحضارة الإنسانية الخالدة',
    avgRating: 4.9,
    reviewsCount: '29.1K',
    fallbackImage: '/destinations/dest-5.jpg',
    queries: [
      'Pyramids of Giza sunset Egypt',
      'Great Sphinx Giza Pyramids',
      'Nile river Aswan felucca sunset'
    ],
    description:
      'أشهر مقصد أثري وسياحي في العالم يجمع عظمة الأهرامات الخالدة وجولات نهر النيل الساحرة.'
  },
  {
    key: 'abudhabi_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#AUH',
    title: 'جامع الشيخ زايد الكبير وكورنيش أبوظبي الثقافي',
    location: 'أبوظبي، الإمارات العربية المتحدة',
    category: 'معالم معمارية وثقافية عالمية',
    avgRating: 5.0,
    reviewsCount: '23.3K',
    fallbackImage: '/destinations/dest-1.jpg',
    queries: [
      'Sheikh Zayed Mosque Abu Dhabi reflection',
      'Abu Dhabi Corniche skyline twilight'
    ],
    description:
      'أيقونة معمارية رخامية ناصعة البياض تضم اثنتين وثمانين قبة وأحواض مائية عاكسة تستقطب ملايين الزوار.'
  },
  {
    key: 'alhambra_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#GRX',
    title: 'قصر الحمراء وحدائق العريف التاريخية',
    location: 'غرناطة، إسبانيا',
    category: 'أماكن تراثية وعمارة عالمية',
    avgRating: 4.9,
    reviewsCount: '18.6K',
    fallbackImage: '/destinations/dest-9.jpg',
    queries: [
      'Alhambra Granada palace Sierra Nevada',
      'Patio de los Arrayanes Alhambra',
      'Generalife gardens Granada'
    ],
    description:
      'درة المعالم التاريخية في الأندلس بأروقتها المنقوشة وحدائقها الغنّاء المطلة على قمم سييرا نيفادا.'
  },
  {
    key: 'cappadocia_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#CAP',
    title: 'وادي كابادوكيا ومناطيد الشروق البانورامية',
    location: 'نوشهر، تركيا',
    category: 'أماكن سياحية طبيعية ومغامرات',
    avgRating: 4.9,
    reviewsCount: '19.8K',
    fallbackImage: '/destinations/dest-2.jpg',
    queries: [
      'Cappadocia hot air balloons sunrise',
      'Goreme Cappadocia valley landscape'
    ],
    description:
      'وجهة سياحية عالمية فريدة تحلق في سمائها مئات المناطيد الملونة فوق الوديان والتكوينات الصخرية.'
  },
  {
    key: 'dubai_frame_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#DXB',
    title: 'برج خليفة ومتحف المستقبل وواجهة دبي المائية',
    location: 'دبي، الإمارات العربية المتحدة',
    category: 'أماكن سياحية عصرية عالمية',
    avgRating: 5.0,
    reviewsCount: '26.7K',
    fallbackImage: '/destinations/dest-1.jpg',
    queries: ['Burj Khalifa Downtown Dubai', 'Dubai Marina waterfront promenade'],
    description:
      'أبرز المعالم السياحية العصرية في العالم وأعلى منصة مشاهدة بانورامية تستقطب الزوار من مختلف القارات.'
  }
];

const EXCLUDED_WORDS = [
  'map',
  'diagram',
  'plan',
  'logo',
  'flag',
  'stamp',
  'coat_of_arms',
  'construction',
  '2007',
  '2008',
  'sign',
  'plaque',
  'ticket',
  'menu',
  'portrait',
  'selfie',
  'collage',
  'banner_page'
];

const queryGalleryCache = new Map();
const inFlightQueries = new Set();
const imageBinaryCache = new Map();
const MAX_BINARY_CACHE = Number(process.env.LIVE_IMAGE_CACHE_SIZE || 60);

function shuffleWithSeed(arr, seedNum) {
  const copy = [...arr];
  let s = seedNum || Date.now();
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Interleave Resorts, Hotels, and Tourist Landmarks so every multi-slot user gets all 3 sectors!
function buildBalancedSectorRotation(seedNum) {
  const resorts = shuffleWithSeed(
    TOURISM_POOL.filter((d) => d.sectorType === 'resort'),
    seedNum + 11
  );
  const hotels = shuffleWithSeed(
    TOURISM_POOL.filter((d) => d.sectorType === 'hotel'),
    seedNum + 29
  );
  const landmarks = shuffleWithSeed(
    TOURISM_POOL.filter((d) => d.sectorType === 'landmark'),
    seedNum + 53
  );

  const buckets = [resorts, hotels, landmarks];
  const shift = Math.abs(seedNum) % 3;
  const orderedBuckets = [
    buckets[shift],
    buckets[(shift + 1) % 3],
    buckets[(shift + 2) % 3]
  ];

  const interleaved = [];
  const maxLen = Math.max(resorts.length, hotels.length, landmarks.length);
  for (let i = 0; i < maxLen; i++) {
    for (const b of orderedBuckets) {
      if (b[i]) interleaved.push(b[i]);
    }
  }
  return interleaved;
}

async function fetchWikimediaPhotosForQuery(searchQuery) {
  const cached = queryGalleryCache.get(searchQuery);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < 45 * 60 * 1000 && cached.urls.length > 0) {
    return cached.urls;
  }
  if (inFlightQueries.has(searchQuery)) {
    return cached?.urls || [];
  }

  inFlightQueries.add(searchQuery);
  try {
    const q = encodeURIComponent(searchQuery);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=14&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=640&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'AronaBoostTourismPlatform/2.0 (https://aronaboost.app)'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return cached?.urls || [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});

    const cleanUrls = [];
    for (const p of pages) {
      const titleLower = String(p.title || '').toLowerCase();
      if (EXCLUDED_WORDS.some((w) => titleLower.includes(w))) continue;

      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      if (ii.mime !== 'image/jpeg' && ii.mime !== 'image/webp') continue;
      if (!ii.width || !ii.height) continue;
      if (ii.width < 800 || ii.width < ii.height * 1.18 || ii.width > ii.height * 3.2) continue;

      const rawThumb = ii.thumburl || (ii.size && ii.size < 450000 ? ii.url : null);
      if (rawThumb) {
        const proxied = `/api/live-image?u=${encodeURIComponent(rawThumb)}`;
        if (!cleanUrls.includes(proxied)) {
          cleanUrls.push(proxied);
        }
      }
    }

    if (cleanUrls.length > 0) {
      queryGalleryCache.set(searchQuery, { urls: cleanUrls, fetchedAt: now });
    }
    return cleanUrls;
  } catch {
    return cached?.urls || [];
  } finally {
    inFlightQueries.delete(searchQuery);
  }
}

async function buildLiveGalleryForDestination(dest, rotationSeed = 0) {
  const now = Date.now();
  const queryResults = dest.queries.map((q) => {
    const cached = queryGalleryCache.get(q);
    if (!cached || now - cached.fetchedAt >= 45 * 60 * 1000) {
      setImmediate(() => {
        fetchWikimediaPhotosForQuery(q).catch(() => {});
      });
    }
    return cached?.urls || [];
  });

  const combined = [];
  const maxLen = Math.max(0, ...queryResults.map((r) => r.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of queryResults) {
      if (list[i] && !combined.includes(list[i])) {
        combined.push(list[i]);
      }
    }
  }

  const timeBucket = Math.floor(Date.now() / 45000) + Number(rotationSeed || 0);
  const rotatedLive = shuffleWithSeed(combined, timeBucket + dest.key.length * 97).slice(0, 4);

  const gallery = [dest.fallbackImage, ...rotatedLive.filter((u) => u !== dest.fallbackImage)];
  return gallery;
}

async function getDynamicDestinationsForSlots(slotCount, completedMap, rotationSeed = 0) {
  const daySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const effectiveSeed = daySeed + Number(rotationSeed || 0) * 31;

  // Stratified rotation guaranteeing Resorts + Hotels + Landmarks appear together!
  const rotatedPool = buildBalancedSectorRotation(effectiveSeed);

  const usedKeys = new Set();
  const chosenForSlots = [];

  for (let slot = 1; slot <= slotCount; slot++) {
    const done = completedMap.get(slot);
    if (done) {
      const matched =
        TOURISM_POOL.find((d) => d.title === done.task_title) ||
        TOURISM_POOL[(slot - 1) % TOURISM_POOL.length];
      usedKeys.add(matched.key);
    }
  }

  let poolCursor = 0;
  for (let slot = 1; slot <= slotCount; slot++) {
    const done = completedMap.get(slot);
    if (done) {
      const matched =
        TOURISM_POOL.find((d) => d.title === done.task_title) ||
        TOURISM_POOL[(slot - 1) % TOURISM_POOL.length];
      chosenForSlots.push({ slot, dest: matched, done });
    } else {
      while (poolCursor < rotatedPool.length && usedKeys.has(rotatedPool[poolCursor].key)) {
        poolCursor++;
      }
      const picked = rotatedPool[poolCursor % rotatedPool.length];
      usedKeys.add(picked.key);
      poolCursor++;
      chosenForSlots.push({ slot, dest: picked, done: null });
    }
  }

  const enriched = await Promise.all(
    chosenForSlots.map(async ({ slot, dest, done }) => {
      const gallery = await buildLiveGalleryForDestination(dest, effectiveSeed + slot);
      return {
        slot,
        key: dest.key,
        sectorType: dest.sectorType || 'landmark',
        sectorBadge: dest.sectorBadge || 'عقد تقييم سياحي',
        codePrefix: dest.codePrefix || '#AB',
        title: done ? done.task_title : dest.title,
        location: done && done.location ? done.location : dest.location,
        category: dest.category,
        avgRating: dest.avgRating,
        reviewsCount: dest.reviewsCount,
        image: gallery[0] || dest.fallbackImage,
        fallbackImage: dest.fallbackImage,
        gallery,
        description: dest.description,
        completed: Boolean(done),
        completedAt: done ? done.created_at : null,
        userRating: done ? done.rating : null,
        userTags: done ? done.review_tags : '',
        userComment: done ? done.review_comment : ''
      };
    })
  );

  return enriched;
}

async function getFeaturedDestinationsShowcase(seed = 0) {
  const timeBucket = Math.floor(Date.now() / 60000) + Number(seed || 0);
  const picks = buildBalancedSectorRotation(timeBucket).slice(0, 6);
  const items = await Promise.all(
    picks.map(async (dest, idx) => {
      const gallery = await buildLiveGalleryForDestination(dest, timeBucket + idx);
      return {
        key: dest.key,
        sectorType: dest.sectorType || 'landmark',
        sectorBadge: dest.sectorBadge || 'عقد تقييم سياحي',
        codePrefix: dest.codePrefix || '#AB',
        title: dest.title,
        location: dest.location,
        category: dest.category,
        avgRating: dest.avgRating,
        image: gallery[0] || dest.fallbackImage,
        fallbackImage: dest.fallbackImage,
        gallery: gallery.slice(0, 4)
      };
    })
  );
  return items;
}

async function proxyWikimediaImage(rawUrl, res) {
  try {
    if (!rawUrl || !/^https:\/\/(thumb|upload)\.wikimedia\.org\//.test(rawUrl)) {
      return res.status(400).end();
    }

    const cached = imageBinaryCache.get(rawUrl);
    if (cached && Date.now() - cached.at < 60 * 60 * 1000) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=1800');
      return res.send(cached.buffer);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const upstream = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AronaBoostTourismPlatform/2.0)'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.redirect('/destinations/dest-1.jpg');
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const arrBuf = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrBuf);

    if (imageBinaryCache.size >= MAX_BINARY_CACHE) {
      const oldestKey = imageBinaryCache.keys().next().value;
      imageBinaryCache.delete(oldestKey);
    }
    imageBinaryCache.set(rawUrl, { buffer, contentType, at: Date.now() });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(buffer);
  } catch {
    return res.redirect('/destinations/dest-1.jpg');
  }
}

function warmUpLiveGalleries() {
  Promise.all(
    TOURISM_POOL.flatMap((d) => d.queries.slice(0, 2)).map((q) => fetchWikimediaPhotosForQuery(q))
  ).catch(() => {});
}

module.exports = {
  TOURISM_POOL,
  getDynamicDestinationsForSlots,
  getFeaturedDestinationsShowcase,
  proxyWikimediaImage,
  warmUpLiveGalleries
};
