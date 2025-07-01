import {
  authFailed,
  type ConventionDto,
  type FtConnectIdentity,
  isFtConnectIdentity,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";

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

    return isFtConnectIdentity(federatedIdentity) &&
      federatedIdentity.token !== authFailed
      ? this.#associateConventionToFederatedIdentity(
          convention,
          federatedIdentity,
          uow,
        )
      : uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "FederatedIdentityNotBoundToConvention",
            payload: { convention, triggeredBy: null },
          }),
        );
  }

  async #associateConventionToFederatedIdentity(
    convention: ConventionDto,
    federatedIdentity: FtConnectIdentity,
    uow: UnitOfWork,
  ): Promise<void> {
    try {
      await uow.conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
        convention.id,
        federatedIdentity.token,
      );
      await uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "FederatedIdentityBoundToConvention",
          payload: { convention, triggeredBy: null },
        }),
      );
    } catch (_error) {
      await uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "FederatedIdentityNotBoundToConvention",
          payload: { convention, triggeredBy: null },
        }),
      );
    }
  }
}
