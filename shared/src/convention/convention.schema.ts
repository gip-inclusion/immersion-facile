import { differenceInYears } from "date-fns";
import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import {
  agencyIdSchema,
  agencyKindSchema,
  refersToAgencyIdSchema,
} from "../agency/agency.schema";
import { businessNameSchema } from "../business/business";
import { emailPossiblyEmptySchema, emailSchema } from "../email/email.schema";
import { peConnectIdentitySchema } from "../federatedIdentities/federatedIdentity.schema";
import { dateFilterSchema } from "../filters";
import {
  createPaginatedSchema,
  paginationQueryParamsSchema,
} from "../pagination/pagination.schema";
import { phoneNumberSchema } from "../phone/phone.schema";
import { allRoles } from "../role/role.dto";
import { signatoryRoleSchema } from "../role/role.schema";
import {
  appellationCodeSchema,
  appellationDtoSchema,
} from "../romeAndAppellationDtos/romeAndAppellation.schema";
import type { DailyScheduleDto } from "../schedule/Schedule.dto";
import {
  makeDateStringSchema,
  scheduleSchema,
} from "../schedule/Schedule.schema";
import {
  calculateWeeklyHoursFromSchedule,
  isSundayInSchedule,
  validateSchedule,
} from "../schedule/ScheduleUtils";
import {
  numberOfEmployeesRangeSchema,
  siretSchema,
} from "../siret/siret.schema";
import { expiredMagicLinkErrorMessage } from "../tokens/jwt.dto";
import type { OmitFromExistingKeys } from "../utils";
import type { DateString } from "../utils/date";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  personNameSchema,
  type ZodSchemaWithInputMatchingOutput,
  zBoolean,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1,
  zStringPossiblyEmptyWithMax,
  zToNumber,
  zTrimmedStringWithMax,
} from "../zodUtils";
import { getConventionFieldName } from "./convention";
import {
  BENEFICIARY_MAXIMUM_AGE_REQUIREMENT,
  type Beneficiary,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  CCI_WEEKLY_LIMITED_SCHEDULE_AGE,
  CCI_WEEKLY_LIMITED_SCHEDULE_HOURS,
  CCI_WEEKLY_MAX_PERMITTED_HOURS,
  CCI_WEEKLY_MAX_PERMITTED_HOURS_RELEASE_DATE,
  type ConventionCommon,
  type ConventionDto,
  type ConventionId,
  type ConventionInternshipKindSpecific,
  type ConventionReadDto,
  type ConventionValidatorInputNames,
  conventionObjectiveOptions,
  conventionStatuses,
  conventionStatusesWithJustification,
  conventionStatusesWithoutJustificationNorValidator,
  conventionStatusesWithValidator,
  DATE_CONSIDERED_OLD,
  type EditConventionCounsellorNameRequestDto,
  type EstablishmentRepresentative,
  type EstablishmentTutor,
  type FindSimilarConventionsParams,
  type FindSimilarConventionsResponseDto,
  type FlatGetConventionsForAgencyUserParams,
  type GenerateMagicLinkRequestDto,
  type GetConventionsForAgencyUserParams,
  getExactAge,
  IMMERSION_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
  type ImmersionObjective,
  type InternshipKind,
  internshipKinds,
  levelsOfEducation,
  type MarkPartnersErroredConventionAsHandledRequest,
  MINI_STAGE_CCI_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
  type RenewConventionParams,
  type RenewMagicLinkRequestDto,
  type RenewMagicLinkResponse,
  type SendSignatureLinkRequestDto,
  SIGNATORIES_PHONE_NUMBER_DISTINCT_RELEASE_DATE,
  type Signatories,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionRequestDto,
  type UpdateConventionStatusRequestDto,
  type UpdateConventionStatusWithJustification,
  type UpdateConventionStatusWithoutJustification,
  type UpdateConventionStatusWithValidator,
  type WithConventionDto,
  type WithConventionId,
  type WithConventionIdLegacy,
  type WithOptionalFirstnameAndLastname,
} from "./convention.dto";
import {
  getConventionTooLongMessageAndPath,
  getOverMaxWorkedDaysMessageAndPath,
  isTutorEmailDifferentThanBeneficiaryRelatedEmails,
  minorBeneficiaryHasRepresentative,
  mustBeSignedByEveryone,
  startDateIsBeforeEndDate,
  underMaxCalendarDuration,
  underMaxPresenceDays,
  validateBeneficiaryAddressAndParse,
} from "./conventionRefinements";

