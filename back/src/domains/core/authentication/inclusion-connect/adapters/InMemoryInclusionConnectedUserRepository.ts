import { AgencyRight, InclusionConnectedUser, UserId } from "shared";
import {
  InclusionConnectedFilters,
  InclusionConnectedUserRepository,
} from "../../../dashboard/port/InclusionConnectedUserRepository";
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
    const foundUser = await this.userRepository.users.find(
      (user) => user.id === userId,
    );
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

  public async getWithFilter({
    agencyRole,
    agencyId,
  }: InclusionConnectedFilters): Promise<InclusionConnectedUser[]> {
    // TODO: gestion des filtres optionnels à améliorer
    return this.userRepository.users
      .filter((user) =>
        this.agencyRightsByUserId[user.id].some(({ roles, agency }) => {
          if (agencyId) {
            if (agency.id !== agencyId) return false;
          }

          if (agencyRole) {
            if (!roles.includes(agencyRole)) return false;
          }

          return true;
        }),
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

  public async updateAgencyRights({
    userId,
    agencyRights,
  }: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void> {
    this.agencyRightsByUserId[userId] = agencyRights;
  }
}
