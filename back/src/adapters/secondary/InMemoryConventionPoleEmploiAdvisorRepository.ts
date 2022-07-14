import { ConventionId } from "shared/src/convention/convention.dto";
import { PeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
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

  public async openSlotForNextConvention(
    conventionPoleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity,
  ): Promise<void> {
    this._conventionPoleEmploiUsersAdvisors.push(
      conventionPoleEmploiUserAdvisorEntity,
    );
  }

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

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntity | undefined> {
    return this._conventionPoleEmploiUsersAdvisors.find(
      matchConventionId(conventionId),
    );
  }

  //test purposes only
  public get conventionPoleEmploiUsersAdvisors() {
    return this._conventionPoleEmploiUsersAdvisors;
  }

  //test purposes only
  public setConventionPoleEmploiUsersAdvisor(
    conventionPoleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity,
  ) {
    this._conventionPoleEmploiUsersAdvisors.push(
      conventionPoleEmploiUserAdvisorEntity,
    );
  }

  private upsertWithClosedConvention = (
    oldEntity: ConventionPoleEmploiUserAdvisorEntity,
    newEntity: ConventionPoleEmploiUserAdvisorEntity,
  ): void => {
    this._conventionPoleEmploiUsersAdvisors[
      this._conventionPoleEmploiUsersAdvisors.indexOf(oldEntity)
    ] = newEntity;
  };

  private async getAlreadyOpenIfExist(
    peExternalId: PeExternalId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntity> {
    const entity: ConventionPoleEmploiUserAdvisorEntity | undefined =
      this._conventionPoleEmploiUsersAdvisors
        .filter(matchPeExternalId(peExternalId))
        .find(isOpenEntity);

    if (!isEntity(entity))
      throw new NotFoundError(
        "There is no open pole emploi advisor entity linked to this user peExternalId",
      );

    return entity;
  }
}

const matchPeExternalId =
  (peExternalId: string) =>
  (conventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity) =>
    conventionPoleEmploiUserAdvisor.userPeExternalId === peExternalId;

const matchConventionId =
  (conventionId: string) =>
  (conventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity) =>
    conventionPoleEmploiUserAdvisor.conventionId === conventionId;

const isEntity = (
  e: PoleEmploiUserAdvisorDto | undefined,
): e is PoleEmploiUserAdvisorDto => !!e;

const isOpenEntity = (entity: ConventionPoleEmploiUserAdvisorEntity) =>
  entity.conventionId === "";
