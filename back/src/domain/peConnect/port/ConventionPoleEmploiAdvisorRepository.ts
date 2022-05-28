import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { PeExternalId, PoleEmploiUserAdvisorDTO } from "../dto/PeConnect.dto";

export interface ConventionPoleEmploiAdvisorRepository {
  openSlotForNextConvention: (
    advisor: PoleEmploiUserAdvisorDTO,
  ) => Promise<void>;
  associateConventionAndUserAdvisor: (
    conventionId: ImmersionApplicationId,
    userPeExternalId: PeExternalId,
  ) => Promise<void>;
}
