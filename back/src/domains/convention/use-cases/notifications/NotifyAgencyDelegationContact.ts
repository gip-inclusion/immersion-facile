import {
  errors,
  getTallyFormValueOf,
  type TallyForm,
  type TemplatedEmail,
  tallyFormSchema,
} from "shared";
import type { DelegationContactRepository } from "../../../agency/ports/DelegationContactRepository";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type NotifyAgencyDelegationContact = ReturnType<
  typeof makeNotifyAgencyDelegationContact
>;

export const makeNotifyAgencyDelegationContact = useCaseBuilder(
  "NotifyAgencyDelegationContact",
)
  .withInput(tallyFormSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ inputParams, uow, deps }) =>
    prepareEmail({
      province: getTallyFormValueOrThrow(
        inputParams,
        "Région de la structure qui souhaite une convention de délégation",
      ),
      recipientEmail: getTallyFormValueOrThrow(inputParams, "Email"),
      delegationContactRepository: uow.delegationContactRepository,
    }).then(async (templatedContent) => {
      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent,
        followedIds: {},
      });
    }),
  );

const getTallyFormValueOrThrow = (tallyForm: TallyForm, label: string) => {
  const value = getTallyFormValueOf(tallyForm, label);
  if (!value) throw errors.delegation.missingLabel({ label });
  return value;
};

const prepareEmail = async ({
  province,
  recipientEmail,
  delegationContactRepository,
}: {
  province: string;
  recipientEmail: string;
  delegationContactRepository: DelegationContactRepository;
}): Promise<TemplatedEmail> => {
  const delegationEmail =
    await delegationContactRepository.getEmailByProvince(province);

  if (!delegationEmail) throw errors.delegation.missingEmail({ province });

  return {
    kind: "AGENCY_DELEGATION_CONTACT_INFORMATION",
    recipients: [recipientEmail],
    params: {
      delegationProviderMail: delegationEmail,
    },
  };
};
