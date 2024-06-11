import {
  EstablishmentDomainPayload,
  FormEstablishmentDto,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  formEstablishmentSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class EditFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  void,
  EstablishmentDomainPayload | InclusionConnectDomainJwtPayload
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
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
    jwtPayload?: EstablishmentDomainPayload | InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError("No JWT payload provided");

    if ("siret" in jwtPayload && jwtPayload.siret !== formEstablishment.siret)
      throw new ForbiddenError("Siret mismatch in JWT payload and form");

    const user = await this.#getUserIfExistAndAllowed(
      uow,
      jwtPayload,
      formEstablishment,
    );

    await Promise.all([
      uow.formEstablishmentRepository.update(formEstablishment),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "FormEstablishmentEdited",
          payload: {
            formEstablishment,
            triggeredBy: user
              ? {
                  kind: "inclusion-connected",
                  userId: user.id,
                }
              : {
                  kind: "establishment-magic-link",
                  siret: formEstablishment.siret,
                },
          },
        }),
      ),
    ]);
  }

  async #getUserIfExistAndAllowed(
    uow: UnitOfWork,
    jwtPayload: EstablishmentDomainPayload | InclusionConnectDomainJwtPayload,
    formEstablishment: FormEstablishmentDto,
  ) {
    if ("userId" in jwtPayload) {
      const user = await uow.inclusionConnectedUserRepository.getById(
        jwtPayload.userId,
      );
      if (!user)
        throw new NotFoundError(
          `User with id '${jwtPayload.userId}' not found`,
        );

      throwIfIcUserNotAllowed(user, formEstablishment);
      return user;
    }
  }
}

const throwIfIcUserNotAllowed = (
  user: InclusionConnectedUser,
  formEstablishment: FormEstablishmentDto,
) => {
  if (user.isBackofficeAdmin) return;
  if (user.email === formEstablishment.businessContact.email) return;
  throw new ForbiddenError();
};
