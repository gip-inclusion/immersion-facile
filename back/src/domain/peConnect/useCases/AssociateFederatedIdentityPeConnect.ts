import {
  PeConnectIdentity,
  toPeExternalId,
} from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class AssociatePeConnectFederatedIdentity extends TransactionalUseCase<ConventionDto> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
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
