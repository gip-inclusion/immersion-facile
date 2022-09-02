import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { toPeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { isPeConnectIdentity } from "../entities/ConventionPoleEmploiAdvisorEntity";
import { ConventionAndPeExternalIds } from "../port/ConventionPoleEmploiAdvisorRepository";

const logger = createLogger(__filename);

export class AssociatePeConnectFederatedIdentity extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (
      !isPeConnectIdentity(
        convention?.signatories.beneficiary.federatedIdentity,
      )
    ) {
      logger.info(
        `Convention ${convention.id} federated identity is not of format peConnect, aborting AssociatePeConnectFederatedIdentity use case`,
      );
      return;
    }

    const conventionAndPeExternalIds: ConventionAndPeExternalIds =
      await uow.conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        convention.id,
        toPeExternalId(convention.signatories.beneficiary.federatedIdentity),
      );

    const event = this.createNewEvent({
      topic: "PeConnectFederatedIdentityAssociated",
      payload: conventionAndPeExternalIds,
    });

    await uow.outboxRepository.save(event);
  }
}
