"""Browser UI contract tests via inline app + mocked HTTP contract.
Direct browser navigation to localhost is blocked by the evaluation sandbox;
API behavior and durable SQLite persistence are separately tested in integration.test.js.
"""
import asyncio, base64, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots';OUT.mkdir(exist_ok=True)
IMG=(ROOT/'assets'/'terraced-fields.webp').read_bytes()
PHOTO='data:image/webp;base64,'+base64.b64encode(IMG).decode()
UPLOAD='/uploads/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp'
FRONT_PLACE={'id':'test-trail-v21','en':'Mountain Trail Local','th':'ทางเดินเขาท้องถิ่น','locEn':'Chiang Mai, Thailand','locTh':'เชียงใหม่ ประเทศไทย','category':'nature','region':'north','lat':18.48,'lon':98.45,'visit':'2–3h','storyEn':'Quiet mountain scenery and local views. Demo UI data.','storyTh':'ตัวอย่างสำหรับทดสอบ UI','photo':UPLOAD,'gallery':[UPLOAD],'featured':True}

async def admin_test(browser):
    html=(ROOT/'admin.html').read_text(encoding='utf8')
    css=(ROOT/'admin.css').read_text(encoding='utf8')
    js=(ROOT/'admin.js').read_text(encoding='utf8')
    js=js.replace('function image(url){',"function image(url){if(url&&url.startsWith('/uploads/'))return window.__uiPhoto;")
    mock="""
    let logged=false,setup=true,places=[];
    window.fetch=async function(url,opt={}){
      const method=opt.method||'GET',b=opt.body?JSON.parse(opt.body):{};
      function r(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}})}
      if(url.endsWith('/status'))return r({setupRequired:setup,authenticated:logged});
      if(url.endsWith('/setup')){if(b.password.length<12)return r({error:'Weak password'},400);setup=false;logged=true;return r({ok:true},201)}
      if(url.endsWith('/places')&&method==='GET')return r({places});
      if(url.endsWith('/places')&&method==='POST') {const p={...b,id:'test-'+(places.length+1),createdAt:'2026-10-16'};places.unshift(p);return r({place:p},201)}
      if(url.includes('/places/')&&method==='PUT'){const id=url.split('/').pop();const p={...b,id};places=places.map(x=>x.id===id?p:x);return r({place:p})}
      if(url.endsWith('/uploads')&&method==='POST')return r({url:window.__testUploadUrl,size:153},201);
      if(url.endsWith('/logout')){logged=false;return r({ok:true})}
      return r({error:'Unknown request: '+url},404)
    };
    """
    html=html.replace('<link rel="stylesheet" href="admin.css" />','<style>'+css.replace("url('assets/terraced-fields.webp')",f'url("{PHOTO}")')+'</style>')
    html=html.replace('<script defer src="admin.js"></script>','<script>window.__uiPhoto='+json.dumps(PHOTO)+';window.__testUploadUrl='+json.dumps(UPLOAD)+';'+mock+'</script><script>'+js+'</script>')
    page=await browser.new_page(viewport={'width':1440,'height':900})
    await page.route('https://**',lambda route: route.abort())
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    await page.set_content(html,wait_until='load')
    await page.wait_for_selector('#auth-form')
    await page.screenshot(path=str(OUT/'admin-desktop-setup.png'))
    await page.locator('input[name="setupToken"]').fill('mock-code')
    await page.locator('input[name="password"]').fill('passphrase-very-long')
    await page.locator('input[name="confirm"]').fill('passphrase-very-long')
    await page.locator('#auth-form button[type="submit"]').click()
    await page.wait_for_selector('#place-form')
    await page.locator('[name="en"]').fill('Hidden Mountain Hut')
    await page.locator('[name="th"]').fill('บ้านพักในภูเขา')
    await page.locator('[name="locEn"]').fill('Chiang Mai, Thailand')
    await page.locator('[name="locTh"]').fill('เชียงใหม่')
    await page.locator('[name="lat"]').fill('18.48')
    await page.locator('[name="lon"]').fill('98.45')
    await page.locator('#upload-cover').set_input_files(str(ROOT/'assets'/'icon-192.png'))
    await page.wait_for_function("document.querySelector('#cover-thumb img')!==null")
    await page.locator('#upload-gallery').set_input_files(str(ROOT/'assets'/'icon-192.png'))
    await page.wait_for_function("document.querySelectorAll('#gallery-preview .img-item').length===1")
    await page.locator('[name="status"]').select_option('published')
    await page.locator('#place-form button[type="submit"]').click()
    await page.wait_for_function("document.querySelectorAll('.list-card').length===1")
    assert await page.locator('.list-card .status.published').count()==1
    await page.screenshot(path=str(OUT/'admin-desktop-editor.png'),full_page=True)
    await page.set_viewport_size({'width':390,'height':844})
    await page.wait_for_timeout(180)
    await page.screenshot(path=str(OUT/'admin-mobile-editor.png'),full_page=True)
    overflow=await page.evaluate('document.documentElement.scrollWidth > window.innerWidth+2')
    if overflow:errors.append('mobile admin horizontal overflow')
    await page.locator('[data-action="new"]').first.click()
    assert await page.locator('input[name="en"]').input_value()==''
    if errors:raise AssertionError('Admin UI errors: '+repr(errors))
    await page.close();return 'admin setup + create + upload + publish + edit + mobile responsive: PASS'

