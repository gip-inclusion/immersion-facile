import {
  WithAgencyId,
  errors,
  getCounsellorsAndValidatorsEmailsDeduplicated,
  withAgencyIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SendEmailWhenNewAgencyOfTypeOtherAdded extends TransactionalUseCase<WithAgencyId> {
  protected inputSchema = withAgencyIdSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { agencyId }: WithAgencyId,
    uow: UnitOfWork,
  ): Promise<void> {
    const agencyWithRights = await uow.agencyRepository.getById(agencyId);
    if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
    if (agency.refersToAgencyId) return;
    if (agency.kind !== "autre") return;

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_OF_TYPE_OTHER_ADDED",
        recipients: getCounsellorsAndValidatorsEmailsDeduplicated(agency),
        params: {
          agencyName: agency.name,
          agencyLogoUrl: agency.logoUrl ?? undefined,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  }
}
