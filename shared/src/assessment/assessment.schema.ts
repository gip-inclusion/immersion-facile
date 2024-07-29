import { z } from "zod";
import { localization, zEnumValidation, zStringMinLength1 } from "../zodUtils";
import {
  AssessmentDto,
  WithAssessmentDto,
  assessmentStatuses,
} from "./assessment.dto";

export const assessmentSchema: z.Schema<AssessmentDto> = z.object({
  conventionId: z.string(),
  status: zEnumValidation(
    assessmentStatuses,
    localization.expectRadioButtonSelected,
  ),
  establishmentFeedback: zStringMinLength1,
});

export const withAssessmentSchema: z.Schema<WithAssessmentDto> = z.object({
  assessment: assessmentSchema,
});

export const withDateRangeSchema = z
  .object({
    from: z.date(),
    to: z.date(),
  })
  .refine(
    ({ from, to }) =>
      !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()),
    "Les dates fournies en entrées du script ne sont pas corrrectes.",
  )
  .refine(
    ({ from, to }) => from < to,
    "La date de fin doit être après la date de début.",
  );
