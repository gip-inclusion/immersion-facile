import {
  ConventionDto,
  PeConnectIdentity,
  WithConventionDto,
  authFailed,
  isPeConnectIdentity,
  withConventionSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";

export class BindConventionToFederatedIdentity extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const federatedIdentity =
      convention.signatories.beneficiary.federatedIdentity;

    return isPeConnectIdentity(federatedIdentity) &&
      federatedIdentity.token !== authFailed
      ? this.#associateConventionToFederatedIdentity(
          convention,
          federatedIdentity,
          uow,
        )
      : uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "FederatedIdentityNotBoundToConvention",
            payload: { convention },
          }),
        );
  }

  async #associateConventionToFederatedIdentity(
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
        this.#createNewEvent({
          topic: "FederatedIdentityBoundToConvention",
          payload: { convention },
        }),
      );
    } catch (_error) {
      await uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "FederatedIdentityNotBoundToConvention",
          payload: { convention },
        }),
      );
    }
  }
}
