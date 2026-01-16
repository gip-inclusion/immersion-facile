import type { DateString, FtExternalId } from "shared";

export type FtConnectUserDto = {
  isJobseeker: boolean;
  email?: string;
  firstName: string;
  lastName: string;
  birthdate: DateString;
  peExternalId: FtExternalId;
};
