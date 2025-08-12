import { z } from "zod/v4";
import { timeHHmmRegExp } from "./utils/date";

export const localization = {
  atLeastOneEmail: "Vous devez renseigner au moins un email",
  atLeastOneJob: "Vous devez renseigner au moins un métier",
  beneficiaryTutorEmailMustBeDistinct:
    "Le mail du tuteur doit être différent des mails du bénéficiaire, de son représentant légal et de son employeur actuel.",
  expectedBoolean: "La sélection d'une valeur (oui/non) est obligatoire",
  expectText: "Une chaine de caractères est attendue",
  expectRadioButtonSelected: "Veuillez sélectionner une option.",
  invalidBeneficiaryAddress:
    "L'adresse complète du candidat doit être renseignée.",
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
  invalidApprovalFormatDate: "Le format de la date d'approbation est invalide",
  maxCharacters: (max: number) => `Le maximum est de ${max} caractères`,
  mustBeSignedByEveryone: "La confirmation de votre accord est obligatoire.",
  required: "Obligatoire",
  signatoriesDistinctEmails:
    "Les emails des signataires doivent être différents.",
  signatoriesDistinctPhoneNumbers:
    "Les numéros de téléphone des signataires doivent être différents.",
  invalidAppellations: "Les métiers renseignés sont invalides.",
  invalidAddress: "L'adresse est invalide",
  invalidEnum: "Vous devez sélectionner une option parmi celles proposées",
};

export const zStringMinLength1 = z
  .string({
    error: localization.required,
  })
  .trim()
  .min(1, localization.required);

export const zStringCanBeEmpty = z.string().trim();

export const zStringPossiblyEmptyWithMax = (max: number): z.Schema<string> =>
  zStringCanBeEmpty.max(max, localization.maxCharacters(max));

export const zTrimmedStringWithMax = (max: number) =>
  zStringMinLength1.max(max, localization.maxCharacters(max));

export const stringWithMaxLength255 = zTrimmedStringWithMax(255);

export const zTimeString = z
  .string({
    error: localization.required,
  })
  .regex(timeHHmmRegExp, localization.invalidTimeFormat);

export const makezTrimmedString = (message: string) =>
  zStringMinLength1
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, message);

export const zBoolean = z.boolean({
  error: localization.required,
});

export const zToBoolean = z
  .any()
  .transform((v) =>
    ["true", "1"].includes((v ?? "false").toString().toLowerCase()),
  );

export const zToNumber = z.coerce.number();

export const zUuidLike = z.string().length(36);

export const emptyObjectSchema: z.Schema<Record<string, never>> = z
  .object({})
  .strict();

export const personNameSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-zÀ-ÿ\s'-]*$/,
    "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
  )
  .transform((val) => val.replace(/\s+/g, " "));

export const expressEmptyResponseBody = z.void().or(z.literal(""));

export const expressEmptyResponseBodyOrEmptyObject =
  expressEmptyResponseBody.or(z.object({}).strict());

export const zEnumValidation = <T extends string>(
  values: readonly [T, ...T[]],
  errorMessage: string,
) =>
  z.enum(values, {
    error: errorMessage,
  });

export const zAnyObj = z.object({}).loose();
