import * as Yup from "../../node_modules/yup";
import { LegacyScheduleDto, ScheduleDto } from "./ScheduleSchema";
import { Flavor } from "./typeFlavors";
import { phoneRegExp } from "./utils";

// Matches valid dates of the format 'yyyy-mm-dd'.
const dateRegExp = /\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/;

export type ApplicationStatus = "UNKNOWN" | "DRAFT" | "IN_REVIEW" | "VALIDATED";
const validApplicationStatus: ApplicationStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "VALIDATED",
];
export const applicationStatusFromString = (s: string): ApplicationStatus => {
  const status = s as ApplicationStatus;
  if (validApplicationStatus.includes(status)) return status;
  return "UNKNOWN";
};

export type ApplicationSource =
  | "UNKNOWN"
  | "GENERIC"
  | "BOULOGNE_SUR_MER"
  | "NARBONNE";
const validApplicationSources: ApplicationSource[] = [
  "GENERIC",
  "BOULOGNE_SUR_MER",
  "NARBONNE",
];
export const applicationSourceFromString = (s: string): ApplicationSource => {
  const source = s as ApplicationSource;
  if (validApplicationSources.includes(source)) return source;
  return "UNKNOWN";
};

export type DemandeImmersionId = Flavor<string, "DemandeImmersionId">;

export const demandeImmersionDtoSchema = Yup.object({
  id: Yup.mixed<DemandeImmersionId>()
    .required("Obligatoire")
    .test("no-empty-id", "L'ID est obligatoire", (value) => {
      if (typeof value !== "string") return false;
      return value.trim() !== "";
    }),
  status: Yup.mixed<ApplicationStatus>()
    .oneOf(validApplicationStatus)
    .required("Obligatoire"),
  source: Yup.mixed<ApplicationSource>()
    .oneOf(validApplicationSources)
    .required(),
  email: Yup.string()
    .trim()
    .required("Obligatoire")
    .email("Veuillez saisir une adresse e-mail valide"),
  firstName: Yup.string().trim().required("Obligatoire"),
  lastName: Yup.string().trim().required("Obligatoire"),
  phone: Yup.string()
    .trim()
    .matches(phoneRegExp, "Numero de téléphone incorrect")
    .nullable(true),
  dateSubmission: Yup.string()
    .trim()
    .matches(dateRegExp, "La date de saisie est invalide.")
    .required("Obligatoire"),
  dateStart: Yup.string()
    .trim()
    .matches(dateRegExp, "La date de démarrage est invalide.")
    .test(
      "dateStart-min",
      "La date de démarrage doit étre au moins 2 jours après la saisie.",
      (value, context) => {
        if (!value || !context.parent.dateSubmission) {
          return false;
        }
        const startDate = new Date(value);
        const submissionDate = new Date(context.parent.dateSubmission);

        const minStartDate = new Date(submissionDate);
        minStartDate.setDate(minStartDate.getDate() + 2);
        return startDate >= minStartDate;
      },
    )
    .required("Obligatoire"),
  dateEnd: Yup.string()
    .trim()
    .matches(dateRegExp, "La date de fin invalide.")
    .test(
      "dateEnd-min",
      "La date de fin doit être après la date de début.",
      (value, context) => {
        if (!value || !context.parent.dateStart) {
          return false;
        }
        const startDate = new Date(context.parent.dateStart);
        const endDate = new Date(value);

        return endDate > startDate;
      },
    )
    .test(
      "dateEnd-max",
      "La durée maximale d'immersion est de 28 jours.",
      (value, context) => {
        if (!value || !context.parent.dateStart) {
          return false;
        }
        const startDate = new Date(context.parent.dateStart);
        const endDate = new Date(value);

        const maxEndDate = new Date(startDate);
        maxEndDate.setDate(maxEndDate.getDate() + 28);
        return endDate <= maxEndDate;
      },
    )
    .required("Obligatoire"),
  siret: Yup.string()
    .trim()
    .required("Obligatoire")
    .length(14, "SIRET doit étre composé de 14 chiffres"),
  businessName: Yup.string().trim().required("Obligatoire"),

  mentor: Yup.string().trim().required("Obligatoire"),
  mentorPhone: Yup.string()
    .trim()
    .required("Obligatoire")
    .matches(phoneRegExp, "Numero de téléphone de tuteur incorrect"),
  mentorEmail: Yup.string()
    .trim()
    .required("Obligatoire")
    .email("Veuillez saisir une adresse mail correcte")
    .test(
      "notEqualToOtherEmail",
      "Votre adresse e-mail doit être différente de celle du tuteur",
      (value, context) => {
        if (!value || !context.parent.email) {
          return false;
        }

        return context.parent.email !== value;
      },
    ),

  schedule: Yup.mixed<ScheduleDto>().required(),
  legacySchedule: Yup.mixed<LegacyScheduleDto>(),

  individualProtection: Yup.boolean().required("Obligatoire"),
  sanitaryPrevention: Yup.boolean().required("Obligatoire"),
  sanitaryPreventionDescription: Yup.string().trim().nullable(true),

  immersionAddress: Yup.string().trim().nullable(true),
  immersionObjective: Yup.string().trim().nullable(true),
  immersionProfession: Yup.string().trim().required("Obligatoire"),
  immersionActivities: Yup.string().trim().required("Obligatoire"),
  immersionSkills: Yup.string().trim().nullable(true),
  beneficiaryAccepted: Yup.boolean().equals(
    [true],
    "L'engagement est obligatoire",
  ),
  enterpriseAccepted: Yup.boolean().equals(
    [true],
    "L'engagement est obligatoire",
  ),
}).required();

