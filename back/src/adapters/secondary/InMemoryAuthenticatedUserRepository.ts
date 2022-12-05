import { AuthenticatedUser } from "../../domain/generic/OAuth/entities/AuthenticatedUser";
import { AuthenticatedUserRepository } from "../../domain/generic/OAuth/ports/AuthentitcatedUserRepositiory";

export class InMemoryAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  async save(user: AuthenticatedUser): Promise<void> {
    this.users.push(user);
  }

  async findByEmail(email: string): Promise<AuthenticatedUser | undefined> {
    return this.users.find((user) => user.email === email);
  }

  // for test purpose
  public users: AuthenticatedUser[] = [];
}