const zTrimmedStringMax255 = zTrimmedStringWithMax(255);

export const conventionIdSchema: ZodSchemaWithInputMatchingOutput<ConventionId> =
  z.uuid(localization.invalidUuid);

const roleSchema = z.enum(allRoles, {
  error: localization.invalidEnum,
});

const actorSchema = z.object({
  role: roleSchema,
  email: emailSchema,
  phone: phoneNumberSchema,
  firstName: zTrimmedStringMax255,
  lastName: zTrimmedStringMax255,
});

const signatorySchema = actorSchema.merge(
  z.object({
    signedAt: makeDateStringSchema().optional(),
  }),
);

const beneficiarySchema: ZodSchemaWithInputMatchingOutput<
  Beneficiary<"immersion">
> = signatorySchema.merge(
  z.object({
    role: z.literal("beneficiary"),
    emergencyContact: zStringCanBeEmpty.optional(),
    emergencyContactPhone: phoneNumberSchema.optional().or(z.literal("")),
    emergencyContactEmail: emailPossiblyEmptySchema,
    federatedIdentity: peConnectIdentitySchema.optional(),
    financiaryHelp: zStringCanBeEmpty.optional(),
    birthdate: makeDateStringSchema(),
    isRqth: zBoolean.optional(),
  }),
);
const studentBeneficiarySchema: ZodSchemaWithInputMatchingOutput<
  Beneficiary<"mini-stage-cci">
> = beneficiarySchema.and(
  z.object({
    levelOfEducation: zEnumValidation(
      levelsOfEducation,
      "Votre niveau d'étude est obligatoire.",
    ),
    schoolName: zStringMinLength1,
    schoolPostcode: zStringMinLength1,
    address: z
      .object({
        streetNumberAndAddress: zStringCanBeEmpty,
        postcode: zStringMinLength1,
        departmentCode: zStringMinLength1,
        city: zStringMinLength1,
      })
      .optional(),
  }),
);

const establishmentTutorSchema: ZodSchemaWithInputMatchingOutput<EstablishmentTutor> =
  actorSchema.merge(
    z.object({
      role: z.literal("establishment-tutor"),
      job: zTrimmedStringMax255,
    }),
  );

const establishmentRepresentativeSchema: ZodSchemaWithInputMatchingOutput<EstablishmentRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.literal("establishment-representative"),
    }),
  );

const beneficiaryRepresentativeSchema: ZodSchemaWithInputMatchingOutput<BeneficiaryRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.literal("beneficiary-representative"),
    }),
  );

const beneficiaryCurrentEmployerSchema: ZodSchemaWithInputMatchingOutput<BeneficiaryCurrentEmployer> =
  signatorySchema.merge(
    z.object({
      role: z.literal("beneficiary-current-employer"),
      job: zStringCanBeEmpty,
      businessSiret: siretSchema,
      businessName: zTrimmedStringMax255,
      businessAddress: zStringMinLength1,
    }),
  );

export const immersionObjectiveSchema: ZodSchemaWithInputMatchingOutput<ImmersionObjective> =
  zEnumValidation<ImmersionObjective>(
    conventionObjectiveOptions,
    localization.invalidImmersionObjective,
  );

export const withOptionalFirstnameAndLastnameSchema: ZodSchemaWithInputMatchingOutput<WithOptionalFirstnameAndLastname> =
  z.object({
    firstname: personNameSchema.optional(),
    lastname: personNameSchema.optional(),
  });

//todo: to remove that when data in db is cleaned up and put a more strict schema (personNameSchema)
const conventionValidatorFirstnameAndLastnameSchema: ZodSchemaWithInputMatchingOutput<WithOptionalFirstnameAndLastname> =
  z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
  });

