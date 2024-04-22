import {
  AgencyDto,
  agencySchema,
  getCounsellorsAndValidatorsEmailsDeduplicated,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type WithAgency = { agency: AgencyDto };

export class SendEmailWhenNewAgencyOfTypeOtherAdded extends TransactionalUseCase<WithAgency> {
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
