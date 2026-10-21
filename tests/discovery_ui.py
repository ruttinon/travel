"""Offline Chromium UI contract tests for v2.4 discovery, account recovery and mobile layouts.
Production app HTML/CSS/JS runs with mocked APIs and GPS. API behavior is checked by Node tests.
"""
import asyncio,base64,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots-v2.4';OUT.mkdir(exist_ok=True)
PHOTO='data:image/webp;base64,'+base64.b64encode((ROOT/'assets'/'terraced-fields.webp').read_bytes()).decode()
PLACES=[dict(id='test-valley',en='Unfold Test Valley',th='หุบเขาทดสอบ',locEn='Chiang Mai, Thailand',locTh='เชียงใหม่',category='nature',region='north',lat=18.80,lon=98.98,visit='2h',storyEn='Sample published venue for UI tests.',storyTh='ข้อมูลตัวอย่าง',photo='/uploads/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp',gallery=['/uploads/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp'],featured=True,priceFrom=250,currency='THB')]
MOCK=r'''
const __cache=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>__cache.get(k)||null,setItem:(k,v)=>__cache.set(k,String(v)),removeItem:k=>__cache.delete(k)}});
Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:cb=>cb({coords:{latitude:18.8005,longitude:98.9805}})}});
const __realOpen=window.open;window.__lastRoute='';window.open=(url)=>{window.__lastRoute=url;return null};
window.fetch=async (url,opt={})=>{
 const method=opt.method||'GET';const b=opt.body?JSON.parse(opt.body):{};
 const ok=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 if(String(url)==='/api/places')return ok({places:window.__published,mode:'live'});
 if(String(url).startsWith('/api/places/nearby?')){
   const p=new URLSearchParams(String(url).split('?')[1]);
   const match=(p.get('category')==='all'||p.get('category')==='nature')&&(!p.has('maxPrice')||Number(p.get('maxPrice'))>=250)&&(p.get('currency')==='THB');
   return ok({places:match?[{...window.__published[0],distanceKm:0.1}]:[],count:match?1:0,radiusKm:Number(p.get('radiusKm')),unit:'km'});
 }
 if(String(url)==='/api/auth/me')return ok({user:null});
 if(String(url)==='/api/auth/password/forgot')return ok({ok:true,message:'If this email has an account, a reset link will be provided.'});
 if(String(url).endsWith('/reviews'))return ok({reviews:[],count:0});
 return ok({error:'No mock for '+url},404);
};
'''
async def run_case(browser,device,width,height):
 html=(ROOT/'frontend/traveler/index.html').read_text();css=(ROOT/'frontend/traveler/styles.css').read_text();js=(ROOT/'frontend/traveler/app.js').read_text()
 start=js.index('const photo=p=>');end=js.index(';',start)+1
 js=js[:start]+'const photo=p=>window.__demoPhoto;'+js[end:]
 html=html.replace('<link rel="stylesheet" href="styles.css" />','<style>'+css+'</style>')
 html=html.replace('<script src="app.js" defer></script>','<script>window.__demoPhoto='+json.dumps(PHOTO)+';window.__published='+json.dumps(PLACES)+';'+MOCK+'</script><script>'+js+'</script>')
 page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
 page.set_default_timeout(5500)
 errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 await page.route('https://**',lambda route:route.abort())
 await page.set_content(html,wait_until='domcontentloaded')
 await page.wait_for_selector('.landing')
 await page.locator('[data-action="navigate"][data-page="discover"]:visible').last.click()
 await page.wait_for_selector('.place-card')
 assert await page.locator('[data-action="nearby-start"]').count()==1
 await page.screenshot(path=str(OUT/f'{device}-explore.png'),animations='disabled')
 await page.locator('[data-action="nearby-start"]').click()
 await page.wait_for_selector('[data-action="nearby-stop"]')
 assert '0.1' in await page.locator('.place-card').first.inner_text()
 await page.screenshot(path=str(OUT/f'{device}-nearby.png'),animations='disabled')
 if device=='mobile':await page.locator('[data-action="filter-toggle"]').click()
 await page.locator('#near-price').select_option('300')
 await page.wait_for_function("document.querySelector('.nearby-status')?.textContent.includes('1 place')")
 await page.locator('#near-price').select_option('1000')
 await page.locator('[data-action="navigate"][data-page="map"]:visible').last.click()
 await page.wait_for_selector('.map-page')
 assert await page.locator('.map-result').count()==1
 await page.screenshot(path=str(OUT/f'{device}-map.png'),animations='disabled')
 await page.locator('.map-result').first.click()
 if device=='desktop':await page.locator('.map-picked [data-action="place"]').click()
 await page.wait_for_selector('.detail-page')
 assert '250' in await page.locator('.detail-price').inner_text()
 await page.locator('[data-action="route-mode"][data-mode="walking"]').click()
 await page.locator('[data-action="directions"]').click()
 assert 'travelmode=walking' in await page.evaluate('window.__lastRoute')
 await page.screenshot(path=str(OUT/f'{device}-detail.png'),animations='disabled')
 # navigate via header on desktop / fixed bar on mobile
 if device=='desktop':
  await page.locator('[data-action="menu-open"]:visible').first.click()
  await page.locator('.mega-overlay [data-action="navigate"][data-page="profile"]').click()
 else:
  await page.locator('.bottom-nav [data-action="navigate"][data-page="profile"]').click()
 await page.wait_for_selector('[data-action="auth-mode"][data-mode="forgot"]')
 await page.locator('[data-action="auth-mode"][data-mode="forgot"]').click()
 await page.wait_for_selector('#member-forgot-form')
 await page.locator('#member-forgot-form input[name="email"]').fill('test@example.com')
 await page.locator('#member-forgot-form [type=submit]').click()
 await page.screenshot(path=str(OUT/f'{device}-forgot.png'),animations='disabled')
 assert not errors,f'{device} JS errors: {errors}'
 assert not await page.evaluate('document.documentElement.scrollWidth > window.innerWidth+2'),f'{device} horizontal overflow'
 await page.close()
 return f'{device}: GPS click, nearby API view, budget, map, route modes, recovery UI, responsive PASS'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   for name,w,h in [('desktop',1440,900),('mobile',390,844)]:print(await run_case(browser,name,w,h),flush=True)
  finally:await browser.close()
asyncio.run(main())
