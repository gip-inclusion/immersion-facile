import { z } from "zod";
import type { ConventionReadDto } from "../convention/convention.dto";
import { conventionIdSchema } from "../convention/convention.schema";
import { calculateTotalImmersionHoursBetweenDateComplex } from "../schedule/ScheduleUtils";
import {
  convertLocaleDateToUtcTimezoneDate,
  dateTimeIsoStringSchema,
  makeDateStringSchema,
  toDisplayedDate,
} from "../utils/date";
import {
  zStringMinLength1Max1024,
  zStringMinLength1Max3000,
  zStringMinLength1Max6000,
  zStringMinLength1Max9200,
} from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zEnumValidation,
} from "../zodUtils";
import {
  type AssessmentDto,
  type DeleteAssessmentRequestDto,
  type FormAssessmentDto,
  type LegacyAssessmentDto,
  type SignAssessmentRequestDto,
  typeOfContracts,
  type WithAssessmentDto,
  type WithEndedWithAJob,
  type WithEstablishmentComments,
} from "./assessment.dto";

const withAssessmentStatusSchema = z.discriminatedUnion(
  "status",
  [
    z.object({
      status: z.enum(["COMPLETED", "DID_NOT_SHOW"], {
        error: localization.invalidEnum,
      }),
    }),
    z.object({
      status: z.literal("PARTIALLY_COMPLETED"),
      lastDayOfPresence: makeDateStringSchema(),
      numberOfMissedHours: z.number(),
    }),
  ],
  {
    error: (error) => {
      if (error.code === "invalid_union")
        return {
          message: "Veuillez selectionner une option",
        };

      return { message: error.message ?? "no message provided" };
    },
  },
);

const withEstablishmentCommentsSchema: ZodSchemaWithInputMatchingOutput<WithEstablishmentComments> =
  z.object({
    establishmentFeedback: zStringMinLength1Max9200,
    establishmentAdvices: zStringMinLength1Max6000,
  });

const withEndedWithAJobSchema: ZodSchemaWithInputMatchingOutput<WithEndedWithAJob> =
  z.discriminatedUnion(
    "endedWithAJob",
    [
      z.object({
        endedWithAJob: z.literal(true),
        typeOfContract: zEnumValidation(typeOfContracts, localization.required),
        contractStartDate: makeDateStringSchema(),
      }),
      z.object({
        endedWithAJob: z.literal(false),
      }),
    ],
    { error: "Veuillez sélectionnez une option" },
  );

export const assessmentDtoSchema: z.ZodType<AssessmentDto, FormAssessmentDto> =
  z
    .object({
      conventionId: z.string(),
    })
    .and(withAssessmentStatusSchema)
    .and(withEstablishmentCommentsSchema)
    .and(withEndedWithAJobSchema)
    .and(
      z.object({
        beneficiaryAgreement: z.boolean().nullable(),
        beneficiaryFeedback: zStringMinLength1Max3000.nullable(),
        signedAt: makeDateStringSchema().nullable(),
        createdAt: dateTimeIsoStringSchema,
      }),
    );

export const assessmentFormSchema = (
  convention: ConventionReadDto,
): z.ZodType<AssessmentDto, FormAssessmentDto> =>
  assessmentDtoSchema
    .superRefine((formValues, ctx) => {
      if (
        formValues.endedWithAJob &&
        formValues.contractStartDate &&
        convention.dateStart > formValues.contractStartDate
      ) {
        ctx.addIssue({
          code: "custom",
          message: `La date début du contrat ne peut pas être antérieure à la date de début d'immersion: ${toDisplayedDate({ date: convertLocaleDateToUtcTimezoneDate(new Date(convention.dateStart)) })}.`,
          path: ["contractStartDate"],
        });
      }
    })
    .superRefine((formValues, ctx) => {
      if (formValues.status !== "PARTIALLY_COMPLETED") return;

      const scheduledHoursInPresencePeriod =
        calculateTotalImmersionHoursBetweenDateComplex({
          complexSchedule: convention.schedule.complexSchedule,
          dateStart: convention.dateStart,
          dateEnd: formValues.lastDayOfPresence ?? convention.dateEnd,
        });

      if (formValues.numberOfMissedHours > scheduledHoursInPresencePeriod)
        ctx.addIssue({
          code: "custom",
          message:
            "Le nombre d'heures manquées ne peut pas dépasser le nombre total d'heures prévues dans la convention.",
          path: ["numberOfMissedHours"],
        });
    });

export const withAssessmentSchema: z.ZodType<
  WithAssessmentDto,
  { assessment: FormAssessmentDto }
> = z.object({
  assessment: assessmentDtoSchema,
});

export const legacyAssessmentDtoSchema: ZodSchemaWithInputMatchingOutput<LegacyAssessmentDto> =
  z.object({
    status: z.enum(["FINISHED", "ABANDONED"], {
      error: localization.invalidEnum,
    }),
    conventionId: z.string(),
    establishmentFeedback: zStringMinLength1Max9200,
    createdAt: dateTimeIsoStringSchema,
  });

export const deleteAssessmentRequestDtoSchema: ZodSchemaWithInputMatchingOutput<DeleteAssessmentRequestDto> =
  z.object({
    conventionId: conventionIdSchema,
    deleteAssessmentJustification: zStringMinLength1Max1024,
  });

export const signAssessmentRequestDtoSchema: ZodSchemaWithInputMatchingOutput<SignAssessmentRequestDto> =
  z
    .object({
      conventionId: conventionIdSchema,
    })
    .and(
      z.discriminatedUnion("beneficiaryAgreement", [
        z.object({
          beneficiaryAgreement: z.literal(true),
          beneficiaryFeedback: zStringMinLength1Max3000.nullable(),
        }),
        z.object({
          beneficiaryAgreement: z.literal(false),
          beneficiaryFeedback: zStringMinLength1Max3000,
        }),
      ]),
    );
