// exam-qcm/questions.js
export const QUIZ = {
  title: "Examen — QCM",
  version: "v1.0",
  intro: "Répondez aux questions dans l'ordre que vous le souhaitez. Vous pouvez laisser une question sans réponse.",

  // Banque de questions (exemple minimal)
  questions: [
    {
      id: "q01",
      text: "Ces deux scènes sont identiques à l'exception d'un seul paramètre sur le Component Camera (leur Transform est identique). Quelle affirmation est vraie ?",
      // image dans la question (optionnel)
      image: "assets/Camera_diff.png",
      image_alt: "Illustration de la question 1",
      multi: false,              // cases à cocher
      points: 1,                // pondération optionnelle
      correct: [0],          // indices 0-based dans l’ordre ORIGINAL des options
      options: [
        "Celle de gauche est en mode de projection Perspective alors que celle de droite est en mode de projection Orthographique.",
        "Celle de gauche fonctionne correctement alors que celle de droite est buggée et n'affiche pas le Plane.",
        "Celle de gauche est buggée et affiche un Plane qui ne devrait pas être visible alors que celle de droite fonctionne correctement.",
        "Celle de gauche est en mode de projection Orthographique alors que celle de droite est en mode de projection Perspective.",
        "Celle de gauche est en mode de rendu 3D alors que celle de droite est en mode de rendu 2D.",
        "Celle de gauche est en mode de rendu 2D alors que celle de droite est en mode de rendu 3D.",
        "La seule différence entre les deux scènes est la suppression du Plane sous le cube et la sphère."
      ]
    },

    {
      id: "q02",
      text: "Quelle(s) affirmation(s) est(sont) vraie(s) ?",
      multi: true,             // si false alors radio (une seule réponse)
      points: 1,
      correct: [0, 1, 2],
      options: [
        "Les types de données String et Sprite servent respectivement à stocker en mémoire des chaînes de caractères et des images bitmap.",
        "Les types de données Text et Image proviennent de la bibliothèque UnityEngine.UI.",
        "Le type TMP_Text remplace désormais le type Text et provient de la bibliothèque TMPro.",
        "Une variable de type Image et de type Sprite c’est la même chose.",
        "Une variable de type Text ou de type String c’est la même chose.",
        "On favorise les SpriteRenderer pour un rendu d’UI alors que les Images rendues par le CanvasRenderer servent généralement à afficher des éléments de gameplay en mouvement.",
        "Un Component Sprite ou un Component SpriteRenderer c’est la même chose."
      ]
    },

    {
      id: "q03",
      text: "Dans cette situation, quelle(s) affirmation(s) est(sont) vraie(s) ?",
      image: "assets/unity_editor_red.png",
      image_alt: "Illustration où Unity a son interface teintée de rouge mis à part le bouton play actuellement bleu.",
      multi: true,
      points: 1,
      correct: [0, 1, 2],
      options: [
        "Si je modifie des GameObjects dans ma scène, les modifications ne seront pas enregistrables.",
        "La scène est en cours d’exécution et la teinte du playmode a été modifiée en rouge.",
        "Si je modifie des Prefabs, il faut penser à appliquer les modifications effectuées avant de quitter le Play Mode, sauf si l’autosave est actif.",
        "Si je modifie des GameObjects dans ma scène, je ne verrai pas les modifications en direct.",
        "Il y a une erreur dans le code."
      ]
    },

    {
      id: "q04",
      text: "J’ai décidé de créer un Visual Novel et tout se passe bien dans le développement jusqu’au moment où, lorsque j’appuie sur le bouton “Next” servant à afficher la suite du dialogue, l’erreur suivante se produit. Pour faire disparaître cette erreur de la console, je pourrais :",
      image: "assets/IndexOOR.png",
      image_alt: "Illustration d'une erreur en console disant : IndexOutOfRange",
      multi: true,
      points: 1,
      correct: [0, 1, 2, 3],
      options: [
        "Rajouter des dialogues de façon procédurale. Cela permettrait d'appuyer à l’infini sur le bouton “Next” sans avoir cette erreur.",
        "Prendre le script qui pose problème (MainGame.cs) et le mettre dans la corbeille. (Pas de script, pas d'erreur)...",
        "Modifier le code et ajouter une condition pour vérifier que, s'il n'y a plus de dialogue ensuite le bouton se désactive.",
        "Faire un script qui fait se déplacer le bouton pour que le joueur ne puisse pas cliquer dessus. (Pas de clic, pas d'erreur)...",
        "Relancer Unity et croiser les doigts pour que cela fonctionne."
      ]
    },

    {
      id: "q05",
      text: "Je souhaite, comme sur l’image, ajouter une barre de vie à un monstre. \nCelle-ci devra être en UI, visuellement positionnée sous le monstre qui est affiché via un SpriteRenderer. \nQue dois-je faire ?",
      image: "assets/CanvasOrder2.png",
      image_alt: "Illustration d'un monstre avec une barre de point de vie partiellement remplie et située en-dessous.",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Le plus simple est d’ajouter un Canvas qui sera affiché en WorldSpace afin de bien le positionner sous le monstre. Ce Canvas comportera deux Images en enfant, une de background et une de remplissage.",
        "J’ajoute deux SpriteRenderers en enfant d’un EventSystem en WorldSpace, un pour le background et un en mode filled pour remplir ou vider la jauge de vie.",
        "Il n’est pas possible de créer une barre de vie en UI.",
        "Je dois absolument coder un component custom qui va afficher une texture adaptative.",
        "Le plus simple est d'ajouter un Canvas qui sera affiché en Overlay pour que les éléments de jeu ne puissent pas obstruer la vue du joueur sur cette barre de vie. Ce Canvas comportera une seule Image en enfant qui sera en mode fill/remplissage."
      ]
    },

    {
      id: "q06",
      text: "J’ai réussi à créer ma jauge de PV mais le texte qui devrait normalement s’afficher dessus n’apparaît pas. Pourquoi ?",
      image: "assets/CanvasOrder.png",
      image_alt: "Illustration double, à gauche une capture de l'éditeur Unity avec le Monster qui en enfant possède un Canvas contenant LifePoint et LifeBar dans cet ordre, LifeBar contenant LifeFill, à droite un monstre avec une barre de point de vie partiellement remplie et située en-dessous mais sans texte.",
      multi: true,
      points: 1,
      correct: [0, 1],
      options: [
        "Dans ma hiérarchie, je dois descendre LifePoint sous LifeBar et LifeFill.",
        "Je n'ai pas importé les assets par défaut de TMPro ou j'ai oublié d'assigner une police à mon Text.",
        "Il faut que je modifie l'option “order in layer” de mon Text “LifePoint”.",
        "Il faut que je modifie l’option “order in layer” de mon Image “LifeBar”.",
        "Il faut que je modifie l’option “order in layer” de mon Image “LifeFill”.",
        "Je dois mettre LifeBar enfant de LifePoint."
      ]
    },

    {
      id: "q07",
      text: "Soit le code suivant :\nLorsque je lance le jeu rien ne s’affiche dans la console, quelle(s) peu(ven)t être la(les) raison(s) ?",
      image: "assets/no_print.png",
      image_alt: "Capture d'un bout de code.",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Aucune des autres réponses n’est une raison valable.",
        "La classe devrait être renommée Player.",
        "Il faut retirer le void.",
        "Il faut absolument mettre un “print” à la place de “Debug.Log”.",
        "Il faut mettre le Debug.Log dans le Start et non dans l’Update.",
        "Le GameObject dans la scène sur lequel est placé ce component s'appelle “_Script” alors qu'il devrait avoir le même nom que le Component."
      ]
    },

    {
      id: "q08",
      text: "Soit le code suivant :\nQuelle(s) affirmation(s) est(sont) vraie(s) ?",
      image: "assets/raycast2d.png",
      image_alt: "Capture d'un bout de code.",
      multi: true,
      points: 1,
      correct: [0, 1, 2],
      options: [
        "La variable hit est locale à la méthode Update et même plus précisément à le bloc conditionnel démarré ligne 18.",
        "La variable hit récupère une intersection entre un rayon ray et un Collider2D de la scène.",
        "La variable hit est de type RaycastHit2D.",
        "La variable hit sert à stocker une valeur entière infinie.",
        "La variable hit a pour valeur null."
      ]
    },

    {
      id: "q09",
      text: "Qu'est-ce qu'un AudioClip ?",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Un élément qui contient les données d'un fichier audio (*.mp3, *.ogg, ...).",
        "Un component permettant de jouer un son.",
        "La distance maximale d'écoute d'un son.",
        "Un component permettant de jouer un clip vidéo."
      ]
    },

    {
      id: "q10",
      text: "Qu'est-ce qu'un AudioSource ?",
      multi: true,
      points: 1,
      correct: [1],
      options: [
        "Un élément qui contient les données d'un fichier audio (*.mp3, *.ogg, ...).",
        "Un component permettant de jouer un son.",
        "La distance maximale d'écoute d'un son.",
        "Un component permettant de jouer un clip vidéo."
      ]
    },

    {
      id: "q11",
      text: "Que va afficher le code suivant dans la console ?",
      image: "assets/animation_trigger.png",
      image_alt: "Capture d'un bout de code.",
      multi: false,
      points: 1,
      correct: [0],
      options: [
        { image: "assets/set_trig_hit.png", alt: "set_trig_hit" },
        { image: "assets/set_trig_heat.png", alt: "set_trig_heat" },
        { image: "assets/get_trig_hit.png", alt: "get_trig_hit" },
        { image: "assets/get_trig_heat.png", alt: "get_trig_heat" }
      ]
    },

    {
      id: "q12",
      text: "Que va afficher le code suivant dans la console ?",
      image: "assets/bresom.png",
      image_alt: "Capture d'un bout de code.",
      multi: false,
      points: 1,
      correct: [0],
      options: [
        "the black sea",
        "Rien",
        "the",
        "black",
        "dark",
        "Knight",
        "sea",
        "the dark Knight",
        "the black dark Knight sea",
        "the black Knight",
        "the dark sea"
      ]
    },

    {
      id: "q13",
      text: "Unity est :",
      multi: true,
      points: 1,
      correct: [0, 1],
      options: [
        "Un moteur de jeux vidéo.",
        "Un moteur d'applications en temps réel.",
        "Une bibliothèque d'outils pour les jeux vidéo.",
        "Une API de jeux vidéo.",
        "Un IDE spécialisé dans le développement de jeux vidéo.",
        "Un moteur de jeux vidéo open source comme Godot."
      ]
    },

    {
      id: "q14",
      text: "Si je souhaite tester/exécuter la scène courante via l’éditeur Unity :",
      multi: true,
      points: 1,
      correct: [0, 1, 2],
      options: [
        "Je clique sur Edit > Play.",
        "Je clique sur l'icône triangulaire qui correspond généralement au bouton Play.",
        "J'appuie sur le raccourci clavier ctrl+P.",
        "Il faut obligatoirement que je ''build and run'' mon jeu/application.",
        "Je clique sur l’icône Pause.",
        "J'appuie sur le raccourci clavier ctrl+S."
      ]
    },

    {
      id: "q15",
      text: "Quelle(s) affirmation(s) est(sont) vraie(s) ?",
      multi: true,
      points: 1,
      correct: [0, 1],
      options: [
        "Un GameObject correspond à toute entité présente dans la scène.",
        "Un GameObject est une entité sur laquelle sont appliqués des components correspondant chacun à un comportement.",
        "Un GameObject permet de fournir un comportement à un component.",
        "Un GameObject est un script permettant de créer des objets dans une scène.",
        "Un GameObject que je mets dans ma scène se verra forcément dans le jeu final.",
        "Un GameObject a forcément un component RectTransform."
      ]
    },

    {
      id: "q16",
      text: "Quelle(s) affirmation(s) sont/est vraie(s) ?",
      multi: true,
      points: 1,
      correct: [0, 1],
      options: [
        "Un component permet de donner un comportement à un GameObject.",
        "Les components Transform ou RectTransform sont préexistants dans Unity : on n'a pas besoin de les coder. En plus chaque GameObject créé doit avoir l'un des deux.",
        "Un component ne peut être appliqué qu’à un seul GameObject.",
        "Il n’est pas possible de créer ses propres components.",
        "Il est possible de créer ses propres components en les codant forcément en C++.",
        "Un GameObject a forcément un component RectTransform."
      ]
    },

    {
      id: "q17",
      text: "Lorsque j'ajoute pour la première fois un élément d'interface utilisateur (UI), comme un Button, de nouveaux GameObjects sont automatiquement créés dans la hiérarchie. \nLeur nom correspond au nom de leur Component principal. De quel(s) Component(s) s’agit-il ?",
      multi: true,
      points: 1,
      correct: [0, 1],
      options: [
        "Un component EventSystem.",
        "Un component Canvas.",
        "Un component UIManager.",
        "Un component UI.",
        "Un component Camera.",
        "Un component Transform."
      ]
    },

    {
      id: "q18",
      text: "J’ai créé un script Player.cs, cependant, impossible d’ajouter mon nouveau component sur un GameObject. Pourquoi ?\nVoici le code de Player.cs :",
      image: "assets/joueurplayer.png",
      image_alt: "Capture d'un bout de code.",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Le nom du fichier ne correspond pas au nom de la classe.",
        "Il faut remplacer MonoBehaviour par Component car c’est un component.",
        "Il faut supprimer la variable de type GameObject.",
        "Il faut relancer Unity.",
        "Il faut débrancher-rebrancher la machine.",
        "La nomenclature du component n’est pas respectée au niveau des majuscules."
      ]
    },

    {
      id: "q19",
      text: "Lorsque je crée un bouton dans Unity (GameObject > UI > Button), celui-ci est composé de :",
      multi: true,
      points: 1,
      correct: [0, 1, 2],
      options: [
        "Un Component TMP_Text (ou TextMeshProUGUI) sur un GameObject enfant.",
        "Un Component Button sur le GameObject principal.",
        "Un Component Image sur le GameObject principal.",
        "Un Component Sprite sur un GameObject enfant.",
        "Un Component Button sur un GameObject enfant.",
        "Un seul GameObject regroupant un Component Button et Text (TMPro).",
        "Un seul GameObject regroupant un Component Image et Text (TMPro)."
      ]
    },

    {
      id: "q20",
      text: "Le component RectTransform :",
      multi: true,
      points: 1,
      correct: [0, 1],
      options: [
        "Permet de définir des points d’ancrage.",
        "Remplace le component Transform sur tous les éléments de l’UI.",
        "Est un Component que l’on peut ajouter si l’on souhaite obtenir une forme rectangulaire.",
        "Ne se pose pas sur un GameObject.",
        "Transforme mes GameObject en Rect.",
        "Se pose sur un GameObject en plus d'un Component Transform."
      ]
    },

    {
      id: "q21",
      variants: [
        {
          text: "Lors du lancement de la scène, qu’affichera la console d'Unity ?\nVoici le code et la configuration dans l'éditeur :",
          image: "assets/value_editor.png",
          image_alt: "Capture d'un bout de code et de l'éditeur.",
          multi: false,
          correct: [4],
          options: [
            "54",
            "42",
            "12",
            "30",
            "Rien du tout",
            "Appel à un ami"
          ]
        },
        {
          text: "Lors du lancement de la scène, qu’affichera la console de Unity ?\nVoici le code et la configuration dans l'éditeur :",
          image: "assets/value_editor_bis.png",
          image_alt: "Capture d'un bout de code et de l'éditeur.",
          multi: false,
          correct: [0],
          options: [
            "54",
            "42",
            "12",
            "30",
            "Rien du tout",
            "Appel à un ami"
          ]
        }
      ]
    },

    {
      id: "q22",
      text: "Parmi les fonctions suivantes, lesquelles proviennent de MonoBehaviour ?",
      multi: true,
      points: 1,
      correct: [0, 1, 2, 3],
      options: [
        "void Awake()",
        "void Start()",
        "void Update()",
        "void FixedUpdate()",
        "void FastUpdate()",
        "void Animate()",
        "void Play()",
        "void Constructor()"
      ]
    },

    {
      id: "q23",
      text: "Quel est l'intérêt principal d'un Prefab ?",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Réutiliser un GameObject plus facilement.",
        "Créer des animations.",
        "Optimiser les performances.",
        "Modifier la Camera.",
        "Préfabriquer une UI."
      ]
    },

    {
      id: "q24",
      text: "Pourquoi utiliser [SerializeField] sur une variable privée ?",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Pour la modifier dans l’inspecteur sans la rendre publique.",
        "Pour la rendre publique.",
        "Pour la cacher dans Unity.",
        "Pour optimiser les performances.",
        "Pour la modifier dans l’inspecteur et la rendre publique.",
        "Pour la rendre privée."
      ]
    },

    {
      id: "q25",
      text: "Quel événement est appelé lorsque la souris passe sur un bouton ?",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "OnPointerEnter()",
        "OnClick()",
        "OnTriggerEnter()",
        "OnHoverEnter()",
        "OnClickEnter()",
        "OnPointer()"
      ]
    },

    {
      id: "q26",
      text: "Quel composant permet de gérer les transitions entre les animations ?",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Animator",
        "Transform",
        "Animation",
        "Transition",
        "Renderer",
        "Trigger"
      ]
    },

    {
      id: "q27",
      text: "Pourquoi le nom du fichier script doit correspondre au nom de la classe ?",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Sinon Unity ne compile pas correctement le script.",
        "Pour des raisons esthétiques.",
        "Pour nous casser les *****.",
        "Pour faciliter le debug.",
        "Sinon Unity devient rouge.",
        "Sinon quand on appuie sur le bouton Play, le jeu s'arrête au bout de 5 minutes."
      ]
    }
  ]
};