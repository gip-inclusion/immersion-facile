import { z } from "zod";
import type { ConventionId } from "../convention/convention.dto";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import type { DateRange } from "../utils/date";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zEnumValidation,
  zStringMinLength1,
} from "../zodUtils";
import {
  type AssessmentDto,
  type LegacyAssessmentDto,
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
    establishmentFeedback: zStringMinLength1,
    establishmentAdvices: zStringMinLength1,
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

export type CreateFormAssessmentInitialValues = {
  conventionId: ConventionId;
} & (WithEndedWithAJob | { endedWithAJob: null }) &
  WithEstablishmentComments & { status: null };

export type FormAssessmentDto =
  | AssessmentDto
  | CreateFormAssessmentInitialValues;

export const assessmentDtoSchema: z.ZodType<AssessmentDto, FormAssessmentDto> =
  z
    .object({
      conventionId: z.string(),
    })
    .and(withAssessmentStatusSchema)
    .and(withEstablishmentCommentsSchema)
    .and(withEndedWithAJobSchema);

export const withAssessmentSchema: z.ZodType<
  WithAssessmentDto,
  { assessment: FormAssessmentDto }
> = z.object({
  assessment: assessmentDtoSchema,
});

export const withDateRangeSchema: ZodSchemaWithInputMatchingOutput<DateRange> =
  z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .refine(
      ({ from, to }) => from < to,
      "La date de fin doit être après la date de début.",
    );

export const legacyAssessmentDtoSchema: ZodSchemaWithInputMatchingOutput<LegacyAssessmentDto> =
  z.object({
    status: z.enum(["FINISHED", "ABANDONED"], {
      error: localization.invalidEnum,
    }),
    conventionId: z.string(),
    establishmentFeedback: zStringMinLength1,
  });
