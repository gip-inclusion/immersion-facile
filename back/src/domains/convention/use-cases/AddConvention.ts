import {
  AddConventionInput,
  ConventionStatus,
  WithConventionIdLegacy,
  addConventionInputSchema,
  errorMessages,
} from "shared";
import { ForbiddenError } from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { rejectsSiretIfNotAnOpenCompany } from "../../core/sirene/helpers/rejectsSiretIfNotAnOpenCompany";
import { SiretGateway } from "../../core/sirene/ports/SirenGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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

    if (
      convention.status !== "DRAFT" &&
      convention.status !== minimalValidStatus
    ) {
      throw new ForbiddenError(
        errorMessages.convention.forbiddenStatus({ status: convention.status }),
      );
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
