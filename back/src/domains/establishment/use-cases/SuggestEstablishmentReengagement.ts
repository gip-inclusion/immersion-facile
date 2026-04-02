import {
  errors,
  immersionFacileNoReplyEmailSender,
  onlyAdminUserRightsWithStatusAccepted,
  type SiretDto,
  siretSchema,
} from "shared";
import { notifyErrorObjectToTeam } from "../../../utils/notifyTeam";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SuggestEstablishmentReengagement extends TransactionalUseCase<
  SiretDto,
  void
> {
  protected inputSchema = siretSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(siret: SiretDto, uow: UnitOfWork) {
    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    const { userRights, establishment } = establishmentAggregate;
    const adminIds = userRights
      .filter(onlyAdminUserRightsWithStatusAccepted)
      .map((right) => right.userId);

    const admins = await uow.userRepository.getByIds(adminIds);

    await Promise.all(
      admins.map(async (user) =>
        this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_REENGAGEMENT_SUGGESTION",
            sender: immersionFacileNoReplyEmailSender,
            recipients: [user.email],
            params: {
              businessName: establishment.customizedName ?? establishment.name,
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
