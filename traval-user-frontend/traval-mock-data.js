/**
 * Traval Platform — User & Map Mock Data
 * Curated destinations and verified Local SME businesses with authentic Thai coordinates.
 */
'use strict';

export const TRAVAL_MOCK_PLACES = [
  {
    id: 'sme-mae-kampong-coffee',
    en: 'Doi Pha Mee Charcoal Roasted Coffee',
    th: 'โรงคั่วกาแฟเตาฟืน ดอยผาหมี (แม่กำปอง)',
    category: 'food',
    isSme: true,
    smeBadge: 'Local SME Spotlight',
    province: 'chiang-mai',
    provinceNameTh: 'เชียงใหม่',
    provinceNameEn: 'Chiang Mai',
    locEn: 'Mae On, Chiang Mai',
    locTh: 'อ.แม่ออน จ.เชียงใหม่',
    lat: 18.8682,
    lon: 99.3515,
    rating: 4.9,
    reviewsCount: 184,
    priceFrom: 65,
    currency: 'THB',
    openHours: '08:00 - 17:00 น.',
    isOpen: true,
    phone: '089-555-1234',
    photo: 'hero-forest.webp',
    gallery: ['hero-forest.webp', 'cabin-retreat.webp', 'terrace.webp'],
    visit: '1–2h',
    storyTh: 'ร้านกาแฟวิสาหกิจชุมชนที่ยังคงใช้วิธีการคั่วเมล็ดอาราบิกาแท้บนเตาฟืนไม้ไผ่โบราณ ทำให้ได้กลิ่นหอมรมควันอันเป็นเอกลักษณ์ รายได้ส่วนใหญ่หมุนเวียนกลับสู่กลุ่มเกษตรกรบนดอย',
    storyEn: 'A local community cooperative brewing single-origin Arabica roasted slowly over bamboo charcoal firewood, delivering a signature smoky aroma and directly funding hill-tribe growers.',
    specialtiesTh: ['กาแฟดริปเตาฟืนดอยผาหมี', 'ชารอยัลยอดน้ำค้าง', 'เค้กชาเขียวใบเมี่ยง'],
    specialtiesEn: ['Firewood Drip Coffee', 'Morning Dew Royal Tea', 'Fermented Tea Leaf Cake']
  },
  {
    id: 'sme-talad-noi-noodle',
    en: 'Ba Hao Handmade Egg Noodles',
    th: 'บะหมี่ไข่ทำมือ 3 ชั่วอายุคน (ตลาดน้อย)',
    category: 'food',
    isSme: true,
    smeBadge: 'Hidden Gem',
    province: 'bangkok',
    provinceNameTh: 'กรุงเทพฯ',
    provinceNameEn: 'Bangkok',
    locEn: 'Talad Noi, Samphanthawong, Bangkok',
    locTh: 'ตรอกศาลเจ้าโรงเกือก ตลาดน้อย กรุงเทพฯ',
    lat: 13.7348,
    lon: 100.5135,
    rating: 4.8,
    reviewsCount: 312,
    priceFrom: 60,
    currency: 'THB',
    openHours: '09:00 - 16:30 น.',
    isOpen: true,
    phone: '081-443-8899',
    photo: 'kyoto-lane.webp',
    gallery: ['kyoto-lane.webp', 'path.webp', 'terrace.webp'],
    visit: '45m',
    storyTh: 'ร้านบะหมี่เส้นสดในตรอกเก่าแก่ของย่านตลาดน้อย นวดแป้งด้วยไม้ไผ่ยาวตามตำรับกวางตุ้งแท้ น้ำซุปเคี่ยวกระดูกหมูและกุ้งแห้งนานกว่า 8 ชั่วโมง กรุบกรอบด้วยเกี๊ยวกุ้งเต็มคำ',
    storyEn: 'A 50-year-old lane eatery kneading springy egg noodles using traditional long bamboo poles in historic Talad Noi. The 8-hour broth combines roast pork bone and sun-dried prawns.',
    specialtiesTh: ['บะหมี่เป๊าะแห้งหมูแดงอบน้ำผึ้ง', 'เกี๊ยวกุ้งจักรพรรดิ์', 'น้ำเก๊กฮวยต้มสมุนไพร'],
    specialtiesEn: ['Wide Egg Noodles with Honey Glazed Pork', 'Emperor Prawn Wontons', 'Herbal Chrysanthemum Infusion']
  },
  {
    id: 'sme-nan-weaving-homestay',
    en: 'Ta Nong Eco-Loom Homestay',
    th: 'โฮมสเตย์ทอผ้าไทลื้อ ตานงค์ (ปัว)',
    category: 'stay',
    isSme: true,
    smeBadge: 'Local SME Spotlight',
    province: 'nan',
    provinceNameTh: 'น่าน',
    provinceNameEn: 'Nan',
    locEn: 'Pua District, Nan',
    locTh: 'อ.ปัว จ.น่าน',
    lat: 19.1764,
    lon: 100.9152,
    rating: 4.95,
    reviewsCount: 96,
    priceFrom: 850,
    currency: 'THB',
    openHours: 'เปิดรับผู้เข้าพักทุกวัน',
    isOpen: true,
    phone: '085-709-3421',
    photo: 'terraced-fields.webp',
    gallery: ['terraced-fields.webp', 'green-valley.webp', 'cabin-retreat.webp'],
    visit: '1–2 days',
    storyTh: 'บ้านพักไม้สักริมคันนาล้อมรอบด้วยไอหมอกดอยภูคา เจ้าของบ้านสอนการทอผ้าลายน้ำไหลโบราณของชาวไทลื้อ พร้อมเสิร์ฟขันโตกอาหารพื้นบ้านจากพืชผักสวนครัวปลอดสารพิษ',
    storyEn: 'Teakwood eco-homestay amid misty rice terraces of Pua. Guests can learn traditional Tai Lue water-wave loom weaving and enjoy organic farm-to-table Northern Khantoke dinners.',
    specialtiesTh: ['ผ้าทอมือลายน้ำไหล', 'สำรับขันโตกผักอินทรีย์', 'เวิร์กช็อปย้อมครามธรรมชาติ'],
    specialtiesEn: ['Hand-loomed Flowing Water Textile', 'Organic Khantoke Feast', 'Natural Indigo Dye Workshop']
  },
  {
    id: 'mae-kampong-village',
    en: 'Mae Kampong Village',
    th: 'หมู่บ้านแม่กำปอง',
    category: 'nature',
    isSme: false,
    province: 'chiang-mai',
    provinceNameTh: 'เชียงใหม่',
    provinceNameEn: 'Chiang Mai',
    locEn: 'Mae On, Chiang Mai',
    locTh: 'อ.แม่ออน จ.เชียงใหม่',
    lat: 18.8660,
    lon: 99.3470,
    rating: 4.85,
    reviewsCount: 1420,
    priceFrom: 0,
    currency: 'THB',
    openHours: 'เปิดตลอด 24 ชม.',
    isOpen: true,
    phone: '053-315-111',
    photo: 'hero-forest.webp',
    gallery: ['hero-forest.webp', 'green-valley.webp', 'cabin-retreat.webp'],
    visit: '2–4h',
    storyTh: 'หมู่บ้านท่องเที่ยวเชิงอนุรักษ์กลางหุบเขาเขียวขจี อากาศเย็นสบายตลอดทั้งปี มีลำธารธรรมชาติไหลผ่านกลางหมู่บ้านและเส้นทางเดินป่าศึกษาธรรมชาติยอดดอยม่อนล้าน',
    storyEn: 'A highland eco-tourism village tucked into emerald northern valleys with cool mountain breezes year-round, babbling streams, and trails leading up to Mon Lan peak.',
    specialtiesTh: ['ชมนกชมไม้ริมธาร', 'จุดชมวิวม่อนล้าน', 'น้ำตกแม่กำปอง 7 ชั้น'],
    specialtiesEn: ['Riverside Cafes', 'Mon Lan Panoramic Peak', '7-Tier Mae Kampong Falls']
  },
  {
    id: 'ban-pa-bong-piang',
    en: 'Pa Bong Piang Terraced Rice Fields',
    th: 'นาขั้นบันได บ้านป่าบงเปียง',
    category: 'nature',
    isSme: false,
    province: 'chiang-mai',
    provinceNameTh: 'เชียงใหม่',
    provinceNameEn: 'Chiang Mai',
    locEn: 'Mae Chaem, Chiang Mai',
    locTh: 'อ.แม่แจ่ม จ.เชียงใหม่',
    lat: 18.4970,
    lon: 98.4500,
    rating: 4.9,
    reviewsCount: 880,
    priceFrom: 500,
    currency: 'THB',
    openHours: '06:00 - 18:30 น.',
    isOpen: true,
    phone: '081-020-1122',
    photo: 'terraced-fields.webp',
    gallery: ['terraced-fields.webp', 'green-valley.webp', 'ridge-view.webp'],
    visit: '2–3h',
    storyTh: 'ทิวทัศน์นาข้าวขั้นบันไดที่สวยงามและกว้างใหญ่ที่สุดแห่งหนึ่งของประเทศไทย ในช่วงฤดูฝนจะเห็นนาข้าวน้ำขังสะท้อนแสงอาทิตย์ และเปลี่ยนเป็นสีทองอร่ามในช่วงปลายปี',
    storyEn: 'One of Thailand’s most scenic terraced rice field landscapes, reflecting the morning sky during green season and turning into a shimmering sea of gold before harvest.',
    specialtiesTh: ['ชมพระอาทิตย์อัสดงเหนือแนวเขา', 'ทะเลหมอกยามเช้า', 'วิถีชาวปกาเกอะญอ'],
    specialtiesEn: ['Mountain Sunset View', 'Morning Sea of Mist', 'Karen Village Way of Life']
  },
  {
    id: 'baan-rak-thai',
    en: 'Ban Rak Thai Lake Village',
    th: 'หมู่บ้านรักไทย ริมทะเลสาบหมอก',
    category: 'stay',
    isSme: false,
    province: 'mae-hong-son',
    provinceNameTh: 'แม่ฮ่องสอน',
    provinceNameEn: 'Mae Hong Son',
    locEn: 'Mueang, Mae Hong Son',
    locTh: 'อ.เมือง จ.แม่ฮ่องสอน',
    lat: 19.5900,
    lon: 97.9400,
    rating: 4.75,
    reviewsCount: 1650,
    priceFrom: 1200,
    currency: 'THB',
    openHours: 'เปิดตลอด 24 ชม.',
    isOpen: true,
    phone: '053-611-234',
    photo: 'misty-cabin.webp',
    gallery: ['misty-cabin.webp', 'alpine-wide.webp', 'cabin-retreat.webp'],
    visit: '1 day',
    storyTh: 'หมู่บ้านชาวไทยเชื้อสายจีนยูนนานริมทะเลสาบสูงชันบนภูเขา ล้อมรอบด้วยไร่ชาขั้นบันไดและไอหมอกลอยเหนือน้ำในยามเช้า มีอาหารยูนนานต้นตำรับและชาอู่หลงยอดดอย',
    storyEn: 'A high-altitude Yunnanese heritage settlement encircling a serene alpine reservoir. Surrounded by layered tea plantations and morning mists, famous for hot Yunnan claypots.',
    specialtiesTh: ['ล่องเรือไม้โบราณในสายหมอก', 'ขาหมูหมั่นโถวยูนนาน', 'ชาอู่หลงก้านอ่อน'],
    specialtiesEn: ['Traditional Mist Boat Ride', 'Yunnanese Stewed Pork with Buns', 'Tender Stem Oolong Tea']
  },
  {
    id: 'sme-khao-sok-bamboo-rafting',
    en: 'Uncle Somchai Khao Sok Eco-Raft',
    th: 'แพไม้ไผ่ลุงสมชาย รักษ์เขาสก',
    category: 'culture',
    isSme: true,
    smeBadge: 'Local SME Spotlight',
    province: 'surat-thani',
    provinceNameTh: 'สุราษฎร์ธานี',
    provinceNameEn: 'Surat Thani',
    locEn: 'Phanom, Surat Thani',
    locTh: 'อ.พนม จ.สุราษฎร์ธานี',
    lat: 8.9165,
    lon: 98.5320,
    rating: 4.92,
    reviewsCount: 145,
    priceFrom: 400,
    currency: 'THB',
    openHours: '07:30 - 17:30 น.',
    isOpen: true,
    phone: '087-229-8765',
    photo: 'karst-lake.webp',
    gallery: ['karst-lake.webp', 'hero-forest.webp', 'mountain-lake.webp'],
    visit: '3h',
    storyTh: 'บริการล่องแพไม้ไผ่แม่น้ำศกโดยชาวบ้านท้องถิ่น จิบกาแฟคั่วสดในกระบอกไม้ไผ่กลางลำน้ำ สัมผัสทัศนียภาพหน้าผาหินปูนอายุหลายล้านปีและพรรณไม้น้ำหายาก',
    storyEn: 'Authentic bamboo river rafting guided by native Sok valley villagers. Sip fresh coffee brewed directly inside wild green bamboo tubes while admiring ancient limestone karsts.',
    specialtiesTh: ['กาแฟกระบอกไม้ไผ่กลางสายน้ำ', 'ล่องแพชมถ้ำประกายเพชร', 'ขนมจากใบตองป่า'],
    specialtiesEn: ['Bamboo Cylinder Hot Drip Coffee', 'Diamond Sparkle Cave Tour', 'Wild Banana Leaf Sweet Treat']
  },
  {
    id: 'sme-koh-yao-fisherman-table',
    en: 'Koh Yao Fishermen Community Kitchen',
    th: 'ครัวชาวเลชุมชน เกาะยาวน้อย',
    category: 'food',
    isSme: true,
    smeBadge: 'Hidden Gem',
    province: 'phang-nga',
    provinceNameTh: 'พังงา',
    provinceNameEn: 'Phang Nga',
    locEn: 'Koh Yao Noi, Phang Nga',
    locTh: 'เกาะยาวน้อย จ.พังงา',
    lat: 8.1250,
    lon: 98.6040,
    rating: 4.88,
    reviewsCount: 220,
    priceFrom: 180,
    currency: 'THB',
    openHours: '11:00 - 21:00 น.',
    isOpen: true,
    phone: '082-998-3344',
    photo: 'coast-overlook.webp',
    gallery: ['coast-card.webp', 'coast-tall.webp', 'ridge-view.webp'],
    visit: '1.5h',
    storyTh: 'ร้านอาหารริมกระชังปลาของกลุ่มประมงพื้นบ้านเกาะยาว เสิร์ฟอาหารทะเลสดจากอวนวันต่อวัน ปรุงด้วยเครื่องแกงตำมือสูตรปักษ์ใต้แท้ ไร้สารเคมี และสนับสนุนวิถีอนุรักษ์ทะเล',
    storyEn: 'A sustainable fisherfolks’ kitchen beside floating fish pens on Koh Yao Noi. Catch-of-the-day seafood seasoned with home-pounded Southern Thai chili paste overlooking Phang Nga Bay.',
    specialtiesTh: ['แกงส้มปลากะพงยอดมะพร้าวอ่อน', 'ปลาหมึกไข่ต้มหวานสมุนไพร', 'ยำสาหร่ายข้อพื้นเมือง'],
    specialtiesEn: ['Sour Curry with Seabass & Young Coconut', 'Herbal Sweet Stewed Squid', 'Local Sea Grape Caviar Salad']
  }
];

