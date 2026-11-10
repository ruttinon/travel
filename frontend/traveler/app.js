/* GoAround v3.0 — Travel & Local Discovery Platform Client Application
 * Scope: UX/UI Design & Front-End for User & Map Role
 * Includes:
 * 1. Home / Discover (Fast search, categories with SME chip)
 * 2. Explore Around Me & Local SME Spotlight (Radius pills, Local Only, Local Story rail)
 * 3. Map & Real-Time Location (Live Blue Dot with heading cone, Follow Me, My Location, Marker Clustering, Search This Area)
 * 4. Place Detail Card / Bottom Sheet (3-tier touch draggable sheet: peek/half/full, directions, share, favorite, call)
 * 5. Your Collection (Reactive LocalStorage, Province & SME filters, live badge counter)
 */
'use strict';
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>Array.from(root.querySelectorAll(q));
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const svg={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4m0 4h.01"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
 pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 heart:'<path d="M20.8 4.6a5.3 5.3 0 0 0-7.5 0L12 5.9l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.9a5.3 5.3 0 0 0 0-7.5Z"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
 arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
 left:'<path d="m15 18-6-6 6-6"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 up:'<path d="m6 15 6-6 6 6"/>',
 x:'<path d="m18 6-12 12M6 6l12 12"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 mountain:'<path d="m2 20 8.5-15 4 7 2.5-4L22 20H2Z"/><path d="m8 10 2.5 2 2-2"/>',
 tree:'<path d="m12 3-7 9h4l-5 6h16l-5-6h4l-7-9ZM12 18v3"/>',
 coffee:'<path d="M4 8h12v7a6 6 0 0 1-12 0V8Zm12 2h2a3 3 0 1 1 0 6h-2M3 21h16"/>',
 bed:'<path d="M3 20V5m0 11h18M21 20v-8M3 12h6a3 3 0 0 1 3 3v1M12 12h7a2 2 0 0 1 2 2v2"/>',
 camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="3"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
 map:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2V5ZM9 3v15m6-12v15"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 route:'<path d="m3 17 6 4L21 3 3 9l7 4Z"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 minus:'<path d="M4 12h16"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 sliders:'<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/>',
 star:'<path d="m12 2 3.1 6.5 7.2 1-5.2 5 1.2 7.1-6.3-3.4-6.3 3.4 1.2-7.1-5.2-5 7.2-1L12 2Z"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
 phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
 locate:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
 notebook:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18m3-12h5m-5 4h5"/>',
 moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'
};

