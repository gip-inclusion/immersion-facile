import {
  type ContactEstablishmentEventPayload,
  contactEstablishmentEventPayloadSchema,
  errors,
} from "shared";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";

export type NotifyCandidateThatContactRequestHasBeenSent = ReturnType<
  typeof makeNotifyCandidateThatContactRequestHasBeenSent
>;
export const makeNotifyCandidateThatContactRequestHasBeenSent =
  createTransactionalUseCase<
    ContactEstablishmentEventPayload,
    void,
    void,
    { saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent }
  >(
    {
      name: "NotifyBeneficiaryThatContactRequestHasBeenSent",
      inputSchema: contactEstablishmentEventPayloadSchema,
    },
    async ({ inputParams, uow, deps: { saveNotificationAndRelatedEvent } }) => {
      const discussion = await uow.discussionRepository.getById(
        inputParams.discussionId,
      );

      if (!discussion)
        throw errors.discussion.notFound({
          discussionId: inputParams.discussionId,
        });

      if (discussion.contactMode !== "EMAIL") return;

      await saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "CONTACT_BY_EMAIL_CANDIDATE_CONFIRMATION",
          recipients: [discussion.potentialBeneficiary.email],
          params: {
            kind: discussion.kind,
            businessName: discussion.businessName,
            beneficiaryFullName: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
          },
        },
        followedIds: {
          establishmentSiret: discussion.siret,
        },
      });
    },
  );
