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
