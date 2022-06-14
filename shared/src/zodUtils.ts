import { pipe } from "ramda";
import { z, preprocess } from "zod";

export const zString = z
  .string({
    required_error: "Obligatoire",
    invalid_type_error: "Une chaine de caractères est attendue",
  })
  .nonempty("Obligatoire");

export const zTrimmedString = zString
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, "Obligatoire");

export const makezTrimmedString = (message: string) =>
  zString.transform((s) => s.trim()).refine((s) => s.length > 0, message);

const removeAccents = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const zEmail = z.preprocess(
  pipe(zString.parse, removeAccents),
  z.string().email("Veuillez saisir une adresse e-mail valide"),
);

export const zBoolean = z.boolean({
  required_error: "Sélection obligatoire",
  invalid_type_error: "Un booléen est attendu",
});

export const zPreprocessedBoolean = (schema: z.ZodBoolean = z.boolean()) =>
  preprocess((a) => {
    if (typeof a === "boolean") return a;
    const aLowerCase = zTrimmedString.parse(a).toLowerCase();
    const parsedA = z.enum(["true", "false"]).optional().parse(aLowerCase);
    if (parsedA) return parsedA.toLowerCase() === "true";
  }, schema);

export const zPreprocessedNumber = (schema: z.ZodNumber = z.number()) =>
  preprocess((a) => {
    if (typeof a === "number") return a;
    return parseFloat(z.string().parse(a));
  }, schema);
