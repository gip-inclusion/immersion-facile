import { uniq } from "ramda";
import {
  type AgencyId,
  type DelegationConventionReminderKind,
  type EmailType,
  errors,
  type TemplatedEmail,
} from "shared";
import { delegationConventionReminderPayloadSchema } from "../../../core/events/eventPayload.schema";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../../core/notifications/ports/NotificationRepository";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import { getUserIdsWithoutRoleFromAgencyRights } from "../../entities/Agency";

export type NotifyDelegationConventionReminder = ReturnType<
  typeof makeNotifyDelegationConventionReminder
>;

export const makeNotifyDelegationConventionReminder = useCaseBuilder(
  "NotifyDelegationConventionReminder",
)
  .withInput(delegationConventionReminderPayloadSchema)
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const { agencyId, reminderKind } = inputParams;
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });

    if (
      agency.kind !== "autre" ||
      agency.status !== "active" ||
      !agency.delegationAgencyInfo?.delegationEndDate ||
      !agency.delegationAgencyInfo?.delegationAgencyName
    )
      throw errors.agency.forbiddenDelegationConventionReminder({
        agencyId: agency.id,
      });

    const agencyUserWithValideRoleEmails = await uow.userRepository
      .getByIds(
        getUserIdsWithoutRoleFromAgencyRights({
          rights: agency.usersRights,
          excludedRole: "to-review",
        }),
      )
      .then((users) => users.map(({ email }) => email));

    const recipients = uniq([
      agency.contactEmail,
      ...agencyUserWithValideRoleEmails,
    ]);
    const { delegationEndDate, delegationAgencyName, delegationAgencyKind } =
      agency.delegationAgencyInfo;

    const templatedContent: TemplatedEmail =
      reminderKind === "dayAfterExpiry"
        ? {
            kind: "DELEGATION_CONVENTION_EXPIRED",
            params: {
              agencyName: agency.name,
              delegationAgencyName,
              delegationAgencyKind,
            },
            recipients,
          }
        : {
            kind: "DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind,
            },
            recipients,
          };

    if (
      await hasDelegationConventionReminderAlreadyBeenSent({
        notificationRepository: uow.notificationRepository,
        agencyId,
        emailType: templatedContent.kind,
        reminderKind,
      })
    )
      return;

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      followedIds: { agencyId: agency.id },
      templatedContent,
    });
  });

const hasDelegationConventionReminderAlreadyBeenSent = async ({
  notificationRepository,
  agencyId,
  emailType,
  reminderKind,
}: {
  notificationRepository: NotificationRepository;
  agencyId: AgencyId;
  emailType: EmailType;
  reminderKind: DelegationConventionReminderKind;
}): Promise<boolean> => {
  const emails = await notificationRepository.getEmailsByFilters({
    agencyId,
    emailType,
  });

  if (emails.length === 0) return false;

  if (emailType !== "DELEGATION_CONVENTION_EXPIRING_SOON") return true;

  return emails.some(
    (email) =>
      "reminderKind" in email.templatedContent.params &&
      email.templatedContent.params.reminderKind === reminderKind,
  );
};
