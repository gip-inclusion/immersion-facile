import { identity } from "ramda";
import {
  type AbsoluteUrl,
  type EstablishmentDashboardTab,
  type SiretDto,
  addressDtoToString,
  errors,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
  siretSchema,
} from "shared";
import { notifyErrorObjectToTeam } from "../../../utils/notifyTeam";
import { TransactionalUseCase } from "../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SuggestEditEstablishment extends TransactionalUseCase<
  SiretDto,
  void
> {
  protected inputSchema = siretSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #immersionFacileBaseUrl: AbsoluteUrl;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    immersionFacileBaseUrl: AbsoluteUrl,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
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
              editFrontUrl: `${this.#immersionFacileBaseUrl}/${
                frontRoutes.establishmentDashboard
              }/${identity<EstablishmentDashboardTab>("fiche-entreprise")}?siret=${siret}`,
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
