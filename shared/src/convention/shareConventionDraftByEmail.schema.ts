import { z } from "zod";
import { agencyKindSchema } from "../agency/agency.schema";
import { emailSchema } from "../email/email.schema";
import { getNestedValue, isObject } from "../utils";
import {
  deepPartialSchema,
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
import {
  immersionConventionSchema,
  miniStageConventionSchema,
} from "./convention.schema";
import type {
  ConventionDraftDto,
  ConventionDraftId,
  ShareConventionDraftByEmailDto,
} from "./shareConventionDraftByEmail.dto";

export const conventionDraftIdSchema: ZodSchemaWithInputMatchingOutput<ConventionDraftId> =
  z.uuid(localization.invalidUuid);

const miniStageBeneficiaryFields = [
  "levelOfEducation",
  "schoolName",
  "schoolPostcode",
  "address",
] as const;

const validateImmersionBeneficiary = (input: unknown): void => {
  if (!isObject(input) || input.internshipKind !== "immersion") return;

  const beneficiary = getNestedValue(input, "signatories", "beneficiary");
  if (!isObject(beneficiary)) return;

  for (const field of miniStageBeneficiaryFields) {
    if (beneficiary[field] !== undefined) {
      throw new z.ZodError([
        {
          code: "custom",
          input: beneficiary[field],
          message: `${field} is not allowed for immersion conventions`,
          path: ["signatories", "beneficiary", field],
        },
      ]);
    }
  }
};

const baseConventionDraftSchema = deepPartialSchema(immersionConventionSchema)
  .or(deepPartialSchema(miniStageConventionSchema))
  .and(
    z.object({
      id: conventionDraftIdSchema,
      agencyKind: agencyKindSchema.optional(),
      agencyDepartment: z.string().optional(),
    }),
  );

export const conventionDraftSchema: ZodSchemaWithInputMatchingOutput<ConventionDraftDto> =
  z.preprocess((input) => {
    validateImmersionBeneficiary(input);
    return input;
  }, baseConventionDraftSchema) as unknown as ZodSchemaWithInputMatchingOutput<ConventionDraftDto>;

export const shareConventionDraftByEmailSchema: ZodSchemaWithInputMatchingOutput<ShareConventionDraftByEmailDto> =
  z.object({
    senderEmail: emailSchema,
    recipientEmail: emailSchema.optional(),
    details: zStringMinLength1.optional(),
    conventionDraft: conventionDraftSchema,
  });
