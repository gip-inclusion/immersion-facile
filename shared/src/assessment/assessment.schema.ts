import { z } from "zod";
import { conventionIdSchema } from "../convention/convention.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import {
  zStringMinLength1Max1024,
  zStringMinLength1Max6000,
  zStringMinLength1Max9200,
  zTrimmedStringWithMax,
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
        beneficiaryFeedback: zTrimmedStringWithMax(1000).nullable(),
        signedAt: makeDateStringSchema().nullable(),
        createdAt: dateTimeIsoStringSchema,
      }),
    );

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
          beneficiaryFeedback: zStringMinLength1Max1024.nullable(),
        }),
        z.object({
          beneficiaryAgreement: z.literal(false),
          beneficiaryFeedback: zStringMinLength1Max1024,
        }),
      ]),
    );
