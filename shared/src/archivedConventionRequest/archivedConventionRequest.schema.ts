import { z } from "zod";
import { conventionIdSchema } from "../convention/convention.schema";
import { appellationAndRomeDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  firstnameMandatorySchema,
  lastnameMandatorySchema,
} from "../user/user.schema";
import {
  makeHardenedStringSchema,
  zStringMinLength1Max255,
} from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import {
  type ArchivedConventionRequestFormDto,
  type ArchivedConventionRequestReasonFields,
  archivedConventionRequestReasons,
} from "./archivedConventionRequest.dto";

const archivedConventionRequestReasonsWithoutOther =
  archivedConventionRequestReasons.filter((reason) => reason !== "other");

const otherReasonSchema = makeHardenedStringSchema({
  min: 10,
  max: 100,
  minMessage: localization.minCharacters(10),
});

const archivedConventionRequestReasonSchema: ZodSchemaWithInputMatchingOutput<ArchivedConventionRequestReasonFields> =
  z.discriminatedUnion("reason", [
    z.object({
      reason: z.literal("other"),
      otherReason: otherReasonSchema,
    }),
    z.object({
      reason: z.enum(archivedConventionRequestReasonsWithoutOther, {
        error: localization.invalidEnum,
      }),
    }),
  ]);

const archivedConventionRequestWithConventionIdSchema = z.object({
  conventionSearchMethod: z.literal("withConventionId"),
  conventionId: conventionIdSchema,
});

const archivedConventionRequestWithConventionDetailsSchema = z.object({
  conventionSearchMethod: z.literal("withConventionDetails"),
  beneficiaryFirstName: firstnameMandatorySchema,
  beneficiaryLastName: lastnameMandatorySchema,
  siret: siretSchema,
  immersionDate: zStringMinLength1Max255,
  immersionAppellation: appellationAndRomeDtoSchema
    .optional()
    .refine((value) => value !== undefined, {
      message: "Ce champ est obligatoire. Veuillez choisir un métier.",
    }),
});

export const archivedConventionRequestSchema: ZodSchemaWithInputMatchingOutput<ArchivedConventionRequestFormDto> =
  z
    .discriminatedUnion("conventionSearchMethod", [
      archivedConventionRequestWithConventionIdSchema,
      archivedConventionRequestWithConventionDetailsSchema,
    ])
    .and(archivedConventionRequestReasonSchema);
