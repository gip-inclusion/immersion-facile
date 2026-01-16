import type { DateString, FtExternalId, PhoneNumber } from "shared";

export type FtConnectUserDto = {
  isJobseeker: boolean;
  email?: string;
  firstName: string;
  lastName: string;
  birthdate: DateString;
  phone?: PhoneNumber;
  peExternalId: FtExternalId;
};
