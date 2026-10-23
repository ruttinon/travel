/* unfold v2.7 — Traval Platform Client Application
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
 notebook:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18m3-12h5m-5 4h5"/>'
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
   exploreEyebrow:'LOCAL SME & GEMS',exploreTitle:'Somewhere\nnew.',exploreIntro:'Discover authentic community heritage and local SMEs.',popular:'Popular places',nearby:'More to wander',showAll:'See all places',
   search:'Search places, stores, or provinces',searchShort:'Search',all:'All',sme:'★ Local SME',nature:'Nature',food:'Food',stay:'Stays',culture:'Culture',
   return:'Back',view:'View place',save:'Save',unsave:'Saved',route:'Directions',addTrip:'Add to trip',removeTrip:'In trip',visit:'Duration',area:'Area',exploreType:'Type',about:'The place',gallery:'Gallery',
   review:'Your private note',notePlaceholder:'What did you discover?',saveNote:'Save note',photoNotice:'Community preview imagery · verify conditions before travel.',dataNotice:'Check opening conditions before visiting.',
   openInMaps:'Open Google Maps',planned:'Trip stops',emptySaved:'Your next favourite place is waiting.',emptyTrip:'No stops yet.',nothing:'No places found',different:'Try another keyword or category.',
   myCollections:'Your collection',collections:'Save your favorites at your own pace.',allSaved:'All places',planTrip:'My trips',clearTrip:'Clear trip',planRoute:'Open trip route',profileSub:'Make Traval yours.',
   language:'Language',suggest:'Suggest a hidden gem',suggestTitle:'Know somewhere special?',name:'Name',location:'Area / Province',category:'Category',notes:'Notes (optional)',submit:'Save suggestion',
   draftNotice:'Saved as a private draft on this device.',drafts:'Your suggestions',export:'Export my data',reset:'Reset local data',done:'Saved on this device',removed:'Removed',removedTrip:'Removed from trip',
   searchResults:'Search results',mapCaption:'Live map preview · coordinates verified',mapUnavailable:'Tiles unavailable. Place pins still work.',mapArea:'Region',menuSub:'Discover Thailand from another angle.',
   close:'Close',hint:'Design illustrations and authentic coordinates.',more:'See more',copy:'Copy trip',copied:'Copied',homeLink:'Home',titlePlace:'Place details',verified:'Verified',
   mapZoomIn:'Zoom in',mapZoomOut:'Zoom out',clear:'Clear',allRegions:'All locations',list:'List',
   spotlightTitle:'Local SME Spotlight',spotlightSub:'Community enterprises and artisan heritage',
   localOnly:'Local Only',followMe:'Follow Me',following:'Following',myLocation:'My Location',searchThisArea:'Search This Area',
   followPaused:'Follow Me paused (dragged map)',localStory:'Local Story',openNow:'Open',closedNow:'Closed',call:'Call'
 },
 th:{
   welcome:'ค้นพบเสน่ห์ชุมชน สนับสนุนร้านค้าท้องถิ่น',enter:'เริ่มสำรวจ',skip:'ข้าม',discover:'สำรวจ',map:'แผนที่',saved:'บันทึก',trip:'ทริปของฉัน',profile:'โปรไฟล์',menu:'เมนู',
   homeEyebrow:'LOCAL FIRST DISCOVERY',homeTitle:'ออกไปเจอ\nอะไรใหม่ ๆ',homeDesc:'ค้นพบสถานที่และร้านค้าชุมชน SME ที่ควรค่าแก่การเดินทาง',homeExplore:'ค้นหาสถานที่',homeHint:'ร่วมกระจายรายได้สู่ชุมชน',
   exploreEyebrow:'เสน่ห์ท้องถิ่นรอคุณอยู่',exploreTitle:'ที่ใหม่ ๆ\nรอคุณอยู่',exploreIntro:'ค้นพบสถานที่และร้านค้าจากมุมมองคนท้องถิ่นแท้จริง',popular:'สถานที่น่าสนใจ',nearby:'ไปต่อที่ไหนดี',showAll:'ดูทั้งหมด',
   search:'ค้นหาสถานที่, ชื่อร้าน หรือจังหวัด',searchShort:'ค้นหา',all:'ทั้งหมด',sme:'★ ร้านค้าชุมชน SME',nature:'ธรรมชาติ',food:'ของกิน',stay:'ที่พัก',culture:'วัฒนธรรม',
   return:'ย้อนกลับ',view:'ดูสถานที่',save:'บันทึก',unsave:'บันทึกแล้ว',route:'นำทาง',addTrip:'เพิ่มเข้าทริป',removeTrip:'อยู่ในทริปแล้ว',visit:'ระยะเวลา',area:'พื้นที่',exploreType:'ประเภท',about:'เกี่ยวกับ',gallery:'รูปภาพ',
   review:'โน้ตส่วนตัว',notePlaceholder:'คุณค้นพบอะไรที่นี่?',saveNote:'บันทึกโน้ต',photoNotice:'ภาพประกอบวิถีชุมชน · ควรตรวจสอบก่อนเดินทางจริง',dataNotice:'ตรวจสอบเวลาเปิดและข้อมูลก่อนเดินทาง',
   openInMaps:'เปิด Google Maps',planned:'จุดแวะ',emptySaved:'ยังไม่มีสถานที่ที่บันทึก',emptyTrip:'ยังไม่มีจุดแวะ ลองไปสำรวจดูก่อน',nothing:'ไม่พบสถานที่',different:'ลองค้นหาคำอื่นหรือเปลี่ยนหมวด',
   myCollections:'สถานที่ของฉัน',collections:'เก็บสถานที่และร้านโปรดไว้ไปทีหลัง',allSaved:'ทั้งหมด',planTrip:'ทริปของฉัน',clearTrip:'ล้างทริป',planRoute:'เปิดเส้นทางทริป',profileSub:'ตั้งค่าตามที่คุณชอบ',
   language:'ภาษา',suggest:'แนะนำสถานที่ลับ',suggestTitle:'รู้จักสถานที่ดี ๆ ไหม?',name:'ชื่อสถานที่',location:'พื้นที่ / จังหวัด',category:'ประเภท',notes:'หมายเหตุ (ไม่บังคับ)',submit:'บันทึกร่าง',
   draftNotice:'เก็บเป็นร่างส่วนตัวบนเครื่องนี้',drafts:'ร่างสถานที่',export:'ส่งออกข้อมูล',reset:'ล้างข้อมูลในเครื่อง',done:'บันทึกไว้ในเครื่องแล้ว',removed:'นำออกแล้ว',removedTrip:'นำออกจากทริปแล้ว',
   searchResults:'ผลการค้นหา',mapCaption:'แผนที่พิกัดจริง · พิกัด GPS ได้รับการตรวจสอบ',mapUnavailable:'โหลดแผนที่ไม่ได้ แต่ยังเลือกหมุดได้',mapArea:'พื้นที่',menuSub:'ออกไปเจอโลกจากมุมคนท้องถิ่น',
   close:'ปิด',hint:'ภาพประกอบดีไซน์และพิกัดจริง',more:'เพิ่มเติม',copy:'คัดลอกทริป',copied:'คัดลอกแล้ว',homeLink:'หน้าแรก',titlePlace:'รายละเอียดสถานที่',verified:'ตรวจสอบแล้ว',
   mapZoomIn:'ซูมเข้า',mapZoomOut:'ซูมออก',clear:'ล้าง',allRegions:'ทุกพื้นที่',list:'รายการ',
   spotlightTitle:'ร้านค้าท้องถิ่นแนะนำ (Local SME Spotlight)',spotlightSub:'เรื่องราววิถีชุมชนและคุณค่าสินค้าท้องถิ่น',
   localOnly:'เฉพาะร้านชุมชน',followMe:'ติดตามฉัน',following:'กำลังติดตาม',myLocation:'ตำแหน่งของฉัน',searchThisArea:'ค้นหาบริเวณนี้',
   followPaused:'หยุดโหมดติดตามชั่วคราวเนื่องจากเลื่อนแผนที่',localStory:'เรื่องเล่าวิถีชุมชน',openNow:'เปิดอยู่',closedNow:'ปิดแล้ว',call:'โทร'
 }
};

const CATEGORIES=['all','sme','nature','food','stay','culture'];

const SAMPLE_PLACES=[
 {id:'sme-mae-kampong-coffee',en:'Doi Pha Mee Charcoal Roasted Coffee',th:'โรงคั่วกาแฟเตาฟืน ดอยผาหมี (แม่กำปอง)',locEn:'Mae On, Chiang Mai',locTh:'อ.แม่ออน จ.เชียงใหม่',category:'food',isSme:true,smeBadge:'Local SME Spotlight',photo:'hero-forest.webp',gallery:['hero-forest.webp','cabin-retreat.webp','terrace.webp'],region:'north',province:'chiang-mai',provinceTh:'เชียงใหม่',provinceEn:'Chiang Mai',lat:18.8682,lon:99.3515,rating:4.9,reviewsCount:184,priceFrom:65,currency:'THB',visit:'1–2h',phone:'089-555-1234',openHours:'08:00 - 17:00 น.',isOpen:true,storyEn:'A local cooperative brewing Arabica roasted slowly over bamboo charcoal firewood.',storyTh:'ร้านกาแฟวิสาหกิจชุมชนที่ใช้วิธีการคั่วเมล็ดอาราบิกาแท้บนเตาฟืนไม้ไผ่โบราณ กลิ่นหอมรมควันอันเป็นเอกลักษณ์ รายได้หมุนเวียนกลับสู่กลุ่มเกษตรกรบนดอย',specialtiesTh:['กาแฟดริปเตาฟืนดอยผาหมี','ชารอยัลยอดน้ำค้าง','เค้กชาเขียวใบเมี่ยง']},
 {id:'sme-talad-noi-noodle',en:'Ba Hao Handmade Egg Noodles',th:'บะหมี่ไข่ทำมือ 3 ชั่วอายุคน (ตลาดน้อย)',locEn:'Talad Noi, Bangkok',locTh:'ตรอกศาลเจ้าโรงเกือก ตลาดน้อย กรุงเทพฯ',category:'food',isSme:true,smeBadge:'Hidden Gem',photo:'kyoto-lane.webp',gallery:['kyoto-lane.webp','path.webp','terrace.webp'],region:'central',province:'bangkok',provinceTh:'กรุงเทพฯ',provinceEn:'Bangkok',lat:13.7348,lon:100.5135,rating:4.8,reviewsCount:312,priceFrom:60,currency:'THB',visit:'45m',phone:'081-443-8899',openHours:'09:00 - 16:30 น.',isOpen:true,storyEn:'50-year-old lane eatery kneading springy egg noodles using traditional long bamboo poles.',storyTh:'ร้านบะหมี่เส้นสดในตรอกเก่าแก่ตลาดน้อย นวดแป้งด้วยไม้ไผ่ยาวตามตำรับกวางตุ้งแท้ น้ำซุปเคี่ยวกระดูกหมูและกุ้งแห้งนานกว่า 8 ชั่วโมง',specialtiesTh:['บะหมี่เป๊าะแห้งหมูแดงอบน้ำผึ้ง','เกี๊ยวกุ้งจักรพรรดิ์','น้ำเก๊กฮวยต้มสมุนไพร']},
 {id:'sme-nan-weaving-homestay',en:'Ta Nong Eco-Loom Homestay',th:'โฮมสเตย์ทอผ้าไทลื้อ ตานงค์ (ปัว)',locEn:'Pua, Nan',locTh:'อ.ปัว จ.น่าน',category:'stay',isSme:true,smeBadge:'Local SME Spotlight',photo:'terraced-fields.webp',gallery:['terraced-fields.webp','green-valley.webp','cabin-retreat.webp'],region:'north',province:'nan',provinceTh:'น่าน',provinceEn:'Nan',lat:19.1764,lon:100.9152,rating:4.95,reviewsCount:96,priceFrom:850,currency:'THB',visit:'1–2 days',phone:'085-709-3421',openHours:'เปิดรับผู้เข้าพักทุกวัน',isOpen:true,storyEn:'Teakwood eco-homestay amid misty rice terraces of Pua with Tai Lue loom weaving.',storyTh:'บ้านพักไม้สักริมคันนาล้อมรอบด้วยไอหมอกดอยภูคา เจ้าของบ้านสอนการทอผ้าลายน้ำไหลโบราณ พร้อมเสิร์ฟขันโตกอาหารพื้นบ้านปลอดสารพิษ',specialtiesTh:['ผ้าทอมือลายน้ำไหล','สำรับขันโตกผักอินทรีย์','เวิร์กช็อปย้อมครามธรรมชาติ']},
 {id:'mae-kampong',en:'Mae Kampong Village',th:'หมู่บ้านแม่กำปอง',locEn:'Chiang Mai, Thailand',locTh:'อ.แม่ออน เชียงใหม่',category:'nature',isSme:false,photo:'hero-forest.webp',gallery:['hero-forest.webp','green-valley.webp','cabin-retreat.webp'],region:'north',province:'chiang-mai',provinceTh:'เชียงใหม่',provinceEn:'Chiang Mai',lat:18.866,lon:99.347,rating:4.85,reviewsCount:1420,visit:'2–4h',openHours:'เปิดตลอด 24 ชม.',isOpen:true,storyEn:'A hillside village tucked into the green mountains of northern Thailand.',storyTh:'หมู่บ้านท่องเที่ยวเชิงอนุรักษ์กลางหุบเขาเขียวขจี ลำธารธรรมชาติไหลผ่านกลางหมู่บ้าน'},
 {id:'ban-pa-bong-piang',en:'Pa Bong Piang',th:'บ้านป่าบงเปียง',locEn:'Mae Chaem, Thailand',locTh:'แม่แจ่ม เชียงใหม่',category:'nature',isSme:false,photo:'terraced-fields.webp',gallery:['terraced-fields.webp','green-valley.webp','ridge-view.webp'],region:'north',province:'chiang-mai',provinceTh:'เชียงใหม่',provinceEn:'Chiang Mai',lat:18.497,lon:98.45,rating:4.9,reviewsCount:880,priceFrom:500,currency:'THB',visit:'2–3h',storyEn:'Terraced mountain landscapes with a slow, rural rhythm.',storyTh:'วิวนาข้าวขั้นบันไดบนภูเขาและบรรยากาศเรียบง่ายในสายหมอก'},
 {id:'baan-rak-thai',en:'Ban Rak Thai',th:'บ้านรักไทย',locEn:'Mae Hong Son, Thailand',locTh:'แม่ฮ่องสอน ประเทศไทย',category:'stay',isSme:false,photo:'misty-cabin.webp',gallery:['misty-cabin.webp','alpine-wide.webp','cabin-retreat.webp'],region:'north',province:'mae-hong-son',provinceTh:'แม่ฮ่องสอน',provinceEn:'Mae Hong Son',lat:19.59,lon:97.94,rating:4.75,reviewsCount:1650,priceFrom:1200,currency:'THB',visit:'1 day',storyEn:'A small mountain-lake village with Yunnanese tea plantations.',storyTh:'หมู่บ้านชาวไทยเชื้อสายจีนยูนนานริมทะเลสาบบนภูเขา ล้อมรอบด้วยไร่ชาขั้นบันได'},
 {id:'sme-khao-sok-raft',en:'Uncle Somchai Khao Sok Eco-Raft',th:'แพไม้ไผ่ลุงสมชาย รักษ์เขาสก',locEn:'Phanom, Surat Thani',locTh:'อ.พนม จ.สุราษฎร์ธานี',category:'culture',isSme:true,smeBadge:'Local SME Spotlight',photo:'karst-lake.webp',gallery:['karst-lake.webp','hero-forest.webp','mountain-lake.webp'],region:'south',province:'surat-thani',provinceTh:'สุราษฎร์ธานี',provinceEn:'Surat Thani',lat:8.9165,lon:98.5320,rating:4.92,reviewsCount:145,priceFrom:400,currency:'THB',visit:'3h',phone:'087-229-8765',openHours:'07:30 - 17:30 น.',isOpen:true,storyEn:'Bamboo river rafting guided by native Sok valley villagers with bamboo drip coffee.',storyTh:'บริการล่องแพไม้ไผ่แม่น้ำศกโดยชาวบ้านท้องถิ่น จิบกาแฟคั่วสดในกระบอกไม้ไผ่กลางลำน้ำ สัมผัสทัศนียภาพหน้าผาหินปูนล้านปี',specialtiesTh:['กาแฟกระบอกไม้ไผ่กลางสายน้ำ','ล่องแพชมถ้ำประกายเพชร']},
 {id:'sme-koh-yao-fisherman',en:'Koh Yao Fishermen Kitchen',th:'ครัวชาวเลชุมชน เกาะยาวน้อย',locEn:'Koh Yao Noi, Phang Nga',locTh:'เกาะยาวน้อย จ.พังงา',category:'food',isSme:true,smeBadge:'Hidden Gem',photo:'coast-overlook.webp',gallery:['coast-card.webp','coast-tall.webp','ridge-view.webp'],region:'south',province:'phang-nga',provinceTh:'พังงา',provinceEn:'Phang Nga',lat:8.1250,lon:98.6040,rating:4.88,reviewsCount:220,priceFrom:180,currency:'THB',visit:'1.5h',phone:'082-998-3344',openHours:'11:00 - 21:00 น.',isOpen:true,storyEn:'Sustainable catch-of-the-day seafood beside floating fish pens on Koh Yao Noi.',storyTh:'ร้านอาหารริมกระชังปลาของกลุ่มประมงพื้นบ้านเกาะยาว อาหารทะเลสดจากอวนวันต่อวัน ปรุงด้วยเครื่องแกงตำมือสูตรปักษ์ใต้แท้',specialtiesTh:['แกงส้มปลากะพงยอดมะพร้าว','ยำสาหร่ายข้อพื้นเมือง']}
];

let PLACES=[...SAMPLE_PLACES];
let LIVE_DATA=false,API_ONLINE=false;
const REMOTE_CACHE={};
const getPlace=id=>PLACES.find(p=>p.id===id);

const KEY='unfold-v2-user';
function readStore(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
const stored=readStore();

const state={
 page:'welcome',previous:'discover',lang:stored.lang==='th'?'th':'en',category:'all',query:'',
 searchOpen:false,menuOpen:false,showAll:false,region:'all',
 saved:Array.isArray(stored.saved)?stored.saved.filter(x=>getPlace(x)):['sme-mae-kampong-coffee','sme-talad-noi-noodle'],
 trip:Array.isArray(stored.trip)?stored.trip.filter(x=>getPlace(x)):[],
 notes:stored.notes&&typeof stored.notes==='object'?stored.notes:{},
 suggestions:Array.isArray(stored.suggestions)?stored.suggestions:[],
 detail:null,mapCenter:{lat:18.868,lon:99.35,z:10},mapSelected:'sme-mae-kampong-coffee',mapDisabled:false,
 account:null,authMode:'login',reviewCache:{},myReviews:[],reviewPhoto:'',accountBusy:false,
 resetToken:'',accountMessage:'',nearbyActive:false,nearbyBusy:false,nearbyList:[],
 nearbyPoint:null,nearbyRadius:1,nearbyMaxPrice:'',nearbyCurrency:'THB',travelMode:'driving',filtersOpen:false,
 localOnly:false,followMe:false,heading:0,collectionFilter:'all',
 bottomSheetState:'closed',bottomSheetPlaceId:null,mapPannedAway:false,
 aiModalOpen:false,aiLoading:false,aiResult:null,aiForm:{province:'chiang-mai',days:2,budget:3500,style:'all',pace:'normal',quickWalk:false},
 safetyModalOpen:false,safetyReports:[],safetyFormOpen:false,campaigns:[],spotlightPlaces:[]
};

const guestSaved=[...state.saved],guestTrip=[...state.trip];

Object.assign(I18N.en,{
 accountTitle:'Your account',createAccount:'Create an account',signIn:'Sign in',signUp:'Sign up',signOut:'Sign out',displayName:'Your name',email:'Email address',password:'Password',accountIntro:'Save favourites across devices.',accountReady:'Synced to your account',guestIntro:'Explore as a guest, or sign in to sync.',publicReviews:'Traveller reviews',writeReview:'Share your experience',reviewBody:'Your review',photoUpload:'Add photo',submitReview:'Submit review',reviewPending:'Awaiting moderation',reviewRejected:'Not published',reviewApproved:'Published',noReviews:'No public reviews yet.',removeReview:'Delete review',authNeeded:'Sign in to review real places.',accountSuccess:'Account ready',accountError:'Unable to complete request',rating:'Rating',guestSaved:'Guest lists stay on this device',reviewCheck:'Reviews are published after approval.',
 nearMe:'Around Me',nearActive:'Around Me',locating:'Locating…',stopNear:'Show all',radius:'Radius',budget:'Budget',anyBudget:'Any price',noLocal:'No published places nearby.',locationDenied:'Location unavailable. Please allow GPS.',localOnly:'Nearby works with published places.',distKm:'km away',startingFrom:'From',modeDrive:'Drive',modeWalk:'Walk',modeTransit:'Transit',verifyEmail:'Verify email',emailUnverified:'Email not verified',emailVerified:'Email verified',sendVerify:'Send verification link',forgotPassword:'Forgot password?',resetPassword:'Reset password',sendReset:'Send reset link',backToLogin:'Back to sign in',emailCheck:'Check email link.',resetReady:'Password changed.',changeName:'Edit display name',saveName:'Update name',profileUpdated:'Profile updated',sendLink:'Send link',filters:'Filters'
});
Object.assign(I18N.th,{
 accountTitle:'บัญชีของคุณ',createAccount:'สร้างบัญชี',signIn:'เข้าสู่ระบบ',signUp:'สมัครสมาชิก',signOut:'ออกจากระบบ',displayName:'ชื่อที่แสดง',email:'อีเมล',password:'รหัสผ่าน',accountIntro:'บันทึกสถานที่และทริปข้ามอุปกรณ์',accountReady:'ซิงก์เข้าบัญชีแล้ว',guestIntro:'ใช้แบบผู้เยี่ยมชมหรือเข้าสู่ระบบเพื่อซิงก์ข้อมูล',publicReviews:'รีวิวจากผู้เดินทาง',writeReview:'แบ่งปันประสบการณ์',reviewBody:'รีวิวของคุณ',photoUpload:'เพิ่มรูปภาพ',submitReview:'ส่งรีวิว',reviewPending:'รอตรวจสอบ',reviewRejected:'ยังไม่ได้เผยแพร่',reviewApproved:'เผยแพร่แล้ว',noReviews:'ยังไม่มีรีวิวที่เผยแพร่',removeReview:'ลบรีวิวของฉัน',authNeeded:'เข้าสู่ระบบก่อนรีวิวสถานที่จริง',accountSuccess:'บัญชีพร้อมใช้งาน',accountError:'ทำรายการไม่สำเร็จ',rating:'คะแนน',guestSaved:'ข้อมูลผู้เยี่ยมชมเก็บในเครื่องนี้',reviewCheck:'รีวิวจะเผยแพร่หลังผู้ดูแลตรวจสอบ',
 nearMe:'รอบตัวฉัน (Around Me)',nearActive:'สำรวจรอบตัว',locating:'กำลังระบุพิกัด…',stopNear:'ดูทั้งหมด',radius:'รัศมี',budget:'งบประมาณ',anyBudget:'ทุกราคา',noLocal:'ยังไม่มีสถานที่จริงที่เผยแพร่ใกล้ตำแหน่งนี้',locationDenied:'ไม่สามารถรับตำแหน่งได้ โปรดอนุญาต GPS ในเบราว์เซอร์',localOnly:'ค้นหาใกล้ฉันรองรับสถานที่ที่เผยแพร่แล้วเท่านั้น',distKm:'กม.',startingFrom:'เริ่มต้น',modeDrive:'รถยนต์',modeWalk:'เดิน',modeTransit:'ขนส่งสาธารณะ',verifyEmail:'ยืนยันอีเมล',emailUnverified:'ยังไม่ได้ยืนยันอีเมล',emailVerified:'ยืนยันอีเมลแล้ว',sendVerify:'ส่งลิงก์ยืนยันอีเมล',forgotPassword:'ลืมรหัสผ่าน?',resetPassword:'ตั้งรหัสผ่านใหม่',sendReset:'ส่งลิงก์ตั้งรหัสผ่าน',backToLogin:'กลับไปเข้าสู่ระบบ',emailCheck:'ตรวจอีเมล หรือดูหน้าต่างเซิร์ฟเวอร์',resetReady:'เปลี่ยนรหัสผ่านสำเร็จ',changeName:'แก้ชื่อที่แสดง',saveName:'บันทึกชื่อ',profileUpdated:'อัปเดตโปรไฟล์แล้ว',sendLink:'ส่งลิงก์',filters:'ตัวกรอง'
});

const t=k=>I18N[state.lang]?.[k]||k;
const name=p=>state.lang==='th'?(p.th||p.en):p.en;
const loc=p=>state.lang==='th'?(p.locTh||p.locEn):p.locEn;
const story=p=>state.lang==='th'?(p.storyTh||p.storyEn):p.storyEn;
const photo=p=>typeof p==='string' && p.startsWith('/uploads/')?p:`assets/${p||'hero-forest.webp'}`;

function store(){
 try{localStorage.setItem(KEY,JSON.stringify({lang:state.lang,saved:state.account?guestSaved:state.saved,trip:state.account?guestTrip:state.trip,notes:state.notes,suggestions:state.suggestions}))}catch{}
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
 state.saved=collections.saved;state.trip=collections.trip;state.myReviews=reviews.reviews;
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
    const [placesRes,spotRes,campRes,safetyRes]=await Promise.allSettled([
      userApi('/api/places'),
      userApi('/api/places/spotlight'),
      userApi('/api/campaigns'),
      userApi('/api/safety/reports?verified=1')
    ]);
    if(placesRes.status==='fulfilled'&&Array.isArray(placesRes.value.places)&&placesRes.value.places.length){
      const realPlaces=placesRes.value.places.map(p=>({
        id:p.id,en:p.en,th:p.th||p.en,locEn:p.locEn,locTh:p.locTh||p.locEn,
        category:p.category,region:p.region,lat:p.lat,lon:p.lon,
        visit:p.visit||'1-2h',priceFrom:p.priceFrom,currency:p.currency||'THB',
        storyEn:p.storyEn||'',storyTh:p.storyTh||'',photo:p.photo||'assets/hero-forest.webp',
        gallery:p.gallery||[],isSme:Boolean(p.isSme),smeType:p.smeType||'',
        smeBadge:p.spotlightBadge||(p.isSme?'Local SME Spotlight':''),
        featured:Boolean(p.featured),openHours:'เปิดบริการตามปกติ',isOpen:true,
        phone:p.contactPhone||'',specialtiesTh:p.localStoryTh?[p.localStoryTh.slice(0,30)]:undefined
      }));
      const ids=new Set(realPlaces.map(x=>x.id));
      PLACES=[...realPlaces,...SAMPLE_PLACES.filter(s=>!ids.has(s.id))];
      LIVE_DATA=true;API_ONLINE=true;
    }
    if(spotRes.status==='fulfilled'&&Array.isArray(spotRes.value.places)){
      state.spotlightPlaces=spotRes.value.places;
    }
    if(campRes.status==='fulfilled'&&Array.isArray(campRes.value.campaigns)){
      state.campaigns=campRes.value.campaigns;
    }
    if(safetyRes.status==='fulfilled'&&Array.isArray(safetyRes.value.reports)){
      state.safetyReports=safetyRes.value.reports;
    }
    render({keepScroll:true});
  }catch(e){console.info('initRealData fallback:',e.message)}
}

let persistOrder=Promise.resolve();
function persistCollections(){
 if(!state.account||!LIVE_DATA){store();return}
 const payload={saved:[...state.saved],trip:[...state.trip]};
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
 return `<button class="brand" data-action="navigate" data-page="welcome" aria-label="Traval - ${html(t('homeLink'))}">
  <span class="brand-mark" style="color:var(--traval-lime, #8DE026)">T<span class="brand-dot" style="color:var(--traval-sme-gold, #E5A836)">.</span></span>
  <span class="brand-full" style="font-family:var(--font-base)">Traval</span>
 </button>`;
}

function header(){
 return `<header class="site-header">
  ${brand()}
  <nav class="header-links" aria-label="Primary">
    ${[['discover','discover'],['map','map'],['saved','saved'],['trip','trip']].map(([page,label])=>`
      <button data-action="navigate" data-page="${page}" class="${state.page===page?'selected':''}">
        ${html(t(label))}
        ${page==='saved'&&state.saved.length?`<span class="badge-counter" style="background:#8DE026;color:#0D2C1C;font-size:10px;padding:1px 6px;border-radius:99px;margin-left:4px;font-weight:700;">${state.saved.length}</span>`:''}
      </button>
    `).join('')}
  </nav>
  <div class="head-actions" style="display:flex;align-items:center;gap:6px;">
    <button class="header-icon" data-action="open-ai" title="AI Travel Advisor" style="font-size:12px;font-weight:800;color:#0D2C1C;background:#8DE026;padding:6px 12px;border-radius:99px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">✨ AI Plan</button>
    <button class="header-icon" data-action="open-safety" title="Travel Safety" style="font-size:14px;background:none;border:none;cursor:pointer;padding:6px;">🛡️</button>
    <button class="language-btn" data-action="language" aria-label="Change language">${state.lang==='en'?'TH':'EN'}</button>
    ${actionBtn('search-open',ico('search',20),'header-icon','aria-label="Search"')}
    ${actionBtn('menu-open',ico('menu',23),'header-icon menu-trigger','aria-label="Open menu"')}
  </div>
 </header>`;
}

function bottomNav(){
 return `<nav class="bottom-nav" aria-label="App navigation" style="display:flex;">
  ${[['discover','home'],['map','compass'],['saved','heart'],['profile','user']].map(([page,glyph])=>`
    <button data-action="navigate" data-page="${page}" class="${state.page===page||(page==='saved'&&state.page==='trip')?'selected':''}" aria-label="${html(t(page))}" ${state.page===page?'aria-current="page"':''}>
      ${ico(glyph,23)}
      <span class="nav-tooltip">
        ${html(t(page))}
        ${page==='saved'&&state.saved.length?` (${state.saved.length})`:''}
      </span>
    </button>
  `).join('')}
 </nav>`;
}

function landing(){
 return `<div class="landing" id="landing">
  <div class="landing-image"><img src="${photo('hero-forest.webp')}" alt="Scenic mountain valley"/></div>
  <div class="landing-shade"></div>
  <div class="landing-header">
    ${brand()}
    <div class="landing-header-right">
      <button class="landing-language" data-action="language">${state.lang==='en'?'TH':'EN'}</button>
      ${actionBtn('menu-open',ico('menu',23),'landing-menu','aria-label="Menu"')}
    </div>
  </div>
  <div class="landing-copy">
    <p class="mini-overline" style="color:#8DE026;font-weight:800;">${html(t('homeEyebrow'))}</p>
    <h1>${html(t('homeTitle')).replace('\n','<br>')}</h1>
    <p class="landing-subline">${html(t('homeDesc'))}</p>
    <button data-action="navigate" data-page="discover" class="landing-cta" style="background:#0D2C1C;">
      <span>${html(t('homeExplore'))}</span>${ico('arrow',20)}
    </button>
  </div>
  <div class="landing-bottom">
    <span>01 / 03</span><div class="landing-line"><i style="background:#8DE026"></i></div>
    <span>${html(t('homeHint'))}</span>
  </div>
  <button class="mobile-landing-go" data-action="navigate" data-page="discover">${html(t('enter'))}${ico('arrow',23)}</button>
 </div>`;
}

function categoryButtons(){
 return `<div class="category-list" role="group" aria-label="Category">
  ${CATEGORIES.map(cat=>`
    <button class="category-pill ${state.category===cat?'active':''} ${cat==='sme'?'category-sme-pill':''}" data-action="category" data-category="${cat}" aria-pressed="${state.category===cat}" style="${cat==='sme'&&state.category!=='sme'?'border:1px solid #F59E0B;color:#925C08;background:#FEF8EC;':''}">
      ${ico(({all:'spark',sme:'star',nature:'tree',food:'coffee',stay:'bed',culture:'camera'})[cat],16)}
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
   if(!q) return true;
   return [p.en,p.th,p.locEn,p.locTh,p.storyEn,p.storyTh,p.provinceTh,p.provinceEn].filter(Boolean).join(' ').toLowerCase().includes(q);
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
 return `<article class="place-card ${compact?'compact':''}" data-place="${p.id}">
  <div class="place-picture">
    <img src="${photo(p.photo)}" alt="${html(name(p))}" loading="lazy"/>
    <span class="card-gradient"></span>
    <button class="place-card-link" data-action="place" data-id="${p.id}" aria-label="${html(t('view'))}: ${html(name(p))}"></button>
    ${p.isSme?`<span style="position:absolute;top:14px;left:14px;z-index:2;background:#FEF8EC;color:#925C08;border:1px solid #F59E0B;font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;">★ Local SME</span>`:''}
    ${heartButton(p)}
    <span class="card-caption">
      <b>${html(name(p))}</b>
      <small>${html(loc(p))}${dist!=null?` · 📍 ${html(String(dist))} ${html(t('distKm'))}`:''}${p.rating?` · ★ ${p.rating}`:''}</small>
    </span>
  </div>
 </article>`;
}

function smeSpotlightCard(p){
 const dist = state.nearbyPoint && p.lat && p.lon ? calcDistance(state.nearbyPoint.lat, state.nearbyPoint.lon, p.lat, p.lon) : null;
 return `<div class="sme-spotlight-card" style="flex:0 0 300px;background:#FFF;border-radius:18px;border:1px solid #E6E8E2;overflow:hidden;box-shadow:0 4px 16px rgba(13,44,28,0.06);display:flex;flex-direction:column;">
  <div style="position:relative;height:160px;overflow:hidden;background:#CBD5E1;">
    <img src="${photo(p.photo)}" alt="${html(name(p))}" style="width:100%;height:100%;object-fit:cover;"/>
    <span style="position:absolute;top:10px;left:10px;background:rgba(13,44,28,0.88);color:#8DE026;font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;">
      ★ ${html(p.smeBadge||'Local SME Spotlight')}
    </span>
    ${heartButton(p,'mini-heart')}
  </div>
  <div style="padding:14px;display:flex;flex-direction:column;flex:1;">
    <h3 style="font-size:16px;font-weight:700;color:#0D2C1C;margin:0 0 4px 0;">${html(name(p))}</h3>
    <div style="font-size:11px;color:#78857B;margin-bottom:8px;">📍 ${html(loc(p))}${dist?` · <strong>${dist} กม.</strong>`:''}</div>
    <div style="background:#F8F7F3;border-left:3px solid #E5A836;padding:8px 10px;font-size:11px;line-height:1.5;color:#455248;margin-bottom:12px;font-style:italic;">
      "${html(story(p))}"
    </div>
    <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #EEEEEC;padding-top:10px;">
      <span style="font-size:11px;color:#78857B;">เริ่มต้น <strong>฿${p.priceFrom?p.priceFrom.toLocaleString():'0'}</strong></span>
      <button data-action="place" data-id="${p.id}" style="background:#0D2C1C;color:#FFF;padding:6px 14px;border-radius:99px;font-size:11px;font-weight:600;">
        ${html(t('view'))} →
      </button>
    </div>
  </div>
 </div>`;
}

function nearbyControls(){
 const radii = [0.3, 0.5, 1, 3, 5, 25, 100];
 return `<div class="around-me-panel" style="background:#FFF;border:1px solid #E6E8E2;border-radius:18px;padding:12px 16px;margin:0 0 20px 0;box-shadow:0 2px 10px rgba(0,0,0,0.03);">
  <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <button type="button" class="nearby-toggle ${state.nearbyActive?'on':''}" data-action="${state.nearbyActive?'nearby-stop':'nearby-start'}" ${state.nearbyBusy?'disabled':''} style="border-radius:99px;padding:8px 16px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${state.nearbyActive?'#8DE026':'#2563EB'};display:inline-block;"></span>
        ${html(t(state.nearbyBusy?'locating':state.nearbyActive?'stopNear':'nearMe'))}
      </button>

      <!-- Radius selection chips -->
      <div style="display:flex;gap:4px;overflow-x:auto;">
        ${radii.map(r=>`
          <button type="button" data-action="set-radius" data-radius="${r}" style="font-size:11px;font-weight:600;padding:5px 10px;border-radius:99px;border:1px solid ${state.nearbyRadius===r?'#0D2C1C':'#E6E8E2'};background:${state.nearbyRadius===r?'#0D2C1C':'#F8F7F3'};color:${state.nearbyRadius===r?'#FFF':'#56685B'};">
            ${r < 1 ? (r * 1000) + ' ม.' : r + ' กม.'}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Local Only toggle -->
    <label style="display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#925C08;background:#FEF8EC;padding:6px 12px;border-radius:99px;border:1px solid #F59E0B;cursor:pointer;">
      <input type="checkbox" id="check-local-only" ${state.localOnly?'checked':''} style="accent-color:#E5A836;cursor:pointer;"/>
      <span>${html(t('localOnly'))}</span>
    </label>
  </div>
 </div>`;
}

let nearbySeq=0;
async function fetchNearby(){
 if(!state.nearbyPoint) return;
 const current=++nearbySeq;state.nearbyBusy=true;render({keepScroll:true});
 if(LIVE_DATA){
   const q=new URLSearchParams({lat:state.nearbyPoint.lat,lon:state.nearbyPoint.lon,radiusKm:state.nearbyRadius,category:state.category,currency:state.nearbyCurrency});
   if(state.nearbyMaxPrice!=='')q.set('maxPrice',state.nearbyMaxPrice);
   try{
     const result=await userApi('/api/places/nearby?'+q.toString());
     if(current!==nearbySeq)return;
     state.nearbyList=result.places;
   }catch(e){toast(e.message)}
 } else {
   state.nearbyList = PLACES.map(p=>({
     ...p,
     distanceKm: calcDistance(state.nearbyPoint.lat, state.nearbyPoint.lon, p.lat, p.lon)
   })).filter(p=>p.distanceKm <= state.nearbyRadius).sort((a,b)=>a.distanceKm-b.distanceKm);
 }
 state.nearbyActive=true;
 state.mapSelected=state.nearbyList[0]?.id||'';
 state.nearbyBusy=false;
 render({keepScroll:true});
}

function startNearby(){
 if(!navigator.geolocation){toast(t('locationDenied'));return}
 state.nearbyBusy=true;render({keepScroll:true});
 navigator.geolocation.getCurrentPosition(pos=>{
   state.nearbyPoint={lat:pos.coords.latitude,lon:pos.coords.longitude};
   state.mapCenter={...state.nearbyPoint,z:state.nearbyRadius<=1?14:state.nearbyRadius<=5?12:10};
   fetchNearby();
 },()=>{
   state.nearbyBusy=false;toast(t('locationDenied'));render({keepScroll:true});
 },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}

function discover(){
 const found=filteredPlaces();
 const top=found.slice(0,state.showAll||state.category!=='all'||state.query||state.nearbyActive?found.length:6);
 const smePlaces=PLACES.filter(p=>p.isSme);

 return `<div class="app-shell explore-page">
  ${header()}
  <main class="content-area">
    <div class="explore-heading">
      <div>
        <p class="mini-overline" style="color:var(--traval-lime-deep, #66B212);">${html(t('exploreEyebrow'))}</p>
        <h1>${html(t('exploreTitle')).replace('\n','<br>')}</h1>
      </div>
      <button data-action="search-open" class="vertical-search" aria-label="${html(t('searchShort'))}">${ico('search',25)}</button>
      <p class="explore-quiet">${html(t('exploreIntro'))}</p>
    </div>

    ${categoryButtons()}
    ${nearbyControls()}

    ${state.campaigns && state.campaigns.length ? `
      <div style="margin-bottom:24px;border-radius:18px;overflow:hidden;position:relative;background:linear-gradient(90deg,#0D2C1C,#1E4E35);color:#FFF;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:0 4px 18px rgba(0,0,0,0.08);">
        <div>
          ${state.campaigns[0].badgeText?`<span style="background:#8DE026;color:#0D2C1C;font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px;text-transform:uppercase;">★ ${html(state.campaigns[0].badgeText)}</span>`:''}
          <h3 style="margin:6px 0 2px 0;font-size:16px;color:#FFF;">${html(state.campaigns[0].title)}</h3>
          <p style="margin:0;font-size:11px;color:#CDE3D3;">แคมเปญโปรโมตเพื่อสนับสนุนร้านค้าชุมชนและวิถีท้องถิ่น</p>
        </div>
        ${state.campaigns[0].targetSlug?`
          <button data-action="place" data-id="${html(state.campaigns[0].targetSlug)}" style="background:#FFF;color:#0D2C1C;border:none;border-radius:99px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">
            ดูรายละเอียด ↗
          </button>
        `:''}
      </div>
    `:''}

    <section style="background:linear-gradient(135deg, #0D2C1C 0%, #16422C 100%);color:#FFF;border-radius:20px;padding:20px 24px;margin-bottom:28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 8px 24px rgba(13,44,28,0.14);">
      <div style="flex:1;min-width:240px;">
        <span style="color:#8DE026;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">✨ AI TRAVEL ADVISOR</span>
        <h3 style="margin:4px 0 6px 0;font-size:17px;font-weight:700;">วางแผนเที่ยวอัตโนมัติด้วย AI พร้อมแนะนำร้านชุมชน</h3>
        <p style="margin:0;font-size:12px;color:#CDE3D3;line-height:1.4;">ประเมินงบประมาณ แนะนำร้าน SME แวะรายทาง และค้นหาเส้นทางเดิน 10 นาที</p>
      </div>
      <button type="button" data-action="open-ai" style="background:#8DE026;color:#0D2C1C;border:none;border-radius:99px;padding:10px 22px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
        เปิด AI วางแผนทริป ↗
      </button>
    </section>

    <!-- Local SME Spotlight Rail -->
    ${smePlaces.length && (!state.category || state.category==='all' || state.category==='sme') ? `
      <section style="margin-bottom:34px;">
        <div class="section-line">
          <h2><span style="color:#E5A836">★</span> ${html(t('spotlightTitle'))}</h2>
          <small style="color:#78857B;font-size:12px;">${html(t('spotlightSub'))}</small>
        </div>
        <div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;">
          ${smePlaces.map(smeSpotlightCard).join('')}
        </div>
      </section>
    `:''}

    <!-- Destinations Grid -->
    <section class="spotlight-section">
      <div class="section-line">
        <h2>${state.nearbyActive?html(t('nearActive')):state.query?html(t('searchResults')):html(t('popular'))}</h2>
        ${!state.nearbyActive&&!state.query?`
          <button data-action="show-all" class="quiet-link">${html(t(state.showAll?'more':'showAll'))} ${ico('arrow',16)}</button>
        `:''}
      </div>
      ${found.length?`
        <div class="featured-rail ${top.length<3?'few':''}">
          ${top.map(x=>placeCard(x)).join('')}
        </div>
      `:`
        <div class="empty-light">
          ${ico('search',27)}
          <h2>${html(t('nothing'))}</h2>
          <p>${html(t('different'))}</p>
        </div>
      `}
    </section>

    <!-- Editorial Callout -->
    <div class="editorial-band" style="background:#0D2C1C;color:#FFF;border-radius:22px;padding:36px;margin-top:40px;">
      <div>
        <span class="mini-overline" style="color:#8DE026;">LOCAL FIRST COMMUNITY</span>
        <h2>${state.lang==='th'?'ค้นพบเสน่ห์ชุมชน\nร่วมส่งเสริมผู้ประกอบการท้องถิ่น':'Explore local heritage.\nSupport genuine community SMEs.'}</h2>
      </div>
      <button data-action="navigate" data-page="map" class="outline-light" style="border:1px solid #8DE026;color:#8DE026;background:none;border-radius:99px;padding:12px 24px;font-weight:700;">
        ${html(t('map'))} ${ico('arrow',19)}
      </button>
    </div>
  </main>
  ${bottomNav()}
 </div>`;
}

function bottomSheet(p){
 if(!p) return '';
 const saved = state.saved.includes(p.id);
 const isThai = state.lang === 'th';
 const title = html(name(p));
 const location = html(loc(p));
 const narrative = html(story(p));

 return `<div class="traval-bottom-sheet state-${state.bottomSheetState}" id="traval-active-sheet" style="position:fixed;left:0;right:0;bottom:0;z-index:90;background:#FFF;border-radius:24px 24px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,0.18);transition:transform 0.3s cubic-bezier(0.25,1,0.5,1);max-width:680px;margin:0 auto;display:${state.bottomSheetState==='closed'?'none':'flex'};flex-direction:column;height:${state.bottomSheetState==='peek'?'200px':state.bottomSheetState==='half'?'55vh':'90vh'};">
  <!-- Touch handle -->
  <div style="padding:10px 0;display:grid;place-items:center;cursor:pointer;" data-action="toggle-sheet">
    <div style="width:40px;height:5px;border-radius:99px;background:#CBD5E1;"></div>
  </div>

  <div style="flex:1;overflow-y:auto;padding:0 20px 30px;">
    <div style="display:flex;gap:12px;margin-bottom:14px;">
      <img src="${photo(p.photo)}" alt="${title}" style="width:84px;height:84px;border-radius:14px;object-fit:cover;flex-shrink:0;"/>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
          ${p.isSme?`<span style="background:#FEF8EC;color:#925C08;border:1px solid #F59E0B;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;">★ Local SME</span>`:''}
          <span style="font-size:11px;font-weight:600;color:${p.isOpen?'#15803D':'#B91C1C'}">● ${p.isOpen?t('openNow'):t('closedNow')}</span>
        </div>
        <h3 style="margin:0 0 2px 0;font-size:18px;font-weight:700;color:#0D2C1C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</h3>
        <small style="color:#78857B;font-size:11px;">📍 ${location}</small>
      </div>
    </div>

    <!-- Quick Actions -->
    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <button data-action="directions" data-id="${p.id}" style="flex:1;background:#8DE026;color:#0D2C1C;font-weight:700;padding:10px;border-radius:99px;border:0;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
        ${ico('route',17)} <span>${html(t('route'))}</span>
      </button>
      <button data-action="save" data-id="${p.id}" class="heart-button ${saved?'on':''}" style="width:40px;height:40px;border-radius:50%;border:1px solid #E6E8E2;display:grid;place-items:center;">
        ${ico('heart',18)}
      </button>
      <button data-action="share-place" data-id="${p.id}" style="width:40px;height:40px;border-radius:50%;border:1px solid #E6E8E2;background:#FFF;display:grid;place-items:center;">
        ${ico('share',18)}
      </button>
      ${p.phone?`
        <a href="tel:${p.phone}" style="width:40px;height:40px;border-radius:50%;border:1px solid #E6E8E2;background:#FFF;display:grid;place-items:center;color:#0D2C1C;text-decoration:none;">
          ${ico('phone',18)}
        </a>
      `:''}
      <button data-action="close-sheet" style="width:40px;height:40px;border-radius:50%;border:1px solid #E6E8E2;background:#FFF;display:grid;place-items:center;">
        ${ico('x',18)}
      </button>
    </div>

    ${narrative?`
      <div style="background:#F8F7F3;border-left:3px solid #E5A836;padding:10px 12px;border-radius:0 10px 10px 0;font-size:12px;line-height:1.6;margin-bottom:12px;">
        <strong style="color:#0D2C1C;display:block;margin-bottom:2px;">📖 ${html(t('localStory'))}:</strong>
        "${narrative}"
      </div>
    `:''}

    ${p.specialtiesTh && p.specialtiesTh.length?`
      <div style="margin-bottom:12px;">
        <span style="font-size:11px;font-weight:700;color:#0D2C1C;display:block;margin-bottom:6px;">✨ ${html(t('specialties'))}:</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(isThai?p.specialtiesTh:p.specialtiesEn||p.specialtiesTh).map(item=>`
            <span style="background:#F1F3ED;color:#0D2C1C;font-size:11px;padding:3px 9px;border-radius:99px;">${html(item)}</span>
          `).join('')}
        </div>
      </div>
    `:''}

    <div style="display:flex;justify-content:space-between;padding:10px 12px;background:#F8F7F3;border-radius:12px;font-size:12px;">
      <span>เวลาเปิด-ปิด: <strong>${p.openHours||'ทุกวัน'}</strong></span>
      <span>ราคา: <strong>${p.priceFrom?`฿${p.priceFrom.toLocaleString()}`:'ฟรี'}</strong></span>
    </div>
  </div>
 </div>`;
}

function detail(p){
 const saved=state.saved.includes(p.id);
 const planned=state.trip.includes(p.id);
 return `<div class="detail-page">
  ${header()}
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
      <div class="detail-overline">
        ${p.isSme?`<span style="background:#FEF8EC;color:#925C08;padding:3px 8px;border-radius:99px;font-weight:700;">★ Local SME Spotlight</span>`:''}
      </div>
      <div class="detail-title">
        <h2>${html(name(p))}</h2>
        <small>${ico('pin',15)} ${html(loc(p))}</small>
      </div>

      <!-- Action bar -->
      <div class="detail-main-actions" style="margin:20px 0;display:flex;gap:10px;">
        <button class="action-outline" data-action="directions" data-id="${p.id}">${ico('route',17)} ${html(t('route'))}</button>
        <button class="action-lime" data-action="trip-toggle" data-id="${p.id}">${html(t(planned?'removeTrip':'addTrip'))} ${ico(planned?'check':'arrow',19)}</button>
        <button class="action-outline" data-action="share-place" data-id="${p.id}">${ico('share',17)} ${html(t('share'))}</button>
        ${p.phone?`<a href="tel:${p.phone}" class="action-outline" style="text-decoration:none;">${ico('phone',17)} ${html(t('call'))}</a>`:''}
      </div>

      ${story(p)?`
        <section class="detail-about" style="background:#F8F7F3;padding:16px;border-radius:16px;border-left:4px solid #E5A836;margin:18px 0;">
          <h3 style="margin:0 0 6px 0;font-size:16px;color:#0D2C1C;">📖 ${html(t('localStory'))}</h3>
          <p style="margin:0;font-style:italic;">"${html(story(p))}"</p>
        </section>
      `:''}

      ${p.specialtiesTh?`
        <div style="margin:16px 0;">
          <strong style="display:block;margin-bottom:8px;font-size:13px;color:#0D2C1C;">✨ ${html(t('specialties'))}</strong>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${p.specialtiesTh.map(x=>`<span style="background:#EBF3EB;padding:4px 10px;border-radius:99px;font-size:12px;color:#16422C;">${html(x)}</span>`).join('')}
          </div>
        </div>
      `:''}

      <section class="detail-gallery">
        <div class="detail-gallery-head"><h3>${html(t('gallery'))}</h3></div>
        <div class="gallery-track">
          ${(p.gallery||[p.photo]).map(img=>`<img src="${photo(img)}" alt="Gallery photo" loading="lazy"/>`).join('')}
        </div>
      </section>
    </div>
  </main>
  ${bottomNav()}
 </div>`;
}

function mapPage(){
 const places=(state.nearbyActive?filteredPlaces():PLACES.filter(p=>state.region==='all'||p.region===state.region));
 const pick=places.find(p=>p.id===state.mapSelected)||places[0];

 return `<div class="app-shell map-page">
  ${header()}
  <main class="map-wrap">
    <div class="map-toolbar">
      <div>
        <span class="mini-overline" style="color:#66B212;">TRAVAL / EXPLORE MAP</span>
        <h1>${html(t('map'))}</h1>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <label class="map-region-label">
          ${html(t('mapArea'))}
          <select id="map-region">
            <option value="all" ${state.region==='all'?'selected':''}>${html(t('allRegions'))}</option>
            ${Object.entries({north:"North Thailand",central:"Bangkok & Central",south:"South Thailand",northeast:"Northeast Thailand",east:"East Thailand",west:"West Thailand"}).map(([key,label])=>`<option value="${key}" ${state.region===key?'selected':''}>${html(label)}</option>`).join('')}
          </select>
        </label>
      </div>
    </div>

    ${nearbyControls()}

    <div class="map-layout">
      <div class="map-frame" id="map-frame-box" style="position:relative;cursor:grab;">
        <div class="map-paper">
          <div class="tile-layer" id="tile-layer"></div>
          <div class="pin-layer" id="pin-layer"></div>
        </div>

        <!-- Floating Search This Area button -->
        <button id="btn-search-area" data-action="search-area" style="position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:25;background:#FFF;color:#0D2C1C;border:1px solid #E6E8E2;border-radius:99px;padding:8px 18px;font-size:12px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.12);display:${state.mapPannedAway?'inline-flex':'none'};align-items:center;gap:6px;">
          ${ico('search',15)} ${html(t('searchThisArea'))}
        </button>

        <div class="map-place-counter" style="display:flex;align-items:center;gap:6px;">
          ${ico('pin',16)}
          <span>${places.length} ${html(state.lang==='th'?'สถานที่':'places')}</span>
          ${state.localOnly?`<span style="background:#FEF8EC;color:#925C08;padding:1px 6px;border-radius:99px;font-size:10px;">Local SME</span>`:''}
        </div>

        <!-- Controls: My Location & Follow Me & Zoom -->
        <div class="map-controls">
          <button data-action="my-location" title="${html(t('myLocation'))}" style="background:#FFF;color:#2563EB;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </button>
          <button data-action="toggle-follow" class="${state.followMe?'active':''}" title="${html(t('followMe'))}" style="background:${state.followMe?'#0D2C1C':'#FFF'};color:${state.followMe?'#8DE026':'#0D2C1C'};">
            ${ico('locate',18)}
          </button>
          <button data-action="map-zoom" data-step="1" aria-label="${html(t('mapZoomIn'))}">${ico('plus',18)}</button>
          <button data-action="map-zoom" data-step="-1" aria-label="${html(t('mapZoomOut'))}">${ico('minus',18)}</button>
        </div>

        <span class="map-copyright">© OpenStreetMap contributors · Traval</span>
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

 if(!isTrip && state.collectionFilter==='sme'){
   items = items.filter(p=>p.isSme);
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
  <main class="collection-content">
    <div class="collection-intro">
      <span class="mini-overline" style="color:#8DE026;">TRAVAL / YOUR SPACE</span>
      <h1>${html(t('myCollections'))}<span class="tiny-accent" style="color:#8DE026;">.</span></h1>
      <p>${html(t('collections'))}</p>
    </div>

    <div class="collection-bar">
      <button data-action="navigate" data-page="saved" class="${!isTrip?'active':''}">
        ${html(t('allSaved'))} <small style="color:#8DE026;">${state.saved.length}</small>
      </button>
      <button data-action="navigate" data-page="trip" class="${isTrip?'active':''}">
        ${html(t('planTrip'))} <small style="color:#8DE026;">${state.trip.length}</small>
      </button>
    </div>

    ${!isTrip ? `
      <!-- Filter chips: SME & Provinces -->
      <div class="traval-chips-container" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:18px;">
        <button class="traval-chip ${state.collectionFilter==='all'?'active':''}" data-action="collection-filter" data-filter="all">
          ${html(t('allSaved'))} (${state.saved.length})
        </button>
        <button class="traval-chip chip-sme ${state.collectionFilter==='sme'?'active':''}" data-action="collection-filter" data-filter="sme">
          ★ ${html(t('sme'))}
        </button>
        ${Array.from(provinces.entries()).map(([key,lbl])=>`
          <button class="traval-chip ${state.collectionFilter===key?'active':''}" data-action="collection-filter" data-filter="${key}">
            📍 ${html(lbl)}
          </button>
        `).join('')}
      </div>
    `:''}

    ${items.length?`
      <div class="collection-grid">
        ${items.map((p,i)=>`
          <div class="collection-item">
            <button class="collection-photo" data-action="place" data-id="${p.id}">
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
        `).join('')}
      </div>
    `:`
      <div class="collection-empty">
        ${ico(isTrip?'map':'heart',34)}
        <h2>${html(t(isTrip?'emptyTrip':'emptySaved'))}</h2>
        <button data-action="navigate" data-page="discover" class="action-lime">${html(t('homeExplore'))} ${ico('arrow',18)}</button>
      </div>
    `}
  </main>
  ${bottomNav()}
 </div>`;
}

function profile(){
 return `<div class="app-shell profile-page">
  ${header()}
  <main class="profile-wrap">
    <div class="profile-header">
      <span class="mini-overline">TRAVAL / ACCOUNT</span>
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
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;">
            <button class="account-signout" type="button" data-action="auth-logout">${html(t('signOut'))} ${ico('arrow',17)}</button>
            <button class="account-signout" type="button" data-action="auth-logout-all" style="color:#b83232;" title="${state.lang==='th'?'ออกจากระบบจากทุกอุปกรณ์ที่เคยล็อกอินไว้':'Sign out from all logged in devices'}">${state.lang==='th'?'ออกจากระบบทุกเครื่อง':'Sign out all devices'} ${ico('arrow',17)}</button>
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
            <label>${html(t('password'))} ${state.authMode==='register'?`<span style="font-weight:normal;color:#718096;font-size:11px;">(${state.lang==='th'?'ขั้นต่ำ 8 ตัวอักษร':'min 8 chars'})</span>`:''}<input name="password" type="password" minlength="${state.authMode==='register'?'8':''}" required/></label>
            <button class="action-lime" type="submit">${html(t(state.authMode==='register'?'createAccount':'signIn'))}</button>
          </form>
          <div style="display:flex;align-items:center;gap:10px;margin:18px 0 12px 0;">
            <div style="flex:1;height:1px;background:#e2e8f0;"></div>
            <span style="font-size:11px;color:#718096;">${state.lang==='th'?'หรือเข้าสู่ระบบด้วย':'or continue with'}</span>
            <div style="flex:1;height:1px;background:#e2e8f0;"></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" data-action="quick-social" data-provider="google" style="flex:1;min-width:90px;background:#fff;border:1px solid #cbd5e0;border-radius:12px;padding:9px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span style="color:#4285F4;font-weight:800;">G</span> Google
            </button>
            <button type="button" data-action="quick-social" data-provider="facebook" style="flex:1;min-width:90px;background:#fff;border:1px solid #cbd5e0;border-radius:12px;padding:9px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span style="color:#1877F2;font-weight:800;">f</span> Facebook
            </button>
            <button type="button" data-action="quick-phone" style="flex:1;min-width:90px;background:#fff;border:1px solid #cbd5e0;border-radius:12px;padding:9px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span>📱</span> ${state.lang==='th'?'เบอร์โทร':'Phone'}
            </button>
          </div>
        `}
      </section>
      ${state.account?`
        <section class="profile-card" style="border:1px solid #FED7D7;background:#FFF5F5;border-radius:18px;padding:20px;margin-top:20px;">
          <h2 style="color:#C53030;font-size:16px;margin:0 0 8px 0;">ความเป็นส่วนตัวและสิทธิ์ PDPA</h2>
          <p style="font-size:12px;color:#742A2A;line-height:1.5;margin:0 0 14px 0;">คุณมีสิทธิ์ขอลบข้อมูลส่วนบุคคล รหัสผ่าน และบัญชีของคุณออกจากระบบอย่างถาวร (Right to Erasure) ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล</p>
          <button type="button" data-action="delete-account" style="background:#E53E3E;color:#FFF;border:none;border-radius:99px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;">ขอลบข้อมูลบัญชีถาวร (Delete Account) ↗</button>
        </section>
      `:''}
      <section class="profile-card">
        <h2>${html(t('language'))}</h2>
        <div class="language-switch">
          <button class="${state.lang==='en'?'active':''}" data-action="set-language" data-lang="en">English</button>
          <button class="${state.lang==='th'?'active':''}" data-action="set-language" data-lang="th">ไทย</button>
        </div>
      </section>
    </div>
  </main>
  ${bottomNav()}
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

function aiModal(){
  const f = state.aiForm;
  return `<div class="search-overlay" role="dialog" aria-modal="true" aria-label="AI Travel Advisor" style="display:flex;align-items:center;justify-content:center;padding:20px;">
    <div class="search-backdrop" data-action="close-ai"></div>
    <div style="position:relative;z-index:100;background:#FFF;border-radius:24px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.3);border:1px solid #E6E8E2;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid #EEE;padding-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="background:#0D2C1C;color:#8DE026;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:18px;">✨</span>
          <div>
            <h2 style="margin:0;font-size:18px;color:#0D2C1C;">AI Travel Advisor</h2>
            <small style="color:#78857B;">วางแผนเที่ยวและคัดเลือกร้านชุมชน SME อัตโนมัติ</small>
          </div>
        </div>
        <button type="button" data-action="close-ai" style="background:#F4F5F1;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;display:grid;place-items:center;">${ico('x',18)}</button>
      </div>

      ${state.aiLoading ? `
        <div style="padding:60px 20px;text-align:center;">
          <div style="width:40px;height:40px;border:4px solid #E6E8E2;border-top-color:#8DE026;border-radius:50%;animation:pulseAccuracy 1.2s infinite ease-in-out;margin:0 auto 20px;"></div>
          <h3 style="margin:0 0 8px;color:#0D2C1C;">AI กำลังประมวลผลเส้นทาง...</h3>
          <p style="color:#78857B;font-size:13px;margin:0;">กำลังคัดเลือกร้านค้า SME ชุมชน คำนวณงบประมาณ และจัดตารางเวลา</p>
        </div>
      ` : state.aiResult ? `
        <div>
          <div style="background:#F4F8F1;border:1px solid #D1E7C4;border-radius:16px;padding:16px 20px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
              <strong style="color:#183E2D;font-size:16px;">${html(state.aiResult.destination||'Thailand')} (${state.aiResult.days||1} วัน)</strong>
              <span style="background:#8DE026;color:#0D2C1C;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;">งบประมาณรวม ฿${(state.aiResult.budgetEstimate?.totalEstimatedCost||0).toLocaleString()}</span>
            </div>
            <p style="margin:0;font-size:12px;color:#455248;line-height:1.5;">${html(state.aiResult.summary||'')}</p>
          </div>

          ${state.aiResult.budgetEstimate ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:8px;margin-bottom:20px;">
              <div style="background:#F8F7F3;padding:10px;border-radius:10px;text-align:center;"><small style="color:#78857B;display:block;font-size:10px;">ที่พัก (Stays)</small><strong style="font-size:13px;color:#0D2C1C;">฿${(state.aiResult.budgetEstimate.breakdown?.accommodations||0).toLocaleString()}</strong></div>
              <div style="background:#F8F7F3;padding:10px;border-radius:10px;text-align:center;"><small style="color:#78857B;display:block;font-size:10px;">อาหาร & SME</small><strong style="font-size:13px;color:#0D2C1C;">฿${(state.aiResult.budgetEstimate.breakdown?.foodAndDining||0).toLocaleString()}</strong></div>
              <div style="background:#F8F7F3;padding:10px;border-radius:10px;text-align:center;"><small style="color:#78857B;display:block;font-size:10px;">เดินทาง (Transport)</small><strong style="font-size:13px;color:#0D2C1C;">฿${(state.aiResult.budgetEstimate.breakdown?.transportation||0).toLocaleString()}</strong></div>
              <div style="background:#F8F7F3;padding:10px;border-radius:10px;text-align:center;"><small style="color:#78857B;display:block;font-size:10px;">สำรองฉุกเฉิน</small><strong style="font-size:13px;color:#0D2C1C;">฿${(state.aiResult.budgetEstimate.breakdown?.emergencyCushion||0).toLocaleString()}</strong></div>
            </div>
          ` : ''}

          <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
            ${(state.aiResult.itinerary||[]).map(day=>`
              <div style="border:1px solid #E6E8E2;border-radius:14px;padding:16px;">
                <h4 style="margin:0 0 10px;color:#0D2C1C;font-size:14px;display:flex;justify-content:space-between;">
                  <span>Day ${day.day} · ${html(day.theme||'')}</span>
                  <small style="color:#78857B;font-weight:normal;">${day.schedule?.length||0} จุดแวะ</small>
                </h4>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${(day.schedule||[]).map(s=>`
                    <div style="display:flex;align-items:center;gap:12px;background:#FAFAF8;padding:8px 12px;border-radius:8px;">
                      <span style="font-size:11px;font-weight:700;color:#2563EB;min-width:70px;">${html(s.time||'')}</span>
                      <div style="flex:1;min-width:0;">
                        <strong style="font-size:12px;color:#0D2C1C;">${html(s.place?.nameEn||s.title||'')}</strong>
                        ${s.place?.isSme ? `<span style="background:#FEF8EC;color:#925C08;border:1px solid #F59E0B;font-size:9px;font-weight:700;padding:1px 6px;border-radius:99px;margin-left:6px;">★ Local SME</span>` : ''}
                        <small style="display:block;color:#78857B;font-size:10px;">${html(s.activity||s.place?.locationEn||'')}</small>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button type="button" data-action="reset-ai" style="background:#F4F5F1;border:none;border-radius:99px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;">ปรับเงื่อนไขใหม่</button>
            <button type="button" data-action="save-ai-plan" style="background:#0D2C1C;color:#8DE026;border:none;border-radius:99px;padding:10px 24px;font-size:12px;font-weight:800;cursor:pointer;">+ บันทึกเข้า My Trips</button>
          </div>
        </div>
      ` : `
        <form id="ai-advisor-form" style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:6px;">จังหวัด หรือ ย่านที่ต้องการไป *</label>
            <select name="province" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;">
              <option value="chiang-mai" ${f.province==='chiang-mai'?'selected':''}>เชียงใหม่ (Chiang Mai)</option>
              <option value="bangkok" ${f.province==='bangkok'?'selected':''}>กรุงเทพฯ (Bangkok)</option>
              <option value="nan" ${f.province==='nan'?'selected':''}>น่าน (Nan)</option>
              <option value="surat-thani" ${f.province==='surat-thani'?'selected':''}>สุราษฎร์ธานี (Surat Thani)</option>
              <option value="phang-nga" ${f.province==='phang-nga'?'selected':''}>พังงา (Phang Nga)</option>
              <option value="mae-hong-son" ${f.province==='mae-hong-son'?'selected':''}>แม่ฮ่องสอน (Mae Hong Son)</option>
            </select>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:6px;">จำนวนวันเที่ยว (1-7 วัน)</label>
              <input type="number" name="days" value="${f.days||2}" min="1" max="7" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;box-sizing:border-box;"/>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:6px;">งบประมาณรวม (บาท)</label>
              <input type="number" name="budget" value="${f.budget||3500}" min="500" max="1000000" step="500" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;box-sizing:border-box;"/>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:6px;">สไตล์การท่องเที่ยว</label>
              <select name="style" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;">
                <option value="all">ผสมผสานทุกรูปแบบ</option>
                <option value="food">สายกิน & ของอร่อย</option>
                <option value="nature">ธรรมชาติ & พักผ่อน</option>
                <option value="culture">วัฒนธรรม & ชุมชน</option>
                <option value="cafe">คาเฟ่ & จุดถ่ายรูป</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:6px;">จังหวะการเดินทาง</label>
              <select name="pace" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;">
                <option value="normal">ปกติ (3-4 จุดต่อวัน)</option>
                <option value="relaxed">สบาย ๆ ชิลล์ๆ (1-2 จุดต่อวัน)</option>
                <option value="packed">เที่ยวแน่นเต็มวัน (5+ จุด)</option>
              </select>
            </div>
          </div>

          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#183E2D;background:#FEF8EC;padding:10px 14px;border-radius:10px;border:1px solid #F59E0B;cursor:pointer;">
            <input type="checkbox" name="quickWalk" id="ai-quick-walk" style="accent-color:#E5A836;"/>
            <span><strong>Quick Prompt:</strong> พาเดินเล่นรอบ ๆ ไม่เกิน 10 นาที (สำรวจรอบพิกัดปัจจุบัน)</span>
          </label>

          <button type="submit" style="background:#0D2C1C;color:#8DE026;border:none;border-radius:99px;padding:14px;font-size:14px;font-weight:800;cursor:pointer;margin-top:8px;">
            สร้างแผนการเดินทางด้วย AI ↗
          </button>
        </form>
      `}
    </div>
  </div>`;
}

function safetyModal(){
  const reports = state.safetyReports || [];
  return `<div class="search-overlay" role="dialog" aria-modal="true" aria-label="Travel Safety" style="display:flex;align-items:center;justify-content:center;padding:20px;">
    <div class="search-backdrop" data-action="close-safety"></div>
    <div style="position:relative;z-index:100;background:#FFF;border-radius:24px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.3);border:1px solid #E6E8E2;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid #EEE;padding-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="background:#FEF8EC;color:#C53030;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:18px;">🛡️</span>
          <div>
            <h2 style="margin:0;font-size:18px;color:#0D2C1C;">เตือนภัย & ความปลอดภัยนักท่องเที่ยว</h2>
            <small style="color:#78857B;">รายงานจุดเสี่ยง การโกงราคา และการคมนาคมที่ผ่านการตรวจสอบ</small>
          </div>
        </div>
        <button type="button" data-action="close-safety" style="background:#F4F5F1;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;display:grid;place-items:center;">${ico('x',18)}</button>
      </div>

      ${state.safetyFormOpen ? `
        <form id="safety-report-form" style="display:flex;flex-direction:column;gap:14px;">
          <h3 style="margin:0;font-size:16px;color:#0D2C1C;">+ รายงานเหตุการณ์ / แจ้งเตือนจุดเสี่ยง</h3>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:4px;">ประเภทเหตุการณ์ *</label>
            <select name="category" required style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;">
              <option value="overcharging">โกงราคา / เรียกค่าโดยสารแพงเกินจริง</option>
              <option value="transport">ปัญหาบริการขนส่งสาธารณะ / Taxi / รถสองแถว</option>
              <option value="scam">มิจฉาชีพ / หลอกลวงซื้อของหรือทัวร์</option>
              <option value="danger">จุดอันตราย / ทางเปลี่ยว</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:4px;">หัวข้อรายงาน *</label>
            <input name="title" required placeholder="เช่น Taxi ไม่กดมิเตอร์บริเวณหน้าตลาด..." style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;box-sizing:border-box;"/>
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:4px;">รายละเอียดเหตุการณ์ *</label>
            <textarea name="description" required rows="3" placeholder="ระบุสิ่งที่พบเจอ ข้อควรระวัง หรือคำแนะนำแก่นักท่องเที่ยวท่านอื่น" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;box-sizing:border-box;"></textarea>
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:4px;">สถานที่เกิดเหตุ *</label>
            <input name="locationName" required placeholder="เช่น ซอยสุขุมวิท 11, หน้าสถานีรถไฟเชียงใหม่" style="width:100%;padding:10px 14px;border:1px solid #CCD2C8;border-radius:10px;font-size:13px;box-sizing:border-box;"/>
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#0D2C1C;margin-bottom:4px;">ภาพถ่ายหลักฐาน (ไม่เกิน 10 MB)</label>
            <input type="file" id="safety-photo-input" accept="image/*" style="font-size:12px;"/>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button type="button" data-action="cancel-safety-form" style="background:#F4F5F1;border:none;border-radius:99px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;">ยกเลิก</button>
            <button type="submit" style="background:#C53030;color:#FFF;border:none;border-radius:99px;padding:10px 24px;font-size:12px;font-weight:800;cursor:pointer;">ส่งรายงาน ↗</button>
          </div>
        </form>
      ` : `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <strong style="color:#0D2C1C;font-size:14px;">รายการจุดเสี่ยงที่ได้รับการยืนยัน (${reports.length})</strong>
          <button type="button" data-action="open-safety-form" style="background:#0D2C1C;color:#8DE026;border:none;border-radius:99px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer;">+ แจ้งเหตุใหม่</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${reports.length ? reports.map(r=>`
            <div style="border:1px solid #E6E8E2;border-radius:14px;padding:14px;background:#FBFBF9;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;text-transform:uppercase;">⚠️ ${html(r.category)}</span>
                <span style="color:#15803D;font-size:10px;font-weight:700;">✓ Verified</span>
              </div>
              <strong style="display:block;font-size:14px;color:#0D2C1C;margin-bottom:4px;">${html(r.title)}</strong>
              <p style="margin:0 0 8px 0;font-size:12px;color:#4B5563;line-height:1.4;">${html(r.description)}</p>
              <div style="font-size:11px;color:#9CA3AF;">📍 ${html(r.locationName)} · ${new Date(r.createdAt).toLocaleDateString()}</div>
              ${r.photo ? `<div style="margin-top:8px;height:120px;border-radius:8px;overflow:hidden;"><img src="${html(r.photo)}" style="width:100%;height:100%;object-fit:cover;"/></div>` : ''}
            </div>
          `).join('') : `
            <div style="padding:40px 20px;text-align:center;color:#78857B;">
              <p>ยังไม่มีรายงานจุดเสี่ยงที่ได้รับการเผยแพร่</p>
              <button type="button" data-action="open-safety-form" style="background:#0D2C1C;color:#FFF;border:none;border-radius:99px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;margin-top:8px;">+ แจ้งเตือนคนแรก</button>
            </div>
          `}
        </div>
      `}
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
 return body+(state.menuOpen?overlayMenu():'')+(state.searchOpen?searchOverlay():'')+(state.aiModalOpen?aiModal():'')+(state.safetyModalOpen?safetyModal():'');
}

function render({keepScroll=false}={}){
 const sy=keepScroll?window.scrollY:0;
 document.documentElement.lang=state.lang;
 document.title=`Traval — ${state.page==='welcome'?'Travel & Local Discovery':t(state.page==='detail'?'titlePlace':state.page)}`;
 $('#app').innerHTML=appHtml();
 document.body.classList.toggle('has-modal',state.menuOpen||state.searchOpen||state.aiModalOpen||state.safetyModalOpen);
 if(state.page==='map') requestAnimationFrame(drawMap);
 if(keepScroll) requestAnimationFrame(()=>window.scrollTo({top:sy,behavior:'instant'}));
 else window.scrollTo({top:0,behavior:'instant'});
}

function navigate(page,updateHash=true){
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
 const dest=Number.isFinite(p.lat)&&Number.isFinite(p.lon)?`${p.lat},${p.lon}`:encodeURIComponent(p.en+', '+p.locEn);
 window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${state.travelMode}`,'_blank','noopener,noreferrer');
 userApi('/api/analytics/event','POST',{eventType:'direction',placeId:id}).catch(()=>{});
}

function sharePlace(id){
 const p=getPlace(id);if(!p)return;
 const shareData={
   title:name(p),
   text:`${name(p)} - ${loc(p)} | Traval`,
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
 const region=state.region==='all'?'north':state.region;
 const rawList=(state.nearbyActive?filteredPlaces():PLACES.filter(p=>state.region==='all'||p.region===region));
 const clustered = clusterMapPlaces(rawList, z);

 pinLayer.innerHTML = clustered.map(item=>{
   const xy=merc(item.lat,item.lon,z);
   const px=xy.x-origin.x+w/2, py=xy.y-origin.y+h/2;
   if(px<-50||px>w+50||py<-50||py>h+50) return '';

   if(item.isCluster){
     return `<button class="map-cluster-btn" data-action="cluster-zoom" data-lat="${item.lat}" data-lon="${item.lon}" style="position:absolute;left:${px}px;top:${py}px;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;background:${item.hasSme?'#E5A836':'#0D2C1C'};color:#FFF;border:3px solid #FFF;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:13px;font-weight:700;cursor:pointer;pointer-events:auto;z-index:18;">
       ${item.count}
     </button>`;
   }

   const isSelected = state.mapSelected===item.id;
   return `<button class="map-pin ${isSelected?'active':''} ${item.isSme?'pin-sme':''}" style="left:${px}px;top:${py}px;position:absolute;transform:translate(-50%,-100%);pointer-events:auto;background:${item.isSme?'#E5A836':'#0D2C1C'};border:2px solid #FFF;border-radius:50% 50% 50% 0;rotate:-45deg;width:38px;height:38px;display:grid;place-items:center;color:#FFF;box-shadow:0 6px 16px rgba(0,0,0,0.25);" data-action="map-select" data-id="${item.id}" aria-label="${html(name(item))}">
     <span style="rotate:45deg;font-size:13px;">${item.isSme?'★':ico(item.category==='food'?'coffee':item.category==='stay'?'bed':'pin',16)}</span>
   </button>`;
 }).join('') + (state.nearbyPoint?`
   <div class="map-me-pin" style="left:${merc(state.nearbyPoint.lat,state.nearbyPoint.lon,z).x-origin.x+w/2}px;top:${merc(state.nearbyPoint.lat,state.nearbyPoint.lon,z).y-origin.y+h/2}px;" title="ตำแหน่งของคุณ (You Are Here)">
     <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;background:rgba(37,99,235,0.25);border:1px solid #2563EB;animation:pulseAccuracy 2s infinite ease-out;pointer-events:none;"></div>
     <span style="position:relative;z-index:2;display:block;width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></span>
   </div>
 `: '');
}

// Map pan dragging
let mapDragging=false, dragStartX=0, dragStartY=0, centerStart={lat:0,lon:0};
function initMapDragEvents(){
 document.addEventListener('mousedown',e=>{
   const frame=e.target.closest('#map-frame-box');
   if(!frame||e.target.closest('button'))return;
   mapDragging=true;
   dragStartX=e.clientX;dragStartY=e.clientY;
   centerStart={...state.mapCenter};
   frame.style.cursor='grabbing';
   if(state.followMe){
     state.followMe=false;
     toast(t('followPaused'));
   }
 });
 window.addEventListener('mousemove',e=>{
   if(!mapDragging)return;
   const dx=e.clientX-dragStartX, dy=e.clientY-dragStartY;
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
 });
 window.addEventListener('mouseup',()=>{
   if(!mapDragging)return;
   mapDragging=false;
   const frame=$('#map-frame-box');
   if(frame)frame.style.cursor='grab';
   if(state.mapPannedAway) render({keepScroll:true});
 });
}
initMapDragEvents();

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

function dispatch(event){
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
   case'back':navigate(state.previous==='welcome'?'discover':state.previous||'discover');break;
   case'language':state.lang=state.lang==='en'?'th':'en';store();render({keepScroll:true});break;
   case'set-language':state.lang=target.dataset.lang;store();render({keepScroll:true});break;
   case'category':state.category=target.dataset.category;state.showAll=false;render({keepScroll:true});break;
   case'set-radius':state.nearbyRadius=Number(target.dataset.radius);if(state.nearbyActive)fetchNearby();else render({keepScroll:true});break;
   case'nearby-start':startNearby();break;
   case'nearby-stop':nearbySeq++;state.nearbyBusy=false;state.nearbyActive=false;state.nearbyList=[];render({keepScroll:true});break;
   case'save':savePlace(id);break;
   case'trip-toggle':toggleTrip(id);break;
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
   case'quick-social':{
     const prov=target.dataset.provider||'google';
     const name=prompt(state.lang==='th'?`กรอกชื่อผู้ใช้สำหรับ ${prov}:`:`Enter your name for ${prov}:`,prov==='google'?'Somchai Google':'Somchai Facebook');
     if(name){
       const email=prompt(state.lang==='th'?`กรอกอีเมลสำหรับ ${prov}:`:`Enter email for ${prov}:`,prov==='google'?'somchai.google@gmail.com':'somchai.fb@facebook.com');
       if(email){
         try{
           const res=await userApi('/api/auth/social','POST',{provider:prov,name,email,providerId:prov+'_'+Date.now()});
           state.account=res.user;await loadAccountCollections();
           toast(state.lang==='th'?`เข้าสู่ระบบด้วย ${prov} สำเร็จ!`:`Signed in with ${prov}!`);
           render({keepScroll:true});
         }catch(e){toast(e.message)}
       }
     }
     break;
   }
   case'quick-phone':{
     const phone=prompt(state.lang==='th'?'กรอกเบอร์โทรศัพท์ (เช่น 0812345678):':'Enter phone number (e.g. 0812345678):','0812345678');
     if(phone){
       try{
         const reqRes=await userApi('/api/auth/phone/otp-request','POST',{phone});
         const hint=reqRes.devOtp?` (รหัสทดสอบ: ${reqRes.devOtp})`:'';
         const otp=prompt((state.lang==='th'?'กรอกรหัส OTP 6 หลักที่ได้รับ':'Enter 6-digit OTP code')+hint,reqRes.devOtp||'');
         if(otp){
           const verRes=await userApi('/api/auth/phone/otp-verify','POST',{phone,otp});
           state.account=verRes.user;await loadAccountCollections();
           toast(state.lang==='th'?'เข้าสู่ระบบด้วยเบอร์โทรสำเร็จ!':'Signed in with phone successfully!');
           render({keepScroll:true});
         }
       }catch(e){toast(e.message)}
     }
     break;
   }
   case'open-ai':state.aiModalOpen=true;render({keepScroll:true});break;
   case'close-ai':state.aiModalOpen=false;render({keepScroll:true});break;
   case'reset-ai':state.aiResult=null;state.aiLoading=false;render({keepScroll:true});break;
   case'save-ai-plan':
     if(state.aiResult&&Array.isArray(state.aiResult.itinerary)){
       const ids=[];
       state.aiResult.itinerary.forEach(d=>{(d.schedule||[]).forEach(s=>{if(s.place?.id&&!state.trip.includes(s.place.id))ids.push(s.place.id)})});
       if(ids.length){state.trip=[...state.trip,...ids];persistCollections();}
       state.aiModalOpen=false;navigate('trip');
       toast(`บันทึก ${ids.length} จุดแวะเข้าทริปเรียบร้อยแล้ว!`);
     }
     break;
   case'open-safety':state.safetyModalOpen=true;render({keepScroll:true});break;
   case'close-safety':state.safetyModalOpen=false;render({keepScroll:true});break;
   case'open-safety-form':state.safetyFormOpen=true;render({keepScroll:true});break;
   case'cancel-safety-form':state.safetyFormOpen=false;render({keepScroll:true});break;
   case'delete-account':
     if(confirm(state.lang==='th'?'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีและข้อมูลทั้งหมดของคุณอย่างถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้ตามข้อกำหนด PDPA':'Are you sure you want to permanently erase your account and all associated data under PDPA? This action cannot be undone.')){
       userApi('/api/me/account','DELETE').then(()=>{
         state.account=null;state.saved=[...guestSaved];state.trip=[...guestTrip];state.myReviews=[];
         toast(state.lang==='th'?'ลบบัญชีและข้อมูลส่วนบุคคลตามสิทธิ์ PDPA สำเร็จแล้ว':'Account and personal data erased successfully.');
         navigate('profile');
       }).catch(e=>toast(e.message));
     }
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
}

function onChange(event){
 if(event.target.id==='map-region'){
   state.region=event.target.value;
   const reg=state.region==='all'?'north':state.region;
   const mapRegions={north:{lat:18.868,lon:99.35,z:10},central:{lat:13.75,lon:100.5,z:11},south:{lat:8.5,lon:98.6,z:9},northeast:{lat:16.4,lon:103.5,z:8},east:{lat:12.8,lon:101.5,z:9},west:{lat:14.2,lon:99.2,z:9}};
   state.mapCenter={...(mapRegions[reg]||mapRegions.north)};
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

  if(form.id === 'ai-advisor-form'){
    const fd = new FormData(form);
    const payload = {
      destination: fd.get('province') || 'chiang-mai',
      days: Number(fd.get('days')) || 2,
      budget: Number(fd.get('budget')) || 3500,
      style: fd.get('style') || 'all',
      pace: fd.get('pace') || 'normal',
      quickWalk: fd.get('quickWalk') === 'true'
    };
    state.aiLoading = true;
    render({keepScroll:true});
    try {
      const res = await userApi('/api/ai/advisor', 'POST', payload);
      state.aiResult = res.plan;
      state.aiLoading = false;
      render({keepScroll:true});
    } catch(err) {
      state.aiLoading = false;
      toast(err.message);
      render({keepScroll:true});
    }
    return;
  }

  if(form.id === 'safety-report-form'){
    const fd = new FormData(form);
    const photoInput = form.querySelector('#safety-photo-input');
    let photoUrl = '';
    try {
      if(photoInput && photoInput.files && photoInput.files[0]){
        const fileFd = new FormData();
        fileFd.append('photo', photoInput.files[0]);
        const uploadRes = await fetch('/api/safety/upload', { method: 'POST', credentials: 'same-origin', body: fileFd });
        const uploadJson = await uploadRes.json();
        if(uploadRes.ok && uploadJson.photoUrl) {
          photoUrl = uploadJson.photoUrl;
        }
      }
      await userApi('/api/safety/reports', 'POST', {
        category: fd.get('category'),
        title: fd.get('title'),
        description: fd.get('description'),
        locationName: fd.get('locationName'),
        photo: photoUrl
      });
      state.safetyFormOpen = false;
      toast('ส่งรายงานความปลอดภัยสำเร็จ ข้อมูลจะได้รับการตรวจสอบจากผู้ดูแลระบบ');
      render({keepScroll:true});
    } catch(err) {
      toast(err.message);
    }
    return;
  }
});

document.addEventListener('click',dispatch);
document.addEventListener('input',onInput);
document.addEventListener('change',onChange);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(state.menuOpen){state.menuOpen=false;render({keepScroll:true})}
    else if(state.searchOpen){state.searchOpen=false;render({keepScroll:true})}
    else if(state.aiModalOpen){state.aiModalOpen=false;render({keepScroll:true})}
    else if(state.safetyModalOpen){state.safetyModalOpen=false;render({keepScroll:true})}
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
else if(['welcome','discover','map','saved','trip','profile'].includes(location.hash.slice(1))) state.page=location.hash.slice(1);

render();
refreshSession();
initRealData();
