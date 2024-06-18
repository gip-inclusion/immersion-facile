import { z } from "zod";
import { DiscussionId } from "../discussion/discussion.dto";
import { discussionIdSchema } from "../discussion/discussion.schema";
import { ConventionDto } from "./convention.dto";
import { conventionSchema } from "./convention.schema";

// those are put in a different file in purpose
// this is to avoid circular dependencies between convention.schema and discussion.schema

export type AddConventionInput = {
  convention: ConventionDto;
  discussionId?: DiscussionId;
};

export const addConventionInputSchema: z.Schema<AddConventionInput> = z.object({
  convention: conventionSchema,
  discussionId: discussionIdSchema.optional(),
});
