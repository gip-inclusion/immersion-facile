import { z } from "zod";
import { WithEmailInput } from "./emailValidation.dto";

export const emailValidationInputSchema: z.Schema<WithEmailInput> = z.object({
  email: z.string(),
});
