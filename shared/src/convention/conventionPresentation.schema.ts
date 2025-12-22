import z from "zod";
import {
  agencyKindSchema,
  refersToAgencyIdSchema,
} from "../agency/agency.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
import { conventionSchema } from "./convention.schema";
import type {
  ConventionPresentation,
  WithStatusJustification,
} from "./conventionPresentation.dto";
import { emailSchema } from "../email/email.schema";

export const conventionPresentationSchema: ZodSchemaWithInputMatchingOutput<ConventionPresentation> =
  conventionSchema.and(
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