/**
 * Calculates straight line distance (Haversine formula in km)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Number(dist.toFixed(dist < 1 ? 2 : 1));
}

/**
 * Marker clustering algorithm: groups markers within screen/degree radius
 */
export function clusterPlaces(places, radiusDeg = 0.04) {
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < places.length; i++) {
    if (visited.has(places[i].id)) continue;
    const base = places[i];
    visited.add(base.id);

    const group = [base];
    for (let j = i + 1; j < places.length; j++) {
      if (visited.has(places[j].id)) continue;
      const target = places[j];
      const dist = Math.hypot(base.lat - target.lat, base.lon - target.lon);
      if (dist < radiusDeg) {
        group.push(target);
        visited.add(target.id);
      }
    }

    if (group.length > 1) {
      const avgLat = group.reduce((acc, p) => acc + p.lat, 0) / group.length;
      const avgLon = group.reduce((acc, p) => acc + p.lon, 0) / group.length;
      const hasSme = group.some(p => p.isSme);
      clusters.push({
        isCluster: true,
        id: 'cluster-' + group.map(p => p.id).join('-'),
        count: group.length,
        lat: avgLat,
        lon: avgLon,
        hasSme,
        places: group
      });
    } else {
      clusters.push({
        isCluster: false,
        ...base
      });
    }
  }

  return clusters;
}
