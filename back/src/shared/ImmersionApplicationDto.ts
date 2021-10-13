import { z } from "../../node_modules/zod";
import { agencyCodeSchema } from "./agencies";
import {
  emailAndMentorEmailAreDifferent,
  startDateIsBeforeEndDate,
  submissionAndStartDatesConstraints,
  underMaxDuration,
} from "./immersionApplicationRefinement";
import { LegacyScheduleDto, ScheduleDto } from "./ScheduleSchema";
import { Flavor } from "./typeFlavors";
import { NotEmptyArray, phoneRegExp } from "./utils";
import { zBoolean, zEmail, zString, zTrimmedString, zTrue } from "./zodUtils";

// Matches valid dates of the format 'yyyy-mm-dd'.
const dateRegExp = /\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/;

export type ApplicationStatus =
  | "UNKNOWN"
  | "DRAFT"
  | "IN_REVIEW"
  | "ACCEPTED_BY_COUNSELLOR"
  | "ACCEPTED_BY_VALIDATOR"
  | "VALIDATED"
  | "REJECTED";
const validApplicationStatus: NotEmptyArray<ApplicationStatus> = [
  "DRAFT",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "VALIDATED",
  "REJECTED",
];

const allApplicationStatuses: NotEmptyArray<ApplicationStatus> = [
  "UNKNOWN",
  ...validApplicationStatus,
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
const validApplicationSources: NotEmptyArray<ApplicationSource> = [
  "GENERIC",
  "BOULOGNE_SUR_MER",
  "NARBONNE",
];
export const applicationSourceFromString = (s: string): ApplicationSource => {
  const source = s as ApplicationSource;
  if (validApplicationSources.includes(source)) return source;
  return "UNKNOWN";
};

const scheduleSchema: z.ZodSchema<ScheduleDto> = z.any();
const legacyScheduleSchema: z.ZodSchema<LegacyScheduleDto> = z.any();

export type ImmersionApplicationId = Flavor<string, "DemandeImmersionId">;
const immersionApplicationIdSchema: z.ZodSchema<ImmersionApplicationId> =
  zTrimmedString;

// prettier-ignore
export type ImmersionApplicationDto = z.infer<typeof immersionApplicationSchema>;
export const immersionApplicationSchema = z
  .object({
    id: immersionApplicationIdSchema,
    status: z.enum(validApplicationStatus),
    source: z.enum(validApplicationSources),
    email: zEmail,
    firstName: zTrimmedString,
    lastName: zTrimmedString,
    phone: zString
      .regex(phoneRegExp, "Numero de téléphone incorrect")
      .optional(),
    agencyCode: agencyCodeSchema,
    dateSubmission: zString.regex(
      dateRegExp,
      "La date de saisie est invalide.",
    ),
    dateStart: zString.regex(dateRegExp, "La date de démarrage est invalide."),
    dateEnd: zString.regex(dateRegExp, "La date de fin invalide."),

    siret: zString.length(14, "SIRET doit étre composé de 14 chiffres"),
    businessName: zTrimmedString,
    mentor: zTrimmedString,
    mentorPhone: zString.regex(
      phoneRegExp,
      "Numero de téléphone de tuteur incorrect",
    ),
    mentorEmail: zEmail,
    schedule: scheduleSchema,
    legacySchedule: legacyScheduleSchema.optional(),
    individualProtection: zBoolean,
    sanitaryPrevention: zBoolean,
    sanitaryPreventionDescription: z.string().optional(),
    immersionAddress: z.string().optional(),
    immersionObjective: z.string().optional(),
    immersionProfession: zTrimmedString,
    immersionActivities: zTrimmedString,
    immersionSkills: z.string().optional(),
    beneficiaryAccepted: zTrue,
    enterpriseAccepted: zTrue,
  })
  .refine(submissionAndStartDatesConstraints, {
    message: "La date de démarrage doit étre au moins 2 jours après la saisie.",
    path: ["dateStart"],
  })
  .refine(startDateIsBeforeEndDate, {
    message: "La date de fin doit être après la date de début.",
    path: ["dateEnd"],
  })
  .refine(underMaxDuration, {
    message: "La durée maximale d'immersion est de 28 jours.",
    path: ["dateEnd"],
  })
  .refine(emailAndMentorEmailAreDifferent, {
    message: "Votre adresse e-mail doit être différente de celle du tuteur",
    path: ["mentorEmail"],
  });

export const immersionApplicationArraySchema = z.array(
  immersionApplicationSchema,
);

const idInObject = z.object({
  id: immersionApplicationIdSchema,
});

// prettier-ignore
export type AddImmersionApplicationResponseDto = z.infer<typeof addImmersionApplicationResponseDtoSchema>;
export const addImmersionApplicationResponseDtoSchema = idInObject;

// TODO: remove links once email sending is set up. This is purely for debugging.
export const addImmersionApplicationMLResponseDtoSchema = z.object({
  magicLinkApplicant: z.string(),
  magicLinkEnterprise: z.string(),
});

export type AddImmersionApplicationMLResponseDto = z.infer<
  typeof addImmersionApplicationMLResponseDtoSchema
>;

// prettier-ignore
export type GetImmersionApplicationRequestDto = z.infer<typeof getImmersionApplicationRequestDtoSchema>;
export const getImmersionApplicationRequestDtoSchema = idInObject;

// prettier-ignore
export type UpdateImmersionApplicationRequestDto = z.infer<typeof updateImmersionApplicationRequestDtoSchema>;
export const updateImmersionApplicationRequestDtoSchema = z
  .object({
    demandeImmersion: immersionApplicationSchema,
    id: immersionApplicationIdSchema,
  })
  .refine(
    ({ demandeImmersion, id }) => id === demandeImmersion.id,
    "The ID in the URL path must match the ID in the request body.",
  );

// prettier-ignore
export type UpdateImmersionApplicationResponseDto = z.infer<typeof updateImmersionApplicationResponseDtoSchema>;
export const updateImmersionApplicationResponseDtoSchema = idInObject;

// prettier-ignore
export type ValidateImmersionApplicationRequestDto = z.infer<typeof validateImmersionApplicationRequestDtoSchema>;
export const validateImmersionApplicationRequestDtoSchema =
  immersionApplicationIdSchema;

// prettier-ignore
export type ValidateImmersionApplicationResponseDto = z.infer<typeof validateImmersionApplicationResponseDtoSchema>;
export const validateImmersionApplicationResponseDtoSchema = idInObject;

// prettier-ignore
export type UpdateImmersionApplicationStatusRequestDto = z.infer<typeof updateImmersionApplicationStatusRequestSchema>;
export const updateImmersionApplicationStatusRequestSchema = z.object({
  status: z.enum(validApplicationStatus),
  justification: z.string().optional(),
});

// prettier-ignore
export type UpdateImmersionApplicationStatusResponseDto = z.infer<typeof updateImmersionApplicationStatusResponseSchema>;
export const updateImmersionApplicationStatusResponseSchema = idInObject;
