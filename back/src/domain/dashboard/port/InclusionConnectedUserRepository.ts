import { InclusionConnectedUser, WithAgencyRole } from "shared";

export interface InclusionConnectedUserRepository {
  getWithFilter(
    filter: Partial<WithAgencyRole>,
  ): Promise<InclusionConnectedUser[]>;
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  update(user: InclusionConnectedUser): Promise<void>;
  isUserAllowedToAccessConvention(
    userId: string,
    conventionId: string,
  ): Promise<boolean>;
}
