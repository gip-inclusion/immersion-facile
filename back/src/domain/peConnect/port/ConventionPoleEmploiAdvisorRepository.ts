import { PeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";

export interface ConventionPoleEmploiAdvisorRepository {
  openSlotForNextConvention: (
    advisor: ConventionPoleEmploiUserAdvisorEntity,
  ) => Promise<void>;
  associateConventionAndUserAdvisor: (
    conventionId: ConventionId,
    userPeExternalId: PeExternalId,
  ) => Promise<void>;
}
