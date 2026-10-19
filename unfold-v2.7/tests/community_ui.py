"""Offline Chromium UI contract test: real v2.2 HTML/CSS/JS with explicitly mocked API.
No actual localhost browser navigation is claimed; Node integration tests cover real HTTP API.
"""
import asyncio, base64, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'screenshots'
SHOTS.mkdir(exist_ok=True)
PHOTO='data:image/webp;base64,'+base64.b64encode((ROOT/'assets'/'terraced-fields.webp').read_bytes()).decode()
PLACE=dict(id='community-test-place',en='Riverside Farm Kitchen',th='ครัวริมนา',locEn='Chiang Mai, Thailand',locTh='เชียงใหม่',category='food',region='north',lat=18.8,lon=98.9,photo='/uploads/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp',gallery=['/uploads/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp'],featured=True,storyEn='Family-run local kitchen with scenic rice fields.',storyTh='ครัวชุมชนท่ามกลางทุ่งนา',visit='1 h')
MOCK=r'''
const st={account:null,saved:[],trip:[],reviews:[]};
const __store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>__store.get(k)||null,setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k),clear:()=>__store.clear()}});
window.fetch=async function(url,opt={}){
 const m=opt.method||'GET',b=opt.body?JSON.parse(opt.body):{};
 function ok(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
 if(url==='/api/places')return ok({places:window.__published,mode:'live'});
 if(url==='/api/auth/me')return ok({user:st.account});
 if(url==='/api/auth/register'){st.account={id:'demo',name:b.name,email:b.email};return ok({user:st.account},201)}
 if(url==='/api/auth/login'){st.account={id:'demo',name:'Avery',email:b.email};return ok({user:st.account})}
 if(url==='/api/auth/logout'){st.account=null;return ok({ok:true})}
 if(url==='/api/me/collections'&&m==='GET')return ok({saved:st.saved,trip:st.trip});
 if(url==='/api/me/collections'&&m==='PUT'){st.saved=b.saved;st.trip=b.trip;return ok({saved:st.saved,trip:st.trip})}
 if(url==='/api/me/reviews')return ok({reviews:st.reviews});
 if(url.endsWith('/reviews')&&m==='GET')return ok({reviews:[],count:0});
 if(url.endsWith('/my-review')&&m==='PUT'){
 const r={id:'mock-review',placeId:'community-test-place',name:'Avery',stars:b.stars,text:b.text,photo:b.photo,status:'pending',createdAt:new Date().toISOString()};
 st.reviews=[r];return ok({review:r});}
 if(url.endsWith('/my-review')&&m==='DELETE'){st.reviews=[];return ok({ok:true})}
 if(url==='/api/reviews/upload')return ok({url:'/review-media/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp',size:120},201)
 return ok({error:'No mock response: '+url},404);
};
'''
async def test_public(browser,kind,width,height):
 html=(ROOT/'apps/traveler/index.html').read_text(encoding='utf-8')
 css=(ROOT/'apps/traveler/styles.css').read_text(encoding='utf-8')
 js=(ROOT/'apps/traveler/app.js').read_text(encoding='utf-8')
 start=js.index('const photo=p=>');end=js.index(';',start)+1
 js=js[:start]+"const photo=p=>window.__demoPhoto;"+js[end:]
 html=html.replace('<link rel="stylesheet" href="styles.css" />','<style>'+css+'</style>')
 html=html.replace('<script src="app.js" defer></script>', '<script>window.__demoPhoto='+json.dumps(PHOTO)+';window.__published='+json.dumps([PLACE])+';'+MOCK+'</script><script>'+js+'</script>')
 page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
 await page.route('https://**',lambda route:route.abort())
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 await page.set_content(html,wait_until='domcontentloaded')
 await page.wait_for_selector('.landing')
 await page.locator('[data-action="navigate"][data-page="discover"]:visible').last.click()
 await page.wait_for_function("document.querySelector('.place-card')?.textContent.includes('Riverside Farm Kitchen')")
 await page.locator('.place-card-link').first.click()
 await page.wait_for_selector('.review-block')
 await page.locator('.review-block summary').click()
 assert await page.locator('.review-signin').count()==1
 await page.screenshot(path=str(SHOTS/f'{kind}-reviews-guest.png'),animations='disabled')
 await page.locator('.review-signin').click()
 await page.locator('[data-action="auth-mode"][data-mode="register"]').click()
 await page.locator('#member-auth-form input[name="name"]').fill('Avery')
 await page.locator('#member-auth-form input[name="email"]').fill('avery@example.test')
 await page.locator('#member-auth-form input[name="password"]').fill('super-long-safepassword')
 await page.locator('#member-auth-form button[type=submit]').click()
 await page.wait_for_selector('.account-ident')
 assert 'Avery' in await page.locator('.account-ident').inner_text()
 await page.screenshot(path=str(SHOTS/f'{kind}-account.png'),animations='disabled')
 await page.locator('[data-action="navigate"][data-page="discover"]:visible').last.click()
 await page.locator('.place-card-link').first.click()
 await page.locator('.review-block summary').click()
 await page.locator('select[name="stars"]').select_option('5')
 await page.locator('#public-review-form textarea[name="text"]').fill('Lovely place, friendly hosts and fresh local food.')
 await page.locator('#public-review-form [type=submit]').click()
 await page.wait_for_function("state.myReviews.length === 1")
 await page.screenshot(path=str(SHOTS/f'{kind}-review-form.png'),animations='disabled')
 await page.locator('[data-action="save"]').first.click()
 await page.locator('[data-action="trip-toggle"]').first.click()
 await page.locator('[data-action="navigate"][data-page="saved"]:visible').last.click()
 assert await page.locator('.collection-item').count()==1
 if kind=='desktop':
  await page.locator('[data-action="menu-open"]:visible').first.click()
  await page.locator('.mega-overlay [data-action="navigate"][data-page="profile"]').click()
 else:
  await page.locator('.bottom-nav [data-action="navigate"][data-page="profile"]').click()
 await page.locator('[data-action="auth-logout"]').click()
 await page.wait_for_selector('#member-auth-form')
 assert await page.locator('.account-ident').count()==0
 assert not errors, f'{kind}: JS errors {errors}'
 assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth+2'),f'{kind}: overflow'
 await page.close()
 return f'{kind}: account, review draft, saved, trip, logout, responsive PASS'

