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
      points: 2,
      correct: [0, 2],
      options: [
        "Si je modifie des GameObjects dans ma scène les modifications ne seront pas enregistrables.",
        "La scène est en cours d’exécution et la teinte du playmode a été modifiée en rouge.",
        "Si je modifie des Prefabs il faut penser à appliquer les modifications effectuées avant de quitter le playmode.",
        "Si je modifie des GameObjects dans ma scène je ne verrais pas les modifications en direct.",
        "Il y a une erreur dans le code."
      ]
    }
  ]
};