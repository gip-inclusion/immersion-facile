import { AgencyDto } from "shared";
import { InclusionConnectedUser } from "../entities/InclusionConnectedUser";

export interface InclusionConnectedUserRepository {
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  addAgencyToUser(
    user: InclusionConnectedUser,
    agencyId: AgencyDto,
  ): Promise<void>;
}
