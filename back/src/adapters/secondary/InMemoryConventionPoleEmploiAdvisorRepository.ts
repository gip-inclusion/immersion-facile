import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  ConventionPoleEmploiUserAdvisorEntityClosed,
  ConventionPoleEmploiUserAdvisorEntityOpen,
} from "../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import { ConventionPoleEmploiAdvisorRepository } from "../../domain/peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { PeExternalId } from "../../domain/peConnect/port/PeConnectGateway";
import { NotFoundError } from "../primary/helpers/httpErrors";

type ConventionPoleEmploiUserAdvisorEntity =
  | ConventionPoleEmploiUserAdvisorEntityOpen
  | ConventionPoleEmploiUserAdvisorEntityClosed;

const matchPeExternalId =
  (peExternalId: string) =>
  (conventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity) =>
    conventionPoleEmploiUserAdvisor.userPeExternalId === peExternalId;
const isEntity = (
  e: ConventionPoleEmploiUserAdvisorEntityOpen | undefined,
): e is ConventionPoleEmploiUserAdvisorEntityOpen => !!e;
const isOpenEntity = (
  entity: ConventionPoleEmploiUserAdvisorEntity & { conventionId?: string },
) => entity.conventionId === null;

export class InMemoryConventionPoleEmploiAdvisorRepository
  implements ConventionPoleEmploiAdvisorRepository
{
  private _conventionPoleEmploiUsersAdvisors: ConventionPoleEmploiUserAdvisorEntity[] =
    [];

  public async openSlotForNextConvention(
    conventionPoleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntityOpen,
  ): Promise<void> {
    this._conventionPoleEmploiUsersAdvisors.push(
      conventionPoleEmploiUserAdvisorEntity,
    );
  }

  public async associateConventionAndUserAdvisor(
    immersionApplicationId: ImmersionApplicationId,
    peExternalId: PeExternalId,
  ): Promise<void> {
    const entity: ConventionPoleEmploiUserAdvisorEntityOpen =
      await this.getAlreadyOpenIfExist(peExternalId);
    this.upsertWithClosedConvention(entity, {
      ...entity,
      conventionId: immersionApplicationId,
    });
  }

  private async getAlreadyOpenIfExist(
    peExternalId: PeExternalId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntityOpen> {
    const entity: ConventionPoleEmploiUserAdvisorEntityOpen | undefined =
      this._conventionPoleEmploiUsersAdvisors
        .filter(matchPeExternalId(peExternalId))
        .find(isOpenEntity);

    if (!isEntity(entity))
      throw new NotFoundError(
        "There is no open pole emploi advisor entity linked to this user peExternalId",
      );

    return entity;
  }

  public get conventionPoleEmploiUsersAdvisors() {
    return this._conventionPoleEmploiUsersAdvisors;
  }

  private upsertWithClosedConvention = (
    oldEntity: ConventionPoleEmploiUserAdvisorEntityOpen,
    newEntity: ConventionPoleEmploiUserAdvisorEntityClosed,
  ): void => {
    this._conventionPoleEmploiUsersAdvisors[
      this._conventionPoleEmploiUsersAdvisors.indexOf(oldEntity)
    ] = newEntity;
  };
}
