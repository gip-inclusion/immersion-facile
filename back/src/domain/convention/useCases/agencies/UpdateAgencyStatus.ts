import { UpdateAgencyRequestDto, updateAgencyRequestSchema } from "shared";
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
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = updateAgencyRequestSchema;

  public async _execute(
    { status, id }: UpdateAgencyRequestDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (status) await uow.agencyRepository.update({ id, status });
    if (status === "active") {
      const [agency] = await uow.agencyRepository.getByIds([id]);
      if (agency)
        await uow.outboxRepository.save(
          this.createNewEvent({
            topic: "AgencyActivated",
            payload: { agency },
          }),
        );
    }
  }
}
