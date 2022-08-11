import { z } from "zod";
import {
  zBoolean,
  zEmail,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import { phoneRegExp, stringOfNumbers } from "../utils";
import { agencyIdSchema } from "../agency/agency.schema";
import { siretSchema } from "../siret";
import {
  emailAndMentorEmailAreDifferent,
  mustBeSignedByBeneficiary,
  mustBeSignedByEstablishment,
  startDateIsBeforeEndDate,
  underMaxDuration,
} from "./conventionRefinements";
import {
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto,
  ConventionDto,
  ConventionId,
  ListConventionsRequestDto,
  RenewMagicLinkRequestDto,
  UpdateConventionRequestDto,
  UpdateConventionStatusRequestDto,
  allConventionStatuses,
  WithConventionId,
  ConventionExternalId,
  ConventionDtoWithoutExternalId,
  conventionObjectiveOptions,
  ConventionReadDto,
} from "./convention.dto";

import { dateRegExp } from "../utils/date";
import { allRoles } from "../tokens/MagicLinkPayload";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { peConnectPrefixSchema } from "../federatedIdentities/federatedIdentity.schema";
import { scheduleSchema } from "../schedule/Schedule.schema";

export const conventionIdSchema: z.ZodSchema<ConventionId> = zTrimmedString;
export const externalConventionIdSchema: z.ZodSchema<ConventionExternalId> =
  zTrimmedString;

const conventionWithoutExternalIdZObject = z.object({
  id: conventionIdSchema,
  externalId: externalConventionIdSchema.optional(),
  status: z.enum(allConventionStatuses),
  rejectionJustification: z.string().optional(),
  email: zEmail,
  firstName: zTrimmedString,
  lastName: zTrimmedString,
  phone: z.string().regex(phoneRegExp, "Numéro de téléphone incorrect"),
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
  dateSubmission: zString.regex(dateRegExp, "La date de saisie est invalide."),
  dateStart: zString.regex(dateRegExp, "La date de démarrage est invalide."),
  dateEnd: zString.regex(dateRegExp, "La date de fin invalide."),
  dateValidation: zString
    .regex(dateRegExp, "La date de validation invalide.")
    .optional(),
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
  sanitaryPreventionDescription: zStringPossiblyEmpty,
  immersionAddress: addressWithPostalCodeSchema,
  immersionObjective: z.enum(conventionObjectiveOptions),
  immersionAppellation: appellationDtoSchema,
  immersionActivities: zTrimmedString,
  immersionSkills: zStringPossiblyEmpty,
  beneficiaryAccepted: zBoolean,
  enterpriseAccepted: zBoolean,
  federatedIdentity: peConnectPrefixSchema.optional(),
  internshipKind: z.enum(["immersion", "mini-stage-cci"]),
});

export const conventionWithoutExternalIdSchema: z.Schema<ConventionDtoWithoutExternalId> =
  conventionWithoutExternalIdZObject
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
    .refine(mustBeSignedByBeneficiary, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["beneficiaryAccepted"],
    })
    .refine(mustBeSignedByEstablishment, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["enterpriseAccepted"],
    });

export const conventionSchema: z.Schema<ConventionDto> =
  conventionWithoutExternalIdZObject
    .merge(z.object({ externalId: externalConventionIdSchema }))
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
    .refine(mustBeSignedByBeneficiary, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["beneficiaryAccepted"],
    })
    .refine(mustBeSignedByEstablishment, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["enterpriseAccepted"],
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
    .refine(mustBeSignedByBeneficiary, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["beneficiaryAccepted"],
    })
    .refine(mustBeSignedByEstablishment, {
      message: "La confirmation de votre accord est obligatoire.",
      path: ["enterpriseAccepted"],
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
