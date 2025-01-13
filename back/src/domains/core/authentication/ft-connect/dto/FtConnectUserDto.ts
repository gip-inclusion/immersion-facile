import { FtExternalId } from "shared";

export type FtConnectUserDto = {
  isJobseeker: boolean;
  email?: string;
  firstName: string;
  lastName: string;
  peExternalId: FtExternalId;
};