function ico(name,size=20){
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg[name]||svg.spark}</svg>`;
}

function calcDistance(lat1, lon1, lat2, lon2) {
 if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) return null;
 const R = 6371;
 const dLat = (lat2 - lat1) * Math.PI / 180;
 const dLon = (lon2 - lon1) * Math.PI / 180;
 const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
 const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 return Number(dist.toFixed(dist < 1 ? 2 : 1));
}

const I18N={
 en:{
   welcome:'Discover differently',enter:'Explore',skip:'Skip intro',discover:'Explore',map:'Map',saved:'Saved',trip:'My trips',profile:'Profile',menu:'Menu',
   homeEyebrow:'LOCAL FIRST DISCOVERY',homeTitle:'Go beyond\nthe ordinary.',homeDesc:'For the places worth finding and local SMEs worth supporting.',homeExplore:'Explore places',homeHint:'Support local communities.',
   exploreEyebrow:'LOCAL SME & GEMS',exploreTitle:'Somewhere new.',exploreIntro:'Discover authentic community heritage and local SMEs.',popular:'Popular places',nearby:'More to wander',showAll:'See all places',
   search:'Search places, stores, or provinces',searchShort:'Search',all:'All',sme:'★ Local SME',nature:'Nature',food:'Food',stay:'Stays',culture:'Culture',
   return:'Back',view:'View place',save:'Save',unsave:'Saved',route:'Directions',addTrip:'Add to trip',removeTrip:'In trip',visit:'Duration',area:'Area',exploreType:'Type',about:'The place',gallery:'Gallery',
   review:'Your private note',notePlaceholder:'What did you discover?',saveNote:'Save note',photoNotice:'Community preview imagery · verify conditions before travel.',dataNotice:'Check opening conditions before visiting.',
   openInMaps:'Open Google Maps',planned:'Trip stops',emptySaved:'Your next favourite place is waiting.',emptyTrip:'No stops yet.',nothing:'No places found',different:'Try another keyword or category.',
   myCollections:'Your collection',collections:'Save your favorites at your own pace.',allSaved:'All places',planTrip:'My trips',clearTrip:'Clear trip',planRoute:'Open trip route',profileSub:'Make GoAround yours.',
   language:'Language',suggest:'Suggest a hidden gem',suggestTitle:'Know somewhere special?',name:'Name',location:'Area / Province',category:'Category',notes:'Notes (optional)',submit:'Save suggestion',
   draftNotice:'Saved as a private draft on this device.',drafts:'Your suggestions',export:'Export my data',reset:'Reset local data',done:'Saved on this device',removed:'Removed',removedTrip:'Removed from trip',
   searchResults:'Search results',mapCaption:'Live map preview · coordinates verified',mapUnavailable:'Tiles unavailable. Place pins still work.',mapArea:'Region',menuSub:'Discover Thailand from another angle.',
   close:'Close',hint:'Design illustrations and authentic coordinates.',more:'See more',copy:'Copy trip',copied:'Copied',homeLink:'Home',titlePlace:'Place details',verified:'Verified',
   mapZoomIn:'Zoom in',mapZoomOut:'Zoom out',clear:'Clear',allRegions:'All locations',regionNorth:'North Thailand',regionCentral:'Bangkok & Central',regionSouth:'South Thailand',regionNortheast:'Northeast Thailand',regionEast:'East Thailand',regionWest:'West Thailand',list:'List',
   spotlightTitle:'Local SME Spotlight',spotlightSub:'Community enterprises and artisan heritage',
   localOnly:'Local Only',followMe:'Follow Me',following:'Following',myLocation:'My Location',searchThisArea:'Search This Area',
   followPaused:'Follow Me paused (dragged map)',localStory:'Local Story',openNow:'Open',closedNow:'Closed',call:'Call'
 },
 th:{
   welcome:'ค้นพบเสน่ห์ชุมชน สนับสนุนร้านค้าท้องถิ่น',enter:'เริ่มสำรวจ',skip:'ข้าม',discover:'สำรวจ',map:'แผนที่',saved:'บันทึก',trip:'ทริปของฉัน',profile:'โปรไฟล์',menu:'เมนู',
   homeEyebrow:'LOCAL FIRST DISCOVERY',homeTitle:'ออกไปเจอ\nอะไรใหม่ ๆ',homeDesc:'ค้นพบสถานที่และร้านค้าชุมชน SME ที่ควรค่าแก่การเดินทาง',homeExplore:'ค้นหาสถานที่',homeHint:'ร่วมกระจายรายได้สู่ชุมชน',
   exploreEyebrow:'เสน่ห์ท้องถิ่นรอคุณอยู่',exploreTitle:'ที่ใหม่ ๆ รอคุณอยู่',exploreIntro:'ค้นพบสถานที่และร้านค้าจากมุมมองคนท้องถิ่นแท้จริง',popular:'สถานที่น่าสนใจ',nearby:'ไปต่อที่ไหนดี',showAll:'ดูทั้งหมด',
   search:'ค้นหาสถานที่, ชื่อร้าน หรือจังหวัด',searchShort:'ค้นหา',all:'ทั้งหมด',sme:'★ ร้านค้าชุมชน SME',nature:'ธรรมชาติ',food:'ของกิน',stay:'ที่พัก',culture:'วัฒนธรรม',
   return:'ย้อนกลับ',view:'ดูสถานที่',save:'บันทึก',unsave:'บันทึกแล้ว',route:'นำทาง',addTrip:'เพิ่มเข้าทริป',removeTrip:'อยู่ในทริปแล้ว',visit:'ระยะเวลา',area:'พื้นที่',exploreType:'ประเภท',about:'เกี่ยวกับ',gallery:'รูปภาพ',
   review:'โน้ตส่วนตัว',notePlaceholder:'คุณค้นพบอะไรที่นี่?',saveNote:'บันทึกโน้ต',photoNotice:'ภาพประกอบวิถีชุมชน · ควรตรวจสอบก่อนเดินทางจริง',dataNotice:'ตรวจสอบเวลาเปิดและข้อมูลก่อนเดินทาง',
   openInMaps:'เปิด Google Maps',planned:'จุดแวะ',emptySaved:'ยังไม่มีสถานที่ที่บันทึก',emptyTrip:'ยังไม่มีจุดแวะ ลองไปสำรวจดูก่อน',nothing:'ไม่พบสถานที่',different:'ลองค้นหาคำอื่นหรือเปลี่ยนหมวด',
   myCollections:'สถานที่ของฉัน',collections:'เก็บสถานที่และร้านโปรดไว้ไปทีหลัง',allSaved:'ทั้งหมด',planTrip:'ทริปของฉัน',clearTrip:'ล้างทริป',planRoute:'เปิดเส้นทางทริป',profileSub:'ปรับแต่ง GoAround ในแบบของคุณ',
   language:'ภาษา',suggest:'แนะนำสถานที่ลับ',suggestTitle:'รู้จักสถานที่ดี ๆ ไหม?',name:'ชื่อสถานที่',location:'พื้นที่ / จังหวัด',category:'ประเภท',notes:'หมายเหตุ (ไม่บังคับ)',submit:'บันทึกร่าง',
   draftNotice:'เก็บเป็นร่างส่วนตัวบนเครื่องนี้',drafts:'ร่างสถานที่',export:'ส่งออกข้อมูล',reset:'ล้างข้อมูลในเครื่อง',done:'บันทึกไว้ในเครื่องแล้ว',removed:'นำออกแล้ว',removedTrip:'นำออกจากทริปแล้ว',
   searchResults:'ผลการค้นหา',mapCaption:'แผนที่พิกัดจริง · พิกัด GPS ได้รับการตรวจสอบ',mapUnavailable:'โหลดแผนที่ไม่ได้ แต่ยังเลือกหมุดได้',mapArea:'พื้นที่',menuSub:'ออกไปเจอโลกจากมุมคนท้องถิ่น',
   close:'ปิด',hint:'ภาพประกอบดีไซน์และพิกัดจริง',more:'เพิ่มเติม',copy:'คัดลอกทริป',copied:'คัดลอกแล้ว',homeLink:'หน้าแรก',titlePlace:'รายละเอียดสถานที่',verified:'ตรวจสอบแล้ว',
   mapZoomIn:'ซูมเข้า',mapZoomOut:'ซูมออก',clear:'ล้าง',allRegions:'ทุกพื้นที่',regionNorth:'ภาคเหนือ',regionCentral:'กรุงเทพฯ และภาคกลาง',regionSouth:'ภาคใต้',regionNortheast:'ภาคอีสาน',regionEast:'ภาคตะวันออก',regionWest:'ภาคตะวันตก',list:'รายการ',
   spotlightTitle:'ร้านค้าท้องถิ่นแนะนำ (Local SME Spotlight)',spotlightSub:'เรื่องราววิถีชุมชนและคุณค่าสินค้าท้องถิ่น',
   localOnly:'เฉพาะร้านชุมชน',followMe:'ติดตามฉัน',following:'กำลังติดตาม',myLocation:'ตำแหน่งของฉัน',searchThisArea:'ค้นหาบริเวณนี้',
   followPaused:'หยุดโหมดติดตามชั่วคราวเนื่องจากเลื่อนแผนที่',localStory:'เรื่องเล่าวิถีชุมชน',openNow:'เปิดอยู่',closedNow:'ปิดแล้ว',call:'โทร'
 }
};

const CATEGORIES=['all','sme','nature','food','stay','culture'];

const SAMPLE_PLACES=[
  // ==========================================
  // 1. NORTH (ภาคเหนือ)
  // ==========================================
  {
    id:'sme-mae-kampong-coffee',
    en:'Doi Pha Mee Charcoal Roasted Coffee',
    th:'โรงคั่วกาแฟเตาฟืน ดอยผาหมี (แม่กำปอง)',
    locEn:'Mae On, Chiang Mai',
    locTh:'อ.แม่ออน จ.เชียงใหม่',
    category:'food',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'hero-forest.webp',
    gallery:['hero-forest.webp','cabin-retreat.webp','terrace.webp'],
    region:'north',
    province:'chiang-mai',
    provinceTh:'เชียงใหม่',
    provinceEn:'Chiang Mai',
    lat:18.8682,
    lon:99.3515,
    rating:4.9,
    reviewsCount:184,
    priceFrom:65,
    currency:'THB',
    visit:'1–2h',
    phone:'089-555-1234',
    openHours:'08:00 - 17:00 น.',
    isOpen:true,
    storyEn:'A local cooperative brewing Arabica roasted slowly over bamboo charcoal firewood.',
    storyTh:'ร้านกาแฟวิสาหกิจชุมชนที่ใช้วิธีการคั่วเมล็ดอาราบิกาแท้บนเตาฟืนไม้ไผ่โบราณ กลิ่นหอมรมควันอันเป็นเอกลักษณ์ รายได้หมุนเวียนกลับสู่กลุ่มเกษตรกรบนดอย',
    specialtiesTh:['กาแฟดริปเตาฟืนดอยผาหมี','ชารอยัลยอดน้ำค้าง','เค้กชาเขียวใบเมี่ยง'],
    googlePlaceId:''
  },
  {
    id:'sme-mon-cham-strawberry',
    en:'Hmong Hilltribe Organic Strawberry Farm',
    th:'ไร่สตรอว์เบอร์รีอินทรีย์ ม่อนแจ่ม (ชาวม้ง)',
    locEn:'Mae Rim, Chiang Mai',
    locTh:'ม่อนแจ่ม อ.แม่ริม จ.เชียงใหม่',
    category:'food',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'ridge-view.webp',
    gallery:['ridge-view.webp','green-valley.webp','alpine-wide.webp'],
    region:'north',
    province:'chiang-mai',
    provinceTh:'เชียงใหม่',
    provinceEn:'Chiang Mai',
    lat:18.9358,
    lon:98.8228,
    rating:4.85,
    reviewsCount:210,
    priceFrom:100,
    currency:'THB',
    visit:'1.5h',
    phone:'081-998-7766',
    openHours:'07:00 - 18:00 น.',
    isOpen:true,
    storyEn:'Organic mountain strawberries grown by native Hmong villagers on hillside terraces.',
    storyTh:'สวนสตรอว์เบอร์รีปลอดสารพิษของกลุ่มเกษตรกรชาวม้งบนม่อนแจ่ม เก็บสดจากต้นพร้อมชมวิวทิวเขาสลับซับซ้อน',
    specialtiesTh:['สตรอว์เบอร์รีพระราชทาน 80 สด','แยมสตรอว์เบอร์รีโฮมเมด','น้ำสตรอว์เบอร์รีสกัดเย็น'],
    googlePlaceId:''
  },
  {
    id:'mae-kampong',
    en:'Mae Kampong Eco-Village',
    th:'หมู่บ้านแม่กำปอง',
    locEn:'Mae On, Chiang Mai',
    locTh:'อ.แม่ออน จ.เชียงใหม่',
    category:'nature',
    isSme:false,
    photo:'hero-forest.webp',
    gallery:['hero-forest.webp','green-valley.webp','cabin-retreat.webp'],
    region:'north',
    province:'chiang-mai',
    provinceTh:'เชียงใหม่',
    provinceEn:'Chiang Mai',
    lat:18.8660,
    lon:99.3470,
    rating:4.85,
    reviewsCount:1420,
    priceFrom:0,
    currency:'THB',
    visit:'2–4h',
    openHours:'เปิดตลอด 24 ชม.',
    isOpen:true,
    storyEn:'A peaceful hillside village tucked into the misty green mountains of northern Thailand.',
    storyTh:'หมู่บ้านท่องเที่ยวเชิงอนุรักษ์กลางหุบเขาเขียวขจี ลำธารธรรมชาติไหลผ่านกลางหมู่บ้าน อากาศเย็นสบายตลอดทั้งปี',
    googlePlaceId:''
  },
  {
    id:'ban-pa-bong-piang',
    en:'Pa Bong Piang Terraced Rice Fields',
    th:'บ้านป่าบงเปียง นาข้าวขั้นบันได',
    locEn:'Mae Chaem, Chiang Mai',
    locTh:'อ.แม่แจ่ม จ.เชียงใหม่',
    category:'nature',
    isSme:false,
    photo:'terraced-fields.webp',
    gallery:['terraced-fields.webp','green-valley.webp','ridge-view.webp'],
    region:'north',
    province:'chiang-mai',
    provinceTh:'เชียงใหม่',
    provinceEn:'Chiang Mai',
    lat:18.4970,
    lon:98.4500,
    rating:4.9,
    reviewsCount:880,
    priceFrom:500,
    currency:'THB',
    visit:'2–3h',
    openHours:'เปิดให้เข้าชมช่วงฤดูทำนา',
    isOpen:true,
    storyEn:'Iconic terraced mountain landscapes with a calm rural rhythm and sea of morning mist.',
    storyTh:'ผืนนาข้าวขั้นบันไดที่งดงามที่สุดแห่งหนึ่งของไทย ท่ามกลางทิวเขาดอยอินทนนท์และสายหมอกยามเช้า',
    googlePlaceId:''
  },
  {
    id:'sme-nan-weaving-homestay',
    en:'Ta Nong Eco-Loom Homestay',
    th:'โฮมสเตย์ทอผ้าไทลื้อ ตานงค์ (ปัว)',
    locEn:'Pua, Nan',
    locTh:'อ.ปัว จ.น่าน',
    category:'stay',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'terraced-fields.webp',
    gallery:['terraced-fields.webp','green-valley.webp','cabin-retreat.webp'],
    region:'north',
    province:'nan',
    provinceTh:'น่าน',
    provinceEn:'Nan',
    lat:19.1764,
    lon:100.9152,
    rating:4.95,
    reviewsCount:96,
    priceFrom:850,
    currency:'THB',
    visit:'1–2 days',
    phone:'085-709-3421',
    openHours:'เปิดรับผู้เข้าพักทุกวัน',
    isOpen:true,
    storyEn:'Teakwood eco-homestay amid misty rice terraces of Pua with Tai Lue loom weaving.',
    storyTh:'บ้านพักไม้สักริมคันนาล้อมรอบด้วยไอหมอกดอยภูคา เจ้าของบ้านสอนการทอผ้าลายน้ำไหลโบราณ พร้อมเสิร์ฟขันโตกอาหารพื้นบ้านปลอดสารพิษ',
    specialtiesTh:['ผ้าทอมือลายน้ำไหล','สำรับขันโตกผักอินทรีย์','เวิร์กช็อปย้อมครามธรรมชาติ'],
    googlePlaceId:''
  },
  {
    id:'baan-rak-thai',
    en:'Ban Rak Thai Yunnanese Lakeside Village',
    th:'บ้านรักไทย หมู่บ้านชาจีนยูนนาน',
    locEn:'Mae Hong Son, Thailand',
    locTh:'อ.เมือง จ.แม่ฮ่องสอน',
    category:'stay',
    isSme:false,
    photo:'misty-cabin.webp',
    gallery:['misty-cabin.webp','alpine-wide.webp','cabin-retreat.webp'],
    region:'north',
    province:'mae-hong-son',
    provinceTh:'แม่ฮ่องสอน',
    provinceEn:'Mae Hong Son',
    lat:19.5900,
    lon:97.9400,
    rating:4.75,
    reviewsCount:1650,
    priceFrom:1200,
    currency:'THB',
    visit:'1 day',
    openHours:'เปิดทุกวัน',
    isOpen:true,
    storyEn:'A mountain-lake village settled by Kuomintang descendants famous for oolong tea.',
    storyTh:'หมู่บ้านชาวไทยเชื้อสายจีนยูนนานริมทะเลสาบบนภูเขา ล้อมรอบด้วยไร่ชาขั้นบันไดและสถาปัตยกรรมดินเหนียวดั้งเดิม',
    googlePlaceId:''
  },
  {
    id:'phu-chi-fa-chiangrai',
    en:'Phu Chi Fa Sea of Mist Viewpoint',
    th:'วนอุทยานภูชี้ฟ้า ทะเลหมอกแดนสยาม',
    locEn:'Thoeng, Chiang Rai',
    locTh:'อ.เทิง จ.เชียงราย',
    category:'nature',
    isSme:false,
    photo:'alpine-wide.webp',
    gallery:['alpine-wide.webp','ridge-view.webp','green-valley.webp'],
    region:'north',
    province:'chiang-rai',
    provinceTh:'เชียงราย',
    provinceEn:'Chiang Rai',
    lat:19.8512,
    lon:100.4533,
    rating:4.9,
    reviewsCount:1120,
    priceFrom:0,
    currency:'THB',
    visit:'2–3h',
    openHours:'05:00 - 18:00 น.',
    isOpen:true,
    storyEn:'Iconic cliff point reaching into the morning sea of mist overlooking the Mekong River border.',
    storyTh:'ยอดเขาปลายแหลมชี้ขึ้นสู่ฟ้า จุดชมทะเลหมอกและพระอาทิตย์ขึ้นที่สวยงามที่สุดแห่งหนึ่งของไทย ริมชายแดนไทย-ลาว',
    googlePlaceId:''
  },

  // ==========================================
  // 2. CENTRAL (กรุงเทพฯ และภาคกลาง)
  // ==========================================
  {
    id:'sme-talad-noi-noodle',
    en:'Ba Hao Handmade Egg Noodles',
    th:'บะหมี่ไข่ทำมือ 3 ชั่วอายุคน (ตลาดน้อย)',
    locEn:'Talad Noi, Bangkok',
    locTh:'ตรอกศาลเจ้าโรงเกือก ตลาดน้อย กรุงเทพฯ',
    category:'food',
    isSme:true,
    smeBadge:'Hidden Gem',
    photo:'kyoto-lane.webp',
    gallery:['kyoto-lane.webp','path.webp','terrace.webp'],
    region:'central',
    province:'bangkok',
    provinceTh:'กรุงเทพฯ',
    provinceEn:'Bangkok',
    lat:13.7348,
    lon:100.5135,
    rating:4.8,
    reviewsCount:312,
    priceFrom:60,
    currency:'THB',
    visit:'45m',
    phone:'081-443-8899',
    openHours:'09:00 - 16:30 น.',
    isOpen:true,
    storyEn:'50-year-old lane eatery kneading springy egg noodles using traditional long bamboo poles.',
    storyTh:'ร้านบะหมี่เส้นสดในตรอกเก่าแก่ตลาดน้อย นวดแป้งด้วยไม้ไผ่ยาวตามตำรับกวางตุ้งแท้ น้ำซุปเคี่ยวกระดูกหมูและกุ้งแห้งนานกว่า 8 ชั่วโมง',
    specialtiesTh:['บะหมี่เป๊าะแห้งหมูแดงอบน้ำผึ้ง','เกี๊ยวกุ้งจักรพรรดิ์','น้ำเก๊กฮวยต้มสมุนไพร'],
    googlePlaceId:''
  },
  {
    id:'wat-chaiwatthanaram-ayutthaya',
    en:'Wat Chaiwatthanaram Historic River Temple',
    th:'วัดไชยวัฒนาราม โบราณสถานริมแม่น้ำเจ้าพระยา',
    locEn:'Ayutthaya Historical Park, Ayutthaya',
    locTh:'อ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา',
    category:'culture',
    isSme:false,
    photo:'terrace.webp',
    gallery:['terrace.webp','path.webp','cabin-retreat.webp'],
    region:'central',
    province:'ayutthaya',
    provinceTh:'พระนครศรีอยุธยา',
    provinceEn:'Ayutthaya',
    lat:14.3431,
    lon:100.5419,
    rating:4.88,
    reviewsCount:2400,
    priceFrom:50,
    currency:'THB',
    visit:'2h',
    openHours:'08:00 - 18:30 น.',
    isOpen:true,
    storyEn:'Magnificent Khmer-style royal Buddhist temple on the west bank of Chao Phraya River.',
    storyTh:'พระอารามหลวงริมแม่น้ำเจ้าพระยาศิลปะอยุธยาตอนปลาย โดดเด่นด้วยปรางค์ประธานทรงขอม ยามเย็นแสงพระอาทิตย์อัสดงงดงามตระการตา',
    googlePlaceId:''
  },
  {
    id:'sme-amphawa-coconut-sugar',
    en:'Uncle Chid Traditional Coconut Sugar Stove',
    th:'เตาตาลโบราณลุงชิด น้ำตาลมะพร้าวแท้ อัมพวา',
    locEn:'Amphawa, Samut Songkhram',
    locTh:'ริมคลองอัมพวา จ.สมุทรสงคราม',
    category:'food',
    isSme:true,
    smeBadge:'Hidden Gem',
    photo:'cabin-retreat.webp',
    gallery:['cabin-retreat.webp','green-valley.webp','terrace.webp'],
    region:'central',
    province:'samut-songkhram',
    provinceTh:'สมุทรสงคราม',
    provinceEn:'Samut Songkhram',
    lat:13.4258,
    lon:99.9542,
    rating:4.92,
    reviewsCount:140,
    priceFrom:40,
    currency:'THB',
    visit:'1h',
    phone:'083-441-2233',
    openHours:'08:30 - 17:00 น.',
    isOpen:true,
    storyEn:'Traditional woodfire coconut sugar boiling demonstration by 4th-generation orchard keepers.',
    storyTh:'เตาเคี่ยวน้ำตาลมะพร้าวโบราณด้วยฟืนทางมะพร้าว กลิ่นหอมหวานละมุนจากน้ำหวานช่อดอกมะพร้าวแท้ 100% ไม่ผสมน้ำตาลทราย',
    specialtiesTh:['น้ำตาลมะพร้าวแท้เคี่ยวเตาฟืน','น้ำหวานดอกมะพร้าวสดแช่เย็น','ขนมจากมะพร้าวอ่อน'],
    googlePlaceId:''
  },
  {
    id:'sme-bang-kachao-bicycle',
    en:'Baan Thong Organic Farm & Bicycle Hub',
    th:'บ้านทองฟาร์ม & ปั่นจักรยานโอโซนบางกะเจ้า',
    locEn:'Bang Kachao, Samut Prakan',
    locTh:'คุ้งบางกะเจ้า จ.สมุทรปราการ',
    category:'nature',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'green-valley.webp',
    gallery:['green-valley.webp','hero-forest.webp','path.webp'],
    region:'central',
    province:'samut-prakan',
    provinceTh:'สมุทรปราการ',
    provinceEn:'Samut Prakan',
    lat:13.6968,
    lon:100.5702,
    rating:4.86,
    reviewsCount:195,
    priceFrom:80,
    currency:'THB',
    visit:'3–4h',
    phone:'086-112-9900',
    openHours:'08:00 - 18:00 น.',
    isOpen:true,
    storyEn:'Lush green ozone oasis beside Bangkok offering scenic elevated cycling trails and organic orchard cafe.',
    storyTh:'ปอดสีเขียวกลางแม่น้ำเจ้าพระยา ปั่นจักรยานบนทางเลียบสวนร่มรื่น แวะจิบเครื่องดื่มสมุนไพรและทานอาหารจากสวนเกษตรอินทรีย์',
    specialtiesTh:['เช่าจักรยานเที่ยวรอบคุ้งบางกะเจ้า','น้ำผึ้งชันโรงแท้สวนผสม','น้ำมะนาวโห่โซดา'],
    googlePlaceId:''
  },

  // ==========================================
  // 3. SOUTH (ภาคใต้)
  // ==========================================
  {
    id:'sme-khao-sok-raft',
    en:'Uncle Somchai Khao Sok Eco-Raft',
    th:'แพไม้ไผ่ลุงสมชาย รักษ์เขาสก',
    locEn:'Phanom, Surat Thani',
    locTh:'อ.พนม จ.สุราษฎร์ธานี',
    category:'culture',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'karst-lake.webp',
    gallery:['karst-lake.webp','hero-forest.webp','mountain-lake.webp'],
    region:'south',
    province:'surat-thani',
    provinceTh:'สุราษฎร์ธานี',
    provinceEn:'Surat Thani',
    lat:8.9165,
    lon:98.5320,
    rating:4.92,
    reviewsCount:145,
    priceFrom:400,
    currency:'THB',
    visit:'3h',
    phone:'087-229-8765',
    openHours:'07:30 - 17:30 น.',
    isOpen:true,
    storyEn:'Bamboo river rafting guided by native Sok valley villagers with bamboo drip coffee.',
    storyTh:'บริการล่องแพไม้ไผ่แม่น้ำศกโดยชาวบ้านท้องถิ่น จิบกาแฟคั่วสดในกระบอกไม้ไผ่กลางลำน้ำ สัมผัสทัศนียภาพหน้าผาหินปูนล้านปี',
    specialtiesTh:['กาแฟกระบอกไม้ไผ่กลางสายน้ำ','ล่องแพชมถ้ำประกายเพชร','อาหารป่าปรุงด้วยกระบอกไม้ไผ่'],
    googlePlaceId:''
  },
  {
    id:'sme-koh-yao-fisherman',
    en:'Koh Yao Fishermen Kitchen',
    th:'ครัวชาวเลชุมชน เกาะยาวน้อย',
    locEn:'Koh Yao Noi, Phang Nga',
    locTh:'เกาะยาวน้อย จ.พังงา',
    category:'food',
    isSme:true,
    smeBadge:'Hidden Gem',
    photo:'coast-overlook.webp',
    gallery:['coast-card.webp','coast-tall.webp','ridge-view.webp'],
    region:'south',
    province:'phang-nga',
    provinceTh:'พังงา',
    provinceEn:'Phang Nga',
    lat:8.1250,
    lon:98.6040,
    rating:4.88,
    reviewsCount:220,
    priceFrom:180,
    currency:'THB',
    visit:'1.5h',
    phone:'082-998-3344',
    openHours:'11:00 - 21:00 น.',
    isOpen:true,
    storyEn:'Sustainable catch-of-the-day seafood beside floating fish pens on Koh Yao Noi.',
    storyTh:'ร้านอาหารริมกระชังปลาของกลุ่มประมงพื้นบ้านเกาะยาว อาหารทะเลสดจากอวนวันต่อวัน ปรุงด้วยเครื่องแกงตำมือสูตรปักษ์ใต้แท้',
    specialtiesTh:['แกงส้มปลากะพงยอดมะพร้าว','ยำสาหร่ายข้อพื้นเมือง','หมึกไข่ต้มหวานสมุนไพร'],
    googlePlaceId:''
  },
  {
    id:'railay-beach-krabi',
    en:'Railay Beach & Limestone Karst Cliffs',
    th:'หาดไร่เลย์ หน้าผาหินปูนและอ่าวทะเลอันดามัน',
    locEn:'Ao Nang, Krabi',
    locTh:'ต.อ่าวนาง อ.เมือง จ.กระบี่',
    category:'nature',
    isSme:false,
    photo:'coast-tall.webp',
    gallery:['coast-tall.webp','coast-card.webp','coast-overlook.webp'],
    region:'south',
    province:'krabi',
    provinceTh:'กระบี่',
    provinceEn:'Krabi',
    lat:8.0119,
    lon:98.8375,
    rating:4.87,
    reviewsCount:3100,
    priceFrom:100,
    currency:'THB',
    visit:'Half day',
    openHours:'เปิดตลอด 24 ชม. (เรือโดยสาร 06:00 - 18:00 น.)',
    isOpen:true,
    storyEn:'World-renowned peninsula surrounded by towering limestone karsts accessible only by boat.',
    storyTh:'อ่าวทะเลสีมรกตที่ถูกโอบล้อมด้วยหน้าผาหินปูนสูงตระหง่าน แหล่งปีนผาระดับโลกที่เข้าถึงได้ด้วยเรือหางยาวเท่านั้น',
    googlePlaceId:''
  },
  {
    id:'sme-phuket-old-town-peranakan',
    en:'Keng Baba-Yaya Peranakan Heritage Cafe',
    th:'เก่งบาบ๋า-ย่าหยา คาเฟ่ขนมพื้นเมืองภูเก็ต',
    locEn:'Thalang Road, Phuket Old Town',
    locTh:'ถนนถลาง ย่านเมืองเก่าภูเก็ต',
    category:'food',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'kyoto-lane.webp',
    gallery:['kyoto-lane.webp','terrace.webp','path.webp'],
    region:'south',
    province:'phuket',
    provinceTh:'ภูเก็ต',
    provinceEn:'Phuket',
    lat:7.8844,
    lon:98.3888,
    rating:4.91,
    reviewsCount:275,
    priceFrom:75,
    currency:'THB',
    visit:'1h',
    phone:'076-221-5544',
    openHours:'09:30 - 18:00 น.',
    isOpen:true,
    storyEn:'Restored Sino-Portuguese shophouse serving authentic Peranakan pastries and artisan tea.',
    storyTh:'ตึกแถวสไตล์ชิโนโปรตุกีสอายุกว่า 90 ปี เสิร์ฟขนมพื้นเมืองชาวเปอรานากันโบราณและกาแฟโบราณคั่วสูตรภูเก็ตแท้',
    specialtiesTh:['ขนมอังกู๊ (ขนมเต่าแดง)','โอ้เอ๋วโบราณน้ำผึ้งมะนาว','กาแฟโกปี้อ้อสูตรเตาฟืน'],
    googlePlaceId:''
  },

  // ==========================================
  // 4. NORTHEAST / ISAN (ภาคตะวันออกเฉียงเหนือ)
  // ==========================================
  {
    id:'chiang-khan-walking-street',
    en:'Chiang Khan Old Wooden Walking Street',
    th:'ถนนคนเดินเชียงคาน ริมแม่น้ำโขง',
    locEn:'Chiang Khan, Loei',
    locTh:'ริมแม่น้ำโขง อ.เชียงคาน จ.เลย',
    category:'culture',
    isSme:false,
    photo:'cabin-retreat.webp',
    gallery:['cabin-retreat.webp','terrace.webp','path.webp'],
    region:'northeast',
    province:'loei',
    provinceTh:'เลย',
    provinceEn:'Loei',
    lat:17.8967,
    lon:101.6542,
    rating:4.83,
    reviewsCount:1850,
    priceFrom:0,
    currency:'THB',
    visit:'2–3h',
    openHours:'16:30 - 21:30 น.',
    isOpen:true,
    storyEn:'Peaceful riverside road lined with century-old teakwood shophouses along the Mekong.',
    storyTh:'ถนนสายวัฒนธรรมริมแม่น้ำโขง เรียงรายด้วยบ้านไม้สักโบราณ สัมผัสวิถีชีวิตดั้งเดิมและประเพณีตักบาตรข้าวเหนียวในยามเช้า',
    googlePlaceId:''
  },
  {
    id:'sme-sakonnakhon-indigo',
    en:'Mae Phoon Natural Indigo Craft Center',
    th:'ศูนย์เรียนรู้ผ้าย้อมครามธรรมชาติ แม่พูน (สกลนคร)',
    locEn:'Mueang, Sakon Nakhon',
    locTh:'ต.ธาตุนาเวง อ.เมือง จ.สกลนคร',
    category:'culture',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'terraced-fields.webp',
    gallery:['terraced-fields.webp','green-valley.webp','terrace.webp'],
    region:'northeast',
    province:'sakon-nakhon',
    provinceTh:'สกลนคร',
    provinceEn:'Sakon Nakhon',
    lat:17.1545,
    lon:104.1486,
    rating:4.94,
    reviewsCount:110,
    priceFrom:150,
    currency:'THB',
    visit:'2h',
    phone:'042-713-8899',
    openHours:'08:30 - 17:00 น.',
    isOpen:true,
    storyEn:'Community weaving collective preserving 100% plant-based organic indigo fermentation dyes.',
    storyTh:'วิสาหกิจชุมชนทอผ้าย้อมครามธรรมชาติแท้จากต้นครามริมหนองหาร กลิ่นหอมสมุนไพรอ่อนๆ สีครามสวยทนนานด้วยภูมิปัญญาสกลนคร',
    specialtiesTh:['ผ้าพันคอย้อมครามลายเกล็ดปลา','เสื้อคลุมม่อฮ่อมครามแท้','เวิร์กช็อปมัดย้อมผ้าด้วยตนเอง'],
    googlePlaceId:''
  },
  {
    id:'pha-taem-ubon-ratchathani',
    en:'Pha Taem Prehistoric Cliff Paintings',
    th:'อุทยานแห่งชาติผาแต้ม ภาพเขียนสีโบราณ 3,000 ปี',
    locEn:'Khong Chiam, Ubon Ratchathani',
    locTh:'อ.โขงเจียม จ.อุบลราชธานี',
    category:'nature',
    isSme:false,
    photo:'ridge-view.webp',
    gallery:['ridge-view.webp','alpine-wide.webp','terrace.webp'],
    region:'northeast',
    province:'ubon-ratchathani',
    provinceTh:'อุบลราชธานี',
    provinceEn:'Ubon Ratchathani',
    lat:15.3995,
    lon:105.5085,
    rating:4.86,
    reviewsCount:1320,
    priceFrom:40,
    currency:'THB',
    visit:'2–3h',
    openHours:'06:00 - 18:00 น.',
    isOpen:true,
    storyEn:'Majestic sandstone cliff on the Mekong River where Thailand sees the first sunrise of the day.',
    storyTh:'หน้าผาหินทรายสูงชันริมแม่น้ำโขง จุดรับตะวันก่อนใครในสยาม พร้อมภาพเขียนสีก่อนประวัติศาสตร์อายุกว่า 3,000 ปี',
    googlePlaceId:''
  },
  {
    id:'sme-khaoyai-dairy-farm',
    en:'Pak Chong Organic Pasture Dairy Farm',
    th:'ฟาร์มโคนมทุ่งหญ้าธรรมชาติ ปากช่อง (เขาใหญ่)',
    locEn:'Pak Chong, Nakhon Ratchasima',
    locTh:'อ.ปากช่อง จ.นครราชสีมา (ใกล้เขาใหญ่)',
    category:'food',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'alpine-lake.webp',
    gallery:['alpine-lake.webp','green-valley.webp','cabin-retreat.webp'],
    region:'northeast',
    province:'nakhon-ratchasima',
    provinceTh:'นครราชสีมา',
    provinceEn:'Nakhon Ratchasima',
    lat:14.6225,
    lon:101.4182,
    rating:4.89,
    reviewsCount:340,
    priceFrom:90,
    currency:'THB',
    visit:'2h',
    phone:'044-311-2288',
    openHours:'08:30 - 17:30 น.',
    isOpen:true,
    storyEn:'Grass-fed dairy farm crafting fresh milk, probiotic yoghurt and artisan mountain cheese.',
    storyTh:'ฟาร์มโคนมอินทรีย์ปล่อยแปลงทุ่งหญ้าธรรมชาติ ผลิตนมสดแท้ 100% ไอศกรีมโฮมเมด และชีสสดรสเลิศท่ามกลางโอโซนเขาใหญ่',
    specialtiesTh:['นมโคพาสเจอร์ไรซ์ทุ่งหญ้าอินทรีย์','โยเกิร์ตสดรสธรรมชาติ','ไอศกรีมนมสดฮอกไกโดสูตรเขาใหญ่'],
    googlePlaceId:''
  },

  // ==========================================
  // 5. EAST (ภาคตะวันออก)
  // ==========================================
  {
    id:'sme-chanthaboon-waterfront',
    en:'Chanthaboon Historic Waterfront Community',
    th:'ชุมชนริมน้ำจันทบูร & ร้านก๋วยเตี๋ยวกั้งป้าติ๊ด',
    locEn:'Mueang, Chanthaburi',
    locTh:'ถ.สุขาภิบาล ต.วัดใหม่ อ.เมือง จ.จันทบุรี',
    category:'culture',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'kyoto-lane.webp',
    gallery:['kyoto-lane.webp','path.webp','terrace.webp'],
    region:'east',
    province:'chanthaburi',
    provinceTh:'จันทบุรี',
    provinceEn:'Chanthaburi',
    lat:12.6115,
    lon:102.1158,
    rating:4.92,
    reviewsCount:380,
    priceFrom:80,
    currency:'THB',
    visit:'2h',
    phone:'086-339-1122',
    openHours:'09:00 - 17:00 น.',
    isOpen:true,
    storyEn:'Charming wooden riverside community celebrating 300 years of gems, seafood and craft heritage.',
    storyTh:'ชุมชนประวัติศาสตร์ริมแม่น้ำจันทบูร อายุกว่า 300 ปี ผสมผสานวัฒนธรรมไทย จีน และญวน พร้อมชิมก๋วยเตี๋ยวต้มยำกั้งสดจากอ่าวไทย',
    specialtiesTh:['ก๋วยเตี๋ยวต้มยำกั้งชามโต','สละลอยแก้วสูตรจันทบูร','ขนมเทียนแก้วสูตรโบราณ'],
    googlePlaceId:''
  },
  {
    id:'koh-kood-fisherman-bay',
    en:'Ao Yai Traditional Fishing Village (Koh Kood)',
    th:'อ่าวใหญ่ หมู่บ้านประมงดั้งเดิม เกาะกูด',
    locEn:'Koh Kood, Trat',
    locTh:'อ่าวใหญ่ เกาะกูด จ.ตราด',
    category:'nature',
    isSme:false,
    photo:'coast-overlook.webp',
    gallery:['coast-overlook.webp','coast-card.webp','karst-lake.webp'],
    region:'east',
    province:'trat',
    provinceTh:'ตราด',
    provinceEn:'Trat',
    lat:11.5835,
    lon:102.5835,
    rating:4.93,
    reviewsCount:460,
    priceFrom:150,
    currency:'THB',
    visit:'Half day',
    openHours:'เปิดทุกวัน',
    isOpen:true,
    storyEn:'Remote wooden fishing village built on stilts over calm turquoise water on Koh Kood.',
    storyTh:'หมู่บ้านชาวประมงเรือนไม้สร้างยื่นลงในผืนทะเลสีฟ้าครามใสราวคริสตัล สัมผัสความเงียบสงบและอาหารทะเลสดจากเรือประมงท้องถิ่น',
    googlePlaceId:''
  },
  {
    id:'bang-saen-heritage-beach',
    en:'Bang Saen Beach & Marine Science Center',
    th:'ชายหาดบางแสน & สถาบันวิทยาศาสตร์ทางทะเล',
    locEn:'Mueang, Chonburi',
    locTh:'ต.แสนสุข อ.เมือง จ.ชลบุรี',
    category:'nature',
    isSme:false,
    photo:'coast-card.webp',
    gallery:['coast-card.webp','coast-tall.webp','terrace.webp'],
    region:'east',
    province:'chonburi',
    provinceTh:'ชลบุรี',
    provinceEn:'Chonburi',
    lat:13.2833,
    lon:100.9167,
    rating:4.78,
    reviewsCount:4200,
    priceFrom:80,
    currency:'THB',
    visit:'2–3h',
    openHours:'เปิดทุกวัน (พิพิธภัณฑ์สัตว์น้ำ 09:00 - 16:30 น.)',
    isOpen:true,
    storyEn:'Beloved classic seaside retreat famous for coastal cycling, sea aquarium and fresh local oysters.',
    storyTh:'ชายหาดยอดนิยมคู่เมืองชลบุรี เดินเล่นรับลมทะเลใต้ทิวมะพร้าว แวะชมโลกใต้ทะเลที่พิพิธภัณฑ์สัตว์น้ำ ม.บูรพา และชิมหอยนางรมสด',
    googlePlaceId:''
  },
  {
    id:'sme-rayong-fruit-orchard',
    en:'Suan Prasert Organic Fruit Orchard (Yai Da)',
    th:'สวนลุงประเสริฐ ผลไม้บุฟเฟต์อินทรีย์สวนยายดา',
    locEn:'Mueang, Rayong',
    locTh:'ต.ตะพง อ.เมือง จ.ระยอง',
    category:'food',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'green-valley.webp',
    gallery:['green-valley.webp','hero-forest.webp','cabin-retreat.webp'],
    region:'east',
    province:'rayong',
    provinceTh:'ระยอง',
    provinceEn:'Rayong',
    lat:12.6955,
    lon:101.4125,
    rating:4.87,
    reviewsCount:290,
    priceFrom:450,
    currency:'THB',
    visit:'2h',
    phone:'085-277-0684',
    openHours:'08:00 - 17:00 น. (ช่วงฤดูผลไม้)',
    isOpen:true,
    storyEn:'Family-owned agro-tourism orchard tasting tree-ripened durian, mangosteen and rambutan.',
    storyTh:'สวนผลไม้ท่องเที่ยวเชิงเกษตรคุณภาพ สัมผัสทุเรียนหมอนทองระยองแท้สุกคาต้น มังคุดหวานฉ่ำ และเงาะสดใหม่จากสวนอินทรีย์',
    specialtiesTh:['ทุเรียนหมอนทองระยองตัดสด','มังคุดหวานสวนยายดา','ทุเรียนทอดกรอบสูตรชาวสวน'],
    googlePlaceId:''
  },

  // ==========================================
  // 6. WEST (ภาคตะวันตก)
  // ==========================================
  {
    id:'sangkhlaburi-mon-bridge',
    en:'Uttamanusorn Mon Wooden Bridge',
    th:'สะพานไม้อุตตมานุสรณ์ (สะพานมอญ สังขละบุรี)',
    locEn:'Sangkhla Buri, Kanchanaburi',
    locTh:'อ.สังขละบุรี จ.กาญจนบุรี',
    category:'culture',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'mountain-lake.webp',
    gallery:['mountain-lake.webp','cabin-retreat.webp','path.webp'],
    region:'west',
    province:'kanchanaburi',
    provinceTh:'กาญจนบุรี',
    provinceEn:'Kanchanaburi',
    lat:15.1432,
    lon:98.4525,
    rating:4.93,
    reviewsCount:2600,
    priceFrom:0,
    currency:'THB',
    visit:'Half day',
    openHours:'เปิดตลอด 24 ชม.',
    isOpen:true,
    storyEn:'Longest wooden bridge in Thailand connecting Thai and Mon communities across Song Kalia River.',
    storyTh:'สะพานไม้ที่ยาวที่สุดในประเทศไทย เชื่อมสายสัมพันธ์สองฝั่งแม่น้ำซองกาเลียระหว่างชาวไทยและชาวมอญ ร่วมตักบาตรมอญยามเช้า',
    specialtiesTh:['ตักบาตรมอญยามเช้า','โจ๊กมอญใส่ไข่เยี่ยวม้า','ชุดแต่งกายชาวมอญถ่ายภาพ'],
    googlePlaceId:''
  },
  {
    id:'sme-huahin-cotton-weaving',
    en:'Baan Khao Tao Royal Handwoven Cotton Center',
    th:'ผ้าฝ้ายทอมือบ้านเขาเต่า ศูนย์หัตถกรรมพระราชทาน',
    locEn:'Hua Hin, Prachuap Khiri Khan',
    locTh:'บ้านเขาเต่า อ.หัวหิน จ.ประจวบคีรีขันธ์',
    category:'culture',
    isSme:true,
    smeBadge:'Local SME Spotlight',
    photo:'terrace.webp',
    gallery:['terrace.webp','path.webp','cabin-retreat.webp'],
    region:'west',
    province:'prachuap-khiri-khan',
    provinceTh:'ประจวบคีรีขันธ์',
    provinceEn:'Prachuap Khiri Khan',
    lat:12.4552,
    lon:99.9772,
    rating:4.88,
    reviewsCount:135,
    priceFrom:120,
    currency:'THB',
    visit:'1.5h',
    phone:'032-572-119',
    openHours:'08:30 - 17:00 น.',
    isOpen:true,
    storyEn:'Historic village weaving group preserving pure cotton loom fabric inspired by Royal initiatives.',
    storyTh:'กลุ่มสตรีทอผ้าบ้านเขาเต่าตามแนวพระราชดำริ สืบทอดการทอผ้าฝ้ายเนื้อแน่น ลวดลายเอกลักษณ์ เช่น ลายเต่า และลายยกดอกประจวบฯ',
    specialtiesTh:['ผ้าฝ้ายทอมือลายเต่ามงคล','ผ้าขาวม้าฝ้ายแท้เส้นใหญ่','กระเป๋าผ้าฝ้ายดีไซน์ร่วมสมัย'],
    googlePlaceId:''
  },
  {
    id:'sme-suan-phueng-clay-art',
    en:'Baan Hom Tien & Artisan Candle Studio',
    th:'บ้านหอมเทียน & ศิลปะเทียนหอมสวนผึ้ง',
    locEn:'Suan Phueng, Ratchaburi',
    locTh:'อ.สวนผึ้ง จ.ราชบุรี',
    category:'culture',
    isSme:true,
    smeBadge:'Hidden Gem',
    photo:'path.webp',
    gallery:['path.webp','cabin-retreat.webp','green-valley.webp'],
    region:'west',
    province:'ratchaburi',
    provinceTh:'ราชบุรี',
    provinceEn:'Ratchaburi',
    lat:13.5435,
    lon:99.3458,
    rating:4.85,
    reviewsCount:720,
    priceFrom:60,
    currency:'THB',
    visit:'1.5h',
    phone:'081-841-1895',
    openHours:'08:30 - 18:00 น.',
    isOpen:true,
    storyEn:'Vintage art retreat nestled in the hills creating hand-cast scented candles and retro craftsmanship.',
    storyTh:'แหล่งเรียนรู้ศิลปะเทียนหอมและของเก่าโบราณท่ามกลางขุนเขาตะนาวศรี จิบชากาแฟท่ามกลางกลิ่นหอมผ่อนคลายและวิวทิวทัศน์ธรรมชาติ',
    specialtiesTh:['เทียนหอมแกะสลักมือกลิ่นดอกไม้ป่า','เวิร์กช็อปหล่อเทียนสีสันด้วยตนเอง','ชาสมุนไพรสวนผึ้ง'],
    googlePlaceId:''
  },
  {
    id:'kaeng-krachan-mist-valley',
    en:'Kaeng Krachan World Heritage Forest & Mist Valley',
    th:'อุทยานแห่งชาติแก่งกระจาน ทะเลหมอกพะเนินทุ่ง มรดกโลก',
    locEn:'Kaeng Krachan, Phetchaburi',
    locTh:'อ.แก่งกระจาน จ.เพชรบุรี',
    category:'nature',
    isSme:false,
    photo:'alpine-wide.webp',
    gallery:['alpine-wide.webp','hero-forest.webp','mountain-lake.webp'],
    region:'west',
    province:'phetchaburi',
    provinceTh:'เพชรบุรี',
    provinceEn:'Phetchaburi',
    lat:12.8795,
    lon:99.3625,
    rating:4.91,
    reviewsCount:1480,
    priceFrom:100,
    currency:'THB',
    visit:'1–2 days',
    openHours:'06:00 - 18:00 น.',
    isOpen:true,
    storyEn:'UNESCO World Heritage rainforest sanctuary sheltering rare wildlife and year-round mountain mist.',
    storyTh:'ผืนป่ามรดกโลกกลุ่มป่าแก่งกระจาน ชมทะเลหมอกเขาพะเนินทุ่งตลอดทั้งปี แหล่งดูนกเงือกและผีเสื้อที่อุดมสมบูรณ์ที่สุดของไทย',
    googlePlaceId:''
  }
];

let PLACES=[...SAMPLE_PLACES];
let LIVE_DATA=false,API_ONLINE=false;
const REMOTE_CACHE={};
// Tommy: OpenStreetMap places the user opened or added to a trip. Kept out of PLACES so Discover/Home stay curated.
const OSM_PICKED_KEY='traval-osm-places',OSM_PICKED=new Map();
// Only ids made by scripts/osm (osm-n123 / osm-w123 / osm-r123). The older scripts/import_osm_places.js stores
// published places as osm-<digits>; those live in the team's places table and must keep syncing to the server.
const isDeviceOsmId=id=>/^osm-[nwr]\d+$/.test(String(id));

// Moo: Verified Tourist Safety Alerts & Community Risk Prevention Data
const DEFAULT_SAFETY_ALERTS = [
  {
    id: 'safe-1',
    category: 'overcharging',
    title: 'แท็กซี่ปฏิเสธมิเตอร์บริเวณสถานีขนส่ง/สนามบิน (Taxi Refused Meter)',
    description: 'มีแท็กซี่และรถรับจ้างบางคันเรียกราคาเหมาจ่าย 400-600 บาท แทนการเปิดมิเตอร์ตามกฎหมาย',
    tip: 'แนะนำให้เดินไปที่จุดกดบัตรคิวแท็กซี่ทางการ หรือเรียกผ่านแอปพลิเคชันที่มีการควบคุมราคาอย่างโปร่งใส',
    locationName: 'สถานีขนส่งหมอชิต 2 / สนามบินดอนเมือง',
    lat: 13.813, lon: 100.551,
    status: 'verified',
    date: '2026-11-01'
  },
  {
    id: 'safe-2',
    category: 'scam',
    title: 'หลอกว่าวัด/พระบรมมหาราชวังปิด แล้วพาไปร้านจิวเวลรี่ (Gem / Tailor Scam)',
    description: 'มีคนแปลกหน้าเข้ามาทักว่าสถานที่ท่องเที่ยวปิดทำความสะอาด แล้วแนะนำให้นั่งตุ๊กตุ๊กราคาพิเศษพาไปร้านสูทหรืออัญมณี',
    tip: 'อย่าหลงเชื่อคนที่เข้ามาทักทายหน้าประตู ให้เดินเข้าไปตรวจสอบที่ทางเข้าทางการของสถานที่โดยตรง',
    locationName: 'บริเวณรอบพระบรมมหาราชวัง / ท่าเตียน',
    lat: 13.751, lon: 100.492,
    status: 'verified',
    date: '2026-11-03'
  },
  {
    id: 'safe-3',
    category: 'unsafe',
    title: 'ระวังทรัพย์สินในแหล่งรวมคนพลุกพล่าน (Crowded Night Market Pickpocket Alert)',
    description: 'ตลาดกลางคืนและจุดต่อรถที่มีคนแน่นขนัด อาจมีมิจฉาชีพกรีดกระเป๋าหรือล้วงกระเป๋าหลัง',
    tip: 'สะพายกระเป๋าเป้ไว้ด้านหน้า และเก็บของมีค่าไว้ในกระเป๋าด้านในที่รูดซิปมิดชิด',
    locationName: 'ตลาดนัดจตุจักร / ซอยคาวบอย',
    lat: 13.799, lon: 100.550,
    status: 'verified',
    date: '2026-11-05'
  }
];

const DEFAULT_REVIEWS = {
  'sme-mae-kampong-coffee': [
    { id: 'rev-1', author: 'Somchai P.', rating: 5, date: '3 วันที่แล้ว', text: 'กาแฟคั่วสดหอมละมุน บรรยากาศริมลำธารเย็นสบายมาก เจ้าของร้านน่ารักและให้คำแนะนำเรื่องการเดินป่าชุมชนได้ดีเยี่ยมครับ', helpful: 14, verified: true },
    { id: 'rev-2', author: 'Emily Watson', rating: 5, date: '1 week ago', text: 'Authentic local village atmosphere. The iced drip coffee is a must try! Warm hospitality from the northern community.', helpful: 8, verified: true },
    { id: 'rev-3', author: 'Nattaporn K.', rating: 4, date: '2 สัปดาห์ที่แล้ว', text: 'ทางขึ้นชันนิดหน่อยแต่คุ้มค่ามาก ขนมปังปิ้งเนยนมอร่อย แนะนำมาช่วงเช้าจะได้อากาศดีและคนไม่เยอะครับ', helpful: 5, verified: true }
  ],
  'sme-talad-noi-noodle': [
    { id: 'rev-4', author: 'Kittisak W.', rating: 5, date: 'เมื่อวานนี้', text: 'บะหมี่เป็ดตุ๋นในตำนาน น้ำซุปหอมยาจีนกลมกล่อมมาก เส้นบะหมี่ไข่ทำเองเหนียวนุ่มสุดๆ แนะนำให้ลองเกี๊ยวกุ้งทอดด้วยครับ', helpful: 19, verified: true },
    { id: 'rev-5', author: 'David Miller', rating: 5, date: '4 days ago', text: 'Incredible hidden noodle shop in the heart of Talad Noi. You can feel the real heritage and history in every bowl.', helpful: 11, verified: true }
  ]
};

try{for(const p of JSON.parse(localStorage.getItem(OSM_PICKED_KEY)||'[]'))if(p&&p.id)OSM_PICKED.set(p.id,p)}catch{}
const getPlace=id=>PLACES.find(p=>p.id===id)||OSM_PICKED.get(id);

const KEY='unfold-v2-user';
function readStore(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
const stored=readStore();
const ONBOARD_KEY='traval-moo-onboard-v3';

const state={
 page:'welcome',previous:'discover',lang:stored.lang==='th'?'th':'en',category:'all',query:'',
 theme:(localStorage.getItem('traval-theme')==='dark'?'dark':'light'),
 searchOpen:false,menuOpen:false,showAll:false,region:'all',
 saved:Array.isArray(stored.saved)?stored.saved.filter(x=>getPlace(x)):['sme-mae-kampong-coffee','sme-talad-noi-noodle'],
 trip:Array.isArray(stored.trip)?stored.trip.filter(x=>getPlace(x)):[],
 notes:stored.notes&&typeof stored.notes==='object'?stored.notes:{},
 suggestions:Array.isArray(stored.suggestions)?stored.suggestions:[],
 boxes:Array.isArray(stored.boxes)?stored.boxes:[],
 detail:null,mapCenter:{lat:18.868,lon:99.35,z:10},mapSelected:'sme-mae-kampong-coffee',mapDisabled:false,
 account:null,authMode:'login',reviewCache:{},myReviews:[],reviewPhoto:'',accountBusy:false,
 resetToken:'',accountMessage:'',nearbyActive:false,nearbyBusy:false,nearbyList:[],
 nearbyPoint:null,nearbyRadius:1,nearbyMaxPrice:'',nearbyCurrency:'THB',travelMode:'driving',osm:{key:'',places:[],total:0,truncated:false},tripRoute:null,filtersOpen:false,
 localOnly:false,followMe:false,heading:null,accuracyM:0,geoStatus:'idle',pickOnMap:false,
 collectionFilter:'all',collectionQuery:'',selectMode:false,selectedIds:[],minRating:0,
 bottomSheetState:'closed',bottomSheetPlaceId:null,mapPannedAway:false,galleryIndex:0,
 onboarding:!localStorage.getItem(ONBOARD_KEY),
 spotlightPlaces:[],placesError:'',
 safetyReports:[...DEFAULT_SAFETY_ALERTS],showSafetyModal:false,safetyTab:'alerts',
 showOnboardingModal:false,reviewFilter:'all',reviewLikes:{},reviewRatingInput:5,
 openNowFilter:false,hasPromoFilter:false,collectionCategory:'all',showAiModal:false,aiPreset:'sme',aiQuery:''
};

const guestSaved=[...state.saved],guestTrip=[...state.trip];

Object.assign(I18N.en,{

 safetyTitle:'Travel Safety Alerts',safetySub:'Verified tourist risk alerts & scam prevention in Thailand',
 activeAlerts:'Active Alerts',reportRisk:'Report a Risk',reportSuccess:'Thank you! Your safety report has been submitted.',
 avoidanceTip:'Prevention Tip',onboardModalTitle:'Welcome to GoAround',onboardModalSub:'Your local-first companion for exploring Thailand',
 onboardStep1Title:'Discover Community Heritage',onboardStep1Desc:'Find authentic hidden gems and local SMEs worth supporting.',
 onboardStep2Title:'Live Real-Time Map',onboardStep2Desc:'Use GPS Blue Dot, clustering, and Explore Around Me with ease.',
 onboardStep3Title:'Plan Trips & Real Route Cost',onboardStep3Desc:'Calculate road distance, Bangkok meter taxi fare, and fuel estimates.',
 startExploring:'Start Exploring',communityStories:'Local Stories & Promotions',communityStoriesSub:'Authentic community recipes, heritage and exclusive local offers',
 recommendedForYou:'Recommended for You',openNow:'Open Now',hasPromo:'Special Offers',helpful:'Helpful',writeReviewTitle:'Write a Review',
 ratingPlaceholder:'Share details of your experience, food recommendations, and tips for travellers...',submitReviewBtn:'Post Review',
 batchAddSuccess:'Added all selected places to My Trips!',multiAddTrip:'Add to My Trips',verifiedStatus:'Verified',pendingStatus:'Pending Review',guideBtn:'User Guide',

 accountTitle:'Your account',createAccount:'Create an account',signIn:'Sign in',signUp:'Sign up',signOut:'Sign out',displayName:'Your name',email:'Email address',password:'Password',accountIntro:'Save favourites across devices.',accountReady:'Synced to your account',guestIntro:'Explore as a guest, or sign in to sync.',publicReviews:'Traveller reviews',writeReview:'Share your experience',reviewBody:'Your review',photoUpload:'Add photo',submitReview:'Submit review',reviewPending:'Awaiting moderation',reviewRejected:'Not published',reviewApproved:'Published',noReviews:'No public reviews yet.',removeReview:'Delete review',authNeeded:'Sign in to review real places.',accountSuccess:'Account ready',accountError:'Unable to complete request',rating:'Rating',guestSaved:'Guest lists stay on this device',reviewCheck:'Reviews are published after approval.',
 nearMe:'Around Me',nearActive:'Around Me',locating:'Locating…',stopNear:'Show all',radius:'Radius',budget:'Budget',anyBudget:'Any price',noLocal:'No published places nearby.',locationDenied:'Location unavailable. Please allow GPS.',localOnly:'Local Only',distKm:'km away',startingFrom:'From',modeDrive:'Drive',modeWalk:'Walk',modeTransit:'Transit',verifyEmail:'Verify email',emailUnverified:'Email not verified',emailVerified:'Email verified',sendVerify:'Send verification link',forgotPassword:'Forgot password?',resetPassword:'Reset password',sendReset:'Send reset link',backToLogin:'Back to sign in',emailCheck:'Check email link.',resetReady:'Password changed.',changeName:'Edit display name',saveName:'Update name',profileUpdated:'Profile updated',sendLink:'Send link',filters:'Filters',
 hoursUnknown:'Hours unknown',sponsored:'Sponsored',smeShort:'Local SME',hiddenGem:'Hidden Gem',newLocal:'New local shop',localPick:'Local Pick',recommended:'Recommended',byProvince:'By province',localDirectory:'Local shops',exploreNearby:'Explore nearby',openMaps:'Open in Google Maps',openAi:'AI Advisor',startLoc:'Start location',stopLoc:'Stop location',geoIdle:'Location off — your position is never shared with others.',geoOn:'Location on this device only',pickProvince:'Choose a province',pickMap:'Drop a pin on the map',noPlacesHere:'No places in this area',searchingArea:'Searching this area…',verifiedData:'Listing verified',pendingData:'Details may need an update',notQuality:'This status is about data freshness, not a quality rating.',onboardTitle:'Discover local Thailand',onboardBody:'Search nearby, save Hidden Gems, and support Local SMEs. You can skip this anytime.',dismiss:'Got it',minRating:'Min rating',createBox:'New collection',sendTrip:'Add selected to trip',openNineTrips:'Open My Trips',selectPlaces:'Select',share:'Share',address:'Address',gps:'GPS',priceBand:'Price',specialties:'Specialties',teamLogin:'Full login page',teamRegister:'Register'
});
Object.assign(I18N.th,{

 safetyTitle:'เตือนภัยนักท่องเที่ยว & ป้องกันการหลอกลวง',safetySub:'จุดเสี่ยงที่พบบ่อยและคำแนะนำเพื่อความปลอดภัยในการเดินทาง',
 activeAlerts:'รายการแจ้งเตือน',reportRisk:'แจ้งจุดเสี่ยงใหม่',reportSuccess:'ขอบคุณครับ! ข้อมูลแจ้งเตือนของคุณถูกส่งเข้าระบบเรียบร้อยแล้ว',
 avoidanceTip:'คำแนะนำการหลีกเลี่ยงความเสี่ยง',onboardModalTitle:'ยินดีต้อนรับสู่ GoAround',onboardModalSub:'เพื่อนคู่คิดสำรวจเมืองไทยแบบ Local-First',
 onboardStep1Title:'สนับสนุนร้านค้าชุมชน & ค้นหา Hidden Gems',onboardStep1Desc:'สัมผัสมรดกชุมชน สินค้าทำมือ และร้านค้าท้องถิ่นตัวจริง',
 onboardStep2Title:'แผนที่สดพร้อม Live GPS Blue Dot',onboardStep2Desc:'แสดงตำแหน่งแบบเรียลไทม์ ซูมกลุ่มหมุด และค้นหาในพื้นที่ที่สนใจ',
 onboardStep3Title:'วางแผนทริปและคำนวณค่าเดินทางจริง',onboardStep3Desc:'คำนวณเส้นทางถนนจริง เวลาเดินทาง ค่าแท็กซี่มิเตอร์ และค่าน้ำมัน',
 startExploring:'เริ่มต้นสำรวจเลย',communityStories:'เรื่องราวชุมชน & โปรโมชั่นพิเศษ',communityStoriesSub:'เรื่องราวหลังร้าน เมนูเด็ด และสิทธิพิเศษจากร้านค้าชุมชน',
 recommendedForYou:'แนะนำสำหรับคุณ',openNow:'เปิดอยู่ตอนนี้',hasPromo:'มีโปรโมชั่น',helpful:'มีประโยชน์',writeReviewTitle:'เขียนรีวิวของคุณ',
 ratingPlaceholder:'แบ่งปันประสบการณ์ เมนูแนะนำ หรือข้อควรรู้สำหรับนักเดินทางท่านอื่น...',submitReviewBtn:'ส่งรีวิว',
 batchAddSuccess:'เพิ่มสถานที่ที่เลือกลงใน My Trips เรียบร้อยแล้ว!',multiAddTrip:'เพิ่มลง My Trips',verifiedStatus:'ตรวจสอบแล้ว',pendingStatus:'รอตรวจสอบ',guideBtn:'แนะนำการใช้งาน',

 accountTitle:'บัญชีของคุณ',createAccount:'สร้างบัญชี',signIn:'เข้าสู่ระบบ',signUp:'สมัครสมาชิก',signOut:'ออกจากระบบ',displayName:'ชื่อที่แสดง',email:'อีเมล',password:'รหัสผ่าน',accountIntro:'บันทึกสถานที่และทริปข้ามอุปกรณ์',accountReady:'ซิงก์เข้าบัญชีแล้ว',guestIntro:'ใช้แบบผู้เยี่ยมชมหรือเข้าสู่ระบบเพื่อซิงก์ข้อมูล',publicReviews:'รีวิวจากผู้เดินทาง',writeReview:'แบ่งปันประสบการณ์',reviewBody:'รีวิวของคุณ',photoUpload:'เพิ่มรูปภาพ',submitReview:'ส่งรีวิว',reviewPending:'รอตรวจสอบ',reviewRejected:'ยังไม่ได้เผยแพร่',reviewApproved:'เผยแพร่แล้ว',noReviews:'ยังไม่มีรีวิวที่เผยแพร่',removeReview:'ลบรีวิวของฉัน',authNeeded:'เข้าสู่ระบบก่อนรีวิวสถานที่จริง',accountSuccess:'บัญชีพร้อมใช้งาน',accountError:'ทำรายการไม่สำเร็จ',rating:'คะแนน',guestSaved:'ข้อมูลผู้เยี่ยมชมเก็บในเครื่องนี้',reviewCheck:'รีวิวจะเผยแพร่หลังผู้ดูแลตรวจสอบ',
 nearMe:'รอบตัวฉัน (Around Me)',nearActive:'สำรวจรอบตัว',locating:'กำลังระบุพิกัด…',stopNear:'ดูทั้งหมด',radius:'รัศมี',budget:'งบประมาณ',anyBudget:'ทุกราคา',noLocal:'ยังไม่มีสถานที่จริงที่เผยแพร่ใกล้ตำแหน่งนี้',locationDenied:'ไม่สามารถรับตำแหน่งได้ โปรดอนุญาต GPS ในเบราว์เซอร์',localOnly:'เฉพาะร้านชุมชน',distKm:'กม.',startingFrom:'เริ่มต้น',modeDrive:'รถยนต์',modeWalk:'เดิน',modeTransit:'ขนส่งสาธารณะ',verifyEmail:'ยืนยันอีเมล',emailUnverified:'ยังไม่ได้ยืนยันอีเมล',emailVerified:'ยืนยันอีเมลแล้ว',sendVerify:'ส่งลิงก์ยืนยันอีเมล',forgotPassword:'ลืมรหัสผ่าน?',resetPassword:'ตั้งรหัสผ่านใหม่',sendReset:'ส่งลิงก์ตั้งรหัสผ่าน',backToLogin:'กลับไปเข้าสู่ระบบ',emailCheck:'ตรวจอีเมล หรือดูหน้าต่างเซิร์ฟเวอร์',resetReady:'เปลี่ยนรหัสผ่านสำเร็จ',changeName:'แก้ชื่อที่แสดง',saveName:'บันทึกชื่อ',profileUpdated:'อัปเดตโปรไฟล์แล้ว',sendLink:'ส่งลิงก์',filters:'ตัวกรอง',
 hoursUnknown:'ไม่ทราบเวลาเปิด–ปิด',sponsored:'โฆษณา / Sponsored',smeShort:'ร้านชุมชน',hiddenGem:'Hidden Gem',newLocal:'ร้านใหม่',localPick:'Local Pick',recommended:'แนะนำสำหรับคุณ',byProvince:'ตามจังหวัด',localDirectory:'ไดเรกทอรีร้านท้องถิ่น',exploreNearby:'สำรวจรอบจุดนี้',openMaps:'เปิดใน Google Maps',openAi:'ที่ปรึกษา AI',startLoc:'เริ่มตำแหน่ง',stopLoc:'หยุดตำแหน่ง',geoIdle:'ปิดตำแหน่งอยู่ — พิกัดของคุณไม่ถูกส่งให้คนอื่น',geoOn:'ใช้ตำแหน่งบนเครื่องนี้เท่านั้น',pickProvince:'เลือกจังหวัด',pickMap:'ปักหมุดบนแผนที่เอง',noPlacesHere:'ไม่พบสถานที่บริเวณนี้',searchingArea:'กำลังค้นหาบริเวณนี้…',verifiedData:'ข้อมูลร้านได้รับการยืนยัน',pendingData:'ข้อมูลอาจรออัปเดต',notQuality:'สถานะนี้บอกความสดของข้อมูล ไม่ใช่การรับรองคุณภาพ',onboardTitle:'เริ่มค้นหาประเทศไทยในมุมคนท้องถิ่น',onboardBody:'ค้นหารอบตัว บันทึก Hidden Gems และสนับสนุนร้าน SME ได้เลย ปิดหน้าต่างนี้ได้ทุกเมื่อ',dismiss:'เข้าใจแล้ว',minRating:'คะแนนขั้นต่ำ',createBox:'สร้างคอลเลกชัน',sendTrip:'ส่งรายการที่เลือกเข้าทริป',openNineTrips:'เปิด My Trips',selectPlaces:'เลือกหลายรายการ',share:'แชร์',address:'ที่อยู่',gps:'พิกัด',priceBand:'ช่วงราคา',specialties:'ไฮไลต์',teamLogin:'หน้าเข้าสู่ระบบเต็ม',teamRegister:'สมัครสมาชิก'
});

const t=k=>I18N[state.lang]?.[k]||k;
const name=p=>state.lang==='th'?(p.th||p.en):p.en;
const loc=p=>state.lang==='th'?(p.locTh||p.locEn):p.locEn;
const story=p=>state.lang==='th'?(p.storyTh||p.storyEn):p.storyEn;
const photo=p=>typeof p==='string' && p.startsWith('/uploads/')?p:`assets/${p||'hero-forest.webp'}`;

function resolvedTheme(){
 return state.theme==='dark'?'dark':'light';
}
function applyTheme(){
 const res=resolvedTheme();
 document.documentElement.setAttribute('data-theme',res);
 const metaTheme=document.querySelector('meta[name="theme-color"]');
 if(metaTheme)metaTheme.setAttribute('content',res==='dark'?'#0D1117':'#143B2A');
}
if(window.matchMedia){
 window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>{
   if(state.theme==='system'){
     applyTheme();
     render({keepScroll:true});
   }
 });
}
function store(){
 try{localStorage.setItem(KEY,JSON.stringify({lang:state.lang,saved:state.account?guestSaved:state.saved,trip:state.account?guestTrip:state.trip,notes:state.notes,suggestions:state.suggestions,boxes:state.boxes}))}catch{}
}

function hoursStatus(p){
 if(!p) return 'unknown';
 if(p.hoursStatus==='open'||p.hoursStatus==='closed'||p.hoursStatus==='unknown') return p.hoursStatus;
 if(p.isOpen===true) return 'open';
 if(p.isOpen===false) return 'closed';
 return 'unknown';
}
function hoursLabel(p){
 const s=hoursStatus(p);
 return s==='open'?t('openNow'):s==='closed'?t('closedNow'):t('hoursUnknown');
}
function safeImg(src,alt,cls=''){
 return `<img class="${cls}" src="${html(typeof src==='string'&&src.startsWith('assets/')||(typeof src==='string'&&src.startsWith('/'))||(typeof src==='string'&&src.startsWith('data:'))?src:photo(src))}" alt="${html(alt||'')}" loading="lazy" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>`;
}
function catLabel(p){return t(p.category||'all')}
function sponsored(p){return Boolean(p.isSponsored||p.sponsored)}
function badgeRow(p){
 const bits=[];
 if(sponsored(p)) bits.push(`<span class="badge-sponsored">${html(t('sponsored'))}</span>`);
 if(p.isSme) bits.push(`<span class="badge-sme">★ ${html(p.smeBadge&&!/sponsored/i.test(p.smeBadge)?p.smeBadge:t('smeShort'))}</span>`);
 if(String(p.smeBadge||'').toLowerCase().includes('hidden')) bits.push(`<span class="badge-hidden">${html(t('hiddenGem'))}</span>`);
 if(String(p.smeBadge||'').toLowerCase().includes('new')) bits.push(`<span class="badge-new">${html(t('newLocal'))}</span>`);
 if(String(p.smeBadge||'').toLowerCase().includes('pick')) bits.push(`<span class="badge-pick">${html(t('localPick'))}</span>`);
 return bits.length?`<div class="card-badges">${bits.join('')}</div>`:'';
}

async function userApi(route,method='GET',data){
 const res=await fetch(route,{method,credentials:'same-origin',cache:'no-store',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 let json={};try{json=await res.json()}catch{}
 if(!res.ok)throw new Error(json.error||'Request failed');
 return json;
}

async function loadAccountCollections(){
 if(!state.account)return;
 const [collections,reviews]=await Promise.all([userApi('/api/me/collections'),userApi('/api/me/reviews')]);
 // Tommy: add back this account's OpenStreetMap places from this device, in their saved order
 state.saved=mergeOsmLists(collections.saved,'saved');state.trip=mergeOsmLists(collections.trip,'trip');state.myReviews=reviews.reviews;
 render({keepScroll:true});
}

async function refreshSession(){
  try{
   const result=await userApi('/api/auth/me');
   if(result.user){state.account=result.user;await loadAccountCollections()}
   else if(state.account){state.account=null;state.saved=[...guestSaved];state.trip=[...guestTrip];state.myReviews=[];render({keepScroll:true})}
  }catch(err){console.info('Account service unavailable:',err.message)}
}

async function initRealData(){
  try{
    const [placesRes,spotRes,safetyRes]=await Promise.allSettled([
      userApi('/api/places'),
      userApi('/api/places/spotlight'),
      userApi('/api/safety/reports')
    ]);
    if(placesRes.status==='fulfilled'&&Array.isArray(placesRes.value.places)&&placesRes.value.places.length){
      const realPlaces=placesRes.value.places.map(p=>({
        id:p.id,en:p.en,th:p.th||p.en,locEn:p.locEn,locTh:p.locTh||p.locEn,
        category:p.category,region:p.region,lat:p.lat,lon:p.lon,
        visit:p.visit||'1-2h',priceFrom:p.priceFrom,currency:p.currency||'THB',
        storyEn:p.storyEn||'',storyTh:p.storyTh||'',photo:p.photo||'assets/hero-forest.webp',
        gallery:p.gallery||[],isSme:Boolean(p.isSme),smeType:p.smeType||'',
        smeBadge:p.spotlightBadge||p.smeBadge||(p.isSme?'Local SME Spotlight':''),
        featured:Boolean(p.featured),openHours:p.openHours||p.openingHours||'',isOpen:p.isOpen,
        hoursStatus:p.hoursStatus||(p.isOpen===true?'open':p.isOpen===false?'closed':'unknown'),
        isSponsored:Boolean(p.isSponsored),province:p.province,provinceTh:p.provinceTh,provinceEn:p.provinceEn,
        phone:p.contactPhone||'',specialtiesTh:p.localStoryTh?[p.localStoryTh.slice(0,30)]:undefined,
        rating:p.rating,reviewsCount:p.reviewsCount,
        googlePlaceId:p.googlePlaceId||'' // Tommy: keep for Google Maps links (allowed to store forever)
      }));
      const ids=new Set(realPlaces.map(x=>x.id));
      PLACES=[...realPlaces,...SAMPLE_PLACES.filter(s=>!ids.has(s.id))];
      LIVE_DATA=true;API_ONLINE=true;
    }
    if(spotRes.status==='fulfilled'){
      const spotList = spotRes.value.places || spotRes.value.spotlight;
      if(Array.isArray(spotList)) state.spotlightPlaces=spotList;
    }
    if(safetyRes.status==='fulfilled'&&Array.isArray(safetyRes.value.reports)&&safetyRes.value.reports.length){
      const liveReports=safetyRes.value.reports.map(r=>({
        id:r.id,
        category:r.category||'scam',
        title:r.title,
        description:r.description,
        tip:r.tip||r.description,
        locationName:r.locationName||r.location_name||'Thailand',
        status:'verified'
      }));
      const existingIds=new Set(liveReports.map(r=>r.id));
      state.safetyReports=[...liveReports,...DEFAULT_SAFETY_ALERTS.filter(d=>!existingIds.has(d.id))];
    }
    render({keepScroll:true});
  }catch(e){state.placesError=e.message;console.info('initRealData fallback:',e.message)}
}

let persistOrder=Promise.resolve();
function persistCollections(){
 if(!state.account||!LIVE_DATA){store();return}
 saveOsmLists(); // Tommy: remember this account's OpenStreetMap places (and their order) on this device
 const payload={saved:state.saved.filter(id=>!isDeviceOsmId(id)),trip:state.trip.filter(id=>!isDeviceOsmId(id))}; // Tommy: the server stores team places only
 persistOrder=persistOrder.catch(()=>{}).then(async()=>{
  try{await userApi('/api/me/collections','PUT',payload)}catch(e){toast(e.message);try{await loadAccountCollections()}catch{}}
 });
}

async function loadReviewPage(id){
 if(!LIVE_DATA)return;
 try{
  const r=await userApi('/api/places/'+encodeURIComponent(id)+'/reviews');
  state.reviewCache[id]=r.reviews;
  if(state.page==='detail'&&state.detail===id)render({keepScroll:true});
 }catch(e){console.info('Review load:',e.message)}
}

async function signOut(){
 try{await userApi('/api/auth/logout','POST');state.account=null;state.saved=[...guestSaved];state.trip=[...guestTrip];state.myReviews=[];state.reviewPhoto='';store();render({keepScroll:true})}
 catch(e){toast(e.message)}
}

async function signOutAll(){
 try{
  await userApi('/api/auth/logout-all','POST');
  state.account=null;state.saved=[...guestSaved];state.trip=[...guestTrip];state.myReviews=[];state.reviewPhoto='';store();
  toast(state.lang==='th'?'ออกจากระบบจากทุกอุปกรณ์แล้ว':'Signed out from all devices');
  render({keepScroll:true});
 }catch(e){toast(e.message)}
}

let toastTimer;
function toast(message){
 const el=$('#toast');
 if(!el)return;
 el.textContent=message;el.classList.add('on');
 clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>el.classList.remove('on'),2400);
}

function actionBtn(action,content,extra='',attributes=''){
 return `<button type="button" class="${extra}" data-action="${action}" ${attributes}>${content}</button>`;
}

function brand(){
 return `<button class="brand v26-brand" data-action="navigate" data-page="welcome" aria-label="GoAround - ${html(t('homeLink'))}">
  <span class="v26-brand-stack">
    <span class="brand-mark v26-brand-serif">GoAround<i class="brand-dot v26-olive-dot">.</i></span>
    <small class="v26-brand-sub">${state.lang==='th'?'TRAVEL & LOCAL DISCOVERY':'THE ART OF DISCOVERY'}</small>
  </span>
 </button>`;
}

function header(){
 return `<header class="site-header">
  ${brand()}
  <nav class="header-links" aria-label="Primary">
    ${[['discover','discover'],['map','map'],['saved','saved'],['trip','trip'],['profile','profile']].map(([page,label])=>`
      <button data-action="navigate" data-page="${page}" class="${state.page===page?'selected':''}">
        ${html(t(label))}
        ${page==='saved'&&state.saved.length?`<span class="badge-counter nav-badge-count">${state.saved.length}</span>`:''}
      </button>
    `).join('')}
  </nav>
  <div class="head-actions">
    <button class="language-btn" data-action="language" aria-label="Change language">${state.lang==='en'?'TH':'EN'}</button>
    <div class="theme-segmented-pill" role="radiogroup" aria-label="Theme switcher">
      <button type="button" class="theme-seg-btn ${resolvedTheme()==='light'?'active':''}" data-action="set-theme" data-theme="light" aria-label="${state.lang==='th'?'โหมดสว่าง':'Light mode'}" title="${state.lang==='th'?'โหมดสว่าง':'Light mode'}">
        ${ico('sun',15)}<span>${state.lang==='th'?'สว่าง':'Light'}</span>
      </button>
      <button type="button" class="theme-seg-btn ${resolvedTheme()==='dark'?'active':''}" data-action="set-theme" data-theme="dark" aria-label="${state.lang==='th'?'โหมดมืด':'Dark mode'}" title="${state.lang==='th'?'โหมดมืด':'Dark mode'}">
        ${ico('moon',15)}<span>${state.lang==='th'?'มืด':'Dark'}</span>
      </button>
    </div>
    ${actionBtn('open-ai',ico('spark',20),'header-icon ai-icon-btn','aria-label="AI Travel Advisor" title="' + html(t('openAi')) + '"')}
    ${actionBtn('open-safety',ico('shield',20),'header-icon safety-icon-btn','aria-label="Safety alerts" title="' + html(t('safetyTitle')) + '"')}
    ${actionBtn('search-open',ico('search',20),'header-icon','aria-label="Search"')}
    ${actionBtn('menu-open',ico('menu',23),'header-icon menu-trigger','aria-label="Open menu"')}
  </div>
 </header>`;
}

const NAV=[['discover','discover','compass'],['map','map','map'],['saved','saved','heart'],['trip','trip','route'],['profile','profile','user']];

function bottomNav(){
 return `<nav class="bottom-nav" aria-label="Primary">
  ${NAV.map(([page,label,icon])=>`
    <button type="button" data-action="navigate" data-page="${page}" class="${state.page===page?'selected':''}" aria-label="${html(t(label))}" ${state.page===page?'aria-current="page"':''}>
      ${ico(icon,22)}
      <span>${html(t(label))}</span>
      ${page==='saved'&&state.saved.length?`<span class="badge-counter count-dot">${state.saved.length}</span>`:''}
    </button>
  `).join('')}
 </nav>`;
}


const LANDING_SLIDES = [
  { img: 'assets/1.png', alt: 'Travel Experience 1' },
  { img: 'assets/2.png', alt: 'Travel Experience 2' },
  { img: 'assets/3.png', alt: 'Travel Experience 3' }
];
let landingSlideIndex = 0;
let landingTimer = null;

function setLandingSlide(nextIdx) {
  landingSlideIndex = (nextIdx + LANDING_SLIDES.length) % LANDING_SLIDES.length;
  const slides = $$('.landing-slide');
  slides.forEach((el, idx) => {
    el.classList.toggle('active', idx === landingSlideIndex);
  });
  const indicator = $('#landing-counter');
  if (indicator) indicator.textContent = `0${landingSlideIndex + 1} / 0${LANDING_SLIDES.length}`;
  const fill = $('#landing-progress-fill');
  if (fill) fill.style.width = `${((landingSlideIndex + 1) / LANDING_SLIDES.length) * 100}%`;
  const dots = $$('.landing-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === landingSlideIndex);
  });
}

function startLandingSlideshow() {
  if (landingTimer) clearInterval(landingTimer);
  landingTimer = setInterval(() => {
    if (state.page !== 'welcome') {
      clearInterval(landingTimer);
      landingTimer = null;
      return;
    }
    setLandingSlide(landingSlideIndex + 1);
  }, 4000);
}

function landing(){
  setTimeout(startLandingSlideshow, 50);
  return `<div class="landing" id="landing">
  <div class="landing-image">
    <div class="landing-slideshow">
      ${LANDING_SLIDES.map((slide, idx) => `
        <div class="landing-slide ${idx === landingSlideIndex ? 'active' : ''}">
          <img src="${slide.img}" alt="${html(slide.alt)}" onerror="this.onerror=null;this.src='hero-forest.webp'"/>
        </div>
      `).join('')}
    </div>
    <div class="landing-slide-controls">
      ${LANDING_SLIDES.map((_, idx) => `
        <button class="landing-dot ${idx === landingSlideIndex ? 'active' : ''}" data-action="landing-slide" data-index="${idx}" aria-label="Slide ${idx + 1}"></button>
      `).join('')}
    </div>
  </div>
  <div class="landing-shade"></div>
  <div class="landing-header">
    ${brand()}
    <div class="landing-header-right">
      <button class="landing-language" data-action="language">${state.lang==='en'?'TH':'EN'}</button>
      <div class="theme-segmented-pill landing-theme-pill" role="radiogroup" aria-label="Theme switcher">
        <button type="button" class="theme-seg-btn ${resolvedTheme()==='light'?'active':''}" data-action="set-theme" data-theme="light" aria-label="${state.lang==='th'?'โหมดสว่าง':'Light mode'}" title="${state.lang==='th'?'โหมดสว่าง':'Light mode'}">
          ${ico('sun',15)}<span>${state.lang==='th'?'สว่าง':'Light'}</span>
        </button>
        <button type="button" class="theme-seg-btn ${resolvedTheme()==='dark'?'active':''}" data-action="set-theme" data-theme="dark" aria-label="${state.lang==='th'?'โหมดมืด':'Dark mode'}" title="${state.lang==='th'?'โหมดมืด':'Dark mode'}">
          ${ico('moon',15)}<span>${state.lang==='th'?'มืด':'Dark'}</span>
        </button>
      </div>
      ${actionBtn('menu-open',ico('menu',23),'landing-menu','aria-label="Menu"')}
    </div>
  </div>
  <div class="landing-copy">
    <p class="mini-overline">${html(t('homeEyebrow'))}</p>
    <h1>${html(t('homeTitle')).replace('\n','<br>')}</h1>
    <p class="landing-subline">${html(t('homeDesc'))}</p>
    <button data-action="navigate" data-page="discover" class="landing-cta">
      <span>${html(t('homeExplore'))}</span>${ico('arrow',20)}
    </button>
  </div>
  <div class="landing-bottom">
    <span id="landing-counter">0${landingSlideIndex + 1} / 0${LANDING_SLIDES.length}</span>
    <div class="landing-line"><i id="landing-progress-fill" style="background:var(--brand-lime,#8DE026); width:${((landingSlideIndex + 1) / LANDING_SLIDES.length) * 100}%;"></i></div>
    <span>${html(t('homeHint'))}</span>
  </div>
  <button class="mobile-landing-go" data-action="navigate" data-page="discover">${html(t('enter'))}${ico('arrow',23)}</button>
 </div>`;
}

function categoryButtons(){
 return `<div class="category-list" role="group" aria-label="Category">
  ${CATEGORIES.map(cat=>`
    <button class="category-pill ${state.category===cat?'active':''} ${cat==='sme'?'category-sme-pill':''}" data-action="category" data-category="${cat}" aria-pressed="${state.category===cat}">
      ${cat==='all'?'':ico(({sme:'star',nature:'tree',food:'coffee',stay:'bed',culture:'camera'})[cat],16)}
      <span>${html(t(cat))}</span>
    </button>
  `).join('')}
 </div>`;
}

function filteredPlaces(){
 const q=state.query.trim().toLowerCase();
 let list = state.nearbyActive ? state.nearbyList : PLACES;
 return list.filter(p=>{
   if(state.localOnly && !p.isSme) return false;
   if(state.category==='sme' && !p.isSme) return false;
   if(state.category!=='all' && state.category!=='sme' && p.category!==state.category) return false;
   if(state.region!=='all' && p.region!==state.region) return false;
   if(state.nearbyMaxPrice!=='' && p.priceFrom!=null && p.priceFrom>Number(state.nearbyMaxPrice)) return false;
   if(state.minRating && Number(p.rating||0)<state.minRating) return false;
   if(state.openNowFilter && hoursStatus(p)!=='open') return false;
   if(state.hasPromoFilter && !(p.promo || (p.specialtiesTh && p.specialtiesTh.length) || p.storyTh)) return false;
   if(!q) return true;
   return [p.en,p.th,p.locEn,p.locTh,p.storyEn,p.storyTh,p.provinceTh,p.provinceEn,p.province,p.province?.replace(/-/g,' ')].filter(Boolean).join(' ').toLowerCase().includes(q);
 });
}

function heartButton(p,moreClass=''){
 const isSaved = state.saved.includes(p.id);
 return `<button data-action="save" data-id="${p.id}" class="heart-button ${moreClass} ${isSaved?'on':''}" aria-label="${html(isSaved?t('unsave'):t('save'))} ${html(name(p))}" aria-pressed="${isSaved}">
   <svg width="20" height="20" viewBox="0 0 24 24" fill="${isSaved?'currentColor':'none'}" stroke="currentColor" stroke-width="2">
     ${svg.heart}
   </svg>
 </button>`;
}

function placeCard(p,compact=false){
 const dist = state.nearbyPoint && p.lat && p.lon ? calcDistance(state.nearbyPoint.lat, state.nearbyPoint.lon, p.lat, p.lon) : p.distanceKm;
 const planned=state.trip.includes(p.id);
 const secMeta = `${loc(p)}${dist!=null?` · ${String(dist)} ${t('distKm')}`:''}${p.rating?` · ★ ${p.rating}${p.reviewsCount?` (${p.reviewsCount})`:''}`:''}`;
 const topBadge = sponsored(p) ? t('sponsored') : p.isSme ? (p.smeBadge || '★ Local SME') : 'Published';
 return `<article class="place-card v26-owner-tile item ${compact?'compact':''}" data-place="${p.id}" data-title="${html(name(p))}" data-secondary="${html(secMeta)}" data-text="${html(story(p))}">
  <div class="place-picture v26-tile-image">
    <img src="${photo(p.photo)}" alt="${html(p.en||p.th||'')}" loading="lazy" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>
    <button class="place-card-link" data-action="flip-item" data-id="${p.id}" aria-label="${html(t('view'))}: ${html(name(p))}"></button>
    <div class="v26-tile-status">
      <span class="v26-tag ${sponsored(p)?'sponsored':p.isSme?'sme':'published'}">${html(topBadge)}</span>
    </div>
    ${heartButton(p)}
  </div>
  <div class="v26-tile-content">
    <strong class="v26-tile-title" data-action="place" data-id="${p.id}">${html(name(p))}</strong>
    <p class="v26-tile-loc">+ ${html(loc(p))}${dist!=null?` · ${html(String(dist))} ${html(t('distKm'))}`:''}${p.rating?` · ★ ${p.rating}`:''}</p>
    ${compact?'':`
    <div class="v26-tile-meta">
      <span>${html(catLabel(p))} · <em class="hours-${hoursStatus(p)}" style="font-style:normal;">${html(hoursLabel(p))}</em></span>
      <span>${p.priceFrom!=null?`${state.lang==='th'?'เริ่มต้น':'From'} ${Number(p.priceFrom).toLocaleString()} THB`:(state.lang==='th'?'เข้าชมฟรี':'Free entry')}</span>
    </div>
    <button type="button" class="v26-propose-btn" data-action="place" data-id="${p.id}">
      ${state.lang==='th'?'ดูรายละเอียดสถานที่ →':'Explore place details →'}
    </button>
    <div class="place-card-actions v26-tile-actions">
      <button type="button" class="${state.saved.includes(p.id)?'on':''}" data-action="save" data-id="${p.id}" aria-label="${html(t('save'))}">${ico('heart',13)} <span>${html(t(state.saved.includes(p.id)?'unsave':'save'))}</span></button>
      <button type="button" class="${planned?'on':''}" data-action="trip-toggle" data-id="${p.id}" aria-label="${html(t('addTrip'))}">${ico(planned?'check':'plus',13)} <span>${html(t(planned?'removeTrip':'addTrip'))}</span></button>
      <button type="button" class="btn-dir" data-action="directions" data-id="${p.id}" aria-label="${html(t('route'))}">${ico('route',13)} <span>${html(t('route'))}</span></button>
    </div>`}
  </div>
 </article>`;
}

function smeSpotlightCard(p){
 const dist = state.nearbyPoint && p.lat && p.lon ? calcDistance(state.nearbyPoint.lat, state.nearbyPoint.lon, p.lat, p.lon) : null;
 return `<div class="sme-spotlight-card">
  <div class="smc-img-wrap">
    <img src="${photo(p.photo)}" alt="${html(name(p))}" style="width:100%;height:100%;object-fit:cover;"/>
    <span class="smc-badge">
      ★ ${html(p.smeBadge||'Local SME Spotlight')}
    </span>
    ${heartButton(p,'mini-heart')}
  </div>
  <div style="padding:14px;display:flex;flex-direction:column;flex:1;">
    <h3 class="smc-title">${html(name(p))}</h3>
    <div class="smc-sub">📍 ${html(loc(p))}${dist?` · <strong>${dist} ${html(t('distKm'))}</strong>`:''}</div>
    <div class="smc-quote">
      "${html(story(p))}"
    </div>
    <div class="smc-footer">
      <span class="smc-price-label">${html(t('startingFrom'))} <strong>฿${p.priceFrom?p.priceFrom.toLocaleString():'0'}</strong></span>
      <button class="smc-btn" data-action="place" data-id="${p.id}">
        ${html(t('view'))} →
      </button>
    </div>
  </div>
 </div>`;
}

function nearbyControls(){
 const radii = [0.3, 0.5, 1, 3, 5];
 const n = state.nearbyActive ? filteredPlaces().length : 0;
 const status = state.nearbyBusy ? t('locating')
   : state.geoStatus==='denied' ? t('locationDenied')
   : state.nearbyActive ? (n ? (state.lang==='th' ? `พบ ${n} แห่ง` : `${n} place${n===1?'':'s'}`) : t('noLocal'))
   : t('geoIdle');
 return `<div class="around-me-panel nearby-tools">
  <div class="nearby-top-row">
    <button type="button" class="nearby-toggle ${state.nearbyActive?'on':''}" data-action="${state.nearbyActive?'nearby-stop':'nearby-start'}" ${state.nearbyBusy?'disabled':''} aria-pressed="${state.nearbyActive}">
      <span class="nearby-indicator-dot ${state.nearbyActive?'nearby-dot-active':'nearby-dot-idle'}"></span>
      ${html(t(state.nearbyBusy?'locating':state.nearbyActive?'stopNear':'nearMe'))}
    </button>
    <button type="button" class="nearby-filter-toggle ${state.filtersOpen?'active':''}" data-action="filter-toggle" aria-expanded="${state.filtersOpen}">${ico('sliders',16)} <span>${html(t('filters'))}</span></button>
    <label class="filter-chip-checkbox sme-chip-checkbox">
      <input type="checkbox" id="check-local-only" ${state.localOnly?'checked':''} style="accent-color:var(--gold-pin,#E5A836);"/>
      <span>${html(t('localOnly'))}</span>
    </label>
    <span class="nearby-status-inline">${html(status)}</span>
  </div>
  <div class="nearby-filter-fields ${state.filtersOpen?'expanded':''}">
    <div class="nearby-filter-row">
      <div class="nearby-field-group">
        <span class="filter-group-label">${html(t('radius'))}:</span>
        <div class="filter-chip-row" role="group" aria-label="${html(t('radius'))}">
          ${radii.map(r=>`
            <button type="button" class="filter-chip ${state.nearbyRadius===r?'active':''}" data-action="set-radius" data-radius="${r}" aria-pressed="${state.nearbyRadius===r}">
              ${r < 1 ? Math.round(r*1000)+' m' : r+' km'}
            </button>
          `).join('')}
        </div>
      </div>
      
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
        <button type="button" class="filter-toggle-pill ${state.openNowFilter?'active':''}" data-action="toggle-open-now">
          ${state.openNowFilter?'✓ ':'● '}${html(t('openNow'))}
        </button>
        <button type="button" class="filter-toggle-pill ${state.hasPromoFilter?'active':''}" data-action="toggle-has-promo">
          ${state.hasPromoFilter?'✓ ':'🎁 '}${html(t('hasPromo'))}
        </button>
      </div>
      <div class="nearby-select-row">
        <label class="filter-select-label"><span>${html(t('budget'))}:</span>
          <select id="near-price" class="nearby-select" aria-label="${html(t('budget'))}">
            <option value="" ${state.nearbyMaxPrice===''?'selected':''}>${html(t('anyBudget'))}</option>
            <option value="300" ${state.nearbyMaxPrice==='300'?'selected':''}>≤ ฿300</option>
            <option value="1000" ${state.nearbyMaxPrice==='1000'?'selected':''}>≤ ฿1,000</option>
            <option value="3000" ${state.nearbyMaxPrice==='3000'?'selected':''}>≤ ฿3,000</option>
          </select>
        </label>
        <label class="filter-select-label"><span>${html(t('minRating'))}:</span>
          <select id="min-rating" class="nearby-select" aria-label="${html(t('minRating'))}">
            <option value="0" ${state.minRating===0?'selected':''}>${html(t('all'))}</option>
            <option value="4" ${state.minRating===4?'selected':''}>★ 4+</option>
            <option value="4.5" ${state.minRating===4.5?'selected':''}>★ 4.5+</option>
          </select>
        </label>
      </div>
    </div>
  </div>
  ${state.geoStatus==='denied'?`
    <div class="geo-banner denied">
      <span class="geo-denied-label">📍 ${html(t('pickProvince'))}:</span>
      <div class="filter-chip-row" style="margin:0;padding:0;">
        <button type="button" class="filter-chip" data-action="set-manual-point" data-lat="18.7883" data-lon="98.9853" data-name="Chiang Mai">${state.lang==='th'?'เชียงใหม่':'Chiang Mai'}</button>
        <button type="button" class="filter-chip" data-action="set-manual-point" data-lat="13.7563" data-lon="100.5018" data-name="Bangkok">${state.lang==='th'?'กรุงเทพฯ':'Bangkok'}</button>
        <button type="button" class="filter-chip" data-action="set-manual-point" data-lat="19.1764" data-lon="100.9152" data-name="Nan">${state.lang==='th'?'น่าน':'Nan'}</button>
        <button type="button" class="filter-chip" data-action="set-manual-point" data-lat="8.9165" data-lon="98.5320" data-name="Surat Thani">${state.lang==='th'?'สุราษฎร์ฯ':'Surat Thani'}</button>
      </div>
    </div>
  `:''}
 </div>`;
}

function startNearby(){
 if(!navigator.geolocation){state.geoStatus='denied';toast(t('locationDenied'));render({keepScroll:true});return}
 state.nearbyBusy=true;render({keepScroll:true});
 navigator.geolocation.getCurrentPosition(pos=>{
   state.geoStatus='allowed';
   state.nearbyPoint={lat:pos.coords.latitude,lon:pos.coords.longitude};
   state.mapCenter={...state.nearbyPoint,z:state.nearbyRadius<=1?14:state.nearbyRadius<=5?12:10};
   fetchNearby();
 },()=>{
   state.nearbyBusy=false;state.geoStatus='denied';toast(t('locationDenied'));render({keepScroll:true});
 },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}

function discover(){
 const found=filteredPlaces();
 const top=found.slice(0,state.showAll||state.category!=='all'||state.query||state.nearbyActive?found.length:6);
 const smePlaces=PLACES.filter(p=>p.isSme&&!sponsored(p));
 const sponsoredPlaces=PLACES.filter(sponsored);
 const hidden=PLACES.filter(p=>/hidden/i.test(p.smeBadge||''));
 const provinces=[...new Map(PLACES.filter(p=>p.province).map(p=>[p.province,p]))];

 return `<div class="app-shell explore-page">
  ${header()}
  <div id="smooth-wrapper">
  <div id="smooth-content">
  <main class="content-area">
    <div class="explore-heading v26-page-heading" data-speed="clamp(0.85)">
      <div class="explore-heading-main">
        <p class="mini-overline explore-eyebrow">GOAROUND / ${html(t('exploreEyebrow'))}</p>
        <h1 class="split-text-target v26-serif-h1">${html(t('exploreTitle').replace(/\n/g, ' '))}<span class="v26-olive-dot">.</span></h1>
        <p class="explore-quiet">${html(t('exploreIntro'))}</p>
      </div>
      <div class="explore-quick-toolbar" role="toolbar" aria-label="Quick Navigation">
        <button type="button" id="btn-jump-pin" class="explore-pill-btn" data-action="gsap-jump" data-target="#pinned-shape">
          <span>${state.lang==='th'?'สถานที่ลับน่าไป':'Hidden gems'}</span>
        </button>
        <button type="button" id="btn-jump-gallery" class="explore-pill-btn explore-pill-highlight" data-action="gsap-jump" data-target="#gallery-section">
          <span>${state.lang==='th'?'สถานที่น่าสนใจ':'Popular places'}</span>
        </button>
      </div>
    </div>

    <!-- v2.6 Editorial Hero Banner & 4-KPI Summary Cards (from docs/screenshots) -->
    <section class="v26-owner-hero" aria-label="Editorial highlight">
      <div class="v26-owner-hero-overlay">
        <span>${state.lang==='th'?'YOUR JOURNEY. LOCAL THAI HERITAGE.':'YOUR PLACES. THEIR NEXT DISCOVERY.'}</span>
        <h2>${state.lang==='th'?'สถานที่และร้านค้าชุมชนที่คู่ควรแก่การค้นพบ.':'Great places deserve<br/>to be found.'}</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" class="v26-sage-btn" data-action="open-ai">
            ${state.lang==='th'?'ให้ AI แนะนำทริป ↗':'Ask AI Advisor ↗'}
          </button>
          <button type="button" class="v26-ghost-light-btn" data-action="navigate" data-page="map">
            ${state.lang==='th'?'สำรวจแผนที่รอบตัว ↗':'Open live map ↗'}
          </button>
        </div>
      </div>
    </section>

    ${state.onboarding?`
      <aside class="onboarding-card" role="dialog" aria-label="${html(t('onboardTitle'))}">
        <div>
          <h3>${html(t('onboardTitle'))}</h3>
          <p>${html(t('onboardBody'))}</p>
        </div>
        <button class="ob-close" data-action="dismiss-onboard" aria-label="${html(t('dismiss'))}">${ico('x',18)}</button>
      </aside>
    `:''}

    <form class="hero-search" id="home-search" role="search" data-speed="clamp(0.9)">
      <span aria-hidden="true">${ico('search',18)}</span>
      <input id="home-query" type="search" placeholder="${html(t('search'))}" value="${html(state.query)}" aria-label="${html(t('search'))}" autocomplete="off"/>
      ${state.query?`<button type="button" class="clear-query" data-action="clear-search" aria-label="${html(t('clear'))}">✕</button>`:''}<button class="search-go" type="submit">${html(t('searchShort'))}</button>
      <div id="home-suggest" class="home-suggest" role="listbox" hidden></div>
    </form>

    ${categoryButtons()}
    ${nearbyControls()}


    ${state.placesError?`<div class="state-panel" role="alert"><h2>${html(t('accountError'))}</h2><p>${html(state.placesError)}</p></div>`:''}

    ${!state.nearbyActive && sponsoredPlaces.length?`
      <section class="sponsored-rail" aria-label="${html(t('sponsored'))}">
        <h2>${html(t('sponsored'))}</h2>
        <p>${state.lang==='th'?'รายการนี้เป็นพื้นที่โฆษณา ไม่ใช่การจัดอันดับตามความนิยม':'Paid placements — not a natural ranking.'}</p>
        <div class="section-rail">${sponsoredPlaces.map(p=>smeSpotlightCard(p)).join('')}</div>
      </section>
    `:''}

        <!-- Local Stories & Community Heritage Rail -->
    ${!state.nearbyActive && (!state.category || state.category==='all' || state.category==='sme') ? `
      <section style="margin-bottom:28px;">
        <div class="section-line">
          <h2>${html(t('communityStories'))}</h2>
          <small class="spotlight-sub">${html(t('communityStoriesSub'))}</small>
        </div>
        <div class="local-stories-rail">
          ${smePlaces.slice(0, 6).map(p => {
            const quote = story(p) || (state.lang==='th'?'สืบทอดมรดกและวิถีชุมชนท้องถิ่น':'Authentic community enterprise & living heritage');
            const promoText = p.promo || (state.lang==='th'?'สิทธิพิเศษ: ส่วนลดร้านค้าชุมชน':'Special local community offer');
            return `
              <div class="story-card" data-action="place" data-id="${p.id}">
                <div class="story-card-media">
                  <img src="${photo(p.photo)}" alt="${html(name(p))}" loading="lazy" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>
                </div>
                <div class="story-card-body">
                  <h3>${html(name(p))}</h3>
                  <p class="story-quote">"${html(quote.slice(0, 95))}${quote.length>95?'…':''}"</p>
                  <span class="story-promo-badge">🎁 ${html(promoText)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Recommended for You -->
    ${!state.nearbyActive && !state.query && PLACES.filter(p=>p.rating>=4.7).length ? `
      <section class="spotlight-section" style="margin-bottom:28px;">
        <div class="section-line">
          <h2>${html(t('recommendedForYou'))}</h2>
          <small class="spotlight-sub">${state.lang==='th'?'คัดสรรสถานที่คะแนนรีวิวสูงและเป็นที่ประทับใจ':'Curated high-rated gems with excellent reviews'}</small>
        </div>
        <div class="featured-rail">
          ${PLACES.filter(p=>p.rating>=4.7).slice(0, 4).map(x=>placeCard(x)).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Local SME Spotlight Rail -->
    ${!state.nearbyActive && smePlaces.length && (!state.category || state.category==='all' || state.category==='sme') ? `
      <section style="margin-bottom:34px;">
        <div class="section-line">
          <h2>${html(t('spotlightTitle'))}</h2>
          <small class="spotlight-sub">${html(t('spotlightSub'))}</small>
        </div>
        <div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;">
          ${smePlaces.map(smeSpotlightCard).join('')}
        </div>
      </section>
    `:''}

    <!-- Destinations Grid (Flip Plugin Interactive Grid) -->
    <section class="spotlight-section" id="gallery-section">
      <div class="section-line">
        <h2>${state.nearbyActive?html(t('nearActive')):state.query?html(t('searchResults')):html(t('popular'))}</h2>
        ${!state.nearbyActive&&!state.query?`
          <button data-action="show-all" class="quiet-link">${html(t(state.showAll?'more':'showAll'))} ${ico('arrow',16)}</button>
        `:''}
      </div>
      ${found.length?`
        <div class="gallery-wrapper">
          <div class="featured-rail gallery ${top.length<3?'few':''}">
            ${top.map(x=>placeCard(x)).join('')}
          </div>
        </div>
      `:`
        <div class="empty-light">
          ${ico('search',27)}
          <h2>${html(t('nothing'))}</h2>
          <p>${html(t('different'))}</p>
        </div>
      `}
    </section>

    ${!state.nearbyActive && hidden.length?`
      <section class="secondary-section">
        <div class="section-line"><h2>${html(t('hiddenGem'))}</h2></div>
        <div class="mini-grid">${hidden.map(p=>`
          <button class="mini-discovery" data-action="place" data-id="${p.id}">
            <img src="${photo(p.photo)}" alt="" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>
            <span><b>${html(name(p))}</b><small>${html(loc(p))}</small></span>
          </button>`).join('')}
        </div>
      </section>
    `:''}

    ${!state.nearbyActive && provinces.length?`
      <section class="secondary-section">
        <div class="section-line"><h2>${html(t('byProvince'))}</h2>
          
        </div>
        <div class="filter-chip-row">
          ${provinces.map(([key,p])=>`
            <button class="filter-chip ${state.query===key?'active':''}" data-action="province-filter" data-province="${html(key)}">${html(state.lang==='th'?p.provinceTh||p.locTh:p.provinceEn||p.locEn)}</button>
          `).join('')}
        </div>
      </section>
    `:''}

    <!-- Editorial Callout (ScrollTrigger Pinned Showcase) -->
    <div class="editorial-band pinned-shape-card" id="pinned-shape" style="border-radius:22px;padding:36px;margin-top:40px;">
      <div>
        <span class="mini-overline editorial-overline">LOCAL FIRST COMMUNITY · PINNED SHOWCASE</span>
        <h2>${state.lang==='th'?'ค้นพบเสน่ห์ชุมชน\nร่วมส่งเสริมผู้ประกอบการท้องถิ่น':'Explore local heritage.\nSupport genuine community SMEs.'}</h2>
      </div>
      <button data-action="navigate" data-page="map" class="outline-light btn-outline-lime">
        ${html(t('map'))} ${ico('arrow',19)}
      </button>
    </div>
  </main>
  </div>
  </div>
  ${bottomNav()}
 </div>`;
}

function bottomSheet(p){
 if(!p) return '';
 const saved = state.saved.includes(p.id);
 const planned = state.trip.includes(p.id);
 const hStatus = hoursStatus(p);
 const isThai = state.lang === 'th';
 const title = html(name(p));
 const location = html(loc(p));
 const narrative = html(story(p));

 return `<div class="traval-bottom-sheet state-${state.bottomSheetState}" id="traval-active-sheet" style="display:${state.bottomSheetState==='closed'?'none':'flex'};height:${state.bottomSheetState==='peek'?'190px':state.bottomSheetState==='half'?'52vh':'86vh'};">
  <!-- Touch handle -->
  <div class="sheet-drag-bar" data-action="toggle-sheet">
    <div class="sheet-handle"></div>
  </div>

  <div class="sheet-body">
    <div class="sheet-top-row">
      <img src="${photo(p.photo)}" alt="${title}" class="sheet-thumb" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px;">
          ${p.isSme?`<span class="badge badge-sme">★ ${html(t('smeShort'))}</span>`:''}
          <span class="${hStatus==='open'?'status-pill-open':hStatus==='closed'?'status-pill-closed':'status-pill-unknown'} sheet-status">● ${html(hoursLabel(p))}</span>
        </div>
        <h3 class="sheet-title">${title}</h3>
        <small class="sheet-loc">📍 ${location}${p.rating?` · ★ ${p.rating}`:''}</small>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="sheet-actions" style="flex-wrap:wrap;">
      <button data-action="place" data-id="${p.id}" class="btn-lime-pill">
        ${ico('compass',16)} <span>${html(t('view'))}</span>
      </button>
      <button data-action="directions" data-id="${p.id}" class="action-outline" style="min-height:40px;padding:0 14px;font-size:12px;">
        ${ico('route',16)} <span>${html(t('route'))}</span>
      </button>
      <button data-action="trip-toggle" data-id="${p.id}" class="action-outline" style="min-height:40px;padding:0 14px;font-size:12px;">
        ${ico(planned?'check':'plus',15)} <span>${html(t(planned?'removeTrip':'addTrip'))}</span>
      </button>
      <button data-action="save" data-id="${p.id}" class="heart-button ${saved?'on':''} btn-icon-circle" aria-label="${html(t('save'))}">
        ${ico('heart',17)}
      </button>
      <button data-action="share-place" data-id="${p.id}" class="btn-icon-circle" aria-label="${html(t('share'))}">
        ${ico('share',17)}
      </button>
      ${p.phone?`
        <a href="tel:${p.phone}" class="btn-icon-circle btn-icon-link" aria-label="${html(t('call'))}">
          ${ico('phone',17)}
        </a>
      `:''}
      <button data-action="close-sheet" class="btn-icon-circle" aria-label="${html(t('close'))}">
        ${ico('x',17)}
      </button>
    </div>

    ${narrative?`
      <div class="local-story-block">
        <strong class="local-story-label">📖 ${html(t('localStory'))}:</strong>
        "${narrative}"
      </div>
    `:''}

    ${p.specialtiesTh && p.specialtiesTh.length?`
      <div style="margin-bottom:12px;">
        <span class="specialty-section-label">✨ ${html(t('specialties'))}:</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(isThai?p.specialtiesTh:p.specialtiesEn||p.specialtiesTh).map(item=>`
            <span class="specialty-tag">${html(item)}</span>
          `).join('')}
        </div>
      </div>
    `:''}

    <div class="detail-info-grid sheet-info-grid">
      <span>🕒 ${isThai?'เวลาเปิด-ปิด':'Hours'}: <strong>${html(p.openHours||(isThai?'ทุกวัน':'Daily'))}</strong></span>
      <span>💰 ${isThai?'ราคา':'Price'}: <strong>${p.priceFrom?`฿${p.priceFrom.toLocaleString()}`:(isThai?'ฟรี':'Free')}</strong></span>
    </div>
  </div>
 </div>`;
}

function detail(p){
 const saved=state.saved.includes(p.id);
 const planned=state.trip.includes(p.id);
 const hStatus = hoursStatus(p);
 const isThai = state.lang==='th';
 const dist = state.nearbyPoint && p.lat && p.lon ? calcDistance(state.nearbyPoint.lat, state.nearbyPoint.lon, p.lat, p.lon) : p.distanceKm;

 return `<div class="detail-page">
  ${header()}
  <div id="smooth-wrapper"><div id="smooth-content">
  <main class="detail-grid">
    <div class="detail-photo">
      <img src="${photo(p.photo)}" alt="${html(name(p))}"/>
      <div class="detail-gradient"></div>
      <div class="detail-top-actions">
        ${actionBtn('back',ico('left',23),'glass-icon','aria-label="Back"')}
        ${heartButton(p,'detail-heart')}
      </div>
      <div class="detail-photo-caption">
        <span>${ico('pin',16)} ${html(loc(p))}</span>
        <h1>${html(name(p))}</h1>
      </div>
    </div>
    <div class="detail-info">
      <div class="detail-overline" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
        ${sponsored(p)?`<span class="badge badge-sponsored">AD / SPONSORED</span>`:''}
        ${p.isSme?`<span class="badge badge-sme">★ ${html(p.smeBadge||'Local SME Spotlight')}</span>`:''}
        ${p.isSme?`<span class="sme-verified-badge" title="${html(t('notQuality'))}">✓ ${html(t('verifiedData'))}</span>`:''}
        <span class="${hStatus==='open'?'status-pill-open':hStatus==='closed'?'status-pill-closed':'status-pill-unknown'}">
          ● ${html(hoursLabel(p))}
        </span>
      </div>

      <div class="detail-title">
        <h2>${html(name(p))}</h2>
        <div class="detail-meta">
          <span>${ico('pin',15)} ${html(loc(p))}</span>
          ${dist!=null?`<span class="distance-label">· 📍 ${isThai?`ห่าง ${dist} กม.`:`${dist} km away`}</span>`:''}
          ${p.rating?`<span class="rating-label">· ★ ${p.rating}${p.reviewsCount?` (${p.reviewsCount} ${isThai?'รีวิว':'reviews'})`:''}</span>`:''}
        </div>
      </div>

      <div class="detail-info-grid">
        <div>
          <span class="detail-grid-label">🕒 ${isThai?'เวลาเปิด-ปิด':'Opening hours'}</span>
          <strong class="detail-grid-value">${html(p.openHours||(isThai?'ไม่มีข้อมูลเวลา':'Hours not available'))}</strong>
        </div>
        <div>
          <span class="detail-grid-label">💰 ${isThai?'ช่วงราคา':'Price range'}</span>
          <strong class="detail-grid-value">${p.priceFrom?`฿${Number(p.priceFrom).toLocaleString()}`:(isThai?'ฟรี / ไม่เสียค่าเข้า':'Free')}</strong>
        </div>
      </div>

      <!-- Action bar -->
      <div class="detail-main-actions" style="margin:20px 0;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="action-outline" data-action="directions" data-id="${p.id}" title="${html(t('route'))}">${ico('route',17)} ${html(t('route'))}</button>
        <a class="action-outline btn-google-reviews" href="${html(window.TravalLinks?TravalLinks.placeUrl(p):'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.lat+','+p.lon))}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">${ico('star',17)} <span>${state.lang==='th'?'รีวิวบน Google':'Google reviews'} ↗</span></a><!-- Tommy: link only; Google reviews are never copied -->
        <button class="action-lime" data-action="trip-toggle" data-id="${p.id}">${html(t(planned?'removeTrip':'addTrip'))} ${ico(planned?'check':'arrow',19)}</button>
        <button class="action-outline" data-action="explore-nearby-place" data-id="${p.id}" class="action-outline btn-outline-blue" title="${html(t('exploreNearby'))}">${ico('compass',17)} ${html(t('exploreNearby'))}</button>
        <button class="action-outline" data-action="share-place" data-id="${p.id}">${ico('share',17)} ${html(t('share'))}</button>
        ${p.phone?`<a href="tel:${p.phone}" class="action-outline" style="text-decoration:none;">${ico('phone',17)} ${html(t('call'))}</a>`:''}
      </div>

      ${story(p)?`
        <section class="detail-about local-story-block">
          <h3 class="local-story-heading">📖 ${html(t('localStory'))}</h3>
          <p style="margin:0;font-style:italic;line-height:1.6;">"${html(story(p))}"</p>
        </section>
      `:''}

      ${p.specialtiesTh?`
        <div style="margin:16px 0;">
          <strong class="specialty-section-label">✨ ${html(t('specialties'))}</strong>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${p.specialtiesTh.map(x=>`<span class="specialty-tag">${html(x)}</span>`).join('')}
          </div>
        </div>
      `:''}

      <section class="detail-gallery">
        <div class="detail-gallery-head"><h3>${html(t('gallery'))}</h3></div>
        <div class="gallery-track">
          ${(p.gallery||[p.photo]).map(img=>`<img src="${photo(img)}" alt="Gallery photo" loading="lazy"/>`).join('')}
        </div>
      </section>
      ${placeReviewsUi(p)}
    </div>
  </main>
  </div></div>
  ${bottomNav()}
 </div>`;
}


function placeReviewsUi(p){
  const rawReviews = (state.reviewCache[p.id] || DEFAULT_REVIEWS[p.id] || []);
  const reviews = rawReviews.map(r => ({
    ...r,
    rating: Number(r.rating ?? r.stars ?? 5),
    author: r.author || r.userName || 'Traveller',
    date: r.date || (r.updatedAt ? String(r.updatedAt).slice(0, 10) : 'Recent'),
    text: r.text || r.body || ''
  }));
  let filtered = [...reviews];
  if (state.reviewFilter === '5') filtered = filtered.filter(r => r.rating === 5);
  else if (state.reviewFilter === '4') filtered = filtered.filter(r => r.rating === 4);
  else if (state.reviewFilter === '3') filtered = filtered.filter(r => r.rating === 3);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : (p.rating || '4.8');
  const count5 = reviews.filter(r => r.rating === 5).length;
  const count4 = reviews.filter(r => r.rating === 4).length;
  const count3 = reviews.filter(r => r.rating <= 3).length;
  const total = Math.max(reviews.length, 1);

  return `
  <section class="detail-reviews-container">
    <div class="detail-reviews-head">
      <h3>⭐ ${html(t('publicReviews'))} (${reviews.length})</h3>
    </div>

    <!-- Rating Summary -->
    <div class="review-summary-grid">
      <div class="review-score-big">
        <div class="review-score-num">${avg}</div>
        <div class="review-stars-row">★★★★★</div>
        <div class="review-total-count">${reviews.length} ${state.lang==='th'?'รีวิว':'reviews'}</div>
      </div>
      <div class="review-star-bars">
        <div class="star-bar-row">
          <span>5★</span>
          <div class="star-bar-track"><div class="star-bar-fill" style="width:${Math.round(count5/total*100)}%;"></div></div>
          <span>${count5}</span>
        </div>
        <div class="star-bar-row">
          <span>4★</span>
          <div class="star-bar-track"><div class="star-bar-fill" style="width:${Math.round(count4/total*100)}%;"></div></div>
          <span>${count4}</span>
        </div>
        <div class="star-bar-row">
          <span>3★</span>
          <div class="star-bar-track"><div class="star-bar-fill" style="width:${Math.round(count3/total*100)}%;"></div></div>
          <span>${count3}</span>
        </div>
      </div>
    </div>

    <!-- Review Filter Tabs -->
    <div class="review-filter-tabs">
      <button type="button" class="review-tab-btn ${state.reviewFilter==='all'?'active':''}" data-action="set-review-filter" data-filter="all">${html(t('all'))} (${reviews.length})</button>
      <button type="button" class="review-tab-btn ${state.reviewFilter==='5'?'active':''}" data-action="set-review-filter" data-filter="5">5 ★ (${count5})</button>
      <button type="button" class="review-tab-btn ${state.reviewFilter==='4'?'active':''}" data-action="set-review-filter" data-filter="4">4 ★ (${count4})</button>
      <button type="button" class="review-tab-btn ${state.reviewFilter==='3'?'active':''}" data-action="set-review-filter" data-filter="3">≤ 3 ★ (${count3})</button>
    </div>

    <!-- Review Cards -->
    <div class="review-cards-list">
      ${filtered.length ? filtered.map(r => {
        const isLiked = state.reviewLikes[r.id];
        const likes = (r.helpful || 0) + (isLiked ? 1 : 0);
        return `
          <article class="review-card-item">
            <div class="review-card-header">
              <div class="review-author-info">
                <div class="review-avatar-circle">${html((r.author||'U')[0].toUpperCase())}</div>
                <div>
                  <div class="review-author-name">${html(r.author || 'Traveller')}</div>
                  <div class="review-card-date">${html(r.date || 'Recent')}</div>
                </div>
              </div>
              <div style="color:#F59E0B;font-size:14px;font-weight:700;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            <p class="review-text-content">${html(r.text)}</p>
            <div class="review-footer-actions">
              <button type="button" class="btn-helpful-reaction ${isLiked?'liked':''}" data-action="like-review" data-id="${r.id}">
                👍 ${html(t('helpful'))} (${likes})
              </button>
            </div>
          </article>
        `;
      }).join('') : `
        <p style="color:var(--color-ink-muted,#88998E);text-align:center;padding:16px;">${html(t('noReviews'))}</p>
      `}
    </div>

    <!-- Write a Review Form -->
    <div class="write-review-form-card">
      <h4 style="margin:0 0 8px;font-size:15px;font-weight:700;">${html(t('writeReviewTitle'))}</h4>
      <div class="interactive-stars-picker">
        ${[1, 2, 3, 4, 5].map(star => `
          <button type="button" class="star-btn ${state.reviewRatingInput >= star ? 'active' : ''}" data-action="set-review-stars" data-stars="${star}">★</button>
        `).join('')}
      </div>
      <textarea id="place-review-textarea" class="review-textarea-field" placeholder="${html(t('ratingPlaceholder'))}"></textarea>
      <div style="display:flex;justify-content:flex-end;">
        <button type="button" class="action-lime" data-action="submit-place-review" data-id="${p.id}">
          ${html(t('submitReviewBtn'))}
        </button>
      </div>
    </div>
  </section>
  `;
}

function mapPage(){
 const places=filteredPlaces();
 const pick=places.find(p=>p.id===state.mapSelected)||places[0];

 return `<div class="app-shell map-page">
  ${header()}
  <main class="map-wrap">
    <div class="map-toolbar">
      <div>
        <span class="mini-overline map-overline">GOAROUND / EXPLORE MAP</span>
        <h1>${html(t('map'))}</h1>
      </div>
      <label class="map-region-label">
        ${html(t('mapArea'))}
        <select id="map-region">
          <option value="all" ${state.region==='all'?'selected':''}>${html(t('allRegions'))}</option>
          ${[
            ['north', 'regionNorth'],
            ['central', 'regionCentral'],
            ['south', 'regionSouth'],
            ['northeast', 'regionNortheast'],
            ['east', 'regionEast'],
            ['west', 'regionWest']
          ].map(([key, i18nKey])=>`<option value="${key}" ${state.region===key?'selected':''}>${html(t(i18nKey))}</option>`).join('')}
        </select>
      </label>
    </div>

    ${nearbyControls()}

    ${tripMapChip()}
    <div class="map-layout">
      <div class="map-frame" id="map-frame-box" style="position:relative;cursor:grab;">
        <div class="map-paper">
          <div class="tile-layer" id="tile-layer"></div>
          <div class="pin-layer" id="pin-layer"></div>
        </div>

        <!-- Floating Search This Area button -->
        <button id="btn-search-area" data-action="search-area" class="btn-search-area" style="display:${state.mapPannedAway?'inline-flex':'none'};">
          ${ico('search',15)} ${html(t('searchThisArea'))}
        </button>

        <div class="map-place-counter" style="display:flex;align-items:center;gap:6px;">
          ${ico('pin',16)}
          <span>${places.length} ${html(state.lang==='th'?'สถานที่':'places')}</span>
          ${state.localOnly?`<span class="badge badge-sme badge-sme-mini">Local SME</span>`:''}
        </div>

        <!-- Controls: My Location & Follow Me & Zoom -->
        <div class="map-controls">
          <button data-action="my-location" title="${html(t('myLocation'))}" class="btn-map-location">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </button>
          <button data-action="toggle-follow" class="${state.followMe?'active':''}" title="${html(t('followMe'))}" >
            ${ico('locate',18)}
          </button>
          <button data-action="map-zoom" data-step="1" aria-label="${html(t('mapZoomIn'))}">${ico('plus',18)}</button>
          <button data-action="map-zoom" data-step="-1" aria-label="${html(t('mapZoomOut'))}">${ico('minus',18)}</button>
        </div>

        <span class="map-copyright">© OpenStreetMap contributors · GoAround</span>
      </div>

      <!-- Drawer Side Panel -->
      <aside class="map-drawer">
        <div class="map-drawer-heading">
          <span>${html(t('list'))}</span>
          <span>${places.length} places</span>
        </div>
        <div class="map-items">
          ${places.map(p=>`
            <button class="map-result ${p.id===pick?.id?'active':''}" data-action="map-select" data-id="${p.id}">
              <img src="${photo(p.photo)}" alt=""/>
              <span>
                <b>${html(name(p))} ${p.isSme?'★':''}</b>
                <small>${html(loc(p))}</small>
              </span>
              ${ico('arrow',17)}
            </button>
          `).join('')}
        </div>
        ${pick?`
          <div class="map-picked">
            <img src="${photo(pick.photo)}" alt=""/>
            <div>
              <strong>${html(name(pick))}</strong>
              <small>${html(loc(pick))}</small>
            </div>
            <button data-action="place" data-id="${pick.id}">${ico('arrow',19)}</button>
          </div>
        `:''}
      </aside>
    </div>
  </main>
  ${bottomSheet(getPlace(state.bottomSheetPlaceId)||pick)}
  ${bottomNav()}
 </div>`;
}

function collection(){
 const isTrip=state.page==='trip';
 let items=(isTrip?state.trip:state.saved).map(getPlace).filter(Boolean);

 if(state.collectionQuery){
   const cq = state.collectionQuery.toLowerCase();
   items = items.filter(p => [name(p), loc(p), p.provinceTh, p.provinceEn].filter(Boolean).join(' ').toLowerCase().includes(cq));
 }

 if(!isTrip && state.collectionFilter==='sme'){
   items = items.filter(p=>p.isSme);
 } else if(!isTrip && ['nature','food','stay','culture'].includes(state.collectionFilter)){
   items = items.filter(p=>p.category===state.collectionFilter);
 } else if(!isTrip && state.collectionFilter!=='all'){
   items = items.filter(p=>p.province===state.collectionFilter);
 }

 // Unique provinces in saved
 const provinces = new Map();
 state.saved.map(getPlace).filter(Boolean).forEach(p=>{
   if(p.province && !provinces.has(p.province)){
     provinces.set(p.province, state.lang==='th'?p.provinceTh||p.provinceEn:p.provinceEn);
   }
 });

 return `<div class="app-shell collection-page ${isTrip?'trip-page':''}">
  ${header()}
  <div id="smooth-wrapper"><div id="smooth-content">
  <main class="collection-content">
    <div class="collection-intro">
      <span class="mini-overline collection-overline">GOAROUND / YOUR SPACE</span>
      <h1>${html(t('myCollections'))}<span class="tiny-accent brand-dot">.</span></h1>
      <p class="collection-sub" style="margin-top:6px;">${html(t('collections'))}</p>
    </div>

    <div class="collection-bar">
      <button data-action="navigate" data-page="saved" class="${!isTrip?'active':''}">
        ${html(t('allSaved'))} <small class="col-tab-badge ${!isTrip?'col-tab-badge-active':''}">${state.saved.length}</small>
      </button>
      <button data-action="navigate" data-page="trip" class="${isTrip?'active':''}">
        ${html(t('planTrip'))} <small class="col-tab-badge ${isTrip?'col-tab-badge-active':''}">${state.trip.length}</small>
      </button>
    </div>

    ${isTrip ? tripRouteCard() : ''}

    <!-- Collection Search Bar -->
    <div class="collection-search-wrap">
      <input type="search" id="collection-search-input" class="collection-search-input" placeholder="${state.lang==='th'?'🔍 ค้นหาในรายการที่บันทึกไว้...':'🔍 Search in your collection...'}" value="${html(state.collectionQuery)}" autocomplete="off"/>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0;flex-wrap:wrap;">
      ${!isTrip ? `
        <!-- Filter chips: SME, Categories & Provinces -->
        <div class="traval-chips-container" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;flex:1;">
          <button class="traval-chip ${state.collectionFilter==='all'?'active':''}" data-action="collection-filter" data-filter="all">
            ${html(t('allSaved'))} (${state.saved.length})
          </button>
          <button class="traval-chip chip-sme ${state.collectionFilter==='sme'?'active':''}" data-action="collection-filter" data-filter="sme">
            ★ ${html(t('sme'))}
          </button>
          ${[['nature','nature'],['food','food'],['stay','stay'],['culture','culture']].map(([catKey,lblKey])=>`
            <button class="traval-chip ${state.collectionFilter===catKey?'active':''}" data-action="collection-filter" data-filter="${catKey}">
              ${html(t(lblKey))}
            </button>
          `).join('')}
          ${Array.from(provinces.entries()).map(([key,lbl])=>`
            <button class="traval-chip ${state.collectionFilter===key?'active':''}" data-action="collection-filter" data-filter="${key}">
              📍 ${html(lbl)}
            </button>
          `).join('')}
        </div>
      `:''}
      <button type="button" class="traval-chip ${state.selectMode?'active':''}" data-action="toggle-select-mode" style="margin-left:auto;white-space:nowrap;font-weight:700;">
        ${state.selectMode ? '✕ ' + (state.lang==='th'?'ยกเลิกเลือก':'Cancel select') : '☑ ' + (state.lang==='th'?'เลือกหลายรายการ':'Select multiple')}
      </button>
    </div>

    ${state.selectMode && state.selectedIds.length?`
      <div class="select-toolbar">
        <span class="select-toolbar-count">${state.lang==='th'?`เลือกแล้ว ${state.selectedIds.length} แห่ง`:`${state.selectedIds.length} selected`}</span>
        <div style="display:flex;gap:8px;">
          
          <button type="button" data-action="batch-add-trip" class="btn-batch-trip">
            + ${html(t('multiAddTrip'))}
          </button>
          <button type="button" data-action="send-to-planner" class="btn-send-planner">
            ${html(t('sendTrip'))} ↗
          </button>
          <button type="button" data-action="delete-selected-saved" class="btn-delete-selected">
            ${state.lang==='th'?'ลบออก':'Remove'}
          </button>
        </div>
      </div>
    `:''}

    ${items.length?`
      <div class="collection-grid">
        ${items.map((p,i)=>{
          const isSelected = state.selectedIds.includes(p.id);
          return `
          <div class="collection-item ${state.selectMode?'select-active':''} ${isSelected?'selected':''}">
            ${state.selectMode?`
              <span class="item-select-check ${isSelected?'checked':''}" data-action="toggle-select-item" data-id="${p.id}">${isSelected?'✓':''}</span>
            `:''}
            <button class="collection-photo" data-action="${state.selectMode?'toggle-select-item':'place'}" data-id="${p.id}">
              <img src="${photo(p.photo)}" alt=""/>
              <span>
                <b>${html(name(p))} ${p.isSme?'★':''}</b>
                <small>${html(loc(p))}</small>
              </span>
            </button>
            <div class="collection-actions">
              ${isTrip?`
                <button data-action="move-trip" data-id="${p.id}" data-dir="-1" aria-label="Move up" ${i===0?'disabled':''}>${ico('up',16)}</button>
                <button data-action="move-trip" data-id="${p.id}" data-dir="1" aria-label="Move down" ${i===items.length-1?'disabled':''}>${ico('down',16)}</button>
                <button data-action="trip-toggle" data-id="${p.id}" aria-label="Remove from trip">${ico('trash',16)}</button>
              `:`
                <button data-action="save" data-id="${p.id}" aria-label="Remove from saved">${ico('heart',18)}</button>
                <button data-action="trip-toggle" data-id="${p.id}">${ico(state.trip.includes(p.id)?'check':'plus',18)}</button>
                <button data-action="directions" data-id="${p.id}" title="${html(t('route'))}">${ico('route',16)}</button>
              `}
            </div>
          </div>
        `;}).join('')}
      </div>
    `:`
      <div class="collection-empty">
        ${ico(isTrip?'map':'heart',34)}
        <h2>${html(t(isTrip?'emptyTrip':'emptySaved'))}</h2>
        <button data-action="navigate" data-page="discover" class="action-lime">${html(t('homeExplore'))} ${ico('arrow',18)}</button>
      </div>
    `}
  </main>
  </div></div>
  ${bottomNav()}
 </div>`;
}

function profile(){
 return `<div class="app-shell profile-page">
  ${header()}
  <div id="smooth-wrapper"><div id="smooth-content">
  <main class="profile-wrap">
    <div class="profile-header">
      <span class="mini-overline">GOAROUND / ACCOUNT</span>
      <h1>${html(t('profile'))}</h1>
      <p>${html(t('profileSub'))}</p>
    </div>
    <div class="profile-sections">
      <section class="profile-card account-card">
        <h2>${html(t('accountTitle'))}</h2>
        ${state.account?`
          <div class="account-ident">
            <span class="account-avatar">${html(state.account.name[0].toUpperCase())}</span>
            <div><strong>${html(state.account.name)}</strong><small>${html(state.account.email)}</small></div>
          </div>
          <div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--color-subtle-border);display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
            <a href="/profile.html" class="quiet-link" style="font-weight:700;color:var(--color-forest);font-size:12px;text-decoration:underline;text-underline-offset:3px;">
              ${state.lang==='th'?'เปิดหน้าโปรไฟล์เต็ม (Nine) ↗':'Full Profile Portal ↗'}
            </a>
            <button class="account-signout" type="button" data-action="auth-logout">${html(t('signOut'))} ${ico('arrow',17)}</button>
            <button class="account-signout" type="button" data-action="auth-logout-all" class="btn-sign-out-danger" title="${state.lang==='th'?'ออกจากระบบจากทุกอุปกรณ์ที่เคยล็อกอินไว้':'Sign out from all logged in devices'}">${state.lang==='th'?'ออกจากระบบทุกเครื่อง':'Sign out all devices'} ${ico('arrow',17)}</button>
          </div>
        `:`
          <p class="profile-micro">${html(t('guestIntro'))}</p>
          <div class="auth-tabs">
            <button data-action="auth-mode" data-mode="login" class="${state.authMode==='login'?'active':''}">${html(t('signIn'))}</button>
            <button data-action="auth-mode" data-mode="register" class="${state.authMode==='register'?'active':''}">${html(t('signUp'))}</button>
          </div>
          <form class="member-auth-form" id="member-auth-form">
            ${state.authMode==='register'?`<label>${html(t('displayName'))}<input name="name" type="text" required/></label>`:''}
            <label>${html(t('email'))}<input name="email" type="email" required/></label>
            <label>${html(t('password'))} ${state.authMode==='register'?`<span class="input-hint">(${state.lang==='th'?'ขั้นต่ำ 8 ตัวอักษร':'min 8 chars'})</span>`:''}<input name="password" type="password" minlength="${state.authMode==='register'?'8':''}" required/></label>
            <button class="action-lime" type="submit">${html(t(state.authMode==='register'?'createAccount':'signIn'))}</button>
          </form>
          <div style="margin-top:14px;padding-top:10px;border-top:1px dashed var(--color-subtle-border);text-align:center;">
            <a href="/login.html" style="font-size:12px;font-weight:700;color:var(--color-forest);text-decoration:underline;text-underline-offset:3px;">
              ${state.lang==='th'?'ไปที่หน้าเข้าสู่ระบบ / สมัครสมาชิกเต็มรูปแบบ (Nine) ↗':'Go to Full Auth Portal (Nine) ↗'}
            </a>
          </div>
        `}
      </section>
      <section class="profile-card">
        <h2>${html(t('language'))}</h2>
        <div class="language-switch">
          <button class="${state.lang==='en'?'active':''}" data-action="set-language" data-lang="en">English</button>
          <button class="${state.lang==='th'?'active':''}" data-action="set-language" data-lang="th">ไทย</button>
        </div>
      </section>
      <section class="profile-card app-hub-section">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <h2 style="margin:0;">📲 ${state.lang==='th'?'แอป GoAround & ศูนย์บริการครบวงจร':'GoAround App & Ecosystem Hub'}</h2>
          <span class="app-ready-badge">PWA App Ready</span>
        </div>
        <p class="profile-micro" style="margin-bottom:14px;">
          ${state.lang==='th'
            ?'รองรับการติดตั้งเป็นแอปบนมือถือ (PWA Standalone) พร้อมเชื่อมต่อไปยัง AI Travel Advisor, ระบบจัดทริปอัจฉริยะ และระบบลงทะเบียนร้านค้า SME'
            :'Install GoAround as a standalone mobile app, chat with AI Travel Advisor, plan multi-day routes, or register your Local SME business.'}
        </p>
        <div class="app-hub-grid">
          <button type="button" class="app-hub-card highlight" data-action="install-pwa">
            <span class="app-hub-icon">📲</span>
            <div>
              <strong>${state.lang==='th'?'ติดตั้งแอป GoAround':'Install GoAround App'}</strong>
              <small>${state.lang==='th'?'เพิ่มลงหน้าจอมือถือ ใช้งานแบบเต็มจอ (App Mode)':'Add to Home Screen for full-screen App experience'}</small>
            </div>
          </button>
          <button type="button" class="app-hub-card" data-action="open-ai">
            <span class="app-hub-icon">🤖</span>
            <div>
              <strong>${state.lang==='th'?'AI Travel Advisor':'AI Travel Advisor'}</strong>
              <small>${state.lang==='th'?'แชทถามที่เที่ยวและร้าน Local SME ตามงบและสไตล์':'Personalized local & SME recommendations by budget'}</small>
            </div>
          </button>
          <a href="/planner.html" class="app-hub-card" style="text-decoration:none;color:inherit;">
            <span class="app-hub-icon">🗺️</span>
            <div>
              <strong>${state.lang==='th'?'Smart Trip Planner ↗':'Smart Trip Planner ↗'}</strong>
              <small>${state.lang==='th'?'จัดตารางทริปรายวัน คำนวณงบและเรียงลำดับเส้นทางอัตโนมัติ':'Auto route optimization & multi-day budget planner'}</small>
            </div>
          </a>
          <a href="/business.html" class="app-hub-card sme-business-card" style="text-decoration:none;color:inherit;">
            <span class="app-hub-icon">🏪</span>
            <div>
              <strong>${state.lang==='th'?'ลงทะเบียนร้านค้า / SME Portal ↗':'Register as a Business / SME ↗'}</strong>
              <small>${state.lang==='th'?'สำหรับเจ้าของร้านปักหมุดร้านค้า เชื่อม Google Maps และโปรโมต':'Self-service shop onboarding, pin location & promotions'}</small>
            </div>
          </a>
        </div>
      </section>
    </div>
  </main>
  </div></div>
  ${bottomNav()}
 </div>`;
}


