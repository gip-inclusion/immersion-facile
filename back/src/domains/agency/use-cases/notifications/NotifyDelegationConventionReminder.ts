import { uniq } from "ramda";
import { errors, type TemplatedEmail } from "shared";
import { delegationConventionReminderPayloadSchema } from "../../../core/events/eventPayload.schema";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
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
            kind: "AGENCY_DELEGATION_CONVENTION_EXPIRED",
            params: {
              agencyName: agency.name,
              delegationAgencyName,
              delegationAgencyKind,
            },
            recipients,
          }
        : {
            kind: "AGENCY_DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind,
            },
            recipients,
          };

    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      followedIds: { agencyId: agency.id },
      templatedContent,
    });
  });
