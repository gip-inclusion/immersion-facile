import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { federatedIdentitySchema } from "../federatedIdentities/federatedIdentity.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { scheduleSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret";
import { allRoles } from "../tokens/MagicLinkPayload";
import { phoneRegExp } from "../utils";
import { dateRegExp } from "../utils/date";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  zBoolean,
  zEmail,
  zEmailPossiblyEmpty,
  zString,
  zStringPossiblyEmpty,
  zStringPossiblyEmptyWithMax,
  zTrimmedString,
  zTrimmedStringWithMax,
  localization,
  zEnumValidation,
} from "../zodUtils";
import { getConventionFieldName } from "./convention";
import {
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionCommon,
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
  ConventionInternshipKindSpecific,
  conventionObjectiveOptions,
  ConventionReadDto,
  conventionStatuses,
  conventionStatusesWithJustification,
  conventionStatusesWithoutJustification,
  EstablishmentRepresentative,
  EstablishmentTutor,
  GenerateMagicLinkRequestDto,
  ImmersionObjective,
  InternshipKind,
  internshipKinds,
  levelsOfEducation,
  RenewMagicLinkRequestDto,
  Signatories,
  UpdateConventionRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
  WithJustification,
} from "./convention.dto";
import {
  getConventionTooLongMessageAndPath,
  isTutorEmailDifferentThanBeneficiaryRelatedEmails,
  mustBeSignedByEveryone,
  startDateIsBeforeEndDate,
  underMaxCalendarDuration,
} from "./conventionRefinements";

const zTrimmedStringMax255 = zTrimmedStringWithMax(255);

export const conventionIdSchema: z.ZodSchema<ConventionId> = zTrimmedString;
export const externalConventionIdSchema: z.ZodSchema<ConventionExternalId> =
  zTrimmedString;

const roleSchema = z.enum(allRoles);
const phoneSchema = zString.regex(phoneRegExp, localization.invalidPhone);

const signatorySchema = z.object({
  role: roleSchema,
  email: zEmail,
  phone: phoneSchema,
  firstName: zTrimmedStringMax255,
  lastName: zTrimmedStringMax255,
  signedAt: zString.regex(dateRegExp).optional(),
});

const beneficiarySchema: z.Schema<Beneficiary<"immersion">> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["beneficiary"]),
      emergencyContact: zStringPossiblyEmpty,
      emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
      emergencyContactEmail: zEmailPossiblyEmpty,
      federatedIdentity: federatedIdentitySchema.optional(),
      financiaryHelp: zStringPossiblyEmpty,
      birthdate: zString.regex(dateRegExp, localization.invalidDate),
    }),
  );
const studentBeneficiarySchema: z.Schema<Beneficiary<"mini-stage-cci">> =
  beneficiarySchema.and(
    z.object({
      levelOfEducation: zEnumValidation(
        levelsOfEducation,
        "Votre niveau d'étude est obligatoire.",
      ),
    }),
  );

const establishmentTutorSchema: z.Schema<EstablishmentTutor> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["establishment-tutor", "establishment"]),
      job: zStringPossiblyEmpty,
    }),
  );

const establishmentRepresentativeSchema: z.Schema<EstablishmentRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["establishment-representative", "establishment"]),
      job: zStringPossiblyEmpty,
    }),
  );

const beneficiaryRepresentativeSchema: z.Schema<BeneficiaryRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["legal-representative", "beneficiary-representative"]),
      job: zStringPossiblyEmpty,
    }),
  );

const beneficiaryCurrentEmployerSchema: z.Schema<BeneficiaryCurrentEmployer> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["beneficiary-current-employer"]),
      job: zStringPossiblyEmpty,
      businessSiret: siretSchema,
      businessName: zTrimmedStringMax255,
    }),
  );

const immersionObjectiveSchema: z.Schema<ImmersionObjective> =
  zEnumValidation<ImmersionObjective>(
    conventionObjectiveOptions,
    localization.invalidImmersionObjective,
  );

