import { ConventionId, FtExternalId } from "shared";
import {
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";

export type ConventionAndFtExternalIds = {
  conventionId: ConventionId;
  peExternalId: FtExternalId;
};

export interface ConventionFranceTravailAdvisorRepository {
  openSlotForNextConvention: (
    ftUserAndAdvisor: FtUserAndAdvisor,
  ) => Promise<void>;
  associateConventionAndUserAdvisor: (
    conventionId: ConventionId,
    userFtExternalId: FtExternalId,
  ) => Promise<ConventionAndFtExternalIds>;
  getByConventionId: (
    conventionId: ConventionId,
  ) => Promise<ConventionFtUserAdvisorEntity | undefined>;
}