function safetyModal(){
  return `
  <div class="safety-modal-overlay" role="dialog" aria-modal="true" aria-label="${html(t('safetyTitle'))}">
    <div class="safety-modal-card">
      <div class="safety-modal-header">
        <h2>🛡️ ${html(t('safetyTitle'))}</h2>
        <button class="overlay-close" data-action="close-safety" aria-label="Close">${ico('x',24)}</button>
      </div>
      <div class="safety-modal-body">
        <p style="margin:0;font-size:13px;color:var(--color-ink-secondary,#57685D);line-height:1.5;">${html(t('safetySub'))}</p>
        <div class="safety-tabs-row">
          <button type="button" class="safety-tab-pill ${state.safetyTab==='alerts'?'active':''}" data-action="set-safety-tab" data-tab="alerts">⚠️ ${html(t('activeAlerts'))} (${state.safetyReports.length})</button>
          <button type="button" class="safety-tab-pill ${state.safetyTab==='report'?'active':''}" data-action="set-safety-tab" data-tab="report">✍️ ${html(t('reportRisk'))}</button>
        </div>

        ${state.safetyTab==='alerts' ? `
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${state.safetyReports.map(item => `
              <div class="safety-alert-item">
                <div class="safety-alert-title-row">
                  <strong style="font-size:14px;color:var(--color-ink,#111D15);">${html(item.title)}</strong>
                  <span class="${item.status==='verified'?'safety-badge-verified':'safety-badge-pending'}">
                    ${html(t(item.status==='verified'?'verifiedStatus':'pendingStatus'))}
                  </span>
                </div>
                <p style="margin:0;font-size:13px;color:var(--color-ink-secondary,#57685D);line-height:1.5;">${html(item.description)}</p>
                <div class="safety-tip-box">
                  💡 <b>${html(t('avoidanceTip'))}:</b> ${html(item.tip || item.description)}
                </div>
                <small style="color:var(--color-ink-muted,#88998E);">📍 ${html(item.locationName || 'Thailand')}</small>
              </div>
            `).join('')}
          </div>
        ` : `
          <form class="safety-report-form" id="safety-report-form" style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label style="font-size:13px;font-weight:700;display:block;margin-bottom:4px;">${state.lang==='th'?'ประเภทความเสี่ยง':'Risk Category'}</label>
              <select id="safety-cat-input" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--color-subtle-border,#E8ECE6);background:var(--color-surface,#FFF);color:inherit;font-family:inherit;">
                <option value="overcharging">${state.lang==='th'?'ค่าโดยสาร / สินค้าเกินราคา (Overcharging)':'Overcharging Taxi / Price'}</option>
                <option value="transport">${state.lang==='th'?'ปัญหาขนส่ง / แท็กซี่ / ตุ๊กตุ๊ก (Transport)':'Transport / Taxi Issue'}</option>
                <option value="scam">${state.lang==='th'?'การหลอกลวง / พาไปซื้อของ (Scam)':'Scam / Tourist Trap'}</option>
                <option value="danger">${state.lang==='th'?'พื้นที่อันตราย / มิจฉาชีพ (Danger)':'Danger / Pickpocket'}</option>
                <option value="other">${state.lang==='th'?'อื่น ๆ (Other)':'Other Safety Issue'}</option>
              </select>
            </div>
            <div>
              <label style="font-size:13px;font-weight:700;display:block;margin-bottom:4px;">${state.lang==='th'?'หัวข้อเรื่อง':'Title'}</label>
              <input id="safety-title-input" type="text" required placeholder="${state.lang==='th'?'เช่น แท็กซี่ไม่กดมิเตอร์หน้าสถานี...':'e.g. Taxi refused meter near station...'}" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--color-subtle-border,#E8ECE6);background:var(--color-surface,#FFF);color:inherit;font-family:inherit;box-sizing:border-box;"/>
            </div>
            <div>
              <label style="font-size:13px;font-weight:700;display:block;margin-bottom:4px;">${state.lang==='th'?'รายละเอียด':'Description'}</label>
              <textarea id="safety-desc-input" required rows="3" placeholder="${state.lang==='th'?'อธิบายเหตุการณ์และคำแนะนำสำหรับผู้เดินทาง...':'Describe the incident and prevention tips...'}" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--color-subtle-border,#E8ECE6);background:var(--color-surface,#FFF);color:inherit;font-family:inherit;box-sizing:border-box;"></textarea>
            </div>
            <div>
              <label style="font-size:13px;font-weight:700;display:block;margin-bottom:4px;">${state.lang==='th'?'สถานที่ / จุดเกิดเหตุ':'Location Name'}</label>
              <input id="safety-loc-input" type="text" required placeholder="${state.lang==='th'?'เช่น หน้าทางออก BTS อโศก':'e.g. Near BTS Asok exit'}" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--color-subtle-border,#E8ECE6);background:var(--color-surface,#FFF);color:inherit;font-family:inherit;box-sizing:border-box;"/>
            </div>
            <button type="submit" class="action-lime" style="margin-top:6px;width:100%;justify-content:center;">
              ${state.lang==='th'?'ส่งข้อมูลแจ้งเตือน':'Submit Safety Report'}
            </button>
          </form>
        `}
      </div>
    </div>
  </div>`;
}

