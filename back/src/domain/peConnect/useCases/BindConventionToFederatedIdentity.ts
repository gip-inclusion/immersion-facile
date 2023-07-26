import {
  authFailed,
  ConventionDto,
  conventionSchema,
  isPeConnectIdentity,
  PeConnectIdentity,
} from "shared";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class BindConventionToFederatedIdentity extends TransactionalUseCase<ConventionDto> {
  protected inputSchema = conventionSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const federatedIdentity =
      convention.signatories.beneficiary.federatedIdentity;

    return isPeConnectIdentity(federatedIdentity) &&
      federatedIdentity.token !== authFailed
      ? this.associateConventionToFederatedIdentity(
          convention,
          federatedIdentity,
          uow,
        )
      : uow.outboxRepository.save(
          this.createNewEvent({
            topic: "FederatedIdentityNotBoundToConvention",
            payload: convention,
          }),
        );
  }

  private async associateConventionToFederatedIdentity(
    convention: ConventionDto,
    federatedIdentity: PeConnectIdentity,
    uow: UnitOfWork,
  ): Promise<void> {
    try {
      await uow.conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        convention.id,
        federatedIdentity.token,
      );
      await uow.outboxRepository.save(
        this.createNewEvent({
          topic: "FederatedIdentityBoundToConvention",
          payload: convention,
        }),
      );
    } catch (_error) {
      await uow.outboxRepository.save(
        this.createNewEvent({
          topic: "FederatedIdentityNotBoundToConvention",
          payload: convention,
        }),
      );
    }
  }
}
