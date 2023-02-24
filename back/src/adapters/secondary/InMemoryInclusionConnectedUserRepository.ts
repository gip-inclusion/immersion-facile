import { AgencyDto, AuthenticatedUserId } from "shared";
import {
  AgencyRight,
  InclusionConnectedUser,
} from "../../domain/dashboard/entities/InclusionConnectedUser";
import { InclusionConnectedUserRepository } from "../../domain/dashboard/port/InclusionConnectedUserRepository";
import { InMemoryAuthenticatedUserRepository } from "./InMemoryAuthenticatedUserRepository";

type AgencyRightsByUserId = Record<AuthenticatedUserId, AgencyRight[]>;

export class InMemoryInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  constructor(
    private authenticatedUsersRepository: InMemoryAuthenticatedUserRepository,
  ) {}

  async getById(userId: string): Promise<InclusionConnectedUser | undefined> {
    const user = await this.authenticatedUsersRepository.users.find(
      (user) => user.id === userId,
    );
    if (!user) return;
    return { ...user, agencyRights: this.agenciesByUserId[userId] ?? [] };
  }

  async addAgencyToUser(
    user: InclusionConnectedUser,
    agency: AgencyDto,
  ): Promise<void> {
    this.agenciesByUserId[user.id] = [
      ...(this.agenciesByUserId[user.id] ?? []),
      { agency, role: "toReview" },
    ];
  }

  public agenciesByUserId: AgencyRightsByUserId = {};

  setInclusionConnectedUsers(
    inclusionConnectedUsers: InclusionConnectedUser[],
  ) {
    this.authenticatedUsersRepository.users = inclusionConnectedUsers.map(
      ({ agencyRights, ...user }) => user,
    );
    this.agenciesByUserId = inclusionConnectedUsers.reduce(
      (acc, icUser) => ({
        ...acc,
        [icUser.id]: icUser.agencyRights,
      }),
      {} as AgencyRightsByUserId,
    );
  }
}
