import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ConventionPoleEmploiAdvisorRepository } from "../../domain/peConnect/port/ConventionPoleEmploiAdvisorRepository";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
} from "../../domain/peConnect/dto/PeConnect.dto";
import { NotFoundError } from "../primary/helpers/httpErrors";
import { PeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";

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
    conventionId: ImmersionApplicationId,
    peExternalId: PeExternalId,
  ): Promise<void> {
    const entity: ConventionPoleEmploiUserAdvisorEntity =
      await this.getAlreadyOpenIfExist(peExternalId);
    this.upsertWithClosedConvention(entity, {
      ...entity,
      conventionId,
    });
  }

  //test purposes only
  public get conventionPoleEmploiUsersAdvisors() {
    return this._conventionPoleEmploiUsersAdvisors;
  }

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

const isEntity = (
  e: PoleEmploiUserAdvisorDto | undefined,
): e is PoleEmploiUserAdvisorDto => !!e;

const isOpenEntity = (entity: ConventionPoleEmploiUserAdvisorEntity) =>
  entity.conventionId === "";
