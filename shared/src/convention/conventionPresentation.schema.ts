import z from "zod";
import {
  agencyKindSchema,
  refersToAgencyIdSchema,
} from "../agency/agency.schema";
import { emailSchema } from "../email/email.schema";
import { siretSchema } from "../siret/siret.schema";
import { replaceEmptyValuesByUndefinedFromObject } from "../utils";
import { zStringMinLength1 } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import { conventionIdSchema, conventionSchema } from "./convention.schema";
import type {
  ConventionFormInitialValues,
  WithStatusJustification,
} from "./conventionPresentation.dto";
import { conventionTemplateIdSchema } from "./conventionTemplate.schema";
import {
  conventionDraftIdSchema,
  conventionDraftSchema,
} from "./shareConventionDraftByEmail.schema";

const makeConventionPresentationSchema = (
  isTemplateForm: boolean,
): ZodSchemaWithInputMatchingOutput<ConventionFormInitialValues> => {
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
          siret: siretSchema,
        })
        .optional(),
    }),
  );
  if (isTemplateForm) {
    return conventionDraftSchema.and(
      z.object({
        id: conventionIdSchema,
        name: zStringMinLength1,
        fromConventionTemplateId: conventionTemplateIdSchema.optional(),
        agencyDepartment: z.string().optional(),
        agencyRefersTo: z
          .object({
            id: refersToAgencyIdSchema,
            name: zStringMinLength1,
            contactEmail: emailSchema,
            kind: agencyKindSchema,
            siret: siretSchema,
          })
          .optional(),
      }),
    );
  }
  return schema;
};

export const makeConventionPresentationSchemaWithNormalizedInput = ({
  isTemplateForm,
}: {
  isTemplateForm: boolean;
}): ZodSchemaWithInputMatchingOutput<ConventionFormInitialValues> =>
  z.preprocess(
    (val) =>
      isTemplateForm ? replaceEmptyValuesByUndefinedFromObject(val) : val,
    makeConventionPresentationSchema(isTemplateForm),
  );

export const statusJustificationSchema: ZodSchemaWithInputMatchingOutput<WithStatusJustification> =
  z.object({
    statusJustification: zStringMinLength1,
  });
