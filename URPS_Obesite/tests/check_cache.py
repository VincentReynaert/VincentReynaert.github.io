from browser_support import ENGINES, ROOT, environment

with environment() as (p, origin):
    # Chromium supports service workers in this test environment; WebKit is
    # exercised by the other suites, including readiness and real UI clicks.
    browser = p.chromium.launch()
    context = browser.new_context()
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(origin + "/index.html")
    page.evaluate("""async () => {
      await caches.open('unrelated-app');
      await caches.open('urps-obesite-onepage-v2');
      const old = await caches.open('urps-obesite-hub-v4');
      await old.put('/URPS_Ob_HUB/Hub.css', new Response('.intro-select{min-height:100em}'));
    }""")
    page.goto(origin + "/URPS_OnePage/index.html")
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    hub = page.frame(url=lambda value: value.split("?")[0] == origin + "/URPS_Ob_HUB/index.html")
    hub.wait_for_function("navigator.serviceWorker.controller !== null")
    page.wait_for_function("""async () => {
      const keys = await caches.keys();
      return keys.includes('urps-obesite-hub-20261008-r1') &&
        keys.includes('urps-obesite-onepage-20261008-r1') &&
        !keys.includes('urps-obesite-hub-v4') && !keys.includes('urps-obesite-onepage-v2');
    }""")
    assert "unrelated-app" in page.evaluate("caches.keys()")
    # All four HTML shells must reference the same version of shared code.
    for folder in ["URPS_OnePage", "URPS_Ob_HUB", "URPS_Ob_blocA", "URPS_Ob_blocB"]:
        html = (ROOT / folder / "index.html").read_text(encoding="utf-8")
        assert "../shared/scene-runtime.js?v=20261008-r1" in html
        assert "../shared/scene-layout.css?v=20261008-r1" in html
    shared = "/shared/scene-layout.css?v=20261008-r1"
    page.evaluate("""async path => {
      const cache = await caches.open('urps-obesite-onepage-20261008-r1');
      await cache.put(path, new Response('STALE'));
    }""", shared)
    fresh = page.evaluate("path => fetch(path).then(r => r.text())", shared)
    assert ".urps-stage" in fresh
    context.set_offline(True)
    assert page.evaluate("path => fetch(path).then(r => r.text())", shared) == fresh
    html = page.evaluate("fetch('index.html?scene=blocB').then(r => r.text())")
    assert 'data-scene="host"' in html
    assert not errors, errors
    context.close()
    browser.close()
    print("Cache: upgrade, scoped cleanup, fresh shared assets and offline fallback PASS", flush=True)

    for engine in ENGINES:
        browser = getattr(p, engine).launch()
        context = browser.new_context(viewport={"width": 844, "height": 390}, service_workers="block")
        page = context.new_page()
        held = []
        page.route("**/scenario.json?*", lambda route: held.append(route))
        page.goto(origin + "/URPS_OnePage/index.html?scene=blocB", wait_until="domcontentloaded")
        page.locator(".scene-loading").wait_for(state="visible")
        assert page.locator('[data-scene="blocB"]').evaluate("e => e.inert")
        # Process events until the delayed scenario request is intercepted.
        for _ in range(50):
            if held:
                break
            page.wait_for_timeout(100)
        assert held, "Scenario request was not intercepted"
        held[0].fulfill(path=str(ROOT / "URPS_Ob_blocB/scenario.json"), content_type="application/json")
        page.locator(".scene-loading").wait_for(state="hidden")
        page.frame_locator('[data-scene="blocB"]').locator("#start-info-continue").click()
        assert not page.locator('[data-scene="blocB"]').evaluate("e => e.inert")
        context.close()

        # A deactivation can arrive while a child is still parsing its head.
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        held = []
        page.route("**/delayed-head.js", lambda route: held.append(route))
        original = (ROOT / "URPS_Ob_blocB/index.html").read_text(encoding="utf-8")
        slow_html = original.replace("</script>", '</script><script src="/delayed-head.js"></script>', 1)
        page.route("**/URPS_Ob_blocB/index.html*", lambda route: route.fulfill(body=slow_html, content_type="text/html"))
        page.goto(origin + "/URPS_OnePage/index.html", wait_until="domcontentloaded")
        for _ in range(50):
            if held:
                break
            page.wait_for_timeout(100)
        assert held
        child = page.frame(url=lambda value: value.split("?")[0] == origin + "/URPS_Ob_blocB/index.html")
        assert child.evaluate("document.body === null")
        page.evaluate('document.querySelector("[data-scene=blocB]").contentWindow.postMessage({type:"urps:scene-deactivated"},location.origin)')
        page.wait_for_timeout(100)
        held[0].fulfill(body="", content_type="application/javascript")
        child.wait_for_function("document.body && document.body.inert")
        assert not errors, errors
        context.close()

        # The iOS installation gate is accessible above the portrait reminder.
        context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1")
        page = context.new_page()
        page.goto(origin + "/URPS_OnePage/index.html")
        assert page.locator("#install-gate").is_visible()
        assert page.locator("#install-gate").evaluate("e => Number(getComputedStyle(e).zIndex)") > 900
        page.goto(origin + "/URPS_Ob_HUB/index.html")
        page.get_by_role("button", name="Installer sur iPhone ou iPad").click()
        page.locator("#install-help-close").click()
        assert page.locator("#install-help").is_hidden()
        context.close()
        browser.close()
        print(engine, "delayed scene readiness and portrait installation help PASS", flush=True)
