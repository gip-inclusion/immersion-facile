import {
  EstablishmentDomainPayload,
  FormEstablishmentDto,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  errors,
  formEstablishmentSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
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
    if (!jwtPayload) throw errors.user.noJwtProvided();

    if ("siret" in jwtPayload && jwtPayload.siret !== formEstablishment.siret)
      throw errors.establishment.siretMismatch();

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
      const user = await uow.userRepository.getById(
        jwtPayload.userId,
        oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
      );
      if (!user) throw errors.user.notFound({ userId: jwtPayload.userId });

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
  throw errors.user.forbidden({ userId: user.id });
};
