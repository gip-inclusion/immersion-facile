import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { siretSchema } from "../siret";
import { phoneRegExp, stringOfNumbers } from "../utils";
import {
  zBoolean,
  zEmail,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  allConventionStatuses,
  Beneficiary,
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
  conventionObjectiveOptions,
  ConventionReadDto,
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto,
  ListConventionsRequestDto,
  Mentor,
  LegalRepresentative,
  RenewMagicLinkRequestDto,
  UpdateConventionRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "./convention.dto";
import {
  emailAndMentorEmailAreDifferent,
  getConventionTooLongMessageAndPath,
  mustBeSignedByEveryone,
  startDateIsBeforeEndDate,
  underMaxCalendarDuration,
} from "./conventionRefinements";

import { peConnectPrefixSchema } from "../federatedIdentities/federatedIdentity.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { scheduleSchema } from "../schedule/Schedule.schema";
import { allRoles } from "../tokens/MagicLinkPayload";
import { dateRegExp } from "../utils/date";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import { getConventionFieldName } from "./convention";

export const conventionIdSchema: z.ZodSchema<ConventionId> = zTrimmedString;
export const externalConventionIdSchema: z.ZodSchema<ConventionExternalId> =
  zTrimmedString;

const roleSchema = z.enum(allRoles);
const phoneSchema = z
  .string()
  .regex(phoneRegExp, "Numéro de téléphone incorrect");

const signatorySchema = z.object({
  role: roleSchema,
  email: zEmail,
  phone: phoneSchema,
  firstName: zTrimmedString,
  lastName: zTrimmedString,
  signedAt: zString.regex(dateRegExp).optional(),
});

const beneficiarySchema: z.Schema<Beneficiary> = signatorySchema.merge(
  z.object({
    role: z.enum(["beneficiary"]),
    emergencyContact: zStringPossiblyEmpty,
    emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
    federatedIdentity: peConnectPrefixSchema.optional(),
  }),
);

const mentorSchema: z.Schema<Mentor> = signatorySchema.merge(
  z.object({
    role: z.enum(["establishment"]),
    job: zStringPossiblyEmpty,
  }),
);
const legalRepresentativeSchema: z.Schema<LegalRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["legal-representative"]),
      job: zStringPossiblyEmpty,
    }),
  );

const conventionWithoutExternalIdZObject = z.object({
  id: conventionIdSchema,
  externalId: externalConventionIdSchema.optional(),
  status: z.enum(allConventionStatuses),
  rejectionJustification: z.string().optional(),
  postalCode: z
    .string()
    .regex(stringOfNumbers)
    .length(5, "5 chiffres sont nécessaires pour le code postal")
    .optional(),
  agencyId: agencyIdSchema,
  dateSubmission: zString.regex(dateRegExp, "La date de saisie est invalide."),
  dateStart: zString.regex(dateRegExp, "La date de démarrage est invalide."),
  dateEnd: zString.regex(dateRegExp, "La date de fin invalide."),
  dateValidation: zString
    .regex(dateRegExp, "La date de validation invalide.")
    .optional(),
  siret: siretSchema,
  businessName: zTrimmedString,
  schedule: scheduleSchema,
  workConditions: z.string().optional(),
  individualProtection: zBoolean,
  sanitaryPrevention: zBoolean,
  sanitaryPreventionDescription: zStringPossiblyEmpty,
  immersionAddress: addressWithPostalCodeSchema,
  immersionObjective: z.enum(conventionObjectiveOptions),
  immersionAppellation: appellationDtoSchema,
  immersionActivities: zTrimmedString,
  immersionSkills: zStringPossiblyEmpty,
  internshipKind: z.enum(["immersion", "mini-stage-cci"]),
  signatories: z.object({
    beneficiary: beneficiarySchema,
    mentor: mentorSchema,
    legalRepresentative: legalRepresentativeSchema.optional(),
  }),
});

export const conventionWithoutExternalIdSchema: z.Schema<ConventionDtoWithoutExternalId> =
  conventionWithoutExternalIdZObject
    .refine(startDateIsBeforeEndDate, {
      message: "La date de fin doit être après la date de début.",
      path: [getConventionFieldName("dateEnd")],
    })
    .refine(underMaxCalendarDuration, getConventionTooLongMessageAndPath)
    .refine(emailAndMentorEmailAreDifferent, {
      message: "Votre adresse e-mail doit être différente de celle du tuteur",
      path: [
        getConventionFieldName("signatories.mentor.email"),
        getConventionFieldName("signatories.beneficiary.email"),
      ],
    })
    .refine(mustBeSignedByEveryone, {
      message: "La confirmation de votre accord est obligatoire.",
      path: [getConventionFieldName("status")],
    });

export const conventionSchema: z.Schema<ConventionDto> =
  conventionWithoutExternalIdZObject
    .merge(z.object({ externalId: externalConventionIdSchema }))
    .refine(startDateIsBeforeEndDate, {
      message: "La date de fin doit être après la date de début.",
      path: [getConventionFieldName("dateEnd")],
    })
    .refine(underMaxCalendarDuration, getConventionTooLongMessageAndPath)
    .refine(emailAndMentorEmailAreDifferent, {
      message: "Votre adresse e-mail doit être différente de celle du tuteur",
      path: [
        getConventionFieldName("signatories.mentor.email"),
        getConventionFieldName("signatories.beneficiary.email"),
      ],
    })
    .refine(mustBeSignedByEveryone, {
      message: "La confirmation de votre accord est obligatoire.",
      path: [getConventionFieldName("status")],
    });

export const conventionReadSchema: z.Schema<ConventionReadDto> =
  conventionWithoutExternalIdZObject
    .merge(
      z.object({
        externalId: externalConventionIdSchema,
        agencyName: z.string(),
      }),
    )
    .refine(startDateIsBeforeEndDate, {
      message: "La date de fin doit être après la date de début.",
      path: [getConventionFieldName("dateEnd")],
    })
    .refine(underMaxCalendarDuration, getConventionTooLongMessageAndPath)
    .refine(emailAndMentorEmailAreDifferent, {
      message: "Votre adresse e-mail doit être différente de celle du tuteur",
      path: [
        getConventionFieldName("signatories.mentor.email"),
        getConventionFieldName("signatories.beneficiary.email"),
      ],
    })
    .refine(mustBeSignedByEveryone, {
      message: "La confirmation de votre accord est obligatoire.",
      path: [getConventionFieldName("status")],
    });

export const conventionReadsSchema: z.Schema<Array<ConventionReadDto>> =
  z.array(conventionReadSchema);

export const conventionUkraineSchema: z.Schema<ConventionDto> =
  conventionSchema;

export const withConventionIdSchema: z.Schema<WithConventionId> = z.object({
  id: conventionIdSchema,
});

export const updateConventionRequestSchema: z.Schema<UpdateConventionRequestDto> =
  z
    .object({
      convention: conventionSchema,
      id: conventionIdSchema,
    })
    .refine(
      ({ convention, id }) => id === convention.id,
      "The ID in the URL path must match the ID in the request body.",
    );

export const listConventionsRequestSchema: z.Schema<ListConventionsRequestDto> =
  z.object({
    agencyId: agencyIdSchema.optional(),
    status: z.enum(allConventionStatuses).optional(),
  });

export const updateConventionStatusRequestSchema: z.Schema<UpdateConventionStatusRequestDto> =
  z.object({
    status: z.enum(allConventionStatuses),
    justification: z.string().optional(),
  });

export const generateMagicLinkRequestSchema: z.Schema<GenerateMagicLinkRequestDto> =
  z.object({
    applicationId: conventionIdSchema,
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
