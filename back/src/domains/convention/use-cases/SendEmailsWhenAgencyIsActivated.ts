import {
  AgencyDto,
  agencySchema,
  getCounsellorsAndValidatorsEmailsDeduplicated,
} from "shared";
import { z } from "zod";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type WithAgency = { agency: AgencyDto };

export class SendEmailsWhenAgencyIsActivated extends TransactionalUseCase<WithAgency> {
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
        recipients: agency.refersToAgencyId
          ? agency.counsellorEmails
          : getCounsellorsAndValidatorsEmailsDeduplicated(agency),
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

    if (agency.refersToAgencyId) {
      const agencyReferredTo = await uow.agencyRepository.getById(
        agency.refersToAgencyId,
      );
      if (!agencyReferredTo)
        throw new NotFoundError(
          `No agency were found with id : ${agency.refersToAgencyId}`,
        );
      this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "AGENCY_WITH_REFERS_TO_ACTIVATED",
          recipients: agencyReferredTo.validatorEmails,
          params: {
            nameOfAgencyRefering: agency.name,
            agencyLogoUrl: agencyReferredTo.logoUrl ?? undefined,
            refersToAgencyName: agencyReferredTo.name,
            validatorEmails: agencyReferredTo.validatorEmails,
          },
        },
        followedIds: {
          agencyId: agency.id,
        },
      });
    }
  }
}
