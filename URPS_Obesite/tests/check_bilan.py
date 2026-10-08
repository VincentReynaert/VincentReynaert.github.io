import os
import json
from browser_support import ARTIFACTS, ENGINES, environment
with environment() as (p, origin):
    for engine in ENGINES:
        b = getattr(p, engine).launch()
        for w, h in [(844, 390), (912, 412), (1440, 900)]:
            page = b.new_page(viewport={'width': w, 'height': h})
            page.goto(origin + '/URPS_Ob_HUB/index.html')
            page.evaluate("()=>{document.getElementById('intro-panel').classList.add('is-hidden');sessionStorage.setItem('urps_ob_hub_progress','blocB_completed');const labels=['Plainte et poids','Mesure du poids','Communication','Accompagnement','Stigmatisation','Parcours de soins'];sessionStorage.setItem('urps_ob_bloc_b_results',JSON.stringify({resultId:'test',scores:['plainte','mesure','communication','accompagnement','stigmatisation','parcours'].map((key,i)=>({key,label:labels[i],score:60})),details:{}}));resolveDoorState();maybeShowHubResults();}")
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(ARTIFACTS, f'urps-bilan-new-{engine}-{w}.png'))
            rects = page.locator('[data-result-control],.hub-results-click-hint').evaluate_all('es=>es.map(e=>({key:e.dataset.resultControl||"hint",...e.getBoundingClientRect().toJSON()}))')
            overlaps = []
            for i, a in enumerate(rects):
                for q in rects[i + 1:]:
                    if min(a['right'], q['right']) - max(a['left'], q['left']) > 1 and min(a['bottom'], q['bottom']) - max(a['top'], q['top']) > 1:
                        overlaps.append((a['key'], q['key']))
            assert not overlaps, (engine, w, overlaps)
            # Check text overflow and proportions, not just control rectangles.
            assert page.locator('.hub-radar-category-btn').evaluate_all('''es => es.every(e => {
                const stage = document.getElementById('hub-stage').getBoundingClientRect();
                const r = e.getBoundingClientRect();
                const text = document.createRange();
                text.selectNodeContents(e);
                const containedText = [...text.getClientRects()].every(t => t.left >= r.left - 1 && t.right <= r.right + 1);
                return containedText && r.width <= stage.width * .106 &&
                    r.left >= stage.left && r.right <= stage.right && r.top >= stage.top && r.bottom <= stage.bottom;
            })''')
            assert page.locator('.hub-results-actions').evaluate('''e => {
                const stage=document.getElementById('hub-stage').getBoundingClientRect(), r=e.getBoundingClientRect();
                return r.width <= stage.width * .28 && r.bottom <= stage.bottom;
            }''')
            for i in range(6):
                page.locator('.hub-radar-category-btn').nth(i).click()
                page.locator('#hub-category-close').click()
            assert page.locator('.is-results-highlight').count() == 4
            page.close()
            print(engine, w, 'bilan geometry and six category clicks PASS', flush=True)
        b.close()
