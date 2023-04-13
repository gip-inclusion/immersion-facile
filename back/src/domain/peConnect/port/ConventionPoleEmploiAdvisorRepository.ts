import { ConventionId, PeExternalId } from "shared";

import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
} from "../dto/PeConnect.dto";

export type ConventionAndPeExternalIds = {
  conventionId: ConventionId;
  peExternalId: PeExternalId;
};

export interface ConventionPoleEmploiAdvisorRepository {
  openSlotForNextConvention: (
    peUserAndAdvisor: PeUserAndAdvisor,
  ) => Promise<void>;
  associateConventionAndUserAdvisor: (
    conventionId: ConventionId,
    userPeExternalId: PeExternalId,
  ) => Promise<ConventionAndPeExternalIds>;

  getByConventionId: (
    conventionId: ConventionId,
  ) => Promise<ConventionPoleEmploiUserAdvisorEntity | undefined>;
}
