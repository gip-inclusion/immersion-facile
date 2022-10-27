import { AgencyDto, agencySchema } from "shared";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class UpdateAgencyAdmin extends TransactionalUseCase<AgencyDto, void> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = agencySchema;

  public async _execute(_agency: AgencyDto, _uow: UnitOfWork): Promise<void> {
    // TODO
    // if (status) await uow.agencyRepository.update({ id, status });
    // if (status === "active") {
    //   const agency = await uow.agencyRepository.getById(id);
    //   if (agency)
    //     await uow.outboxRepository.save(
    //       this.createNewEvent({
    //         topic: "AgencyActivated",
    //         payload: { agency },
    //       }),
    //     );
    // }
  }
}
