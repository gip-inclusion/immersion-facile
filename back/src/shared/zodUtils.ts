import { z } from "../../node_modules/zod";

export const zRequiredString = z
  .string({
    required_error: "Obligatoire",
    invalid_type_error: "Une chaine de caractères est attendue",
  })
  .nonempty("Obligatoire");

export const zEmail = zRequiredString.email(
  "Veuillez saisir une adresse e-mail valide",
);

export const zBoolean = z.boolean({
  required_error: "Obligatoire",
  invalid_type_error: "Un booléen est attendu",
});

export const zTrue = z
  .boolean()
  .refine((bool) => bool, "L'engagement est obligatoire");
