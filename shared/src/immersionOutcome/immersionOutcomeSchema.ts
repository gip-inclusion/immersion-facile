import { z } from "zod";
import { ImmersionOutcomeDto, outcomeStatuses } from "./ImmersionOutcomeDto";

export const immersionOutcomeSchema: z.Schema<ImmersionOutcomeDto> = z.object({
  id: z.string(),
  status: z.enum(outcomeStatuses),
  establishmentFeedback: z.string(),
  immersionApplicationId: z.string(),
});
