import { values } from "ramda";
import {
  AgencyRight,
  Email,
  GetUsersFilters,
  InclusionConnectedUser,
  User,
  UserId,
  UserInList,
  errors,
} from "shared";
import {
  InclusionConnectedFilters,
  UserRepository,
} from "../port/UserRepository";

type AgencyRightsByUserId = Record<UserId, AgencyRight[]>;

export class InMemoryUserRepository implements UserRepository {
  public agencyRightsByUserId: AgencyRightsByUserId = {};
  #usersById: Record<string, User> = {};

  public async findByExternalId(externalId: string): Promise<User | undefined> {
    return this.users.find((user) => user.externalId === externalId);
  }

  public async findByEmail(email: Email): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  public async save(user: User): Promise<void> {
    this.#usersById[user.id] = user;
    if (
      values(this.#usersById).filter(({ email }) => email === user.email)
        .length > 1
    )
      throw errors.user.conflictByEmail({ userEmail: user.email });
    if (
      user.externalId &&
      values(this.#usersById).filter(
        ({ externalId }) => externalId === user.externalId,
      ).length > 1
    )
      throw errors.user.conflictByExternalId({ externalId: user.externalId });
  }

  public async delete(id: UserId): Promise<void> {
    const user = this.#usersById[id];
    if (!user) throw errors.user.notFound({ userId: id });

    delete this.#usersById[id];
    delete this.agencyRightsByUserId[id];
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

  public async getById(
    userId: string,
  ): Promise<InclusionConnectedUser | undefined> {
    const foundUser = await this.users.find((user) => user.id === userId);
    if (!foundUser) return;
    return {
      ...foundUser,
      agencyRights: this.agencyRightsByUserId[userId] ?? [],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };
  }

  public async getIcUsersWithFilter({
    agencyRole,
    agencyId,
    email,
    isNotifiedByEmail: isNotifiedByEmailFilter,
  }: InclusionConnectedFilters): Promise<InclusionConnectedUser[]> {
    // TODO: gestion des filtres optionnels à améliorer
    return this.users
      .filter((user) => (email ? user.email === email : true))
      .filter((user) => (email ? user.email === email : true))
      .filter((user) =>
        this.agencyRightsByUserId[user.id].some(
          ({ roles, agency, isNotifiedByEmail }) => {
            if (agencyId) {
              if (agency.id !== agencyId) return false;
            }

            if (agencyRole) {
              if (!roles.includes(agencyRole)) return false;
            }

            if (isNotifiedByEmailFilter !== undefined) {
              return isNotifiedByEmail === isNotifiedByEmailFilter;
            }

            return true;
          },
        ),
      )
      .map((user) => ({
        ...user,
        agencyRights: this.agencyRightsByUserId[user.id],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      }));
  }

  public async getUsers(filters: GetUsersFilters): Promise<UserInList[]> {
    const emailContains = filters.emailContains.toLowerCase();
    return this.users
      .filter((user) => user.email.toLowerCase().includes(emailContains))
      .map(
        (user): UserInList => ({
          ...user,
          numberOfAgencies: this.agencyRightsByUserId[user.id].length,
        }),
      );
  }

  public setInclusionConnectedUsers(
    inclusionConnectedUsers: InclusionConnectedUser[],
  ) {
    this.users = inclusionConnectedUsers.map(
      ({ agencyRights: _, ...user }) => user,
    );
    this.agencyRightsByUserId = inclusionConnectedUsers.reduce(
      (acc, icUser) => ({
        ...acc,
        [icUser.id]: icUser.agencyRights,
      }),
      {} satisfies AgencyRightsByUserId,
    );
  }

  public async updateAgencyRights({
    userId,
    agencyRights,
  }: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void> {
    this.agencyRightsByUserId[userId] = agencyRights;
  }

  public async updateEmail(userId: string, email: string): Promise<void> {
    this.#usersById[userId].email = email;
  }
}
