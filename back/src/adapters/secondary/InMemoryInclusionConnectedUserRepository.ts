import {
  AgencyRight,
  AuthenticatedUserId,
  InclusionConnectedUser,
  WithAgencyRole,
} from "shared";
import { InclusionConnectedUserRepository } from "../../domain/dashboard/port/InclusionConnectedUserRepository";
import { InMemoryAuthenticatedUserRepository } from "./InMemoryAuthenticatedUserRepository";

type AgencyRightsByUserId = Record<AuthenticatedUserId, AgencyRight[]>;

export const conventionIdAllowedForIcUser =
  "20020020-0000-4000-0000-000000200200";
export class InMemoryInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  constructor(
    private authenticatedUsersRepository: InMemoryAuthenticatedUserRepository,
  ) {}

  async getWithFilter({
    agencyRole,
  }: Partial<WithAgencyRole>): Promise<InclusionConnectedUser[]> {
    return this.authenticatedUsersRepository.users
      .filter((user) =>
        this.agencyRightsByUserId[user.id].some(
          ({ role }) => role == agencyRole,
        ),
      )
      .map((user) => ({
        ...user,
        agencyRights: this.agencyRightsByUserId[user.id],
      }));
  }

  async getById(userId: string): Promise<InclusionConnectedUser | undefined> {
    const user = await this.authenticatedUsersRepository.users.find(
      (user) => user.id === userId,
    );
    if (!user) return;
    return { ...user, agencyRights: this.agencyRightsByUserId[userId] ?? [] };
  }

  async update(user: InclusionConnectedUser): Promise<void> {
    this.agencyRightsByUserId[user.id] = user.agencyRights;
  }

  public async isUserAllowedToAccessConvention(
    _userId: string,
    conventionId: "20020020-0000-4000-0000-000000200200",
  ): Promise<boolean> {
    if (conventionId === conventionIdAllowedForIcUser) return true;
    if (conventionId === "convention-id-not-allowed") return false;
    return false;
  }

  public agencyRightsByUserId: AgencyRightsByUserId = {};

  setInclusionConnectedUsers(
    inclusionConnectedUsers: InclusionConnectedUser[],
  ) {
    this.authenticatedUsersRepository.users = inclusionConnectedUsers.map(
      ({ agencyRights, ...user }) => user,
    );
    this.agencyRightsByUserId = inclusionConnectedUsers.reduce(
      (acc, icUser) => ({
        ...acc,
        [icUser.id]: icUser.agencyRights,
      }),
      {} satisfies AgencyRightsByUserId,
    );
  }
}
