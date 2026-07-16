import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { AddressAndPosition } from "../address/address.dto";
import type { Email } from "../email/email.dto";
import type {
  EstablishmentUserRightStatus,
  FormEstablishmentDto,
  FormEstablishmentPendingUserRight,
} from "../formEstablishment/FormEstablishment.dto";
import type { PhoneNumber } from "../phone/phone.dto";
import type { EstablishmentRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import type { WithBannedEstablishmentInformations } from "./bannedEstablishmentInformations.dto";

export type BusinessAddress = Flavor<string, "BusinessAddress">;

export type BusinessName = Flavor<string, "BusinessName">;

export type BusinessNameCustomized = Flavor<string, "BusinessNameCustomized">;

export type EstablishmentNameAndAdmins = {
  name: string;
  adminEmails: Email[];
};

export type EstablishmentMainContact = {
  firstName: string;
  lastName: string;
  phone: PhoneNumber;
};

export type AdditionalEstablishmentInformation = {
  siret: SiretDto;
  potentialBeneficiaryWelcomeAddress?: AddressAndPosition;
  mainContact: EstablishmentMainContact;
};

export type GetEstablishmentPublicOptionsByFiltersInput = {
  nameIncludes?: string;
  siret?: SiretDto;
};

export type RegisterUserOnEstablishmentPayload = {
  siret: SiretDto;
  userRight: FormEstablishmentPendingUserRight;
};

export type EstablishmentPublicOption = Pick<
  FormEstablishmentDto,
  "businessName" | "businessNameCustomized" | "siret"
> &
  WithBannedEstablishmentInformations;

export type EstablishmentAdminPrivateData = {
  firstName: string;
  lastName: string;
  email: Email;
};

type UserEstablishmentRightDetailsCommon = {
  siret: SiretDto;
  businessName: BusinessName;
  role: EstablishmentRole;
  shouldReceiveDiscussionNotifications: boolean;
};

export type UserEstablishmentRightDetailsWithAcceptedStatus =
  UserEstablishmentRightDetailsCommon & {
    status: Extract<EstablishmentUserRightStatus, "ACCEPTED">;
    admins: EstablishmentAdminPrivateData[];
  };

export type UserEstablishmentRightDetailsWithPendingStatus =
  UserEstablishmentRightDetailsCommon & {
    status: Extract<EstablishmentUserRightStatus, "PENDING">;
  };

export type UserEstablishmentRightDetails = (
  | UserEstablishmentRightDetailsWithAcceptedStatus
  | UserEstablishmentRightDetailsWithPendingStatus
) &
  WithBannedEstablishmentInformations;

export type WithUserEstablishmentRightDetails = {
  establishments?: UserEstablishmentRightDetails[];
};

export type EstablishmentDashboards = {
  conventions: AbsoluteUrl | null;
  discussions: AbsoluteUrl | null;
};

export type WithEstablishmentDashboards = {
  establishments: EstablishmentDashboards;
};
