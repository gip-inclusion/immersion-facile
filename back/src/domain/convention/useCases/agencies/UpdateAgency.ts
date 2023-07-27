import { AgencyDto, agencySchema } from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export class UpdateAgency extends TransactionalUseCase<AgencyDto> {
  inputSchema = agencySchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(agency: AgencyDto, uow: UnitOfWork): Promise<void> {
    await uow.agencyRepository.update(agency).catch((error) => {
      if (error.message === `Agency ${agency.id} does not exist`) {
        throw new NotFoundError(`No agency found with id : ${agency.id}`);
      }
      throw error;
    });

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "AgencyUpdated",
        payload: { agency },
      }),
    );
  }
}
