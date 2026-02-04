import z from "zod";
import {
  agencyKindSchema,
  refersToAgencyIdSchema,
} from "../agency/agency.schema";
import { emailSchema } from "../email/email.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
import { conventionSchema } from "./convention.schema";
import type {
  CreateConventionPresentationInitialValues,
  WithStatusJustification,
} from "./conventionPresentation.dto";
import { conventionDraftIdSchema } from "./shareConventionDraftByEmail.schema";

export const makeConventionPresentationSchema = (
  isTemplateForm: boolean,
): ZodSchemaWithInputMatchingOutput<CreateConventionPresentationInitialValues> => {
  const schema = conventionSchema.and(
    z.object({
      fromConventionDraftId: conventionDraftIdSchema.optional(),
      agencyDepartment: z.string(),
      agencyRefersTo: z
        .object({
          id: refersToAgencyIdSchema,
          name: zStringMinLength1,
          contactEmail: emailSchema,
          kind: agencyKindSchema,
        })
        .optional(),
    }),
  );
  if (isTemplateForm) {
    return schema.and(
      z.object({
        conventionTemplateName: zStringMinLength1,
      }),
    );
  }
  return schema;
};

export const statusJustificationSchema: ZodSchemaWithInputMatchingOutput<WithStatusJustification> =
  z.object({
    statusJustification: zStringMinLength1,
  });
