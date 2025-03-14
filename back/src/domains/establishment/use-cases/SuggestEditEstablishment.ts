import {
  type AbsoluteUrl,
  type SiretDto,
  addressDtoToString,
  createInclusionConnectJwtPayload,
  errors,
  immersionFacileNoReplyEmailSender,
  siretSchema,
} from "shared";
import { generateEditFormEstablishmentUrl } from "../../../config/bootstrap/magicLinkUrl";
import { notifyErrorObjectToTeam } from "../../../utils/notifyTeam";
import { TransactionalUseCase } from "../../core/UseCase";
import type { GenerateInclusionConnectJwt } from "../../core/jwt";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SuggestEditEstablishment extends TransactionalUseCase<
  SiretDto,
  void
> {
  protected inputSchema = siretSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #timeGateway: TimeGateway;

  readonly #generateInclusionConnectJwt: GenerateInclusionConnectJwt;

  readonly #immersionFacileBaseUrl: AbsoluteUrl;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    generateInclusionConnectJwt: GenerateInclusionConnectJwt,
    immersionFacileBaseUrl: AbsoluteUrl,
  ) {
    super(uowPerformer);

    this.#generateInclusionConnectJwt = generateInclusionConnectJwt;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;
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

    const admins = await uow.userRepository.getByIds(adminIds);

    await Promise.all(
      admins.map(async (user) =>
        this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
            sender: immersionFacileNoReplyEmailSender,
            recipients: [user.email],
            params: {
              editFrontUrl: generateEditFormEstablishmentUrl(
                this.#immersionFacileBaseUrl,
                this.#generateInclusionConnectJwt,
                createInclusionConnectJwtPayload({
                  userId: user.id,
                  now: this.#timeGateway.now(),
                  durationDays: 2,
                }),
              ),
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
        }).catch((error) => notifyErrorObjectToTeam(error)),
      ),
    );
  }
}
