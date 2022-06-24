import { UpdateAgencyRequestDto } from "shared/src/agency/agency.dto";
import { updateAgencyRequestSchema } from "shared/src/agency/agency.schema";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class UpdateAgency extends TransactionalUseCase<
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
    if (status) await uow.agencyRepo.update({ id, status });
    if (status === "active") {
      const agencyDto = await uow.agencyRepo.getById(id);
      if (agencyDto)
        await uow.outboxRepo.save(
          this.createNewEvent({
            topic: "AgencyActivated",
            payload: agencyDto,
          }),
        );
    }
  }
}