function onboardingModal(){
  return `
  <div class="onboard-modal-overlay" role="dialog" aria-modal="true" aria-label="${html(t('onboardModalTitle'))}">
    <div class="onboard-modal-card">
      <div class="safety-modal-header">
        <h2>🧭 ${html(t('onboardModalTitle'))}</h2>
        <button class="overlay-close" data-action="close-onboarding" aria-label="Close">${ico('x',24)}</button>
      </div>
      <div class="safety-modal-body">
        <p style="margin:0;font-size:14px;color:var(--color-ink-secondary,#57685D);line-height:1.6;">${html(t('onboardModalSub'))}</p>
        <div class="onboard-steps-grid">
          <div class="onboard-step-item">
            <div class="onboard-step-num">1</div>
            <div class="onboard-step-text">
              <h4>${html(t('onboardStep1Title'))}</h4>
              <p>${html(t('onboardStep1Desc'))}</p>
            </div>
          </div>
          <div class="onboard-step-item">
            <div class="onboard-step-num">2</div>
            <div class="onboard-step-text">
              <h4>${html(t('onboardStep2Title'))}</h4>
              <p>${html(t('onboardStep2Desc'))}</p>
            </div>
          </div>
          <div class="onboard-step-item">
            <div class="onboard-step-num">3</div>
            <div class="onboard-step-text">
              <h4>${html(t('onboardStep3Title'))}</h4>
              <p>${html(t('onboardStep3Desc'))}</p>
            </div>
          </div>
        </div>
        <button type="button" class="action-lime" data-action="close-onboarding" style="width:100%;justify-content:center;font-size:15px;padding:12px;">
          ${html(t('startExploring'))} ↗
        </button>
      </div>
    </div>
  </div>`;
}

