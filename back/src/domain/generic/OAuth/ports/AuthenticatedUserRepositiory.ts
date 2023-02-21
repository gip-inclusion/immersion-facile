import { AuthenticatedUser } from "shared";

export interface AuthenticatedUserRepository {
  save(user: AuthenticatedUser): Promise<void>;
  findByEmail(email: string): Promise<AuthenticatedUser | undefined>;
}