const conventionValidatorsSchema: ZodSchemaWithInputMatchingOutput<ConventionValidatorInputNames> =
  z.object({
    agencyCounsellor: conventionValidatorFirstnameAndLastnameSchema.optional(),
    agencyValidator: conventionValidatorFirstnameAndLastnameSchema.optional(),
  });

export const editConventionCounsellorNameRequestSchema: ZodSchemaWithInputMatchingOutput<EditConventionCounsellorNameRequestDto> =
  withOptionalFirstnameAndLastnameSchema.and(
    z.object({
      conventionId: conventionIdSchema,
    }),
  );

const renewedSchema = z.object({
  from: conventionIdSchema,
  justification: zStringMinLength1,
});

const conventionCommonSchema: ZodSchemaWithInputMatchingOutput<ConventionCommon> =
  z
    .object({
      id: conventionIdSchema,
      status: z.enum(conventionStatuses, {
        error: localization.invalidEnum,
      }),
      statusJustification: z.string().optional(),
      agencyId: agencyIdSchema,
      updatedAt: makeDateStringSchema().optional(),
      dateSubmission: makeDateStringSchema(),
      dateStart: makeDateStringSchema(localization.invalidDateStart),
      dateEnd: makeDateStringSchema(localization.invalidDateEnd),
      dateValidation: makeDateStringSchema(
        localization.invalidValidationFormatDate,
      ).optional(),
      dateApproval: makeDateStringSchema(
        localization.invalidApprovalFormatDate,
      ).optional(),
      siret: siretSchema,
      businessName: businessNameSchema,
      schedule: scheduleSchema,
      workConditions: z.string().optional(),
      businessAdvantages: z.string().optional(),
      individualProtection: zBoolean,
      individualProtectionDescription: zStringPossiblyEmptyWithMax(255),
      sanitaryPrevention: zBoolean,
      sanitaryPreventionDescription: zStringPossiblyEmptyWithMax(255),
      immersionAddress: addressWithPostalCodeSchema,
      immersionObjective: immersionObjectiveSchema,
      immersionAppellation: appellationDtoSchema,
      immersionActivities: zTrimmedStringWithMax(2000),
      immersionSkills: zStringPossiblyEmptyWithMax(2000),
      establishmentTutor: establishmentTutorSchema,
      validators: conventionValidatorsSchema.optional(),
      agencyReferent: withOptionalFirstnameAndLastnameSchema.optional(),
      renewed: renewedSchema.optional(),
      establishmentNumberEmployeesRange:
        numberOfEmployeesRangeSchema.optional(),
    })
    .and(withAcquisitionSchema);

export const internshipKindSchema: ZodSchemaWithInputMatchingOutput<InternshipKind> =
  z.enum(internshipKinds, {
    error: localization.invalidEnum,
  });

const immersionSignatoriesSchema: ZodSchemaWithInputMatchingOutput<
  Signatories<"immersion">
> = z.object({
  beneficiary: beneficiarySchema,
  establishmentRepresentative: establishmentRepresentativeSchema,
  beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
  beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
});

const cciSignatoriesSchema: ZodSchemaWithInputMatchingOutput<
  Signatories<"mini-stage-cci">
> = z.object({
  beneficiary: studentBeneficiarySchema,
  establishmentRepresentative: establishmentRepresentativeSchema,
  beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
  beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
});

// https://github.com/colinhacks/zod#discriminated-unions
export const conventionInternshipKindSpecificSchema: ZodSchemaWithInputMatchingOutput<
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

