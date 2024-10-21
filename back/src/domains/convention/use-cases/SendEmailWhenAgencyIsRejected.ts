import { WithAgencyId, errors, withAgencyIdSchema } from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class SendEmailWhenAgencyIsRejected extends TransactionalUseCase<WithAgencyId> {
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
    if (!agency.rejectionJustification)
      throw errors.agency.notRejected({ agencyId });
    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_WAS_REJECTED",
        recipients: agency.validatorEmails,
        params: {
          agencyName: agency.name,
          rejectionJustification: agency.rejectionJustification,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  }
}