const conventionCommonSchema: z.Schema<ConventionCommon> = z.object({
  id: conventionIdSchema,
  externalId: externalConventionIdSchema.optional(),
  status: z.enum(conventionStatuses),
  rejectionJustification: z.string().optional(),
  agencyId: agencyIdSchema,
  dateSubmission: zString.regex(dateRegExp, localization.invalidDate),
  dateStart: zString.regex(dateRegExp, localization.invalidDateStart),
  dateEnd: zString.regex(dateRegExp, localization.invalidDateEnd),
  dateValidation: zString
    .regex(dateRegExp, localization.invalidValidationFormatDate)
    .optional(),
  siret: siretSchema,
  businessName: zTrimmedString,
  schedule: scheduleSchema,
  workConditions: z.string().optional(),
  businessAdvantages: z.string().optional(),
  individualProtection: zBoolean,
  sanitaryPrevention: zBoolean,
  sanitaryPreventionDescription: zStringPossiblyEmptyWithMax(255),
  immersionAddress: addressWithPostalCodeSchema,
  immersionObjective: immersionObjectiveSchema,
  immersionAppellation: appellationDtoSchema,
  immersionActivities: zTrimmedStringWithMax(2000),
  immersionSkills: zStringPossiblyEmptyWithMax(2000),
  establishmentTutor: establishmentTutorSchema,
});

export const internshipKindSchema: z.Schema<InternshipKind> =
  z.enum(internshipKinds);

const conventionInternshipKindSpecificSchema: z.Schema<
  ConventionInternshipKindSpecific<InternshipKind>
> = z
  .object({
    internshipKind: z.literal("immersion"),
    signatories: z.object({
      beneficiary: beneficiarySchema,
      establishmentRepresentative: establishmentRepresentativeSchema,
      beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
      beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
    }),
  })
  .or(
    z.object({
      internshipKind: z.literal("mini-stage-cci"),
      signatories: z.object({
        beneficiary: studentBeneficiarySchema,
        establishmentRepresentative: establishmentRepresentativeSchema,
        beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
        beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
      }),
    }),
  );

export const conventionWithoutExternalIdSchema: z.Schema<ConventionDtoWithoutExternalId> =
  conventionCommonSchema
    .and(conventionInternshipKindSpecificSchema)
    .refine(startDateIsBeforeEndDate, {
      message: localization.invalidDateStartDateEnd,
      path: [getConventionFieldName("dateEnd")],
    })
    .refine(underMaxCalendarDuration, getConventionTooLongMessageAndPath)
    .superRefine((convention, issueMaker) => {
      const addIssue = (message: string, path: string) => {
        issueMaker.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [path],
        });
      };

      const signatoriesWithEmail = Object.entries(convention.signatories)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => ({
          key: key as keyof Signatories,
          email: value.email,
        }));
      signatoriesWithEmail.forEach((signatory) => {
        if (
          signatoriesWithEmail
            .filter((otherSignatory) => otherSignatory.key !== signatory.key)
            .some((otherSignatory) => otherSignatory.email === signatory.email)
        )
          addIssue(
            localization.signatoriesDistinctEmails,
            getConventionFieldName(`signatories.${signatory.key}.email`),
          );
      });
      if (
        !isTutorEmailDifferentThanBeneficiaryRelatedEmails(
          convention.signatories,
          convention.establishmentTutor,
        )
      )
        addIssue(
          localization.beneficiaryTutorEmailMustBeDistinct,
          getConventionFieldName("establishmentTutor.email"),
        );
    })
    .refine(mustBeSignedByEveryone, {
      message: localization.mustBeSignedByEveryone,
      path: [getConventionFieldName("status")],
    });

export const conventionSchema: z.Schema<ConventionDto> =
  conventionWithoutExternalIdSchema.and(
    z.object({ externalId: externalConventionIdSchema }),
  );

export const conventionReadSchema: z.Schema<ConventionReadDto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
      agencyDepartment: z.string(),
    }),
  );

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

const justificationSchema = zTrimmedString;
export const withJustificationSchema: z.Schema<WithJustification> = z.object({
  justification: justificationSchema,
});

export const updateConventionStatusRequestSchema: z.Schema<UpdateConventionStatusRequestDto> =
  z
    .object({
      status: z.enum(conventionStatusesWithoutJustification),
    })
    .or(
      z.object({
        status: z.enum(conventionStatusesWithJustification),
        justification: justificationSchema,
      }),
    );

export const generateMagicLinkRequestSchema: z.Schema<GenerateMagicLinkRequestDto> =
  z.object({
    applicationId: conventionIdSchema,
    role: z.enum(allRoles),
    expired: z.boolean(), //< defaults to false
  });

export const renewMagicLinkRequestSchema: z.Schema<RenewMagicLinkRequestDto> =
  z.object({
    originalUrl: z.string(),
    expiredJwt: z.string(),
  });