export const conventionSchema: ZodSchemaWithInputMatchingOutput<ConventionDto> =
  conventionCommonSchema
    .and(conventionInternshipKindSpecificSchema)
    .check((ctx) => {
      if (
        !startDateIsBeforeEndDate({
          dateStart: ctx.value.dateStart,
          dateEnd: ctx.value.dateEnd,
        })
      ) {
        ctx.issues.push({
          input: {
            dateStart: ctx.value.dateStart,
            dateEnd: ctx.value.dateEnd,
          },
          code: "custom",
          message: localization.invalidDateStartDateEnd,
          path: [getConventionFieldName("dateEnd")],
          continue: true,
        });
      }
    })
    .check((ctx) => {
      if (
        !underMaxCalendarDuration({
          dateStart: ctx.value.dateStart,
          dateEnd: ctx.value.dateEnd,
          internshipKind: ctx.value.internshipKind,
        })
      ) {
        console.log("ctx.value.dateStart", ctx.value.dateStart);
        console.log("ctx.value.dateEnd", ctx.value.dateEnd);
        console.log("ctx.value.internshipKind", ctx.value.internshipKind);

        ctx.issues.push({
          input: {
            dateStart: ctx.value.dateStart,
            dateEnd: ctx.value.dateEnd,
          },
          code: "custom",
          ...getConventionTooLongMessageAndPath({
            internshipKind: ctx.value.internshipKind,
          }),
          continue: true,
        });
      }
    })
    .check((ctx) => {
      if (
        !underMaxPresenceDays({
          schedule: ctx.value.schedule,
          internshipKind: ctx.value.internshipKind,
          dateSubmission: ctx.value.dateSubmission,
        })
      ) {
        ctx.issues.push({
          input: {
            schedule: ctx.value.schedule,
            internshipKind: ctx.value.internshipKind,
            dateSubmission: ctx.value.dateSubmission,
          },
          code: "custom",
          ...getOverMaxWorkedDaysMessageAndPath({
            internshipKind: ctx.value.internshipKind,
            schedule: ctx.value.schedule,
            dateSubmission: ctx.value.dateSubmission,
          }),
          continue: true,
        });
      }
    })
    .check((ctx) => {
      if (
        !minorBeneficiaryHasRepresentative({
          dateStart: ctx.value.dateStart,
          signatories: ctx.value.signatories,
          dateSubmission: ctx.value.dateSubmission,
        })
      ) {
        const beneficiaryAgeAtConventionStart = getExactAge({
          birthDate: new Date(ctx.value.signatories.beneficiary.birthdate),
          referenceDate: new Date(ctx.value.dateStart),
        });
        ctx.issues.push({
          input: {
            dateStart: ctx.value.dateStart,
            dateSubmission: ctx.value.dateSubmission,
          },
          code: "custom",
          message: `Les bénéficiaires mineurs doivent renseigner un représentant légal. Le bénéficiaire aurait ${beneficiaryAgeAtConventionStart} ans au démarrage de la convention.`,
          path: [
            getConventionFieldName("signatories.beneficiaryRepresentative"),
          ],
          continue: true,
        });
      }
    })
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
      addIssuesIfDuplicateSignatoriesPhoneNumbers(convention, addIssue);
      addIssueIfDuplicateEmailsBetweenSignatoriesAndTutor(convention, addIssue);

      if (convention.internshipKind === "mini-stage-cci") {
        addIssueIfLimitedScheduleHoursExceeded(
          convention,
          addIssue,
          beneficiaryAgeAtConventionStart,
        );
        addIssueIfSundayIsInSchedule(
          addIssue,
          convention.id,
          convention.schedule.complexSchedule,
          convention.dateEnd,
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

      addIssueIfAgeMoreThanMaximumAge(
        addIssue,
        beneficiaryAgeAtConventionStart,
        convention.dateSubmission,
        BENEFICIARY_MAXIMUM_AGE_REQUIREMENT,
      );

      const message = validateSchedule({
        dateEnd: convention.dateEnd,
        dateStart: convention.dateStart,
        id: convention.id,
        schedule: convention.schedule,
      });
      if (message) {
        addIssue(message, "schedule");
      }
    })
    .refine(mustBeSignedByEveryone, {
      message: localization.mustBeSignedByEveryone,
      path: [getConventionFieldName("status")],
    })
    .refine(validateBeneficiaryAddressAndParse, {
      message: localization.invalidBeneficiaryAddress,
      path: [getConventionFieldName("signatories.beneficiary.address")],
    });

