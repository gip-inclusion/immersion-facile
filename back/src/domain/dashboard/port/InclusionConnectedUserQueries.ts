import { InclusionConnectedUser } from "../entities/InclusionConnectedUser";

export interface InclusionConnectedUserQueries {
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
}
