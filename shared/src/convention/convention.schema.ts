import { differenceInYears } from "date-fns";
import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import {
  agencyIdSchema,
  agencyKindSchema,
  refersToAgencyIdSchema,
} from "../agency/agency.schema";
import { emailPossiblyEmptySchema, emailSchema } from "../email/email.schema";
import { peConnectIdentitySchema } from "../federatedIdentities/federatedIdentity.schema";
import { phoneSchema } from "../phone.schema";
import { allModifierRoles, allRoles } from "../role/role.dto";
import {
  appellationCodeSchema,
  appellationDtoSchema,
} from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { DailyScheduleDto } from "../schedule/Schedule.dto";
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
import { OmitFromExistingKeys } from "../utils";
import { DateString } from "../utils/date";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1,
  zStringPossiblyEmptyWithMax,
  zTrimmedStringWithMax,
} from "../zodUtils";
import { getConventionFieldName } from "./convention";
import {
  BENEFICIARY_MAXIMUM_AGE_REQUIREMENT,
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  CCI_WEEKLY_LIMITED_SCHEDULE_AGE,
  CCI_WEEKLY_LIMITED_SCHEDULE_HOURS,
  CCI_WEEKLY_MAX_PERMITTED_HOURS,
  CCI_WEEKLY_MAX_PERMITTED_HOURS_RELEASE_DATE,
  ConventionCommon,
  ConventionDto,
  ConventionId,
  ConventionInternshipKindSpecific,
  ConventionReadDto,
  ConventionValidatorInputName,
  ConventionValidatorInputNames,
  EstablishmentRepresentative,
  EstablishmentTutor,
  FindSimilarConventionsParams,
  FindSimilarConventionsResponseDto,
  GenerateMagicLinkRequestDto,
  IMMERSION_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
  ImmersionObjective,
  InternshipKind,
  MINI_STAGE_CCI_BENEFICIARY_MINIMUM_AGE_REQUIREMENT,
  MarkPartnersErroredConventionAsHandledRequest,
  RenewConventionParams,
  RenewMagicLinkRequestDto,
  RenewMagicLinkResponse,
  Signatories,
  UpdateConventionRequestDto,
  UpdateConventionStatusRequestDto,
  UpdateConventionStatusWithJustificationWithModifierRole,
  UpdateConventionStatusWithJustificationWithoutModifierRole,
  UpdateConventionStatusWithValidator,
  UpdateConventionStatusWithoutJustification,
  WithConventionDto,
  WithConventionId,
  WithConventionIdLegacy,
  conventionObjectiveOptions,
  conventionStatuses,
  conventionStatusesWithJustificationWithModifierRole,
  conventionStatusesWithJustificationWithoutModifierRole,
  conventionStatusesWithValidator,
  conventionStatusesWithoutJustificationNorValidator,
  internshipKinds,
  levelsOfEducation,
} from "./convention.dto";
import {
  getConventionTooLongMessageAndPath,
  isTutorEmailDifferentThanBeneficiaryRelatedEmails,
  minorBeneficiaryHasRepresentative,
  mustBeSignedByEveryone,
  startDateIsBeforeEndDate,
  underMaxCalendarDuration,
  validateBeneficiaryAddressAndParse,
} from "./conventionRefinements";

const zTrimmedStringMax255 = zTrimmedStringWithMax(255);

export const conventionIdSchema: z.ZodSchema<ConventionId> = z
  .string()
  .uuid(localization.invalidUuid);

const roleSchema = z.enum(allRoles);

const modifierRoleSchema = z.enum(allModifierRoles);

const actorSchema = z.object({
  role: roleSchema,
  email: emailSchema,
  phone: phoneSchema,
  firstName: zTrimmedStringMax255,
  lastName: zTrimmedStringMax255,
});

const signatorySchema = actorSchema.merge(
  z.object({
    signedAt: makeDateStringSchema().optional(),
  }),
);

const beneficiarySchema: z.Schema<Beneficiary<"immersion">> =
  signatorySchema.merge(
    z.object({
      role: z.literal("beneficiary"),
      emergencyContact: zStringCanBeEmpty.optional(),
      emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
      emergencyContactEmail: emailPossiblyEmptySchema,
      federatedIdentity: peConnectIdentitySchema.optional(),
      financiaryHelp: zStringCanBeEmpty.optional(),
      birthdate: makeDateStringSchema(),
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

const establishmentTutorSchema: z.Schema<EstablishmentTutor> =
  actorSchema.merge(
    z.object({
      role: z.literal("establishment-tutor"),
      job: zStringMinLength1,
    }),
  );

const establishmentRepresentativeSchema: z.Schema<EstablishmentRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.literal("establishment-representative"),
    }),
  );

const beneficiaryRepresentativeSchema: z.Schema<BeneficiaryRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.literal("beneficiary-representative"),
    }),
  );

const beneficiaryCurrentEmployerSchema: z.Schema<BeneficiaryCurrentEmployer> =
  signatorySchema.merge(
    z.object({
      role: z.literal("beneficiary-current-employer"),
      job: zStringCanBeEmpty,
      businessSiret: siretSchema,
      businessName: zTrimmedStringMax255,
      businessAddress: zStringMinLength1,
    }),
  );

export const immersionObjectiveSchema: z.Schema<ImmersionObjective> =
  zEnumValidation<ImmersionObjective>(
    conventionObjectiveOptions,
    localization.invalidImmersionObjective,
  );

const conventionValidatorSchema: z.Schema<ConventionValidatorInputName> =
  z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
  });

const conventionValidatorsSchema: z.Schema<ConventionValidatorInputNames> =
  z.object({
    agencyCounsellor: conventionValidatorSchema.optional(),
    agencyValidator: conventionValidatorSchema.optional(),
  });

