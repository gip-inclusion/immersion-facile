import { z } from "zod";
import { zBoolean, zEmail, zString, zTrimmedString } from "../zodUtils";
import { phoneRegExp, stringOfNumbers } from "../utils";
import { agencyIdSchema } from "../agency/agency.schema";
import { siretSchema } from "../siret";
import {
  emailAndMentorEmailAreDifferent,
  mustBeSignedByBeneficiaryBeforeReview,
  mustBeSignedByEstablishmentBeforeReview,
  startDateIsBeforeEndDate,
  underMaxDuration,
} from "../immersionApplicationRefinement";
import {
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  ListImmersionApplicationRequestDto,
  RenewMagicLinkRequestDto,
  UpdateImmersionApplicationRequestDto,
  UpdateImmersionApplicationStatusRequestDto,
  validApplicationStatus,
  WithImmersionApplicationId,
} from "./ImmersionApplication.dto";
import { LegacyScheduleDto, ScheduleDto } from "../ScheduleSchema";
import { dateRegExp } from "../utils/date";
import { allRoles } from "../tokens/MagicLinkPayload";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";

export const immersionApplicationIdSchema: z.ZodSchema<ImmersionApplicationId> =
  zTrimmedString;

const scheduleSchema: z.ZodSchema<ScheduleDto> = z.any();
const legacyScheduleSchema: z.ZodSchema<LegacyScheduleDto> = z.any();

export const immersionApplicationSchema: z.Schema<ImmersionApplicationDto> = z
  .object({
    id: immersionApplicationIdSchema,
    status: z.enum(validApplicationStatus),
    rejectionJustification: z.string().optional(),
    email: zEmail,
    firstName: zTrimmedString,
    lastName: zTrimmedString,
    phone: z
      .string()
      .regex(phoneRegExp, "Numero de téléphone incorrect")
      .optional(),
    postalCode: z
      .string()
      .regex(stringOfNumbers)
      .length(5, "5 chiffres sont nécessaires pour le code postal")
      .optional(),
    emergencyContact: z.string().optional(),
    emergencyContactPhone: z
      .string()
      .regex(phoneRegExp, "Numero de téléphone incorrect")
      .optional()
      .or(z.literal("")),
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
    workConditions: z.string().optional(),
    individualProtection: zBoolean,
    sanitaryPrevention: zBoolean,
    sanitaryPreventionDescription: z.string().optional(),
    immersionAddress: addressWithPostalCodeSchema.optional(),
    immersionObjective: zString,
    immersionAppellation: appellationDtoSchema,
    immersionActivities: zTrimmedString,
    immersionSkills: z.string().optional(),
    beneficiaryAccepted: zBoolean,
    enterpriseAccepted: zBoolean,
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
    message: "La confirmation de votre accord est obligatoire.",
    path: ["beneficiaryAccepted"],
  })
  .refine(mustBeSignedByEstablishmentBeforeReview, {
    message: "La confirmation de votre accord est obligatoire.",
    path: ["enterpriseAccepted"],
  });

export const immersionApplicationUkraineSchema: z.Schema<ImmersionApplicationDto> =
  z
    .object({
      id: immersionApplicationIdSchema,
      status: z.enum(validApplicationStatus),
      rejectionJustification: z.string().optional(),
      email: zEmail,
      firstName: zTrimmedString,
      lastName: zTrimmedString,
      phone: z
        .string()
        .regex(phoneRegExp, "Numero de téléphone incorrect")
        .optional(),
      postalCode: z
        .string()
        .regex(stringOfNumbers)
        .length(5, "5 chiffres sont nécessaires pour le code postal")
        .optional(),
      emergencyContact: zTrimmedString.optional(),
      emergencyContactPhone: z
        .string()
        .regex(phoneRegExp, "Numero de téléphone incorrect")
        .optional(),
      agencyId: agencyIdSchema,
      dateSubmission: zString.regex(
        dateRegExp,
        "La date de saisie est invalide.",
      ),
      dateStart: zString.regex(
        dateRegExp,
        "La date de démarrage est invalide.",
      ),
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
      workConditions: z.string().optional(),
      individualProtection: zBoolean,
      sanitaryPrevention: zBoolean,
      sanitaryPreventionDescription: z.string().optional(),
      immersionAddress: addressWithPostalCodeSchema.optional(),
      immersionObjective: zString,
      immersionAppellation: appellationDtoSchema,
      immersionActivities: zTrimmedString,
      immersionSkills: z.string().optional(),
      beneficiaryAccepted: zBoolean,
      enterpriseAccepted: zBoolean,
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
      message: "La confirmation de votre accord est obligatoire.",
      path: ["beneficiaryAccepted"],
    })
    .refine(mustBeSignedByEstablishmentBeforeReview, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["enterpriseAccepted"],
    });

export const withImmersionApplicationIdSchema: z.Schema<WithImmersionApplicationId> =
  z.object({
    id: immersionApplicationIdSchema,
  });

export const updateImmersionApplicationRequestDtoSchema: z.Schema<UpdateImmersionApplicationRequestDto> =
  z
    .object({
      immersionApplication: immersionApplicationSchema,
      id: immersionApplicationIdSchema,
    })
    .refine(
      ({ immersionApplication, id }) => id === immersionApplication.id,
      "The ID in the URL path must match the ID in the request body.",
    );

export const listImmersionApplicationRequestDtoSchema: z.Schema<ListImmersionApplicationRequestDto> =
  z.object({
    agencyId: agencyIdSchema.optional(),
    status: z.enum(validApplicationStatus).optional(),
  });

export const updateImmersionApplicationStatusRequestSchema: z.Schema<UpdateImmersionApplicationStatusRequestDto> =
  z.object({
    status: z.enum(validApplicationStatus),
    justification: z.string().optional(),
  });

export const generateMagicLinkRequestSchema: z.Schema<GenerateMagicLinkRequestDto> =
  z.object({
    applicationId: immersionApplicationIdSchema,
    role: z.enum(allRoles),
    expired: z.boolean(), //< defaults to false
  });

export const generateMagicLinkResponseSchema: z.Schema<GenerateMagicLinkResponseDto> =
  z.object({
    jwt: z.string(),
  });

export const renewMagicLinkRequestSchema: z.Schema<RenewMagicLinkRequestDto> =
  z.object({
    linkFormat: z.string(),
    expiredJwt: z.string(),
  });
