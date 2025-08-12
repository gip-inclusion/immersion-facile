import { addDays } from "date-fns";
import {
  createOpaqueEmail,
  type DateRange,
  type DiscussionDto,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  isTruthy,
  localization,
} from "shared";
import { z } from "zod/v4";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { getNotifiedUsersFromEstablishmentUserRights } from "../helpers/businessContact.helpers";

export type ContactRequestReminderMode = "3days" | "7days";
export type ContactRequestReminder = ReturnType<
  typeof makeContactRequestReminder
>;

const MAX_DISCUSSIONS = 5000;

export const makeContactRequestReminder = useCaseBuilder(
  "ContactRequestReminder",
)
  .withInput<ContactRequestReminderMode>(
    z.enum(["3days", "7days"], {
      error: localization.invalidEnum,
    }),
  )
  .withOutput<{ numberOfNotifications: number }>()
  .withCurrentUser<void>()
  .withDeps<{
    domain: string;
    timeGateway: TimeGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ inputParams: mode, uow, deps }) =>
    uow.discussionRepository
      .getDiscussions({
        filters: {
          status: "PENDING",
          contactMode: "EMAIL",
          answeredByEstablishment: false,
          createdBetween: makeCreatedBetweenDateRange(
            deps.timeGateway.now(),
            mode,
          ),
        },
        limit: MAX_DISCUSSIONS,
      })
      .then((discussions) =>
        Promise.all(
          discussions.map((discussion) =>
            makeNotification({ uow, discussion, mode, domain: deps.domain }),
          ),
        ),
      )
      .then(async (maybeNotifications) => {
        const notifications = maybeNotifications.filter(isTruthy);

        await Promise.all(
          notifications.map((notification) =>
            deps.saveNotificationAndRelatedEvent(uow, notification),
          ),
        );

        return { numberOfNotifications: notifications.length };
      }),
  );

const makeNotification = async ({
  uow,
  domain,
  mode,
  discussion,
}: {
  uow: UnitOfWork;
  domain: string;
  mode: ContactRequestReminderMode;
  discussion: DiscussionDto;
}): Promise<NotificationContentAndFollowedIds | null> => {
  const establishment =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      discussion.siret,
    );
  if (!establishment) return null;

  const appellations =
    await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
      [discussion.appellationCode],
    );

  const appellation = appellations.at(0);
  const replyTo = createOpaqueEmail({
    discussionId: discussion.id,
    recipient: {
      kind: "potentialBeneficiary",
      firstname: discussion.potentialBeneficiary.firstName,
      lastname: discussion.potentialBeneficiary.lastName,
    },
    replyDomain: `reply.${domain}`,
  });

  const usersToContact = await getNotifiedUsersFromEstablishmentUserRights(
    uow,
    establishment.userRights,
  );

  return appellation
    ? ({
        followedIds: { establishmentSiret: discussion.siret },
        kind: "email",
        templatedContent: {
          kind: "ESTABLISHMENT_CONTACT_REQUEST_REMINDER",
          sender: immersionFacileNoReplyEmailSender,
          recipients: usersToContact.map(({ email }) => email),
          replyTo: {
            email: replyTo,
            name: getFormattedFirstnameAndLastname({
              firstname: discussion.potentialBeneficiary.firstName,
              lastname: discussion.potentialBeneficiary.lastName,
            }),
          },
          params: {
            appellationLabel: appellation.appellationLabel,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: discussion.potentialBeneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: discussion.potentialBeneficiary.lastName,
            }),
            beneficiaryReplyToEmail: replyTo,
            domain,
            mode,
          },
        },
      } satisfies NotificationContentAndFollowedIds)
    : null;
};

const makeCreatedBetweenDateRange = (
  now: Date,
  mode: ContactRequestReminderMode,
): DateRange => ({
  from: addDays(now, mode === "3days" ? -4 : -8),
  to: addDays(now, mode === "3days" ? -3 : -7),
});
