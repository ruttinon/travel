"""Render the actual Business Portal and moderation JS in Chromium without network.
This checks visuals, navigation, forms and responsive overflow with fixture data.
It does NOT test browser->localhost HTTP, which is tested separately through Node APIs.
"""
from pathlib import Path
import base64
import json
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'screenshots-v2.5'
OUT.mkdir(exist_ok=True)

blob='data:image/webp;base64,'+base64.b64encode((ROOT/'assets'/'terraced-fields.webp').read_bytes()).decode()
forest='data:image/webp;base64,'+base64.b64encode((ROOT/'assets'/'misty-cabin.webp').read_bytes()).decode()

def render_offline(page, kind, response):
    if kind=='business':
        page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="business-root"></div><div id="business-toast" class="toast" role="status"></div></body></html>')
        css=(ROOT/'frontend/business/business.css').read_text().replace('@import url(\'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap\');','')
        css=css.replace("url('assets/terraced-fields.webp')",f"url('{blob}')").replace("url('assets/misty-cabin.webp')",f"url('{forest}')")
        page.add_style_tag(content=css)
        page.evaluate('''data => {
           const state = data;
           window.fetch = async function(path,opts={}){
             const text=String(path),method=opts.method||'GET';
             let status=200, payload={};
             if(text==='/api/business/me')payload=state.me;
             else if(text==='/api/places')payload={places:state.publicPlaces};
             else if(text.startsWith('/api/business/submissions/') && method==='POST')payload={submission:{id:'a'.repeat(36),status:'pending'}};
             else if(text==='/api/auth/logout')payload={ok:true};
             else if(text==='/api/business/uploads')payload={url:'/uploads/'+'a'.repeat(36)+'.webp'};
             else {status=404;payload={error:'This offline fixture has no response for '+text}}
             return {ok:status>=200&&status<300,status,json:async()=>payload};
           }
        }''',response)
        script=(ROOT/'frontend/business/business.js').read_text().replace("return 'assets/terraced-fields.webp'",f"return '{blob}'")
        script=script.replace("return url;return 'assets/terraced-fields.webp'",f"return '{blob}';return '{blob}'")
        page.add_script_tag(content=script)
    else:
        page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="business-admin-root"></div><div id="admin-business-toast" class="toast" role="status"></div></body></html>')
        css=(ROOT/'frontend/business/business.css').read_text()+"\n"+(ROOT/'frontend/business/business-admin.css').read_text()
        css='\n'.join(line for line in css.splitlines() if not line.strip().startswith('@import url('))
        css=css.replace("url('assets/terraced-fields.webp')",f"url('{blob}')").replace("url('assets/misty-cabin.webp')",f"url('{forest}')")
        page.add_style_tag(content=css)
        page.evaluate('''data => {
         window.fetch=async function(path,opts={}){
           let payload={}; const text=String(path);
           if(text.includes('/api/admin/business-submissions'))payload={submissions:data.submissions};
           else if(text.includes('/api/admin/businesses'))payload={businesses:data.businesses};
           else payload={ok:true};
           return {ok:true,status:200,json:async()=>payload};
         }
        }''',response)
        script=(ROOT/'frontend/business/business-admin.js').read_text().replace("?src.replace('/uploads/','/api/admin/business-media/'):'assets/terraced-fields.webp'", f"?'{blob}':'{blob}'")
        page.add_script_tag(content=script)

