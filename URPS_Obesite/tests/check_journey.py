import os
import json
import csv as csv_parser
import io
from browser_support import ARTIFACTS, ENGINES, environment
with environment() as (p, origin):
    for engine in ENGINES:
        b = getattr(p, engine).launch()
        c = b.new_context(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, accept_downloads=True, service_workers='block')
        page = c.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(origin + '/URPS_OnePage/index.html')
        page.locator('.scene-loading').wait_for(state='hidden')
        hub = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_HUB/index.html')
        for sel in ['#specialty-select', '#department-select', '#environment-select', '#practice-type-select']:
            hub.locator(sel).select_option(index=1)
        hub.locator('#age-input').fill('40')
        hub.locator('[data-gender=femme]').click()
        hub.locator('.intro-submit').click()
        hub.locator('#hub-welcome-overlay').click()
        hub.locator('.door-main').click()
        page.wait_for_function('document.querySelector("[data-scene=blocA]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        a = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_blocA/index.html')
        a.locator('#btn-welcome-close').click()
        for i in range(a.evaluate('STEPS.length')):
            a.wait_for_function('(i)=>currentStep===i && !modalBackdrop.classList.contains("fading")', arg=i)
            a.locator('.option-card').last.click()
            a.locator('#btn-choose').click()
        a.locator('#btn-survey-close').click(timeout=12000)
        for i in range(a.evaluate('STEPS.length')):
            a.wait_for_function('(i)=>recapIndex===i && !recapAwaitingNext', arg=i)
            a.locator('#btn-equip-oui').click()
            a.locator('#btn-equip-oui').click()
        page.wait_for_function('document.querySelector("[data-scene=hub]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        hub.locator('#hub-welcome-overlay').click()
        hub.locator('.door-main').click()
        page.wait_for_function('document.querySelector("[data-scene=blocB]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        fb = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_blocB/index.html')
        fb.locator('#start-info-continue').click()
        for i in range(fb.evaluate('flatSteps.length')):
            step = fb.evaluate('flatSteps[stepIndex]')
            if step['type'] == 'question':
                if step.get('responseKind') == 'slider5':
                    fb.locator('.likert-slider').click()
                else:
                    fb.locator('.vq-opt').last.click()
                pending = fb.evaluate('pendingAnswer')
                page.evaluate('window.dispatchEvent(new Event("pageshow"))')
                page.locator('.scene-loading').wait_for(state='hidden')
                assert fb.evaluate('pendingAnswer') == pending
                fb.locator('#vq-confirm').click()
            elif step['type'] == 'dialogue':
                fb.locator('#dialog-text').click()
            elif step['type'] == 'narration':
                fb.locator('#narration-text').click()
            else:
                raise AssertionError(step)
        page.wait_for_function('document.querySelector("[data-scene=hub]").classList.contains("is-active")')
        page.locator('.scene-loading').wait_for(state='hidden')
        hub.locator('.hub-radar-category-btn').first.wait_for(state='visible')
        page.wait_for_timeout(500)
        assert hub.locator('.is-results-highlight').count() == 10, hub.locator('.is-results-highlight').count()
        page.screenshot(path=os.path.join(ARTIFACTS, f'urps-bilan-{engine}.png'))
        category = hub.locator('.hub-radar-category-btn').first
        key = category.get_attribute('data-result-control')
        category.click()
        assert hub.locator('.is-results-highlight').count() == 9
        hub.locator('#hub-category-close').click()
        with page.expect_download() as d:
            hub.locator('#hub-results-download').click()
        download = d.value
        assert download.suggested_filename == 'resultats_urps_obesite.csv'
        csv = open(download.path(), encoding='utf-8-sig').read()
        rows = list(csv_parser.reader(io.StringIO(csv), delimiter=';'))
        assert all(len(row) == 4 for row in rows)
        assert ['Âge', '40', '', ''] in rows
        assert len([row for row in rows if row[1] == 'Moyenne (scores corrigés)']) == 8
        # Eight choices, eight equipment answers and 22 consultation questions.
        timed = [row for row in rows[1:] if row[3] and row[1] != 'Moyenne (scores corrigés)']
        assert len(timed) == 38, timed
        assert all(float(row[3].replace(',', '.')) >= 0 for row in timed)
        assert hub.locator('.is-results-highlight').count() == 8
        page.evaluate('window.dispatchEvent(new Event("pageshow"))')
        page.locator('.scene-loading').wait_for(state='hidden')
        assert hub.locator('.is-results-highlight').count() == 8
        page.reload()
        page.locator('.scene-loading').wait_for(state='hidden')
        hub = page.frame(url=lambda value: value.split("?")[0] == origin + '/URPS_Ob_HUB/index.html')
        hub.locator('.hub-radar-category-btn').first.wait_for()
        assert hub.locator('.is-results-highlight').count() == 8
        page.emulate_media(reduced_motion='reduce')
        assert hub.locator('.is-results-highlight').first.evaluate('e=>getComputedStyle(e,"::before").animationName') == 'none'
        for link in hub.locator('[data-result-control^="resource:"]').all():
            with page.expect_popup() as opened:
                link.click()
            opened.value.close()
        assert hub.locator('.is-results-highlight').count() == 5
        # A new result, even with identical scores, starts a fresh visit history.
        hub.evaluate('''() => {
            const payload = JSON.parse(sessionStorage.getItem('urps_ob_bloc_b_results_saved'));
            payload.resultId = crypto.randomUUID();
            sessionStorage.setItem('urps_ob_bloc_b_results', JSON.stringify(payload));
        }''')
        page.evaluate('window.dispatchEvent(new Event("pageshow"))')
        page.locator('.scene-loading').wait_for(state='hidden')
        assert hub.locator('.is-results-highlight').count() == 10
        assert not errors, errors
        print(engine, 'FULL JOURNEY + 10 halos + visited persistence + CSV + reduced motion PASS', flush=True)
        c.close()
        b.close()
