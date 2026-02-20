import { z } from "zod";

export const localization = {
  atLeastOneEmail: "Vous devez renseigner au moins un email",
  atLeastOneJob: "Vous devez renseigner au moins un métier",
  atLeastOneRole: "Vous devez choisir au moins un rôle",
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
  invalidTextWithHtml:
    "Un text comprennant des éléments HTML n'est pas autorisé.",
  invalidTimeFormat: "Le format de l'heure est invalide",
  invalidUuid: "Le format de l'identifiant est invalide",
  invalidValidationFormatDate:
    "Le format de la date de validation est invalide.",
  invalidApprovalFormatDate: "Le format de la date d'approbation est invalide",
  maxCharacters: (max: number) => `Le maximum est de ${max} caractères`,
  mustBeSignedByEveryone: "La confirmation de votre accord est obligatoire.",
  required: "Ce champ est obligatoire",
  signatoriesDistinctEmails:
    "Les emails des signataires doivent être différents.",
  signatoriesDistinctPhoneNumbers:
    "Les numéros de téléphone des signataires doivent être différents.",
  invalidAppellations: "Les métiers renseignés sont invalides.",
  invalidAddress: "L'adresse est invalide",
  invalidEnum: "Vous devez sélectionner une option parmi celles proposées",
  invalidSiret: "SIRET doit être composé de 14 chiffres",
};

export const zBoolean = z.boolean({
  error: localization.required,
});

export const zToBoolean = z
  .any()
  .transform((v) =>
    ["true", "1"].includes((v ?? "false").toString().toLowerCase()),
  );

export const zToNumber: ZodSchemaWithInputMatchingOutput<number> =
  z.coerce.number();

export const emptyObjectSchema: ZodSchemaWithInputMatchingOutput<
  Record<string, never>
> = z.object({}).strict();

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

export type ZodSchemaWithInputMatchingOutput<T> = z.ZodType<
  T,
  T,
  z.core.$ZodTypeInternals<T, T>
>;
