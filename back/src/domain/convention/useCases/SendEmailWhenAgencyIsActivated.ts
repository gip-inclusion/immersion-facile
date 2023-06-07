import { z } from "zod";
import { AgencyDto, agencySchema } from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

type WithAgency = { agency: AgencyDto };

export class SendEmailWhenAgencyIsActivated extends TransactionalUseCase<WithAgency> {
  inputSchema = z.object({ agency: agencySchema });

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    { agency }: WithAgency,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        type: "AGENCY_WAS_ACTIVATED",
        recipients: agency.validatorEmails,
        params: {
          agencyName: agency.name,
          agencyLogoUrl: agency.logoUrl,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  }
}