export const conventionReadSchema: ZodSchemaWithInputMatchingOutput<ConventionReadDto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
      agencyDepartment: z.string(),
      agencyKind: agencyKindSchema,
      agencySiret: siretSchema,
      agencyCounsellorEmails: z.array(emailSchema),
      agencyValidatorEmails: z.array(emailSchema),
      agencyRefersTo: z
        .object({
          id: refersToAgencyIdSchema,
          name: zStringMinLength1,
          kind: agencyKindSchema,
        })
        .optional(),
    }),
  );

export const withConventionSchema: ZodSchemaWithInputMatchingOutput<WithConventionDto> =
  z.object({
    convention: conventionSchema,
  });

export const withConventionIdLegacySchema: ZodSchemaWithInputMatchingOutput<WithConventionIdLegacy> =
  z.object({
    id: conventionIdSchema,
  });

export const withConventionIdSchema: ZodSchemaWithInputMatchingOutput<WithConventionId> =
  z.object({
    conventionId: conventionIdSchema,
  });

export const updateConventionRequestSchema: ZodSchemaWithInputMatchingOutput<UpdateConventionRequestDto> =
  z.object({
    convention: conventionSchema,
  });

const justificationSchema = zStringMinLength1;

export const updateConventionStatusWithoutJustificationSchema: ZodSchemaWithInputMatchingOutput<UpdateConventionStatusWithoutJustification> =
  z.object({
    status: z.enum(conventionStatusesWithoutJustificationNorValidator, {
      error: localization.invalidEnum,
    }),
    conventionId: conventionIdSchema,
  });

export const updateConventionStatusWithJustificationSchema: ZodSchemaWithInputMatchingOutput<UpdateConventionStatusWithJustification> =
  z.object({
    status: z.enum(conventionStatusesWithJustification, {
      error: localization.invalidEnum,
    }),
    statusJustification: justificationSchema,
    conventionId: conventionIdSchema,
  });

export type WithFirstnameAndLastname = OmitFromExistingKeys<
  UpdateConventionStatusWithValidator,
  "conventionId" | "status"
>;

export const withFirstnameAndLastnameSchema: ZodSchemaWithInputMatchingOutput<WithFirstnameAndLastname> =
  z.object({
    firstname: personNameSchema,
    lastname: personNameSchema,
  });

const updateConventionStatusWithValidatorSchema: ZodSchemaWithInputMatchingOutput<UpdateConventionStatusWithValidator> =
  z
    .object({
      status: z.enum(conventionStatusesWithValidator, {
        error: localization.invalidEnum,
      }),
      conventionId: conventionIdSchema,
    })
    .and(withFirstnameAndLastnameSchema);

export const updateConventionStatusRequestSchema: ZodSchemaWithInputMatchingOutput<UpdateConventionStatusRequestDto> =
  z.union([
    updateConventionStatusWithJustificationSchema,
    updateConventionStatusWithValidatorSchema,
    updateConventionStatusWithoutJustificationSchema,
  ]);

export const renewConventionParamsSchema: ZodSchemaWithInputMatchingOutput<RenewConventionParams> =
  z
    .object({
      id: conventionIdSchema,
      dateStart: makeDateStringSchema(),
      dateEnd: makeDateStringSchema(),
      schedule: scheduleSchema,
      renewed: renewedSchema,
    })
    .superRefine((renewConventionParams, issueMaker) => {
      const addIssue = (message: string, path: string) => {
        issueMaker.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [path],
        });
      };

      const message = validateSchedule(renewConventionParams);
      if (message) {
        addIssue(message, "schedule");
      }
    });

export const generateMagicLinkRequestSchema: ZodSchemaWithInputMatchingOutput<GenerateMagicLinkRequestDto> =
  z.object({
    applicationId: conventionIdSchema,
    role: z.enum(allRoles, {
      error: localization.invalidEnum,
    }),
    expired: z.boolean(), //< defaults to false
  });

export const renewMagicLinkRequestSchema: ZodSchemaWithInputMatchingOutput<RenewMagicLinkRequestDto> =
  z.object({
    originalUrl: z.string(),
    expiredJwt: z.string(),
  });