const renewedSchema = z.object({
  from: conventionIdSchema,
  justification: zStringMinLength1,
});

const conventionCommonSchema: z.Schema<ConventionCommon> = z
  .object({
    id: conventionIdSchema,
    status: z.enum(conventionStatuses),
    statusJustification: z.string().optional(),
    agencyId: agencyIdSchema,
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
    businessName: zStringMinLength1,
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
    validators: conventionValidatorsSchema.optional(),
    renewed: renewedSchema.optional(),
    establishmentNumberEmployeesRange: numberOfEmployeesRangeSchema.optional(),
  })
  .and(withAcquisitionSchema);

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

export const conventionSchema: z.Schema<ConventionDto> = conventionCommonSchema
  .and(conventionInternshipKindSpecificSchema)
  .refine(startDateIsBeforeEndDate, {
    message: localization.invalidDateStartDateEnd,
    path: [getConventionFieldName("dateEnd")],
  })
  .refine(underMaxCalendarDuration, getConventionTooLongMessageAndPath)
  .refine(
    minorBeneficiaryHasRepresentative,
    ({ dateStart, signatories: { beneficiary } }) => {
      const beneficiaryAgeAtConventionStart = differenceInYears(
        new Date(dateStart),
        new Date(beneficiary.birthdate),
      );
      return {
        message: `Les bénéficiaires mineurs doivent renseigner un représentant légal. Le bénéficiaire aurait ${beneficiaryAgeAtConventionStart} ans au démarrage de la convention.`,
        path: [getConventionFieldName("signatories.beneficiaryRepresentative")],
      };
    },
  )
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
        convention.id,
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

export const conventionReadSchema: z.Schema<ConventionReadDto> =
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

export const withConventionSchema: z.Schema<WithConventionDto> = z.object({
  convention: conventionSchema,
});

export const withConventionIdLegacySchema: z.Schema<WithConventionIdLegacy> =
  z.object({
    id: conventionIdSchema,
  });

export const withConventionIdSchema: z.Schema<WithConventionId> = z.object({
  conventionId: conventionIdSchema,
});

export const updateConventionRequestSchema: z.Schema<UpdateConventionRequestDto> =
  z.object({
    convention: conventionSchema,
  });

const justificationSchema = zStringMinLength1;

export const updateConventionStatusWithoutJustificationSchema: z.Schema<UpdateConventionStatusWithoutJustification> =
  z.object({
    status: z.enum(conventionStatusesWithoutJustificationNorValidator),
    conventionId: conventionIdSchema,
  });

export const updateConventionStatusWithJustificationWithoutModifierRoleSchema: z.Schema<UpdateConventionStatusWithJustificationWithoutModifierRole> =
  z.object({
    status: z.enum(conventionStatusesWithJustificationWithoutModifierRole),
    statusJustification: justificationSchema,
    conventionId: conventionIdSchema,
  });

export const updateConventionStatusWithJustificationWithModifierRoleSchema: z.Schema<UpdateConventionStatusWithJustificationWithModifierRole> =
  z.object({
    status: z.enum(conventionStatusesWithJustificationWithModifierRole),
    statusJustification: justificationSchema,
    conventionId: conventionIdSchema,
    modifierRole: modifierRoleSchema,
  });

export type WithValidatorInfo = OmitFromExistingKeys<
  UpdateConventionStatusWithValidator,
  "conventionId" | "status"
>;

export const withValidatorInfoSchema: z.Schema<WithValidatorInfo> = z.object({
  firstname: zStringMinLength1,
  lastname: zStringMinLength1,
});

const updateConventionStatusWithValidatorSchema: z.Schema<UpdateConventionStatusWithValidator> =
  z
    .object({
      status: z.enum(conventionStatusesWithValidator),
      conventionId: conventionIdSchema,
    })
    .and(withValidatorInfoSchema);

export const updateConventionStatusRequestSchema: z.Schema<UpdateConventionStatusRequestDto> =
  z.union([
    updateConventionStatusWithJustificationWithoutModifierRoleSchema,
    updateConventionStatusWithValidatorSchema,
    updateConventionStatusWithoutJustificationSchema,
    updateConventionStatusWithJustificationWithModifierRoleSchema,
  ]);

export const renewConventionParamsSchema: z.Schema<RenewConventionParams> = z
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

export const renewMagicLinkResponseSchema: z.Schema<RenewMagicLinkResponse> =
  z.object({
    message: z.literal(expiredMagicLinkErrorMessage),
    needsNewMagicLink: z.boolean(),
  });
export const markPartnersErroredConventionAsHandledRequestSchema: z.Schema<MarkPartnersErroredConventionAsHandledRequest> =
  z.object({
    conventionId: conventionIdSchema,
  });

const addIssuesIfDuplicateSignatoriesEmails = (
  convention: ConventionDto,
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
) => {
  if (isSundayInSchedule(complexSchedule)) {
    addIssue(
      `[${conventionId}] Le mini-stage ne peut pas se dérouler un dimanche`,
      getConventionFieldName("schedule.workedDays"),
    );
  }
};

export const findSimilarConventionsParamsSchema: z.Schema<FindSimilarConventionsParams> =
  z.object({
    siret: siretSchema,
    codeAppellation: appellationCodeSchema,
    dateStart: makeDateStringSchema(),
    beneficiaryBirthdate: makeDateStringSchema(),
    beneficiaryLastName: zStringMinLength1,
  });

export const findSimilarConventionsResponseSchema: z.Schema<FindSimilarConventionsResponseDto> =
  z.object({
    similarConventionIds: z.array(conventionIdSchema),
  });
