import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import { AdminToken, UserAndPassword } from "./admin.dto";

export const adminTokenSchema: z.Schema<AdminToken> = z.string();

export const userAndPasswordSchema: z.Schema<UserAndPassword> = z.object({
  user: zTrimmedString,
  password: zTrimmedString,
});
