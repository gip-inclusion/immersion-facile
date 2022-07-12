import { preprocess, z } from "zod";

export const zString = z
  .string({
    required_error: "Obligatoire",
    invalid_type_error: "Une chaine de caractères est attendue",
  })
  .min(1, "Obligatoire");

export const zStringPossiblyEmpty = zString
  .optional()
  .or(z.literal("")) as z.Schema<string>;

export const zTrimmedString = zString
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, "Obligatoire");

export const makezTrimmedString = (message: string) =>
  zString.transform((s) => s.trim()).refine((s) => s.length > 0, message);

const removeAccents = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const zEmail = z.preprocess(
  removeAccents,
  zString.email("Veuillez saisir une adresse e-mail valide"),
);

export const zBoolean = z.boolean({
  required_error: "Sélection obligatoire",
  invalid_type_error: "Un booléen est attendu",
});

export const zPreprocessedBoolean = () =>
  preprocess((candidate) => {
    if (typeof candidate !== "string") return candidate;
    return candidate.toLowerCase() === "true";
  }, z.boolean());

export const zPreprocessedNumber = (schema = z.number()) =>
  preprocess((nAsString) => {
    if (typeof nAsString !== "string") return nAsString;
    const n = parseFloat(nAsString);
    if (isNaN(n))
      throw new Error(`'${nAsString}' cannot be converted to number`);
    return n;
  }, schema);

export const validateDataFromSchema = <T>(
  schema: z.Schema<T>,
  data: unknown,
): T | Error => {
  try {
    return schema.parse(data);
  } catch (error: unknown) {
    return error instanceof Error
      ? error
      : new Error(`Must be an Error, got '${error}'`);
  }
};
