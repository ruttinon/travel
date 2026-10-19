"""End-to-end local Business Portal and Admin UI test using actual Chromium.
Optional: python tests/business_ui.py (requires Python Playwright and system Chromium).
"""
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import threading
import time
import urllib.request
import urllib.error
import urllib.parse
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
PORT=5188
BASE=f'http://127.0.0.1:{PORT}'
BROWSER=BASE
SHOT=ROOT/'screenshots-v2.5'
SHOT.mkdir(exist_ok=True)
OUTPUT=[]

def http(path,method='GET',body=None,headers=None):
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request(BASE+path,data=data,method=method,headers={'Content-Type':'application/json',**(headers or {})})
    with urllib.request.urlopen(req,timeout=8) as resp:
        return json.load(resp)

def browser_proxy(route):
    request=route.request
    url=urllib.parse.urlsplit(request.url)
    if url.hostname!='unfold.invalid':
        route.abort()
        return
    headers={k:v for k,v in request.headers.items() if k.lower() not in ('host','content-length','origin','referer','accept-encoding')}
    if 'origin' in request.headers:headers['origin']=BASE
    data=request.post_data_buffer
    upstream=urllib.request.Request(BASE+url.path+('?' + url.query if url.query else ''), data=data,method=request.method, headers=headers)
    try:resp=urllib.request.urlopen(upstream,timeout=15)
    except urllib.error.HTTPError as exc:resp=exc
    with resp:
        content=resp.read()
        outheaders={}
        for h in ('Content-Type','Set-Cookie','Cache-Control','X-Content-Type-Options'):
            if resp.headers.get(h):outheaders[h]=resp.headers[h]
        route.fulfill(status=resp.status,headers=outheaders,body=content)

