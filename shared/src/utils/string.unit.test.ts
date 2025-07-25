import { emailExchangeSplitters } from "../discussion/discussion.helpers";
import {
  cleanStringToHTMLAttribute,
  doesStringContainsHTML,
  getFormattedFirstnameAndLastname,
  looksLikeSiret,
  removeDiacritics,
  slugify,
  splitTextOnFirstSeparator,
  toLowerCaseWithoutDiacritics,
} from "./string";

describe("string utils", () => {
  describe("cleanStringToHTMLAttribute", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        null,
        null,
        "confirmer-un-projet-professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "input",
        3,
        "input-intitule-du-poste-metier-observe-3",
      ],
      [
        "Mille sabords, capitaine !",
        "input",
        "-super",
        "input-mille-sabords-capitaine--super",
      ],
      [
        "Mille sabords,   capitaine 21",
        "input",
        "-super",
        "input-mille-sabords-capitaine-21--super",
      ],
      ["autocomplete-input", null, ":rb1:", "autocomplete-input-rb1"],
    ])(
      "should clean strings to HTML attribute value",
      (input, prefix, suffix, expected) => {
        expect(cleanStringToHTMLAttribute(input, prefix, suffix)).toBe(
          expected,
        );
      },
    );
  });
  describe("slugify", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        "confirmer-un-projet-professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "intitule-du-poste---metier-observe--",
      ],
      ["Mille sabords, capitaine !", "mille-sabords--capitaine--"],
      ["Mille sabords,   capitaine 21", "mille-sabords----capitaine-21"],
      ["autocomplete-input", "autocomplete-input"],
    ])("should slugify strings", (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });
  });

  describe("toLowerCaseWithoutDiacritics", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        "confirmer un projet professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "intitule du poste / metier observe *",
      ],
      ["Mille sabords, capitaine !", "mille sabords, capitaine !"],
      ["Mille sabords,   capitaine 21", "mille sabords,   capitaine 21"],
      ["autocomplete-input", "autocomplete-input"],
    ])("should remove diacritics and lowercase strings", (input, expected) => {
      expect(toLowerCaseWithoutDiacritics(input)).toBe(expected);
    });
  });
  describe("removeDiacritics", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        "Confirmer un projet professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "Intitule du poste / metier observe *",
      ],
      ["Mille sabords, capitaine !", "Mille sabords, capitaine !"],
      ["Mille sabords,   capitaine 21", "Mille sabords,   capitaine 21"],
      ["autocomplete-input", "autocomplete-input"],
    ])("should remove diacritics", (input, expected) => {
      expect(removeDiacritics(input)).toBe(expected);
    });
  });
  describe("looksLikeSiret", () => {
    it.each([
      "123 456 789 00010",
      "1234567890001 0",
      "1234567890 0010",
      "123 456 789 000 10",
    ])(`should return true for "%s"`, (input) => {
      expect(looksLikeSiret(input)).toBe(true);
    });
    it.each(["123 456 789 AAA10 1", "not-a-siret", ""])(
      `should return false for "%s"`,
      (input) => {
        expect(looksLikeSiret(input)).toBe(false);
      },
    );
  });

  describe("doesStringContainsHTML", () => {
    it.each([
      ["<script>alert('XSS')</script>", true],
      ["some content with a <a href='example.com'>link</a>", true],
      ["some content with a <!-- beginning of html comment", true],
      ["some content with a <!-- html comment -->", true],
      ["some content with an --> ending of html comment", false],
      ["some content with an < open tag", false],
      ["> < emoji ?", false],
    ])(`should return true for "%s"`, (input, expected) => {
      expect(doesStringContainsHTML(input)).toBe(expected);
    });
  });

  describe("getFormattedFirstnameAndLastname", () => {
    it.each([
      {
        inputs: {
          firstname: "John",
          lastname: "Doe",
        },
        expectedOutput: "John DOE",
      },
      {
        inputs: {
          lastname: "Doe",
        },
        expectedOutput: "DOE",
      },
      {
        inputs: {
          firstname: "john",
        },
        expectedOutput: "John",
      },
      {
        inputs: {
          firstname: "jean-claude",
          lastname: "Duss",
        },
        expectedOutput: "Jean-Claude DUSS",
      },
      {
        inputs: {
          firstname: "jean claude",
          lastname: "Duss",
        },
        expectedOutput: "Jean Claude DUSS",
      },
      {
        inputs: {
          firstname: "Chris",
          lastname: "O'donnell",
        },
        expectedOutput: "Chris O'DONNELL",
      },
      {
        inputs: {
          firstname: "PrénOM-cheLOu composé",
          lastname: "Nom-cheLOU composé",
        },
        expectedOutput: "PrénOM-CheLOu-Composé NOM-CHELOU COMPOSÉ",
      },
      {
        inputs: {},
        expectedOutput: "",
      },
      {
        inputs: {
          firstname: "",
          lastname: "Doe",
        },
        expectedOutput: "DOE",
      },
      {
        inputs: {
          firstname: "   ",
          lastname: "Doe",
        },
        expectedOutput: "DOE",
      },
    ])("for $inputs return $expectedOutput", ({ inputs, expectedOutput }) => {
      expect(getFormattedFirstnameAndLastname(inputs)).toBe(expectedOutput);
    });
  });
});

