import { Email, User } from "shared";

export interface UserRepository {
  save(user: User): Promise<void>;
  findByExternalId(externalId: string): Promise<User | undefined>;
  findByEmail(email: Email): Promise<User | undefined>;
}
