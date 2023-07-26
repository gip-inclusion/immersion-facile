import { ConventionId, PeExternalId } from "shared";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
} from "../../domain/peConnect/dto/PeConnect.dto";
import {
  ConventionAndPeExternalIds,
  ConventionPoleEmploiAdvisorRepository,
} from "../../domain/peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { NotFoundError } from "../primary/helpers/httpErrors";

export class InMemoryConventionPoleEmploiAdvisorRepository
  implements ConventionPoleEmploiAdvisorRepository
{
  private _conventionPoleEmploiUsersAdvisors: ConventionPoleEmploiUserAdvisorEntity[] =
    [];

  private upsertWithClosedConvention = (
    oldEntity: ConventionPoleEmploiUserAdvisorEntity,
    newEntity: ConventionPoleEmploiUserAdvisorEntity,
  ): void => {
    this._conventionPoleEmploiUsersAdvisors[
      this._conventionPoleEmploiUsersAdvisors.indexOf(oldEntity)
    ] = newEntity;
  };

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    peExternalId: PeExternalId,
  ): Promise<ConventionAndPeExternalIds> {
    const entity: ConventionPoleEmploiUserAdvisorEntity =
      await this.getAlreadyOpenIfExist(peExternalId);
    this.upsertWithClosedConvention(entity, {
      ...entity,
      conventionId,
    });

    return {
      conventionId,
      peExternalId,
    };
  }

  //test purposes only
  public get conventionPoleEmploiUsersAdvisors() {
    return this._conventionPoleEmploiUsersAdvisors;
  }

  private async getAlreadyOpenIfExist(
    peExternalId: PeExternalId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntity> {
    const entity: ConventionPoleEmploiUserAdvisorEntity | undefined =
      this._conventionPoleEmploiUsersAdvisors
        .filter(matchPeExternalId(peExternalId))
        .find(isOpenEntity);
    if (entity) return entity;
    throw new NotFoundError(
      "There is no open pole emploi advisor entity linked to this OAuth peExternalId",
    );
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntity | undefined> {
    return this._conventionPoleEmploiUsersAdvisors.find(
      matchConventionId(conventionId),
    );
  }

  public async openSlotForNextConvention(
    peUserAndAdvisor: PeUserAndAdvisor,
  ): Promise<void> {
    this._conventionPoleEmploiUsersAdvisors.push({
      advisor: peUserAndAdvisor.advisor,
      conventionId: CONVENTION_ID_DEFAULT_UUID,
      peExternalId: peUserAndAdvisor.user.peExternalId,
      _entityName: "ConventionPoleEmploiAdvisor",
    });
  }

  //test purposes only
  public setConventionPoleEmploiUsersAdvisor(
    conventionPoleEmploiUserAdvisorEntities: ConventionPoleEmploiUserAdvisorEntity[],
  ) {
    this._conventionPoleEmploiUsersAdvisors =
      conventionPoleEmploiUserAdvisorEntities;
  }
}

export const CONVENTION_ID_DEFAULT_UUID =
  "00000000-0000-0000-0000-000000000000";

const matchPeExternalId =
  (peExternalId: string) =>
  (conventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity) =>
    conventionPoleEmploiUserAdvisor.peExternalId === peExternalId;

const matchConventionId =
  (conventionId: string) =>
  (conventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity) =>
    conventionPoleEmploiUserAdvisor.conventionId === conventionId;

const isOpenEntity = (entity: ConventionPoleEmploiUserAdvisorEntity) =>
  entity.conventionId === CONVENTION_ID_DEFAULT_UUID;