export const renewMagicLinkResponseSchema: ZodSchemaWithInputMatchingOutput<RenewMagicLinkResponse> =
  z.object({
    message: z.literal(expiredMagicLinkErrorMessage),
    needsNewMagicLink: z.boolean(),
  });

export const sendSignatureLinkRequestSchema: ZodSchemaWithInputMatchingOutput<SendSignatureLinkRequestDto> =
  z.object({
    conventionId: conventionIdSchema,
    signatoryRole: signatoryRoleSchema,
  });

export const transferConventionToAgencyRequestSchema: ZodSchemaWithInputMatchingOutput<TransferConventionToAgencyRequestDto> =
  z.object({
    conventionId: conventionIdSchema,
    agencyId: agencyIdSchema,
    justification: zStringMinLength1,
  });

export const markPartnersErroredConventionAsHandledRequestSchema: ZodSchemaWithInputMatchingOutput<MarkPartnersErroredConventionAsHandledRequest> =
  z.object({
    conventionId: conventionIdSchema,
  });

export const isConventionOld = (dateEnd: DateString) =>
  new Date(dateEnd).getTime() <= DATE_CONSIDERED_OLD.getTime();

const isConventionBeforeDistinctSignatoriesPhoneNumbersReleaseDate = (
  conventionSubimissionDate: DateString,
) =>
  new Date(conventionSubimissionDate).getTime() <=
  SIGNATORIES_PHONE_NUMBER_DISTINCT_RELEASE_DATE.getTime();

