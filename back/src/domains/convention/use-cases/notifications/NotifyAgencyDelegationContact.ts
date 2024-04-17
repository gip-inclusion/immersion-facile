import {
  TallyForm,
  TemplatedEmail,
  getTallyFormValueOf,
  tallyFormSchema,
} from "shared";
import { BadRequestError } from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyAgencyDelegationContact extends TransactionalUseCase<TallyForm> {
  protected inputSchema = tallyFormSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    tallyForm: TallyForm,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: await this.#prepareEmail(tallyForm),
      followedIds: {},
    });
  }

  async #prepareEmail(tallyForm: TallyForm): Promise<TemplatedEmail> {
    return {
      kind: "AGENCY_DELEGATION_CONTACT_INFORMATION",
      recipients: [getTallyFormValueOrThrow(tallyForm, "Email")],
      params: {
        firstName: getTallyFormValueOrThrow(tallyForm, "Nom"),
        lastName: getTallyFormValueOrThrow(tallyForm, "Prénom"),
        agencyName: getTallyFormValueOrThrow(
          tallyForm,
          "Nom de la structure qui souhaite une convention de délégation",
        ),
        agencyProvince: getTallyFormValueOrThrow(
          tallyForm,
          "Région de la structure qui souhaite une convention de délégation",
        ),
        delegationProviderMail:
          delegationContactEmailByProvince[
            getTallyFormValueOrThrow(
              tallyForm,
              "Région de la structure qui souhaite une convention de délégation",
            )
          ],
      },
    };
  }
}

const getTallyFormValueOrThrow = (tallyForm: TallyForm, label: string) => {
  const value = getTallyFormValueOf(tallyForm, label);
  if (!value) throw new BadRequestError(`No value found for label "${label}"`);
  return value;
};

export const delegationContactEmailByProvince: Record<string, string> = {};