function overlayMenu(){
 return `<div class="mega-overlay" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="overlay-top">${brand()}<button class="overlay-close" data-action="menu-close" aria-label="Close">${ico('x',26)}</button></div>
  <div class="overlay-body">
    <div class="overlay-words">
      ${[['discover','discover'],['map','map'],['saved','saved'],['trip','trip'],['profile','profile']].map(([page,label])=>`
        <button data-action="navigate" data-page="${page}" class="${state.page===page?'active':''}">
          ${html(t(label))}
          ${page==='saved'?`<sup>${state.saved.length}</sup>`:''}
        </button>
      `).join('')}
    </div>
    <div class="overlay-app-shortcuts">
      <button type="button" class="explore-pill-btn explore-pill-highlight" data-action="open-ai">🤖 ${state.lang==='th'?'ผู้ช่วยจัดทริป AI (AI Advisor)':'AI Travel Advisor'}</button>
      <button type="button" class="explore-pill-btn" data-action="install-pwa">📲 ${state.lang==='th'?'ติดตั้งแอป GoAround':'Install GoAround App'}</button>
      <a href="/planner.html" class="explore-pill-btn" style="text-decoration:none;">🗺️ ${state.lang==='th'?'ระบบจัดทริปอัตโนมัติ':'Smart Trip Planner'} ↗</a>
      <a href="/business.html" class="explore-pill-btn" style="text-decoration:none;">🏪 ${state.lang==='th'?'ลงทะเบียนร้านค้า SME':'Register Business'} ↗</a>
    </div>
  </div>
 </div>`;
}

