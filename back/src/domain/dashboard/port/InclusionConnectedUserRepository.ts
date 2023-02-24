import { InclusionConnectedUser } from "../entities/InclusionConnectedUser";

export interface InclusionConnectedUserRepository {
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  update(user: InclusionConnectedUser): Promise<void>;
}
