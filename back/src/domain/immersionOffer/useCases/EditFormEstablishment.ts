import {
  EstablishmentJwtPayload,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class EditFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  void,
  EstablishmentJwtPayload
> {
  inputSchema = formEstablishmentSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    dto: FormEstablishmentDto,
    uow: UnitOfWork,
    { siret }: EstablishmentJwtPayload,
  ): Promise<void> {
    if (siret !== dto.siret) throw new ForbiddenError();

    const event = this.createNewEvent({
      topic: "FormEstablishmentEdited",
      payload: dto,
    });

    await Promise.all([
      uow.formEstablishmentRepository.update(dto),
      uow.outboxRepository.save(event),
    ]);
  }
}