export const demandeImmersionDtoArraySchema = Yup.array().of(
  demandeImmersionDtoSchema,
);

export type DemandeImmersionDto = Yup.InferType<
  typeof demandeImmersionDtoSchema
>;

export const addDemandeImmersionResponseDtoSchema = Yup.object({
  id: Yup.mixed<DemandeImmersionId>().required(),
}).required();

export type AddDemandeImmersionResponseDto = Yup.InferType<
  typeof addDemandeImmersionResponseDtoSchema
>;

export const getDemandeImmersionRequestDtoSchema = Yup.object({
  id: Yup.mixed<DemandeImmersionId>().required(),
}).required();

export type GetDemandeImmersionRequestDto = Yup.InferType<
  typeof getDemandeImmersionRequestDtoSchema
>;

export const updateDemandeImmersionRequestDtoSchema = Yup.object({
  id: Yup.mixed<DemandeImmersionId>()
    .required()
    .test(
      "id-match",
      "The ID in the URL path must match the ID in the request body.",
      (value, context) =>
        value &&
        context.parent.demandeImmersion &&
        value === context.parent.demandeImmersion.id,
    ),
  demandeImmersion: demandeImmersionDtoSchema.required(),
}).required();

export type UpdateDemandeImmersionRequestDto = Yup.InferType<
  typeof updateDemandeImmersionRequestDtoSchema
>;

export const updateDemandeImmersionResponseDtoSchema = Yup.object({
  id: Yup.mixed<DemandeImmersionId>().required(),
}).required();

export type UpdateDemandeImmersionResponseDto = Yup.InferType<
  typeof updateDemandeImmersionResponseDtoSchema
>;

export const validateDemandeImmersionRequestDtoSchema =
  Yup.mixed<DemandeImmersionId>().required();

export type ValidateDemandeImmersionRequestDto = Yup.InferType<
  typeof validateDemandeImmersionRequestDtoSchema
>;

export const validateDemandeImmersionResponseDtoSchema = Yup.object({
  id: Yup.mixed<DemandeImmersionId>().required(),
}).required();

export type ValidateDemandeImmersionResponseDto = Yup.InferType<
  typeof validateDemandeImmersionResponseDtoSchema
>;
