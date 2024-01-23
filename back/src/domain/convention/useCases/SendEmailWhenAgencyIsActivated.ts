import { z } from "zod";
import { AgencyDto, agencySchema } from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

type WithAgency = { agency: AgencyDto };

export class SendEmailWhenAgencyIsActivated extends TransactionalUseCase<WithAgency> {
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
    { agency }: WithAgency,
    uow: UnitOfWork,
  ): Promise<void> {
    const refersToOtherAgencyParams = agency.refersToAgencyId
      ? {
          refersToOtherAgency: true as const,
          validatorEmails: agency.validatorEmails,
        }
      : { refersToOtherAgency: false as const };

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_WAS_ACTIVATED",
        recipients: agency.validatorEmails,
        params: {
          agencyName: agency.name,
          agencyLogoUrl: agency.logoUrl ?? undefined,
          ...refersToOtherAgencyParams,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    });
  }
}
