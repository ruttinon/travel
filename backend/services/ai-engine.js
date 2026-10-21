'use strict';
const { kmBetween } = require('../utils/geo');
const { getPublic, rowToPlace } = require('./place-service');

function generateAiTripPlan(params) {
  const destination = (params.destination || '').toLowerCase().trim();
  const days = Math.max(1, Math.min(7, Number(params.days) || 1));
  const travelMode = ['driving', 'walking', 'transit', 'taxi'].includes(params.travelMode) ? params.travelMode : 'driving';
  const pace = params.pace || 'moderate';
  const hoursPerDay = pace === 'relaxed' ? 5 : pace === 'packed' ? 9 : 7;
  const travelers = Math.max(1, Math.min(20, Number(params.travelers) || 1));
  const budget = Number(params.budget) > 0 ? Number(params.budget) : null;
  const interests = Array.isArray(params.interests) ? params.interests.map(i => String(i).toLowerCase()) : [];
  const mustVisit = Array.isArray(params.mustVisit) ? params.mustVisit : [];
  const includeSme = params.includeSme !== false;
  const query = String(params.query || '').trim();

  if (params.userLat != null && params.userLon != null && (/(เดิน|walk|รอบตัว|around|ใกล้ฉัน|10 นาที)/i.test(query))) {
    const lat = Number(params.userLat), lon = Number(params.userLon);
    const nearby = getPublic.all().filter(p => p.lat !== null && p.lon !== null)
      .map(p => ({ place: rowToPlace(p), dist: kmBetween(lat, lon, p.lat, p.lon) }))
      .filter(x => x.dist <= 1.5)
      .sort((a, b) => {
        if (a.place.isSme && !b.place.isSme) return -1;
        if (!a.place.isSme && b.place.isSme) return 1;
        return a.dist - b.dist;
      })
      .slice(0, 8);
    const walkingPlaces = nearby.map(x => ({
      ...x.place,
      walkingDistanceMeters: Math.round(x.dist * 1000),
      estimatedWalkMinutes: Math.max(1, Math.round((x.dist / 4.5) * 60))
    }));
    return {
      type: 'quick_walk_recommendations',
      query,
      userLocation: { lat, lon },
      places: walkingPlaces,
      count: walkingPlaces.length,
      aiSummary: walkingPlaces.length ? `พบ ${walkingPlaces.length} ร้านและสถานที่ในระยะเดิน 10-15 นาที โดยมีร้าน SME ท้องถิ่นเด่น เช่น ${walkingPlaces.filter(p => p.isSme).map(p => p.th || p.en).slice(0, 3).join(', ') || walkingPlaces[0].th}` : 'ไม่พบสถานที่ในระยะเดิน 15 นาทีจากพิกัดนี้ ลองค้นหาด้วยยานพาหนะ'
    };
  }

  const allPub = getPublic.all();
  let pool = allPub;
  if (destination && destination !== 'all') {
    const matched = allPub.filter(p =>
      p.region.toLowerCase() === destination ||
      p.location_en.toLowerCase().includes(destination) ||
      p.location_th.toLowerCase().includes(destination) ||
      p.name_en.toLowerCase().includes(destination) ||
      p.name_th.toLowerCase().includes(destination)
    );
    if (matched.length >= 3) pool = matched;
  }
  const scored = pool.map(p => {
    let score = 0;
    if (mustVisit.includes(p.slug)) score += 1000;
    if (interests.includes(p.category)) score += 15;
    if (includeSme && p.is_sme) score += 8;
    if (p.featured) score += 5;
    if (p.spotlight_badge) score += 6;
    if (p.cover) score += 3;
    if (p.price_from != null) score += 2;
    return { place: p, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const targetPerDay = pace === 'relaxed' ? 3 : pace === 'packed' ? 5 : 4;
  const totalTarget = Math.min(scored.length, days * targetPerDay);
  const selectedPlaces = scored.slice(0, totalTarget).map(x => x.place);

  const arranged = [];
  const remaining = [...selectedPlaces];
  while (remaining.length) {
    if (!arranged.length) { arranged.push(remaining.shift()); continue; }
    const last = arranged[arranged.length - 1];
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = kmBetween(last.lat, last.lon, remaining[i].lat, remaining[i].lon);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    arranged.push(remaining.splice(bestIdx, 1)[0]);
  }

  const dailyGroups = Array.from({ length: days }, () => []);
  const placesPerDay = Math.ceil(arranged.length / days);
  for (let i = 0; i < arranged.length; i++) {
    const dayIndex = Math.min(days - 1, Math.floor(i / placesPerDay));
    dailyGroups[dayIndex].push(arranged[i]);
  }

  const itinerary = dailyGroups.map((dayPlaces, idx) => {
    let dayKm = 0;
    for (let i = 0; i < dayPlaces.length - 1; i++) {
      dayKm += kmBetween(dayPlaces[i].lat, dayPlaces[i].lon, dayPlaces[i + 1].lat, dayPlaces[i + 1].lon);
    }
    const daySmeCount = dayPlaces.filter(p => p.is_sme).length;
    return {
      day: idx + 1,
      theme: idx === 0 ? 'สำรวจไฮไลท์ชุมชนและวัฒนธรรมท้องถิ่น' : idx === 1 ? 'ธรรมชาติ ร้านค้าหัตถกรรม และรสชาติแท้' : 'วิถีชีวิต ช้อปปิ้งสินค้าชุมชน และจุดชมวิว',
      places: dayPlaces.map(p => rowToPlace(p)),
      schedule: dayPlaces.map((p, pIdx) => {
        const timeSlot = pIdx === 0 ? '09:00 - 11:00' : pIdx === 1 ? '11:30 - 13:30' : pIdx === 2 ? '14:00 - 16:00' : '17:00 - 19:00';
        return {
          time: timeSlot,
          place: rowToPlace(p),
          activity: p.category === 'food' ? 'ลิ้มลองเมนูเด็ดและสนับสนุนร้านชุมชน' : p.category === 'nature' ? 'ดื่มด่ำกับธรรมชาติและถ่ายรูป' : 'เรียนรู้วิถีชุมชนท้องถิ่น'
        };
      }),
      estimatedTravelKm: Math.round(dayKm * 10) / 10,
      smeStopoversCount: daySmeCount
    };
  });

  const totalPlaces = selectedPlaces.length;
  const estTransport = Math.round(days * 450);
  const estFood = Math.round(days * travelers * 600);
  const estStay = Math.round((days - 1) * 1200);
  const estActivities = Math.round(totalPlaces * 150);
  const estTotal = estTransport + estFood + estStay + estActivities;

  return {
    type: 'ai_itinerary_plan',
    destination: destination || 'Thailand',
    days,
    travelers,
    travelMode,
    pace,
    summary: `แผนการเดินทาง ${days} วันในธีมวิถีชุมชนและ SME First ครอบคลุมสถานที่น่าสนใจ ${totalPlaces} แห่ง พร้อมจุดแวะสนับสนุนร้านค้าท้องถิ่น`,
    itinerary,
    budgetEstimate: {
      currency: 'THB',
      totalEstimatedCost: estTotal,
      targetBudget: budget,
      isWithinBudget: budget ? estTotal <= budget : true,
      breakdown: {
        transportation: estTransport,
        foodAndDining: estFood,
        accommodations: estStay,
        activitiesAndEntry: estActivities,
        emergencyCushion: Math.round(estTotal * 0.1)
      }
    },
    localSmeSupportHighlights: {
      totalSmePlaces: selectedPlaces.filter(p => p.is_sme).length,
      estimatedCommunityIncomeShare: '42%'
    }
  };
}

module.exports = { generateAiTripPlan };
