import z from "zod";
import { pipeWithValue } from "../pipeWithValue";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import { doesStringContainsHTML } from "./string";

export const makeHardenedStringSchema = ({
  minMessage = localization.required,
  max,
  maxMessage = localization.maxCharacters(max),
  isEmptyAllowed,
  isHtml,
}: {
  max: number;
  minMessage?: string;
  maxMessage?: string;
  isEmptyAllowed?: true;
  isHtml?: true;
}): z.ZodString =>
  pipeWithValue(
    z
      .string({ error: localization.required })
      .trim()
      .max(max, maxMessage)
      .refine(
        (input) =>
          isHtml
            ? !hasXSSDetected(normalizer(input))
            : !doesStringContainsHTML(normalizer(input)),

        {
          message: localization.invalidTextWithHtml,
        },
      ),
    (schema) => (isEmptyAllowed ? schema : schema.min(1, minMessage)),
  );

export const optionnalEmptyStringMax1024 = makeHardenedStringSchema({
  isEmptyAllowed: true,
  max: 1024,
}).optional();

export const zStringMinLength1 = makeHardenedStringSchema({ max: 1024 });
export const zStringCanBeEmpty = makeHardenedStringSchema({
  isEmptyAllowed: true,
  max: 1024,
});

export const makezTrimmedString = (message: string) =>
  makeHardenedStringSchema({ minMessage: message, max: 100 });

export const zStringPossiblyEmptyWithMax = (
  max: number,
): ZodSchemaWithInputMatchingOutput<string> =>
  makeHardenedStringSchema({ max, isEmptyAllowed: true });

export const zTrimmedStringWithMax = (max: number, maxMessage?: string) =>
  makeHardenedStringSchema({ max, maxMessage });

export const stringWithMaxLength255 = makeHardenedStringSchema({
  max: 255,
});

const timeHHmmRegExp = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

export const zTimeString = makeHardenedStringSchema({ max: 16 }).regex(
  timeHHmmRegExp,
  localization.invalidTimeFormat,
);

export const makePersonNameSchema = (fieldName: "firstname" | "lastname") => {
  const label = fieldName === "firstname" ? "prénom" : "nom";
  return zTrimmedStringWithMax(
    50,
    `Le ${label} ne doit pas dépasser 50 caractères`,
  )
    .regex(
      /^[A-Za-zÀ-ÿ\s'-]*$/,
      `Le ${label} ne peut contenir que des lettres, espaces, tirets et apostrophes`,
    )
    .transform((val) => val.replace(/\s+/g, " "));
};

const hasXSSDetected = (normalized: string): boolean => {
  const XSS_PATTERNS_AND_TEMPLATE_INJECTION: RegExp[] = [
    /<\s*script/i,
    /<\s*iframe/i,
    /<\s*object/i,
    /<\s*embed/i,
    /<\s*svg/i,
    /<\s*math/i,

    // events handlers
    /\son\w+\s*=/i,

    // javascript urls
    /javascript\s*:/i,
    /data\s*:\s*text\/html/i,

    // encoded attacks
    /&#x?[0-9a-f]+;/i,

    // style injection
    /expression\s*\(/i,
    /url\s*\(/i,

    //Template injection
    /\$\{.*?\}/,
    /<!--[\s\S]*?<script[\s\S]*?<\/script>[\s\S]*?-->/i,
    /<!--[\s\S]*?script[\s\S]*?-->/,

    //Template delimiters
    /\{\s*\{/,
    /\}\s*\}/,

    //DOM Clobber Keys
    /\b(id|name)\s*=\s*["']?\s*(constructor|__proto__|prototype|window|document|location|top|parent|self)\b/i,
  ];

  const recomposed = normalized
    .replace(/<([a-z0-9]+)<!--[\s\S]*?-->([a-z0-9]*)/gi, "<$1$2")
    .toLowerCase();

  return (
    XSS_PATTERNS_AND_TEMPLATE_INJECTION.some((pattern) =>
      pattern.test(recomposed),
    ) ||
    (normalized.includes("{{") && normalized.includes("}}")) ||
    (normalized.includes("{%") && normalized.includes("%}")) ||
    (normalized.includes("<%") && normalized.includes("%>"))
  );
};

const normalizer = (input: string) =>
  decodeEntities(input)
    .normalize("NFKC")
    .replace(/\0/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, "")
    // biome-ignore lint/suspicious/noControlCharactersInRegex: normalize control whitespace (newline protocol splitting)
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
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
