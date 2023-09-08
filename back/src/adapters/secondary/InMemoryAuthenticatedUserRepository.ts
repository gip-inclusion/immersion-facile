import { values } from "ramda";
import { AuthenticatedUser } from "shared";
import { AuthenticatedUserRepository } from "../../domain/generic/OAuth/ports/AuthenticatedUserRepositiory";

export class InMemoryAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  #usersById: Record<string, AuthenticatedUser> = {};

  public async findByEmail(
    email: string,
  ): Promise<AuthenticatedUser | undefined> {
    return this.users.find((user) => user.email === email);
  }

  public async save(user: AuthenticatedUser): Promise<void> {
    this.#usersById[user.id] = user;
  }

  // for test purpose
  public get users(): AuthenticatedUser[] {
    return values(this.#usersById);
  }

  public set users(users: AuthenticatedUser[]) {
    this.#usersById = users.reduce(
      (acc, user) => ({
        ...acc,
        [user.id]: user,
      }),
      {} as Record<string, AuthenticatedUser>,
    );
  }
}
