import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'tools'))
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width':1440, 'height':900})
    page = context.new_page()
    errors, failures = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: failures.append(r.url) if r.status >= 400 and r.url.startswith('http://127.0.0.1') else None)
    page.goto('http://127.0.0.1:8000', wait_until='domcontentloaded')
    page.wait_for_timeout(1200)
    assert page.locator('.client-logo').count() == 10
    assert page.locator('main #contact').count() == 1
    for section in ['product-engineering','digital-engineering','process','about','portfolio','contact']:
        page.locator('.menu a[href="#'+section+'"]').click()
        page.wait_for_function('(id) => location.hash === "#"+id && Math.abs(document.getElementById(id).getBoundingClientRect().top-document.querySelector("header").offsetHeight-8)<16', arg=section)
        expect(page.locator('.menu a[aria-current="location"]')).to_have_attribute('href', '#'+section)
    for selector in ['.product-reveal-card','.digital-reveal-card']:
        card = page.locator(selector).first
        card.scroll_into_view_if_needed()
        card.focus()
        card.press('Enter')
        assert card.get_attribute('aria-expanded') == 'true'
        card.press('Space')
        assert card.get_attribute('aria-expanded') == 'false'
    page.locator('#themeToggle').click()
    assert page.locator('html').get_attribute('data-theme') == 'dark'
    page.reload(wait_until='domcontentloaded')
    assert page.locator('html').get_attribute('data-theme') == 'dark'
    page.locator('.menu a[href="#home"]').click()
    page.wait_for_timeout(1000)
    page.screenshot(path='.dist/desktop-dark.png')
    page.locator('#themeToggle').click()
    for width in [1440,1024,901,900,768,390,320]:
        page.set_viewport_size({'width':width,'height':850})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#hamburger').click()
    assert page.locator('#scrim').evaluate('(el)=>el.getBoundingClientRect().height >= innerHeight')
    page.mouse.click(10,800)
    assert page.locator('#hamburger').get_attribute('aria-expanded') == 'false'
    page.locator('#hamburger').click()
    page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement === document.querySelector("#mobileNav a")')
    page.keyboard.press('Shift+Tab')
    assert page.evaluate('document.activeElement === [...document.querySelectorAll("#mobileNav a")].at(-1)')
    page.keyboard.press('Escape')
    assert page.locator('#hamburger').get_attribute('aria-expanded') == 'false'
    assert page.evaluate('document.activeElement.id') == 'hamburger'
    page.locator('#hamburger').click()
    page.set_viewport_size({'width':1200,'height':850})
    page.wait_for_timeout(100)
    assert page.evaluate('document.body.style.overflow') == ''
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#hamburger').click()
    page.locator('#mobileNav a[href="#contact"]').click()
    page.wait_for_timeout(1200)
    assert page.locator('#hamburger').get_attribute('aria-expanded') == 'false'
    assert page.evaluate('location.hash') == '#contact'
    page.locator('#hamburger').click()
    page.locator('#mobileNav a[href="#home"]').click()
    page.wait_for_function('scrollY < 2')
    page.wait_for_timeout(300)
    page.screenshot(path='.dist/mobile-light.png')
    page.set_viewport_size({'width':390,'height':400})
    page.locator('#hamburger').click()
    assert page.locator('#mobileNav').evaluate('(el)=>el.getBoundingClientRect().bottom <= innerHeight')
    page.locator('#mobileNav a[href="#contact"]').click()
    page.emulate_media(reduced_motion='reduce')
    page.set_viewport_size({'width':1440,'height':900})
    page.goto('http://127.0.0.1:8000/#about',wait_until='domcontentloaded')
    page.wait_for_timeout(1200)
    assert page.evaluate('location.hash') == '#about'
    page.evaluate('() => {window.scrollBehaviors=[]; const originalScrollTo=window.scrollTo; window.scrollTo=function(options){window.scrollBehaviors.push(options.behavior); return originalScrollTo.call(this,options)}}')
    page.locator('.menu a[href="#home"]').click()
    assert page.evaluate('window.scrollBehaviors.every(x=>x==="auto")')
    page.screenshot(path='.dist/desktop-light.png')
    page.evaluate('location.hash="[invalid"')
    page.wait_for_timeout(200)
    assert not errors, errors
    assert not failures, failures
    assert not page.evaluate('Array.from(document.images).some(i=>i.complete&&!i.naturalWidth)')
    print(json.dumps({'result':'PASS','checks':['seven responsive widths','all section links','keyboard cards','theme persistence','mobile menu keyboard and resize','short-screen menu scrolling','deep links and invalid fragments','reduced motion','no JavaScript errors or local HTTP failures']}))
    browser.close()
