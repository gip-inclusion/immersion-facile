import { type ConventionId, errors, type FtExternalId } from "shared";
import type {
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";
import type {
  ConventionAndFtExternalIds,
  ConventionFranceTravailAdvisorRepository,
} from "../port/ConventionFranceTravailAdvisorRepository";

export class InMemoryConventionFranceTravailAdvisorRepository
  implements ConventionFranceTravailAdvisorRepository
{
  #ftConnectedUsers: Record<FtExternalId, FtUserAndAdvisor> = {};
  #conventionFranceTravailUsers: Record<ConventionId, FtExternalId> = {};

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    userFtExternalId: FtExternalId,
  ): Promise<ConventionAndFtExternalIds> {
    if (!this.#ftConnectedUsers[userFtExternalId]) {
      throw errors.ftConnect.associationFailed({
        rowCount: 0,
        conventionId,
        ftExternalId: userFtExternalId,
      });
    }
    this.#conventionFranceTravailUsers[conventionId] = userFtExternalId;

    return {
      conventionId,
      ftExternalId: userFtExternalId,
    };
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionFtUserAdvisorEntity | undefined> {
    const userFtExternalId = this.#conventionFranceTravailUsers[conventionId];

    if (!userFtExternalId) return undefined;

    const userAndAdvisor = this.#ftConnectedUsers[userFtExternalId];
    return {
      peExternalId: userFtExternalId,
      conventionId,
      advisor: userAndAdvisor?.advisor,
      _entityName: "ConventionFranceTravailAdvisor",
    };
  }

  public async deleteByConventionId(conventionId: ConventionId): Promise<void> {
    const { [conventionId]: _deleted, ...conventionFranceTravailUsers } =
      this.#conventionFranceTravailUsers;

    this.#conventionFranceTravailUsers = conventionFranceTravailUsers;
  }

  public async saveFtUserAndAdvisor(
    peUserAndAdvisor: FtUserAndAdvisor,
  ): Promise<void> {
    this.#ftConnectedUsers[peUserAndAdvisor.user.peExternalId] =
      peUserAndAdvisor;
  }

  public get conventionFranceTravailUsers() {
    return this.#conventionFranceTravailUsers;
  }

  public set conventionFranceTravailUsers(value: Record<
    ConventionId,
    FtExternalId
  >) {
    this.#conventionFranceTravailUsers = value;
  }

  public get ftConnectedUsers() {
    return this.#ftConnectedUsers;
  }

  public set ftConnectedUsers(value: Record<FtExternalId, FtUserAndAdvisor>) {
    this.#ftConnectedUsers = value;
  }
}
