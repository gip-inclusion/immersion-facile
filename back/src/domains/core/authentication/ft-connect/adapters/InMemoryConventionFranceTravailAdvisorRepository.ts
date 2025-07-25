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
  #conventionFranceTravailUsersAdvisors: ConventionFtUserAdvisorEntity[] = [];

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    userFtExternalId: FtExternalId,
  ): Promise<ConventionAndFtExternalIds> {
    const entity: ConventionFtUserAdvisorEntity =
      await this.#getAlreadyOpenIfExist(userFtExternalId);
    this.#upsertWithClosedConvention(entity, {
      ...entity,
      conventionId,
    });

    return {
      conventionId,
      ftExternalId: userFtExternalId,
    };
  }

  //test purposes only
  public get conventionFranceTravailUsersAdvisors() {
    return this.#conventionFranceTravailUsersAdvisors;
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionFtUserAdvisorEntity | undefined> {
    return this.#conventionFranceTravailUsersAdvisors.find(
      matchConventionId(conventionId),
    );
  }

  public async deleteByConventionId(conventionId: ConventionId): Promise<void> {
    this.#conventionFranceTravailUsersAdvisors =
      this.#conventionFranceTravailUsersAdvisors.filter(
        (conventionFranceTravailUserAdvisor) =>
          conventionFranceTravailUserAdvisor.conventionId !== conventionId,
      );
  }

  public async openSlotForNextConvention(
    peUserAndAdvisor: FtUserAndAdvisor,
  ): Promise<void> {
    this.#conventionFranceTravailUsersAdvisors.push({
      advisor: peUserAndAdvisor.advisor,
      conventionId: CONVENTION_ID_DEFAULT_UUID,
      peExternalId: peUserAndAdvisor.user.peExternalId,
      _entityName: "ConventionFranceTravailAdvisor",
    });
  }

  //test purposes only
  public setConventionFranceTravailUsersAdvisor(
    conventionFranceTravailUserAdvisorEntities: ConventionFtUserAdvisorEntity[],
  ) {
    this.#conventionFranceTravailUsersAdvisors =
      conventionFranceTravailUserAdvisorEntities;
  }

  async #getAlreadyOpenIfExist(
    peExternalId: FtExternalId,
  ): Promise<ConventionFtUserAdvisorEntity> {
    const entity: ConventionFtUserAdvisorEntity | undefined =
      this.#conventionFranceTravailUsersAdvisors
        .filter(matchFtExternalId(peExternalId))
        .find(isOpenEntity);
    if (entity) return entity;
    throw errors.convention.missingFTAdvisor({ ftExternalId: peExternalId });
  }

  #upsertWithClosedConvention = (
    oldEntity: ConventionFtUserAdvisorEntity,
    newEntity: ConventionFtUserAdvisorEntity,
  ): void => {
    this.#conventionFranceTravailUsersAdvisors[
      this.#conventionFranceTravailUsersAdvisors.indexOf(oldEntity)
    ] = newEntity;
  };
}

export const CONVENTION_ID_DEFAULT_UUID =
  "00000000-0000-0000-0000-000000000000";

const matchFtExternalId =
  (ftExternalId: string) =>
  (conventionFranceTravailUserAdvisor: ConventionFtUserAdvisorEntity) =>
    conventionFranceTravailUserAdvisor.peExternalId === ftExternalId;

const matchConventionId =
  (conventionId: string) =>
  (conventionFranceTravailUserAdvisor: ConventionFtUserAdvisorEntity) =>
    conventionFranceTravailUserAdvisor.conventionId === conventionId;

const isOpenEntity = (entity: ConventionFtUserAdvisorEntity) =>
  entity.conventionId === CONVENTION_ID_DEFAULT_UUID;
