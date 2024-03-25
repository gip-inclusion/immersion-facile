import {
  AgencyRight,
  InclusionConnectedUser,
  UserId,
  WithAgencyRole,
} from "shared";
import { InclusionConnectedUserRepository } from "../../../dashboard/port/InclusionConnectedUserRepository";
import { InMemoryUserRepository } from "./InMemoryUserRepository";

type AgencyRightsByUserId = Record<UserId, AgencyRight[]>;

export class InMemoryInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  public agencyRightsByUserId: AgencyRightsByUserId = {};

  constructor(private userRepository: InMemoryUserRepository) {}

  public async getById(
    userId: string,
  ): Promise<InclusionConnectedUser | undefined> {
    const user = await this.userRepository.users.find(
      (user) => user.id === userId,
    );
    if (!user) return;
    return {
      ...user,
      agencyRights: this.agencyRightsByUserId[userId] ?? [],
      establishmentDashboards: {},
    };
  }

  public async getWithFilter({
    agencyRole,
  }: Partial<WithAgencyRole>): Promise<InclusionConnectedUser[]> {
    return this.userRepository.users
      .filter((user) =>
        this.agencyRightsByUserId[user.id].some(
          ({ role }) => role === agencyRole,
        ),
      )
      .map((user) => ({
        ...user,
        agencyRights: this.agencyRightsByUserId[user.id],
        establishmentDashboards: {},
      }));
  }

  public setInclusionConnectedUsers(
    inclusionConnectedUsers: InclusionConnectedUser[],
  ) {
    this.userRepository.users = inclusionConnectedUsers.map(
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

  public async update(user: InclusionConnectedUser): Promise<void> {
    this.agencyRightsByUserId[user.id] = user.agencyRights;
  }
}
