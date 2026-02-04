import z from "zod";
import { userIdSchema } from "../user/user.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
import type {
  ConventionTemplate,
  ConventionTemplateId,
} from "./conventionTemplate.dto";
import { conventionDraftSchema } from "./shareConventionDraftByEmail.schema";

export const conventionTemplateIdSchema: ZodSchemaWithInputMatchingOutput<ConventionTemplateId> =
  z.uuid(localization.invalidUuid);

export const conventionTemplateSchema: ZodSchemaWithInputMatchingOutput<ConventionTemplate> =
  conventionDraftSchema.and(
    z.object({
      id: conventionTemplateIdSchema,
      name: zStringMinLength1,
      userId: userIdSchema,
    }),
  );
