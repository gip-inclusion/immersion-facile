import { InclusionConnectedUser } from "shared";

export interface InclusionConnectedUserRepository {
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  update(user: InclusionConnectedUser): Promise<void>;
}
