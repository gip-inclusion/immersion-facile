import {
  type AddConventionInput,
  addConventionInputSchema,
  type ConventionStatus,
  errors,
  type WithConventionIdLegacy,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { rejectsSiretIfNotAnOpenCompany } from "../../core/sirene/helpers/rejectsSiretIfNotAnOpenCompany";
import type { SiretGateway } from "../../core/sirene/ports/SiretGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class AddConvention extends TransactionalUseCase<
  AddConventionInput,
  WithConventionIdLegacy
> {
  protected inputSchema = addConventionInputSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #siretGateway: SiretGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    siretGateway: SiretGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#siretGateway = siretGateway;
  }

  protected async _execute(
    { convention, discussionId }: AddConventionInput,
    uow: UnitOfWork,
  ): Promise<WithConventionIdLegacy> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (convention.status !== minimalValidStatus) {
      throw errors.convention.forbiddenStatus({
        status: convention.status,
      });
    }

    await rejectsSiretIfNotAnOpenCompany(this.#siretGateway, convention.siret);

    await uow.conventionRepository.save(convention);
    await uow.conventionExternalIdRepository.save(convention.id);

    const event = this.#createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      payload: {
        convention,
        triggeredBy: null,
        ...(discussionId ? { discussionId } : {}),
      },
    });

    await uow.outboxRepository.save(event);

    return { id: convention.id };
  }
}
