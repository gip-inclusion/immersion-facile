import {
  PeConnectIdentity,
  toPeExternalId,
} from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class AssociateFederatedIdentityPeConnect extends TransactionalUseCase<ImmersionApplicationDto> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(
    convention: ImmersionApplicationDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!isPeConnectIdentity(convention?.federatedIdentity)) return;

    await uow.conventionPoleEmploiAdvisorRepo.associateConventionAndUserAdvisor(
      convention.id,
      toPeExternalId(convention.federatedIdentity),
    );
  }
}

const isPeConnectIdentity = (
  peConnectIdentity: PeConnectIdentity | undefined,
): peConnectIdentity is PeConnectIdentity => !!peConnectIdentity;