function searchOverlay(){
 return `<div class="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
  <button class="search-backdrop" data-action="search-close" aria-label="Close search"></button>
  <div class="search-panel">
    <div class="search-top">
      ${ico('search',24)}
      <input id="overlay-search" type="search" autocomplete="off" aria-label="${html(t('search'))}" placeholder="${html(t('search'))}" value="${html(state.query)}"/>
      <button data-action="search-close" aria-label="Close">${ico('x',20)}</button>
    </div>
    <div class="search-results">
      ${filteredPlaces().slice(0,6).map(p=>`
        <button data-action="search-place" data-id="${p.id}">
          <img src="${photo(p.photo)}" alt=""/>
          <span><strong>${html(name(p))} ${p.isSme?'★':''}</strong><small>${html(loc(p))}</small></span>
          ${ico('arrow',18)}
        </button>
      `).join('')||`<div class="search-empty">${html(t('nothing'))}</div>`}
    </div>
  </div>
 </div>`;
}

function flipDetailModal(){
  const isThai = state.lang==='th';
  return `
  <div class="flip-detail-backdrop" id="gsap-flip-backdrop" data-action="flip-close-detail" style="display:none;"></div>
  <div class="detail" id="gsap-flip-detail" role="dialog" aria-modal="true" aria-label="Quick Place Preview">
    <img src="assets/hero-forest.webp" alt="" />
    <div class="content">
      <div class="title"></div>
      <div class="secondary"></div>
      <div class="description"></div>
      <div class="detail-flip-actions">
        <button type="button" class="action-lime" data-action="flip-open-full" id="gsap-flip-open-btn">
          ${isThai?'ดูรายละเอียดเต็ม & รีวิว ↗':'Full Page & Reviews ↗'}
        </button>
        <button type="button" class="action-outline" data-action="flip-close-detail">
          ${isThai?'ย่อเก็บเข้าตาราง ✕':'Close Preview ✕'}
        </button>
      </div>
    </div>
  </div>`;
}

function getAiRecommendations(){
  const q = (state.aiQuery || '').trim().toLowerCase();
  const preset = state.aiPreset || 'sme';
  let list = PLACES.filter(p => !sponsored(p));
  if(q){
    list = list.filter(p => [p.en,p.th,p.locEn,p.locTh,p.province,p.district,p.category,p.region,p.storyEn,p.storyTh,p.smeType].filter(Boolean).join(' ').toLowerCase().includes(q));
  } else if(preset === 'sme'){
    list = list.filter(p => p.isSme && (p.priceFrom || 0) <= 300);
  } else if(preset === 'nature'){
    list = list.filter(p => p.category === 'nature');
  } else if(preset === 'food'){
    list = list.filter(p => p.category === 'food');
  } else if(preset === 'hidden'){
    list = list.filter(p => /hidden|pick|artisan|heritage/i.test(p.smeBadge || '') || p.rating >= 4.8);
  }
  if(!list.length) list = PLACES.filter(p => !sponsored(p)).slice(0, 6);
  return list.slice(0, 6);
}

