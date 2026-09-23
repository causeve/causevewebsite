import sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'tools'))
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8000',wait_until='domcontentloaded')
    carousel=page.locator('.hero-visual')
    pause=page.locator('[data-carousel="pause"]')
    expect(carousel).to_have_attribute('data-slide','2',timeout=12000)
    pause.click()
    expect(pause).to_have_attribute('aria-label','Play image slideshow')
    page.wait_for_timeout(900)
    seen=set()
    for i in range(10):
        active=page.locator('.hero-slide.is-active')
        assert active.evaluate('(img)=>img.complete && img.naturalWidth > 0')
        seen.add(active.get_attribute('src'))
        before=int(carousel.get_attribute('data-slide'))
        page.locator('[data-carousel="next"]').click()
        expect(carousel).to_have_attribute('data-slide',str(before%10+1))
        page.wait_for_timeout(800)
    assert len(seen)==10,seen
    held=carousel.get_attribute('data-slide')
    page.wait_for_timeout(5300)
    assert carousel.get_attribute('data-slide')==held
    page.locator('[data-carousel="previous"]').click()
    expect(carousel).to_have_attribute('data-slide','1')
    pause.click()
    expect(carousel).to_have_attribute('data-slide','2',timeout=8000)
    page.emulate_media(reduced_motion='reduce')
    expect(pause).to_have_attribute('aria-label','Play image slideshow')
    page.set_viewport_size({'width':390,'height':844})
    carousel.scroll_into_view_if_needed()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path='.dist/carousel-mobile.png')
    page.set_viewport_size({'width':1440,'height':900})
    for _ in range(7):
        before=int(carousel.get_attribute('data-slide'))
        page.locator('[data-carousel="next"]').click()
        expect(carousel).to_have_attribute('data-slide',str(before%10+1))
        page.wait_for_timeout(100)
    page.screenshot(path='.dist/carousel-photo.png')
    assert not errors,errors
    print(json.dumps({'result':'PASS','unique_images':len(seen),'checks':['automatic rotation','10-image loop','pause/resume','previous/next','reduced motion','mobile overflow','no JavaScript errors']}))
    browser.close()
