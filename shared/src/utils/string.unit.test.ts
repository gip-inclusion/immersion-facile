import { ZodError } from "zod";
import type { $ZodIssue } from "zod/v4/core/errors.cjs";
import { emailExchangeSplitters } from "../discussion/discussion.helpers";
import { expectToEqual } from "../test.helpers";
import { localization } from "../zodUtils";
import {
  cleanSpecialChars,
  cleanStringToHTMLAttribute,
  doesStringContainsHTML,
  getFormattedFirstnameAndLastname,
  looksLikeSiret,
  removeDiacritics,
  slugify,
  splitTextOnFirstSeparator,
  toLowerCaseWithoutDiacritics,
} from "./string";
import {
  type HardenedStringSchema,
  makeHardenedStringSchema,
  zStringCanBeEmpty,
  zStringMinLength1Max1024,
  zStringPossiblyEmptyWithMax,
  zTrimmedStringWithMax,
} from "./string.schema";

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
    ])("should clean strings to HTML attribute value", (input, prefix, suffix, expected) => {
      expect(cleanStringToHTMLAttribute(input, prefix, suffix)).toBe(expected);
    });
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
    it.each([
      "123 456 789 AAA10 1",
      "not-a-siret",
      "",
    ])(`should return false for "%s"`, (input) => {
      expect(looksLikeSiret(input)).toBe(false);
    });
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

  describe("cleanSpecialChars", () => {
    it.each([
      ["Bouchon d’oreilles + gants", "Bouchon d'oreilles + gants"],
      ["Chaussures de sécurité…", "Chaussures de securite..."],
      ["GANTS / GILET HAUTE VISIBILITE", "GANTS / GILET HAUTE VISIBILITE"],
      ["test guillemets “”", 'test guillemets ""'],
      ["test tiret – —", "test tiret - -"],
      ["test espace insécable \u00A0", "test espace insecable  "],
    ])("should clean special chars", (input, expected) => {
      expect(cleanSpecialChars(input)).toBe(expected);
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

describe("string schemas", () => {
  describe("zStringMinLength1Max1024 schema validation", () => {
    it.each([
      "//",
      "Fourni par l'employeur",
      " Non ",
      "texte\navec retour à la ligne\n",
    ])(`accepts valid "%s"`, (text) => {
      expect(() => zStringMinLength1Max1024.parse(text)).not.toThrow();
    });

    it.each([
      {
        input: "",
        expectedError: new ZodError([
          {
            origin: "string",
            code: "too_small",
            input: undefined,
            minimum: 1,
            inclusive: true,
            path: [],
            message: "Ce champ est obligatoire",
          },
        ]),
      },
      {
        input: "\n",
        expectedError: new ZodError([
          {
            origin: "string",
            code: "too_small",
            minimum: 1,
            inclusive: true,
            path: [],
            input: undefined,
            message: "Ce champ est obligatoire",
          },
        ]),
      },
      {
        input: " ",
        expectedError: new ZodError([
          {
            origin: "string",
            code: "too_small",
            minimum: 1,
            inclusive: true,
            input: undefined,
            path: [],
            message: "Ce champ est obligatoire",
          },
        ]),
      },
      {
        input: "   ",
        expected: new ZodError([
          {
            origin: "string",
            code: "too_small",
            minimum: 1,
            message: "Ce champ est obligatoire",
            path: [],
            input: "   ",
          },
          {
            code: "custom",
            message: "Ce champ est obligatoire",
            path: [],
            input: "   ",
          },
        ]),
      },
    ])(`fails to validate "%s"`, ({ input, expectedError }) => {
      expect(() => zStringMinLength1Max1024.parse(input)).toThrow(
        expectedError,
      );
    });
  });

  describe("zStringCanBeEmpty schema validation", () => {
    it.each([
      {
        input: "",
        output: "",
      },
      {
        input: " ",
        output: "",
      },
      {
        input: "//",
        output: "//",
      },
      {
        input: "Fourni par l'employeur",
        output: "Fourni par l'employeur",
      },
      {
        input: " Non ",
        output: "Non",
      },
      {
        input: "\n",
        output: "",
      },
    ])(`accepts valid "%s"`, ({ input, output }) => {
      expect(zStringCanBeEmpty.parse(input)).toEqual(output);
    });
  });

  describe("zStringPossiblyEmptyWithMax schema validation", () => {
    it.each(["", " ", "//", " Non ", "\n"])(`accepts valid "%s"`, (text) => {
      expect(() => zStringPossiblyEmptyWithMax(3).parse(text)).not.toThrow();
    });

    it("fails to validate schema", () => {
      const expectedError: ZodError = new ZodError([
        {
          origin: "string",
          code: "too_big",
          maximum: 3,
          inclusive: true,
          path: [],
          input: undefined,
          message: "Le maximum est de 3 caractères",
        },
      ]);

      expect(() =>
        zStringPossiblyEmptyWithMax(3).parse("Fourni par l'employeur"),
      ).toThrow(expectedError);
    });
  });

  describe("zTrimmedStringWithMax schema validation", () => {
    it.each(["//", " Non ", "oui"])(`accepts valid "%s"`, (text) => {
      expect(() => zTrimmedStringWithMax(3).parse(text)).not.toThrow();
    });

    it.each([
      {
        input: "",
        expectedError: new ZodError([
          {
            origin: "string",
            input: undefined,
            code: "too_small",
            minimum: 1,
            inclusive: true,
            path: [],
            message: "Ce champ est obligatoire",
          },
        ]),
      },
      {
        input: "\n",
        expectedError: new ZodError([
          {
            origin: "string",
            code: "too_small",
            input: undefined,
            minimum: 1,
            inclusive: true,
            path: [],
            message: "Ce champ est obligatoire",
          },
        ]),
      },
      {
        input: " ",
        expectedError: new ZodError([
          {
            origin: "string",
            code: "too_small",
            input: undefined,
            minimum: 1,
            inclusive: true,
            path: [],
            message: "Ce champ est obligatoire",
          },
        ]),
      },
      {
        input: "texte trop long",
        expectedError: new ZodError([
          {
            origin: "string",
            code: "too_big",
            maximum: 3,
            inclusive: true,
            path: [],
            input: undefined,
            message: "Le maximum est de 3 caractères",
          },
        ]),
      },
    ])(`fails to validate "%s"`, ({ input, expectedError }) => {
      expect(() => zTrimmedStringWithMax(3).parse(input)).toThrow(
        expectedError,
      );
    });
  });

  describe("makeHardenedStringSchema basic validation", () => {
    describe("min,max sizes / trim / custom messages / regex", () => {
      type ExpectedResult = {
        title: string;
        text: string;
        schema: HardenedStringSchema;
      } & (
        | {
            expectedResult: string;
          }
        | {
            expectedError: ZodError;
          }
      );

      it.each([
        {
          title: "accept text at min length",
          text: "toto",
          schema: makeHardenedStringSchema({ min: 0, max: 4 }),
          expectedResult: "toto",
        },
        {
          title: "accept text at min length",
          text: "toto",
          schema: makeHardenedStringSchema({ min: 4, max: 4 }),
          expectedResult: "toto",
        },
        {
          title: "reject text below min length",
          text: "tot",
          schema: makeHardenedStringSchema({ min: 4, max: 4 }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "too_small",
              minimum: 4,
              inclusive: true,
              path: [],
              message: localization.required,
            },
          ]),
        },
        {
          title: "reject text below min length once trimmed",
          text: "  tot   ",
          schema: makeHardenedStringSchema({ min: 4, max: 4 }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "too_small",
              minimum: 4,
              inclusive: true,
              path: [],
              message: localization.required,
            },
          ]),
        },
        {
          title: "accept trimmed text at max length",
          text: "toto  ",
          schema: makeHardenedStringSchema({ max: 4 }),
          expectedResult: "toto",
        },
        {
          title:
            "without maxMessage - reject trimmed text over max lenght with default max error message",
          text: "totogro   ",
          schema: makeHardenedStringSchema({ max: 4 }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "too_big",
              input: undefined,
              maximum: 4,
              inclusive: true,
              path: [],
              message: localization.maxCharacters(4),
            },
          ]),
        },
        {
          title:
            "with maxMessage - reject trimmed text over max length with custom max error message",
          text: "totogro   ",
          schema: makeHardenedStringSchema({ max: 4, maxMessage: "MAXXXX" }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "too_big",
              input: undefined,
              maximum: 4,
              inclusive: true,
              path: [],
              message: "MAXXXX",
            },
          ]),
        },
        {
          title:
            "without isEmptyAllowed - reject empty text with spaces trimmed",
          text: "        ",
          schema: makeHardenedStringSchema({ max: 4 }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "too_small",
              minimum: 1,
              inclusive: true,
              path: [],
              message: localization.required,
            },
          ]),
        },
        {
          title:
            "without isEmptyAllowed - reject empty text with spaces trimmed with custom min message",
          text: "        ",
          schema: makeHardenedStringSchema({
            max: 4,
            minMessage: "t'es tout p'tit!",
          }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "too_small",
              minimum: 1,
              inclusive: true,
              path: [],
              message: "t'es tout p'tit!",
            },
          ]),
        },
        {
          title: "with isEmptyAllowed - accept empty text with spaces trimmed",
          text: "        ",
          schema: makeHardenedStringSchema({ max: 4, isEmptyAllowed: true }),
          expectedResult: "",
        },
        {
          title:
            "with isEmptyAllowed - accept empty text with line breaks trimmed",
          text: "\n",
          schema: makeHardenedStringSchema({ max: 4, isEmptyAllowed: true }),
          expectedResult: "",
        },
        {
          title: "with withRegExp - accept text matching regex trimmed",
          text: " toto ",
          schema: makeHardenedStringSchema({
            max: 4,
            withRegExp: { regex: /toto/ },
          }),
          expectedResult: "toto",
        },
        {
          title: "with withRegExp - reject text not matching regex",
          text: " toto ",
          schema: makeHardenedStringSchema({
            max: 4,
            withRegExp: { regex: /tata/ },
          }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "invalid_format",
              format: "regex",
              pattern: "/tata/",
              path: [],
              message: "Invalid string: must match pattern /tata/",
            } as $ZodIssue,
          ]),
        },
        {
          title:
            "with withRegExp and custom regex error message - reject text not matching regex with custom error message",
          text: " toto ",
          schema: makeHardenedStringSchema({
            max: 4,
            withRegExp: { regex: /tata/, message: "petit problème de regexp" },
          }),
          expectedError: new ZodError([
            {
              origin: "string",
              code: "invalid_format",
              format: "regex",
              pattern: "/tata/",
              path: [],
              message: "petit problème de regexp",
            } as $ZodIssue,
          ]),
        },
      ] satisfies ExpectedResult[])("$title - tested input '$text'", (testCase) => {
        testCase.expectedResult !== undefined
          ? expect(testCase.schema.parse(testCase.text)).toBe(
              testCase.expectedResult,
            )
          : expect(() => testCase.schema.parse(testCase.text)).toThrow(
              testCase.expectedError,
            );
      });
    });

    describe("canContainHtml & XSS", () => {
      const invalidTextContainHtmlZodError = new ZodError([
        {
          code: "custom",
          path: [],
          message: localization.invalidTextContainHtml,
        },
      ]);

      it("without canContainHtml - reject text with html by default - tested input '      <br>  '", () => {
        expect(() =>
          makeHardenedStringSchema({
            max: 4,
          }).parse("      <br>  "),
        ).toThrow(invalidTextContainHtmlZodError);
      });

      it("with canContainHtml - accept text with html without xss - tested input '      <br>  '", () => {
        expect(
          makeHardenedStringSchema({
            max: 4,
            canContainHtml: true,
          }).parse("      <br>  "),
        ).toBe("<br>");
      });

      describe("with canContainHtml - HTML sanitize cases", () => {
        type ExpectedResult = {
          title: string;
          input: string;
          expected: string;
        };

        it.each([
          {
            title: "1. script tag injection",
            input: `<script>alert("XSS")</script>`,
            expected: "",
          },
          {
            title: "2. HTML with inline javascript event",
            input: `<img src="x" onerror="alert('XSS')" />`,
            expected: '<img src="x">',
          },
          {
            title: "3. javascript protocol injection",
            input: `   <a href="javascript:alert(1)">click</a>      `,
            expected: "<a>click</a>",
          },
          {
            title: "4. obfuscated script tag",
            input: "    <scr<script>ipt>alert(1)</scr</script>ipt>      ",
            expected: "",
          },
          {
            title: "5. encoded html entities",
            input: "&lt;script&gt;alert(1)&lt;/script&gt;",
            expected: "",
          },
          {
            title: "6. unicode disguised html",
            input: "       <scr\u0069pt>alert(1)</scr\u0069pt>       ",
            expected: "",
          },
          {
            title: "7. other event handlers",
            input: "       <div onclick='alert(1)'>click</div>       ",
            expected: "<div>click</div>",
          },
          {
            title: "8. CSS injection",
            input:
              '   <div style="background-image:url(javascript:alert(1))">x</div>    ',
            expected: '<div style="">x</div>',
          },
          {
            title: "9. Meta refresh / base / iframe",
            input: '   <iframe src="javascript:alert(1)"></iframe>    ',
            expected: "",
          },
          {
            title: "10. Data URIs",
            input:
              '   <img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">    ',
            expected: '<img src="">',
          },
          {
            title: "11. Comment injection / CDATA",
            input: "   <!-- <script>alert(1)</script> -->    ",
            expected: "",
          },
          {
            title: "12. Double-encoding ou homoglyphs",
            input: "   <scr&#x69;pt>alert(1)</scr&#x69;pt>    ",
            expected: "",
          },
          {
            title: "13. SVG",
            input: "   <svg><script>alert(1)</script></svg>    ",
            expected: "<svg></svg>",
          },
          {
            title: "14. MathML",
            input: "   <math><script>alert(1)</script></math>    ",
            expected: "<math></math>",
          },
          {
            title: "15. Form",
            input: '   <form action="javascript:alert(1)">    ',
            expected: "<form></form>",
          },
          {
            title: "16. Button",
            input: '   <button formaction="javascript:alert(1)">    ',
            expected: "<button></button>",
          },
          {
            title: "17. Style",
            input: "   <style>@import 'javascript:alert(1)';</style>    ",
            expected: "",
          },
          {
            title: "18. Link",
            input: '   <link rel="stylesheet" href="javascript:alert(1)">    ',
            expected: "",
          },
          {
            title: "19. Complex nested obfuscations",
            input: "   <scr<!-- -->ipt>alert(1)</scr<!-- -->ipt>    ",
            expected: "ipt&gt;",
          },
          {
            title: "20. Template / backticks / expression injection",
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Explicit HTML string injection
            input: '   <img src="${userInput}">    ',
            expected: "<img>",
          },
          {
            title: "21. combined Unicode + homoglyph with entities",
            input: "   <scr&#x69;\u0070t>alert(1)</scr&#x69;\u0070t    ",
            expected: "",
          },
          {
            title: "22. when HTML with long inner HTML attribute",
            input: `     <brx data-x="${"a".repeat(999)}" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;opacity:0" onmouseover="if(!window.__p){window.__p=1;this.remove();alert('XSS-'+document.domain)}">    `,
            expected: "",
          },
          {
            title: "23. mutation XSS via SVG parsing",
            input: "    <svg><g/onload=alert(1)//</svg>   ",
            expected: "<svg><g></g></svg>",
          },
          {
            title: "24. mutation XSS via malformed HTML reparsing",
            input: "   <svg><p><style><img src=x onerror=alert(1)>   ",
            expected: "<svg></svg><p></p>",
          },
          {
            title: "25. SVG animate event XSS",
            input: "<svg><animate onbegin=alert(1) attributeName=x dur=1s>",
            expected: "<svg></svg>",
          },
          {
            title: "26. SVG set attribute mutation XSS",
            input: "<svg><set attributeName=onload to=alert(1)>",
            expected: "<svg></svg>",
          },
          {
            title: "27. zero-width unicode obfuscation",
            input: "    <scr\u200Bipt>alert(1)</scr\u200Bipt>   ",
            expected: "",
          },
          {
            title: "28. null-byte obfuscation",
            input: "    <scr\u0000ipt>alert(1)</scr\u0000ipt>   ",
            expected: "",
          },
          {
            title: "29. newline protocol splitting",
            input: '    <a href="java\nscript:alert(1)">x</a>   ',
            expected: "<a>x</a>",
          },
          {
            title: "30. iframe srcdoc injection",
            input: `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
            expected: "",
          },
          {
            title: "31. svg namespace script",
            input: `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
            expected: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
          },
          {
            title: "32. Template engines SSR injection",
            input: ` {{constructor.constructor('alert(1)')() ${"a".repeat(999)}}}   `,
            expected: "",
          },
          {
            title: "33. spaced template delimiters",
            input: `{ { constructor.constructor('alert(1)')() ${"a".repeat(999)} } }`,
            expected: "",
          },
          {
            title: "34. attribute breaking injection",
            input: `<img src="x" title="test" onerror=alert(1)//">`,
            expected: '<img src="x" title="test">',
          },
          {
            title: "35. unquoted attribute javascript",
            input: "<img src=x onerror=alert(1)>",
            expected: '<img src="x">',
          },
          {
            title: "36. tab protocol splitting",
            input: `<a href="java\tscript:alert(1)">x</a>`,
            expected: "<a>x</a>",
          },
          {
            title: "37. formfeed protocol splitting",
            input: `<a href="java\fscript:alert(1)">x</a>`,
            expected: "<a>x</a>",
          },
          {
            title: "38. auto-closing parser mutation",
            input: "<svg><script>alert(1)",
            expected: "<svg></svg>",
          },
          {
            title: "39. foreignObject XSS",
            input:
              "<svg><foreignObject><script>alert(1)</script></foreignObject></svg>",
            expected: "<svg></svg>",
          },
          {
            title: "40. encoded javascript protocol",
            input: `<a href="javas&#99;ript:alert(1)">x</a>`,
            expected: "<a>x</a>",
          },
          {
            title: "41. xlink href javascript",
            input: `<svg><a xlink:href="javascript:alert(1)">x</a></svg>`,
            expected: "<svg><a>x</a></svg>",
          },
          {
            title: "42. css expression",
            input: `<div style="width: expression(alert(1))">`,
            expected: '<div style=""></div>',
          },
          {
            title: "43. DOM clobbering id",
            input: `<form id="constructor"></form>`,
            expected: "<form></form>",
          },
          {
            title: "44. DOM clobbering via name attribute",
            input: `<img name="constructor">`,
            expected: "<img>",
          },
          {
            title: "45. unicode bidi override",
            input: "<scr\u202Eipt>alert(1)</script>",
            expected: "",
          },
          {
            title: "46. namespace mutation XSS (parser reparenting)",
            input: "<math><mtext></math><img src=x onerror=alert(1)>",
            expected: '<math><mtext></mtext></math><img src="x">',
          },
          {
            title: "47. deep mutation XSS",
            input: "<svg><desc></svg><img src=x onerror=alert(1)>",
            expected: '<svg><desc></desc></svg><img src="x">',
          },
        ] satisfies ExpectedResult[])("$title\ntested input '$input'\nexpected : '$expected'", (testCase) => {
          expectToEqual(
            makeHardenedStringSchema({
              max: 3000,
              canContainHtml: true,
            }).parse(testCase.input),
            testCase.expected,
          );
        });
      });
    });
  });
});
