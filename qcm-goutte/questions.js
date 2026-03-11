// questions.js
// Format:
// - correct: indices 0-based (0 = première proposition)
// - multi: true = plusieurs réponses possibles (checkbox)

export const QUIZ = {
    "title": "QCM — Goutte",
    "version": "v1.0",
    "intro": "Plusieurs réponses peuvent être correctes.",
    "questions": [
        {
            "id": "q01",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant l’épidémiologie de la goutte ?",
            "options": [
                "C’est la 3e cause la plus fréquente d’arthrite au monde",
                "Elle touche 0,3% de la population française",
                "La prévalence la plus élevée de goutte est rencontrée dans le Pacifique",
                "La maladie est associée à un surrisque de mortalité",
                "Les hospitalisations pour goutte sont en décroissance",
                "La différence de mortalité entre les goutteux et la population générale se réduit"
            ],
            "correct": [
                2,
                3
            ],
            "multi": true
        },
        {
            "id": "q02",
            "text": "À quelle(s) comorbidité(s) la goutte s’associe-t’elle ?",
            "options": [
                "À l’hémochromatose",
                "Aux pathologies cardiovasculaires",
                "À l’insuffisance rénale",
                "À l’hyperthyroïdie",
                "Au diabète de type 2",
                "À la maladie d’Alzheimer"
            ],
            "correct": [
                1,
                2,
                4
            ],
            "multi": true
        },
        {
            "id": "q03",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant la physiopathologie de la goutte ?",
            "options": [
                "L’hyperuricémie est une étape nécessaire au développement de la goutte",
                "En condition biologique humaine, les cristaux d’urate monosodique se forment à partir d’une concentration de 50mg/L d’urate (240µmol/L)",
                "Les cristaux d’urate monosodique se forment en priorité au niveau de l’articulation des genoux",
                "L’hyperuricémie provoque une réaction de l’immunité innée",
                "La réduction de l’uricémie conduit à la dissolution des cristaux d’urate monosodique",
                "La phagocytose des cristaux d’urate monosodique conduit à l’activation de l’inflammasome"
            ],
            "correct": [
                0,
                4,
                5
            ],
            "multi": true
        },
        {
            "id": "q04",
            "text": "Quelle(s) affirmation(s) sur les facteurs conduisant à une élévation de l’uricémie et leur mécanisme est (sont) vraie(s) ?",
            "options": [
                "L’obésité par augmentation de l’insulino-résistance",
                "Le traitement diurétique par diminution de l’élimination urinaire de l’acide urique",
                "L’hyperthyroïdie par diminution de l’élimination urinaire de l’acide urique",
                "Les bières sans alcool par diminution de l’élimination urinaire de l’acide urique",
                "La génétique par défaut d’élimination urinaire d’acide urique",
                "Le psoriasis cutané par surproduction endogène de purines"
            ],
            "correct": [
                0,
                1,
                3,
                5
            ],
            "multi": true
        },
        {
            "id": "q05",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant le rôle de la génétique dans la goutte ?",
            "options": [
                "Il est connu de longue date depuis qu’il a été identifié comme transmis de roi en roi (« la maladie des Rois »)",
                "La génétique contribue autant que les boissons et l’hygiène diététique à l’augmentation de l’uricémie",
                "La génétique explique une partie de l’hyperuricémie et également à la réactivité inflammatoire du système immunitaire",
                "La génétique montre que la goutte est une maladie auto-infligée",
                "La génétique explique les différences de prévalence de la goutte d’un continent à l’autre",
                "La génétique impacte l’élimination digestive de l’acide urique"
            ],
            "correct": [
                2,
                4,
                5
            ],
            "multi": true
        },
        {
            "id": "q06",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant l’agent pathogène de la goutte ?",
            "options": [
                "Il s’agit du cristal d’urate monocalcique",
                "Il se forme à une concentration de 68mg/L en conditions physiologiques à 37°C",
                "Il se dissout si l’uricémie passe en-dessous du seuil de saturation",
                "Il s’observe en microscopie laser en lumière polarisée",
                "Il est biréfringent (il dévie la lumière)",
                "Lorsqu’agrégé, il peut être détecté par scanner double-énergie"
            ],
            "correct": [
                1,
                2,
                4,
                5
            ],
            "multi": true
        },
        {
            "id": "q07",
            "text": "Quel(s) type(s) de réponse(s) du corps provoque(nt) la présence de cristaux ?",
            "options": [
                "Une réponse de type « corps étranger »",
                "Une réponse immunitaire humorale telle que celle contre les virus",
                "Une activation de l’immunité innée",
                "Une élévation des marqueurs de l’inflammation",
                "Une activation intra-cellulaire de l’inflammasome",
                "Une production massive d’interleukine-2"
            ],
            "correct": [
                0,
                2,
                3,
                4
            ],
            "multi": true
        },
        {
            "id": "q08",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant la présentation clinique de la goutte ?",
            "options": [
                "L’atteinte initiale commence aux pieds dans 50% des cas",
                "Elle se manifeste d’abord par l’apparition de tophus",
                "Le pic de douleurs est progressivement atteint au cours de la semaine puis les douleurs régressent spontanément",
                "Les crises surviennent habituellement au petit matin",
                "Au fil du temps les crises deviennent moins intenses mais permanentes",
                "L’évolution d’une goutte non traitée peut aboutir à des destructions articulaires"
            ],
            "correct": [
                3,
                4,
                5
            ],
            "multi": true
        },
        {
            "id": "q09",
            "text": "Quel(s) ordre(s) chronologique(s) d’atteintes des différentes articulations est (sont) habituellement observés dans la goutte ?",
            "options": [
                "Main, puis cheville puis genou",
                "Première articulation métatarso-phalangienne puis épaule",
                "Tarse puis genoux puis coude",
                "Tarse et première articulation métatarso-phalangienne simultanés puis genou",
                "Genou puis coude puis main",
                "Rachis lombaire, puis main, puis genou"
            ],
            "correct": [
                2,
                3,
                4
            ],
            "multi": true
        },
        {
            "id": "q10",
            "text": "Comment les cristaux d’urate monosodique peuvent-ils être observés ?",
            "options": [
                "En imagerie par résonance magnétique (IRM)",
                "En scanner double-énergie",
                "En échographie",
                "En radiographie",
                "En microscopie optique en lumière polarisée",
                "À l’œil nu"
            ],
            "correct": [
                1,
                2,
                4
            ],
            "multi": true
        },
        {
            "id": "q11",
            "text": "Quel(s) est (sont) le(s) grand(s) principe(s) du traitement de la goutte ?",
            "options": [
                "Abaisser le taux sanguin d’acide urique pour contrôler rapidement le risque de nouvelle crise",
                "Empêcher la formation de nouveaux cristaux et dissoudre ceux existant",
                "Contrôler le risque inflammatoire tant que le taux d’acide urique n’est pas à la cible souhaitée",
                "Contrôler efficacement la douleur et l’inflammation en cas de nouvelle crise",
                "Empêcher la transmission de la maladie aux membres de la famille",
                "Faire disparaître les tophus"
            ],
            "correct": [
                1,
                3,
                5
            ],
            "multi": true
        },
        {
            "id": "q12",
            "text": "Quelle(s) affirmation(s) est (sont) vraies concernant le traitement de l’inflammation goutteuse ?",
            "options": [
                "Le traitement le plus utilisé dans la crise de goutte est la cortisone",
                "Il y a souvent des contre-indications ou précautions d’emploi permettant rarement l’utilisation de la colchicine",
                "La colchicine est moins efficace si prise après 36 heures après le début de la crise",
                "La colchicine et la cortisone peuvent être combinées en cas de crise réfractaire",
                "L’allopurinol va permettre de réduire rapidement l’uricémie et réduire la durée de la crise",
                "Les biothérapies anti-interleukine 1 peuvent être utilisées en cas de crise difficile à traiter uniquement"
            ],
            "correct": [
                2,
                3,
                5
            ],
            "multi": true
        },
        {
            "id": "q13",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant le traitement de fond de la goutte ?",
            "options": [
                "Il vise à dissoudre les dépôts de cristaux d’urate monosodique",
                "Il doit être maintenu tant que persistent les crises de goutte",
                "Il empêche la formation de l’acide urique ou favorise son élimination rénale",
                "Il élimine le risque de crise de goutte lorsque la dissolution des stocks de cristaux est complète",
                "Il doit être prescrit à toute personne avec une hyperuricémie",
                "L’objectif est d’obtenir une uricémie inférieure à 300µmol/L (50mg/L)"
            ],
            "correct": [
                0,
                2,
                3,
                5
            ],
            "multi": true
        },
        {
            "id": "q14",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant l’allopurinol ?",
            "options": [
                "Il inhibe la xanthine oxydase",
                "Il détruit l’acide urique soluble",
                "Il doit être initié chez tous les patients avec un diagnostic de goutte retenu",
                "Il doit être débuté à distance d’une crise de goutte",
                "Il est débuté à la dose de 400mg/jour (dose moyenne nécessaire pour obtenir une uricémie cible) et secondairement adapté à l’uricémie",
                "Il permet une diminution significative du risque de crise de goutte à partir d’un an après son introduction"
            ],
            "correct": [
                0,
                2,
                3,
                5
            ],
            "multi": true
        },
        {
            "id": "q15",
            "text": "Quelle(s) affirmation(s) concernant les risques liés à l’allopurinol est (sont) vraie(s) ?",
            "options": [
                "La fréquence des réactions sévères est de l’ordre de 1%",
                "Le risque principal est une inflammation pulmonaire sévère (pneumopathie interstitielle diffuse)",
                "Le risque est en grande partie médié par des prédispositions génétiques",
                "L’insuffisance rénale sévère est un facteur de risque de réaction sévère",
                "Le risque est diminué par l’utilisation initiale de faibles doses d’allopurinol",
                "Les patients originaires de Polynésie sont plus à risque de réaction sévère"
            ],
            "correct": [
                2,
                3,
                4
            ],
            "multi": true
        },
        {
            "id": "q16",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant la réduction de l’uricémie ?",
            "options": [
                "Elle doit se faire par paliers mensuels pour diminuer le surrisque de crise de goutte induite",
                "Elle doit se faire par paliers mensuels pour diminuer le risque de réaction cutanée sévère",
                "Elle s’obtient par augmentation de l’élimination hépatique de l’allopurinol",
                "Elle peut se faire grâce à une uricase disponible en France",
                "Elle peut se faire en augmentant la réabsorption tubulaire rénale d’acide urique",
                "Elle peut se faire en diminuant la production d’acide urique"
            ],
            "correct": [
                0,
                1,
                5
            ],
            "multi": true
        },
        {
            "id": "q17",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant l’observance thérapeutique dans la goutte ?",
            "options": [
                "Moins de la moitié des patients poursuivent leur traitement de fond dans l’année qui suit son introduction",
                "Les rappels automatiques par les pharmacies permettent d’augmenter l’observance",
                "Une prise en charge par une infirmière en pratique avancée permet une meilleure observance que celle par les médecins généralistes",
                "L’éducation thérapeutique permet aux patients de comprendre l’intérêt de leurs traitements et augmentent l’observance",
                "Les patients goutteux sont réputés intrinsèquement inobservants",
                "Les patients très observants la première année le restent sur le long terme"
            ],
            "correct": [
                0,
                2,
                3,
                4,
                5
            ],
            "multi": true
        },
        {
            "id": "q18",
            "text": "Quel(s) est (sont) le(s) enjeu(x) de la prise en charge à long terme de la goutte ?",
            "options": [
                "La surveillance annuelle du maintien d’une uricémie cible",
                "La prise en charge des comorbidités cardiovasculaires",
                "L’évaluation initiale de la fonction rénale",
                "La recherche et le traitement d’un diabète et d’une dyslipidémie",
                "La recherche et le traitement d’une hyperthyroïdie",
                "La vérification d’une rémission clinique complète de la goutte"
            ],
            "correct": [
                0,
                1,
                3,
                5
            ],
            "multi": true
        },
        {
            "id": "q19",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant le régime alimentaire dans la goutte ?",
            "options": [
                "Un régime alimentaire bien conduit est préalable à tout traitement médicamenteux hypouricémiant",
                "La consommation de régimes riches en purines (viandes rouges, abats, fruits de mer) a un rôle central dans l’élévation de l’uricémie",
                "La réduction de la consommation d’alcool a un effet significatif sur l’uricémie",
                "Certains aliments favorisent la survenue de crises de goutte",
                "La bière sans alcool a un effet hyperuricémiant mineur",
                "La bière avec alcool a un effet hyperuricémiant mineur"
            ],
            "correct": [
                3,
                4,
                5
            ],
            "multi": true
        },
        {
            "id": "q20",
            "text": "Quelle(s) affirmation(s) est (sont) vraie(s) concernant la goutte ?",
            "options": [
                "Il s’agit d’une maladie en grande partie génétique",
                "Il s’agit d’une maladie fortement liée aux habitudes de vie",
                "Il s’agit d’une maladie métabolique",
                "Il s’agit d’une maladie dite « auto-infligée »",
                "Il s’agit d’une maladie facile à traiter",
                "Il s’agit d’une maladie dont le coût des traitements est élevé"
            ],
            "correct": [
                0,
                2,
                4
            ],
            "multi": true
        }
    ]
};