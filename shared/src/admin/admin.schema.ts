import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import { BackOfficeJwt, UserAndPassword } from "./admin.dto";

export const adminTokenSchema: z.Schema<BackOfficeJwt> = z.string();

export const userAndPasswordSchema: z.Schema<UserAndPassword> = z.object({
  user: zTrimmedString,
  password: zTrimmedString,
});