function aiModal(){
  const th = state.lang === 'th';
  const recs = getAiRecommendations();
  const sponsoredRecs = PLACES.filter(sponsored).slice(0, 2);
  const presets = [
    ['sme', th ? '★ ร้านชุมชน SME งบประหยัด (≤300฿)' : '★ Local SME Budget (≤300฿)'],
    ['food', th ? '🍜 ของกินท้องถิ่น & คาเฟ่เด็ด' : '🍜 Local Food & Artisanal Cafes'],
    ['nature', th ? '⛰️ ธรรมชาติ & จุดชมวิว 6 ภาค' : '⛰️ Nature & Scenic Views'],
    ['hidden', th ? '💎 Hidden Gems คะแนนรีวิว 4.8+' : '💎 Hidden Gems (Rating 4.8+)']
  ];
  return `
  <div class="safety-modal-overlay ai-modal-overlay" role="dialog" aria-modal="true" aria-label="GoAround AI Travel Advisor">
    <div class="safety-modal-card ai-modal-card">
      <div class="safety-modal-header">
        <div>
          <span class="mini-overline" style="display:block;font-size:10px;margin-bottom:2px;">GOAROUND SMART ASSISTANT</span>
          <h2 style="margin:0;">🤖 ${th ? 'GoAround AI ที่ปรึกษาจัดทริป & ค้นหาร้านชุมชน' : 'GoAround AI Travel Advisor'}</h2>
        </div>
        <button class="overlay-close" data-action="close-ai" aria-label="Close">${ico('x',24)}</button>
      </div>
      <div class="safety-modal-body">
        <p style="margin:0;font-size:13px;color:var(--color-ink-secondary,#57685D);line-height:1.5;">
          ${th
            ? 'เลือกสไตล์การเดินทางหรือพิมพ์จังหวัด/งบประมาณ ระบบจะคัดสรรสถานที่ที่ตรงกับความต้องการจริง (แยกออกจากรายการ Sponsored อย่างชัดเจน)'
            : 'Choose a travel style or type a province/keyword. Organic matches are clearly separated from Sponsored listings.'}
        </p>
        <div class="ai-preset-row">
          ${presets.map(([key, label]) => `
            <button type="button" class="safety-tab-pill ${state.aiPreset===key && !state.aiQuery ? 'active' : ''}" data-action="set-ai-preset" data-preset="${key}">
              ${html(label)}
            </button>
          `).join('')}
        </div>
        <div class="ai-search-box">
          <input id="ai-query-input" type="search" value="${html(state.aiQuery)}" placeholder="${th ? 'พิมพ์จังหวัด ภาค หรือสิ่งที่อยากไป เช่น เชียงใหม่, ภูเก็ต, กาแฟ, อีสาน...' : 'Type province, region, or vibe (e.g., Chiang Mai, Phuket, coffee, north)...'}" />
          ${state.aiQuery ? `<button type="button" class="action-outline" data-action="clear-ai-query" style="padding:6px 12px;font-size:12px;">${th ? 'ล้าง' : 'Clear'}</button>` : ''}
        </div>
        <div class="ai-results-header">
          <strong>✨ ${th ? `สถานที่ที่ตรงกับความต้องการของคุณ (${recs.length} แห่ง)` : `Organic Matches for You (${recs.length})`}</strong>
          <button type="button" class="action-lime" data-action="ai-apply-trip" style="padding:6px 12px;font-size:12px;">
            ⚡ ${th ? 'เพิ่มทั้งหมดเข้าทริปของฉัน' : 'Add All to My Trip'}
          </button>
        </div>
        <div class="ai-recs-list">
          ${recs.map(p => `
            <div class="ai-rec-item">
              <img src="${photo(p.photo)}" alt="${html(name(p))}" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>
              <div class="ai-rec-info">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <strong>${html(name(p))}</strong>
                  ${p.isSme ? `<span class="sme-tag-pill">★ Local SME</span>` : ''}
                </div>
                <small>📍 ${html(loc(p))} · ★ ${p.rating || '4.8'} · ฿${(p.priceFrom || 0).toLocaleString()}</small>
                <p>${html((story(p) || '').slice(0, 88))}…</p>
              </div>
              <div class="ai-rec-actions">
                <button type="button" class="action-outline" data-action="ai-view-place" data-id="${p.id}" style="padding:6px 10px;font-size:12px;">${th ? 'ดู' : 'View'}</button>
                <button type="button" class="action-lime" data-action="trip-toggle" data-id="${p.id}" style="padding:6px 10px;font-size:12px;">
                  ${state.trip.includes(p.id) ? (th ? '✓ ในทริป' : '✓ In Trip') : (th ? '+ ทริป' : '+ Trip')}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        ${sponsoredRecs.length ? `
          <div class="ai-sponsored-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <small style="font-weight:700;color:#92400E;">📢 ${th ? 'พื้นที่ประชาสัมพันธ์ร้านค้า (Sponsored — แยกจากการแนะนำปกติ)' : 'Sponsored Placements (Separated from organic AI advice)'}</small>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${sponsoredRecs.map(p => `
                <button type="button" class="ai-sponsored-chip" data-action="ai-view-place" data-id="${p.id}">
                  <span>Sponsored</span> · <strong>${html(name(p))}</strong> (${html(loc(p))}) ↗
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  </div>`;
}
function appHtml(){
 let body=state.page==='welcome'?landing():
          state.page==='discover'?discover():
          state.page==='detail'?detail(getPlace(state.detail)||PLACES[0]):
          state.page==='map'?mapPage():
          state.page==='saved'||state.page==='trip'?collection():
          profile();
 return body+flipDetailModal()+(state.menuOpen?overlayMenu():'')+(state.searchOpen?searchOverlay():'')+(state.showSafetyModal?safetyModal():'')+(state.showOnboardingModal?onboardingModal():'')+(state.showAiModal?aiModal():'');
}

/* ---- Moo: GSAP 3.15.0 Suite (ScrollSmoother + ScrollTrigger + ScrollToPlugin + SplitText + Flip) ---- */
let gsapPluginsRegistered = false;
let gsapSmoother = null;
let gsapSplitInstance = null;
let gsapSplitAnim = null;
let activeFlipItem = null;
let lastAnimatedPageKey = '';
let gsapResizeTimer = null;

function isReducedMotion(){
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function hasGsapSuite(){
  return typeof window !== 'undefined' && typeof window.gsap !== 'undefined';
}

function registerGsapSuite(){
  if(gsapPluginsRegistered || !hasGsapSuite()) return false;
  try {
    const plugins = [window.ScrollTrigger, window.ScrollSmoother, window.ScrollToPlugin, window.SplitText, window.Flip].filter(Boolean);
    if(plugins.length) window.gsap.registerPlugin(...plugins);
    gsapPluginsRegistered = true;
    return true;
  } catch(e) {
    console.info('GSAP register fallback:', e.message);
    return false;
  }
}

function cleanupGsapBeforeRender(){
  try {
    activeFlipItem = null;
    if(gsapSplitAnim){ gsapSplitAnim.revert(); gsapSplitAnim = null; }
    if(gsapSplitInstance){ gsapSplitInstance.revert(); gsapSplitInstance = null; }
    if(gsapSmoother){ gsapSmoother.kill(); gsapSmoother = null; }
    document.body.classList.remove('gsap-smoother-on');
    if(window.ScrollTrigger){
      window.ScrollTrigger.getAll().forEach(st => st.kill());
    }
  } catch {}
}

function setupSplitText(playMode = null){
  if(!hasGsapSuite() || !window.SplitText || isReducedMotion()) return;
  const target = document.querySelector('.split-text-target');
  if(!target) return;
  try {
    if(gsapSplitAnim){ gsapSplitAnim.revert(); gsapSplitAnim = null; }
    if(gsapSplitInstance){ gsapSplitInstance.revert(); gsapSplitInstance = null; }
    // Protect Thai floating vowels & tone marks by using words,lines when Thai characters are present
    gsapSplitInstance = window.SplitText.create(target, { type: 'chars,words,lines' });
    if(playMode) playSplitTextMode(playMode);
  } catch(e) {
    console.info('SplitText fallback:', e.message);
  }
}

function playSplitTextMode(mode){
  if(!hasGsapSuite() || isReducedMotion()) return;
  if(!gsapSplitInstance) setupSplitText();
  if(!gsapSplitInstance) return;
  try {
    if(gsapSplitAnim){ gsapSplitAnim.revert(); gsapSplitAnim = null; }
    if(mode === 'chars'){
      const targets = (gsapSplitInstance.chars && gsapSplitInstance.chars.length) ? gsapSplitInstance.chars : [target];
      gsapSplitAnim = window.gsap.from(targets, {
        y: 20,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.03
      });
    } else if(mode === 'words'){
      gsapSplitAnim = window.gsap.from(gsapSplitInstance.words, {
        y: -100,
        opacity: 0,
        rotation: 'random(-80, 80)',
        duration: 0.7,
        ease: 'back',
        stagger: 0.15
      });
    } else if(mode === 'lines'){
      gsapSplitAnim = window.gsap.from(gsapSplitInstance.lines, {
        rotationX: -100,
        transformOrigin: '50% 50% -160px',
        opacity: 0,
        duration: 0.8,
        ease: 'power3',
        stagger: 0.25
      });
    }
  } catch(e) {
    console.info('SplitText animation fallback:', e.message);
  }
}

function showFlipDetails(item){
  if(!item) return;
  const pid = item.dataset.place;
  if(!hasGsapSuite() || !window.Flip || isReducedMotion()){
    if(pid) place(pid);
    return;
  }
  const details = document.querySelector('#gsap-flip-detail');
  const backdrop = document.querySelector('#gsap-flip-backdrop');
  const detailContent = details?.querySelector('.content');
  const detailImage = details?.querySelector('img');
  const detailTitle = details?.querySelector('.title');
  const detailSecondary = details?.querySelector('.secondary');
  const detailDescription = details?.querySelector('.description');
  const openFullBtn = details?.querySelector('#gsap-flip-open-btn');
  if(!details || !detailContent || !detailImage) {
    if(pid) place(pid);
    return;
  }
  if(activeFlipItem){
    return hideFlipDetails();
  }

  const items = window.gsap.utils.toArray('.gallery .item');
  window.gsap.set(detailContent, { yPercent: -100 });

  let handled = false;
  const onLoad = () => {
    if(handled) return;
    handled = true;
    detailImage.removeEventListener('load', onLoad);

    if(backdrop) backdrop.style.display = 'block';

    // 1) Fit .detail directly over the clicked grid item
    window.Flip.fit(details, item, { scale: true, fitChild: detailImage });

    // 2) Record initial Flip state
    const flipState = window.Flip.getState(details);

    // 3) Clear props and position .detail centered in viewport
    window.gsap.set(details, { clearProps: true });
    window.gsap.set(details, {
      xPercent: -50,
      top: '50%',
      yPercent: -50,
      visibility: 'visible',
      overflow: 'hidden'
    });

    if(gsapSmoother) gsapSmoother.paused(true);

    // 4) Animate expansion from grid item to center screen + slide down content drawer
    window.Flip.from(flipState, {
      duration: 0.5,
      ease: 'power2.inOut',
      scale: true,
      onComplete: () => window.gsap.set(details, { overflow: 'auto' })
    }).to(detailContent, { yPercent: 0 }, 0.2);
  };

  const data = item.dataset;
  const cardImg = item.querySelector('img');
  detailTitle.innerText = data.title || '';
  detailSecondary.innerText = data.secondary || '';
  detailDescription.innerText = data.text || '';
  details.dataset.placeId = pid || '';
  if(openFullBtn) openFullBtn.dataset.id = pid || '';

  detailImage.addEventListener('load', onLoad);
  detailImage.src = cardImg ? cardImg.src : 'assets/hero-forest.webp';
  if(detailImage.complete && detailImage.naturalWidth > 0){
    requestAnimationFrame(onLoad);
  }

  // Radial Grid Stagger dimming all other items around the clicked card
  if(items.length){
    window.gsap.to(items, {
      opacity: 0.3,
      stagger: { amount: 0.6, from: Math.max(0, items.indexOf(item)), grid: 'auto' }
    }).kill(item);
  }

  activeFlipItem = item;
}

function hideFlipDetails(){
  const details = document.querySelector('#gsap-flip-detail');
  const backdrop = document.querySelector('#gsap-flip-backdrop');
  const detailContent = details?.querySelector('.content');
  const detailImage = details?.querySelector('img');
  const items = hasGsapSuite() ? window.gsap.utils.toArray('.gallery .item') : [];

  if(backdrop) backdrop.style.display = 'none';

  if(!details || !activeFlipItem || !hasGsapSuite() || !window.Flip){
    if(details) {
      details.style.visibility = 'hidden';
      window.gsap?.set(details, { clearProps: 'transform,width,height,left,top' });
    }
    if(items.length) window.gsap.set(items, { clearProps: 'opacity' });
    activeFlipItem = null;
    if(gsapSmoother) gsapSmoother.paused(false);
    return;
  }

  const targetItem = activeFlipItem;
  activeFlipItem = null;

  window.gsap.set(details, { overflow: 'hidden' });
  const flipState = window.Flip.getState(details);

  // Fit .detail back onto the original grid card
  window.Flip.fit(details, targetItem, { scale: true, fitChild: detailImage });

  const tl = window.gsap.timeline();
  tl.set(details, { overflow: 'hidden' })
    .to(detailContent, { yPercent: -100, duration: 0.25 });

  if(items.length){
    tl.to(items, {
      opacity: 1,
      stagger: { amount: 0.5, from: Math.max(0, items.indexOf(targetItem)), grid: 'auto' },
      onComplete: () => window.gsap.set(items, { clearProps: 'opacity' })
    }, 0);
  }

  window.Flip.from(flipState, {
    scale: true,
    duration: 0.45,
    delay: 0.15,
    onInterrupt: () => {
      tl.kill();
      if(items.length) window.gsap.set(items, { clearProps: 'opacity' });
    },
    onComplete: () => {
      window.gsap.set(details, { visibility: 'hidden', clearProps: 'transform,width,height,left,top' });
    }
  });

  if(gsapSmoother) gsapSmoother.paused(false);
}

function initGsapSuite({ keepScroll = false, sy = 0 } = {}){
  if(!hasGsapSuite() || isReducedMotion()){
    if(keepScroll) requestAnimationFrame(()=>window.scrollTo({top:sy,behavior:'instant'}));
    else window.scrollTo({top:0,behavior:'instant'});
    return;
  }
  registerGsapSuite();

  // Prepare Flip detail drawer initial position
  const detailContent = document.querySelector('#gsap-flip-detail .content');
  if(detailContent){
    window.gsap.set(detailContent, { yPercent: -100 });
  }

  // Highlight animation on #pinned-shape when scrolled into view (without blocking page bottom)
  const pinnedShape = document.querySelector('#pinned-shape');
  if(state.page === 'discover' && pinnedShape && window.ScrollTrigger){
    try {
      window.gsap.fromTo(pinnedShape,
        { y: 24, opacity: 0.92 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#pinned-shape',
            start: 'top 88%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    } catch {}
  }

  // Entrance animations for SplitText & Gallery items only when entering page / switching language or category
  const pageKey = `${state.page}|${state.lang}|${state.category}`;
  const shouldAnimateEntrance = !keepScroll || pageKey !== lastAnimatedPageKey;
  lastAnimatedPageKey = pageKey;

  if(state.page === 'discover'){
    const readyPromise = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    readyPromise.then(() => {
      setupSplitText(shouldAnimateEntrance ? 'chars' : null);
    });
    if(shouldAnimateEntrance){
      const galleryItems = window.gsap.utils.toArray('.gallery .item');
      if(galleryItems.length){
        window.gsap.from(galleryItems, {
          autoAlpha: 0,
          yPercent: 20,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.035,
          clearProps: 'opacity,visibility,transform'
        });
      }
    }
  }

  if(keepScroll){
    requestAnimationFrame(() => window.scrollTo({top:sy,behavior:'instant'}));
  } else {
    window.scrollTo({top:0,behavior:'instant'});
  }
}

window.addEventListener('resize', () => {
  clearTimeout(gsapResizeTimer);
  gsapResizeTimer = setTimeout(() => {
    if(state.page === 'discover') setupSplitText(null);
    if(window.ScrollTrigger) { try { window.ScrollTrigger.refresh(); } catch {} }
  }, 180);
});
/* ---- end Moo: GSAP 3.15.0 Suite ---- */

function render({keepScroll=false}={}){
 const sy=keepScroll?(gsapSmoother?gsapSmoother.scrollTop():window.scrollY):0;
 const activeEl=document.activeElement;
 const activeId=activeEl&&activeEl.id?activeEl.id:null;
 const selStart=activeEl&&typeof activeEl.selectionStart==='number'?activeEl.selectionStart:null;
 const selEnd=activeEl&&typeof activeEl.selectionEnd==='number'?activeEl.selectionEnd:null;
 const draftReview=$('#place-review-textarea')?.value;
 cleanupGsapBeforeRender();
 document.documentElement.lang=state.lang;
 document.title=`GoAround — ${state.page==='welcome'?'Travel & Local Discovery':t(state.page==='detail'?'titlePlace':state.page)}`;
 if(state.page==='trip'||state.page==='map')ensureTripRoute(); // Tommy: fetch the trip route when needed
 $('#app').innerHTML=appHtml();
 if(draftReview&&$('#place-review-textarea')&&!$('#place-review-textarea').value){
   $('#place-review-textarea').value=draftReview;
 }
 document.body.classList.toggle('has-modal',Boolean(state.menuOpen||state.searchOpen||state.showSafetyModal||state.showOnboardingModal));
 if(state.page==='map') requestAnimationFrame(drawMap);
 initGsapSuite({ keepScroll, sy });
 if(activeId){
   const nextEl=document.getElementById(activeId);
   if(nextEl){
     nextEl.focus({preventScroll:true});
     try{if(selStart!==null&&typeof nextEl.setSelectionRange==='function')nextEl.setSelectionRange(selStart,selEnd);}catch{}
   }
 }
}

function navigate(page,updateHash=true){
 if(page==='profile'){
   window.location.href=state.account?'/profile.html':'/login.html';
   return;
 }
 state.page=page;state.menuOpen=false;state.searchOpen=false;state.showAll=false;state.query='';
 if(page!=='detail')state.detail=null;
 if(page==='map'){
   if(state.nearbyActive && state.nearbyPoint) {
     state.mapCenter = {...state.nearbyPoint, z: state.nearbyRadius<=1?14:state.nearbyRadius<=5?12:10};
   }
 }
 if(updateHash) history.replaceState(null,'',page==='welcome'?location.pathname:('#'+page));
 render();
}

function place(id){
 if(!getPlace(id))return;
 state.previous=state.page==='detail'?state.previous:state.page;
 state.detail=id;
 state.page='detail';
 state.menuOpen=false;state.searchOpen=false;
 history.replaceState(null,'','#place='+id);
 render();
 loadReviewPage(id);
 userApi('/api/analytics/event','POST',{eventType:'view',placeId:id}).catch(()=>{});
}

function savePlace(id){
 const added = !state.saved.includes(id);
 state.saved = added ? [...state.saved, id] : state.saved.filter(x=>x!==id);
 persistCollections();
 render({keepScroll:true});
 toast(t(added?'done':'removed'));
 if(added) userApi('/api/analytics/event','POST',{eventType:'save',placeId:id}).catch(()=>{});
}

function toggleTrip(id){
 const added = !state.trip.includes(id);
 state.trip = added ? [...state.trip, id] : state.trip.filter(x=>x!==id);
 persistCollections();
 render({keepScroll:true});
 toast(t(added?'done':'removedTrip'));
 if(added) userApi('/api/analytics/event','POST',{eventType:'trip_add',placeId:id}).catch(()=>{});
}

function externalDirections(id){
 const p=getPlace(id);if(!p)return;
 // Tommy: one link builder for the whole app (Place ID first, our lat/lon as backup).
 const url=window.TravalLinks?TravalLinks.directionsUrl([p],state.travelMode):'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.lat+','+p.lon);
 if(url) window.open(url,'_blank','noopener,noreferrer');
 userApi('/api/analytics/event','POST',{eventType:'direction',placeSlug:id}).catch(()=>{});
}

/* ---- Tommy: trip route (road distance, time, cost) shared by the Trip page and the Map ---- */
state.tripRoute=null; // {key, busy, result} — result comes from TravalRoute.route()
function tripPlaces(){return state.trip.map(getPlace).filter(p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon));}
function tripRouteKey(){return state.travelMode+'|'+tripPlaces().map(p=>p.id).join(',');}
function ensureTripRoute(){
 const places=tripPlaces();
 if(places.length<2||!window.TravalRoute){state.tripRoute=null;return;}
 const key=tripRouteKey();
 if(state.tripRoute&&state.tripRoute.key===key)return;
 state.tripRoute={key,busy:true,result:null};
 TravalRoute.route(places,state.travelMode).then(result=>{
   if(!state.tripRoute||state.tripRoute.key!==key)return; // trip changed meanwhile
   state.tripRoute={key,busy:false,result};
   if(state.page==='trip'||state.page==='map')render({keepScroll:true}); // map: also refreshes the trip chip
 });
}
function tripRouteCard(){
 const places=tripPlaces();
 if(places.length<2||!window.TravalCost||!window.TravalLinks)return '';
 const th=state.lang==='th',tr=state.tripRoute,r=tr&&tr.result;
 const walk=state.travelMode==='walking', transit=state.travelMode==='transit';
 const cost=r?TravalCost.tripCost(r.legs,state.travelMode):null;
 const km=n=>n<1?`${Math.round(n*1000)} ${th?'ม.':'m'}`:`${n.toFixed(1)} ${th?'กม.':'km'}`;
 const mins=n=>n<60?`${Math.round(n)} ${th?'นาที':'min'}`:`${Math.floor(n/60)} ${th?'ชม.':'h'} ${Math.round(n%60)} ${th?'นาที':'min'}`;
 const money=c=>walk?(th?'ฟรี':'Free'):transit?(th?'ตามผู้ให้บริการ (BTS/MRT/รถเมล์)':'Public fare'):!c||!c.taxi?'–':`${c.taxi.min.toLocaleString()}–${c.taxi.max.toLocaleString()} ฿`;
 return `<section class="trip-route-card">
   <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
     <b>${ico('route',17)} ${th?'เส้นทางทริป':'Trip route'}</b>
     <span role="group" aria-label="${th?'วิธีเดินทาง':'Travel mode'}" style="display:inline-flex;border:1px solid #E6E8E2;border-radius:99px;overflow:hidden;">
       ${[['driving',t('modeDrive')],['walking',t('modeWalk')],['transit',t('modeTransit')]].map(([m,lbl])=>`<button data-action="trip-mode" data-mode="${m}" aria-pressed="${state.travelMode===m}" style="border:0;padding:6px 14px;font-weight:700;font-size:12px;background:${state.travelMode===m?'#0D2C1C':'#FFF'};color:${state.travelMode===m?'#8DE026':'#0D2C1C'};">${html(lbl)}</button>`).join('')}
     </span>
   </div>
   ${!r?`<p style="margin:12px 0 0;color:#5F6B62;">${th?'กำลังคำนวณเส้นทาง…':'Calculating road route…'}</p>`:`
   <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px;">
     <div><small style="color:#5F6B62;">${th?'ระยะทาง':'Distance'}</small><div style="font-weight:700;font-size:18px;">${km(r.distanceKm)}</div></div>
     <div><small style="color:#5F6B62;">${th?'เวลาเดินทาง':'Travel time'}</small><div style="font-weight:700;font-size:18px;">${mins(r.travelMinutes)}</div></div>
     <div><small style="color:#5F6B62;">${walk?(th?'ค่าใช้จ่าย':'Cost'):(th?'แท็กซี่ (ต่อจุด)':'Taxi (per stop)')}</small><div style="font-weight:700;font-size:18px;">${money(cost)}</div></div>
   </div>
   <p style="margin:10px 0 0;font-size:12px;color:#5F6B62;">${r.source==='road'
     ?(th?'ระยะทางตามถนนจริงจาก OpenStreetMap · ราคาแท็กซี่เป็นค่าประมาณตามมิเตอร์ ไม่รวมทางด่วน':'Real road distance from OpenStreetMap · taxi price is a meter estimate, tolls not included')
     :(th?'ประมาณจากระยะเส้นตรง (ระบบเส้นทางไม่ตอบสนอง)':'Straight-line estimate (road routing unavailable right now)')}${!walk&&cost&&cost.fuel?` · ${th?'ค่าน้ำมันรถส่วนตัว':'own car fuel'} ≈ ${cost.fuel.toLocaleString()} ฿`:''}</p>`}
   <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
     <a class="action-lime" href="${html(TravalLinks.directionsUrl(places,state.travelMode))}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">${th?'นำทางด้วย Google Maps':'Navigate in Google Maps'} ↗</a>
     <button class="action-outline" data-action="trip-on-map">${ico('map',17)} ${th?'ดูบนแผนที่':'Show on map'}</button>
   </div>
 </section>`;
}
function tripRouteSvg(origin,w,h,z){
 const r=state.tripRoute&&state.tripRoute.result;
 if(!r||!Array.isArray(r.line)||r.line.length<2)return '';
 const pts=r.line.map(([la,lo])=>{const xy=merc(la,lo,z);return `${(xy.x-origin.x+w/2).toFixed(1)},${(xy.y-origin.y+h/2).toFixed(1)}`}).join(' ');
 const dash=r.source==='road'?'':'stroke-dasharray="8 7"';
 return `<svg class="trip-route-line" width="${w}" height="${h}" style="position:absolute;left:0;top:0;pointer-events:none;overflow:visible;" aria-hidden="true">
   <polyline points="${pts}" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
   <polyline points="${pts}" fill="none" stroke="#2563EB" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" ${dash}/>
 </svg>`;
}
function tripMapChip(){
 const r=state.tripRoute&&state.tripRoute.result;
 if(!r||tripPlaces().length<2)return '';
 const th=state.lang==='th';
 return `<button data-action="trip-on-map" class="trip-map-chip">
   <span>${ico('route',15)} <b>${th?'เส้นทางทริป':'Trip route'}</b> · ${r.distanceKm.toFixed(1)} ${th?'กม.':'km'} · ${Math.round(r.travelMinutes)} ${th?'นาที':'min'}${r.source==='road'?'':(th?' (ประมาณ)':' (estimate)')}</span>
   <span style="color:#2563EB;font-weight:700;">${th?'ดูทั้งทริป':'Fit trip'}</span>
 </button>`;
}
function fitMapToTrip(){
 const places=tripPlaces();if(!places.length)return;
 const lat=places.reduce((s,p)=>s+p.lat,0)/places.length,lon=places.reduce((s,p)=>s+p.lon,0)/places.length;
 const spanKm=Math.max(...places.map(p=>UnfoldTripEngine.km({lat,lon},p)));
 state.mapCenter={lat,lon,z:spanKm<1.5?15:spanKm<4?14:spanKm<10?13:spanKm<25?12:spanKm<60?10:8};
}
/* ---- end Tommy: trip route ---- */

/* ---- Tommy: OpenStreetMap places for the visible map area (backend/osm-places.js) ---- */
const OSM_MIN_ZOOM=10; // below this a view covers too much of the country to be useful
const OSM_COLORS={culture:'#B45309',nature:'#15803D',food:'#DB2777',stay:'#4F46E5'};
state.osm={key:'',places:[],total:0,truncated:false};
let osmTimer=null,osmSeq=0;
function unmerc(x,y,z){const scale=256*(2**z);return {lon:x/scale*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/scale)))*180/Math.PI};}
function mapViewBbox(){
 const box=$('.map-paper');if(!box||!box.offsetWidth||!box.offsetHeight)return null;
 const {lat,lon,z}=state.mapCenter,o=merc(lat,lon,z),w=box.offsetWidth,h=box.offsetHeight;
 const sw=unmerc(o.x-w/2,o.y+h/2,z),ne=unmerc(o.x+w/2,o.y-h/2,z);
 return [sw.lon,sw.lat,ne.lon,ne.lat];
}
const osmCategory=()=>['nature','food','stay','culture'].includes(state.category)?state.category:'all';
const osmHidden=()=>state.mapCenter.z<OSM_MIN_ZOOM||state.localOnly||state.category==='sme'||state.nearbyActive;
function scheduleOsmLoad(){clearTimeout(osmTimer);osmTimer=setTimeout(loadOsmArea,300);}
async function loadOsmArea(){
 if(state.page!=='map')return;
 if(osmHidden()){if(state.osm.places.length){state.osm={key:'',places:[],total:0,truncated:false};drawMap();}const c=$('#osm-counter');if(c)c.outerHTML=osmCounterHtml();return;}
 const bbox=mapViewBbox();if(!bbox)return;
 const key=bbox.map(n=>n.toFixed(3)).join(',')+'|'+osmCategory();
 if(key===state.osm.key)return;
 const seq=++osmSeq;
 try{
   // About one dot per 70×70 px of map: readable on a phone and on a big screen.
   const box=$('.map-paper'),limit=Math.max(30,Math.min(250,Math.round(box.offsetWidth*box.offsetHeight/5000)));
   const res=await userApi('/api/map/places?bbox='+bbox.map(n=>n.toFixed(5)).join(',')+'&category='+osmCategory()+'&limit='+limit);
   if(seq!==osmSeq||state.page!=='map')return;
   state.osm={key,places:res.places||[],total:res.total||0,truncated:!!res.truncated};
   drawMap();
   const counter=$('#osm-counter');if(counter)counter.outerHTML=osmCounterHtml();
 }catch{/* not imported or offline: the map still shows curated places */}
}
function osmPinsHtml(origin,w,h,z){
 if(osmHidden()||!state.osm.places.length)return '';
 // The server sends the most interesting places first; draw them last so they sit on top.
 return [...state.osm.places].reverse().map(p=>{
   const xy=merc(p.lat,p.lon,z),px=xy.x-origin.x+w/2,py=xy.y-origin.y+h/2;
   if(px<-20||px>w+20||py<-20||py>h+20)return '';
   const c=OSM_COLORS[p.category]||'#5F6B62',sel=state.mapSelected===p.id;
   // 26px tap target, 12px visible dot with a white ring
   return `<button class="osm-pin" data-action="osm-pick" data-id="${html(p.id)}" title="${html(name(p))}" aria-label="${html(name(p))}" style="position:absolute;left:${px}px;top:${py}px;transform:translate(-50%,-50%);width:26px;height:26px;padding:0;border:0;border-radius:50%;cursor:pointer;pointer-events:auto;background:radial-gradient(circle,${c} 0 ${sel?7:5}px,#FFF ${sel?7:5}px ${sel?9.5:7}px,transparent ${sel?10:7.5}px);filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));"></button>`;
 }).join('');
}
function osmCounterHtml(){
 const th=state.lang==='th';
 if(state.mapCenter.z<OSM_MIN_ZOOM&&!state.localOnly&&state.category!=='sme'&&!state.nearbyActive)return `<span id="osm-counter" style="color:#5F6B62;font-size:11px;">· ${th?'ซูมเข้าเพื่อดูสถานที่ทั่วไทย':'zoom in for more places'}</span>`;
 if(osmHidden()||!state.osm.places.length)return '<span id="osm-counter"></span>';
 return `<span id="osm-counter" style="color:#5F6B62;font-size:11px;">+ ${state.osm.places.length.toLocaleString()}${state.osm.truncated?` / ${state.osm.total.toLocaleString()}`:''} OpenStreetMap</span>`;
}
function registerOsmPlace(p){
 if(getPlace(p.id))return getPlace(p.id);
 const place={id:p.id,source:'osm',kind:p.kind,en:p.en,th:p.th,locEn:p.locEn,locTh:p.locTh,category:p.category,region:p.region,lat:p.lat,lon:p.lon,
   visit:'',priceFrom:null,currency:'THB',storyEn:'',storyTh:'',photo:'hero-forest.webp',gallery:[],isSme:false,smeType:'',smeBadge:'',featured:false,
   // OSM is edited by the public: escape free text and keep only phone characters before Moo's templates print them.
   openHours:html(p.openingHours||''),isOpen:null,phone:String(p.phone||'').replace(/[^0-9+()\-\s]/g,'').trim().slice(0,30),googlePlaceId:''};
 OSM_PICKED.set(place.id,place);
 // Remember picked places on this device; keep every place used in a list, plus the 100 most recent others.
 const used=new Set([...state.saved,...state.trip]);
 const keep=[...OSM_PICKED.values()].filter(x=>used.has(x.id)).concat([...OSM_PICKED.values()].filter(x=>!used.has(x.id)).slice(-100));
 try{localStorage.setItem(OSM_PICKED_KEY,JSON.stringify(keep))}catch{}
 return place;
}
// This device's lists per account (or guest), so OSM places survive a reload and never leak between accounts.
const osmListsKey=()=>'traval-osm-lists:'+(state.account?.id||'guest');
function saveOsmLists(){try{localStorage.setItem(osmListsKey(),JSON.stringify({saved:state.saved,trip:state.trip}))}catch{}}
function mergeOsmLists(serverList,kind){
 let local=[];try{local=JSON.parse(localStorage.getItem(osmListsKey())||'{}')[kind]||[]}catch{}
 if(!local.some(isDeviceOsmId))return serverList;
 const onServer=new Set(serverList);
 const out=local.filter(id=>onServer.has(id)||(isDeviceOsmId(id)&&getPlace(id))); // local order first
 for(const id of serverList)if(!out.includes(id))out.push(id);                       // anything new from other devices
 return out;
}
/* ---- end Tommy: OpenStreetMap places ---- */

function sharePlace(id){
 const p=getPlace(id);if(!p)return;
 const shareData={
   title:name(p),
   text:`${name(p)} - ${loc(p)} | GoAround`,
   url:window.location.href.split('#')[0]+'#place='+id
 };
 if(navigator.share){
   navigator.share(shareData).catch(()=>{});
 } else {
   navigator.clipboard?.writeText(shareData.url);
   toast(state.lang==='th'?'คัดลอกลิงก์แล้ว!':'Link copied to clipboard!');
 }
}

const merc=(lat,lon,z)=>{
 const scale=256*(2**z);
 const s=Math.sin(Math.max(-85,Math.min(85,lat))*Math.PI/180);
 return {x:(lon+180)/360*scale,y:(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*scale};
};

function clusterMapPlaces(list, z){
 const clusters=[];
 const visited=new Set();
 const radiusDeg = Math.max(0.005, 0.45 / (2 ** (z - 8)));

 for(let i=0;i<list.length;i++){
   if(visited.has(list[i].id)) continue;
   const base=list[i];
   visited.add(base.id);
   const group=[base];
   for(let j=i+1;j<list.length;j++){
     if(visited.has(list[j].id)) continue;
     const target=list[j];
     if(Math.hypot(base.lat-target.lat, base.lon-target.lon) < radiusDeg){
       group.push(target);
       visited.add(target.id);
     }
   }
   if(group.length>1 && z<14){
     const avgLat=group.reduce((acc,p)=>acc+p.lat,0)/group.length;
     const avgLon=group.reduce((acc,p)=>acc+p.lon,0)/group.length;
     clusters.push({isCluster:true,count:group.length,lat:avgLat,lon:avgLon,hasSme:group.some(p=>p.isSme),places:group});
   } else {
     clusters.push({isCluster:false,...base});
   }
 }
 return clusters;
}

function drawMap(){
 if(state.page!=='map')return;
 const box=$('.map-paper'),tileLayer=$('#tile-layer'),pinLayer=$('#pin-layer');
 if(!box||!tileLayer||!pinLayer)return;
 scheduleOsmLoad(); // Tommy: fetch OpenStreetMap places for the visible area (debounced)
 const w=box.offsetWidth,h=box.offsetHeight;
 if(!w||!h)return;

 const {lat,lon,z}=state.mapCenter;
 const origin=merc(lat,lon,z);
 const tx=Math.floor((origin.x-w/2)/256);
 const ty=Math.floor((origin.y-h/2)/256);
 const max=2**z;

 // Tiles
 tileLayer.innerHTML='';
 const fragment=document.createDocumentFragment();
 let count=0;
 for(let x=tx;x<=Math.ceil((origin.x+w/2)/256);x++){
   for(let y=ty;y<=Math.ceil((origin.y+h/2)/256);y++){
     if(y<0||y>=max||count++>48)continue;
     const tile=document.createElement('img');
     tile.alt='';tile.draggable=false;tile.loading='lazy';
     tile.style.left=(x*256-origin.x+w/2)+'px';
     tile.style.top=(y*256-origin.y+h/2)+'px';
     tile.onerror=()=>{tile.remove()};
     tile.src=`https://tile.openstreetmap.org/${z}/${((x%max)+max)%max}/${y}.png`;
     fragment.append(tile);
   }
 }
 tileLayer.append(fragment);

 // Places and Marker Clustering
 const rawList=filteredPlaces();
 const clustered = clusterMapPlaces(rawList, z);

 pinLayer.innerHTML = tripRouteSvg(origin,w,h,z) /* Tommy: trip route line under the pins */ + osmPinsHtml(origin,w,h,z) /* Tommy: OSM places */ + clustered.map(item=>{
   const xy=merc(item.lat,item.lon,z);
   const px=xy.x-origin.x+w/2, py=xy.y-origin.y+h/2;
   if(px<-50||px>w+50||py<-50||py>h+50) return '';

   if(item.isCluster){
     return `<button class="map-cluster-btn" data-action="cluster-zoom" data-lat="${item.lat}" data-lon="${item.lon}" style="position:absolute;left:${px}px;top:${py}px;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:${item.hasSme?'var(--gold-pin,#E5A836)':'var(--brand-forest,#0D2C1C)'};color:${item.hasSme?'var(--brand-forest,#0D2C1C)':'var(--brand-lime,#8DE026)'};border:3px solid var(--bg-surface,#FFF);box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:13px;font-weight:800;cursor:pointer;pointer-events:auto;z-index:18;">
       ${item.count}
     </button>`;
   }

   const isSelected = state.mapSelected===item.id;
   return `<button class="map-pin ${isSelected?'active':''} ${item.isSme?'pin-sme':''}" style="left:${px}px;top:${py}px;position:absolute;transform:translate(-50%,-100%);pointer-events:auto;background:${item.isSme?'var(--gold-pin,#E5A836)':'var(--brand-forest,#0D2C1C)'};border:2px solid var(--bg-surface,#FFF);border-radius:50% 50% 50% 0;rotate:-45deg;width:44px;height:44px;display:grid;place-items:center;color:${item.isSme?'var(--brand-forest,#0D2C1C)':'var(--bg-surface,#FFF)'};box-shadow:0 6px 16px rgba(0,0,0,0.25);" data-action="map-select" data-id="${item.id}" aria-label="${html(name(item))}">
     <span style="rotate:45deg;font-size:13px;font-weight:${item.isSme?'800':'600'};">${item.isSme?'★':ico(item.category==='food'?'coffee':item.category==='stay'?'bed':'pin',16)}</span>
   </button>`;
 }).join('') + (state.nearbyPoint?`
   <div class="map-me-pin" style="left:${merc(state.nearbyPoint.lat,state.nearbyPoint.lon,z).x-origin.x+w/2}px;top:${merc(state.nearbyPoint.lat,state.nearbyPoint.lon,z).y-origin.y+h/2}px;" title="ตำแหน่งของคุณ (You Are Here)">
     <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;background:var(--blue-soft,rgba(37,99,235,0.25));border:1px solid var(--blue,#2563EB);animation:pulseAccuracy 2s infinite ease-out;pointer-events:none;"></div>
     <span style="position:relative;z-index:2;display:block;width:16px;height:16px;border-radius:50%;background:var(--blue,#2563EB);border:3px solid var(--bg-surface,#FFF);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></span>
   </div>
 `: '');
}