const addIssuesIfDuplicateSignatoriesEmails = (
  convention: ConventionDto,
  addIssue: (message: string, path: string) => void,
) => {
  if (isConventionOld(convention.dateEnd)) return;
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

const addIssuesIfDuplicateSignatoriesPhoneNumbers = (
  convention: ConventionDto,
  addIssue: (message: string, path: string) => void,
) => {
  if (
    isConventionBeforeDistinctSignatoriesPhoneNumbersReleaseDate(
      convention.dateSubmission,
    )
  )
    return;
  const signatoriesWithPhoneNumber = Object.entries(convention.signatories)
    .filter(([_, value]) => !!value)
    .map(([key, value]) => ({
      key: key as keyof Signatories,
      phoneNumber: value.phone,
    }));
  signatoriesWithPhoneNumber.forEach((signatory) => {
    if (
      signatoriesWithPhoneNumber
        .filter((otherSignatory) => otherSignatory.key !== signatory.key)
        .some(
          (otherSignatory) =>
            otherSignatory.phoneNumber === signatory.phoneNumber,
        )
    )
      addIssue(
        localization.signatoriesDistinctPhoneNumbers,
        getConventionFieldName(`signatories.${signatory.key}.phone`),
      );
  });
};

const addIssueIfDuplicateEmailsBetweenSignatoriesAndTutor = (
  convention: ConventionDto,
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
  convention: ConventionDto,
  addIssue: (message: string, path: string) => void,
  beneficiaryAgeAtConventionStart: number,
) => {
  const weeklyHours = calculateWeeklyHoursFromSchedule(convention.schedule, {
    start: new Date(convention.dateStart),
    end: new Date(convention.dateEnd),
  });
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

  if (
    beneficiaryAgeAtConventionStart >= CCI_WEEKLY_LIMITED_SCHEDULE_AGE &&
    weeklyHours.some(
      (weeklyHourSet) => weeklyHourSet > CCI_WEEKLY_MAX_PERMITTED_HOURS,
    ) &&
    new Date(convention.dateSubmission).getTime() >=
      CCI_WEEKLY_MAX_PERMITTED_HOURS_RELEASE_DATE.getTime()
  ) {
    addIssue(
      `La durée maximale hebdomadaire pour un mini-stage est de ${CCI_WEEKLY_MAX_PERMITTED_HOURS}h`,
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

const addIssueIfAgeMoreThanMaximumAge = (
  addIssue: (message: string, path: string) => void,
  beneficiaryAgeAtConventionStart: number,
  dateSubmission: DateString,
  maximumAgeRequirement: number,
) => {
  const onlyCheckConventionsCreatedBeforeDate = new Date("2024-04-30");
  if (
    beneficiaryAgeAtConventionStart > maximumAgeRequirement &&
    new Date(dateSubmission) > onlyCheckConventionsCreatedBeforeDate
  )
    addIssue(
      `Merci de vérifier votre date de naissance: avez-vous ${beneficiaryAgeAtConventionStart} ans ?`,
      getConventionFieldName("signatories.beneficiary.birthdate"),
    );
};

const addIssueIfSundayIsInSchedule = (
  addIssue: (message: string, path: string) => void,
  conventionId: ConventionId,
  complexSchedule: DailyScheduleDto[],
  dateEnd: DateString,
) => {
  if (isConventionOld(dateEnd)) return;
  if (isSundayInSchedule(complexSchedule)) {
    addIssue(
      `[${conventionId}] Le mini-stage ne peut pas se dérouler un dimanche`,
      getConventionFieldName("schedule.workedDays"),
    );
  }
};

export const findSimilarConventionsParamsSchema: ZodSchemaWithInputMatchingOutput<FindSimilarConventionsParams> =
  z.object({
    siret: siretSchema,
    codeAppellation: appellationCodeSchema,
    dateStart: makeDateStringSchema(),
    beneficiaryBirthdate: makeDateStringSchema(),
    beneficiaryLastName: zStringMinLength1,
  });

export const findSimilarConventionsResponseSchema: ZodSchemaWithInputMatchingOutput<FindSimilarConventionsResponseDto> =
  z.object({
    similarConventionIds: z.array(conventionIdSchema),
  });

const statusSchema = z.enum(conventionStatuses, {
  error: localization.invalidEnum,
});

export const flatGetConventionsForAgencyUserParamsSchema: ZodSchemaWithInputMatchingOutput<FlatGetConventionsForAgencyUserParams> =
  z.object({
    // pagination
    page: zToNumber.optional(),
    perPage: zToNumber.optional(),

    // sort
    sortBy: z
      .enum(["dateValidation", "dateStart", "dateSubmission"], {
        error: localization.invalidEnum,
      })
      .optional(),

    // filters
    actorEmailContains: z.string().optional(),
    establishmentNameContains: z.string().optional(),
    beneficiaryNameContains: z.string().optional(),
    statuses: z.tuple([statusSchema], statusSchema).optional(),
    agencyIds: z.tuple([agencyIdSchema], agencyIdSchema).optional(),
    agencyDepartmentCodes: z.tuple([z.string()], z.string()).optional(),

    // date filters
    dateStartFrom: makeDateStringSchema().optional(),
    dateStartTo: makeDateStringSchema().optional(),
    dateEndFrom: makeDateStringSchema().optional(),
    dateEndTo: makeDateStringSchema().optional(),
    dateSubmissionFrom: makeDateStringSchema().optional(),
    dateSubmissionTo: makeDateStringSchema().optional(),
  });

export const getConventionsForAgencyUserParamsSchema: ZodSchemaWithInputMatchingOutput<GetConventionsForAgencyUserParams> =
  z.object({
    filters: z
      .object({
        actorEmailContains: z.string().optional(),
        establishmentNameContains: z.string().optional(),
        beneficiaryNameContains: z.string().optional(),
        statuses: z.tuple([statusSchema], statusSchema).optional(),
        agencyIds: z.tuple([agencyIdSchema], agencyIdSchema).optional(),
        agencyDepartmentCodes: z.tuple([z.string()], z.string()).optional(),
        dateStart: dateFilterSchema.optional(),
        dateEnd: dateFilterSchema.optional(),
        dateSubmission: dateFilterSchema.optional(),
      })
      .optional(),
    sortBy: z
      .enum(["dateValidation", "dateStart", "dateSubmission"], {
        error: localization.invalidEnum,
      })
      .optional(),
    pagination: paginationQueryParamsSchema.optional(),
  });

export const paginatedConventionsSchema =
  createPaginatedSchema(conventionSchema);
