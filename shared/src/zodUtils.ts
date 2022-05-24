import { pipe } from "ramda";
import { z } from "zod";

export const zString = z
  .string({
    required_error: "Obligatoire",
    invalid_type_error: "Une chaine de caractères est attendue",
  })
  .nonempty("Obligatoire");

export const zTrimmedString = zString
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, "Obligatoire");

const toLowerCase = (str: string) => str.toLowerCase();
const removeAccents = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const zEmail = z.preprocess(
  pipe(zString.parse, removeAccents, toLowerCase),
  z.string().email("Veuillez saisir une adresse e-mail valide"),
);

export const zBoolean = z.boolean({
  required_error: "Obligatoire",
  invalid_type_error: "Un booléen est attendu",
});
