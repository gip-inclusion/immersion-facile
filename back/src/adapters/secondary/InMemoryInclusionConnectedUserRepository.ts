import {
  AgencyRight,
  AuthenticatedUserId,
  InclusionConnectedUser,
  WithAgencyRole,
} from "shared";
import { InclusionConnectedUserRepository } from "../../domain/dashboard/port/InclusionConnectedUserRepository";
import { InMemoryAuthenticatedUserRepository } from "./InMemoryAuthenticatedUserRepository";

type AgencyRightsByUserId = Record<AuthenticatedUserId, AgencyRight[]>;

export class InMemoryInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  public agencyRightsByUserId: AgencyRightsByUserId = {};

  constructor(
    private authenticatedUsersRepository: InMemoryAuthenticatedUserRepository,
  ) {}

  public async getById(
    userId: string,
  ): Promise<InclusionConnectedUser | undefined> {
    const user = await this.authenticatedUsersRepository.users.find(
      (user) => user.id === userId,
    );
    if (!user) return;
    return { ...user, agencyRights: this.agencyRightsByUserId[userId] ?? [] };
  }

  public async getWithFilter({
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

  public setInclusionConnectedUsers(
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

  public async update(user: InclusionConnectedUser): Promise<void> {
    this.agencyRightsByUserId[user.id] = user.agencyRights;
  }
}
