import { values } from "ramda";
import { AuthenticatedUser } from "../../domain/generic/OAuth/entities/AuthenticatedUser";
import { AuthenticatedUserRepository } from "../../domain/generic/OAuth/ports/AuthentitcatedUserRepositiory";

export class InMemoryAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  async save(user: AuthenticatedUser): Promise<void> {
    this.usersById[user.id] = user;
  }

  async findByEmail(email: string): Promise<AuthenticatedUser | undefined> {
    return this.users.find((user) => user.email === email);
  }

  private usersById: Record<string, AuthenticatedUser> = {};

  // for test purpose
  public get users(): AuthenticatedUser[] {
    return values(this.usersById);
  }

  public set users(users: AuthenticatedUser[]) {
    this.usersById = users.reduce(
      (acc, user) => ({
        ...acc,
        [user.id]: user,
      }),
      {} as Record<string, AuthenticatedUser>,
    );
  }
}
