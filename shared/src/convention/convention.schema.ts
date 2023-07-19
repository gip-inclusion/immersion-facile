import { differenceInYears } from "date-fns";
import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { emailPossiblyEmptySchema, emailSchema } from "../email/email.schema";
import { peConnectIdentitySchema } from "../federatedIdentities/federatedIdentity.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { DailyScheduleDto } from "../schedule/Schedule.dto";
import { scheduleSchema } from "../schedule/Schedule.schema";
import {
  calculateWeeklyHoursFromSchedule,
  isSundayInSchedule,
} from "../schedule/ScheduleUtils";
import { siretSchema } from "../siret/siret.schema";
import { allRoles } from "../tokens/token.dto";
import { phoneRegExp } from "../utils";
import { dateRegExp } from "../utils/date";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zEnumValidation,
  zString,
  zStringPossiblyEmpty,
  zStringPossiblyEmptyWithMax,
  zTrimmedString,
  zTrimmedStringWithMax,
} from "../zodUtils";
import { getConventionFieldName } from "./convention";
import {
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  CCI_WEEKLY_LIMITED_SCHEDULE_AGE,
  CCI_WEEKLY_LIMITED_SCHEDULE_HOURS,
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
  IMMERSION_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
  ImmersionObjective,
  InternshipKind,
  internshipKinds,
  levelsOfEducation,
  MINI_STAGE_CCI_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
  RenewMagicLinkRequestDto,
  Signatories,
  UpdateConventionRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
  WithStatusJustification,
} from "./convention.dto";
import {
  getConventionTooLongMessageAndPath,
  isTutorEmailDifferentThanBeneficiaryRelatedEmails,
  mustBeSignedByEveryone,
  startDateIsBeforeEndDate,
  underMaxCalendarDuration,
} from "./conventionRefinements";

const zTrimmedStringMax255 = zTrimmedStringWithMax(255);

export const conventionIdSchema: z.ZodSchema<ConventionId> = z
  .string()
  .uuid(localization.invalidUuid);
export const externalConventionIdSchema: z.ZodSchema<ConventionExternalId> =
  zTrimmedString;

const roleSchema = z.enum(allRoles);
const phoneSchema = zString.regex(phoneRegExp, localization.invalidPhone);

