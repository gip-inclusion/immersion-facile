import type { ConventionId, FtExternalId } from "shared";
import type {
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";

export type ConventionAndFtExternalIds = {
  conventionId: ConventionId;
  ftExternalId: FtExternalId;
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
  deleteByConventionId: (conventionId: ConventionId) => Promise<void>;
}
