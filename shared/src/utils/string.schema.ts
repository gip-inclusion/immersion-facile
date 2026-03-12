import DomPurify from "isomorphic-dompurify";
import z from "zod";
import { pipeWithValue } from "../pipeWithValue";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import { doesStringContainsHTML } from "./string";

export type HardenedStringSchema = ReturnType<typeof makeHardenedStringSchema>;

export const makeHardenedStringSchema = ({
  minMessage = localization.required,
  max,
  maxMessage = localization.maxCharacters(max),
  isEmptyAllowed,
  canContainHtml,
  withRegExp,
}: {
  max: number;
  minMessage?: string;
  maxMessage?: string;
  isEmptyAllowed?: true;
  canContainHtml?: true;
  withRegExp?: { regex: RegExp; message?: string };
}) =>
  pipeWithValue(
    z.string({ error: localization.required }).trim(),
    (schema) =>
      withRegExp ? schema.regex(withRegExp.regex, withRegExp.message) : schema,
    (schema) =>
      schema
        .max(max, maxMessage)
        .min(isEmptyAllowed ? 0 : 1, minMessage)
        .transform((value) =>
          canContainHtml ? sanitize(normalizer(value)) : value,
        )
        .refine(
          (input) =>
            !canContainHtml ? !doesStringContainsHTML(normalizer(input)) : true,
          {
            message: localization.invalidTextContainHtml,
          },
        ),
  );

const MAX_255_TEXT_INPUT = 255;
export const MAX_1024_TEXT_INPUT = 1024;
const MAX_3000_TEXT_INPUT = 3000;
const MAX_5000_TEXT_INPUT = 5000;
const MAX_9200_TEXT_INPUT = 9200;
export const MAX_HTML_SIZE = 700_000;

export const optionalEmptyStringMax1024 = makeHardenedStringSchema({
  isEmptyAllowed: true,
  max: MAX_1024_TEXT_INPUT,
}).optional();

export const zStringMinLength1 = makeHardenedStringSchema({
  max: MAX_1024_TEXT_INPUT,
});
export const zStringMinLength1Max255 = makeHardenedStringSchema({
  max: MAX_255_TEXT_INPUT,
});
export const zStringMinLength1Max3000 = makeHardenedStringSchema({
  max: MAX_3000_TEXT_INPUT,
});
export const zStringMinLength1Max5000 = makeHardenedStringSchema({
  max: MAX_5000_TEXT_INPUT,
});
export const zStringMinLength1Max9200 = makeHardenedStringSchema({
  max: MAX_9200_TEXT_INPUT,
});

export const zStringCanBeEmpty = makeHardenedStringSchema({
  isEmptyAllowed: true,
  max: MAX_1024_TEXT_INPUT,
});
export const zStringCanBeEmptyMax9200 = makeHardenedStringSchema({
  isEmptyAllowed: true,
  max: MAX_9200_TEXT_INPUT,
});

export const makezTrimmedString = (minMessage: string) =>
  makeHardenedStringSchema({ minMessage, max: MAX_255_TEXT_INPUT });

export const zStringPossiblyEmptyWithMax = (
  max: number,
): ZodSchemaWithInputMatchingOutput<string> =>
  makeHardenedStringSchema({ max, isEmptyAllowed: true });

// TODO: voir taille max observée en DB pour chaque prop utilisant ce schema car pas de limite
// Pour l'instant limite très haute (20000 char) mais suffisament basse pour éviter un DDoS en poussant 1GB de chaine dans une prop
// Usage expectionnel mais pas fait pour durer
export const legacyTextWithUnknownAndUnlimitedSizeInDBSchema =
  zStringPossiblyEmptyWithMax(20000);

export const zTrimmedStringWithMax = (max: number, maxMessage?: string) =>
  makeHardenedStringSchema({ max, maxMessage });

export const stringWithMaxLength255 = makeHardenedStringSchema({
  max: MAX_255_TEXT_INPUT,
});

const timeHHmmRegExp = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

export const zTimeString = makeHardenedStringSchema({
  max: 16,
  withRegExp: {
    regex: timeHHmmRegExp,
    message: localization.invalidTimeFormat,
  },
});

const normalizer = (input: string) =>
  decodeEntities(input)
    .normalize("NFKC")
    .replace(/\0/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, "")
    // biome-ignore lint/suspicious/noControlCharactersInRegex: normalize control whitespace (newline protocol splitting)
    .replace(/[\u0000-\u001F\u007F]+/g, "")
    .replace(/(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t)\s*:/gi, "javascript:")
    .replace(/[\u202A-\u202E\u2066-\u2069\u200B-\u200F\uFEFF]/g, "");

const decodeEntities = (input: string): string =>
  input.replace(/&(#x?[0-9a-f]+|\w+);?/gi, (subString, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1].toLowerCase() === "x"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);

      return !Number.isNaN(code) ? String.fromCharCode(code) : subString;
    }

    const HTML_ENTITIES: Record<string, string> = {
      lt: "<",
      gt: ">",
      amp: "&",
      quot: '"',
      apos: "'",
    };

    return HTML_ENTITIES[entity] ?? subString;
  });

const sanitize = (value: string): string => {
  const sanitizeAttributeHook = "uponSanitizeAttribute";

  DomPurify.addHook(sanitizeAttributeHook, (_, data) => {
    if (
      data.attrName === "src" &&
      data.attrValue.toLowerCase().includes("data:")
    ) {
      data.attrValue = "";
    }
  });

  const isWholeDocument = /<html|<head|<body/i.test(value);

  const sanitized = pipeWithValue(
    value.replace(/{.*?{/g, "{{").replace(/}.*?}/g, "}}"),
    (value) =>
      DomPurify.sanitize(value, {
        WHOLE_DOCUMENT: isWholeDocument,
        ADD_TAGS: isWholeDocument
          ? ["html", "head", "body", "link", "style"]
          : [],
        ADD_ATTR: ["target", "data-smartmail"],
        FORBID_TAGS: ["script", "iframe"],
        FORBID_ATTR: ["onerror", "onclick"],
        KEEP_CONTENT: false,
        SAFE_FOR_TEMPLATES: true,
        ALLOW_DATA_ATTR: true,
        USE_PROFILES: { html: true, svg: true, mathMl: true },
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      }),
    (value) =>
      value.includes("style=")
        ? value.replace(
            /style="[^"]*(?:expression|javascript|vbscript|-moz-binding)[^"]*"/gi,
            'style=""',
          )
        : value,
    (value) => value.trim(),
  );

  DomPurify.removeHook(sanitizeAttributeHook);

  return sanitized;
};