const signatorySchema = z.object({
  role: roleSchema,
  email: emailSchema,
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
      emergencyContactEmail: emailPossiblyEmptySchema,
      federatedIdentity: peConnectIdentitySchema.optional(),
      financiaryHelp: zStringPossiblyEmpty,
      birthdate: zString.regex(dateRegExp, localization.invalidDate),
      isRqth: zBoolean.optional(),
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
      businessAddress: zString,
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
  statusJustification: z.string().optional(),
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

const immersionSignatoriesSchema: z.Schema<Signatories<"immersion">> = z.object(
  {
    beneficiary: beneficiarySchema,
    establishmentRepresentative: establishmentRepresentativeSchema,
    beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
    beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
  },
);

const cciSignatoriesSchema: z.Schema<Signatories<"mini-stage-cci">> = z.object({
  beneficiary: studentBeneficiarySchema,
  establishmentRepresentative: establishmentRepresentativeSchema,
  beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
  beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
});

// https://github.com/colinhacks/zod#discriminated-unions
export const conventionInternshipKindSpecificSchema: z.Schema<
  ConventionInternshipKindSpecific<InternshipKind>
> = z.discriminatedUnion("internshipKind", [
  z.object({
    internshipKind: z.literal("immersion"),
    signatories: immersionSignatoriesSchema,
  }),
  z.object({
    internshipKind: z.literal("mini-stage-cci"),
    signatories: cciSignatoriesSchema,
  }),
]);

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
      const beneficiaryAgeAtConventionStart = differenceInYears(
        new Date(convention.dateStart),
        new Date(convention.signatories.beneficiary.birthdate),
      );

      addIssuesIfDuplicateSignatoriesEmails(convention, addIssue);
      addIssueIfDuplicateEmailsBetweenSignatoriesAndTutor(convention, addIssue);

      if (convention.internshipKind === "mini-stage-cci") {
        addIssueIfLimitedScheduleHoursExceeded(
          convention,
          addIssue,
          beneficiaryAgeAtConventionStart,
        );
        addIssueIfSundayIsInSchedule(
          addIssue,
          convention.schedule.complexSchedule,
        );
        addIssueIfAgeLessThanMinimumAge(
          addIssue,
          beneficiaryAgeAtConventionStart,
          MINI_STAGE_CCI_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
        );
      }

      if (convention.internshipKind === "immersion") {
        addIssueIfAgeLessThanMinimumAge(
          addIssue,
          beneficiaryAgeAtConventionStart,
          IMMERSION_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
        );
      }
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

export const withConventionIdSchema: z.Schema<WithConventionId> = z.object({
  id: conventionIdSchema,
});

export const updateConventionRequestSchema: z.Schema<UpdateConventionRequestDto> =
  z.object({
    convention: conventionSchema,
  });

const justificationSchema = zTrimmedString;
export const withStatusJustificationSchema: z.Schema<WithStatusJustification> =
  z.object({
    statusJustification: justificationSchema,
  });

export const updateConventionStatusRequestSchema: z.Schema<UpdateConventionStatusRequestDto> =
  z
    .object({
      status: z.enum(conventionStatusesWithoutJustification),
    })
    .or(
      z.object({
        status: z.enum(conventionStatusesWithJustification),
        statusJustification: justificationSchema,
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

const addIssuesIfDuplicateSignatoriesEmails = (
  convention: ConventionDtoWithoutExternalId,
  addIssue: (message: string, path: string) => void,
) => {
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
};

const addIssueIfDuplicateEmailsBetweenSignatoriesAndTutor = (
  convention: ConventionDtoWithoutExternalId,
  addIssue: (message: string, path: string) => void,
) => {
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
};

const addIssueIfLimitedScheduleHoursExceeded = (
  convention: ConventionDtoWithoutExternalId,
  addIssue: (message: string, path: string) => void,
  beneficiaryAgeAtConventionStart: number,
) => {
  const weeklyHours = calculateWeeklyHoursFromSchedule(convention.schedule);
  if (
    beneficiaryAgeAtConventionStart < CCI_WEEKLY_LIMITED_SCHEDULE_AGE &&
    weeklyHours.some(
      (weeklyHourSet) => weeklyHourSet > CCI_WEEKLY_LIMITED_SCHEDULE_HOURS,
    )
  ) {
    addIssue(
      `La durée maximale hebdomadaire pour un mini-stage d'une personne de moins de ${CCI_WEEKLY_LIMITED_SCHEDULE_AGE} ans est de ${CCI_WEEKLY_LIMITED_SCHEDULE_HOURS}h`,
      getConventionFieldName("schedule.totalHours"),
    );
  }
};

const addIssueIfAgeLessThanMinimumAge = (
  addIssue: (message: string, path: string) => void,
  beneficiaryAgeAtConventionStart: number,
  miniumAgeRequirement: number,
) => {
  if (beneficiaryAgeAtConventionStart < miniumAgeRequirement)
    addIssue(
      `L'âge du bénéficiaire doit être au minimum de ${miniumAgeRequirement}ans`,
      getConventionFieldName("signatories.beneficiary.birthdate"),
    );
};

const addIssueIfSundayIsInSchedule = (
  addIssue: (message: string, path: string) => void,
  complexSchedule: DailyScheduleDto[],
) => {
  if (isSundayInSchedule(complexSchedule)) {
    addIssue(
      "Le mini-stage ne peut pas se dérouler un dimanche",
      getConventionFieldName("schedule.workedDays"),
    );
  }
};
