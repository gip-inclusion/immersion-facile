import { values } from "ramda";
import { AuthenticatedUser, AuthenticatedUserId } from "shared";
import { AuthenticatedUserRepository } from "../../domain/generic/OAuth/ports/AuthenticatedUserRepositiory";

export class InMemoryAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  async save(user: AuthenticatedUser): Promise<void> {
    this.usersById[user.id] = user;
  }

  async findByEmail(email: string): Promise<AuthenticatedUser | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findById(
    id: AuthenticatedUserId,
  ): Promise<AuthenticatedUser | undefined> {
    return this.usersById[id];
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
