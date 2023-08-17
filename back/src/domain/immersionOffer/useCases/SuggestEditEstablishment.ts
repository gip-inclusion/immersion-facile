import {
  addressDtoToString,
  createEstablishmentMagicLinkPayload,
  SiretDto,
  siretSchema,
} from "shared";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { GenerateEditFormEstablishmentJwt } from "../../auth/jwt";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

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

    const payload = createEstablishmentMagicLinkPayload({
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
          recipients: [contact.email],
          cc: contact.copyEmails,
          params: {
            editFrontUrl,
            businessName: establishment.customizedName ?? establishment.name,
            businessAddress: addressDtoToString(establishment.address),
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