describe("splitTextOnFirstSeparator", () => {
  const testCases = [
    {
      input:
        "<div>Bonjour madame,<br>merci de votre réponse rapide,&nbsp;oui nous pourrons nous contacter à partir du 5 mai.<br>Bonne réception et bon week-end<br>Le ven. 25 avr. 2025, 13:55, Immersion Facilitée &lt;ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr&gt; a écrit&nbsp;:<br>##- Veuillez répondre au-dessus de cette ligne -##<br>Cet email vous a été envoyé via le service Immersion Facilitée, vous pouvez répondre directement à cet email, il sera transmis à votre interlocuteur.<br>-----------------------------<br>Pour rappel, voici les informations liées à cette mise en relation :<br><br>Métier : Formateur / Formatrice<br>Entreprise : Entreprise 86000 Poitiers<br><br><br>Bonjour,<br>Vous pouvez me contacter directement par téléphone ou par mail.<br>Je suis absente la semaine prochaine.<br>Je reprendrai contact avec vous à mon retour le 5 05 2025.<br>Je vous souhaite une agréable journée.<br>Je reste à votre disposition pour toute information complémentaire.<br>Bien cordialement,<br>Faites de la prévention des risques professionnels<br>votre métier en devenant formateur en Santé et Sécurité au Travail<br>86000 POITIERS<br><br><br>Retrouvez-nous également<br>www.example.com<br>📝<br>Consulter<br>le catalogue des formations de formateurs<br>Conditions<br>générales de vente<br>Ce message et tous les fichiers qui y sont attachés contiennent des informations<br>confidentielles, exclusivement destinées à la personne à laquelle elles sont adressées. Dans l'hypothèse où ce message ne vous serait pas destiné, nous vous remercions de le retourner immédiatement à son émetteur et de le supprimer. La publication, la distribution,<br>l'impression ou tout autre usage non autorisé de ce message est strictement interdit. Les idées et opinions contenues dans ce message sont celles de son auteur et ne représentent pas nécessairement celles de la société de Test.<br>La certification a été accordée au titre des catégories d’actions suivantes&nbsp;:<br>Actions de formation<br>Actions permettant de valider les acquis de l’expérience<br>De&nbsp;: Immersion Facilitée &lt;ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr&gt;<br><br><br>Envoyé&nbsp;: jeudi 24 avril 2025 11:11<br><br>À&nbsp;: Entreprise<br><br>Objet&nbsp;: Candidat vous contacte pour une demande d'immersion sur le métier de Formateur / Formatrice<br>Immersion Facilitée<br>Faciliter la réalisation des immersions professionnelles<br>Bonjour Entreprise,<br>Un candidat souhaite faire une immersion dans votre entreprise (86000 Poitiers).<br><br><br><br><br>Immersion souhaitée : <br><br><br><br>• Métier : Formateur / Formatrice. <br><br>• Dates d’immersion envisagées : je suis flexible. <br><br>• But de l'immersion : Je compte me former à ce métier. <br><br><br><br>Profil du candidat : <br><br><br><br>• Expérience professionnelle : j’ai déjà une ou plusieurs expériences professionnelles, ou de bénévolat.<br><br><br>• Informations supplémentaires sur l'expérience du candidat : domaine commercial, animation, service en restauration, phoning.<br>Répondre<br>au candidat via mon espace<br>Ce candidat attend une réponse, vous pouvez :<br><br><br><br><br>- répondre directement à cet email, il lui sera transmis (vous pouvez également utiliser le bouton ci-dessus)<br><br><br><br><br>- en cas d'absence de réponse par email, vous pouvez essayer de le contacter par tel : +33600000000<br>Si la connexion ne fonctionne pas et que vous ne recevez pas le lien de réinitialisation du mot de passe, c'est que vous n'avez pas encore créé votre compte.<br><br><br>Créer votre compte avec le même mail que celui avec lequel les candidats vous contactent.<br><br><br><br><br>Vous pouvez préparer votre échange grâce à notre<br>page d'aide. <br><br><br><br>Bonne journée, <br><br>L'équipe Immersion Facilitée<br>Vous recevez cet email, car cette adresse email a été renseigné dans une demande de convention sur le site Immersion Facilitée. Si vous rencontrez un problème, la plupart<br>des solutions sont disponibles sur notre<br>centre d'aide. Vous y trouverez également un formulaire de contact pour joindre notre équipe support, qui vous répondra sous les meilleurs délais.</div>",
      separators: emailExchangeSplitters,
      expected: [
        "<div>Bonjour madame,<br>merci de votre réponse rapide,&nbsp;oui nous pourrons nous contacter à partir du 5 mai.<br>Bonne réception et bon week-end",
      ],
    },
    {
      input:
        "<div>Bonjour madame,<br>merci de votre réponse rapide,&nbsp;oui nous pourrons nous contacter à partir du 5 mai.<br>Bonne réception et bon week-end<br>Le&nbsp;ven. 25 avr. 2025,&nbsp;13:55, Immersion Facilitée &lt;ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr&gt; a écrit&nbsp;:<br>##- Veuillez répondre au-dessus de cette ligne -##<br>Cet email vous a été envoyé via le service Immersion Facilitée, vous pouvez répondre directement à cet email, il sera transmis à votre interlocuteur.<br>-----------------------------<br>Pour rappel, voici les informations liées à cette mise en relation :<br><br>Métier : Formateur / Formatrice<br>Entreprise : Entreprise 86000 Poitiers<br><br><br>Bonjour,<br>Vous pouvez me contacter directement par téléphone ou par mail.<br>Je suis absente la semaine prochaine.<br>Je reprendrai contact avec vous à mon retour le 5 05 2025.<br>Je vous souhaite une agréable journée.<br>Je reste à votre disposition pour toute information complémentaire.<br>Bien cordialement,<br>Faites de la prévention des risques professionnels<br>votre métier en devenant formateur en Santé et Sécurité au Travail<br>86000 POITIERS<br><br><br>Retrouvez-nous également<br>www.example.com<br>📝<br>Consulter<br>le catalogue des formations de formateurs<br>Conditions<br>générales de vente<br>Ce message et tous les fichiers qui y sont attachés contiennent des informations<br>confidentielles, exclusivement destinées à la personne à laquelle elles sont adressées. Dans l'hypothèse où ce message ne vous serait pas destiné, nous vous remercions de le retourner immédiatement à son émetteur et de le supprimer. La publication, la distribution,<br>l'impression ou tout autre usage non autorisé de ce message est strictement interdit. Les idées et opinions contenues dans ce message sont celles de son auteur et ne représentent pas nécessairement celles de la société de Test.<br>La certification a été accordée au titre des catégories d’actions suivantes&nbsp;:<br>Actions de formation<br>Actions permettant de valider les acquis de l’expérience<br>De&nbsp;: Immersion Facilitée &lt;ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr&gt;<br><br><br>Envoyé&nbsp;: jeudi 24 avril 2025 11:11<br><br>À&nbsp;: Entreprise<br><br>Objet&nbsp;: Candidat vous contacte pour une demande d'immersion sur le métier de Formateur / Formatrice<br>Immersion Facilitée<br>Faciliter la réalisation des immersions professionnelles<br>Bonjour Entreprise,<br>Un candidat souhaite faire une immersion dans votre entreprise (86000 Poitiers).<br><br><br><br><br>Immersion souhaitée : <br><br><br><br>• Métier : Formateur / Formatrice. <br><br>• Dates d’immersion envisagées : je suis flexible. <br><br>• But de l'immersion : Je compte me former à ce métier. <br><br><br><br>Profil du candidat : <br><br><br><br>• Expérience professionnelle : j’ai déjà une ou plusieurs expériences professionnelles, ou de bénévolat.<br><br><br>• Informations supplémentaires sur l'expérience du candidat : domaine commercial, animation, service en restauration, phoning.<br>Répondre<br>au candidat via mon espace<br>Ce candidat attend une réponse, vous pouvez :<br><br><br><br><br>- répondre directement à cet email, il lui sera transmis (vous pouvez également utiliser le bouton ci-dessus)<br><br><br><br><br>- en cas d'absence de réponse par email, vous pouvez essayer de le contacter par tel : +33600000000<br>Si la connexion ne fonctionne pas et que vous ne recevez pas le lien de réinitialisation du mot de passe, c'est que vous n'avez pas encore créé votre compte.<br><br><br>Créer votre compte avec le même mail que celui avec lequel les candidats vous contactent.<br><br><br><br><br>Vous pouvez préparer votre échange grâce à notre<br>page d'aide. <br><br><br><br>Bonne journée, <br><br>L'équipe Immersion Facilitée<br>Vous recevez cet email, car cette adresse email a été renseigné dans une demande de convention sur le site Immersion Facilitée. Si vous rencontrez un problème, la plupart<br>des solutions sont disponibles sur notre<br>centre d'aide. Vous y trouverez également un formulaire de contact pour joindre notre équipe support, qui vous répondra sous les meilleurs délais.</div>",
      separators: emailExchangeSplitters,
      expected: [
        "<div>Bonjour madame,<br>merci de votre réponse rapide,&nbsp;oui nous pourrons nous contacter à partir du 5 mai.<br>Bonne réception et bon week-end",
      ],
    },
  ];
  it.each(testCases)("should split text on first separator", (testCase) => {
    const input = testCase.input;
    const separators = testCase.separators;
    const expected = testCase.expected;
    expect(splitTextOnFirstSeparator(input, separators)[0]).toBe(expected[0]);
  });
});
