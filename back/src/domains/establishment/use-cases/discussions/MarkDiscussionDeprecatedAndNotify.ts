import {
  type DiscussionStatus,
  errors,
  frontRoutes,
  type WithDiscussionId,
  withDiscussionIdSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { SaveNotificationsBatchAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { createTransactionalUseCase } from "../../../core/UseCase";

export type MarkDiscussionDeprecatedAndNotify = ReturnType<
  typeof makeMarkDiscussionDeprecatedAndNotify
>;

export const makeMarkDiscussionDeprecatedAndNotify = createTransactionalUseCase<
  WithDiscussionId,
  void,
  void,
  {
    saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
    config: AppConfig;
  }
>(
  {
    name: "MarkDiscussionDeprecatedAndNotify",
    inputSchema: withDiscussionIdSchema,
  },
  async ({ inputParams: { discussionId }, uow, deps }) => {
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });
    const statusToMatch: DiscussionStatus = "PENDING";
    if (discussion.status !== statusToMatch)
      throw errors.discussion.badStatus({
        discussionId,
        status: statusToMatch,
      });
    await uow.discussionRepository.update({
      ...discussion,
      status: "REJECTED",
      rejectionKind: "DEPRECATED",
    });
    await deps.saveNotificationsBatchAndRelatedEvent(uow, [
      {
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_DEPRECATED_NOTIFICATION_ESTABLISHMENT",
          recipients: [discussion.establishmentContact.email],
          params: {
            beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
            beneficiaryLastName: discussion.potentialBeneficiary.lastName,
            businessName: discussion.businessName,
            ctaUrl: `${deps.config.immersionFacileBaseUrl}/${frontRoutes.establishmentDashboard}`,
            discussionCreatedAt: discussion.createdAt,
            establishmentContactFirstName:
              discussion.establishmentContact.firstName ?? "",
            establishmentContactLastName:
              discussion.establishmentContact.lastName ?? "",
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
            ctaUrl: `${deps.config.immersionFacileBaseUrl}/${frontRoutes.search}`,
            discussionCreatedAt: discussion.createdAt,
          },
        },
        followedIds: {
          establishmentSiret: discussion.siret,
        },
      },
    ]);
  },
);
