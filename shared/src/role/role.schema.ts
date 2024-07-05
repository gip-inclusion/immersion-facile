import { z } from "zod";
import { Role, allRoles } from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles);
