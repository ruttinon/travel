/* SME shop page loader (owner: Tommy, 2026-11-06) — see frontend/shop/shop.html */
(function() {
  'use strict';
  const root = document.getElementById('shop');
  const id = (location.pathname.match(/^\/shop\/([-a-z0-9]{1,65})$/) || [])[1];
  const toast = msg => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2200); };
  const notFound = () => {
    root.innerHTML = '<div class="shop-msg"><h1>ไม่พบหน้าร้านนี้</h1><p>ร้านอาจยังไม่เปิดหน้าร้าน หรือถูกปิดชั่วคราว</p><p><a href="/#map">กลับไปที่แผนที่</a></p></div>';
  };
  if (!id) return notFound();
  document.getElementById('backLink').href = '/#place=' + id;

  Promise.all([
    fetch('/api/shop-pages/' + id, {credentials: 'same-origin'}).then(r => r.ok ? r.json() : null),
    fetch('/api/places/' + id + '/reviews').then(r => r.ok ? r.json() : {reviews: []}).catch(() => ({reviews: []}))
  ]).then(([data, rev]) => {
    if (!data || !data.page || !data.page.content) return notFound();
    const place = data.place || {};
    document.title = (place.th || place.en || 'ร้านค้า') + ' · GoAround';
    root.innerHTML = TravalShopRender.html({
      content: data.page.content, place, googleUrl: data.googleUrl, reviews: rev.reviews || [], mode: 'public',
      navigateUrl: window.TravalLinks ? TravalLinks.directionsUrl(place) : '',
      writeReviewUrl: '/#place=' + encodeURIComponent(id)
    });
    const share = root.querySelector('[data-share]');
    if (share) share.addEventListener('click', async () => {
      const url = location.origin + '/shop/' + id;
      try {
        if (navigator.share) await navigator.share({title: document.title, url});
        else { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แล้ว'); }
      } catch (e) { /* user closed the share sheet */ }
    });
  }).catch(notFound);
})();
