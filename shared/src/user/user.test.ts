import { ZodError } from "zod";
import type { $ZodIssue } from "zod/v4/core/errors.cjs";
import { firstnameSchema, lastnameSchema } from "./user.schema";

describe("lastnameSchema & firstnameSchema", () => {
  describe("basic validation", () => {
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
      { name: "", expectedName: "" },
    ])("accepts valid name '%s' and transforms to '%s'", ({
      name,
      expectedName,
    }) => {
      expect(lastnameSchema.parse(name)).toBe(expectedName);
      expect(firstnameSchema.parse(name)).toBe(expectedName);
    });
  });

  describe("lastname Errors", () => {
    it.each([
      {
        input: "123",
        error: new ZodError([
          {
            origin: "string",
            code: "invalid_format",
            format: "regex",
            pattern: "/^[A-Za-zÀ-ÿ\\s'-]*$/",
            path: [],
            message:
              "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
          } as $ZodIssue,
        ]),
      },
      {
        input: "John@Doe",
        error: new ZodError([
          {
            origin: "string",
            code: "invalid_format",
            format: "regex",
            pattern: "/^[A-Za-zÀ-ÿ\\s'-]*$/",
            path: [],
            message:
              "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
          } as $ZodIssue,
        ]),
      },
      {
        input: "John.Doe",
        error: new ZodError([
          {
            origin: "string",
            code: "invalid_format",
            format: "regex",
            pattern: "/^[A-Za-zÀ-ÿ\\s'-]*$/",
            path: [],
            message:
              "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
          } as $ZodIssue,
        ]),
      },
      {
        input:
          "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxTOO LONG NAMExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        error: new ZodError([
          {
            origin: "string",
            code: "too_big",
            maximum: 50,
            inclusive: true,
            path: [],
            message: "Le nom ne doit pas dépasser 50 caractères",
          } as $ZodIssue,
        ]),
      },
    ])("rejects invalid lastname '%s'", ({ input, error }) => {
      expect(() => lastnameSchema.parse(input)).toThrow(error);
    });
  });

  describe("firstname Errors", () => {
    it.each([
      {
        input: "123",
        error: new ZodError([
          {
            origin: "string",
            code: "invalid_format",
            format: "regex",
            pattern: "/^[A-Za-zÀ-ÿ\\s'-]*$/",
            path: [],
            message:
              "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes",
          } as $ZodIssue,
        ]),
      },
      {
        input: "John@Doe",
        error: new ZodError([
          {
            origin: "string",
            code: "invalid_format",
            format: "regex",
            pattern: "/^[A-Za-zÀ-ÿ\\s'-]*$/",
            path: [],
            message:
              "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes",
          } as $ZodIssue,
        ]),
      },
      {
        input: "John.Doe",
        error: new ZodError([
          {
            origin: "string",
            code: "invalid_format",
            format: "regex",
            pattern: "/^[A-Za-zÀ-ÿ\\s'-]*$/",
            path: [],
            message:
              "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes",
          } as $ZodIssue,
        ]),
      },
      {
        input:
          "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxTOO LONG NAMExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        error: new ZodError([
          {
            origin: "string",
            code: "too_big",
            maximum: 50,
            inclusive: true,
            path: [],
            message: "Le prénom ne doit pas dépasser 50 caractères",
          } as $ZodIssue,
        ]),
      },
    ])("rejects invalid firstname '%s'", ({ input, error }) => {
      expect(() => firstnameSchema.parse(input)).toThrow(error);
    });
  });
});
