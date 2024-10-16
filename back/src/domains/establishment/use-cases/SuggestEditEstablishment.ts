import {
  SiretDto,
  addressDtoToString,
  createEstablishmentJwtPayload,
  immersionFacileNoReplyEmailSender,
  siretSchema,
} from "shared";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { TransactionalUseCase } from "../../core/UseCase";
import { GenerateEditFormEstablishmentJwt } from "../../core/jwt";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
    if (!establishmentAggregate) throw Error("Etablissement introuvable.");

    const { contact, establishment } = establishmentAggregate;

    if (!contact)
      throw Error(`Email du contact introuvable, pour le siret : ${siret}`);

    const now = this.#timeGateway.now();

    const payload = createEstablishmentJwtPayload({
      siret,
      now,
      durationDays: 2,
    });
    const editFrontUrl = this.#generateEditFormEstablishmentUrl(payload);

    try {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          sender: immersionFacileNoReplyEmailSender,
          recipients: [contact.email],
          cc: contact.copyEmails,
          params: {
            editFrontUrl,
            businessName: establishment.customizedName ?? establishment.name,
            businessAddresses: establishment.locations.map(
              (addressAndPosition) =>
                addressDtoToString(addressAndPosition.address),
            ),
          },
        },
        followedIds: {
          establishmentSiret: siret,
        },
      });
    } catch (error) {
      notifyObjectDiscord(error);
    }
  }
}
