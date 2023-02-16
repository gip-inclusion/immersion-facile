import { AgencyDto } from "shared";
import { InclusionConnectedUser } from "../../domain/dashboard/entities/InclusionConnectedUser";
import { InclusionConnectedUserQueries } from "../../domain/dashboard/port/InclusionConnectedUserQueries";
import { InMemoryAuthenticatedUserRepository } from "./InMemoryAuthenticatedUserRepository";

export class InMemoryInclusionConnectedUserQueries
  implements InclusionConnectedUserQueries
{
  constructor(
    private authenticatedUsersRepository: InMemoryAuthenticatedUserRepository,
  ) {}

  async getById(userId: string): Promise<InclusionConnectedUser | undefined> {
    const user = await this.authenticatedUsersRepository.users.find(
      (user) => user.id === userId,
    );
    if (!user) return;
    return { ...user, agencies: this.agenciesByUserId[userId] ?? [] };
  }

  public agenciesByUserId: Record<string, AgencyDto[]> = {};

  setInclusionConnectedUsers(
    inclusionConnectedUsers: InclusionConnectedUser[],
  ) {
    this.authenticatedUsersRepository.users = inclusionConnectedUsers.map(
      ({ agencies, ...user }) => user,
    );
    this.agenciesByUserId = inclusionConnectedUsers.reduce(
      (acc, icUser) => ({
        ...acc,
        [icUser.id]: icUser.agencies,
      }),
      {} as Record<string, AgencyDto[]>,
    );
  }
}
