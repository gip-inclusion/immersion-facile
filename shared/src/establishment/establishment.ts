import { z } from "zod/v4";
import type { Email } from "../email/email.dto";
import { emailSchema } from "../email/email.schema";
import { zStringMinLength1 } from "../zodUtils";

export type EstablishmentNameAndAdmins = {
  name: string;
  adminEmails: Email[];
};

export const establishmentNameAndAdminsSchema: z.Schema<EstablishmentNameAndAdmins> =
  z.object({
    name: zStringMinLength1,
    adminEmails: z.array(emailSchema),
  });
