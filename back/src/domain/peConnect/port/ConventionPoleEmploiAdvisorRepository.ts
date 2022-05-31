import { PeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";

export interface ConventionPoleEmploiAdvisorRepository {
  openSlotForNextConvention: (
    advisor: ConventionPoleEmploiUserAdvisorEntity,
  ) => Promise<void>;
  associateConventionAndUserAdvisor: (
    conventionId: ImmersionApplicationId,
    userPeExternalId: PeExternalId,
  ) => Promise<void>;
}
