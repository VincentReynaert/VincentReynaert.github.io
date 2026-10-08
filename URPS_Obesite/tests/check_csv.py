"""Verify corrected scores, response latency and the four-column XLSX contract."""
from openpyxl import load_workbook
from browser_support import ENGINES, environment

with environment() as (p, origin):
    for engine in ENGINES:
        browser = getattr(p, engine).launch()
        page = browser.new_page(viewport={"width": 1000, "height": 600})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(origin + "/URPS_Ob_blocB/index.html")
        page.locator("#start-info-continue").click()
        page.evaluate("""() => {
            stepIndex = flatSteps.findIndex(s => s.type === 'question' && s.reverseScore && s.responseKind !== 'slider5');
            renderStep(); questionShownAt = performance.now() - 2500;
        }""")
        page.locator(".vq-opt").last.click()
        first_time = page.evaluate("responseTimes[flatSteps[stepIndex].id]")
        assert 2.5 <= first_time < 5
        page.locator(".vq-opt").first.click()
        assert page.evaluate("responseTimes[flatSteps[stepIndex].id]") == first_time
        step = page.evaluate("flatSteps[stepIndex]")
        page.locator("#vq-confirm").click()
        details = page.evaluate("key => buildCategoryDetailsData(key)", step["category"])
        assert details[0]["numericValue"] == 5 and details[0]["rawValue"] == 1
        assert details[0]["question"] == step.get("question", step.get("text"))
        assert details[0]["responseSeconds"] == first_time
        page.evaluate("""() => {
            stepIndex = flatSteps.findIndex(s => s.responseKind === 'slider5');
            renderStep(); questionShownAt = performance.now() - 1000;
        }""")
        page.locator(".likert-slider").click()
        assert 1 <= page.evaluate("responseTimes[flatSteps[stepIndex].id]") < 4

        page.goto(origin + "/URPS_Ob_HUB/index.html")
        question = 'Question avec ; et "guillemets"\nDeuxième ligne'
        page.evaluate("""question => {
            sessionStorage.setItem('urps_ob_age', '42');
            sessionStorage.setItem('urps_ob_bloc_a_details', JSON.stringify([
                {label:'Aménagement', questions:[{question:'Choix de table', answer:'Table large', responseSeconds:2}]}
            ]));
            hubResultsPayload = {scores:[{key:'test',label:'Catégorie test'}, {key:'missing',label:'Ancien résultat'}], details:{
                test:[
                    {question,answer:'Réponse ; "oui"',numericValue:1,responseSeconds:1.25},
                    {question:'Q2',answer:'Oui',numericValue:3,responseSeconds:2.5},
                    {question:'Q3',answer:'Libre',numericValue:null,responseSeconds:4},
                    {question:'Q4',answer:'Oui',numericValue:5,responseSeconds:0}
                ], missing:[{feedbackTitle:'Ancienne question',answer:'Oui'}]
            }};
        }""", question)
        with page.expect_download() as download:
            page.evaluate("URPSResultsExport.excel(buildResultsRows())")
        assert download.value.suggested_filename.endswith('.xlsx')
        with open(download.value.path(), 'rb') as file:
            sheet = load_workbook(file).active
            rows = [[v if v is not None else "" for v in row] for row in sheet.values]
        assert all(len(row) == 4 for row in rows)
        assert rows[0] == ["Question", "Réponse", "Valeur numérique associée", "Temps de réponse (secondes)"]
        assert ["Âge", "42", "", ""] in rows
        assert len(rows[2:8]) == 6
        assert [question, 'Réponse ; "oui"', 1, 1.25] in rows
        assert ["Catégorie test", "Moyenne (scores corrigés)", 3, 7.75] in rows
        assert ["Catégorie test", "SD (écart-type, n-1)", 2, ""] in rows
        assert ["Aménagement", "Moyenne (scores corrigés)", "", 2] in rows
        assert ["Ancien résultat", "Moyenne (scores corrigés)", "", ""] in rows
        assert not errors, errors
        browser.close()
        print(engine, "XLSX columns, demographics, corrected scores, SD, times and escaping PASS", flush=True)
