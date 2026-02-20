import type z from "zod";
import { ZodError } from "zod";
import { emailExchangeSplitters } from "../discussion/discussion.helpers";
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
  makeHardenedStringSchema,
  zStringCanBeEmpty,
  zStringMinLength1,
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
  describe("zStringMinLength1 schema validation", () => {
    it.each([
      "//",
      "Fourni par l'employeur",
      " Non ",
      "texte\navec retour à la ligne\n",
    ])(`accepts valid "%s"`, (text) => {
      expect(() => zStringMinLength1.parse(text)).not.toThrow();
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
      expect(() => zStringMinLength1.parse(input)).toThrow(expectedError);
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
    describe("min,max sizes / trim / custom messages", () => {
      type ExpectedResult = {
        title: string;
        text: string;
        schema: z.ZodString;
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

    describe("isHtml & XSS ", () => {
      const invalidHtmlZodError = new ZodError([
        {
          code: "custom",
          path: [],
          message: localization.invalidTextWithHtml,
        },
      ]);

      it("without isHtml - reject text with html by default - tested input '      <br>  '", () => {
        expect(() =>
          makeHardenedStringSchema({
            max: 4,
          }).parse("      <br>  "),
        ).toThrow(invalidHtmlZodError);
      });

      it("with isHtml - accept text with html without xss - tested input '      <br>  '", () => {
        expect(
          makeHardenedStringSchema({
            max: 4,
            isHtml: true,
          }).parse("      <br>  "),
        ).toBe("<br>");
      });

      describe("with isHtml - XSS cases", () => {
        type ExpectedResult = {
          title: string;
          text: string;
        };

        it.each([
          {
            title: "reject script tag injection",
            text: `<script>alert("XSS")</script>`,
          },
          {
            title: "reject HTML with inline javascript event",
            text: `<img src="x" onerror="alert('XSS')" />`,
          },
          {
            title: "reject javascript protocol injection",
            text: `   <a href="javascript:alert(1)">click</a>      `,
          },
          {
            title: "reject obfuscated script tag",
            text: "    <scr<script>ipt>alert(1)</scr</script>ipt>      ",
          },
          {
            title: "reject encoded html entities",
            text: "&lt;script&gt;alert(1)&lt;/script&gt;",
          },
          {
            title: "reject unicode disguised html",
            text: "       <scr\u0069pt>alert(1)</scr\u0069pt>       ",
          },
          {
            title: "reject other event handlers",
            text: "       <div onclick='alert(1)'>click</div>       ",
          },
          {
            title: "reject CSS injection",
            text: '   <div style="background-image:url(javascript:alert(1))">x</div>    ',
          },
          {
            title: "reject Meta refresh / base / iframe",
            text: '   <iframe src="javascript:alert(1)"></iframe>    ',
          },
          {
            title: "reject Data URIs",
            text: '   <img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">    ',
          },
          {
            title: "reject Comment injection / CDATA",
            text: "   <!-- <script>alert(1)</script> -->    ",
          },
          {
            title: "reject Double-encoding ou homoglyphs",
            text: "   <scr&#x69;pt>alert(1)</scr&#x69;pt>    ",
          },
          {
            title: "reject SVG",
            text: "   <svg><script>alert(1)</script></svg>    ",
          },
          {
            title: "reject MathML",
            text: "   <math><script>alert(1)</script></math>    ",
          },
          {
            title: "reject Form",
            text: '   <form action="javascript:alert(1)">    ',
          },
          {
            title: "reject Button",
            text: '   <button formaction="javascript:alert(1)">    ',
          },
          {
            title: "reject Style",
            text: "   <style>@import 'javascript:alert(1)';</style>    ",
          },
          {
            title: "reject Link",
            text: '   <link rel="stylesheet" href="javascript:alert(1)">    ',
          },
          {
            title: "reject Complex nested obfuscations",
            text: "   <scr<!-- -->ipt>alert(1)</scr<!-- -->ipt>    ",
          },
          {
            title: "reject Template / backticks / expression injection",
            // biome-ignore lint/suspicious/noTemplateCurlyInString: Explicit string injection
            text: '   <img src="${userInput}">    ',
          },
          {
            title: "reject combined Unicode + homoglyph with entities",
            text: "   <scr&#x69;\u0070t>alert(1)</scr&#x69;\u0070t    ",
          },
          {
            title: "reject when HTML with long inner HTML attribute",
            text: `     <brx data-x="${"a".repeat(999)}" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;opacity:0" onmouseover="if(!window.__p){window.__p=1;this.remove();alert('XSS-'+document.domain)}">    `,
          },
          {
            title: "reject mutation XSS via SVG parsing",
            text: "    <svg><g/onload=alert(1)//</svg>   ",
          },
          {
            title: "reject mutation XSS via malformed HTML reparsing",
            text: "   <svg><p><style><img src=x onerror=alert(1)>   ",
          },
          {
            title: "reject SVG animate event XSS",
            text: "<svg><animate onbegin=alert(1) attributeName=x dur=1s>",
          },
          {
            title: "reject SVG set attribute mutation XSS",
            text: "<svg><set attributeName=onload to=alert(1)>",
          },
          {
            title: "reject zero-width unicode obfuscation",
            text: "    <scr\u200Bipt>alert(1)</scr\u200Bipt>   ",
          },
          {
            title: "reject null-byte obfuscation",
            text: "    <scr\u0000ipt>alert(1)</scr\u0000ipt>   ",
          },
          {
            title: "reject newline protocol splitting",
            text: '    <a href="java\nscript:alert(1)">x</a>   ',
          },
          {
            title: "reject iframe srcdoc injection",
            text: `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
          },
          {
            title: "reject svg namespace script",
            text: `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
          },
          {
            title: "reject Template engines SSR injection",
            text: ` {{constructor.constructor('alert(1)')() ${"a".repeat(999)}}}   `,
          },
          {
            title: "reject spaced template delimiters",
            text: `{ { constructor.constructor('alert(1)')() ${"a".repeat(999)} } }`,
          },
          {
            title: "reject attribute breaking injection",
            text: `<img src="x" title="test" onerror=alert(1)//">`,
          },
          {
            title: "reject unquoted attribute javascript",
            text: "<img src=x onerror=alert(1)>",
          },
          {
            title: "reject tab protocol splitting",
            text: `<a href="java\tscript:alert(1)">x</a>`,
          },
          {
            title: "reject formfeed protocol splitting",
            text: `<a href="java\fscript:alert(1)">x</a>`,
          },
          {
            title: "reject auto-closing parser mutation",
            text: "<svg><script>alert(1)",
          },
          {
            title: "reject foreignObject XSS",
            text: "<svg><foreignObject><script>alert(1)</script></foreignObject></svg>",
          },
          {
            title: "reject encoded javascript protocol",
            text: `<a href="javas&#99;ript:alert(1)">x</a>`,
          },
          {
            title: "reject xlink href javascript",
            text: `<svg><a xlink:href="javascript:alert(1)">x</a></svg>`,
          },
          {
            title: "reject css expression",
            text: `<div style="width: expression(alert(1))">`,
          },
          {
            title: "reject DOM clobbering id",
            text: `<form id="constructor"></form>`,
          },
          {
            title: "reject DOM clobbering via name attribute",
            text: `<img name="constructor">`,
          },
          {
            title: "reject unicode bidi override",
            text: "<scr\u202Eipt>alert(1)</script>",
          },
          {
            title: "reject namespace mutation XSS (parser reparenting)",
            text: "<math><mtext></math><img src=x onerror=alert(1)>",
          },
          {
            title: "reject deep mutation XSS",
            text: "<svg><desc></svg><img src=x onerror=alert(1)>",
          },
        ] satisfies ExpectedResult[])("$title - tested input '$text'", (testCase) => {
          expect(() =>
            makeHardenedStringSchema({
              max: 3000,
              isHtml: true,
            }).parse(testCase.text),
          ).toThrow(invalidHtmlZodError);
        });
      });
    });
  });
});
