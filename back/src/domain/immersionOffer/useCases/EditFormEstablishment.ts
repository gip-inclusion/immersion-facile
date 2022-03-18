import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { EstablishmentPayload } from "../../../shared/tokens/MagicLinkPayload";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class EditFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  void,
  EstablishmentPayload
> {
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
    { siret }: EstablishmentPayload,
  ): Promise<void> {
    if (siret !== dto.siret) throw new ForbiddenError();

    await uow.formEstablishmentRepo.edit(dto);

    const event = this.createNewEvent({
      topic: "FormEstablishmentEdited",
      payload: dto,
    });

    await uow.outboxRepo.save(event);
  }
}
