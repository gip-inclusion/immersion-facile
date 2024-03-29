import { AgencyDto, agencySchema } from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type WithAgency = { agency: AgencyDto };

export class SendEmailWhenAgencyIsRejected extends TransactionalUseCase<WithAgency> {
  protected inputSchema = z.object({ agency: agencySchema });

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { agency }: WithAgency & { agency: { rejectionJustification: string } },
    uow: UnitOfWork,
  ): Promise<void> {
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
