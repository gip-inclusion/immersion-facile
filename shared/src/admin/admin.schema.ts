import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import { UserAndPassword } from "./admin.dto";

export const userAndPasswordSchema: z.Schema<UserAndPassword> = z.object({
  user: zTrimmedString,
  password: zTrimmedString,
});
