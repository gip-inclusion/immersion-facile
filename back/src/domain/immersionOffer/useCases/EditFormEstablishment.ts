import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { formEstablishmentSchema } from "shared/src/formEstablishment/FormEstablishment.schema";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class EditFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  void,
  EstablishmentJwtPayload
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
    { siret }: EstablishmentJwtPayload,
  ): Promise<void> {
    if (siret !== dto.siret) throw new ForbiddenError();

    const event = this.createNewEvent({
      topic: "FormEstablishmentEdited",
      payload: dto,
    });

    await Promise.all([
      uow.formEstablishmentRepo.update(dto),
      uow.outboxRepo.save(event),
    ]);
  }
}
