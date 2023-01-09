import { Logger } from "pino";
import { preprocess, z } from "zod";
import { timeHHmmRegExp } from "./utils/date";

export const localization = {
  required: "Obligatoire",
  expectText: "Une chaine de caractères est attendue",
  maxCharacters: (max: number) => `Le maximum est de ${max} caractères`,
  invalidTimeFormat: "Le format de l'heure est invalide",
  invalidDate: "Le format de la date saisie est invalide",
  invalidDateStart: "Le format de la date de début est invalide",
  invalidDateEnd: "Le format de la date de fin est invalide",
  invalidEmailFormat: "Veuillez saisir une adresse e-mail valide",
  invalidDateStartDateEnd: "La date de fin doit être après la date de début.",
  atLeastOneEmail: "Vous devez renseigner au moins un email",
  atLeastOneJob: "Vous devez renseigner au moins un métier",
  invalidValidationFormatDate:
    "Le format de la date de validation est invalide.",
  invalidPostalCode: "Veuillez spécifier un code postal dans l'adresse.",
  invalidImmersionObjective: "Vous devez choisir un objectif d'immersion",
  expectedBoolean: "La sélection d'une valeur (oui/non) est obligatoire",
  invalidPhone: "Numéro de téléphone incorrect",
  signatoriesDistinctEmails:
    "Les emails des signataires doivent être différents.",
  beneficiaryTutorEmailMustBeDistinct:
    "Le mail du tuteur doit être différent des mails du bénéficiaire, de son représentant légal et de son employeur actuel.",
  mustBeSignedByEveryone: "La confirmation de votre accord est obligatoire.",
};

export const requiredText = {
  required_error: localization.required,
  invalid_type_error: localization.expectText,
};

export const requiredBoolean = {
  required_error: localization.required,
  invalid_type_error: localization.expectText,
};

export const zString = z.string(requiredText).min(1, localization.required);

export const zStringPossiblyEmpty = zString
  .optional()
  .or(z.literal("")) as z.Schema<string>;

export const zStringPossiblyEmptyWithMax = (max: number) =>
  zString
    .max(max, localization.maxCharacters(max))
    .optional()
    .or(z.literal("")) as z.Schema<string>;

export const zTrimmedString = zString
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, localization.required);

export const zTrimmedStringWithMax = (max: number) =>
  zString
    .max(max, localization.maxCharacters(max))
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, localization.required);

export const zTimeString = z
  .string(requiredText)
  .regex(timeHHmmRegExp, localization.invalidTimeFormat);

export const makezTrimmedString = (message: string) =>
  zString.transform((s) => s.trim()).refine((s) => s.length > 0, message);

const removeAccents = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const zEmail = z.preprocess(
  removeAccents,
  z.string(requiredText).email(localization.invalidEmailFormat),
);

export const zEmailPossiblyEmpty = z.preprocess(
  removeAccents,
  z
    .string()
    .email(localization.invalidEmailFormat)
    .optional()
    .or(z.literal("")),
);

export const zBoolean = z.boolean(requiredBoolean);

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

export const parseZodSchemaAndLogErrorOnParsingFailure = <T>(
  schema: z.Schema<T>,
  data: unknown,
  logger: Logger,
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error(
      { payload: { data, error } },
      `Parsing failed with schema '${schema.constructor.name}'`,
    );
    throw error;
  }
};

export const zEnumValidation = <T>(
  values: readonly T[],
  errorMessage: string,
): z.ZodType<T, z.ZodTypeDef, T> =>
  z.custom((val) => values.includes(val as T), {
    message: errorMessage,
  });
