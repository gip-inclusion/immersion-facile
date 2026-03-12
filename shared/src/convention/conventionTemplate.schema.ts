import z from "zod";
import { userIdSchema } from "../user/user.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
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
      name: zStringMinLength1Max1024,
      userId: userIdSchema,
    }),
  );
