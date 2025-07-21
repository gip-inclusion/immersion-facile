import {
  type DiscussionStatus,
  errors,
  frontRoutes,
  withDiscussionIdSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { SaveNotificationsBatchAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type MarkDiscussionDeprecatedAndNotify = ReturnType<
  typeof makeMarkDiscussionDeprecatedAndNotify
>;

export const makeMarkDiscussionDeprecatedAndNotify = useCaseBuilder(
  "MarkDiscussionDeprecatedAndNotify",
)
  .withInput(withDiscussionIdSchema)
  .withDeps<{
    saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
    config: AppConfig;
  }>()
  .build(async ({ inputParams: { discussionId }, uow, deps }) => {
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });
    const statusToMatch: DiscussionStatus = "PENDING";
    if (discussion.status !== statusToMatch)
      throw errors.discussion.badStatus({
        discussionId,
        status: statusToMatch,
      });

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );

    if (!establishment)
      throw errors.establishment.notFound({ siret: discussion.siret });

    const recipients = (
      await uow.userRepository.getByIds(
        establishment.userRights
          .filter(
            ({ shouldReceiveDiscussionNotifications }) =>
              shouldReceiveDiscussionNotifications,
          )
          .map(({ userId }) => userId),
      )
    ).map(({ email }) => email);

    await Promise.all([
      uow.discussionRepository.update({
        ...discussion,
        status: "REJECTED",
        rejectionKind: "DEPRECATED",
      }),
      deps.saveNotificationsBatchAndRelatedEvent(uow, [
        {
          kind: "email",
          templatedContent: {
            kind: "DISCUSSION_DEPRECATED_NOTIFICATION_ESTABLISHMENT",
            recipients: recipients,
            params: {
              beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
              beneficiaryLastName: discussion.potentialBeneficiary.lastName,
              businessName: discussion.businessName,
              establishmentDashboardUrl: `${deps.config.immersionFacileBaseUrl}/${frontRoutes.establishmentDashboard}`,
              discussionCreatedAt: discussion.createdAt,
            },
          },
          followedIds: {
            establishmentSiret: discussion.siret,
          },
        },
        {
          kind: "email",
          templatedContent: {
            kind: "DISCUSSION_DEPRECATED_NOTIFICATION_BENEFICIARY",
            recipients: [discussion.potentialBeneficiary.email],
            params: {
              beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
              beneficiaryLastName: discussion.potentialBeneficiary.lastName,
              businessName: discussion.businessName,
              searchPageUrl: `${deps.config.immersionFacileBaseUrl}/${frontRoutes.search}`,
              discussionCreatedAt: discussion.createdAt,
            },
          },
          followedIds: {
            establishmentSiret: discussion.siret,
          },
        },
      ]),
    ]);
  });
