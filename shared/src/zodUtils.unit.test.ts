import z, { ZodError } from "zod";
import {
  deepPartialSchema,
  makePersonNameSchema,
  zStringCanBeEmpty,
  zStringMinLength1,
  zStringPossiblyEmptyWithMax,
  zToBoolean,
  zToNumber,
  zTrimmedStringWithMax,
} from "./zodUtils";

describe("zodUtils", () => {
  describe("zToBoolean schema validation", () => {
    it.each([
      ["true", true],
      ["TRUE", true],
      [true, true],
      ["1", true],
      [1, true],
      ["false", false],
      ["FALSE", false],
      ["0", false],
      [undefined, false],
      [null, false],
      [false, false],
      [0, false],
    ])("boolean '%s' to be parsed to %s", (boolean, expectedBoolean) => {
      expect(zToBoolean.parse(boolean)).toBe(expectedBoolean);
    });
  });

  describe("zToNumber schema validation", () => {
    it.each([
      [1, 1],
      [1.2, 1.2],
      ["0", 0],
      ["0.1", 0.1],
    ])("boolean '%s' to be parsed to '%s'", (boolean, expectedNumber) => {
      expect(zToNumber.parse(boolean)).toBe(expectedNumber);
    });

    it.each([
      "0,1",
      "not a number",
    ])("boolean '%s' to be invalid", (boolean) => {
      expect(() => zToNumber.parse(boolean)).toThrow();
    });
  });

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

  describe("makePersonNameSchema basic validation", () => {
    it.each([
      { name: "julien", expectedName: "julien" },
      { name: "Julien", expectedName: "Julien" },
      { name: "jean-paul", expectedName: "jean-paul" },
      { name: "jean  paul", expectedName: "jean paul" },
      { name: "O'Brien", expectedName: "O'Brien" },
      { name: "Marie-Claire", expectedName: "Marie-Claire" },
      { name: "  trimmed  ", expectedName: "trimmed" },
      { name: "multiple   spaces", expectedName: "multiple spaces" },
      { name: "Éléonore", expectedName: "Éléonore" },
    ])("accepts valid name '%s' and transforms to '%s'", ({
      name,
      expectedName,
    }) => {
      expect(makePersonNameSchema("lastname").parse(name)).toBe(expectedName);
    });

    it.each([
      "123",
      "John@Doe",
      "John.Doe",
    ])("rejects invalid name '%s'", (name) => {
      expect(() => makePersonNameSchema("lastname").parse(name)).toThrow(
        "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
      );
    });
  });

  describe("deepPartialSchema", () => {
    it("makes the object deeply partial", () => {
      const withPersonSchema = z.object({
        person: z.object({
          name: z.string(),
          age: z.number(),
        }),
      });

      const canHaveOptionalRootKey = deepPartialSchema(
        withPersonSchema,
      ).safeParse({});

      expect(canHaveOptionalRootKey.success).toBeTruthy();

      const canHaveOptionalDeepKey = deepPartialSchema(
        withPersonSchema,
      ).safeParse({
        person: {
          age: 30,
        },
      });

      expect(canHaveOptionalDeepKey.success).toBeTruthy();
    });

    it("makes the array deeply partial", () => {
      const withPeopleSchema = z.object({
        person: z.object({
          books: z.array(z.string()),
        }),
      });

      const canHaveOptionalArray = deepPartialSchema(
        withPeopleSchema,
      ).safeParse({
        person: {},
      });

      expect(canHaveOptionalArray.success).toBeTruthy();

      const canHaveEmptyArray = deepPartialSchema(withPeopleSchema).safeParse({
        person: {
          books: [],
        },
      });

      expect(canHaveEmptyArray.success).toBeTruthy();
    });

    it("makes deep partial work with union", () => {
      const unionSchema = deepPartialSchema(
        z.object({
          person: z.object({
            name: z.string(),
          }),
        }),
      ).or(
        z.object({
          otherInfo: z.string(),
        }),
      );

      const result = unionSchema.safeParse({
        person: {},
      });

      expect(result.success).toBeTruthy();
    });

    it("makes deep partial work with intersection", () => {
      const intersectionSchema = deepPartialSchema(
        z.object({
          person: z.object({
            name: z.string(),
          }),
        }),
      ).and(
        z.object({
          otherInfo: z.string(),
        }),
      );

      const result = intersectionSchema.safeParse({
        otherInfo: "Other info",
      });

      expect(result.success).toBeTruthy();
    });
  });
});