async def test_moderation(browser):
 html=(ROOT/'apps/admin/moderation.html').read_text(encoding='utf-8')
 css=(ROOT/'apps/admin/moderation.css').read_text(encoding='utf-8')
 js=(ROOT/'apps/admin/moderation.js').read_text(encoding='utf-8')
 img=PHOTO
 mock=r'''window.fetch=async(url,opt={})=>{
 let status='pending';if(opt.body)status=JSON.parse(opt.body).status;
 const review={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',placeId:'community-test-place',placeName:'Riverside Farm Kitchen',name:'Avery',email:'avery@example.test',stars:5,text:'Friendly village hosts and excellent food.',photo:'',status:'pending',updatedAt:new Date().toISOString()};
 return new Response(JSON.stringify(String(url).includes('/api/admin/reviews?')?{reviews:[review]}:{ok:true}),{status:200,headers:{'content-type':'application/json'}})
};'''
 html=html.replace('<link rel="stylesheet" href="moderation.css">','<style>'+css+'</style>')
 html=html.replace('<script src="moderation.js" defer></script>','<script>'+mock+'</script><script>'+js+'</script>')
 page=await browser.new_page(viewport={'width':1440,'height':900})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 await page.set_content(html,wait_until='domcontentloaded')
 await page.wait_for_selector('.review-card')
 await page.screenshot(path=str(SHOTS/'desktop-moderation.png'),animations='disabled')
 await page.locator('[data-status="approved"]').click()
 await page.locator('[data-filter="rejected"]').click()
 assert await page.locator('.review-card').count()==1
 await page.set_viewport_size({'width':390,'height':844})
 assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth+2')
 await page.screenshot(path=str(SHOTS/'mobile-moderation.png'),animations='disabled')
 assert not errors,errors
 await page.close();return 'admin Review Studio responsive and status action: PASS'

async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   print(await test_public(b,'desktop',1440,900))
   print(await test_public(b,'mobile',390,844))
   print(await test_moderation(b))
  finally:await b.close()
asyncio.run(main())
