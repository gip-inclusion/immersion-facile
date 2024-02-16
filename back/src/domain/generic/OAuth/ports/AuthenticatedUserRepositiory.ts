import { AuthenticatedUser } from "shared";

export interface AuthenticatedUserRepository {
  save(user: AuthenticatedUser): Promise<void>;
  findByExternalId(externalId: string): Promise<AuthenticatedUser | undefined>;
}
