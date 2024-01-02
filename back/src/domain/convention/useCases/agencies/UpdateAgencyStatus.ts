import { UpdateAgencyRequestDto, updateAgencyRequestSchema } from "shared";
import {
  ConflictError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export class UpdateAgencyStatus extends TransactionalUseCase<
  UpdateAgencyRequestDto,
  void
> {
  protected inputSchema = updateAgencyRequestSchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    { status, id }: UpdateAgencyRequestDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const existingAgency = await uow.agencyRepository.getById(id);
    if (!existingAgency)
      throw new NotFoundError(`No agency found with id ${id}`);

    const hasSimilarAgency =
      await uow.agencyRepository.alreadyHasActiveAgencyWithSameAddressAndKind({
        address: existingAgency.address,
        kind: existingAgency.kind,
        idToIgnore: existingAgency.id,
      });

    if (hasSimilarAgency)
      throw new ConflictError(
        "An other agency exists with the same address and kind",
      );

    if (status) await uow.agencyRepository.update({ id, status });

    if (status === "active") {
      await uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "AgencyActivated",
          payload: { agency: { ...existingAgency, status } },
        }),
      );
    }
  }
}
