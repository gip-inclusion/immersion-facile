import { values } from "ramda";
import { AuthenticatedUser, AuthenticatedUserId } from "shared";
import { AuthenticatedUserRepository } from "../../domain/generic/OAuth/ports/AuthenticatedUserRepositiory";

export class InMemoryAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  private usersById: Record<string, AuthenticatedUser> = {};

  async findByEmail(email: string): Promise<AuthenticatedUser | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findById(
    id: AuthenticatedUserId,
  ): Promise<AuthenticatedUser | undefined> {
    return this.usersById[id];
  }

  async save(user: AuthenticatedUser): Promise<void> {
    this.usersById[user.id] = user;
  }

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
