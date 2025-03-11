import {
  type SiretDto,
  addressDtoToString,
  createEstablishmentJwtPayload,
  errors,
  siretSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { GenerateEditFormEstablishmentJwt } from "../../core/jwt";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class RequestEditFormEstablishment extends TransactionalUseCase<SiretDto> {
  protected inputSchema = siretSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #timeGateway: TimeGateway;

  readonly #generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentJwt;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentJwt,
  ) {
    super(uowPerformer);

    this.#generateEditFormEstablishmentUrl = generateEditFormEstablishmentUrl;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(siret: SiretDto, uow: UnitOfWork) {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    const { userRights, establishment } = establishmentAggregate;

    const establishmentAdmins = await uow.userRepository.getByIds(
      userRights
        .filter((right) => right.role === "establishment-admin")
        .map((right) => right.userId),
    );

    const establishmentContacts = await uow.userRepository.getByIds(
      userRights
        .filter((right) => right.role === "establishment-contact")
        .map((right) => right.userId),
    );

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "EDIT_FORM_ESTABLISHMENT_LINK",
        recipients: establishmentAdmins.map(({ email }) => email),
        cc: establishmentContacts.map(({ email }) => email),
        params: {
          editFrontUrl: this.#generateEditFormEstablishmentUrl(
            createEstablishmentJwtPayload({
              siret,
              now: this.#timeGateway.now(),
              durationDays: 1,
            }),
          ),
          businessName: establishment.customizedName ?? establishment.name,
          businessAddresses: establishment.locations.map((addressAndPosition) =>
            addressDtoToString(addressAndPosition.address),
          ),
        },
      },
      followedIds: {
        establishmentSiret: siret,
      },
    });
  }
}
