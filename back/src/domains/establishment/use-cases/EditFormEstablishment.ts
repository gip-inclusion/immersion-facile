import {
  BackOfficeDomainPayload,
  EstablishmentDomainPayload,
  FormEstablishmentDto,
  InclusionConnectJwtPayload,
  formEstablishmentSchema,
  isBackOfficeJwtPayload,
  isEstablishmentJwtPayload,
  isInclusionConnectJwtPayload,
} from "shared";
import { ForbiddenError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class EditFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  void,
  | EstablishmentDomainPayload
  | BackOfficeDomainPayload
  | InclusionConnectJwtPayload
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
    jwtPayload?:
      | EstablishmentDomainPayload
      | BackOfficeDomainPayload
      | InclusionConnectJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError();
    if (
      !isInclusionConnectJwtPayload(jwtPayload) &&
      !isBackOfficeJwtPayload(jwtPayload) &&
      !isEstablishmentJwtPayload(jwtPayload)
    )
      throw new ForbiddenError();
    if ("siret" in jwtPayload && jwtPayload.siret !== dto.siret)
      throw new ForbiddenError();
    if ("userId" in jwtPayload) {
      const user = await uow.inclusionConnectedUserRepository.getById(
        jwtPayload.userId,
      );
      if (user?.email !== dto.businessContact.email) throw new ForbiddenError();
    }

    await Promise.all([
      uow.formEstablishmentRepository.update(dto),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "FormEstablishmentEdited",
          payload: { formEstablishment: dto },
        }),
      ),
    ]);
  }
}
