import { z } from "../../node_modules/zod";
import { agencyIdSchema } from "./agencies";
import {
  emailAndMentorEmailAreDifferent,
  enoughWorkedDaysToReviewFromSubmitDate,
  mustBeSignedByBeneficiaryBeforeReview,
  mustBeSignedByEstablishmentBeforeReview,
  startDateIsBeforeEndDate,
  submissionAndStartDatesConstraints,
  underMaxDuration,
} from "./immersionApplicationRefinement";
import {
  LegacyScheduleDto,
  reasonableSchedule,
  ScheduleDto,
} from "./ScheduleSchema";
import { siretSchema } from "./siret";
import { allRoles, Role } from "./tokens/MagicLinkPayload";
import { Flavor } from "./typeFlavors";
import {
  addressWithPostalCodeSchema,
  NotEmptyArray,
  phoneRegExp,
} from "./utils";
import { zBoolean, zEmail, zString, zTrimmedString } from "./zodUtils";

// Matches valid dates of the format 'yyyy-mm-dd'.
const dateRegExp = /\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/;

export type ApplicationStatus =
  | "UNKNOWN"
  | "DRAFT"
  | "READY_TO_SIGN"
  | "PARTIALLY_SIGNED"
  | "IN_REVIEW"
  | "ACCEPTED_BY_COUNSELLOR"
  | "ACCEPTED_BY_VALIDATOR"
  | "VALIDATED"
  | "REJECTED";
export const validApplicationStatus: NotEmptyArray<ApplicationStatus> = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "VALIDATED",
  "REJECTED",
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
    rejectionJustification: z.string().optional(),
    source: z.enum(validApplicationSources),
    email: zEmail,
    firstName: zTrimmedString,
    lastName: zTrimmedString,
    phone: z
      .string()
      .regex(phoneRegExp, "Numero de téléphone incorrect")
      .optional(),
    agencyId: agencyIdSchema,
    dateSubmission: zString.regex(
      dateRegExp,
      "La date de saisie est invalide.",
    ),
    dateStart: zString.regex(dateRegExp, "La date de démarrage est invalide."),
    dateEnd: zString.regex(dateRegExp, "La date de fin invalide."),

    siret: siretSchema,
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
    immersionAddress: addressWithPostalCodeSchema.optional(),
    immersionObjective: z.string().optional(),
    immersionProfession: zTrimmedString,
    immersionActivities: zTrimmedString,
    immersionSkills: z.string().optional(),
    beneficiaryAccepted: zBoolean,
    enterpriseAccepted: zBoolean,
  })
  .refine(submissionAndStartDatesConstraints, {
    message: "La date de démarrage doit étre au moins 2 jours après la saisie.",
    path: ["dateStart"],
  })
  .refine(enoughWorkedDaysToReviewFromSubmitDate, {
    message:
      "Veuillez saisir une date de démarrage permettant au moins 24h pour sa validation par un conseiller",
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
  })
  .refine(mustBeSignedByBeneficiaryBeforeReview, {
    message: "L'engagement est obligatoire",
    path: ["beneficiaryAccepted"],
  })
  .refine(mustBeSignedByEstablishmentBeforeReview, {
    message: "L'engagement est obligatoire",
    path: ["enterpriseAccepted"],
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
export type ListImmersionApplicationRequestDto = z.infer<typeof listImmersionApplicationRequestDtoSchema>;
export const listImmersionApplicationRequestDtoSchema = z.object({
  agencyId: agencyIdSchema.optional(),
  status: z.enum(validApplicationStatus).optional(),
});

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

export type SignImmersionApplicationRequestDto = z.infer<
  typeof signImmersionApplicationRequestSchema
>;
export const signImmersionApplicationRequestSchema = z.object({});

export type SignImmersionApplicationResponseDto = z.infer<
  typeof signImmersionApplicationResponseSchema
>;
export const signImmersionApplicationResponseSchema = idInObject;

// prettier-ignore
export type GenerateMagicLinkRequestDto = z.infer<typeof generateMagicLinkRequestSchema>;
export const generateMagicLinkRequestSchema = z.object({
  applicationId: immersionApplicationIdSchema,
  role: z.enum(allRoles),
  expired: z.boolean(), //< defaults to false
});

// prettier-ignore
export type GenerateMagicLinkResponseDto = z.infer<typeof generateMagicLinkResponseSchema>;
export const generateMagicLinkResponseSchema = z.object({
  jwt: z.string(),
});

// prettier-ignore
export type RenewMagicLinkRequestDto = z.infer<typeof renewMagicLinkRequestSchema>;
export const renewMagicLinkRequestSchema = z.object({
  applicationId: immersionApplicationIdSchema,
  role: z.enum(allRoles),
  linkFormat: z.string(),
});

export const IMMERSION_APPLICATION_TEMPLATE: ImmersionApplicationDto = {
  id: "fake-test-id",
  status: "DRAFT",
  source: "GENERIC",
  email: "esteban@ocon.fr",
  phone: "+33012345678",
  firstName: "Esteban",
  lastName: "Ocon",
  agencyId: "fake-agency-id",
  dateSubmission: "2021-07-01",
  dateStart: "2021-08-01",
  dateEnd: "2021-08-31",
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  mentor: "Alain Prost",
  mentorPhone: "0601010101",
  mentorEmail: "alain@prost.fr",
  schedule: reasonableSchedule,
  legacySchedule: undefined,
  immersionAddress: "75001 Centre du monde",
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionProfession: "Pilote d'automobile",
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
};

// Returns an application signed by provided roles.
export const signApplicationDtoWithRoles = (
  application: ImmersionApplicationDto,
  roles: Role[],
) => {
  if (
    !["DRAFT", "READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(application.status)
  ) {
    throw new Error(
      "Incorrect initial application status: " + application.status,
    );
  }

  const enterpriseAccepted = roles.includes("establishment")
    ? true
    : application.enterpriseAccepted;
  const beneficiaryAccepted = roles.includes("beneficiary")
    ? true
    : application.beneficiaryAccepted;
  let status: ApplicationStatus = "READY_TO_SIGN";
  // if beneficiaryAccepted XOR enterpise accepted
  if (
    (enterpriseAccepted && !beneficiaryAccepted) ||
    (!enterpriseAccepted && beneficiaryAccepted)
  ) {
    status = "PARTIALLY_SIGNED";
  }
  if (enterpriseAccepted && beneficiaryAccepted) {
    status = "IN_REVIEW";
  }
  return {
    ...application,
    beneficiaryAccepted,
    enterpriseAccepted,
    status,
  };
};
