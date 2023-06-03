import { Logger } from "pino";
import { z } from "zod";
import { timeHHmmRegExp } from "./utils/date";

// Change default error map behavior to provide context
// https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#global-error-map
z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_string" && issue.validation === "email")
    return {
      message: `${localization.invalidEmailFormat} - email fourni : ${ctx.data}`,
    };

  // Temporary regex instead of email - waiting for zod release
  if (issue.code === "invalid_string" && issue.validation === "regex")
    return {
      message: `invalide - valeur fournie : ${ctx.data}`,
    };

  return { message: ctx.defaultError };
});

export const localization = {
  atLeastOneEmail: "Vous devez renseigner au moins un email",
  atLeastOneJob: "Vous devez renseigner au moins un métier",
  beneficiaryTutorEmailMustBeDistinct:
    "Le mail du tuteur doit être différent des mails du bénéficiaire, de son représentant légal et de son employeur actuel.",
  expectedBoolean: "La sélection d'une valeur (oui/non) est obligatoire",
  expectText: "Une chaine de caractères est attendue",
  expectRadioButtonSelected: "Veuillez sélectionner une option.",
  invalidDate: "Le format de la date saisie est invalide",
  invalidDateEnd: "Le format de la date de fin est invalide",
  invalidDateStart: "Le format de la date de début est invalide",
  invalidDateStartDateEnd: "La date de fin doit être après la date de début.",
  invalidEmailFormat: "Veuillez saisir une adresse e-mail valide",
  invalidImmersionObjective: "Vous devez choisir un objectif d'immersion",
  invalidPhone: "Numéro de téléphone incorrect",
  invalidPostalCode: "Veuillez spécifier un code postal dans l'adresse.",
  invalidTimeFormat: "Le format de l'heure est invalide",
  invalidUuid: "Le format de l'identifiant est invalide",
  invalidValidationFormatDate:
    "Le format de la date de validation est invalide.",
  maxCharacters: (max: number) => `Le maximum est de ${max} caractères`,
  mustBeSignedByEveryone: "La confirmation de votre accord est obligatoire.",
  required: "Obligatoire",
  signatoriesDistinctEmails:
    "Les emails des signataires doivent être différents.",
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
export const zStringCanBeEmpty = z.string(requiredText);

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

export const zBoolean = z.boolean(requiredBoolean);

export const zToBolean = z.coerce.boolean(requiredBoolean);

export const zToNumber = z.coerce.number();

export const zUuidLike = z.string().length(36);

export const parseZodSchemaAndLogErrorOnParsingFailure = <T>(
  schema: z.Schema<T>,
  data: unknown,
  logger: Logger,
  context: Record<string, string>,
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error(
      { payload: { context, data, error } },
      `Parsing failed with schema '${schema.constructor.name}'`,
    );
    throw error;
  }
};

export const zEnumValidation = <T extends string>(
  values: readonly T[],
  errorMessage: string,
): z.ZodType<T, z.ZodTypeDef, T> =>
  z.custom((val: unknown): val is T => values.includes(val as T), {
    message: errorMessage,
  });

// Following is from https://github.com/colinhacks/zod/issues/372#issuecomment-826380330

// the difference with z.Schema<T> is that you keep the original type of the schema
// and you keep access to the methodes of that schema
// for example you can use .passthrough() for a z.object() which you could not do with z.Schema<T>

export const zSchemaForType =
  <T>() =>
  <S extends z.ZodType<T, any, any>>(arg: S) =>
    arg;

export const zAnyObj = z.object({}).passthrough();