def main():
    mock={
      'me':{'user':{'id':'user-1','name':'Arun Explorer','email':'arun@example.com','emailVerified':True},
        'business':{'id':'business-1','name':'Northland Local Stay','type':'stay','contactEmail':'stay@example.com','phone':'+66 80 123 4567','website':'','description':'Locally run accommodation','status':'approved','note':''},
        'places':[{'id':'northland-stay','en':'Northland Local Stay','th':'บ้านพักวิวเหนือ','locEn':'Chiang Mai, Thailand','locTh':'เชียงใหม่','category':'stay','region':'north','lat':18.8,'lon':98.9,'visit':'2 nights','priceFrom':1200,'currency':'THB','photo':'','gallery':[],'status':'published'}],
        'submissions':[{'id':'one','action':'create','placeId':'northland-stay','status':'approved','updatedAt':'2026-10-16T03:00:00.000Z','note':'','payload':{'en':'Northland Local Stay'}},
                       {'id':'two','action':'edit','placeId':'northland-stay','status':'pending','updatedAt':'2026-10-16T04:00:00.000Z','note':'','payload':{'en':'New photo proposal'}}]},
      'publicPlaces':[]
    }
    moderation={
      'businesses':[{'id':'a','name':'Mountain Roots Homestay','type':'stay','ownerVerified':True,'ownerEmail':'operator@example.com','contactEmail':'operator@example.com','phone':'+66 80 555 1234','website':'','description':'Small mountain family guesthouse','placeCount':0,'status':'pending','note':''},
        {'id':'b','name':'Northland Local Stay','type':'stay','ownerVerified':True,'ownerEmail':'arun@example.com','contactEmail':'stay@example.com','phone':'','website':'','description':'','placeCount':1,'status':'approved','note':''}],
      'submissions':[{'id':'12345678-1234-1234-1234-123456789000','action':'create','businessName':'Mountain Roots Homestay','placeId':None,'status':'pending','note':'','updatedAt':'2026-10-16T04:00:00Z',
        'payload':{'en':'Quiet Hills Stay','locEn':'Mae Hong Son, Thailand','category':'stay','lat':19.3,'lon':97.98,'storyEn':'Local guesthouse with a quiet valley view','priceFrom':1200,'currency':'THB','photo':'','gallery':[]}}]
    }
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        desktop=browser.new_page(viewport={'width':1440,'height':900})
        desktop.on('pageerror',lambda e:errors.append(str(e)))
        render_offline(desktop,'business',mock)
        desktop.get_by_text('Northland Local Stay').first.wait_for()
        desktop.screenshot(path=str(OUT/'business-overview-desktop.png'),full_page=True)
        desktop.locator('[data-action="new-place"]').first.click()
        desktop.locator('#place-form').wait_for()
        desktop.screenshot(path=str(OUT/'business-editor-desktop.png'),full_page=True)
        desktop.locator('#place-form input[name=en]').fill('Demo new place')
        assert desktop.locator('#place-form input[name=en]').input_value()=='Demo new place'
        desktop.locator('[data-action="view"][data-view="places"]').first.click()
        desktop.get_by_text('Northland Local Stay').first.wait_for()
        desktop.screenshot(path=str(OUT/'business-places-desktop.png'),full_page=True)
        phone=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
        phone.on('pageerror',lambda e:errors.append(str(e)))
        render_offline(phone,'business',mock)
        phone.get_by_text('Northland Local Stay').first.wait_for()
        phone.screenshot(path=str(OUT/'business-overview-mobile.png'),full_page=True)
        phone.locator('[data-action="new-place"]').first.click()
        phone.locator('#place-form').wait_for()
        phone.screenshot(path=str(OUT/'business-editor-mobile.png'),full_page=True)
        assert not phone.evaluate('document.documentElement.scrollWidth > innerWidth+2'),'Mobile editor overflow'
        admin=browser.new_page(viewport={'width':1440,'height':900})
        admin.on('pageerror',lambda e:errors.append(str(e)))
        render_offline(admin,'admin',moderation)
        admin.get_by_text('Mountain Roots Homestay').first.wait_for()
        admin.screenshot(path=str(OUT/'business-admin-desktop.png'),full_page=True)
        admin.locator('[data-tab="submissions"]').first.click()
        admin.get_by_text('Quiet Hills Stay').first.wait_for()
        admin.screenshot(path=str(OUT/'business-admin-proposals.png'),full_page=True)
        assert not errors,'Browser errors: '+str(errors)
        browser.close()
    print('PASS: actual portal JS rendered in Chromium offline fixtures, desktop + mobile + editor + moderation, 0 JS page errors and no horizontal overflow')

if __name__=='__main__':main()