def run():
    with tempfile.TemporaryDirectory(prefix='unfold-ui-') as data_dir:
        env=os.environ.copy()
        env.update(UNFOLD_DATA_DIR=data_dir,PORT=str(PORT),UNFOLD_NO_BROWSER='1')
        proc=subprocess.Popen(['node','server.js'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
        def capture():
            for line in iter(proc.stdout.readline,''):
                OUTPUT.append(line)
        thread=threading.Thread(target=capture,daemon=True)
        thread.start()
        try:
            for _ in range(120):
                if any('[READY]' in line for line in OUTPUT):break
                if proc.poll() is not None:raise RuntimeError('Server exited: '+''.join(OUTPUT))
                time.sleep(.1)
            else:raise RuntimeError('Server timeout: '+''.join(OUTPUT))
            setup=re.search(r'\[FIRST TIME SETUP\][\s\S]*?\n\s+([a-f0-9]{18})',''.join(OUTPUT))
            assert setup,'Admin first-time setup token required'
            errors=[]
            with sync_playwright() as p:
                browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
                desktop=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
                # No browser proxy: this is the real-host integration check
                page=desktop.new_page()
                page.on('pageerror',lambda err:errors.append(str(err)))
                page.goto(BROWSER+'/business.html',wait_until='domcontentloaded')
                page.get_by_text('Welcome to unfold.').wait_for()
                page.screenshot(path=str(SHOT/'business-login-desktop.png'),full_page=True)
                page.locator('[data-action="auth-mode"][data-mode="register"]').click()
                page.locator('#auth-form [name=name]').fill('Mountain Family')
                page.locator('#auth-form [name=email]').fill('mountain@example.com')
                page.locator('#auth-form [name=password]').fill('long-secure-password-2026')
                page.locator('#auth-form button[type=submit]').click()
                page.locator('#profile-form [name=name]').wait_for(timeout=7000)
                page.locator('#profile-form [name=name]').fill('Mountain Family Homestay')
                page.locator('#profile-form [name=type]').select_option('stay')
                page.locator('#profile-form [name=contactEmail]').fill('business@example.com')
                page.locator('#profile-form [name=phone]').fill('+66 80 888 9999')
                page.locator('#profile-form [name=description]').fill('A small family home surrounded by quiet nature.')
                page.locator('#profile-form button[type=submit]').click()
                page.get_by_text('Waiting for review').wait_for(timeout=7000)
                page.screenshot(path=str(SHOT/'business-pending-desktop.png'),full_page=True)
                # Verify actual emailed token in local dev server output, using public verify API.
                for _ in range(70):
                    token=re.search(r'\[DEV MAIL VERIFY\] mountain@example.com http://[^\s]+\?verify=([a-f0-9]{64})',''.join(OUTPUT))
                    if token:break
                    time.sleep(.1)
                assert token,'missing verification token'
                assert http('/api/auth/verify',method='POST',body={'token':token[1]})['ok']
                admin_context=browser.new_context(viewport={'width':1440,'height':900})
                # Real-host integration check
                admin=admin_context.new_page()
                admin.on('pageerror',lambda err:errors.append(str(err)))
                admin.goto(BROWSER+'/admin.html',wait_until='domcontentloaded')
                admin.locator('#auth-form [name=setupToken]').wait_for(timeout=7000)
                admin.locator('#auth-form [name=setupToken]').fill(setup[1])
                admin.locator('#auth-form [name=password]').fill('admin-password-very-long-2026')
                admin.locator('#auth-form [name=confirm]').fill('admin-password-very-long-2026')
                admin.locator('#auth-form button[type=submit]').click()
                admin.locator('.dashboard').wait_for(timeout=7000)
                admin.goto(BROWSER+'/business-admin.html',wait_until='domcontentloaded')
                admin.get_by_text('Business reviews.').wait_for(timeout=7000)
                admin.screenshot(path=str(SHOT/'business-admin-queue.png'),full_page=True)
                admin.locator('[data-type=business][data-status=approved]').first.click()
                admin.get_by_text('Approved businesses').wait_for(timeout=7000)
                page.reload()
                page.get_by_text('Mountain Family Homestay').wait_for(timeout=7000)
                page.get_by_role('button',name='+ Add a place').first.click()
                page.locator('#place-form').wait_for(timeout=7000)
                page.screenshot(path=str(SHOT/'business-editor-desktop.png'),full_page=True)
                page.locator('#cover-upload').set_input_files(str(ROOT/'assets'/'terraced-fields.webp'))
                page.locator('.photo-preview img').wait_for(timeout=7000)
                page.locator('#place-form input[name=en]').fill('Hilltop Hidden Retreat')
                page.locator('#place-form input[name=th]').fill('บ้านพักวิวภูเขา')
                page.locator('#place-form input[name=locEn]').fill('Mae Hong Son, Thailand')
                page.locator('#place-form input[name=locTh]').fill('แม่ฮ่องสอน')
                page.locator('#place-form select[name=category]').select_option('stay')
                page.locator('#place-form input[name=lat]').fill('19.30')
                page.locator('#place-form input[name=lon]').fill('97.97')
                page.locator('#place-form textarea[name=storyEn]').fill('Family-run mountain homestay.')
                page.locator('#place-form button[value=submit]').click()
                page.get_by_text('Hilltop Hidden Retreat').wait_for(timeout=7000)
                # Must remain unpublished until an explicit Admin action.
                assert not http('/api/places')['places']
                admin.get_by_role('button',name='Place requests').click()
                admin.get_by_text('Hilltop Hidden Retreat').wait_for(timeout=7000)
                admin.screenshot(path=str(SHOT/'business-admin-proposal.png'),full_page=True)
                admin.once('dialog',lambda dialog:dialog.accept())
                admin.locator('[data-type=submission][data-status=approved]').first.click()
                for _ in range(35):
                    if len(http('/api/places')['places'])==1:break
                    time.sleep(.1)
                assert http('/api/places')['places'][0]['en']=='Hilltop Hidden Retreat'
                page.reload()
                page.get_by_text('Hilltop Hidden Retreat').first.wait_for(timeout=7000)
                page.screenshot(path=str(SHOT/'business-overview-desktop.png'),full_page=True)
                mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
                # Real-host integration check
                m=mobile.new_page()
                m.on('pageerror',lambda err:errors.append(str(err)))
                m.goto(BROWSER+'/business.html',wait_until='domcontentloaded')
                m.get_by_text('Welcome to unfold.').wait_for(timeout=7000)
                m.screenshot(path=str(SHOT/'business-login-mobile.png'),full_page=True)
                m.locator('#auth-form [name=email]').fill('mountain@example.com')
                m.locator('#auth-form [name=password]').fill('long-secure-password-2026')
                m.locator('#auth-form button[type=submit]').click()
                m.get_by_text('Hilltop Hidden Retreat').wait_for(timeout=7000)
                m.screenshot(path=str(SHOT/'business-overview-mobile.png'),full_page=True)
                m.get_by_role('button',name='+ Add a place').first.click()
                m.locator('#place-form').wait_for(timeout=7000)
                m.screenshot(path=str(SHOT/'business-editor-mobile.png'),full_page=True)
                # No horizontal overflow on actual small screen.
                overflow=m.evaluate('document.documentElement.scrollWidth > innerWidth + 2')
                assert not overflow,'Business editor should not overflow phone width'
                assert not errors,'Browser errors: '+'; '.join(errors)
                browser.close()
            print('PASS: Business Portal desktop/mobile + Admin decisions + image upload + publish + 0 page errors')
        finally:
            proc.terminate()
            try:proc.wait(timeout=4)
            except subprocess.TimeoutExpired:proc.kill()
if __name__=='__main__':run()
