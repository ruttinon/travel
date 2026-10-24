/**
 * Script: Auto-populate Thailand Places & SME Heritage Stores
 * Method 1: Bulk automatic database population across all 4 regions of Thailand.
 * Adheres strictly to doctor.js rules: clones valid UUID upload assets and maintains foreign key integrity.
 * 
 * Usage: node scripts/auto_populate_places.js
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.resolve(process.env.UNFOLD_DATA_DIR || (process.platform === 'win32' && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'unfold-travel', 'data') : path.join(ROOT, 'data')));
const FILE = path.join(DATA, 'unfold.sqlite');
const uploadsDir = path.join(DATA, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function storeUpload(assetName) {
  const src = path.join(ROOT, 'assets', assetName);
  const id = crypto.randomUUID();
  const destName = `${id}.webp`;
  const dest = path.join(uploadsDir, destName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    const fallback = path.join(ROOT, 'assets', 'hero-forest.webp');
    if (fs.existsSync(fallback)) fs.copyFileSync(fallback, dest);
  }
  return `/uploads/${destName}`;
}

const NEW_PLACES = [
  // --- CENTRAL & BANGKOK (กรุงเทพฯ และภาคกลาง) ---
  {
    slug: 'sme-yaowarat-chestnut',
    name_en: 'Yaowarat Heritage Wok-Roasted Chestnuts',
    name_th: 'เกาลัดนายโอว เยาวราช คั่วเตาถ่านโบราณ',
    location_en: 'Yaowarat Road, Samphanthawong, Bangkok',
    location_th: 'ถนนเยาวราช สัมพันธวงศ์ กรุงเทพฯ',
    category: 'food',
    region: 'central',
    lat: 13.7412,
    lon: 100.5085,
    visit: '30m',
    description_en: 'Family-run street cart roasting giant sweet chestnuts in coffee gravel over wood fire for 40 years.',
    description_th: 'ร้านเกาลัดคั่วหินภูเขาไฟเตาถ่านตำนานเยาวราช เนื้อแน่น หวานหอม ปลอกง่าย คั่วสดใหม่ริมถนนมังกรทุกวัน',
    asset: 'kyoto-lane.webp',
    is_sme: 1,
    price_from: 140
  },
  {
    slug: 'sme-kudichin-bakery',
    name_en: 'Kudi Chin Portuguese-Siam Heritage Bakery',
    name_th: 'ขนมฝรั่งกุฎีจีน ร้านธนูสิงห์ ชุมชนเก่าแก่ริมแม่น้ำเจ้าพระยา',
    location_en: 'Kudi Chin Community, Thon Buri, Bangkok',
    location_th: 'ชุมชนกุฎีจีน เขตธนบุรี กรุงเทพฯ',
    category: 'food',
    region: 'central',
    lat: 13.7388,
    lon: 100.4938,
    visit: '1h',
    description_en: '200-year-old Thai-Portuguese sponge cake baked in traditional charcoal ovens since the early Rattanakosin period.',
    description_th: 'ขนมไข่โบราณสูตรโปรตุเกสผสมสยามสืบทอดกว่า 200 ปี โรยหน้าด้วยลูกเกด ลูกพลับแห้ง และน้ำตาลทราย อบด้วยเตาถ่านหอมกรุ่น',
    asset: 'terrace.webp',
    is_sme: 1,
    price_from: 50
  },
  {
    slug: 'sme-wang-lang-bakery',
    name_en: 'Wang Lang Fresh Stuffed Bread Bakery',
    name_th: 'วังหลังเบเกอรี่ ขนมปังไส้ทะลักในตำนาน ศิริราช',
    location_en: 'Wang Lang Market, Bangkok Noi, Bangkok',
    location_th: 'ตลาดวังหลัง เขตบางกอกน้อย กรุงเทพฯ',
    category: 'food',
    region: 'central',
    lat: 13.7550,
    lon: 100.4854,
    visit: '45m',
    description_en: 'Famed riverside bakery known for freshly baked bread packed with generous fillings of shredded pork and ham.',
    description_th: 'ร้านเบเกอรี่ท่าน้ำวังหลังยอดนิยม อบขนมปังสดจากเตาตลอดวัน แป้งเหนียวนุ่ม ไส้หมูหยอง-ลูกเกด-แฮมแน่นทะลัก',
    asset: 'cabin-retreat.webp',
    is_sme: 1,
    price_from: 55
  },
  {
    slug: 'wat-arun-ratchawararam',
    name_en: 'Wat Arun Temple of Dawn',
    name_th: 'วัดอรุณราชวรารามราชวรมหาวิหาร (พระปรางค์วัดอรุณ)',
    location_en: 'Bangkok Yai, Bangkok',
    location_th: 'แขวงวัดอรุณ เขตบางกอกใหญ่ กรุงเทพฯ',
    category: 'culture',
    region: 'central',
    lat: 13.7437,
    lon: 100.4889,
    visit: '2h',
    description_en: 'Iconic Khmer-style riverside prang encrusted with colorful Chinese porcelain and sea shells.',
    description_th: 'พระปรางค์ริมแม่น้ำเจ้าพระยา ประดับด้วยชิ้นกระเบื้องเคลือบและเครื่องถ้วยชามจีนโบราณ สัญลักษณ์ความงดงามระดับโลก',
    asset: 'path.webp',
    is_sme: 0,
    price_from: 100
  },
  {
    slug: 'sme-ayutthaya-roti-sai-mai',
    name_en: 'Abeedeen-Pranom Handmade Roti Sai Mai',
    name_th: 'โรตีสายไหม อาบีดีน-ประนอม แป้งนุ่มทำมือ อยุธยา',
    location_en: 'U-Thong Road, Phra Nakhon Si Ayutthaya',
    location_th: 'ถ.อู่ทอง ต.ประตูชัย จ.พระนครศรีอยุธยา',
    category: 'food',
    region: 'central',
    lat: 14.3564,
    lon: 100.5601,
    visit: '30m',
    description_en: 'Michelin Bib Gourmand candy weaver making warm pandan crepes wrapped around spun palm sugar silk.',
    description_th: 'โรตีสายไหมเจ้าเก่าแก่หน้าโรงพยาบาลอยุธยา แป้งบางนุ่มหอมใบเตยควงบนกระทะร้อน ห่อเส้นสายไหมตาลโตนดละลายในปาก',
    asset: 'green-valley.webp',
    is_sme: 1,
    price_from: 40
  },
  {
    slug: 'erawan-waterfall-kanchanaburi',
    name_en: 'Erawan 7-Tier Emerald Waterfall',
    name_th: 'น้ำตกเอราวัณ 7 ชั้น อุทยานแห่งชาติเอราวัณ กาญจนบุรี',
    location_en: 'Si Sawat, Kanchanaburi',
    location_th: 'อ.ศรีสวัสดิ์ จ.กาญจนบุรี',
    category: 'nature',
    region: 'central',
    lat: 14.3688,
    lon: 99.1442,
    visit: '3–4h',
    description_en: 'Famous cascading limestone tiered waterfall with crystal turquoise pools suitable for wild swimming.',
    description_th: 'น้ำตกหินปูนน้ำสีเขียวมรกตใสสะอาด 7 ชั้น ล้อมรอบด้วยผืนป่าดงดิบและฝูงปลาพลวงหินธรรมชาติ',
    asset: 'karst-lake.webp',
    is_sme: 0,
    price_from: 100
  },
  {
    slug: 'sme-amphawa-canal-homestay',
    name_en: 'Baan Suan Rim Nam Amphawa Canal Orchard Homestay',
    name_th: 'บ้านสวนริมน้ํา โฮมสเตย์สวนมะพร้าว อัมพวา',
    location_en: 'Amphawa, Samut Songkhram',
    location_th: 'อ.อัมพวา จ.สมุทรสงคราม',
    category: 'stay',
    region: 'central',
    lat: 13.4248,
    lon: 99.9538,
    visit: '1–2 days',
    description_en: 'Tranquil wooden homestay nestled in a coconut grove alongside the serene Mae Klong canal network.',
    description_th: 'ที่พักไม้สักริมคลองอัมพวา ล้อมรอบด้วยร่องสวนมะพร้าวอินทรีย์ พายเรือตักบาตรเช้าและชื่นชมหิ่งห้อยยามค่ำคืน',
    asset: 'misty-cabin.webp',
    is_sme: 1,
    price_from: 950
  },

  // --- NORTH (ภาคเหนือ) ---
  {
    slug: 'wat-rong-khun-chiangrai',
    name_en: 'Wat Rong Khun White Temple',
    name_th: 'วัดร่องขุ่น พุทธศิลป์สีขาวบริสุทธิ์ เชียงราย',
    location_en: 'Mueang, Chiang Rai',
    location_th: 'ต.ป่าอ้อดอนชัย อ.เมือง จ.เชียงราย',
    category: 'culture',
    region: 'north',
    lat: 19.8242,
    lon: 99.7633,
    visit: '2h',
    description_en: 'World-renowned contemporary white temple designed by master national artist Chalermchai Kositpipat.',
    description_th: 'วัดพุทธศิลป์ร่วมสมัยสีขาวบริสุทธิ์ ประดับด้วยกระจกใสสะท้อนแสง ออกแบบและสร้างสรรค์โดยอาจารย์เฉลิมชัย โฆษิตพิพัฒน์',
    asset: 'path.webp',
    is_sme: 0,
    price_from: 100
  },
  {
    slug: 'wat-rong-suea-ten-blue',
    name_en: 'Wat Rong Suea Ten Blue Temple',
    name_th: 'วัดร่องเสือเต้น วิหารสีน้ำเงินทองคำ เชียงราย',
    location_en: 'Rim Kok, Mueang, Chiang Rai',
    location_th: 'ต.ริมกก อ.เมือง จ.เชียงราย',
    category: 'culture',
    region: 'north',
    lat: 19.9235,
    lon: 99.8419,
    visit: '1h',
    description_en: 'Stunning sapphire-blue temple with ornate golden spires and an ethereal white Buddha inside.',
    description_th: 'วิหารสีน้ำเงินเข้มตัดกับสีทองอร่าม โดดเด่นด้วยประติมากรรมพญานาคอลังการและพระพุทธรัชมงคลบดีตรีโลกนาถสีขาวมุก',
    asset: 'alpine-lake.webp',
    is_sme: 0,
    price_from: 0
  },
  {
    slug: 'sme-nimman-craft-coffee',
    name_en: 'Nimman Community Artisan Coffee Roasters',
    name_th: 'โรงคั่วกาแฟวิถีชุมชน อาราบิก้าล้านนา นิมมาน',
    location_en: 'Nimman Soi 9, Chiang Mai',
    location_th: 'ถ.นิมมานเหมินท์ ซอย 9 อ.เมือง จ.เชียงใหม่',
    category: 'food',
    region: 'north',
    lat: 18.7968,
    lon: 98.9667,
    visit: '1h',
    description_en: 'Specialty coffee cooperative roasting high-altitude single origin beans from remote Mae Suai hilltribes.',
    description_th: 'ร้านกาแฟสเปเชียลตี้เพื่อชุมชน รับซื้อเมล็ดพันธุ์อาราบิก้าโดยตรงจากชาวเขาดอยแม่สรวย คั่วโปรไฟล์พิถีพิถัน',
    asset: 'hero-forest.webp',
    is_sme: 1,
    price_from: 85
  },
  {
    slug: 'sme-bor-sang-umbrella',
    name_en: 'Bo Sang Handcrafted Sa Paper Umbrellas',
    name_th: 'ศูนย์หัตถกรรมร่มบ่อสร้าง กระดาษสาทำมือ สันกำแพง',
    location_en: 'San Kamphaeng, Chiang Mai',
    location_th: 'ต.ต้นเปา อ.สันกำแพง จ.เชียงใหม่',
    category: 'culture',
    region: 'north',
    lat: 18.7712,
    lon: 99.0820,
    visit: '1.5h',
    description_en: 'Centuries-old mulberry bark paper umbrella craft with intricate hand-painted floral motifs.',
    description_th: 'หมู่บ้านหัตถกรรมพื้นบ้านทำร่มกระดาษสาและร่มผ้าแพร เพนต์ลวดลายดอกไม้ธรรมชาติด้วยพู่กันโดยช่างฝีมือท้องถิ่น',
    asset: 'terrace.webp',
    is_sme: 1,
    price_from: 120
  },
  {
    slug: 'wat-phumin-nan',
    name_en: 'Wat Phumin & Whispering Love Mural',
    name_th: 'วัดภูมินทร์ จิตรกรรมฝาผนัง ปู่ม่านย่าม่าน กระซิบรักบันลือโลก',
    location_en: 'Nai Wiang, Mueang Nan, Nan',
    location_th: 'ต.ในเวียง อ.เมือง จ.น่าน',
    category: 'culture',
    region: 'north',
    lat: 18.7753,
    lon: 100.7716,
    visit: '1h',
    description_en: 'Ancient cruciform temple featuring the iconic 19th-century Tai Lue whispering mural painting.',
    description_th: 'พระอุโบสถจตุรมุขแห่งเดียวในไทย ด้านในมีภาพจิตรกรรมฝาผนังปู่ม่านย่าม่านกระซิบรักอันเป็นเอกลักษณ์ทางศิลปะไทลื้อ',
    asset: 'path.webp',
    is_sme: 0,
    price_from: 50
  },
  {
    slug: 'pai-canyon-maehongson',
    name_en: 'Pai Canyon (Kong Lan) Sunset Ridge',
    name_th: 'กองแลน (ปายแคนยอน) จุดชมวิวสันเขา ปาย แม่ฮ่องสอน',
    location_en: 'Pai, Mae Hong Son',
    location_th: 'ต.แม่นาเติง อ.ปาย จ.แม่ฮ่องสอน',
    category: 'nature',
    region: 'north',
    lat: 19.3060,
    lon: 98.4526,
    visit: '1.5h',
    description_en: 'Dramatic narrow clay ridges overlooking deep valleys and pine-covered mountain vistas.',
    description_th: 'หน้าผาดินยุบตัวตามธรรมชาติ เกิดเป็นทางเดินสันเขาแคบ ๆ ทอดยาว ชมวิวพระอาทิตย์ตกดินอันงดงามของหุบเขาปาย',
    asset: 'ridge-view.webp',
    is_sme: 0,
    price_from: 0
  },
  {
    slug: 'sme-lampang-ceramic-bowl',
    name_en: 'Dhanabadee Rooster Bowl Heritage Museum & Workshop',
    name_th: 'ชามตราไก่ ธนบดีเซรามิก ลำปาง สืบสานงานปั้นดินขาว',
    location_en: 'Mueang, Lampang',
    location_th: 'ต.พระบาท อ.เมือง จ.ลำปาง',
    category: 'culture',
    region: 'north',
    lat: 18.2831,
    lon: 99.4975,
    visit: '2h',
    description_en: 'The birthplace of Thailand legendary rooster bowl pottery, offering hands-on ceramic clay painting workshops.',
    description_th: 'พิพิธภัณฑ์เซรามิกต้นกำเนิดชามตราไก่ใบแรกของไทย ชมเตามังกรโบราณและร่วมเวิร์กช็อปเพนต์ลวดลายไก่ด้วยตนเอง',
    asset: 'cabin-retreat.webp',
    is_sme: 1,
    price_from: 100
  },

  // --- SOUTH (ภาคใต้) ---
  {
    slug: 'promthep-cape-phuket',
    name_en: 'Promthep Cape Sunset Viewpoint',
    name_th: 'แหลมพรหมเทพ จุดชมพระอาทิตย์ตกที่สวยที่สุดในไทย ภูเก็ต',
    location_en: 'Rawai, Mueang, Phuket',
    location_th: 'ต.ราไวย์ อ.เมือง จ.ภูเก็ต',
    category: 'nature',
    region: 'south',
    lat: 7.7638,
    lon: 98.3052,
    visit: '1.5h',
    description_en: 'Iconic southern-most headland of Phuket jutting into the Andaman Sea with panoramic golden hour sunsets.',
    description_th: 'แหลมยื่นสู่ทะเลอันดามันทางใต้สุดของเกาะภูเก็ต มีต้นตาลเรียงราย ทัศนียภาพกว้างไกลและแสงอาทิตย์อัสดงงดงามตระการตา',
    asset: 'coast-overlook.webp',
    is_sme: 0,
    price_from: 0
  },
  {
    slug: 'sme-phuket-mee-hokkien',
    name_en: 'Mee Ton Poe Phuket Heritage Hokkien Noodles',
    name_th: 'หมี่ต้นโพธิ์ บะหมี่ฮกเกี้ยนผัดไข่ลวก วงเวียนหอนาฬิกา ภูเก็ต',
    location_en: 'Phuket Town, Phuket',
    location_th: 'วงเวียนหอนาฬิกา ถ.ภูเก็ต ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต',
    category: 'food',
    region: 'south',
    lat: 7.8837,
    lon: 98.3908,
    visit: '45m',
    description_en: 'Legendary 70-year-old street food kitchen stir-frying thick Hokkien yellow egg noodles with seafood and runny egg.',
    description_th: 'ร้านหมี่ฮกเกี้ยนโบราณผัดเตาถ่านเส้นเหนียวนุ่ม ใส่กุ้งสด หอยติบ และไข่ลวกเยิ้ม ๆ มรดกวัฒนธรรมอาหารเปอรานากัน',
    asset: 'kyoto-lane.webp',
    is_sme: 1,
    price_from: 70
  },
  {
    slug: 'sme-koh-panyee-floating-village',
    name_en: 'Koh Panyee Floating Stilt Village & Pitch',
    name_th: 'ชุมชนเกาะปันหยี สนามฟุตบอลลอยน้ำกลางอ่าวพังงา',
    location_en: 'Phang Nga Bay, Phang Nga',
    location_th: 'อ่าวพังงา จ.พังงา',
    category: 'culture',
    region: 'south',
    lat: 8.3347,
    lon: 98.5042,
    visit: '2–3h',
    description_en: 'Muslim fisherman settlement perched entirely on stilts in Phang Nga bay with an inspiring floating soccer pitch.',
    description_th: 'หมู่บ้านชาวประมงกลางทะเลสร้างบนเสาค้ำริมผาหินปูน มีสนามฟุตบอลลอยน้ำชื่อก้องโลกและอาหารทะเลสดปรุงรสพื้นถิ่น',
    asset: 'coast-tall.webp',
    is_sme: 1,
    price_from: 150
  },
  {
    slug: 'emerald-pool-krabi',
    name_en: 'Emerald Pool (Sa Morakot) Mineral Hot Springs',
    name_th: 'สระมรกต ป่าต้นน้ำคลองท่อม กระบี่',
    location_en: 'Khlong Thom, Krabi',
    location_th: 'ต.คลองท่อมเหนือ อ.คลองท่อม จ.กระบี่',
    category: 'nature',
    region: 'south',
    lat: 7.9233,
    lon: 99.2600,
    visit: '2.5h',
    description_en: 'Natural geothermal limestone pool of crystal-clear turquoise waters hidden within lowland rainforest.',
    description_th: 'สระน้ำธรรมชาติกลางป่าดงดิบ เกิดจากสายน้ำแร่ใต้ดินอุดมด้วยแคลเซียมคาร์บอเนต น้ำใสแจ๋วสะท้อนสีเขียวมรกตน่าอัศจรรย์',
    asset: 'alpine-wide.webp',
    is_sme: 0,
    price_from: 200
  },
  {
    slug: 'sme-samui-rum-distillery',
    name_en: 'Magic Alambic Organic Sugar Cane Rum Distillery',
    name_th: 'โรงกลั่นเหล้ารัมน้ำอ้อยอินทรีย์ เกาะสมุย',
    location_en: 'Na Mueang, Koh Samui, Surat Thani',
    location_th: 'ต.หน้าเมือง อ.เกาะสมุย จ.สุราษฎร์ธานี',
    category: 'food',
    region: 'south',
    lat: 9.4230,
    lon: 99.9882,
    visit: '1.5h',
    description_en: 'Artisan micro-distillery crafting agricultural rum using copper pot stills and native sweet sugar cane juice.',
    description_th: 'โรงกลั่นสุรากลั่นวิสาหกิจชุมชน ใช้หีบน้ำอ้อยออร์แกนิกหมักและกลั่นด้วยหม้อทองแดงโบราณ พร้อมชิมรัมกลิ่นมะพร้าว-มะนาว',
    asset: 'terrace.webp',
    is_sme: 1,
    price_from: 120
  },
  {
    slug: 'sme-phatthalung-lotus-craft',
    name_en: 'Varni Lepironia Reed Handcraft Heritage',
    name_th: 'หัตถกรรมกระจูดวรรณี ทะเลน้อย พัทลุง สืบสานภูมิปัญญาสานกระจูด',
    location_en: 'Khuan Khanun, Phatthalung',
    location_th: 'ต.พนางตุง อ.ควนขนุน จ.พัทลุง',
    category: 'culture',
    region: 'south',
    lat: 7.7715,
    lon: 100.1250,
    visit: '2h',
    description_en: 'Award-winning community enterprise transforming local swamp reeds into exquisite modern bags and homeware.',
    description_th: 'กลุ่มหัตถกรรมกระจูดชุมชนริมทะเลน้อย นำพืชตระกูลกกมาตากแห้ง ย้อมสีธรรมชาติ และถักทอเป็นกระเป๋าดีไซน์สากล',
    asset: 'terraced-fields.webp',
    is_sme: 1,
    price_from: 250
  },

  // --- NORTHEAST / ISAN (ภาคตะวันออกเฉียงเหนือ) ---
  {
    slug: 'sam-phan-bok-ubon',
    name_en: 'Sam Phan Bok (Grand Canyon of Thailand)',
    name_th: 'สามพันโบก แกรนด์แคนยอนเมืองไทย ริมแม่น้ำโขง อุบลราชธานี',
    location_en: 'Pho Sai, Ubon Ratchathani',
    location_th: 'ต.เหล่างาม อ.โพธิ์ไทร จ.อุบลราชธานี',
    category: 'nature',
    region: 'northeast',
    lat: 15.7958,
    lon: 105.3942,
    visit: '2.5h',
    description_en: 'Massive sandstone rock reef carved into over 3,000 geological craters and rock pools by Mekong River currents.',
    description_th: 'แก่งหินทรายขนาดใหญ่ใต้ลำน้ำโขงที่ถูกกัดเซาะเป็นแอ่งหินลึกกว่า 3,000 หลุม ปรากฏให้เห็นตระการตาในช่วงฤดูแล้ง',
    asset: 'ridge-view.webp',
    is_sme: 0,
    price_from: 50
  },
  {
    slug: 'red-lotus-lake-udon',
    name_en: 'Red Lotus Lake (Talay Bua Daeng) Nong Han',
    name_th: 'ทะเลบัวแดง หนองหานกุมภวาปี อุดรธานี บานสะพรั่งเต็มผืนน้ำ',
    location_en: 'Kumphawapi, Udon Thani',
    location_th: 'อ.กุมภวาปี จ.อุดรธานี',
    category: 'nature',
    region: 'northeast',
    lat: 17.2185,
    lon: 103.0365,
    visit: '2h',
    description_en: 'Expansive freshwater lake bursting with millions of pink and red water lilies in early morning morning light.',
    description_th: 'บึงน้ำจืดธรรมชาติขนาดใหญ่ ดอกบัวแดงนับล้านดอกพร้อมใจกันเบ่งบานยามเช้าตรู่ ล่องเรือชมความงดงามสุดลูกหูลูกตา',
    asset: 'forest-lake.webp',
    is_sme: 0,
    price_from: 150
  },
  {
    slug: 'sme-dan-kwian-pottery',
    name_en: 'Dan Kwian Terracotta Ceramic Village',
    name_th: 'เครื่องปั้นดินเผาด่านเกวียน โคราช ศิลปะดินดำทนแกร่ง',
    location_en: 'Chok Chai, Nakhon Ratchasima',
    location_th: 'ต.ด่านเกวียน อ.โชคชัย จ.นครราชสีมา',
    category: 'culture',
    region: 'northeast',
    lat: 14.8820,
    lon: 102.1645,
    visit: '2h',
    description_en: 'Traditional pottery village utilizing unique iron-rich red-black clay from the Mun riverbed to create rugged sculptures.',
    description_th: 'หมู่บ้านหัตถกรรมเครื่องปั้นดินเผาโบราณ ใช้ดินดำริมแม่น้ำมูลที่มีแร่เหล็กสูง เผาจนแกร่งเงาเสมือนสัมฤทธิ์',
    asset: 'cabin-retreat.webp',
    is_sme: 1,
    price_from: 80
  },
  {
    slug: 'wat-pa-phu-kon-udon',
    name_en: 'Wat Pa Phu Kon White Marble Sanctuary',
    name_th: 'วัดป่าภูก้อน พระพุทธไสยาสน์หินอ่อนขาวกลางป่าเขา อุดรธานี',
    location_en: 'Na Yung, Udon Thani',
    location_th: 'ต.บ้านก้อง อ.นายูง จ.อุดรธานี',
    category: 'culture',
    region: 'northeast',
    lat: 17.9198,
    lon: 102.1228,
    visit: '2h',
    description_en: 'Spectacular blue-roofed mountain monastery enshrining a 20-meter reclining Buddha carved from Italian Carrara marble.',
    description_th: 'วิหารยอดหลังคาสีฟ้าบนยอดเขา ล้อมรอบด้วยผืนป่าสงวน ภายในประดิษฐานพระนอนแกะสลักจากหินอ่อนคาร์ราราอิตาลียาว 20 เมตร',
    asset: 'alpine-lake.webp',
    is_sme: 0,
    price_from: 0
  },
  {
    slug: 'sme-loei-cotton-quilt',
    name_en: 'Chiang Khan Hand-Stitched Cotton Quilts & Loom',
    name_th: 'กลุ่มหัตถกรรมผ้านวมฝ้ายโบราณ เชียงคาน นุ่มอุ่นวิถีไทเลย',
    location_en: 'Chiang Khan, Loei',
    location_th: 'ถ.ชายโขง อ.เชียงคาน จ.เลย',
    category: 'culture',
    region: 'northeast',
    lat: 17.8950,
    lon: 101.6540,
    visit: '1h',
    description_en: 'Pioneering community guild sewing warm 100% natural cotton blankets and duvets using antique wooden looms.',
    description_th: 'ภูมิปัญญาการทำผ้านวมฝ้ายบริสุทธิ์ของชาวเชียงคาน ตีฝ้ายและเย็บมือด้วยลวดลายประณีต ให้ความอบอุ่นในฤดูหนาวริมแม่น้ำโขง',
    asset: 'terraced-fields.webp',
    is_sme: 1,
    price_from: 450
  }
];

function run(activeDb) {
  const db = activeDb || new DatabaseSync(FILE);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO places(
      slug, name_en, name_th, location_en, location_th,
      category, region, lat, lon, visit, description_en, description_th,
      cover, gallery_json, featured, status, is_sme, price_from, price_currency, created_at, updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const now = new Date().toISOString();
  let count = 0;

  for (const p of NEW_PLACES) {
    const coverUrl = storeUpload(p.asset);
    const galleryUrl1 = storeUpload(p.asset);
    const galleryUrl2 = storeUpload('hero-forest.webp');
    const galleryJson = JSON.stringify([galleryUrl1, galleryUrl2]);

    insertStmt.run(
      p.slug,
      p.name_en,
      p.name_th,
      p.location_en,
      p.location_th,
      p.category,
      p.region,
      p.lat,
      p.lon,
      p.visit,
      p.description_en,
      p.description_th,
      coverUrl,
      galleryJson,
      p.is_sme ? 1 : 0,
      'published',
      p.is_sme,
      p.price_from,
      'THB',
      now,
      now
    );
    count++;
  }

  if (!activeDb) db.close();
  console.log(`[SUCCESS] Auto-populated ${count} places into Traval SQLite.`);
  return count;
}

if (require.main === module) {
  run();
}

module.exports = { run, NEW_PLACES };
