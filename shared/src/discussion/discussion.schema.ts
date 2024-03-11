import { z } from "zod";
import { DiscussionId } from "./discussion.dto";

export const discussionIdSchema: z.Schema<DiscussionId> = z.string();
