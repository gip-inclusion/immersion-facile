import { AuthenticatedUser } from "../entities/AuthenticatedUser";

export interface AuthenticatedUserRepository {
  save(user: AuthenticatedUser): Promise<void>;
  findByEmail(email: string): Promise<AuthenticatedUser | undefined>;
}
