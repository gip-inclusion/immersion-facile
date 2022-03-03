import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class EditFormEstablishment extends TransactionalUseCase<FormEstablishmentDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    dto: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    await uow.formEstablishmentRepo.edit(dto);

    const event = this.createNewEvent({
      topic: "FormEstablishmentEdited",
      payload: dto,
    });

    await uow.outboxRepo.save(event);
  }
}
