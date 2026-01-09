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
import { conventionIdSchema, conventionSchema } from "./convention.schema";
import type {
  ConventionPresentation,
  WithConventionIdOrConventionDraftId,
  WithStatusJustification,
} from "./conventionPresentation.dto";
import { conventionDraftIdSchema } from "./shareConventionDraftByEmail.schema";

const withConventionIdOrConventionDraftIdSchema: ZodSchemaWithInputMatchingOutput<WithConventionIdOrConventionDraftId> =
  z.object({
    id: conventionIdSchema.or(conventionDraftIdSchema),
  });

export const conventionPresentationSchema: ZodSchemaWithInputMatchingOutput<ConventionPresentation> =
  conventionSchema.and(withConventionIdOrConventionDraftIdSchema).and(
    z.object({
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

export const statusJustificationSchema: ZodSchemaWithInputMatchingOutput<WithStatusJustification> =
  z.object({
    statusJustification: zStringMinLength1,
  });
