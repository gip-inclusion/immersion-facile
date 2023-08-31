import {
  BackOfficeDomainPayload,
  EstablishmentDomainPayload,
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
  EstablishmentDomainPayload | BackOfficeDomainPayload
> {
  protected inputSchema = formEstablishmentSchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    dto: FormEstablishmentDto,
    uow: UnitOfWork,
    jwtPayload?: EstablishmentDomainPayload | BackOfficeDomainPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError();
    if ("siret" in jwtPayload && jwtPayload.siret !== dto.siret)
      throw new ForbiddenError();

    await Promise.all([
      uow.formEstablishmentRepository.update(dto),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "FormEstablishmentEdited",
          payload: dto,
        }),
      ),
    ]);
  }
}
