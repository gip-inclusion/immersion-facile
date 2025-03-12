import {
  type TallyForm,
  type TemplatedEmail,
  errors,
  getTallyFormValueOf,
  tallyFormSchema,
} from "shared";
import type { DelegationContactRepository } from "../../../agency/ports/DelegationContactRepository";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyAgencyDelegationContact extends TransactionalUseCase<TallyForm> {
  protected inputSchema = tallyFormSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    tallyForm: TallyForm,
    uow: UnitOfWork,
  ): Promise<void> {
    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: await this.#prepareEmail(
        uow.delegationContactRepository,
        tallyForm,
      ),
      followedIds: {},
    });
  }

  async #prepareEmail(
    delegationContactRepository: DelegationContactRepository,
    tallyForm: TallyForm,
  ): Promise<TemplatedEmail> {
    const province = getTallyFormValueOrThrow(
      tallyForm,
      "Région de la structure qui souhaite une convention de délégation",
    );
    const delegationEmail =
      await delegationContactRepository.getEmailByProvince(province);

    if (!delegationEmail) throw errors.delegation.missingEmail({ province });

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
        delegationProviderMail: delegationEmail,
      },
    };
  }
}

const getTallyFormValueOrThrow = (tallyForm: TallyForm, label: string) => {
  const value = getTallyFormValueOf(tallyForm, label);
  if (!value) throw errors.delegation.missingLabel({ label });
  return value;
};
