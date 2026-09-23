import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'tools'))
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors, failures = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: failures.append({'status': r.status, 'url': r.url}) if r.status >= 400 else None)
    page.goto('http://127.0.0.1:8000', wait_until='domcontentloaded')
    page.wait_for_timeout(1800)
    for width in [1440, 1024, 901, 900, 768, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.wait_for_timeout(100)
        print(json.dumps(page.evaluate('''() => ({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('body *')].filter(el=>{let r=el.getBoundingClientRect();return r.width && (r.right>innerWidth+1 || r.left< -1) && getComputedStyle(el).position!=='absolute'}).slice(0,12).map(el=>el.tagName+'.'+el.className)})''')))
    page.set_viewport_size({'width':1440,'height':900})
    page.screenshot(path='.dist/desktop-before.png')
    for section in ['product-engineering','digital-engineering','process','about','portfolio','contact']:
        page.locator('.menu a[href="#'+section+'"]').click()
        page.wait_for_timeout(1000)
        print(section, page.evaluate('location.hash'))
    print('ERRORS', json.dumps(errors))
    print('HTTP FAILURES', json.dumps(failures))
    print('BROKEN IMAGES', page.evaluate('''() => [...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)'''))
    browser.close()
