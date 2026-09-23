import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'tools'))
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':390,'height':844})
    page.goto('http://127.0.0.1:8000',wait_until='domcontentloaded')
    for target in ['contact','home']:
        page.locator('#hamburger').click()
        page.locator('#mobileNav a[href="#'+target+'"]').click()
        page.wait_for_timeout(6000)
        print(target, page.evaluate('''() => ({scrollY, bodyScroll: document.body.scrollTop, hash:location.hash, header:document.querySelector('header').getBoundingClientRect().toJSON(), hero:document.querySelector('#home').getBoundingClientRect().toJSON(), body:document.body.getBoundingClientRect().toJSON(), scrolling:document.scrollingElement.tagName, htmlOverflow:getComputedStyle(document.documentElement).overflow, bodyOverflow:getComputedStyle(document.body).overflow})'''),flush=True)
    browser.close()
