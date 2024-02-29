import { PeExternalId } from "shared";

export type PeConnectUserDto = {
  isJobseeker: boolean;
  email?: string;
  firstName: string;
  lastName: string;
  peExternalId: PeExternalId;
};
