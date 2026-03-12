// exam-qcm/questions.js
export const QUIZ = {
  title: "Examen — QCM",
  version: "v1.0",
  intro: "Répondez aux questions. Vous pouvez laisser une question sans réponse.",

  // Banque de questions (exemple minimal)
  questions: [
    {
      id: "q01",
      text: "Ces deux scènes sont identiques à l'exception d'un seul paramètre sur le component Camera (leur transform est identique). Quelle affirmation est vraie ?",
      // image dans la question (optionnel)
      image: "assets/Camera_diff.png",
      image_alt: "Illustration de la question 1",
      multi: true,              // cases à cocher
      points: 1,                // pondération optionnelle
      correct: [2],          // indices 0-based dans l’ordre ORIGINAL des options
      options: [
        "Celle de gauche fonctionne correctement alors que celle de droite est buggée et n'affiche pas le plane.",
        "Celle de gauche est buggée et affiche un plance qui ne devrait pas être visible alors que celle de droite fonctionne correctement.",
        "Celle de de gauche est en mode de projection Perspective alors que celle droite est en mode de projection Orthographique.",
        "Celle de de gauche est en mode de projection Orthographique alors que celle droite est en mode de projection Perspective.",
        "Celle de gauche est en mode de rendu 3D alors que celle de droite est en mode de rendu 2D.",
        "Celle de gauche est en mode de rendu 2D alors que celle de droite est en mode de rendu 3D.",
        "La seule différence entre les deux scènes est la suppression du plane sous le cube et la sphère."
      ]
    },

    {
      id: "q02",
      text: "Quelle(s) affirmation(s) sont/est vraie(s) ?",
      multi: true,             // si false alors radio (une seule réponse)
      points: 1,
      correct: [0,1,2],
      options: [
        "Les types de données String et Sprite servent respectivement à stocker en mémoire des chaînes de caractères et des images bitmap.",
        "Les types de données Text et Image proviennent de la bibliothèque UnityEngine.UI.",
        "Le type de donnée TMP_Text remplace maintenant le type Text est provient de la bibliothèque TMPro.",
        "Une variable de type Image et de type Sprite c’est la même chose.",
        "Une variable de type Text ou de type String c’est la même chose.",
        "On favorise les SpriteRenderers pour un rendu d’UI alors que les Images rendues par le CanvasRenderer servent généralement à afficher des éléments de gameplay en mouvement.",
        "Un Component Sprite ou un Component SpriteRenderer c’est la même chose."
      ]
    },

    {
      id: "q03",
      text: "Dans cette situation, quelle(s) affirmation(s) sont/est vraie(s) ?",
      image: "assets/unity_editor_red.png",
      image_alt: "Illustration où unity a son interface teintée de rouge mis à part le bouton play actuellement bleu.",
      multi: true,
      points: 1,
      correct: [0, 2],
      options: [
        "Si je modifie des GameObjects dans ma scène les modifications ne seront pas enregistrables.",
        "La scène est en cours d’exécution et la teinte du playmode a été modifiée en rouge.",
        "Si je modifie des Prefabs il faut penser à appliquer les modifications effectuées avant de quitter le playmode.",
        "Si je modifie des GameObjects dans ma scène je ne verrais pas les modifications en direct.",
        "Il y a une erreur dans le code."
      ]
    },

    {
      id: "q04",
      text: "J’ai décidé de créer un Visual Novel et tout se passe bien dans le développement jusqu’au moment où, lorsque j’appuie sur le bouton “Next” servant à afficher la suite du dialogue, l’erreur suivante de produit. Pour faire disparaître cette erreur de la console, je pourrais :",
      image: "assets/IndexOOR.png",
      image_alt: "Illustration d'une erreur en console disant : IndexOutOfRange",
      multi: true,
      points: 1,
      correct: [0, 1, 2, 3],
      options: [
        "Rajouter des dialogues de façon procédurale. Cela permettrait d'appuyer à l’infinie sur le bouton “Next” sans avoir cette erreur.",
        "Prendre le script qui pose problème (MainGame.cs) et le mettre dans la corbeille. (Pas de script pas d'erreur)...",
        "Modifier le code et ajouter une condition pour vérifier que si je n'ai plus de dialogue ensuite le bouton se désactive.",
        "Faire un script qui fait se déplacer le bouton pour que le joueur ne puisse pas cliquer dessus. (Pas de clic pas d'erreur)...",
        "Relancer Unity et croiser les doigts pour que cela fonctionne."
      ]
    },

    {
      id: "q05",
      text: "Je souhaite, comme sur l’image après, ajouter une barre de vie à un monstre. Celle-ci devra être en UI, visuellement positionnée sous le monstre qui est affiché via un Sprite Renderer. Que dois-je faire ?",
      image: "assets/CanvasOrder2.png",
      image_alt: "Illustration d'un monstre avec une barre de point de vie partiellement remplie et située en-dessous.",
      multi: true,
      points: 1,
      correct: [0],
      options: [
        "Le plus simple est d’ajouter un Canvas qui sera affiché en WorldSpace afin de bien le positionner sous le monstre, ce Canvas comportera deux Images en enfant, une de background et une de remplissage.",
        "J’ajoute deux SpriteRenderers en enfant d’un EventSystem en WorldSpace, un pour le background et un en mode filled pour remplir ou vider la jauge de vie.",
        "Il n’est pas possible de créer une barre de vie en UI.",
        "Je dois absolument coder un component custom qui va afficher une texture adaptative.",
        "Le plus simple est d'ajouter un Canvas qui sera affiché en Overlay pour que les éléments de jeux ne puissent pas obstruer la vue du joueur sur cette barre de vie. Ce Canvas comportera une seule Image en enfant qui sera en mode fill/remplissage."
      ]
    },

    {
      id: "q06",
      text: "J’ai réussi à créer ma jauge de PV mais le texte qui devrait normalement s’afficher dessus n’apparaît pas. Pourquoi ?",
      image: "assets/CanvasOrder.png",
      image_alt: "Illustration double, à gauche une capture de l'éditeur Unity avec le Monster qui en enfant possède un Canvas contenant LifePoint et LifeBar dans cette ordre, LifeBar contenant LifeFill, à droite un monstre avec une barre de point de vie partiellement remplie et située en-dessous mais sans texte.",
      multi: true,
      points: 1,
      correct: [0,1],
      options: [
        "Dans ma hiérarchie, je dois descendre LifePoint sous LifeBar et LifeFill.",
        "Je n'ai pas importé les assets par défaut de TMPro ou j'ai oublié de mettre une police à mon Text.",
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
      correct: [0,1],
      options: [
        "Aucune des autres réponses n’est une raison valable.",
        "La classe devrait être renommée Player.",
        "Il faut retirer le void.",
        "Il faut absolument mettre un “print” à la place de “Debug.Log”.",
        "Il faut mettre le Debug.Log dans le Start et non dans l’Update.",
        "Le GameObject dans la scène surlequel est placé ce component s'appelle “_Script” alors qu'il devrait avoir le même nom que le Component."
      ]
    },

    {
      id: "q08",
      text: "Soit le code suivant :\nQuelle(s) affirmation(s) est(sont) vraie(s) ?",
      image: "assets/raycast2d.png",
      image_alt: "Capture d'un bout de code.",
      multi: true,
      points: 1,
      correct: [0,1],
      options: [
        "Aucune des autres réponses n’est une raison valable.",
        "La classe devrait être renommée Player.",
        "Il faut retirer le void.",
        "Il faut absolument mettre un “print” à la place de “Debug.Log”.",
        "Il faut mettre le Debug.Log dans le Start et non dans l’Update.",
        "Le GameObject dans la scène surlequel est placé ce component s'appelle “_Script” alors qu'il devrait avoir le même nom que le Component."
      ]
    }
  ]
};