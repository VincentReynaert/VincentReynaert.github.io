"""Inspect questions before Playwright can auto-scroll a control into view."""
from browser_support import ARTIFACTS, ENGINES, environment

with environment() as (p, origin):
    for engine in ENGINES:
        browser = getattr(p, engine).launch()
        for width, height in [(844, 390), (844, 300), (650, 280)]:
            context = browser.new_context(viewport={"width": width, "height": height}, is_mobile=True, has_touch=True,
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1")
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(origin + "/URPS_Ob_blocB/index.html")
            page.locator("#start-info-continue").click()
            questions = page.evaluate("flatSteps.map((s,i)=>s.type==='question'?i:-1).filter(i=>i>=0)")
            assert len(questions) == 22
            for index in questions:
                # Simulate reaching the bottom of the preceding long question.
                page.locator(".question-scroll").evaluate("e => e.scrollTop = e.scrollHeight")
                page.evaluate("i => { stepIndex = i; renderStep(); }", index)
                page.wait_for_timeout(350)
                state = page.locator(".question-scroll").evaluate("""e => {
                    const q = e.querySelector('#vq-question');
                    const r = q.getBoundingClientRect(), box = e.getBoundingClientRect();
                    return { top: e.scrollTop, height: e.clientHeight, text: q.textContent,
                        headingVisible: r.top >= box.top - 1 && r.top < box.bottom - 10,
                        controls: e.querySelectorAll('button, input').length };
                }""")
                assert state["top"] == 0 and state["headingVisible"] and state["text"] and state["controls"] > 0, (engine, index, state)
                if index in (38, 40):
                    page.screenshot(path=str(ARTIFACTS / f"question-{engine}-{width}-{height}-{index}.png"))
                slider = page.locator(".likert-slider")
                if slider.count():
                    slider.click()
                else:
                    page.locator(".vq-opt").last.click()
                assert page.locator("#vq-confirm").is_visible()
                assert page.locator("#vq-confirm").evaluate("""e => {
                    const r=e.getBoundingClientRect(), p=e.closest('.vn-question-panel').getBoundingClientRect();
                    return r.bottom <= p.bottom + 1 && r.top >= p.top;
                }""")
            assert not errors, errors
            context.close()
            print(engine, width, height, "22 questions visible before interaction PASS", flush=True)
        browser.close()
