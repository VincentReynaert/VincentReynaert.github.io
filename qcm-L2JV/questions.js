// exam-qcm/questions.js
export const QUIZ = {
  title: "Examen — QCM",
  version: "v1.0",
  intro: "Répondez aux questions. Vous pouvez laisser une question sans réponse.",

  // Banque de questions (exemple minimal)
  questions: [
    {
      id: "q01",
      text: "Parmi ces propositions, lesquelles sont correctes ?",
      // image dans la question (optionnel)
      image: "assets/q01.png",
      image_alt: "Illustration de la question 1",
      multi: true,              // cases à cocher
      points: 1,                // pondération optionnelle
      correct: [1, 3],          // indices 0-based dans l’ordre ORIGINAL des options
      options: [
        "Proposition A",
        "Proposition B",
        "Proposition C",
        "Proposition D"
      ]
    },

    {
      id: "q02",
      text: "Choisissez la bonne capture d’écran.",
      multi: false,             // radio (une seule réponse)
      points: 1,
      correct: [2],
      options: [
        { image: "assets/cap1.png", alt: "Capture 1" },
        { image: "assets/cap2.png", alt: "Capture 2" },
        { image: "assets/cap3.png", alt: "Capture 3" },
        { image: "assets/cap4.png", alt: "Capture 4" }
      ]
    },

    {
      id: "q03",
      text: "Question avec image dans une réponse + texte",
      multi: true,
      points: 2,
      correct: [0, 2],
      options: [
        { text: "Option 1", image: "assets/opt1.png", alt: "Schéma option 1" },
        { text: "Option 2" },
        { text: "Option 3", image: "assets/opt3.png", alt: "Schéma option 3" },
        { text: "Option 4" }
      ]
    }
  ]
};