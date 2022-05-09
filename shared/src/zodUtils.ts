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

export const zEmail = zString
  .nonempty("Obligatoire")
  .email("Veuillez saisir une adresse e-mail valide");

export const zBoolean = z.boolean({
  required_error: "Obligatoire",
  invalid_type_error: "Un booléen est attendu",
});
