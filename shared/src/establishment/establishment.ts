import { z } from "zod";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { BusinessName } from "../business/business";
import type { Email } from "../email/email.dto";
import { emailSchema } from "../email/email.schema";
import type { EstablishmentRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
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

export type EstablishmentAdminPrivateData = {
  firstName: string;
  lastName: string;
  email: Email;
};

export type EstablishmentData = {
  siret: SiretDto;
  businessName: BusinessName;
  role: EstablishmentRole;
  admins: EstablishmentAdminPrivateData[];
};

export type WithEstablishmentsData = {
  establishments?: EstablishmentData[];
};

export type EstablishmentDashboards = {
  conventions?: AbsoluteUrl;
  discussions?: AbsoluteUrl;
};

export type WithEstablishmentDashboards = {
  establishments: EstablishmentDashboards;
};
