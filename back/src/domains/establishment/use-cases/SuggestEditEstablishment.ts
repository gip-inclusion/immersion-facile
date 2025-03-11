import {
  type SiretDto,
  addressDtoToString,
  createEstablishmentJwtPayload,
  errors,
  immersionFacileNoReplyEmailSender,
  siretSchema,
} from "shared";
import { notifyErrorObjectToTeam } from "../../../utils/notifyTeam";
import { TransactionalUseCase } from "../../core/UseCase";
import type { GenerateEditFormEstablishmentJwt } from "../../core/jwt";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SuggestEditEstablishment extends TransactionalUseCase<SiretDto> {
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
    const adminIds = userRights
      .filter((userRight) => userRight.role === "establishment-admin")
      .map((right) => right.userId);
    const contactIds = userRights
      .filter((userRight) => userRight.role === "establishment-contact")
      .map((right) => right.userId);

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
        sender: immersionFacileNoReplyEmailSender,
        recipients: (await uow.userRepository.getByIds(adminIds)).map(
          ({ email }) => email,
        ),
        cc: (await uow.userRepository.getByIds(contactIds)).map(
          ({ email }) => email,
        ),
        params: {
          editFrontUrl: this.#generateEditFormEstablishmentUrl(
            createEstablishmentJwtPayload({
              siret,
              now: this.#timeGateway.now(),
              durationDays: 2,
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
    }).catch((error) => notifyErrorObjectToTeam(error));
  }
}
