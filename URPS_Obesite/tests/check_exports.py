"""Validate PDF pagination/content and native file sharing without sending anything."""
from pypdf import PdfReader
from browser_support import ENGINES, environment

with environment() as (p, origin):
    for engine in ENGINES:
        browser = getattr(p, engine).launch()
        page = browser.new_page(accept_downloads=True)
        page.goto(origin + '/URPS_Ob_HUB/index.html')
        page.evaluate('''() => {
          hubResultsPayload = {scores: [{key:'plainte', label:'Plainte et poids', score:60, count:2}],
            details: {plainte: [
              {question:'Une question accentuée ?', answer:'Réponse choisie', numericValue:3, scoreMax:5,
               feedbackTitle:'Retour pédagogique', feedback:'Explication détaillée. '.repeat(300) + 'FIN DU RETOUR'},
              {question:'Question sans score', answer:'Libre', numericValue:null, feedback:'FIN DU BILAN'}
            ]}};
        }''')
        with page.expect_download() as download:
            page.evaluate('downloadResultsPdf()')
        pdf = PdfReader(download.value.path())
        text = '\n'.join(p.extract_text() for p in pdf.pages)
        assert len(pdf.pages) > 2
        for expected in ['Plainte et poids', '60 / 100', '3 / 5', 'Non scoré',
                         'Réponse choisie', 'Retour pédagogique', 'FIN DU RETOUR', 'FIN DU BILAN']:
            assert expected in text, expected
        # Every text baseline must remain within the page, including long feedback.
        for pdf_page in pdf.pages:
            def check_position(text, cm, tm, font, size):
                if text.strip():
                    assert 10 <= tm[5] <= 830, (text, tm[5])
            pdf_page.extract_text(visitor_text=check_position)
        result = page.evaluate('''async () => {
          Object.defineProperty(navigator, 'canShare', {configurable:true, value: () => true});
          Object.defineProperty(navigator, 'share', {configurable:true, value: async data => {
            window.sharedFile = {name:data.files[0].name, type:data.files[0].type,
              bytes:Array.from(new Uint8Array(await data.files[0].arrayBuffer())).slice(0,2), text:data.text};
          }});
          return {outcome:await URPSResultsExport.shareExcel(buildResultsRows()), file:window.sharedFile};
        }''')
        assert result['outcome'] == 'shared'
        assert result['file']['name'].endswith('.xlsx')
        assert result['file']['bytes'] == [80, 75]  # Real XLSX ZIP, not renamed CSV.
        assert 'vincent.reynaert@univ-catholille.fr' in result['file']['text']
        assert page.evaluate('''async () => {
          Object.defineProperty(navigator, 'share', {configurable:true, value: async () => {
            throw new DOMException('Cancelled', 'AbortError');
          }});
          return await URPSResultsExport.shareExcel(buildResultsRows());
        }''') == 'cancelled'
        for available in (False, True):
            with page.expect_download():
                outcome = page.evaluate('''async available => {
                  Object.defineProperty(navigator, 'canShare', {configurable:true, value: () => available});
                  Object.defineProperty(navigator, 'share', {configurable:true, value: async () => {
                    throw new DOMException('Unavailable', 'NotAllowedError');
                  }});
                  return await URPSResultsExport.shareExcel(buildResultsRows());
                }''', available)
            assert outcome == 'downloaded'
        browser.close()
        print(engine, 'PDF content/pagination; native share, cancellation and fallback PASS', flush=True)