// Map pan dragging
let mapDragging=false, dragStartX=0, dragStartY=0, centerStart={lat:0,lon:0};
function initMapDragEvents(){
  const startDrag = (clientX, clientY, target) => {
    const frame=target.closest('#map-frame-box');
    if(!frame||target.closest('button'))return false;
    mapDragging=true;
    dragStartX=clientX;dragStartY=clientY;
    centerStart={...state.mapCenter};
    frame.style.cursor='grabbing';
    if(state.followMe){
      state.followMe=false;
      toast(t('followPaused'));
    }
    return true;
  };

  const moveDrag = (clientX, clientY) => {
    if(!mapDragging)return;
    const dx=clientX-dragStartX, dy=clientY-dragStartY;
    const scale=256*(2**state.mapCenter.z);
    const dLon= - (dx/scale)*360;
    const currentY = merc(centerStart.lat, 0, state.mapCenter.z).y;
    const n = Math.PI - 2*Math.PI*(currentY - dy)/scale;
    const newLat = 180/Math.PI * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));
    state.mapCenter.lon = centerStart.lon + dLon;
    state.mapCenter.lat = isNaN(newLat)?centerStart.lat:Math.max(-85,Math.min(85,newLat));
    if(!state.mapPannedAway && (Math.abs(dx)>50 || Math.abs(dy)>50)){
      state.mapPannedAway=true;
    }
    drawMap();
  };

  const endDrag = () => {
    if(!mapDragging)return;
    mapDragging=false;
    const frame=$('#map-frame-box');
    if(frame)frame.style.cursor='grab';
    if(state.mapPannedAway) render({keepScroll:true});
  };

  document.addEventListener('mousedown',e=>{
    startDrag(e.clientX, e.clientY, e.target);
  });
  window.addEventListener('mousemove',e=>{
    moveDrag(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', endDrag);

  // Touch support for mobile / touch devices
  document.addEventListener('touchstart',e=>{
    if(e.touches && e.touches.length===1){
      if(startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target)){
        e.preventDefault();
      }
    }
  }, {passive:false});
  window.addEventListener('touchmove',e=>{
    if(mapDragging && e.touches && e.touches.length===1){
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  }, {passive:false});
  window.addEventListener('touchend', endDrag);
}
initMapDragEvents();
// Tommy: zoom gestures on top of Moo drag code — two-finger pinch on phones, mouse wheel / trackpad on desktop
if(window.TravalMapGestures){
 TravalMapGestures.attach('#map-frame-box',{
   onZoom(step){
     state.mapCenter.z=Math.max(4,Math.min(17,state.mapCenter.z+step));
     drawMap();
   }
 });
}

// Watch GPS live
if('geolocation' in navigator){
 navigator.geolocation.watchPosition(pos=>{
   state.nearbyPoint={lat:pos.coords.latitude,lon:pos.coords.longitude};
   if(state.followMe){
     state.mapCenter.lat=state.nearbyPoint.lat;
     state.mapCenter.lon=state.nearbyPoint.lon;
     if(state.page==='map') drawMap();
   }
 },()=>{},{enableHighAccuracy:true,maximumAge:15000});
}

async function dispatch(event){
 const target=event.target.closest('[data-action]');
 const localCheck=event.target.closest('#check-local-only');
 if(localCheck){
   state.localOnly=localCheck.checked;
   render({keepScroll:true});
   return;
 }
 if(!target)return;
 const action=target.dataset.action,id=target.dataset.id;
 event.preventDefault();

 switch(action){
   case'navigate':navigate(target.dataset.page);break;
   case'place':case'search-place':place(id);break;
   case'flip-item':{
     const cardEl = target.closest('.item');
     if(cardEl && cardEl.closest('.gallery') && hasGsapSuite() && window.Flip && !isReducedMotion()){
       showFlipDetails(cardEl);
     } else {
       place(id);
     }
     break;
   }
   case'flip-open-full':{
     const pid = target.dataset.id || document.querySelector('#gsap-flip-detail')?.dataset?.placeId;
     cleanupGsapBeforeRender();
     if(pid) place(pid);
     break;
   }
   case'flip-close-detail':{
     hideFlipDetails();
     break;
   }
   case'gsap-split':{
     playSplitTextMode(target.dataset.mode || 'words');
     break;
   }
   case'gsap-jump':{
     const sel = target.dataset.target;
     const dest = sel ? document.querySelector(sel) : null;
     if(dest){
       if(gsapSmoother){
         gsapSmoother.scrollTo(dest, true, sel==='#pinned-shape'?'center center':'top 80px');
       } else if(hasGsapSuite() && window.ScrollToPlugin){
         window.gsap.to(window, { duration: 0.8, scrollTo: { y: dest, offsetY: 80 }, ease: 'power2.inOut' });
       } else {
         dest.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
     }
     break;
   }
   case'back':navigate(state.previous==='welcome'?'discover':state.previous||'discover');break;
   case'landing-slide':{
     const idx=Number(target.dataset.index);
     if(!Number.isNaN(idx)){
       setLandingSlide(idx);
       startLandingSlideshow();
     }
     break;
   }
   case'set-theme':{
    const targetTheme = target.dataset.theme;
    if(['light','dark','system'].includes(targetTheme)){
      state.theme=targetTheme;
      localStorage.setItem('traval-theme',targetTheme);
      store();
      applyTheme();
      render({keepScroll:true});
      toast(state.lang==='th'
        ?(targetTheme==='system'?'โหมด: ตามระบบ':targetTheme==='dark'?'โหมด: มืด':'โหมด: สว่าง')
        :(targetTheme==='system'?'Theme: System':targetTheme==='dark'?'Theme: Dark':'Theme: Light'));
    }
    break;
   }
   case'toggle-theme':{
    state.theme=state.theme==='dark'?'light':'dark';
    localStorage.setItem('traval-theme',state.theme);
    applyTheme();
    store();render({keepScroll:true});
    const msg=state.lang==='th'?(state.theme==='dark'?'โหมดมืด':'โหมดสว่าง'):(state.theme==='dark'?'Dark mode':'Light mode');
    toast(msg);break;
   }
   case'language':state.lang=state.lang==='en'?'th':'en';store();render({keepScroll:true});break;
   case'set-language':state.lang=target.dataset.lang;store();render({keepScroll:true});break;
   case'clear-search':state.query='';render({keepScroll:true});$('#home-query')?.focus();break;
   case'filter-toggle':state.filtersOpen=!state.filtersOpen;render({keepScroll:true});break;
   case'province-filter':state.region='all';state.query=state.query===target.dataset.province?'':target.dataset.province;render({keepScroll:true});break;
   case'category':state.category=target.dataset.category;state.showAll=false;render({keepScroll:true});break;
   case'set-radius':state.nearbyRadius=Number(target.dataset.radius);if(state.nearbyActive)fetchNearby();else render({keepScroll:true});break;
   case'nearby-start':startNearby();break;
   case'nearby-stop':stopGpsWatch();nearbySeq++;state.nearbyBusy=false;state.nearbyActive=false;state.nearbyList=[];state.nearbyPoint=null;render({keepScroll:true});break;
   case'save':savePlace(id);break;
   case'trip-toggle':toggleTrip(id);break;
   case'osm-pick':{ // Tommy: open an OpenStreetMap place in the normal bottom sheet
     const p=state.osm.places.find(x=>x.id===id);
     if(p){registerOsmPlace(p);state.mapSelected=id;state.bottomSheetPlaceId=id;state.bottomSheetState='half';render({keepScroll:true});}
     break;
   }
   case'move-trip':{ // Tommy: the ↑ ↓ buttons on My trips had no handler; route order depends on them
     const i=state.trip.indexOf(id),j=i+Number(target.dataset.dir);
     if(i>=0&&j>=0&&j<state.trip.length){[state.trip[i],state.trip[j]]=[state.trip[j],state.trip[i]];persistCollections();render({keepScroll:true});}
     break;
   }
   case'trip-mode': // Tommy: Drive / Walk on the trip route card
     state.travelMode=target.dataset.mode==='walking'?'walking':target.dataset.mode==='transit'?'transit':'driving';
     render({keepScroll:true});
     break;
   
   case'open-ai':state.showAiModal=true;state.menuOpen=false;render({keepScroll:true});break;
   case'close-ai':state.showAiModal=false;render({keepScroll:true});break;
   case'set-ai-preset':state.aiPreset=target.dataset.preset||'sme';state.aiQuery='';render({keepScroll:true});break;
   case'clear-ai-query':state.aiQuery='';render({keepScroll:true});break;
   case'ai-view-place':state.showAiModal=false;place(id);break;
   case'ai-apply-trip':{
     const recs=getAiRecommendations();
     for(const p of recs){if(!state.trip.includes(p.id))state.trip.push(p.id);}
     persistCollections();
     state.showAiModal=false;
     navigate('trip');
     toast(state.lang==='th'?`เพิ่ม ${recs.length} สถานที่แนะนำเข้าทริปแล้ว!`:`Added ${recs.length} AI picks to My Trips!`);
     break;
   }
   case'install-pwa':{
     state.menuOpen=false;
     if(window.deferredGoAroundPrompt){
       window.deferredGoAroundPrompt.prompt();
       window.deferredGoAroundPrompt.userChoice.then(()=>{window.deferredGoAroundPrompt=null;});
     } else {
       const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone;
       toast(isStandalone
         ? (state.lang==='th'?'คุณกำลังใช้งาน GoAround ในโหมดแอป (App Mode) อยู่แล้ว!':'You are already running GoAround in Standalone App mode!')
         : (state.lang==='th'?'วิธีติดตั้งแอป GoAround: กดปุ่มแชร์/เมนูเบราว์เซอร์ แล้วเลือก "เพิ่มไปยังหน้าจอหลัก (Add to Home Screen)"':'To install GoAround App: open browser menu/Share and tap "Add to Home Screen"'));
     }
     render({keepScroll:true});
     break;
   }
   case'open-safety':state.showSafetyModal=true;state.menuOpen=false;render({keepScroll:true});break;
   case'close-safety':state.showSafetyModal=false;render({keepScroll:true});break;
   case'set-safety-tab':state.safetyTab=target.dataset.tab;render({keepScroll:true});break;
   case'open-onboarding':state.showOnboardingModal=true;state.menuOpen=false;render({keepScroll:true});break;
   case'close-onboarding':state.showOnboardingModal=false;render({keepScroll:true});break;
   case'toggle-open-now':state.openNowFilter=!state.openNowFilter;render({keepScroll:true});break;
   case'toggle-has-promo':state.hasPromoFilter=!state.hasPromoFilter;render({keepScroll:true});break;
   case'set-review-filter':state.reviewFilter=target.dataset.filter;render({keepScroll:true});break;
   case'like-review':{
     const rid=target.dataset.id;
     state.reviewLikes[rid]=!state.reviewLikes[rid];
     render({keepScroll:true});
     break;
   }
   case'set-review-stars':{
     state.reviewRatingInput=Number(target.dataset.stars)||5;
     render({keepScroll:true});
     break;
   }
   case'submit-place-review':{
     const pid=target.dataset.id;
     const txt=$('#place-review-textarea')?.value?.trim();
     if(!txt){toast(state.lang==='th'?'โปรดพิมพ์ข้อความรีวิวก่อนส่งครับ':'Please enter review text');break;}
     if(!state.reviewCache[pid]) state.reviewCache[pid]=[...(DEFAULT_REVIEWS[pid]||[])];
     const newRev={
       id:'user-rev-'+Date.now(),
       author:state.account?.name||(state.lang==='th'?'คุณ (ผู้เดินทาง)':'You (Traveller)'),
       rating:state.reviewRatingInput||5,
       date:state.lang==='th'?'เมื่อสักครู่':'Just now',
       text:txt,
       helpful:0,
       verified:true
     };
     state.reviewCache[pid].unshift(newRev);
     userApi('/api/places/'+encodeURIComponent(pid)+'/my-review','PUT',{stars:newRev.rating,text:newRev.text}).catch(()=>{});
     toast(state.lang==='th'?'ขอบคุณสำหรับรีวิวครับ!':'Thank you for your review!');
     render({keepScroll:true});
     break;
   }
   case'batch-add-trip':{
     if(!state.selectedIds.length){toast(state.lang==='th'?'ยังไม่ได้เลือกสถานที่':'No places selected');break;}
     let added=0;
     for(const id of state.selectedIds){
       if(!state.trip.includes(id)){
         state.trip.push(id);
         added++;
       }
     }
     state.selectMode=false;
     state.selectedIds=[];
     persistCollections();
     toast(t('batchAddSuccess'));
     render({keepScroll:true});
     break;
   }
   case'trip-on-map': // Tommy: show the trip route on Moo's map
     fitMapToTrip();
     navigate('map');
     break;

   case'directions':externalDirections(id);break;
   case'share-place':sharePlace(id);break;
   case'show-all':state.showAll=!state.showAll;render({keepScroll:true});break;
   case'map-select':
     state.mapSelected=id;
     state.bottomSheetPlaceId=id;
     state.bottomSheetState='half';
     render({keepScroll:true});
     break;
   case'cluster-zoom':{
     const clat=Number(target.dataset.lat), clon=Number(target.dataset.lon);
     state.mapCenter={lat:clat,lon:clon,z:Math.min(16,state.mapCenter.z+2)};
     drawMap();
     break;
   }
   case'my-location':
     if(state.nearbyPoint){
       state.mapCenter={lat:state.nearbyPoint.lat,lon:state.nearbyPoint.lon,z:14};
       drawMap();
     } else {
       startNearby();
     }
     break;
   case'toggle-follow':
     state.followMe=!state.followMe;
     if(state.followMe && state.nearbyPoint){
       state.mapCenter={lat:state.nearbyPoint.lat,lon:state.nearbyPoint.lon,z:14};
     }
     render({keepScroll:true});
     break;
   case'search-area':
     state.mapPannedAway=false;
     if(state.nearbyActive){
       state.nearbyPoint={lat:state.mapCenter.lat,lon:state.mapCenter.lon};
       fetchNearby();
     } else {
       render({keepScroll:true});
     }
     break;
   case'toggle-sheet':
     state.bottomSheetState=state.bottomSheetState==='peek'?'half':state.bottomSheetState==='half'?'full':'peek';
     render({keepScroll:true});
     break;
   case'close-sheet':
     state.bottomSheetState='closed';
     render({keepScroll:true});
     break;
   case'collection-filter':
     state.collectionFilter=target.dataset.filter;
     render({keepScroll:true});
     break;
   case'map-zoom':
     state.mapCenter.z=Math.max(4,Math.min(17,state.mapCenter.z+Number(target.dataset.step)));
     drawMap();
     break;
   case'menu-open':state.menuOpen=true;render({keepScroll:true});break;
   case'menu-close':state.menuOpen=false;render({keepScroll:true});break;
   case'search-open':state.searchOpen=true;render({keepScroll:true});$('#overlay-search')?.focus();break;
   case'search-close':state.searchOpen=false;state.query='';render({keepScroll:true});break;
   case'auth-mode':state.authMode=target.dataset.mode;render({keepScroll:true});break;
   case'auth-logout':signOut();break;
   case'auth-logout-all':signOutAll();break;
   case'explore-nearby-place':{
     const p=getPlace(id);
     if(p&&p.lat&&p.lon){
       state.nearbyPoint={lat:p.lat,lon:p.lon};
       state.mapCenter={lat:p.lat,lon:p.lon,z:14};
       state.nearbyActive=true;
       fetchNearby();
       navigate('map');
       toast(state.lang==='th'?`สำรวจรอบ ๆ ${name(p)}`:`Exploring around ${name(p)}`);
     }
     break;
   }
   case'set-manual-point':{
     const mlat=Number(target.dataset.lat), mlon=Number(target.dataset.lon);
     state.nearbyPoint={lat:mlat,lon:mlon};
     state.mapCenter={lat:mlat,lon:mlon,z:13};
     state.geoStatus='manual';
     state.nearbyActive=true;
     fetchNearby();
     toast(state.lang==='th'?`กำหนดตำแหน่ง: ${target.dataset.name}`:`Location set: ${target.dataset.name}`);
     break;
   }
   case'quick-filter-local':
     state.localOnly=!state.localOnly;
     render({keepScroll:true});
     break;
   case'quick-filter-rating':
     state.minRating=state.minRating===Number(target.dataset.rating)?0:Number(target.dataset.rating);
     render({keepScroll:true});
     break;
   case'quick-filter-budget':
     state.nearbyMaxPrice=state.nearbyMaxPrice===target.dataset.budget?'':target.dataset.budget;
     render({keepScroll:true});
     break;
   case'reset-filters':
     state.category='all';
     state.query='';
     state.region='all';
     state.localOnly=false;
     state.nearbyMaxPrice='';
     state.minRating=0;
     render({keepScroll:true});
     break;
   case'toggle-select-mode':
     state.selectMode=!state.selectMode;
     if(!state.selectMode) state.selectedIds=[];
     render({keepScroll:true});
     break;
   case'toggle-select-item':
     if(state.selectedIds.includes(id)){
       state.selectedIds=state.selectedIds.filter(x=>x!==id);
     }else{
       state.selectedIds=[...state.selectedIds,id];
     }
     render({keepScroll:true});
     break;
   case'send-to-planner':
     if(state.selectedIds.length===0){
       toast(state.lang==='th'?'กรุณาเลือกสถานที่อย่างน้อย 1 แห่ง':'Please select at least 1 place');
       return;
     }
     try{
       const planStops=state.selectedIds.map(getPlace).filter(Boolean);
       localStorage.setItem('traval-selected-plan-stops',JSON.stringify(planStops));
     }catch{}
     window.location.href=`/planner.html?places=${encodeURIComponent(state.selectedIds.join(','))}`;
     break;
   case'delete-selected-saved':
     if(state.selectedIds.length===0) return;
     if(state.page==='trip'){
       state.trip=state.trip.filter(x=>!state.selectedIds.includes(x));
     }else{
       state.saved=state.saved.filter(x=>!state.selectedIds.includes(x));
     }
     persistCollections();
     toast(state.lang==='th'?`ลบ ${state.selectedIds.length} รายการแล้ว`:`Removed ${state.selectedIds.length} items`);
     state.selectedIds=[];
     state.selectMode=false;
     render({keepScroll:true});
     break;
   case'dismiss-onboard':
     state.onboarding=false;
     try{localStorage.setItem(ONBOARD_KEY,'1')}catch{}
     render({keepScroll:true});
     break;
   default:break;
 }
}

function onInput(event){
 if(event.target.id==='overlay-search'){
   state.query=event.target.value;
   const results=$('.search-results');
   if(results) results.innerHTML=filteredPlaces().slice(0,6).map(p=>`
     <button data-action="search-place" data-id="${p.id}">
       <img src="${photo(p.photo)}" alt=""/>
       <span><strong>${html(name(p))} ${p.isSme?'★':''}</strong><small>${html(loc(p))}</small></span>
       ${ico('arrow',18)}
     </button>
   `).join('')||`<div class="search-empty">${html(t('nothing'))}</div>`;
 }
 if(event.target.id==='collection-search-input'){
   state.collectionQuery=event.target.value;
   render({keepScroll:true});
 }
 if(event.target.id==='ai-query-input'){
    state.aiQuery=event.target.value;
    render({keepScroll:true});
    const el=$('#ai-query-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}
    return;
  }
  if(event.target.id==='map-search-input'||event.target.id==='home-query'){
   state.query=event.target.value;
   render({keepScroll:true});
 }
}

function onChange(event){
 if(event.target.id==='map-region'){
   state.region=event.target.value;
   const mapRegions={all:{lat:13.736,lon:100.523,z:6},north:{lat:18.868,lon:99.35,z:10},central:{lat:13.75,lon:100.5,z:11},south:{lat:8.5,lon:98.6,z:9},northeast:{lat:16.4,lon:103.5,z:8},east:{lat:12.8,lon:101.5,z:9},west:{lat:14.2,lon:99.2,z:9}};
   state.mapCenter={...(mapRegions[state.region]||mapRegions.all)};
   render({keepScroll:true});
 }
 if(event.target.id==='check-local-only'){
   state.localOnly=event.target.checked;
   render({keepScroll:true});
 }
 if(event.target.id==='near-price'){
   state.nearbyMaxPrice=event.target.value;
   render({keepScroll:true});
 }
 if(event.target.id==='min-rating'){
   state.minRating=Number(event.target.value)||0;
   render({keepScroll:true});
 }
}

document.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;

  if(form.id === 'member-auth-form'){
    const fd = new FormData(form);
    const email = fd.get('email');
    const password = fd.get('password');
    const name = fd.get('name');
    try {
      if(state.authMode === 'register'){
        const res = await userApi('/api/auth/register', 'POST', { name, email, password });
        state.account = res.user;
      } else {
        const res = await userApi('/api/auth/login', 'POST', { email, password });
        state.account = res.user;
      }
      await loadAccountCollections();
      toast(state.lang==='th'?'เข้าสู่ระบบสำเร็จ':'Signed in successfully');
      render({keepScroll:true});
    } catch(err) {
      toast(err.message);
    }
    return;
  }

  if(form.id === 'safety-report-form'){
    const category = $('#safety-cat-input')?.value || 'scam';
    const title = $('#safety-title-input')?.value?.trim();
    const description = $('#safety-desc-input')?.value?.trim();
    const locationName = $('#safety-loc-input')?.value?.trim();
    if(!title || !description || !locationName) return;
    const newReport = {
      id: 'safety-' + Date.now(),
      category,
      title,
      description,
      tip: description,
      locationName,
      status: 'pending'
    };
    state.safetyReports.unshift(newReport);
    state.safetyTab = 'alerts';
    userApi('/api/safety/reports', 'POST', {
      category,
      title,
      description,
      locationName,
      lat: state.nearbyPoint?.lat ?? null,
      lon: state.nearbyPoint?.lon ?? null
    }).catch(() => {});
    toast(t('reportSubmitted'));
    render({keepScroll:true});
    return;
  }

});

document.addEventListener('click',dispatch);
document.addEventListener('input',onInput);
document.addEventListener('change',onChange);

/* ---- Moo: Explore search bar suggestions (recommended places dropdown) ---- */
function homeSuggestItems(){
  const q=state.query.trim();
  if(q) return filteredPlaces().slice(0,6);
  const picks=PLACES.filter(p=>!sponsored(p)&&(Number(p.rating||0)>=4.7||p.isSme));
  return (picks.length?picks:PLACES).slice(0,6);
}
function showHomeSuggest(){
  const box=$('#home-suggest');
  if(!box) return;
  const th=state.lang==='th', q=state.query.trim(), items=homeSuggestItems();
  box.innerHTML=`
    <div class="home-suggest-head">${q?(th?`ผลการค้นหา “${html(q)}”`:`Results for “${html(q)}”`):(th?'สถานที่แนะนำ':'Recommended places')}</div>
    ${items.length?items.map(p=>`
      <button type="button" class="home-suggest-item" role="option" data-action="search-place" data-id="${p.id}">
        <img src="${photo(p.photo)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/hero-forest.webp'"/>
        <span class="home-suggest-text">
          <strong>${html(name(p))}</strong>
          <small>${html(loc(p))}${p.rating?` · ★ ${p.rating}`:''}${p.isSme?` · ${th?'ร้านชุมชน':'Local SME'}`:''}</small>
        </span>
        <span class="home-suggest-go">${th?'ดู':'View'} →</span>
      </button>`).join(''):`<div class="home-suggest-empty">${html(t('nothing'))}</div>`}`;
  box.hidden=false;
}
function hideHomeSuggest(){const box=$('#home-suggest');if(box)box.hidden=true;}
document.addEventListener('focusin',e=>{if(e.target.id==='home-query')showHomeSuggest();});
document.addEventListener('click',e=>{if(!e.target.closest('#home-search'))hideHomeSuggest();});
document.addEventListener('submit',e=>{
  if(e.target.id!=='home-search') return;
  hideHomeSuggest();
  $('#home-query')?.blur();
  $('#gallery-section')?.scrollIntoView({behavior:'smooth',block:'start'});
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideHomeSuggest();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(activeFlipItem){hideFlipDetails();return;}
    if(state.showAiModal){state.showAiModal=false;render({keepScroll:true})}
    else if(state.showSafetyModal){state.showSafetyModal=false;render({keepScroll:true})}
    else if(state.showOnboardingModal){state.showOnboardingModal=false;render({keepScroll:true})}
    else if(state.menuOpen){state.menuOpen=false;render({keepScroll:true})}
    else if(state.searchOpen){state.searchOpen=false;render({keepScroll:true})}
    else if(state.bottomSheetState!=='closed'){state.bottomSheetState='closed';render({keepScroll:true})}
    else if(state.page==='detail')navigate(state.previous||'discover');
  }
});

window.addEventListener('hashchange',()=>{
  const h=location.hash.slice(1);
  if(!h) navigate('welcome',false);
  else if(h.startsWith('place=')) place(h.slice(6));
  else if(['welcome','discover','map','saved','trip','profile'].includes(h)) navigate(h,false);
});

// Initialize
if(location.hash.startsWith('#place=')) state.detail=location.hash.slice(7);
else if(location.hash==='#profile') {
  window.location.replace(state.account?'/profile.html':'/login.html');
}
else if(['welcome','discover','map','saved','trip'].includes(location.hash.slice(1))) state.page=location.hash.slice(1);

applyTheme();
render();
refreshSession();
initRealData();

if (typeof window !== 'undefined' && window.matchMedia) {
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.theme === 'system') {
        applyTheme();
        render({ keepScroll: true });
      }
    });
  } catch {}
}
