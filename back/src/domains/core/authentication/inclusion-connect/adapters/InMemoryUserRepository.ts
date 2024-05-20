import { values } from "ramda";
import { Email, User } from "shared";
import { UserRepository } from "../port/UserRepositiory";

export class InMemoryUserRepository implements UserRepository {
  #usersById: Record<string, User> = {};

  public async findByExternalId(externalId: string): Promise<User | undefined> {
    return this.users.find((user) => user.externalId === externalId);
  }

  public async findByEmail(email: Email): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  public async save(user: User): Promise<void> {
    this.#usersById[user.id] = user;
  }

  // for test purpose
  public get users(): User[] {
    return values(this.#usersById);
  }

  public set users(users: User[]) {
    this.#usersById = users.reduce(
      (acc, user) => ({
        ...acc,
        [user.id]: user,
      }),
      {} as Record<string, User>,
    );
  }
}
