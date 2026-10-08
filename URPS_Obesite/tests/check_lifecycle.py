import os
import json
from browser_support import ARTIFACTS, ENGINES, environment
with environment() as (p, origin):
    for engine in ENGINES:
        b = getattr(p, engine).launch()
        c = b.new_context(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, user_agent='Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' if engine == 'chromium' else 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', service_workers='block')
        c.add_init_script('Object.defineProperty(navigator,"standalone",{get:()=>true})')
        page = c.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(origin + '/URPS_OnePage/index.html')
        page.locator('.scene-loading').wait_for(state='hidden')
        hub = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_HUB/index.html')
        for sel in ['#specialty-select', '#department-select', '#environment-select', '#practice-type-select']:
            hub.locator(sel).select_option(index=1)
        hub.locator('#age-input').fill('40')
        hub.locator('[data-gender=homme]').click()
        hub.locator('.intro-submit').click()
        page.locator('.scene-loading').wait_for(state='hidden')
        hub.locator('#hub-welcome-overlay').click()
        hub.locator('.door-main').click()
        page.wait_for_function('document.querySelector("[data-scene=blocA]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        a = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_blocA/index.html')
        a.locator('#btn-welcome-close').click()
        if engine == 'chromium':
            assert page.evaluate('document.fullscreenElement?.tagName') == 'HTML'
        hub.evaluate('parent.postMessage({type:"urps:navigate",scene:"blocB"},location.origin)')
        page.wait_for_timeout(150)
        assert page.locator('[data-scene=blocA]').get_attribute('class').find('is-active') >= 0
        a.locator('.option-card').first.click()
        assert a.locator('#btn-choose').is_enabled()
        if engine == 'chromium':
            page.evaluate('document.exitFullscreen()')
        page.set_viewport_size({'width': 390, 'height': 844})
        page.locator('.orientation-gate').wait_for(state='visible', timeout=3000)
        assert page.locator('#onepage').evaluate('e=>e.inert')
        page.set_viewport_size({'width': 844, 'height': 390})
        page.locator('.orientation-gate').wait_for(state='hidden')
        page.locator('.scene-loading').wait_for(state='hidden')
        assert a.locator('#btn-choose').is_enabled()
        a.evaluate('sessionStorage.setItem("urps_ob_hub_progress","blocA_completed");parent.postMessage({type:"urps:navigate",scene:"hub"},location.origin)')
        page.wait_for_function('document.querySelector("[data-scene=hub]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        hub.locator('#hub-welcome-overlay').click()
        hub.locator('.door-main').click()
        page.wait_for_function('document.querySelector("[data-scene=blocB]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        fb = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_blocB/index.html')
        fb.locator('#start-info-continue').click()
        for _ in range(3):
            page.evaluate('window.dispatchEvent(new Event("pageshow"))')
            page.locator('.scene-loading').wait_for(state='hidden')
        assert not errors, errors
        print(engine, 'lifecycle, fullscreen, inactive messages, portrait, resume PASS', flush=True)
        c.close()
        b.close()
