import os
import json
from browser_support import ARTIFACTS, ENGINES, environment
with environment() as (p, origin):
    for engine in ENGINES:
        browser = getattr(p, engine).launch()
        for size in [(844, 390), (912, 412), (1024, 768), (1440, 900), (2560, 1080)]:
            context = browser.new_context(viewport={'width': size[0], 'height': size[1]}, is_mobile=True, has_touch=True, service_workers='block')
            page = context.new_page()
            for folder in ['URPS_Ob_HUB', 'URPS_Ob_blocA', 'URPS_Ob_blocB', 'URPS_OnePage']:
                page.goto(origin + '/' + folder + '/index.html')
                page.wait_for_timeout(500)
                rect = page.locator('.urps-stage').bounding_box()
                assert abs(rect['width'] / rect['height'] - 16 / 9) < 0.01, (folder, rect)
                assert rect['x'] >= -1 and rect['y'] >= -1 and (rect['x'] + rect['width'] <= size[0] + 1) and (rect['y'] + rect['height'] <= size[1] + 1), (folder, size, rect)
                if folder == 'URPS_Ob_blocA':
                    page.locator('#btn-welcome-close').click()
                    for step in range(page.evaluate('STEPS.length')):
                        page.evaluate('(i)=>{currentStep=i;renderStep()}', step)
                        page.wait_for_timeout(450)
                        checks = page.locator('.option-card').evaluate_all('es=>es.map(e=>{const a=e.getBoundingClientRect();return [...e.children].every(c=>{const b=c.getBoundingClientRect();return !b.width || b.bottom<=a.bottom+1&&b.left>=a.left-1&&b.right<=a.right+1})})')
                        if not all(checks):
                            page.screenshot(path=os.path.join(ARTIFACTS, 'urps-fail.png'))
                            print(page.locator('.option-card').first.evaluate('e=>({card:e.getBoundingClientRect().toJSON(),children:[...e.children].map(c=>({name:c.className,rect:c.getBoundingClientRect().toJSON()}))})'))
                        assert all(checks), (engine, size, step, checks)
                    page.screenshot(path=os.path.join(ARTIFACTS, f'urps-layout-{engine}-{size[0]}.png'))
            context.close()
            print(engine, size, 'PASS', flush=True)
        browser.close()