async def front_test(browser):
    html=(ROOT/'index.html').read_text(encoding='utf8')
    css=(ROOT/'styles.css').read_text(encoding='utf8')
    js=(ROOT/'app.js').read_text(encoding='utf8')
    start=js.index('const photo=p=>');end=js.index(';',start)+1
    js=js[:start]+"const photo=p=>window.__uiPhoto[p]||window.__uiPhoto['fallback'];"+js[end:]
    photo_map={'fallback':PHOTO}
    fake_fetch='''
    const __store=new Map();
    Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>__store.has(k)?__store.get(k):null,setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k),clear:()=>__store.clear()}});
    window.fetch=async function(url){
      if(String(url).includes('/api/places'))return new Response(JSON.stringify({places:window.__published,mode:'live'}),{status:200,headers:{'content-type':'application/json'}});
      throw new Error('Unmocked fetch');
    };'''
    html=html.replace('<link rel="stylesheet" href="styles.css" />','<style>'+css+'</style>')
    html=html.replace('<script src="app.js" defer></script>', '<script>window.__uiPhoto='+json.dumps(photo_map)+';window.__published='+json.dumps([FRONT_PLACE])+';'+fake_fetch+'</script><script>'+js+'</script>')
    errors=[]
    for kind,size in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
      page=await browser.new_page(viewport=size)
      await page.route('https://**',lambda route: route.abort())
      page.set_default_timeout(7000)
      page.on('pageerror',lambda error,k=kind:errors.append(k+': '+str(error)))
      await page.set_content(html,wait_until='domcontentloaded')
      await page.wait_for_selector('.landing')
      await page.screenshot(path=str(OUT/f'{kind}-welcome.png'))
      await page.locator('[data-action="navigate"][data-page="discover"]:visible').last.click()
      await page.wait_for_function("document.querySelector('.place-card') && document.querySelector('.place-card').textContent.includes('Mountain Trail Local')",timeout=7000)
      assert await page.locator('.place-card').count()==1
      assert await page.locator('.v21-demo-bar').count()==0,'should not label published places as demo'
      if kind=='desktop':
        await page.locator('[data-action="menu-open"]:visible').first.click()
        assert await page.locator('.overlay-polaroids button').count()==1,'menu must handle one published place'
        await page.locator('[data-action="menu-close"]').click()
      await page.screenshot(path=str(OUT/f'{kind}-explore-live.png'),timeout=8000,animations='disabled')
      await page.locator('.place-card .place-card-link').first.click()
      await page.wait_for_selector('.detail-page')
      assert 'Mountain Trail Local' in await page.locator('.detail-title h2').inner_text()
      await page.screenshot(path=str(OUT/f'{kind}-detail-live.png'),timeout=8000,animations='disabled')
      await page.locator('[data-action="save"]').first.click(timeout=4500)
      await page.locator('[data-action="trip-toggle"]').first.click(timeout=4500)
      assert await page.evaluate("localStorage.getItem('unfold-v2-user')")
      await page.locator('[data-action="navigate"][data-page="map"]:visible').last.click(timeout=4500)
      await page.wait_for_selector('.map-page')
      assert await page.locator('.map-result').count()==1
      await page.screenshot(path=str(OUT/f'{kind}-map-live.png'),timeout=8000,animations='disabled')
      if kind=='mobile':
        overflow=await page.evaluate('document.documentElement.scrollWidth > window.innerWidth+2')
        if overflow:errors.append('mobile public horizontal overflow')
      await page.close()
    if errors:raise AssertionError('Public UI errors: '+repr(errors))
    return 'public welcome + live Explore + detail + saved + trip + map (desktop/mobile): PASS'

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   print(await admin_test(browser))
   print(await front_test(browser))
  finally:await browser.close()
asyncio.run(main())
