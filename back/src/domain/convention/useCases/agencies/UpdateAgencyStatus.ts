import { UpdateAgencyRequestDto, updateAgencyRequestSchema } from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { throwConflictErrorOnSimilarAgencyFound } from "../../entities/Agency";

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

    await throwConflictErrorOnSimilarAgencyFound({
      uow,
      agency: existingAgency,
    });

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
