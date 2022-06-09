import { toPeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { isPeConnectIdentity } from "../entities/ConventionPoleEmploiAdvisorEntity";
import { ConventionAndPeExternalIds } from "../port/ConventionPoleEmploiAdvisorRepository";
import { createLogger } from "../../../utils/logger";

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
    if (!isPeConnectIdentity(convention?.federatedIdentity)) {
      logger.info(
        `Convention ${convention.id} federated identity is not of format peConnect, aborting AssociatePeConnectFederatedIdentity use case`,
      );
      return;
    }

    const conventionAndPeExternalIds: ConventionAndPeExternalIds =
      await uow.conventionPoleEmploiAdvisorRepo.associateConventionAndUserAdvisor(
        convention.id,
        toPeExternalId(convention.federatedIdentity),
      );

    const event = this.createNewEvent({
      topic: "PeConnectFederatedIdentityAssociated",
      payload: conventionAndPeExternalIds,
    });

    await uow.outboxRepo.save(event);
  }
}
