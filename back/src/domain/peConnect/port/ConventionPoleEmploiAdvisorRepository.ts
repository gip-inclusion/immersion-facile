import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ConventionPoleEmploiUserAdvisorEntityOpen } from "../entities/ConventionPoleEmploiAdvisorEntity";
import { PeExternalId } from "./PeConnectGateway";

export interface ConventionPoleEmploiAdvisorRepository {
  openSlotForNextConvention: (
    advisor: ConventionPoleEmploiUserAdvisorEntityOpen,
  ) => Promise<void>;
  associateConventionAndUserAdvisor: (
    immersionApplicationId: ImmersionApplicationId,
    peExternalId: PeExternalId,
  ) => Promise<void>;
  /*getAlreadyOpenIfExist: (
    peExternalId: PeExternalId,
  ) => Promise<ConventionPoleEmploiUserAdvisorEntityOpen>;*/
}
